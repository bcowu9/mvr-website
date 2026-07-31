# How to put your website on GitHub (no command line needed)

This guide uses GitHub's website — you upload files by dragging them, the same
easy way you'd use Netlify's drag-and-drop.

Everything in THIS folder should go into the repository at the top level
(so `index.html` sits at the root — that's required for hosting to work).

---

## PART 1 — Create your GitHub account (one time)

1. Go to https://github.com and click **Sign up**.
2. Follow the prompts (email, password, username). The free plan is all you need.
3. Verify your email when GitHub asks.

---

## PART 2 — Create a repository ("repo" = a project folder on GitHub)

1. Once logged in, click the **+** icon in the top-right corner → **New repository**.
2. **Repository name:** type something like `mvr-website` (no spaces).
3. Set it to **Public** (required for free GitHub Pages; fine either way if you'll
   use Netlify).
4. Do NOT check "Add a README" — leave the extra options unchecked so the repo
   starts empty.
5. Click **Create repository**.

---

## PART 3 — Upload your website files

1. On the new empty repo page, find the link that says
   **"uploading an existing file"** (in the "…or" section near the top).
   - Or click **Add file** → **Upload files**.
2. Open the folder these files are in on your computer.
3. **Select ALL the files** in this folder (all the .html files, the two .png
   logos, netlify.toml, .gitignore) and **drag them into the upload box** on
   GitHub.
   - IMPORTANT: drag the FILES themselves, not the folder that contains them.
     GitHub should list index.html, about.html, team.html, etc. at the top level.
4. Scroll down. Under "Commit changes," you can leave the default message
   (or type "Initial website upload").
5. Click **Commit changes**. GitHub uploads everything.

Your website files now live on GitHub. 🎉 (This isn't a live website yet —
Part 4 makes it live.)

---

## PART 4 — Make it a live website

You have two choices. **Option A (GitHub + Netlify) is recommended** because it
keeps the contact/insurance forms working.

### Option A — Connect the repo to Netlify (recommended)

1. Go to https://app.netlify.com and log in (or sign up — free).
2. Click **Add new site** → **Import an existing project**.
3. Choose **GitHub** and authorize Netlify to access your GitHub.
4. Pick your `mvr-website` repository from the list.
5. Leave the build settings as they are (this site needs no build step —
   the included `netlify.toml` tells Netlify to just publish the files).
6. Click **Deploy**. In a few seconds you get a live URL.
7. From now on: whenever you change a file on GitHub, Netlify automatically
   updates the live site. No more manual uploads.

Then finish the form setup (see FORMS note below) and connect your domain
under **Domain management → Add a domain**.

### Option B — GitHub Pages (GitHub hosts it directly, no Netlify)

1. In your repo, click **Settings** (top menu) → **Pages** (left sidebar).
2. Under "Build and deployment," set **Source** to **Deploy from a branch**.
3. Set the branch to **main** and the folder to **/ (root)**. Click **Save**.
4. Wait ~1 minute, refresh the page — GitHub shows your live URL
   (like `https://YOURNAME.github.io/mvr-website/`).
5. To use your real domain, add it under the same Pages settings ("Custom domain").

   ⚠️ NOTE: GitHub Pages does NOT run Netlify Forms. If you choose Option B,
   your Admissions and Insurance forms won't email you until you switch them to
   JotForm or Formspree. (If you're planning JotForm anyway, this is fine.)

---

## UPDATING THE SITE LATER (the GitHub advantage)

- On GitHub, open any file, click the ✏️ pencil icon, edit the text, then
  **Commit changes**. If you're on Netlify (Option A), the live site updates by
  itself within a minute. No re-uploading folders.
- Bigger changes: send the files to your developer/Claude, get updated files
  back, and upload them the same drag-and-drop way (GitHub replaces the old
  versions).
- Every change is saved in history, so a bad edit can always be undone.

---

## FORMS reminder (Option A / Netlify)

After the site is live on Netlify:
1. Submit the Admissions and Insurance forms once on the LIVE site.
2. Netlify → Site configuration → Forms → Form notifications →
   Add notification → Email notification → send to
   **info@miamivalleyrecovery.com** (for both "assessment-request" and
   "insurance-verification").

(If you switch to JotForm, manage submissions inside JotForm instead.)

---

## If you prefer clicks over the website: GitHub Desktop

GitHub also has a free app called **GitHub Desktop** (desktop.github.com) that
lets you manage all of this with buttons instead of the website. If you plan to
update often, it's worth installing — but the website method above is enough to
get launched.
