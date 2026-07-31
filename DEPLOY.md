# Miami Valley Recovery — Homepage Deploy Guide

This folder contains a complete, self-contained website homepage. Everything —
all styling, scripts, AND your logo images — is embedded directly inside
`index.html`. There are no external files to lose. You can open, email, move,
or upload `index.html` on its own and the logo will always show.

It works by simply opening `index.html` in a browser, and it's ready to
deploy to Netlify (same as your Sober Days app).

(The separate `mvr-logo.png` and `mvr-logo-light.png` files are included only
in case you want them for other uses — the website does not need them.)

## Option A — Drag & drop (fastest)
1. Go to https://app.netlify.com and log in.
2. Click **Add new site → Deploy manually**.
3. Drag this whole folder (the one containing `index.html`) onto the upload area.
4. Netlify gives you a live URL instantly (e.g. `something.netlify.app`).

## Option B — Connect your domain
Once you're happy with the site and ready to make it your real homepage:
1. In Netlify: **Domain settings → Add custom domain →** `miamivalleyrecovery.com`.
2. Netlify will show you DNS records. You'll either:
   - Point your domain's DNS to Netlify (change nameservers), or
   - Add the records at your current registrar.
3. Netlify issues a free HTTPS certificate automatically.
4. Only switch the live domain over once you're confident — keep Weebly up until then.

## What's already built in
- Responsive (looks right on phone, tablet, desktop)
- Sticky mobile "Call" bar
- Click-to-call links (tel:937.401.8672)
- Embedded Google Map for 1 Elizabeth Place
- MedicalClinic schema (SEO structured data)
- SEO title tag + meta description
- Sober Days button (opens sober-days.netlify.app in a new tab)
- 988 crisis line in the footer
- Accessible focus states + reduced-motion support

## Things to update before going fully live
- **Photos:** the hero uses a styled info card. Swap in a real photo of your
  team or office if you'd like (replace the `.hero-card` block).
- **Service links:** the six service cards and footer links currently point to
  `#`. Wire them to the real pages as you build them (Suboxone, MAT, etc.).
- **Insurance payers:** confirm the plans listed (Anthem, Cigna, Medicaid) are
  ones you're actually contracted with.
- **Nav "Contact":** currently scrolls to the location section; point it to a
  real contact/admissions page when built.

## The Insurance page (insurance.html)

`insurance.html` covers coverage and payment — hero, the plans you accept, a
free **insurance-verification form**, a "don't have insurance?" section, and a
call band. The homepage "Verify my coverage" button now points here. Same
shared header, footer, logo, and styling as the other pages.

Its verification form is **already wired for Netlify Forms** (form name
`insurance-verification`), just like the Admissions form. See the Netlify email
setup steps below — adding the info@miamivalleyrecovery.com notification for this
form is the only step, and it's done in the Netlify dashboard.

Two things to confirm before this page goes live:
- **Only list insurers you're actually contracted with.** The page shows Ohio
  Medicaid, Anthem, and Cigna as examples — edit the four "payer" tiles in
  `insurance.html` to match your real in-network plans.
- Don't collect full policy images or SSNs on the web form. Name, phone, email,
  provider, and member ID are enough to start verification.

**Managed care plans section:** the page lists all seven Ohio Medicaid
managed-care plans, each with its official logo embedded (AmeriHealth Caritas,
Anthem Blue Cross and Blue Shield, Buckeye, CareSource, Humana Healthy Horizons,
Molina, and UnitedHealthcare Community Plan). All logos are baked into the page,
so nothing extra needs to travel with it.

## The Admissions page (admissions.html)

`admissions.html` is your primary conversion page — hero, a 3-step "how it
works," the confidential assessment-request form, a "what to expect" section,
and a call band. It shares the exact header, footer, logo, and styling as the
homepage, and its nav links back to the homepage sections. All the "Start your
recovery" / "Request my assessment" buttons on the homepage should point here.

**Keep both `index.html` and `admissions.html` in the same folder** so the links
between them work.

### Form emails — already wired for Netlify Forms

