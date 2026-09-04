# A2P 10DLC Campaign Registration — copy for Miami Valley Recovery LLC

Paste these into the Twilio campaign registration form. Everything here is written
to be specific and verifiable, which is what carrier review rewards. Vague
descriptions and sample messages that don't match the stated use case are the
two most common reasons a campaign gets bounced.

**Account facts**

| Field | Value |
|---|---|
| Legal business name | Miami Valley Recovery LLC |
| Sending number | +1 (937) 930-4672 |
| Business address | 1 Elizabeth Place, Dayton, OH |

---

## 1. Campaign use case

Select **Low Volume Mixed** unless you expect to send more than 6,000 messages
per day, which is unlikely at your size. If a healthcare-specific use case is
offered in the list, choose that instead — it maps more precisely to what you
do.

Do **not** select Marketing. Your messages are service communications to existing
clients, not promotions. Marketing use cases draw stricter carrier filtering and
different consent obligations.

---

## 2. Campaign description

> Appointment reminders, schedule changes, and check-in messages sent by Miami
> Valley Recovery LLC, an outpatient treatment provider in Dayton, Ohio, to
> existing clients who have signed a written consent form authorizing SMS
> contact. Messages are one-to-one or sent individually to a staff-selected
> list. No promotional or marketing content is sent. Recipients can opt out at
> any time by replying STOP.

Why this wording: it names the business, states who receives messages and how
they consented, describes the content, and explicitly rules out marketing.

---

## 3. Sample messages

Provide all five. Each names the business and carries opt-out language, which
reviewers check for.

1. > Hi Jordan, this is a reminder of your appointment with Miami Valley Recovery
   > on Tuesday at 4:00 PM. Reply or call us at (937) 930-4672 if you need to
   > reschedule. Reply STOP to stop texts.

2. > Miami Valley Recovery: our Monday meeting time has changed to 6:00 PM this
   > week. Call the office with questions. Reply STOP to stop texts.

3. > Hi Sam, checking in from Miami Valley Recovery. Give us a call when you have
   > a moment. Reply STOP to stop texts.

4. > Hi Dana, please call Miami Valley Recovery at (937) 930-4672 when you get a
   > chance. Reply STOP to stop texts.

5. > Miami Valley Recovery: the office will be closed Monday for the holiday and
   > will reopen Tuesday at 9:00 AM. Reply STOP to stop texts.

Note what these deliberately avoid: no diagnosis, no treatment detail, no
medication names, no reason for the appointment. That protects clients under
42 CFR Part 2, and it also keeps messages clear of carrier content filters that
flag substance-related terms.

---

## 4. Opt-in / message flow

> Clients provide written consent to receive text messages by signing a consent
> form in person at our office during intake. The form specifically authorizes
> SMS contact for appointment reminders and service-related communication,
> states that message and data rates may apply, and explains that the client may
> opt out at any time by replying STOP. Staff record the signed consent before
> the client's phone number is added to the messaging list. No numbers are
> purchased, rented, or obtained from third parties.

Describe your real process. If you also collect consent another way — a web
form, a phone call with documented verbal consent — say so accurately. Do not
describe a web form you don't have; reviewers sometimes check.

---

## 5. Opt-out and help

Confirm these are enabled with default keywords:

- **STOP** (also STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT) — stops all messages
- **START** (also UNSTOP) — resumes
- **HELP** (also INFO) — returns contact information

Suggested HELP reply, which also fits the `HELP_REPLY` environment variable in
the app:

> Miami Valley Recovery. For help call (937) 930-4672 during business hours.
> Reply STOP to stop messages. Msg&data rates may apply.

---

## 6. Volume estimate

Estimate honestly and on the low side. Under 1,000 messages per day is typical
for an outpatient provider of this size. Over-estimating invites scrutiny you
don't need; the limit can be raised later.

---

## If the campaign is rejected

Rejections come with a reason code. The three most common, and what they mean:

**"Campaign description too vague"** — add specifics: who receives messages, the
consent mechanism, the message types.

**"Sample messages don't match use case"** — a sample reads as promotional, or
lacks opt-out language. Every sample must carry the business name and STOP
instruction.

**"Opt-in process unclear"** — describe the physical consent form in more
detail: when it's signed, what it says, who witnesses it.

You can revise and resubmit. Each resubmission restarts the review clock, so
it's worth getting the first one right.
