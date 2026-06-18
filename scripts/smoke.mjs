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

import { readFileSync, existsSync } from 'fs';
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

// 13. The verse study partner: the system prompt and the chumash- storage keys
// export, the prompt mirrors docs/PARTNER-PROMPT.md verbatim, and the builder
// fills {{VERSE_REF}}.
console.log('\n--- 13. verse partner: prompt + storage keys ---');
try {
  const mod = await import('../src/lib/partner.js');
  typeof mod.PARTNER_SYSTEM_PROMPT === 'string' && mod.PARTNER_SYSTEM_PROMPT.length > 0
    ? pass('partner.js exports PARTNER_SYSTEM_PROMPT') : fail('partner.js exports PARTNER_SYSTEM_PROMPT');
  // The storage keys are chumash-prefixed, not havruta-prefixed.
  mod.PROVIDER_STORAGE === 'chumash-provider'
    ? pass('PROVIDER_STORAGE is chumash-prefixed') : fail('PROVIDER_STORAGE is chumash-prefixed', mod.PROVIDER_STORAGE);
  mod.LEVEL_STORAGE === 'chumash-level'
    ? pass('LEVEL_STORAGE is chumash-prefixed') : fail('LEVEL_STORAGE is chumash-prefixed', mod.LEVEL_STORAGE);
  if (typeof mod.keyStorageFor === 'function') {
    mod.keyStorageFor('anthropic') === 'chumash-key-anthropic'
      ? pass('keyStorageFor builds a chumash- key') : fail('keyStorageFor builds a chumash- key', mod.keyStorageFor('anthropic'));
  } else { fail('keyStorageFor is a function'); }
  // No havruta- key leaks through.
  const partnerSrc = readFileSync(resolve(root, 'src/lib/partner.js'), 'utf8');
  /havruta-/.test(partnerSrc)
    ? fail('partner.js must not carry havruta- storage keys') : pass('partner.js carries no havruta- storage keys');
  // The prompt mirrors the doc: pull the fenced block out of PARTNER-PROMPT.md
  // and compare it verbatim to the exported prompt.
  const doc = readFileSync(resolve(root, 'docs/PARTNER-PROMPT.md'), 'utf8');
  const fence = doc.match(/```\n([\s\S]*?)\n```/);
  if (fence && mod.PARTNER_SYSTEM_PROMPT) {
    fence[1] === mod.PARTNER_SYSTEM_PROMPT
      ? pass('partner.js prompt mirrors docs/PARTNER-PROMPT.md verbatim')
      : fail('partner.js prompt mirrors docs/PARTNER-PROMPT.md verbatim', 'fenced block and export differ');
  } else { fail('docs/PARTNER-PROMPT.md has a fenced prompt block'); }
  // The prompt names the Leibowitz method and keeps the {{VERSE_REF}} placeholder.
  /what is bothering Rashi/i.test(mod.PARTNER_SYSTEM_PROMPT)
    ? pass('prompt names the Leibowitz method') : fail('prompt names the Leibowitz method');
  mod.PARTNER_SYSTEM_PROMPT.includes('{{VERSE_REF}}')
    ? pass('prompt carries the {{VERSE_REF}} placeholder') : fail('prompt carries the {{VERSE_REF}} placeholder');
  if (typeof mod.buildSystemPrompt === 'function') {
    const built = mod.buildSystemPrompt('Genesis 1:1', 'a casual scholar');
    built.includes('Genesis 1:1') && !built.includes('{{VERSE_REF}}')
      ? pass('buildSystemPrompt fills {{VERSE_REF}}') : fail('buildSystemPrompt fills {{VERSE_REF}}');
  } else { fail('buildSystemPrompt is a function'); }
} catch (err) { fail('verse partner prompt + keys', err.message); }

