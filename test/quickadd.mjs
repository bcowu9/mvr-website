// Drives the new manual add-contact form in a real browser.
import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1180, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto('http://localhost:8787/');
await page.fill('#passInput', 'test-passcode');
await page.click('#passBtn');
await page.waitForSelector('#app', { state: 'visible' });
await page.waitForTimeout(700);
await page.click('nav.tabs button[data-tab="contacts"]');

const add = async (name, phone, group, consent) => {
  await page.fill('#qaName', name);
  await page.fill('#qaPhone', phone);
  await page.fill('#qaGroup', group);
  if (consent) await page.check('#qaConsent'); else await page.uncheck('#qaConsent');
  await page.click('#qaAdd');
  await page.waitForTimeout(220);
  return (await page.textContent('#qaMsg')).replace(/\s+/g, ' ').trim();
};

console.log('valid + consent   :', await add('Jordan Miller', '(937) 555-0142', 'Monday Group', true));
console.log('no consent        :', await add('Sam Rivera', '937-555-0198', 'Alumni', false));
console.log('duplicate number  :', await add('Jordan M.', '9375550142', 'Alumni', true));
console.log('bad number        :', await add('Nobody', 'not a phone', 'Alumni', true));

// The group field should persist between adds; name and phone should clear.
console.log('group field kept  :', JSON.stringify(await page.inputValue('#qaGroup')));
console.log('name field cleared:', JSON.stringify(await page.inputValue('#qaName')));

const rows = await page.$$eval('#contactTable tbody tr', (trs) =>
  trs.slice(1).map((tr) => [...tr.querySelectorAll('td')].slice(0, 4).map((td) => td.innerText.replace(/\s+/g, ' ').trim())));
console.log('\ncontact table:');
rows.forEach((r) => console.log('  ', r.join(' | ')));

// Duplicate must merge, not create a second row for the same number.
const jordan = rows.filter((r) => r[1].includes('555-0142'));
console.log('\nrows for 555-0142 (must be 1):', jordan.length);

// A no-consent contact must not be selectable as a recipient.
await page.click('nav.tabs button[data-tab="compose"]');
await page.waitForTimeout(200);
const people = await page.$$eval('#personSel option', (os) => os.map((o) => o.textContent.trim()));
console.log('recipient dropdown:', people);

await page.screenshot({ path: '/tmp/quickadd.png', fullPage: true });
console.log('\npage errors:', errors.length ? errors : 'none');
await browser.close();
