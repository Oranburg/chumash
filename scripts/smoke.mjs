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

// 7. The Torah blessings module: both blessings export, verbatim from Sefaria,
// each beginning the way the source has it and keeping its nikud.
console.log('\n--- 7. blessings.js (Birkat HaTorah) ---');
try {
  const mod = await import('../src/lib/blessings.js');
  const before = mod.BLESSING_BEFORE;
  const after = mod.BLESSING_AFTER;
  typeof before === 'string' && before.length > 0
    ? pass('BLESSING_BEFORE exports a non-empty string')
    : fail('BLESSING_BEFORE exports a non-empty string');
  typeof after === 'string' && after.length > 0
    ? pass('BLESSING_AFTER exports a non-empty string')
    : fail('BLESSING_AFTER exports a non-empty string');
  // The before-blessing is "asher bachar banu"; the after is "asher natan lanu
  // torat emet". Check the distinguishing word of each, with nikud kept.
  // "torato" (his Torah) closes the chosen-us clause of the before-blessing and
  // does not appear in the after-blessing, so it tells the two apart.
  before && before.includes('תּוֹרָתוֹ')
    ? pass('BLESSING_BEFORE is the asher-bachar-banu blessing')
    : fail('BLESSING_BEFORE is the asher-bachar-banu blessing');
  after && after.includes('אֱמֶת')
    ? pass('BLESSING_AFTER is the torat-emet blessing')
    : fail('BLESSING_AFTER is the torat-emet blessing');
  // Both keep their nikud (a vowel point is present in the U+05B0..U+05BC range).
  /[ְ-ּ]/.test(before || '')
    ? pass('BLESSING_BEFORE keeps its nikud')
    : fail('BLESSING_BEFORE keeps its nikud');
} catch (err) { fail('blessings.js imports', err.message); }

// 8. The home page wiring: the aliyah-of-the-day hero pulls in the blessings, the
// flowing column, the word popover, and the day's aliyah text.
console.log('\n--- 8. ThisWeek home wiring ---');
try {
  const src = readFileSync(resolve(root, 'src/pages/ThisWeek.jsx'), 'utf8');
  src.includes("from '../lib/blessings.js'") ? pass('home imports the blessings') : fail('home imports the blessings');
  src.includes('BLESSING_BEFORE') && src.includes('BLESSING_AFTER')
    ? pass('home renders both blessings') : fail('home renders both blessings');
  src.includes('ScrollColumn') ? pass('home uses the scroll column') : fail('home uses the scroll column');
  src.includes('StudyTable') ? pass('home uses the study table') : fail('home uses the study table');
  src.includes('WordPopover') ? pass('home wires WordPopover') : fail('home wires WordPopover');
  src.includes('getParshaText') ? pass('home fetches the aliyah text') : fail('home fetches the aliyah text');
  src.includes('ALIYAH_LABELS') ? pass('home labels the aliyah') : fail('home labels the aliyah');
  src.includes('var(--gold)') ? pass('home styles the blessings in gold') : fail('home styles the blessings in gold');
  // The scroll is the default; the study table is the toggle.
  src.includes("'scroll'") && src.includes("'study'")
    ? pass('home carries the scroll and study views') : fail('home carries the scroll and study views');
  src.includes('ashkenazi') && src.includes('sefardi')
    ? pass('home carries the scribal-tradition switch') : fail('home carries the scribal-tradition switch');
} catch (err) { fail('src/pages/ThisWeek.jsx readable', err.message); }

// 9. The scroll hero: bare consonants for display, vocalized for lookup. The
// scroll strips both nikud and te'amim, and the ScrollColumn carries the
// original vocalized word to the tap handler so transliteration stays correct.
console.log('\n--- 9. scroll hero ---');
try {
  const mod = await import('../src/lib/sefaria.js');
  typeof mod.stripVowels === 'function'
    ? pass('stripVowels is a function') : fail('stripVowels is a function');
  if (typeof mod.stripVowels === 'function') {
    const bare = mod.stripVowels('בְּרֵאשִׁ֖ית');
    bare === 'בראשית'
      ? pass('stripVowels reduces to bare consonants')
      : fail('stripVowels reduces to bare consonants', `got "${bare}"`);
  }
  const scrollSrc = readFileSync(resolve(root, 'src/components/ScrollColumn.jsx'), 'utf8');
  scrollSrc.includes('stripVowels') ? pass('ScrollColumn strips vowels for display') : fail('ScrollColumn strips vowels for display');
  // The lookup uses the vocalized token (tok), not the stripped display form.
  scrollSrc.includes('wordHandlers(tok')
    ? pass('ScrollColumn looks up the vocalized word') : fail('ScrollColumn looks up the vocalized word');
} catch (err) { fail('scroll hero pieces', err.message); }

