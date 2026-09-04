import { json, requirePasscode, toE164, addOptOut, removeOptOut, guard,
} from './lib/shared.mjs';

/**
 * Manual opt-out management, for when someone asks a staff member in person or
 * by phone to stop receiving texts. That request is just as binding as a STOP
 * reply, so staff need a way to record it.
 */
const handler = async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const denied = requirePasscode(req);
  if (denied) return denied;

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Body must be JSON.' }, 400);
  }

  const phone = toE164(payload?.phone);
  const action = String(payload?.action || '').toLowerCase();
  if (!phone) return json({ error: 'Not a valid phone number.' }, 400);

  try {
    if (action === 'add') {
      const numbers = await addOptOut(phone, payload?.reason || 'Recorded by staff');
      return json({ ok: true, action, phone, optOuts: numbers });
    }
    if (action === 'remove') {
      const numbers = await removeOptOut(phone);
      return json({ ok: true, action, phone, optOuts: numbers });
    }
    return json({ error: 'action must be "add" or "remove".' }, 400);
  } catch (err) {
    return json({ error: 'Could not update the opt-out list.', detail: String(err?.message || err) }, 503);
  }
};

export default guard(handler);
