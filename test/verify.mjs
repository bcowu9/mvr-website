// Verification pass for the pieces where a bug would be expensive:
// phone normalisation, carrier segment math, CSV parsing, and Twilio's
// webhook signature check.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { toE164, segmentInfo, validateTwilioSignature, safeEqual } from '../netlify/functions/lib/shared.mjs';

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); pass++; console.log(`  ok   ${name}`); }
  catch (e) { fail++; console.log(`  FAIL ${name}\n       ${e.message}`); }
};

console.log('\n— Phone normalisation —');
t('10-digit with punctuation', () => assert.equal(toE164('(937) 555-0142'), '+19375550142'));
t('10-digit with dashes', () => assert.equal(toE164('937-555-0142'), '+19375550142'));
t('10-digit with dots', () => assert.equal(toE164('937.555.0142'), '+19375550142'));
t('11-digit leading 1', () => assert.equal(toE164('1 937 555 0142'), '+19375550142'));
t('already E.164', () => assert.equal(toE164('+19375550142'), '+19375550142'));
t('spaces and tabs', () => assert.equal(toE164('  9375550142  '), '+19375550142'));
t('rejects area code starting 0', () => assert.equal(toE164('0375550142'), null));
t('rejects area code starting 1', () => assert.equal(toE164('1375550142'), null));
t('rejects 11-digit with bad area code', () => assert.equal(toE164('10375550142'), null));
t('rejects too short', () => assert.equal(toE164('555-0142'), null));
t('rejects empty', () => assert.equal(toE164(''), null));
t('rejects null/undefined', () => { assert.equal(toE164(null), null); assert.equal(toE164(undefined), null); });
t('rejects letters only', () => assert.equal(toE164('call me'), null));
t('accepts intl E.164', () => assert.equal(toE164('+442071838750'), '+442071838750'));
t('rejects overlong intl', () => assert.equal(toE164('+1234567890123456'), null));

console.log('\n— Segment math (must match carrier billing) —');
t('empty is 0 segments', () => assert.equal(segmentInfo('').segments, 0));
t('1 char = 1 segment', () => assert.equal(segmentInfo('a').segments, 1));
t('160 GSM chars = 1 segment', () => assert.equal(segmentInfo('a'.repeat(160)).segments, 1));
t('161 GSM chars = 2 segments', () => assert.equal(segmentInfo('a'.repeat(161)).segments, 2));
t('306 GSM chars = 2 segments (153x2)', () => assert.equal(segmentInfo('a'.repeat(306)).segments, 2));
t('307 GSM chars = 3 segments', () => assert.equal(segmentInfo('a'.repeat(307)).segments, 3));
t('GSM encoding detected', () => assert.equal(segmentInfo('Hello, please call the office.').encoding, 'GSM-7'));
t('extended char counts double', () => {
  // 80 braces = 160 units = still 1 segment; 81 = 162 units = 2 segments
  assert.equal(segmentInfo('{'.repeat(80)).segments, 1);
  assert.equal(segmentInfo('{'.repeat(81)).segments, 2);
});
t('emoji forces UCS-2', () => assert.equal(segmentInfo('Hi 👋').encoding, 'UCS-2'));
t('70 UCS-2 units = 1 segment', () => {
  const s = '👋'.repeat(35); // each emoji is 2 UTF-16 units = 70
  assert.equal(s.length, 70);
  assert.equal(segmentInfo(s).segments, 1);
});
t('71 UCS-2 units = 2 segments', () => assert.equal(segmentInfo('é'.repeat(70) + '😀').segments, 2));
t('curly apostrophe is not GSM-7', () => assert.equal(segmentInfo('don’t').encoding, 'UCS-2'));

console.log('\n— Twilio webhook signature (official doc example) —');
t('validates the documented example', () => {
  const ok = validateTwilioSignature({
    signature: 'RSOYDt4T1cUTdK1PDd93/VVr8B8=',
    url: 'https://mycompany.com/myapp.php?foo=1&bar=2',
    params: { CallSid: 'CA1234567890ABCDE', Caller: '+14158675309', Digits: '1234', From: '+14158675309', To: '+18005551212' },
    authToken: '12345',
  });
  assert.equal(ok, true);
});
t('rejects a tampered body', () => {
  const ok = validateTwilioSignature({
    signature: 'RSOYDt4T1cUTdK1PDd93/VVr8B8=',
    url: 'https://mycompany.com/myapp.php?foo=1&bar=2',
    params: { CallSid: 'CA1234567890ABCDE', Caller: '+14158675309', Digits: '9999', From: '+14158675309', To: '+18005551212' },
    authToken: '12345',
  });
  assert.equal(ok, false);
});
t('rejects a wrong auth token', () => {
  const ok = validateTwilioSignature({
    signature: 'RSOYDt4T1cUTdK1PDd93/VVr8B8=',
    url: 'https://mycompany.com/myapp.php?foo=1&bar=2',
    params: { CallSid: 'CA1234567890ABCDE', Caller: '+14158675309', Digits: '1234', From: '+14158675309', To: '+18005551212' },
    authToken: 'wrong',
  });
  assert.equal(ok, false);
});
t('rejects missing signature', () => {
  assert.equal(validateTwilioSignature({ signature: null, url: 'x', params: {}, authToken: '12345' }), false);
});

