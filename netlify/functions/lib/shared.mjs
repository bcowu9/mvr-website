// Shared helpers for the Miami Valley Recovery texting console.
// Lives in a subdirectory so Netlify does not deploy it as its own function.

import crypto from 'node:crypto';

export const STORE_NAME = 'mvr-text';

export function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  });
}

/** Constant-time compare so the passcode cannot be guessed by timing. */
export function safeEqual(a = '', b = '') {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) {
    // Still burn a comparison so length differences are not timing-visible.
    crypto.timingSafeEqual(ab, ab);
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Every staff-facing endpoint requires the shared passcode.
 * Returns null when authorised, or a Response to return immediately.
 */
export function requirePasscode(req) {
  const expected = process.env.APP_PASSCODE;
  if (!expected) {
    return json(
      { error: 'APP_PASSCODE is not set. In Netlify: Project configuration > Environment variables > Add a variable, scoped to All scopes. Then re-drop the zip on the Deploys page.' },
      500
    );
  }
  const given = req.headers.get('x-app-passcode') || '';
  if (!safeEqual(given, expected)) {
    return json({ error: 'Incorrect passcode.' }, 401);
  }
  return null;
}

export function twilioConfig() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  return { sid, token, from, messagingServiceSid };
}

export function missingTwilioConfig() {
  const { sid, token, from, messagingServiceSid } = twilioConfig();
  const missing = [];
  if (!sid) missing.push('TWILIO_ACCOUNT_SID');
  if (!token) missing.push('TWILIO_AUTH_TOKEN');
  if (!from && !messagingServiceSid) missing.push('TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID');
  return missing;
}

/**
 * Normalise a US phone number to E.164 (+1XXXXXXXXXX).
 * Returns null when the input cannot be a valid US number.
 */
export function toE164(raw) {
  if (raw === null || raw === undefined) return null;
  let s = String(raw).trim();
  if (!s) return null;

  const hadPlus = s.startsWith('+');
  const digits = s.replace(/\D/g, '');
  if (!digits) return null;

  if (hadPlus) {
    // Already international. Accept 8-15 digits per E.164.
    if (digits.length < 8 || digits.length > 15) return null;
    return '+' + digits;
  }
  if (digits.length === 10) {
    if (digits[0] === '0' || digits[0] === '1') return null; // invalid NANP area code
    return '+1' + digits;
  }
  if (digits.length === 11 && digits[0] === '1') {
    if (digits[1] === '0' || digits[1] === '1') return null;
    return '+' + digits;
  }
  return null;
}

/** GSM-7 vs UCS-2 segment counting, matching how carriers bill. */
const GSM7_BASE =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?' +
  '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
const GSM7_EXT = '^{}\\[~]|€';

export function segmentInfo(text) {
  const s = String(text ?? '');
  let gsm = true;
  let units = 0;
  for (const ch of s) {
    if (GSM7_BASE.includes(ch)) units += 1;
    else if (GSM7_EXT.includes(ch)) units += 2;
    else { gsm = false; break; }
  }
  if (!gsm) {
    // UCS-2: count UTF-16 code units.
    units = s.length;
    const single = 70, multi = 67;
    const segments = units === 0 ? 0 : units <= single ? 1 : Math.ceil(units / multi);
    return { encoding: 'UCS-2', units, segments, perSegment: units <= single ? single : multi };
  }
  const single = 160, multi = 153;
  const segments = units === 0 ? 0 : units <= single ? 1 : Math.ceil(units / multi);
  return { encoding: 'GSM-7', units, segments, perSegment: units <= single ? single : multi };
}

/** Send one SMS through the Twilio REST API. */
export async function twilioSend({ to, body, statusCallback }) {
  const { sid, token, from, messagingServiceSid } = twilioConfig();
  const params = new URLSearchParams();
  params.set('To', to);
  params.set('Body', body);
  if (messagingServiceSid) params.set('MessagingServiceSid', messagingServiceSid);
  else params.set('From', from);
  if (statusCallback) params.set('StatusCallback', statusCallback);

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: 'POST',
    headers: {
      authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  let data = null;
  try { data = await res.json(); } catch { /* non-JSON error body */ }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      code: data?.code ?? null,
      error: data?.message || `Twilio returned HTTP ${res.status}`,
      moreInfo: data?.more_info ?? null,
    };
  }
  return { ok: true, sid: data?.sid ?? null, status: data?.status ?? null, segments: data?.num_segments ?? null };
}

