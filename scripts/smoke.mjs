// Smoke test for the Chumash scaffold.
//
// The parsha experience is not built yet, so this checks the carried-over
// infrastructure and the new Torah-structure data, not daf-era features:
//   1. transliterate() reproduces the worked examples from the scheme.
//   2. sefariaUrl() builds the expected canonical Sefaria URL.
//   3. parsha.js holds the right Torah structure (5 books, 54 portions, 7 pairs).
//   4. src/App.jsx is a valid shell with a home route.
//
// Exit code 0 = all pass. Non-zero = one or more failures.
// Run: node scripts/smoke.mjs

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

let failures = 0;
let passes = 0;
const pass = (l) => { console.log(`PASS  ${l}`); passes++; };
const fail = (l, d) => { console.error(`FAIL  ${l}${d ? ': ' + d : ''}`); failures++; };

// 1. Transliteration worked examples (engine carried over from havruta).
console.log('\n--- 1. Transliteration ---');
let transliterate;
try {
  ({ transliterate } = await import('../src/lib/transliterate.js'));
  if (typeof transliterate !== 'function') throw new Error('not a function');
  pass('transliterate module imports');
} catch (err) { fail('transliterate module imports', err.message); }
if (transliterate) {
  const cases = [
    { input: 'כָּל', expected: 'kol', label: 'kamats katan: kol' },
    { input: 'חָכְמָה', expected: 'ḥokhmah', label: 'ḥet: ḥokhmah' },
    { input: 'יְהוּדָה', expected: 'yehuda', label: 'vocal shva: yehuda' },
    { input: 'שַׁבָּת', expected: 'shabbat', label: 'dagesh forte: shabbat' },
  ];
  for (const { input, expected, label } of cases) {
    const got = transliterate(input);
    got === expected ? pass(label) : fail(label, `got "${got}", expected "${expected}"`);
  }
}

// 2. sefariaUrl() canonical URL check.
console.log('\n--- 2. sefariaUrl ---');
let sefariaUrl;
try {
  ({ sefariaUrl } = await import('../src/lib/sefaria.js'));
  if (typeof sefariaUrl !== 'function') throw new Error('not a function');
  pass('sefariaUrl imports');
} catch (err) { fail('sefariaUrl imports', err.message); }
if (sefariaUrl) {
  const urlCases = [
    { input: 'Genesis 1:1', expected: 'https://www.sefaria.org/Genesis_1.1', label: 'Genesis 1:1 -> Genesis_1.1' },
    { input: 'Onkelos Genesis 1:1', expected: 'https://www.sefaria.org/Onkelos_Genesis_1.1', label: 'Onkelos ref' },
    { input: '', expected: 'https://www.sefaria.org/', label: 'empty ref -> root URL' },
  ];
  for (const { input, expected, label } of urlCases) {
    const got = sefariaUrl(input);
    got === expected ? pass(label) : fail(label, `got "${got}", expected "${expected}"`);
  }
}

// 3. Torah structure data.
console.log('\n--- 3. parsha.js Torah structure ---');
try {
  const mod = await import('../src/lib/parsha.js');
  mod.BOOKS?.length === 5 ? pass('5 books') : fail('5 books', `got ${mod.BOOKS?.length}`);
  mod.PARSHIYOT?.length === 54 ? pass('54 portions') : fail('54 portions', `got ${mod.PARSHIYOT?.length}`);
  mod.DOUBLED_PAIRS?.length === 7 ? pass('7 doubled pairs') : fail('7 doubled pairs', `got ${mod.DOUBLED_PAIRS?.length}`);
  mod.PARSHIYOT?.[0] === 'Bereshit' ? pass('first portion is Bereshit') : fail('first portion is Bereshit', mod.PARSHIYOT?.[0]);
  typeof mod.getThisWeeksParsha === 'function' ? pass('getThisWeeksParsha is defined (stub)') : fail('getThisWeeksParsha defined');
} catch (err) { fail('parsha.js imports', err.message); }

// 4. App shell.
console.log('\n--- 4. App.jsx shell ---');
try {
  const src = readFileSync(resolve(root, 'src/App.jsx'), 'utf8');
  src.includes('path="/"') ? pass('home route registered') : fail('home route registered');
  src.includes('HashRouter') ? pass('uses HashRouter') : fail('uses HashRouter');
} catch (err) { fail('src/App.jsx readable', err.message); }

console.log(`\n${passes + failures} checks: ${passes} passed, ${failures} failed`);
if (failures > 0) process.exit(1);
