# MVR Text — Setup Guide

A texting console for Miami Valley Recovery. Staff can send one-to-one messages and
broadcast to a group, where every recipient gets their own private text.

Two things to know before you start:

1. **Nothing works until Twilio approves your 10DLC registration.** Budget 2–4 weeks.
   Everything else here takes an afternoon.
2. **The app never stores message content on the server.** Contacts live in the staff
   member's browser, and the server keeps only the opt-out list, incoming replies, and a
   send log with a 40-character preview.

---

## Part 1 — Read this first (compliance)

Miami Valley Recovery is a substance use disorder provider, which puts client
communication under **42 CFR Part 2** in addition to HIPAA. Part 2 is stricter: it
generally protects *the fact that someone is your client at all*, not just their clinical
details.

Practical consequences that shaped how this app is built:

| Rule | How the app handles it |
|---|---|
| Consent must be recorded before texting | The `consent` column is required in your CSV, and the server refuses to send to anyone whose consent is not `yes`. This is enforced server-side, so it cannot be bypassed from the page. |
| Opt-outs are binding and immediate | A STOP reply is recorded automatically. Staff can also record a verbal request. If the opt-out list cannot be read, the app **refuses to send at all** rather than risk texting someone who opted out. |
| Recipients must not be disclosed to each other | Broadcast sends individually. There is no group-thread mode. |
| Minimum necessary content | The app flags clinical wording (`relapse`, `detox`, `counselor`, `dose`, and about twenty more) before you send, because a text is visible on a lock screen to anyone holding the phone. |
| Time-of-day restrictions | Sends outside 8am–9pm are flagged. |

**Three things this app does not do for you, that you still need:**

- **A signed consent form** naming text messaging specifically, kept on file per client.
  The CSV column records that you have one; it is not the consent itself.
- **A Business Associate Agreement with Twilio.** Twilio supports HIPAA-eligible
  workflows but you must request a BAA and be approved — it is not automatic on a
  self-serve account. Ask Twilio sales before you send a single client message.
- **A lawyer's read.** Part 2 has teeth and I am not one. Have counsel review your
  consent language and your intended message templates.

One practical warning worth its own line: **carriers filter messages that mention
substances.** Words like "drug", "alcohol", "treatment" can get a message silently
blocked at the carrier even when you are perfectly compliant. This is another reason to
keep bodies generic — "please call the office" travels; "your suboxone refill is ready"
often does not.

---

## Part 2 — Twilio account and 10DLC registration

This is the long pole. Start it today, build the rest while you wait.

### Step 1: Create the account