/**
 * Validate Twilio's X-Twilio-Signature on an inbound webhook.
 * Prevents anyone who guesses the URL from injecting fake replies or opt-outs.
 */
export function validateTwilioSignature({ signature, url, params, authToken }) {
  if (!signature || !authToken) return false;
  const sorted = Object.keys(params).sort();
  let data = url;
  for (const key of sorted) data += key + params[key];
  const expected = crypto.createHmac('sha1', authToken).update(Buffer.from(data, 'utf-8')).digest('base64');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Wraps a handler so an unexpected exception returns a readable JSON error
 * instead of Netlify's opaque "Error - Request ID" page. Debugging a texting
 * console should never require hunting through platform logs.
 */
export function guard(handler) {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (err) {
      let path = '';
      try { path = new URL(req.url).pathname; } catch { /* ignore */ }
      return json({
        error: 'The server hit an unexpected error.',
        where: path,
        detail: String(err?.message || err),
        stack: String(err?.stack || '').split('\n').slice(0, 4).join(' | '),
      }, 500);
    }
  };
}

// ---------- Blob storage ----------

/**
 * The storage library is imported lazily and cached. Loading it at module top
 * level meant any failure inside it crashed every function that imported this
 * file — including ones that never touch storage, like the passcode check.
 */
let _blobsModule = null;
async function loadBlobs() {
  if (!_blobsModule) _blobsModule = await import('@netlify/blobs');
  return _blobsModule;
}

/**
 * Netlify normally injects the storage credentials automatically. That only
 * happens reliably when Netlify builds the functions itself — on a
 * drag-and-drop deploy of pre-bundled functions it may not, and the library
 * then throws "The environment has not been configured to use Netlify Blobs".
 *
 * So we support explicit credentials as a fallback: set NETLIFY_SITE_ID and
 * NETLIFY_BLOBS_TOKEN (a personal access token) and storage works regardless
 * of how the site was deployed.
 */
export async function store() {
  const { getStore } = await loadBlobs();
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_API_TOKEN;

  if (siteID && token) {
    return getStore({ name: STORE_NAME, consistency: 'strong', siteID, token });
  }
  return getStore({ name: STORE_NAME, consistency: 'strong' });
}

/** Which credential path storage is using — surfaced by the health check. */
export function storeMode() {
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_API_TOKEN;
  return siteID && token ? 'explicit credentials' : 'automatic (Netlify-injected)';
}

export async function readJSON(key, fallback) {
  try {
    const v = await (await store()).get(key, { type: 'json' });
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export async function writeJSON(key, value) {
  await (await store()).setJSON(key, value);
}

export const OPTOUT_KEY = 'optouts.json';
export const INBOX_KEY = 'inbox.json';
export const LOG_KEY = 'sendlog.json';

/**
 * Opt-outs are read strictly: if the store is unreachable we must NOT fall back
 * to "nobody has opted out", because that would keep texting people who said
 * STOP. Callers are expected to abort the send when this throws.
 */
export async function getOptOuts() {
  const v = await (await store()).get(OPTOUT_KEY, { type: 'json' });
  return v?.numbers || {};
}

export async function addOptOut(number, reason = 'STOP keyword') {
  const numbers = await getOptOuts();
  numbers[number] = { at: new Date().toISOString(), reason };
  await writeJSON(OPTOUT_KEY, { numbers });
  return numbers;
}

export async function removeOptOut(number) {
  const numbers = await getOptOuts();
  delete numbers[number];
  await writeJSON(OPTOUT_KEY, { numbers });
  return numbers;
}

const MAX_INBOX = 500;
export async function appendInbox(entry) {
  const data = await readJSON(INBOX_KEY, { messages: [] });
  data.messages.unshift(entry);
  data.messages = data.messages.slice(0, MAX_INBOX);
  await writeJSON(INBOX_KEY, data);
}

const MAX_LOG = 300;
export async function appendLog(entry) {
  const data = await readJSON(LOG_KEY, { entries: [] });
  data.entries.unshift(entry);
  data.entries = data.entries.slice(0, MAX_LOG);
  await writeJSON(LOG_KEY, data);
}

export const STOP_WORDS = new Set([
  'stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit', 'stop all', 'optout', 'opt out', 'revoke',
]);
export const START_WORDS = new Set(['start', 'unstop', 'yes', 'optin', 'opt in', 'subscribe']);
export const HELP_WORDS = new Set(['help', 'info']);
