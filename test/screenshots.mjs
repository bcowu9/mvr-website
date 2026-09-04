import { chromium } from 'playwright';
import fs from 'node:fs';

const CSV = `name,phone,group,consent,notes
Jordan Miller,(937) 555-0142,Monday Group,yes,Prefers texts after 5pm
Sam Rivera,937-555-0198,Alumni,yes,
Alex Chen,+19375550171,Monday Group,no,Consent form not signed
Dana Brooks,937.555.0188,Monday Group,yes,
Chris Vaughn,9375550155,Alumni,yes,
Robin Salas,(937) 555-0166,Monday Group,yes,
Pat Okonkwo,937-555-0177,Family Support,yes,
Lee Whitfield,not a number,Alumni,yes,bad row on purpose
`;
fs.writeFileSync('/tmp/contacts.csv', CSV);

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto('http://localhost:8787/');
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/shot-1-lock.png' });

// Wrong passcode path
await page.fill('#passInput', 'wrong');
await page.click('#passBtn');
await page.waitForTimeout(500);
const errText = await page.textContent('#passErr');
console.log('wrong passcode message:', JSON.stringify(errText));

await page.fill('#passInput', 'test-passcode');
await page.click('#passBtn');
await page.waitForSelector('#app', { state: 'visible' });
await page.waitForTimeout(900);
await page.screenshot({ path: '/tmp/shot-2-compose-empty.png' });

// Load contacts
await page.click('nav.tabs button[data-tab="contacts"]');
await page.setInputFiles('#fileInput', '/tmp/contacts.csv');
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/shot-3-contacts.png', fullPage: true });

const importText = await page.textContent('#importReport');
console.log('import report:', importText.replace(/\s+/g, ' ').trim().slice(0, 260));

// Compose a broadcast that trips guardrails
await page.click('nav.tabs button[data-tab="compose"]');
await page.selectOption('#modeSel', 'broadcast');
await page.waitForTimeout(200);
await page.selectOption('#groupSel', 'Monday Group');
await page.fill('#bodyInput', 'Hi {{first_name}}, your counselor moved the Monday relapse prevention group to 6pm. Check https://bit.ly/mvr for details.');
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/shot-4-guardrails.png', fullPage: true });

const guard = await page.textContent('#guardrails');
console.log('\nguardrails fired:\n', guard.replace(/\s+/g, ' ').trim().slice(0, 700));
console.log('\nsegments:', await page.textContent('#segCount'), '| chars:', await page.textContent('#charCount'), '| cost:', await page.textContent('#costEst'));
console.log('audience:', (await page.textContent('#audienceSummary')).replace(/\s+/g,' ').trim());

// Clean message + review modal
await page.fill('#bodyInput', 'Hi {{first_name}}, this is a reminder from Miami Valley Recovery: our Monday meeting moved to 6pm this week. Call the office with questions. Reply STOP to stop texts.');
await page.waitForTimeout(300);
await page.click('#reviewBtn');
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/shot-5-review.png' });

const sendDisabled = await page.isDisabled('#confirmSend');
console.log('\nSend button disabled before acknowledgement:', sendDisabled);
await page.check('#ackChk');
await page.waitForTimeout(150);
console.log('Send button disabled after acknowledgement:', await page.isDisabled('#confirmSend'));

await page.click('#confirmSend');
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/shot-6-results.png' });
console.log('result modal:', (await page.textContent('#modalBox')).replace(/\s+/g,' ').trim().slice(0, 200));
await page.click('#closeResults');

// Inbox
await page.click('nav.tabs button[data-tab="inbox"]');
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/shot-7-inbox.png', fullPage: true });

// Opt-outs
await page.click('nav.tabs button[data-tab="optouts"]');
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/shot-8-optouts.png', fullPage: true });

// Activity + setup
await page.click('nav.tabs button[data-tab="log"]');
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/shot-9-log.png', fullPage: true });

await page.click('nav.tabs button[data-tab="setup"]');
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/shot-10-setup.png', fullPage: true });

// Mobile check
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto('http://localhost:8787/');
await mobile.fill('#passInput', 'test-passcode');
await mobile.click('#passBtn');
await mobile.waitForSelector('#app', { state: 'visible' });
await mobile.waitForTimeout(800);
await mobile.screenshot({ path: '/tmp/shot-11-mobile.png', fullPage: true });

console.log('\nconsole errors:', errors.length ? errors : 'none');
await browser.close();
