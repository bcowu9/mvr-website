import {
  toE164, validateTwilioSignature, appendInbox, addOptOut, removeOptOut,
  STOP_WORDS, START_WORDS, HELP_WORDS, guard,
} from './lib/shared.mjs';

function twiml(message) {
  const body = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'text/xml; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

const handler = async (req) => {
  if (req.method !== 'POST') {
    return new Response('This endpoint receives Twilio webhooks.', { status: 405 });
  }

  const raw = await req.text();
  const params = Object.fromEntries(new URLSearchParams(raw));

  // --- Signature validation: proves the request really came from Twilio. ---
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const skip = String(process.env.SKIP_TWILIO_SIGNATURE_CHECK || '').toLowerCase() === 'true';

  if (!skip) {
    // Twilio signs the exact URL it called. Because netlify.toml rewrites
    // /api/* to the function, set TWILIO_WEBHOOK_URL to the URL you entered in
    // the Twilio console if validation ever fails.
    const url = process.env.TWILIO_WEBHOOK_URL || req.url;
    const signature = req.headers.get('x-twilio-signature');
    const valid = validateTwilioSignature({ signature, url, params, authToken });
    if (!valid) {
      return new Response('Invalid signature.', { status: 403 });
    }
  }

  const from = toE164(params.From) || params.From || '';
  const to = params.To || '';
  const bodyText = String(params.Body || '').trim();
  const normalised = bodyText.toLowerCase().replace(/[^a-z\s]/g, '').trim();

  let action = 'received';
  let reply = null;

  if (STOP_WORDS.has(normalised)) {
    await addOptOut(from, `Replied "${bodyText.slice(0, 20)}"`);
    action = 'opted_out';
    // Twilio's Advanced Opt-Out already sends the carrier-required confirmation,
    // so we do not send a second one here.
  } else if (START_WORDS.has(normalised)) {
    await removeOptOut(from);
    action = 'opted_in';
  } else if (HELP_WORDS.has(normalised)) {
    action = 'help';
    reply = process.env.HELP_REPLY ||
      'Miami Valley Recovery. For help call the office during business hours. Reply STOP to stop messages. Msg&data rates may apply.';
  }

  await appendInbox({
    id: params.MessageSid || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    from,
    to,
    body: bodyText,
    action,
    read: false,
  });

  return twiml(reply);
};

export default guard(handler);