1. Sign up at [twilio.com/try-twilio](https://www.twilio.com/try-twilio) using an
   organization email, not a personal one.
2. Upgrade from trial to a paid account. Trial accounts can only text verified numbers
   and prepend "Sent from a Twilio trial account" to every message.
3. Load an initial balance — $20 covers a lot of testing.

### Step 2: Business Profile in Trust Hub

**Console → Trust Hub → Customer Profiles → Create a Primary Customer Profile.**

You need:

- Legal business name **exactly as it appears on your IRS paperwork** — not the DBA, not
  the shortened version
- EIN
- Business address matching tax records
- Website URL
- An authorized representative (name, title, email, direct phone)

Accuracy matters more than it sounds. The Campaign Registry scores your submission
against third-party business records, and a mismatch as small as "Inc." versus
"Incorporated" can drop your trust score, which directly caps how fast you can send.

Approval: usually under 72 hours.

### Step 3: Register the Brand

**Trust Hub → A2P Messaging → Register a Brand.** Pull from the Customer Profile you
just made.

- One-time registration fee (roughly $4 for standard registration; check current pricing)
- TCR usually reviews within minutes; manual review can take a week

### Step 4: Register the Campaign

**Trust Hub → A2P Messaging → Campaigns → Create.**

Settings for your situation:

- **Use case:** *Low Volume Mixed* if you send under 6,000 messages/day (most likely), or
  *Standard* above that. If a healthcare-specific use case appears, choose it.
- **Description:** Be concrete and boring. *"Appointment reminders, schedule changes, and
  check-in messages sent to clients of Miami Valley Recovery who have signed a written
  consent form authorizing SMS contact."*
- **Sample messages:** Provide 2–5, matching what you will actually send. Use the
  templates built into the app's Compose tab — they already include STOP language.
- **Opt-in description:** Describe your real process. *"Clients provide written consent
  on a paper intake form signed in person at our office."* Do not invent a web form you
  do not have.
- **Opt-in/opt-out/help keywords:** Confirm STOP, START, and HELP are enabled.

Cost: a monthly campaign fee (around $2–$10 depending on use case) plus per-message
carrier fees on top of Twilio's message price.

**Approval currently takes 2–3 weeks.** Rejections almost always come from vague campaign
descriptions or sample messages that do not match the stated use case.

### Step 5: Buy a number and attach it

1. **Phone Numbers → Buy a number.** Filter for **SMS** capability and a 937 area code so
   it looks local to Dayton.
2. **Messaging → Services → Create Messaging Service.** Name it "MVR Client Texting".
3. Add your number to the service's sender pool.
4. Link the Messaging Service to your approved campaign.

Using a Messaging Service rather than a bare number is worth it — Twilio queues your
broadcast for you instead of rejecting messages that exceed per-second throughput.

---

## Part 3 — Deploy to Netlify from GitHub

Netlify must build this project itself. On a drag-and-drop deploy it skips the
build, which means the storage library never gets configured and every function
crashes. Connecting a Git repo avoids that entirely — and gives you automatic
redeploys on every change.

### Step 1: Put the code on GitHub

No command line needed:

1. Go to [github.com/new](https://github.com/new). Name it `mvr-text`, set it to
   **Private**, and do not add a README (this repo already has one).
2. On the empty repo page, click **uploading an existing file**.
3. Unzip the project folder and drag its *contents* into the browser —
   `public`, `netlify`, `test`, `netlify.toml`, `package.json`, `README.md`,
   `SETUP.md`, `.gitignore`.
4. Click **Commit changes**.

### Step 2: Connect Netlify to the repo

1. In Netlify: **Add new project → Import an existing project → GitHub**.
2. Authorise Netlify if prompted, then pick `mvr-text`.
3. Accept the detected settings — `netlify.toml` supplies them. Publish
   directory `public`, functions directory `netlify/functions`.
4. Deploy.

### Step 3: Environment variables

**Project configuration → Environment variables → Add a variable**, each scoped
to **All scopes**:

| Variable | Value |
|---|---|
| `APP_PASSCODE` | The passphrase staff will type. Four random words. |
| `TWILIO_ACCOUNT_SID` | From the Twilio Console home. Starts with `AC…` |
| `TWILIO_AUTH_TOKEN` | From the Twilio Console home |
| `TWILIO_MESSAGING_SERVICE_SID` | Messaging → Services. Starts with `MG…` |

Optional: `HELP_REPLY` to customise the HELP auto-reply,
`TWILIO_WEBHOOK_URL` if signature validation ever fails.

You can add `APP_PASSCODE` now and the Twilio ones later when registration
clears — the app runs fine without them, it just cannot send yet.

After adding variables, go to **Deploys → Trigger deploy → Deploy site**. That
button exists on Git-connected sites, and it is how new variables take effect.

### Step 4: Verify before anything else

Open `https://YOUR-SITE.netlify.app/api/health` in a browser. No login needed.

Expect `"ok": true`, `"storage": "ok"`, and `"passcode": true`. If something is
wrong, the response names it in plain language. Always check this first — it
turns "the site is broken" into a specific sentence.

### Step 5: Point replies back at the app

In Twilio: **Messaging → Services → your service → Integration**, set
*Incoming Messages* to:

```
https://YOUR-SITE.netlify.app/api/inbound
```

Method **POST**. This is what makes STOP handling work.

### Making changes later

Edit the file on GitHub and commit — Netlify redeploys within a minute. No
zips, no re-uploading. That is the main reason this path is worth the extra
fifteen minutes up front.

## Part 4 — Day-to-day use

### Loading contacts

Export from your existing system to CSV with these columns:

```csv
name,phone,group,consent,notes
Jordan Miller,(937) 555-0142,Monday Group,yes,Prefers texts after 5pm
Sam Rivera,937-555-0198,Alumni,yes,
```

- `consent` must be `yes` or the person is skipped on every send
- To put someone in two groups, repeat the row with a different `group`
- Phone numbers can be in any format
- Download a blank template from the Contacts tab

Contacts stay in the browser. "Remember contacts on this computer" is off by default —
leave it off on any machine more than one person uses.

### Sending

**One person:** Compose → One person → pick from the dropdown → type → Review and send.

**Broadcast:** Compose → Broadcast to a group → pick the group. `{{first_name}}` inserts
each person's first name. Sends over 25 recipients require typing the recipient count to
confirm.

The review screen shows the exact message as the first recipient will see it, the cost
estimate, and anything flagged. Both checkboxes are deliberate friction — a broadcast to
200 people is not undoable.

### Handling opt-outs

Automatic for STOP replies. For someone who asks in person, use **Opt-outs → Record an
opt-out**. Opting someone back in requires a confirmation, because doing it wrongly is the
kind of mistake that generates a complaint to the FCC.

---

## Costs

| Item | Approximate |
|---|---|
| Netlify hosting | Free at this scale |
| Twilio phone number | ~$1.15/month |
| Brand registration | ~$4 one-time |
| Campaign registration | ~$2–10/month |
| Outbound SMS | ~$0.0079 + ~$0.003 carrier fee per segment |

A 200-person broadcast of one segment runs about $2.20. Verify current pricing at
[twilio.com/en-us/sms/pricing/us](https://www.twilio.com/en-us/sms/pricing/us) — these
numbers move.

---

## Troubleshooting

**"Setup incomplete" in the header** — Run the Setup check; it names the specific missing
variable. Remember to redeploy after adding variables.

**Messages send but never arrive** — Almost always 10DLC. Unregistered traffic on a
long code gets filtered silently by carriers. Check the Twilio Console error log.

**Replies do not appear in the Inbox** — The webhook URL is wrong or the signature check
is failing. Set `TWILIO_WEBHOOK_URL` to the exact URL you entered in Twilio.

**"Could not read the opt-out list"** — Netlify Blobs is unavailable. Sending is blocked
on purpose until it recovers. Redeploy the site.

**Error 21610** — That number opted out at the Twilio level. Twilio blocks it
independently of this app's list. The person must text START.

---

## What is deliberately missing

Worth knowing so nobody assumes otherwise:

- **No message history per contact.** You see replies in the Inbox but not a threaded
  conversation view, because storing that means storing client message content on a
  server. If you want it, it needs a real database and a BAA covering it.
- **No scheduled sends.** Someone has to press the button.
- **No multi-user accounts.** One shared passcode. Fine for a small team; if you need to
  know which staff member sent what, that is the next version.
- **No MMS.** Text only.

Each of these is buildable. They were left out to keep the first version something you can
actually deploy and trust rather than a system that needs an audit before it launches.