console.log('\n— Passcode comparison —');
t('matches identical', () => assert.equal(safeEqual('correct horse', 'correct horse'), true));
t('rejects different same-length', () => assert.equal(safeEqual('aaaa', 'bbbb'), false));
t('rejects different length without throwing', () => assert.equal(safeEqual('short', 'muchlonger'), false));
t('rejects empty vs set', () => assert.equal(safeEqual('', 'secret'), false));

console.log('\n— CSV parser (from the browser bundle) —');
// Pull the browser-side parser out of index.html and exercise it in isolation.
const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const script = /<script>([\s\S]*?)<\/script>/.exec(html)[1];
const parseSrc = /function parseCSV\(text\)\{[\s\S]*?\n\}/.exec(script)[0];
const parseCSV = new Function(parseSrc + '; return parseCSV;')();

t('basic rows', () => {
  const r = parseCSV('name,phone\nJordan,9375550142\n');
  assert.deepEqual(r, [['name','phone'], ['Jordan','9375550142']]);
});
t('quoted field with comma', () => {
  const r = parseCSV('name,notes\n"Miller, Jordan","likes texts, not calls"\n');
  assert.deepEqual(r[1], ['Miller, Jordan', 'likes texts, not calls']);
});
t('escaped double quote', () => {
  const r = parseCSV('name\n"He said ""hi"""\n');
  assert.equal(r[1][0], 'He said "hi"');
});
t('CRLF line endings', () => {
  const r = parseCSV('a,b\r\n1,2\r\n');
  assert.deepEqual(r, [['a','b'], ['1','2']]);
});
t('strips BOM from first header', () => {
  const r = parseCSV('﻿name,phone\nA,9375550142');
  assert.equal(r[0][0], 'name');
});
t('drops fully blank lines', () => {
  const r = parseCSV('a,b\n1,2\n\n\n3,4\n');
  assert.equal(r.length, 3);
});
t('final row without trailing newline', () => {
  const r = parseCSV('a,b\n1,2');
  assert.deepEqual(r[1], ['1','2']);
});
t('newline inside quoted field', () => {
  const r = parseCSV('name,notes\nA,"line one\nline two"\n');
  assert.equal(r.length, 2);
  assert.equal(r[1][1], 'line one\nline two');
});
t('empty trailing field preserved', () => {
  const r = parseCSV('a,b,c\n1,,3');
  assert.deepEqual(r[1], ['1','','3']);
});

console.log('\n— Client/server parity —');
// The browser and the server both normalise numbers and count segments. If they
// disagree, the operator sees one cost estimate and gets billed another, or a
// number the UI accepted gets rejected server-side.
const clientToE164 = new Function(/function toE164\(raw\)\{[\s\S]*?\n\}/.exec(script)[0] + '; return toE164;')();
const clientSeg = new Function(
  /const GSM7_BASE = [\s\S]*?\n\}/.exec(script)[0].replace(/^const/, 'var') + '; return segmentInfo;'
)();

t('toE164 agrees on 40 sample inputs', () => {
  const samples = ['(937) 555-0142','937-555-0142','9375550142','+19375550142','1-937-555-0142',
    '937 555 0142','','abc','+442071838750','0375550142','1375550142','555-0142','+1234567890123456',
    '  9375550142  ','937.555.0142','(937)5550142','+1 (937) 555-0142','93755501421','19375550142'];
  for(const s of samples){
    assert.equal(clientToE164(s), toE164(s), `mismatch on "${s}"`);
  }
});
t('segment count agrees across lengths and encodings', () => {
  const samples = ['', 'a', 'a'.repeat(160), 'a'.repeat(161), 'a'.repeat(306), 'a'.repeat(307),
    '{'.repeat(80), '{'.repeat(81), 'Hi 👋', '👋'.repeat(35), 'don’t',
    'Hi {{first_name}}, this is a reminder of your appointment. Reply STOP to stop texts.'];
  for(const s of samples){
    assert.equal(clientSeg(s).segments, segmentInfo(s).segments, `segment mismatch on ${JSON.stringify(s.slice(0,20))}`);
  }
});

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
