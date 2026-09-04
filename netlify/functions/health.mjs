/**
 * Unauthenticated health check.
 *
 * Two hard rules for this file:
 *   1. NO imports from shared code. If a shared module fails to load, it must
 *      not be able to take down the one endpoint whose job is to say so.
 *   2. It must NEVER throw. Every failure is caught and reported as JSON. An
 *      opaque "Error - Request ID" page tells the operator nothing; a JSON body
 *      naming the failure tells them everything.
 *
 * It reports booleans and error messages only. No secret value is ever returned.
 */

const APP = 'mvr-text 1.3.0';

export default async (req) => {
  const out = {
    ok: true,
    app: APP,
    time: new Date().toISOString(),
    node: typeof process !== 'undefined' ? process.version : 'unknown',
  };

  // --- Routing ---
  try {
    const url = new URL(req.url);
    out.path = url.pathname;
    out.routing = url.pathname.includes('/api/')
      ? 'ok — /api/* redirect is working'
      : 'reached directly at /.netlify/functions/health';
    out.webhookUrl = new URL('/api/inbound', req.url).toString();
  } catch (err) {
    out.ok = false;
    out.routing = 'FAILED: ' + String(err?.message || err);
  }

  // --- Environment variables (presence only, never values) ---
  try {
    const e = process.env;
    out.configured = {
      passcode: Boolean(e.APP_PASSCODE),
      twilioAccount: Boolean(e.TWILIO_ACCOUNT_SID),
      twilioToken: Boolean(e.TWILIO_AUTH_TOKEN),
      sender: Boolean(e.TWILIO_FROM_NUMBER || e.TWILIO_MESSAGING_SERVICE_SID),
    };
  } catch (err) {
    out.ok = false;
    out.configured = 'FAILED: ' + String(err?.message || err);
  }

  // --- Blob storage (opt-out list, inbox, send log) ---
  // Loaded lazily and inside try/catch: if the storage library cannot load in
  // this runtime, that is the single most likely cause of a crash elsewhere,
  // and naming it here is the whole point of this endpoint.
  try {
    const { getStore } = await import('@netlify/blobs');
    const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
    const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_API_TOKEN;
    out.storageMode = siteID && token ? 'explicit credentials' : 'automatic (Netlify-injected)';
    const opts = { name: 'mvr-text', consistency: 'strong' };
    if (siteID && token) { opts.siteID = siteID; opts.token = token; }
    const s = getStore(opts);
    const key = 'health-probe';
    await s.setJSON(key, { at: new Date().toISOString() });
    const back = await s.get(key, { type: 'json' });
    await s.delete(key);
    out.storage = back ? 'ok — read and write both working' : 'FAILED: wrote a value but read back nothing';
    if (!back) out.ok = false;
  } catch (err) {
    out.ok = false;
    out.storage = 'FAILED: ' + String(err?.message || err);
    out.howToFix = 'Add NETLIFY_SITE_ID (Project configuration > General > Project information > Project ID) and NETLIFY_BLOBS_TOKEN (a Netlify personal access token from User settings > Applications) as environment variables, then re-drop the zip.';
  }

  return new Response(JSON.stringify(out, null, 2), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
};
