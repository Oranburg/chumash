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
  typeof mod.getThisWeeksParsha === 'function' ? pass('getThisWeeksParsha is defined') : fail('getThisWeeksParsha defined');
} catch (err) { fail('parsha.js imports', err.message); }

// 4. App shell and the real routes.
console.log('\n--- 4. App.jsx shell ---');
try {
  const src = readFileSync(resolve(root, 'src/App.jsx'), 'utf8');
  src.includes('path="/"') ? pass('home route registered') : fail('home route registered');
  src.includes('HashRouter') ? pass('uses HashRouter') : fail('uses HashRouter');
  src.includes('path="/browse"') ? pass('browse route registered') : fail('browse route registered');
  src.includes('path="/parsha/:name"') ? pass('reading route registered') : fail('reading route registered');
} catch (err) { fail('src/App.jsx readable', err.message); }

// 5. The parsha calendar and fetch layer (the build of this increment). The
// network calls are not exercised here (the smoke test stays offline); these
// check that the functions exist and that the pure helpers behave.
console.log('\n--- 5. parsha calendar + fetch layer ---');
try {
  const mod = await import('../src/lib/parsha.js');
  ['getThisWeeksParsha', 'getParshaReading', 'getParshaIndex', 'getAliyot', 'getHaftarah', 'parshiyotForBook']
    .forEach((fn) => {
      typeof mod[fn] === 'function' ? pass(`${fn} is a function`) : fail(`${fn} is a function`);
    });
  const index = mod.getParshaIndex();
  index.length === 5 ? pass('index has 5 books') : fail('index has 5 books', `got ${index.length}`);
  const total = index.reduce((n, b) => n + b.parshiyot.length, 0);
  total === 54 ? pass('index covers 54 portions') : fail('index covers 54 portions', `got ${total}`);
  const deut = mod.parshiyotForBook('deuteronomy');
  deut[0] === 'Devarim' ? pass('Deuteronomy starts at Devarim') : fail('Deuteronomy starts at Devarim', deut[0]);
} catch (err) { fail('parsha.js calendar layer', err.message); }

// 6. The Sefaria text layer carried over and extended for the parsha.
console.log('\n--- 6. sefaria parsha text layer ---');
try {
  const mod = await import('../src/lib/sefaria.js');
  typeof mod.getParshaText === 'function' ? pass('getParshaText is a function') : fail('getParshaText is a function');
  typeof mod.stripCantillation === 'function' ? pass('stripCantillation is a function') : fail('stripCantillation is a function');
  if (typeof mod.stripCantillation === 'function') {
    // A pointed, cantillated word keeps its vowels and loses its te'amim.
    const cantillated = 'בְּרֵאשִׁ֖ית';
    const bare = mod.stripCantillation(cantillated);
    bare === 'בְּרֵאשִׁית'
      ? pass('stripCantillation keeps nikud, drops te\'amim')
      : fail('stripCantillation keeps nikud, drops te\'amim', `got "${bare}"`);
  }
} catch (err) { fail('sefaria.js parsha layer', err.message); }

console.log(`\n${passes + failures} checks: ${passes} passed, ${failures} failed`);
if (failures > 0) process.exit(1);
