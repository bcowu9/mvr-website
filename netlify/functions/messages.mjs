import { json, requirePasscode, readJSON, getOptOuts, INBOX_KEY, LOG_KEY, guard,
} from './lib/shared.mjs';

const handler = async (req) => {
  const denied = requirePasscode(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const since = url.searchParams.get('since');

  const [inbox, log] = await Promise.all([
    readJSON(INBOX_KEY, { messages: [] }),
    readJSON(LOG_KEY, { entries: [] }),
  ]);

  let optOuts = {};
  let optOutError = null;
  try {
    optOuts = await getOptOuts();
  } catch (err) {
    optOutError = String(err?.message || err);
  }

  let messages = inbox.messages || [];
  if (since) {
    const cutoff = Date.parse(since);
    if (!Number.isNaN(cutoff)) {
      messages = messages.filter((m) => Date.parse(m.at) > cutoff);
    }
  }

  return json({
    ok: true,
    fetchedAt: new Date().toISOString(),
    messages,
    optOuts,
    optOutError,
    log: (log.entries || []).slice(0, 60),
  });
};

export default guard(handler);