// 14. The Settings route and page exist and use chumash- keys.
console.log('\n--- 14. Settings route + page ---');
try {
  const appSrc = readFileSync(resolve(root, 'src/App.jsx'), 'utf8');
  appSrc.includes('path="/settings"') ? pass('settings route registered') : fail('settings route registered');
  appSrc.includes("import Settings from './pages/Settings.jsx'") ? pass('App imports the Settings page') : fail('App imports the Settings page');
  appSrc.includes("to: '/settings'") ? pass('settings nav entry present') : fail('settings nav entry present');
  const setSrc = readFileSync(resolve(root, 'src/pages/Settings.jsx'), 'utf8');
  setSrc.includes('keyStorageFor') ? pass('Settings stores the key under a chumash- key') : fail('Settings stores the key under a chumash- key');
  /havruta-/.test(setSrc) ? fail('Settings must not carry havruta- keys') : pass('Settings carries no havruta- keys');
  // The key is never hardcoded: no inline sk-ant-/sk- literal assignment.
  /sk-ant-[A-Za-z0-9]/.test(setSrc) ? fail('Settings must not hardcode a key') : pass('Settings hardcodes no key');
} catch (err) { fail('Settings route + page', err.message); }

// 15. The per-verse action and the human-acts-first gate. The partner must not
// reach the model before the learner submits her first observation: start() is
// called only from the first-reading submit handler, and the conversation hook
// makes no model call until start().
console.log('\n--- 15. per-verse action + human-acts-first gate ---');
try {
  const readerSrc = readFileSync(resolve(root, 'src/components/ParshaReader.jsx'), 'utf8');
  readerSrc.includes('VerseHavruta') ? pass('ParshaReader wires the verse partner') : fail('ParshaReader wires the verse partner');

  const panelSrc = readFileSync(resolve(root, 'src/components/VerseHavruta.jsx'), 'utf8');
  // The labeled, distinct action.
  panelSrc.includes('Study this verse with your havruta')
    ? pass('panel has the labeled per-verse action') : fail('panel has the labeled per-verse action');
  // The gate: start() is reached only through the first-reading submit, which
  // requires a non-empty observation. The reply path uses sendReply, not start.
  panelSrc.includes('submitFirstReading') && /submitFirstReading[\s\S]*?start\(/.test(panelSrc)
    ? pass('start() is gated behind the first-observation submit') : fail('start() is gated behind the first-observation submit');
  /firstReading\.trim\(\)\.length === 0/.test(panelSrc)
    ? pass('the first observation must be non-empty before the partner runs') : fail('the first observation must be non-empty');

  const hookSrc = readFileSync(resolve(root, 'src/lib/usePartnerConversation.js'), 'utf8');
  // The hook only calls the model from runExchange, and runExchange runs only
  // from start() and sendReply(); there is no model call at module scope or in a
  // mount effect. Confirm streamPartner is invoked solely inside runExchange.
  const streamCalls = (hookSrc.match(/streamPartner\(/g) || []).length;
  streamCalls === 1 ? pass('hook calls the model in exactly one place (runExchange)') : fail('hook calls the model in exactly one place', `${streamCalls} call sites`);
  /function start\(/.test(hookSrc) && hookSrc.includes('runExchange()')
    ? pass('hook runs the exchange only after start()/sendReply()') : fail('hook runs the exchange only after start()/sendReply()');
  // The hook must not run the partner from a mount/load effect at all.
  /useEffect\([^)]*streamPartner/.test(hookSrc)
    ? fail('hook must not call the model from an effect') : pass('hook does not call the model from an effect');

  // The missing-key path points at Settings, not an error.
  panelSrc.includes('noKey') && /to="\/settings"/.test(panelSrc)
    ? pass('missing-key path links to /settings') : fail('missing-key path links to /settings');
} catch (err) { fail('per-verse action + gate', err.message); }

// 16. The shnayim mikra tracker: the library keys the record per parsha, carries
// exactly three marks per aliyah, toggles without mutating, and resets cleanly to
// a new portion. The storage access is wrapped so it degrades where unavailable.
console.log('\n--- 16. shnayim mikra tracker ---');
try {
  const mod = await import('../src/lib/shnayimMikra.js');
  // Exactly three marks per aliyah, in the practice's order.
  Array.isArray(mod.MARKS) && mod.MARKS.length === 3
    ? pass('tracker carries three marks per aliyah') : fail('tracker carries three marks per aliyah', `got ${mod.MARKS?.length}`);
  const ids = (mod.MARKS || []).map((m) => m.id);
  JSON.stringify(ids) === JSON.stringify(['hebrew1', 'hebrew2', 'onkelos'])
    ? pass('the three marks are hebrew1, hebrew2, onkelos') : fail('the three marks are hebrew1, hebrew2, onkelos', ids.join(','));
  // The storage key is keyed per parsha by the portion's verse ref, so each week
  // is its own record and a new portion resets cleanly.
  const k1 = mod.storageKey('Numbers 16:1-18:32');
  const k2 = mod.storageKey('Genesis 1:1-6:8');
  k1 !== k2 && k1.startsWith('chumash-shnayim-') && k1.includes('Numbers 16:1-18:32')
    ? pass('storage key is per-parsha and chumash- prefixed') : fail('storage key is per-parsha and chumash- prefixed', k1);
  // toggleMark does not mutate the record passed in and flips one mark.
  const before = {};
  const after = mod.toggleMark(before, 0, 'hebrew1');
  Object.keys(before).length === 0 && after[0] && after[0].hebrew1 === true
    ? pass('toggleMark sets a mark without mutating the input') : fail('toggleMark sets a mark without mutating the input');
  const off = mod.toggleMark(after, 0, 'hebrew1');
  !off[0].hebrew1 ? pass('toggleMark clears a set mark') : fail('toggleMark clears a set mark');
  // marksDone and overallProgress count correctly.
  const rec = { 0: { hebrew1: true, hebrew2: true, onkelos: true }, 1: { hebrew1: true } };
  mod.marksDone(rec, 0) === 3 ? pass('marksDone counts a full aliyah') : fail('marksDone counts a full aliyah', mod.marksDone(rec, 0));
  const ov = mod.overallProgress(rec, 7);
  ov.done === 4 && ov.total === 21
    ? pass('overallProgress totals three marks per aliyah') : fail('overallProgress totals three marks per aliyah', `${ov.done}/${ov.total}`);
  // The storage access is wrapped in try/catch so it degrades gracefully.
  const libSrc = readFileSync(resolve(root, 'src/lib/shnayimMikra.js'), 'utf8');
  /try\s*{[\s\S]*localStorage[\s\S]*}\s*catch/.test(libSrc)
    ? pass('tracker wraps localStorage in try/catch') : fail('tracker wraps localStorage in try/catch');
} catch (err) { fail('shnayim mikra tracker', err.message); }

// 17. The tracker component and its wiring into the home page: three checkboxes
// for the chosen aliyah, the overall count, and the toggle handler.
console.log('\n--- 17. tracker component + home wiring ---');
try {
  const compSrc = readFileSync(resolve(root, 'src/components/ShnayimMikraTracker.jsx'), 'utf8');
  /type="checkbox"/.test(compSrc) ? pass('tracker renders checkboxes') : fail('tracker renders checkboxes');
  compSrc.includes('onToggle') ? pass('tracker calls back to toggle a mark') : fail('tracker calls back to toggle a mark');
  /Shnayim mikra/i.test(compSrc) ? pass('tracker names the practice') : fail('tracker names the practice');

  const homeSrc = readFileSync(resolve(root, 'src/pages/ThisWeek.jsx'), 'utf8');
  homeSrc.includes('ShnayimMikraTracker') ? pass('home renders the tracker') : fail('home renders the tracker');
  homeSrc.includes("from '../lib/shnayimMikra.js'") ? pass('home imports the tracker library') : fail('home imports the tracker library');
  // The record is keyed on the portion's ref and reset when the portion changes.
  homeSrc.includes('readProgress(parshaRef)') ? pass('home reads the per-parsha record') : fail('home reads the per-parsha record');
  homeSrc.includes('writeProgress(parshaRef') ? pass('home persists the per-parsha record') : fail('home persists the per-parsha record');
  /\[parshaRef\]/.test(homeSrc) ? pass('the record effect is keyed on the portion ref') : fail('the record effect is keyed on the portion ref');
} catch (err) { fail('tracker component + home wiring', err.message); }

// 18. Aliyah-a-day: the week of aliyot is presented, today's is marked, any
// aliyah is reachable, and selecting one drives the reading. The reading view is
// no longer pinned to today's weekday alone.
console.log('\n--- 18. aliyah-a-day week view ---');
try {
  const homeSrc = readFileSync(resolve(root, 'src/pages/ThisWeek.jsx'), 'utf8');
  homeSrc.includes('AliyahWeek') ? pass('home renders the week of aliyot') : fail('home renders the week of aliyot');
  homeSrc.includes('aliyahIndexForDate') ? pass('home still maps the weekday to the day aliyah') : fail('home still maps the weekday to the day aliyah');
  // A selectable index lets the learner jump to any aliyah, and it falls back to
  // the day's aliyah when nothing is chosen.
  homeSrc.includes('selectedIndex') ? pass('home carries a selectable aliyah index') : fail('home carries a selectable aliyah index');
  homeSrc.includes('todayIndex') ? pass('home distinguishes today from the chosen aliyah') : fail('home distinguishes today from the chosen aliyah');
  // The week view maps over the aliyot by their actual length (handles a doubled
  // portion that carries more than seven ranges) rather than assuming seven.
  /aliyot\.map\(/.test(homeSrc) ? pass('the week view maps the aliyot by their actual length') : fail('the week view maps the aliyot by their actual length');
} catch (err) { fail('aliyah-a-day week view', err.message); }

// 19. The haftarah route and page: a route reaches the haftarah, the page reuses
// the reading view, loads via getParshaText (through ParshaReader), and reports a
// failure with a retry rather than inventing a reading.
console.log('\n--- 19. haftarah route + page ---');
try {
  const appSrc = readFileSync(resolve(root, 'src/App.jsx'), 'utf8');
  appSrc.includes('path="/haftarah"') ? pass('haftarah route registered') : fail('haftarah route registered');
  appSrc.includes("import Haftarah from './pages/Haftarah.jsx'") ? pass('App imports the Haftarah page') : fail('App imports the Haftarah page');

  const hafSrc = readFileSync(resolve(root, 'src/pages/Haftarah.jsx'), 'utf8');
  // Reuses the reading view, which loads through getParshaText.
  hafSrc.includes('ParshaReader') ? pass('haftarah reuses the ParshaReader') : fail('haftarah reuses the ParshaReader');
  hafSrc.includes('getThisWeeksParsha') ? pass('haftarah resolves the week to get its haftarah ref') : fail('haftarah resolves the week to get its haftarah ref');
  // The haftarah ref is read off the parsha record's haftarah object.
  hafSrc.includes('haftarah.ref') ? pass('haftarah reads the ref off the haftarah object') : fail('haftarah reads the ref off the haftarah object');
  hafSrc.includes('Try again') ? pass('haftarah offers a retry on failure') : fail('haftarah offers a retry on failure');
  // ParshaReader loads through getParshaText, the path haftarot ride on.
  const readerSrc = readFileSync(resolve(root, 'src/components/ParshaReader.jsx'), 'utf8');
  readerSrc.includes('getParshaText') ? pass('the reading view loads the ref through getParshaText') : fail('the reading view loads the ref through getParshaText');

  // The home page offers a path to the haftarah.
  const homeSrc = readFileSync(resolve(root, 'src/pages/ThisWeek.jsx'), 'utf8');
  /to="\/haftarah"/.test(homeSrc) ? pass('home links to the haftarah') : fail('home links to the haftarah');
} catch (err) { fail('haftarah route + page', err.message); }

// 20. The service-worker hardening: autoUpdate plus the workbox flags that purge
// a stale precache, the self-heal registration wired into main, and a chunk-load
// handler guarded by a session flag so neither reload path can loop.
console.log('\n--- 20. service-worker self-heal ---');
try {
  // The PWA options moved from vite.config.js into astro.config.mjs when the
  // build shell became Astro; the @vite-pwa/astro wrapper carries the same
  // workbox config.
  const cfg = readFileSync(resolve(root, 'astro.config.mjs'), 'utf8');
  /registerType:\s*'autoUpdate'/.test(cfg)
    ? pass('VitePWA uses registerType autoUpdate') : fail('VitePWA uses registerType autoUpdate');
  /cleanupOutdatedCaches:\s*true/.test(cfg)
    ? pass('workbox cleanupOutdatedCaches is set') : fail('workbox cleanupOutdatedCaches is set');
  /clientsClaim:\s*true/.test(cfg)
    ? pass('workbox clientsClaim is set') : fail('workbox clientsClaim is set');
  /skipWaiting:\s*true/.test(cfg)
    ? pass('workbox skipWaiting is set') : fail('workbox skipWaiting is set');
  /navigateFallback:/.test(cfg)
    ? pass('workbox has a SPA navigation fallback') : fail('workbox has a SPA navigation fallback');
  // The Culmus font precache is not dropped.
  /globPatterns:\s*\[[^\]]*ttf/.test(cfg)
    ? pass('the STaM font precache is kept (ttf in globPatterns)') : fail('the STaM font precache is kept');

  // Under the island, App.jsx runs initServiceWorker from a mount effect; the
  // old main.jsx is gone with the Vite entry.
  const appSwSrc = readFileSync(resolve(root, 'src/App.jsx'), 'utf8');
  appSwSrc.includes('sw-register') && /initServiceWorker\(\)/.test(appSwSrc)
    ? pass('App.jsx wires the self-heal registration') : fail('App.jsx wires the self-heal registration');

  const reg = readFileSync(resolve(root, 'src/sw-register.js'), 'utf8');
  reg.includes("from 'virtual:pwa-register'")
    ? pass('registration uses the virtual:pwa-register module') : fail('registration uses the virtual:pwa-register module');
  /controllerchange/.test(reg)
    ? pass('a controllerchange reload is wired') : fail('a controllerchange reload is wired');
  // Both reload paths are guarded by a session flag.
  /sessionStorage/.test(reg) && /controller-reloaded|CONTROLLER_RELOAD_FLAG/.test(reg)
    ? pass('the controller-change reload is guarded by a session flag') : fail('the controller-change reload is guarded by a session flag');
  /Failed to fetch dynamically imported module|ChunkLoadError/.test(reg)
    ? pass('the chunk-load error handler exists') : fail('the chunk-load error handler exists');
  /CHUNK_HEAL_FLAG|chunk-heal-attempted/.test(reg)
    ? pass('the chunk-load self-heal is guarded by a session flag') : fail('the chunk-load self-heal is guarded by a session flag');
  /caches\.keys\(\)/.test(reg) && /unregister\(\)/.test(reg)
    ? pass('the self-heal clears caches and unregisters workers') : fail('the self-heal clears caches and unregisters workers');
} catch (err) { fail('service-worker self-heal', err.message); }

// 21. The leyning player: the PocketTorah source URL resolves to the verified
// pattern, the name mapping handles the irregular portions, the player never
// autoplays, cleans up audio on unmount, reports a failure rather than spinning,
// and carries the source and CC BY-SA license notice. The home page and the
// haftarah page wire it in, and docs/SOURCES.md records the verified pattern.
console.log('\n--- 21. leyning player (PocketTorah) ---');
try {
  const mod = await import('../src/lib/leyning.js');
  // The URL builder produces the verified raw.githubusercontent pattern.
  typeof mod.aliyahAudioUrl === 'function'
    ? pass('aliyahAudioUrl is a function') : fail('aliyahAudioUrl is a function');
  if (typeof mod.aliyahAudioUrl === 'function') {
    const u1 = mod.aliyahAudioUrl('Bereshit', 0);
    u1 === 'https://raw.githubusercontent.com/rneiss/PocketTorah/master/data/audio/Bereshit-1.mp3'
      ? pass('aliyah 0 maps to <Parsha>-1.mp3 at the verified host')
      : fail('aliyah 0 maps to <Parsha>-1.mp3 at the verified host', u1);
    const u7 = mod.aliyahAudioUrl('Bereshit', 6);
    /Bereshit-7\.mp3$/.test(u7) ? pass('aliyah 6 maps to -7.mp3') : fail('aliyah 6 maps to -7.mp3', u7);
    const uh = mod.aliyahAudioUrl('Bereshit', 0, 'haftarah');
    /Bereshit-H\.mp3$/.test(uh) ? pass('haftarah maps to -H.mp3') : fail('haftarah maps to -H.mp3', uh);
    // The irregular Sefaria display names resolve to the real PocketTorah basenames.
    const cases = [
      ['Lech Lecha', 'Lech-Lecha-1.mp3'],
      ["Re'eh", 'Reeh-1.mp3'],
      ["Va'etchanan", 'Vaethanan-1.mp3'],
      ["Beha'alotcha", 'Behaalotcha-1.mp3'],
      ["Sh'lach", 'Shlach-1.mp3'],
      ["V'Zot HaBerachah", 'VezotHaberakhah-1.mp3'],
      ['Achrei Mot', 'AchreiMot-1.mp3'],
      ['Chayei Sara', 'ChayeiSara-1.mp3'],
    ];
    for (const [name, tail] of cases) {
      const u = mod.aliyahAudioUrl(name, 0);
      (u && u.endsWith(tail)) ? pass(`name "${name}" maps to ${tail}`) : fail(`name "${name}" maps to ${tail}`, u);
    }
    // A doubled week resolves to the first half and an index past seven clamps.
    const dbl = mod.aliyahAudioUrl('Tazria-Metzora', 0);
    /Tazria-1\.mp3$/.test(dbl) ? pass('a doubled week uses the first portion') : fail('a doubled week uses the first portion', dbl);
    mod.isDoubledName('Tazria-Metzora') === true ? pass('isDoubledName flags a pair') : fail('isDoubledName flags a pair');
    mod.isDoubledName('Korach') === false ? pass('isDoubledName clears a single portion') : fail('isDoubledName clears a single portion');
  }
  // The credit carries the source, the trope, and the CC BY-SA license.
  mod.LEYNING_CREDIT && mod.LEYNING_CREDIT.source === 'PocketTorah'
    ? pass('credit names PocketTorah as the source') : fail('credit names PocketTorah as the source');
  mod.LEYNING_CREDIT && /CC BY-SA/.test(mod.LEYNING_CREDIT.license)
    ? pass('credit carries the CC BY-SA license') : fail('credit carries the CC BY-SA license');

  // The component: no autoplay, cleanup on unmount, a failure message, the credit.
  const compSrc = readFileSync(resolve(root, 'src/components/LeyningPlayer.jsx'), 'utf8');
  // An actual autoplay attribute or prop on the audio element, not the word in a
  // comment. The player must never carry one.
  /autoPlay[=\s>]|autoplay[=\s>]/.test(compSrc.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, ''))
    ? fail('the player must not autoplay') : pass('the player does not autoplay');
  /preload="none"/.test(compSrc)
    ? pass('the audio does not preload (nothing streams until play)') : fail('the audio does not preload');
  // It plays only from a user action: el.play() is reached through the toggle, not an effect.
  /function toggle\(\)[\s\S]*el\.play\(\)/.test(compSrc)
    ? pass('play happens only from the user toggle') : fail('play happens only from the user toggle');
  /useEffect\([^)]*play\(\)/.test(compSrc)
    ? fail('the player must not call play() from an effect') : pass('the player does not call play() from an effect');
  // Cleanup: an unmount effect pauses the audio.
  /return\s*\(\)\s*=>\s*{[\s\S]*\.pause\(\)/.test(compSrc)
    ? pass('the player pauses the audio on unmount') : fail('the player pauses the audio on unmount');
  // The reset effect is keyed on the stable src, not on the playing flag it sets.
  /\},\s*\[src\]\)/.test(compSrc)
    ? pass('the reset effect is keyed on the src, not its own playing flag')
    : fail('the reset effect is keyed on the src, not its own playing flag');
  /onError=/.test(compSrc) && /could not be loaded/.test(compSrc)
    ? pass('a failed recording shows a message, not a perpetual spinner') : fail('a failed recording shows a message');
  /crossOrigin="anonymous"/.test(compSrc)
    ? pass('the audio sets crossOrigin for the cross-origin host') : fail('the audio sets crossOrigin');
  compSrc.includes('LEYNING_CREDIT')
    ? pass('the player shows the source and license credit') : fail('the player shows the source and license credit');

  // The home page wires the per-aliyah player; the haftarah page wires the haftarah chant.
  const homeSrc = readFileSync(resolve(root, 'src/pages/ThisWeek.jsx'), 'utf8');
  homeSrc.includes('LeyningPlayer') && /aliyahIndex=\{aliyahIndex\}/.test(homeSrc)
    ? pass('the home page plays the chosen aliyah') : fail('the home page plays the chosen aliyah');
  const hafSrc = readFileSync(resolve(root, 'src/pages/Haftarah.jsx'), 'utf8');
  hafSrc.includes('LeyningPlayer') && /kind="haftarah"/.test(hafSrc)
    ? pass('the haftarah page plays the haftarah chant') : fail('the haftarah page plays the haftarah chant');

  // The docs record the verified source URL pattern and the license.
  const sources = readFileSync(resolve(root, 'docs/SOURCES.md'), 'utf8');
  sources.includes('raw.githubusercontent.com/rneiss/PocketTorah')
    ? pass('SOURCES.md records the verified PocketTorah URL pattern') : fail('SOURCES.md records the verified URL pattern');
  /access-control-allow-origin/i.test(sources) && /accept-ranges/i.test(sources)
    ? pass('SOURCES.md records the CORS and range curl evidence') : fail('SOURCES.md records the CORS and range evidence');
  /CC BY-SA 3\.0/.test(sources)
    ? pass('SOURCES.md records the CC BY-SA 3.0 license') : fail('SOURCES.md records the license');
} catch (err) { fail('leyning player pieces', err.message); }

// 22. The Astro build shell: the whole React app mounts as a single
// client-only island, the base path is /chumash/, and the emitted dist/ carries
// the app shell, the built assets, the STaM fonts, and the service worker under
// the base. Astro is only the host; the React app is unchanged.
console.log('\n--- 22. Astro build shell + island ---');
try {
  const astroPage = readFileSync(resolve(root, 'src/pages/index.astro'), 'utf8');
  astroPage.includes("import App from '../App.jsx'")
    ? pass('index.astro imports the existing App') : fail('index.astro imports the existing App');
  /<App\s+client:only="react"\s*\/>/.test(astroPage)
    ? pass('index.astro mounts App as a client:only react island') : fail('index.astro mounts App as a client:only react island');
  // The pre-paint theme script and the root div are carried over.
  astroPage.includes('chumash-theme') ? pass('index.astro keeps the pre-paint theme script') : fail('index.astro keeps the pre-paint theme script');
  astroPage.includes('id="root"') ? pass('index.astro keeps the root mount node') : fail('index.astro keeps the root mount node');

  const cfg = readFileSync(resolve(root, 'astro.config.mjs'), 'utf8');
  /base:\s*'\/chumash\/'/.test(cfg)
    ? pass("astro.config.mjs sets base '/chumash/'") : fail("astro.config.mjs sets base '/chumash/'");
  /output:\s*'static'/.test(cfg)
    ? pass('astro.config.mjs builds a static site') : fail('astro.config.mjs builds a static site');

  // The emitted build, if present, serves the shell with base-correct assets and
  // ships the fonts and the service worker under the base. The check is skipped
  // before the first build so the harness still runs offline; CI runs it after
  // astro build, where dist/ is present.
  const distIndex = resolve(root, 'dist/index.html');
  if (existsSync(distIndex)) {
    const html = readFileSync(distIndex, 'utf8');
    /\/chumash\/_astro\//.test(html) || /src="\/chumash\//.test(html)
      ? pass('dist/index.html references built assets under /chumash/') : fail('dist/index.html references built assets under /chumash/');
    existsSync(resolve(root, 'dist/fonts/StamAshkenazCLM.ttf')) && existsSync(resolve(root, 'dist/fonts/StamSefaradCLM.ttf'))
      ? pass('dist ships both STaM fonts under /fonts') : fail('dist ships both STaM fonts under /fonts');
    existsSync(resolve(root, 'dist/sw.js'))
      ? pass('dist ships the service worker (sw.js)') : fail('dist ships the service worker (sw.js)');
    existsSync(resolve(root, 'dist/manifest.webmanifest'))
      ? pass('dist ships the PWA manifest') : fail('dist ships the PWA manifest');
  } else {
    console.log('SKIP  dist/ checks (no build present; run astro build first)');
  }
} catch (err) { fail('Astro build shell + island', err.message); }

console.log(`\n${passes + failures} checks: ${passes} passed, ${failures} failed`);
if (failures > 0) process.exit(1);
