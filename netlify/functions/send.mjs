import {
  json, requirePasscode, missingTwilioConfig, toE164, twilioSend,
  getOptOuts, appendLog, segmentInfo, guard,
} from './lib/shared.mjs';

// Netlify's synchronous functions time out at 10s, so the browser sends a
// broadcast in small batches and shows progress. This is the per-call cap.
export const MAX_PER_CALL = 20;
const CONCURRENCY = 5;

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

const handler = async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const denied = requirePasscode(req);
  if (denied) return denied;

  const missing = missingTwilioConfig();
  if (missing.length) {
    return json({ error: `Twilio is not configured. Missing: ${missing.join(', ')}` }, 500);
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Body must be JSON.' }, 400);
  }

  const { mode = 'individual', recipients = [], body = '', batchIndex = 0, campaignId = null } = payload;

  const text = String(body || '').trim();
  if (!text) return json({ error: 'Message body is empty.' }, 400);
  if (text.length > 1600) return json({ error: 'Message is longer than 1600 characters.' }, 400);
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return json({ error: 'No recipients supplied.' }, 400);
  }
  if (recipients.length > MAX_PER_CALL) {
    return json({ error: `Too many recipients in one call (max ${MAX_PER_CALL}).` }, 400);
  }

  // Fail closed: if we cannot confirm who has opted out, we do not send.
  let optOuts;
  try {
    optOuts = await getOptOuts();
  } catch (err) {
    return json({
      error: 'Could not read the opt-out list, so nothing was sent. This is deliberate — sending without checking opt-outs risks texting someone who replied STOP.',
      detail: String(err?.message || err),
    }, 503);
  }
  const seen = new Set();
  const prepared = [];
  const skipped = [];

  for (const r of recipients) {
    const name = String(r?.name || '').trim();
    const phone = toE164(r?.phone);
    const consent = String(r?.consent ?? '').trim().toLowerCase();

    if (!phone) {
      skipped.push({ name, phone: r?.phone ?? '', reason: 'Not a valid phone number' });
      continue;
    }
    // Consent is enforced server-side too, so a tampered page cannot bypass it.
    if (!['yes', 'y', 'true', '1', 'granted'].includes(consent)) {
      skipped.push({ name, phone, reason: 'No recorded consent' });
      continue;
    }
    if (optOuts[phone]) {
      skipped.push({ name, phone, reason: 'Opted out' });
      continue;
    }
    if (seen.has(phone)) {
      skipped.push({ name, phone, reason: 'Duplicate in this batch' });
      continue;
    }
    seen.add(phone);
    prepared.push({ name, phone });
  }

  const sent = [];
  const failed = [];

  if (prepared.length) {
    const results = await mapLimit(prepared, CONCURRENCY, async (person) => {
      // Personalisation is intentionally limited to first name only — no
      // clinical or program detail is ever templated into a message body.
      const firstName = person.name.split(/\s+/)[0] || '';
      const personalised = text.replace(/\{\{\s*(first_?name|name)\s*\}\}/gi, firstName);
      const res = await twilioSend({ to: person.phone, body: personalised });
      return { person, res };
    });

    for (const { person, res } of results) {
      if (res.ok) {
        sent.push({ name: person.name, phone: person.phone, sid: res.sid, status: res.status });
      } else {
        failed.push({
          name: person.name,
          phone: person.phone,
          error: res.error,
          code: res.code,
        });
      }
    }
  }

  const seg = segmentInfo(text);

  // Logging is best-effort: a storage hiccup must not make a successful send
  // look like a failure to the operator.
  try {
    await appendLog({
      at: new Date().toISOString(),
      campaignId,
      batchIndex,
      mode,
      // The message body is deliberately NOT written to the log. Keeping message
      // content out of stored records limits what a storage breach could expose.
      preview: text.slice(0, 40) + (text.length > 40 ? '…' : ''),
      segments: seg.segments,
      counts: { sent: sent.length, failed: failed.length, skipped: skipped.length },
    });
  } catch { /* ignore */ }

  return json({
    ok: true,
    mode,
    batchIndex,
    segments: seg.segments,
    encoding: seg.encoding,
    sent,
    failed,
    skipped,
  });
};

export default guard(handler);
