// Local mock of the serverless API so the UI can be exercised without Twilio.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PUBLIC = new URL('../public/', import.meta.url).pathname;
const PASS = 'test-passcode';

const optOuts = { '+19375550188': { at: new Date(Date.now() - 3600e3).toISOString(), reason: 'Replied "STOP"' } };
const messages = [
  { id: 'm1', at: new Date(Date.now() - 240e3).toISOString(), from: '+19375550142', to: '+19375550100', body: 'Thanks, I will be there Tuesday at 4.', action: 'received', read: false },
  { id: 'm2', at: new Date(Date.now() - 1800e3).toISOString(), from: '+19375550198', to: '+19375550100', body: 'Can we move it to next week?', action: 'received', read: false },
  { id: 'm3', at: new Date(Date.now() - 3600e3).toISOString(), from: '+19375550188', to: '+19375550100', body: 'STOP', action: 'opted_out', read: true },
];
const log = [
  { at: new Date(Date.now() - 7200e3).toISOString(), mode: 'broadcast', preview: 'Miami Valley Recovery: our Monday sched…', segments: 1, counts: { sent: 48, failed: 1, skipped: 3 } },
  { at: new Date(Date.now() - 86400e3).toISOString(), mode: 'individual', preview: 'Hi Jordan, please call the office when…', segments: 1, counts: { sent: 1, failed: 0, skipped: 0 } },
];

const json = (res, body, status = 200) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname.startsWith('/api/')) {
    if (req.headers['x-app-passcode'] !== PASS) return json(res, { error: 'Incorrect passcode.' }, 401);

    if (url.pathname === '/api/messages') {
      return json(res, { ok: true, fetchedAt: new Date().toISOString(), messages, optOuts, log, optOutError: null });
    }
    if (url.pathname === '/api/diag') {
      return json(res, {
        ok: false,
        webhookUrl: 'https://mvr-text.netlify.app/api/inbound',
        signatureCheckDisabled: false,
        checks: [
          { name: 'Twilio connection', ok: false, pending: true, detail: 'Not connected yet. Once your 10DLC registration is approved, add these in Netlify > Project configuration > Environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN' },
          { name: 'Storage (opt-outs, inbox, log)', ok: true, detail: 'Read and write both working.' },
          { name: 'Twilio credentials', ok: true, detail: 'Connected to "Miami Valley Recovery" (status: active).' },
          { name: 'Sending number', ok: true, detail: '+19375550100 is on this account. SMS inbound webhook: https://mvr-text.netlify.app/api/inbound' },
        ],
      });
    }
    if (url.pathname === '/api/send') {
      let body = '';
      for await (const chunk of req) body += chunk;
      const p = JSON.parse(body);
      return json(res, {
        ok: true, mode: p.mode, batchIndex: p.batchIndex, segments: 1, encoding: 'GSM-7',
        sent: p.recipients.map((r) => ({ ...r, sid: 'SM' + Math.random().toString(36).slice(2) })),
        failed: [], skipped: [],
      });
    }
    if (url.pathname === '/api/optout') {
      let body = '';
      for await (const chunk of req) body += chunk;
      const p = JSON.parse(body);
      if (p.action === 'add') optOuts[p.phone] = { at: new Date().toISOString(), reason: p.reason };
      else delete optOuts[p.phone];
      return json(res, { ok: true, optOuts });
    }
    return json(res, { error: 'Not found' }, 404);
  }

  const file = path.join(PUBLIC, url.pathname === '/' ? 'index.html' : url.pathname);
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    res.writeHead(200, { 'content-type': file.endsWith('.html') ? 'text/html' : 'text/plain' });
    return res.end(fs.readFileSync(file));
  }
  res.writeHead(404); res.end('not found');
});

server.listen(8787, () => console.log('mock server on http://localhost:8787'));