// 10. The study table: four cells with the English merged across the bottom, and
// the parchment + scroll + study CSS is present.
console.log('\n--- 10. study table + styles ---');
try {
  const studySrc = readFileSync(resolve(root, 'src/components/StudyTable.jsx'), 'utf8');
  studySrc.includes('study-cell--translit') && studySrc.includes('study-cell--hebrew') && studySrc.includes('study-cell--english')
    ? pass('study table renders the three cells') : fail('study table renders the three cells');
  const css = readFileSync(resolve(root, 'src/index.css'), 'utf8');
  css.includes('.scroll-panel') ? pass('scroll-panel style present') : fail('scroll-panel style present');
  css.includes("grid-template-areas") && css.includes('english english')
    ? pass('study verse merges the English row') : fail('study verse merges the English row');
  const tokens = readFileSync(resolve(root, 'src/styles/tokens.css'), 'utf8');
  tokens.includes('Stam Ashkenaz CLM') && tokens.includes('Stam Sefarad CLM')
    ? pass('both STaM @font-face declarations present') : fail('both STaM @font-face declarations present');
  tokens.includes('--parchment') ? pass('parchment token present') : fail('parchment token present');
} catch (err) { fail('study table + styles', err.message); }

// 11. The self-hosted STaM font files and their open license actually ship.
console.log('\n--- 11. STaM font files + license ---');
try {
  const ash = readFileSync(resolve(root, 'public/fonts/StamAshkenazCLM.ttf'));
  const sef = readFileSync(resolve(root, 'public/fonts/StamSefaradCLM.ttf'));
  ash.length > 1000 ? pass('Stam Ashkenaz CLM ttf present') : fail('Stam Ashkenaz CLM ttf present', `${ash.length} bytes`);
  sef.length > 1000 ? pass('Stam Sefarad CLM ttf present') : fail('Stam Sefarad CLM ttf present', `${sef.length} bytes`);
  // A TrueType file starts with 0x00010000 or 'true' or 'OTTO'; check the sfnt tag.
  const tag = ash.subarray(0, 4);
  (tag[0] === 0 && tag[1] === 1 && tag[2] === 0 && tag[3] === 0) || tag.toString('ascii') === 'true'
    ? pass('Ashkenaz ttf has a valid sfnt header') : fail('Ashkenaz ttf has a valid sfnt header');
  const lic = readFileSync(resolve(root, 'public/fonts/CULMUS-STAM-LICENSE.txt'), 'utf8');
  /GNU General Public License/i.test(lic) && /special exception/i.test(lic)
    ? pass('font license is GPL with the font exception') : fail('font license is GPL with the font exception');
} catch (err) { fail('STaM font files + license', err.message); }

// 12. The per-verse classical commentary: the data function exists and filters
// to exactly the six target parshanim, and the panel lazy-loads with explicit
// loading, error, empty, and done states, keyed on stable inputs (not on the
// status it sets) so React 18 StrictMode's double-invoke still resolves.
console.log('\n--- 12. per-verse commentary ---');
try {
  const mod = await import('../src/lib/sefaria.js');
  typeof mod.getVerseCommentaries === 'function'
    ? pass('getVerseCommentaries is a function') : fail('getVerseCommentaries is a function');

  const libSrc = readFileSync(resolve(root, 'src/lib/sefaria.js'), 'utf8');
  // The six commentators are named, in the fixed order, and the function filters
  // to them rather than passing every linked work through.
  ['Onkelos', 'Rashi', 'Rashbam', 'Ibn Ezra', 'Ramban', 'Sforno']
    .forEach((name) => {
      libSrc.includes(`'${name}'`) ? pass(`commentary filters in ${name}`) : fail(`commentary filters in ${name}`);
    });
  libSrc.includes('with_text=1')
    ? pass('commentary fetches link text inline (with_text=1)') : fail('commentary fetches link text inline (with_text=1)');

  const compSrc = readFileSync(resolve(root, 'src/components/VerseCommentary.jsx'), 'utf8');
  // Lazy load: the fetch fires only when the panel is open.
  compSrc.includes('getVerseCommentaries')
    ? pass('panel calls getVerseCommentaries') : fail('panel calls getVerseCommentaries');
  /if\s*\(!open\)\s*return/.test(compSrc)
    ? pass('panel load effect lazy-loads on open') : fail('panel load effect lazy-loads on open');
  // The four explicit states a reader can land in.
  compSrc.includes("status === 'loading'") ? pass('panel has a loading state') : fail('panel has a loading state');
  compSrc.includes("status === 'error'") ? pass('panel has an error state') : fail('panel has an error state');
  compSrc.includes('entries.length === 0') ? pass('panel has an empty state') : fail('panel has an empty state');
  compSrc.includes('Try again') ? pass('panel offers a retry, not a perpetual spinner') : fail('panel offers a retry');
  // The StrictMode-safe effect: keyed on [open, verseRef, attempt], and the
  // status it sets is NOT in the dependency array and does NOT gate the load.
  /\[open,\s*verseRef,\s*attempt\]/.test(compSrc)
    ? pass('load effect keyed on stable inputs [open, verseRef, attempt]')
    : fail('load effect keyed on stable inputs [open, verseRef, attempt]');
  /status\s*!==\s*'idle'/.test(compSrc)
    ? fail('load effect must NOT gate on its own status')
    : pass('load effect does not gate on its own status');

  const readerSrc = readFileSync(resolve(root, 'src/components/ParshaReader.jsx'), 'utf8');
  readerSrc.includes('VerseCommentary')
    ? pass('ParshaReader wires the commentary panel') : fail('ParshaReader wires the commentary panel');
} catch (err) { fail('per-verse commentary pieces', err.message); }

console.log(`\n${passes + failures} checks: ${passes} passed, ${failures} failed`);
if (failures > 0) process.exit(1);
