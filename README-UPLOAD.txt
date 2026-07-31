MIAMI VALLEY RECOVERY — WEBSITE FILES
=====================================

WHAT THIS IS
------------
This folder is your complete website: 15 HTML pages that link to each other.
All images (logos, staff photos, insurance logos) are built INTO the HTML,
so there are no separate image files to manage — the folder is self-contained.

KEEP ALL FILES TOGETHER in this one folder. The pages link to each other by
filename, so they must stay in the same folder for the navigation to work.

THE PAGES
---------
  index.html ......................... Homepage
  about.html ......................... About Us
  team.html .......................... Meet the Team
  what-is-addiction.html ............. What Is Addiction
  admissions.html .................... Get Started / Assessment request form
  insurance.html ..................... Insurance & Payment / verification form
  contact.html ....................... Contact
  dayton-ohio.html ................... Dayton location
  middletown-ohio.html ............... Middletown (Coming Soon)
  outpatient-treatment.html .......... Service page
  medication-assisted-treatment.html . Service page
  suboxone-treatment.html ............ Service page
  alcohol-addiction-treatment.html ... Service page
  drug-addiction-treatment.html ...... Service page
  mothers-on-buprenorphine.html ...... M.O.B. Program service page

(mvr-logo.png and mvr-logo-light.png are spare copies of the logo. The site
does NOT need them to work — the logos are already embedded in the pages — but
they're here in case you want the logo files for other uses.)

HOW TO PUT IT ONLINE (Netlify, drag-and-drop)
---------------------------------------------
1. Make a free account at app.netlify.com
2. Go to "Sites" and find the drag-and-drop area
   (or: Add new site -> Deploy manually)
3. Drag THIS ENTIRE FOLDER onto the drop zone
4. Netlify gives you a live URL in a few seconds — open it and click around
5. (Optional) Site configuration -> Change site name -> pick a cleaner name
6. Connect your domain (miamivalleyrecovery.com):
   Domain management -> Add a domain -> follow the DNS steps.
   Free SSL/HTTPS is added automatically.

AFTER IT'S LIVE — CONNECT THE FORMS
-----------------------------------
The Admissions and Insurance pages have forms set up for Netlify Forms.
To receive submissions by email:
  1. Submit each form once on the LIVE site (Netlify registers a form only
     after it sees one real submission — local previews don't count)
  2. In Netlify: Site configuration -> Forms -> Form notifications ->
     Add notification -> Email notification
  3. Send to: info@miamivalleyrecovery.com
     (do this for both the "assessment-request" and "insurance-verification" forms)

  NOTE: If you switch these to JotForm instead, you'll manage submissions and
  notifications inside JotForm, and this Netlify step no longer applies.

UPDATING THE SITE LATER
-----------------------
- Small text changes: open any .html file in a text editor, edit, save.
- Bigger changes: send the files back to your developer/Claude for edits.
- To publish an update: drag the whole folder onto your site's "Deploys" tab
  in Netlify. It replaces the live version instantly.
- IMPORTANT: after redeploying, hard-refresh your browser (Ctrl+Shift+R on
  Windows, Cmd+Shift+R on Mac) or use a private window, so you see the new
  version and not a cached old one.

THINGS TO REVIEW BEFORE/AFTER LAUNCH
------------------------------------
- Have your clinical lead review the service pages (medications, program
  descriptions) for accuracy.
- Confirm the insurance plans listed match what you're actually contracted with.
- Add your official CARF and LegitScript seals when you have them (see DEPLOY.md).
- Check the team page photos on the live site after a hard refresh.