Both the Admissions form (`assessment-request`) and the Insurance form
(`insurance-verification`) are **already set up for Netlify Forms**. The HTML has
the `data-netlify="true"` attributes, hidden form-name fields, and a spam
honeypot; the JavaScript posts each submission to Netlify and then shows the
"thank you" message. You do NOT need to edit any code.

**One step remains — and it must be done in the Netlify dashboard, not the code.**
Netlify captures every submission, but you tell Netlify where to email them:

1. Deploy the site to Netlify (drag-and-drop or Git — see top of this guide).
2. Submit each form once on the live site. (Netlify only "registers" a form
   after it sees a real submission on the deployed site. Local previews won't
   register it — that's expected.)
3. In Netlify: **Site configuration → Forms → Form notifications →
   Add notification → Email notification.**
4. Set the recipient to **info@miamivalleyrecovery.com** and choose which form
   it applies to. Do this once for `assessment-request` and once for
   `insurance-verification` (or send both to the same address).
5. Done — every submission now emails info@miamivalleyrecovery.com, and you can
   also view/export them anytime under the **Forms** tab.

Tip: consider also adding an **auto-reply** so the person who submitted gets a
confirmation email matching the on-screen "thank you." Netlify supports this
under the same Form notifications screen.

**Note on local previews:** if you open these HTML files directly on your
computer (not on Netlify), the form will still show the thank-you message, but
nothing is emailed — there's no server. Email only works once deployed to
Netlify with the notification set up.

**Do not** add sensitive medical or substance-use detail fields to these web
forms — name, phone, email, and optional insurance/member ID are enough to start
intake; clinical details belong in the assessment itself.

## The service pages (6 pages)

Six service pages are now built, all matching the site design and cross-linked:

- `outpatient-treatment.html`
- `medication-assisted-treatment.html` (includes an FAQ with FAQPage schema)
- `suboxone-treatment.html` (includes an FAQ with FAQPage schema)
- `alcohol-addiction-treatment.html`
- `drug-addiction-treatment.html`
- `mothers-on-buprenorphine.html` (M.O.B. Program)

The homepage service cards and all footers now link to these pages, and each
page links back to the homepage, Admissions, and MAT. Keep every `.html` file in
the same folder so the links work.

**Have your clinical lead review before publishing.** These pages describe
treatment, medications (Suboxone, Subutex, Vivitrol, Antabuse), and the M.O.B.
program. Have Karen or Jeff confirm the medical descriptions match how you
actually deliver care, and adjust any specifics (levels of care offered,
medications used) to match your program exactly.

The drug-addiction page cites the Ohio 2023 overdose figure (4,400+ deaths /
12 a day) with its source; refresh it when finalized 2024 numbers publish.

## Adding your official certification seals

The page has a new **Accreditations & Certifications** section with three cards
(CARF, OhioMHAS, LegitScript). Each already links to the correct verification
page. Right now each shows a temporary checkmark badge — here's how to drop in
the real seals, which you download from each body directly (I can't generate the
official seal art, and a fabricated seal would be both a trademark issue and
misleading):

**CARF seal:** Download your official CARF seal from the CARF provider portal
(Customer Connect). In `index.html`, find the comment `SEAL SLOT: replace ...
CARF seal image` and swap the `<div class="ring">…</div>` right below it for:
`<img src="carf-seal.png" alt="CARF Accredited seal">` (put the image file in
this folder, or base64-embed it the same way the logo is embedded).

**LegitScript seal:** Log into your LegitScript merchant dashboard and copy your
**custom seal embed code** — LegitScript generates a snippet unique to your
certification that auto-displays the current date to show you're active. In
`index.html`, find the comment `SEAL SLOT: paste your custom LegitScript seal
embed code` and replace the `<div class="ring">…</div>` below it with that
snippet.

**OhioMHAS:** OhioMHAS doesn't issue an embeddable web seal, so this card uses a
verified text credential linking to mha.ohio.gov. That's the correct, standard
way to display it — no image needed. (If you have an official OhioMHAS
certification badge from them, you can drop it into that card's seal slot the
same way as CARF.)

Until you add the official seals, the section still looks clean and professional
with the checkmark badges — it's safe to launch as-is and add the real seals
when you have them.
