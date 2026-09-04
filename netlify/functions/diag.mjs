import { json, requirePasscode, twilioConfig, missingTwilioConfig, store, guard,
} from './lib/shared.mjs';

/** Setup check: confirms credentials, the sending number, and storage all work. */
const handler = async (req) => {
  const denied = requirePasscode(req);
  if (denied) return denied;

  const checks = [];
  const { sid, token, from, messagingServiceSid } = twilioConfig();

  const missing = missingTwilioConfig();
  checks.push({
    name: 'Twilio connection',
    ok: missing.length === 0,
    // `pending` distinguishes "not configured yet" from "broken". Before 10DLC
    // registration clears there is nothing to enter, so this should not read as
    // a fault the operator can fix today.
    pending: missing.length > 0,
    detail: missing.length
      ? `Not connected yet. Once your 10DLC registration is approved, add these in Netlify > Project configuration > Environment variables: ${missing.join(', ')}`
      : 'Credentials are set.',
  });

  // Blob storage powers the opt-out list, inbox and send log.
  try {
    const s = await store();
    const probe = `diag/${Date.now()}`;
    await s.setJSON(probe, { ok: true });
    await s.get(probe, { type: 'json' });
    await s.delete(probe);
    checks.push({ name: 'Storage (opt-outs, inbox, log)', ok: true, detail: 'Read and write both working.' });
  } catch (err) {
    checks.push({
      name: 'Storage (opt-outs, inbox, log)',
      ok: false,
      detail: `${String(err?.message || err)} — opt-out enforcement will block sending until this works.`,
    });
  }

  if (!missing.length) {
    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}.json`, {
        headers: { authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64') },
      });
      const data = await res.json().catch(() => null);
      checks.push({
        name: 'Twilio credentials',
        ok: res.ok,
        detail: res.ok
          ? `Connected to "${data?.friendly_name || 'account'}" (status: ${data?.status || 'unknown'}).`
          : data?.message || `HTTP ${res.status}`,
      });

      if (res.ok && from) {
        const q = new URLSearchParams({ PhoneNumber: from });
        const nres = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/IncomingPhoneNumbers.json?${q}`,
          { headers: { authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64') } }
        );
        const ndata = await nres.json().catch(() => null);
        const found = ndata?.incoming_phone_numbers?.[0];
        checks.push({
          name: 'Sending number',
          ok: Boolean(found),
          detail: found
            ? `${found.phone_number} is on this account. SMS inbound webhook: ${found.sms_url || 'not set — replies will not reach the inbox'}`
            : `${from} was not found on this Twilio account.`,
        });
      }
      if (res.ok && messagingServiceSid) {
        checks.push({
          name: 'Messaging Service',
          ok: true,
          detail: `Using Messaging Service ${messagingServiceSid}. Confirm its inbound webhook points at /api/inbound.`,
        });
      }
    } catch (err) {
      checks.push({ name: 'Twilio credentials', ok: false, detail: String(err?.message || err) });
    }
  }

  const webhookUrl = new URL('/api/inbound', req.url).toString();

  return json({
    ok: checks.every((c) => c.ok),
    checks,
    webhookUrl,
    signatureCheckDisabled: String(process.env.SKIP_TWILIO_SIGNATURE_CHECK || '').toLowerCase() === 'true',
  });
};

export default guard(handler);
