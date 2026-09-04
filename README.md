# MVR Text

A texting console for Miami Valley Recovery. Staff send one-to-one messages and
broadcast to groups, where every recipient gets their own private text.

Full instructions, including Twilio and 10DLC registration, are in
[SETUP.md](SETUP.md). This file covers getting the site running.

---

## Deploying

This repo is built to be deployed by Netlify from GitHub. Netlify installs the
dependencies, bundles the serverless functions, and configures Blobs storage
automatically — none of which happens on a manual drag-and-drop deploy.

1. Push this repo to GitHub (private).
2. In Netlify: **Add new project → Import an existing project → GitHub**, pick
   the repo, and accept the detected settings. `netlify.toml` supplies them:
   - Publish directory: `public`
   - Functions directory: `netlify/functions`
   - Build command: none needed
3. Add environment variables under **Project configuration → Environment
   variables**, scoped to **All scopes**:

   | Variable | Required | What it is |
   |---|---|---|
   | `APP_PASSCODE` | Yes | The passphrase staff type to unlock the app |
   | `TWILIO_ACCOUNT_SID` | To send | Starts with `AC…` |
   | `TWILIO_AUTH_TOKEN` | To send | Twilio secret |
   | `TWILIO_MESSAGING_SERVICE_SID` | To send | Starts with `MG…` |
   | `TWILIO_FROM_NUMBER` | Alternative | Only if not using a Messaging Service |
   | `HELP_REPLY` | Optional | Custom auto-reply to a HELP text |
   | `TWILIO_WEBHOOK_URL` | Optional | Set if webhook signature checks fail |

4. Trigger a deploy (**Deploys → Trigger deploy**). With a Git-connected site
   this button exists, and it is how new environment variables take effect.

## Verifying a deploy

Open `https://YOUR-SITE.netlify.app/api/health` — no login needed.

```json
{
  "ok": true,
  "routing": "ok — /api/* redirect is working",
  "configured": { "passcode": true, ... },
  "storage": "ok — read and write both working"
}
```

`"ok": true` means the deploy is sound. Any failure is named in plain text in
the response rather than hidden behind a platform error page. Check this before
debugging anything else.

## Reply webhook

In Twilio, set the Messaging Service's *Incoming Messages* webhook to:

```
https://YOUR-SITE.netlify.app/api/inbound
```

This is what makes STOP handling work. Without it, opt-out replies never reach
the app and staff would keep texting people who asked them to stop.

---

## Layout

```
public/index.html          The entire app — one self-contained page
netlify/functions/
  health.mjs               Unauthenticated deploy check. Imports nothing, never throws.
  send.mjs                 Sends messages; enforces consent and opt-outs server-side
  inbound.mjs              Twilio webhook: replies, STOP/START/HELP handling
  messages.mjs             Feeds the Inbox, opt-out list, and activity log
  optout.mjs               Records opt-outs staff take by phone or in person
  diag.mjs                 Setup check shown inside the app
  lib/shared.mjs           Shared helpers (not deployed as a function)
test/
  verify.mjs               46 tests: phone parsing, segment math, CSV, signatures
  mock-server.mjs          Local mock of the API, no Twilio needed
  screenshots.mjs          Drives the real UI in a browser
```

## Running the tests

```bash
npm install
npm test
```

To click through the app locally without Twilio:

```bash
node test/mock-server.mjs     # http://localhost:8787, passcode: test-passcode
```

## Design notes

Three decisions worth preserving if this code gets modified:

**Consent and opt-outs are enforced on the server**, not just in the page. A
tampered browser cannot bypass them.

**If the opt-out list cannot be read, sending is refused entirely.** Failing
loudly beats texting someone who replied STOP.

**Message content is never written to storage.** The activity log keeps a
40-character preview — enough to answer "did that go out?" without keeping
client communications on a server.
