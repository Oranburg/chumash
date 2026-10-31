#!/usr/bin/env node
// print-sheet.mjs: a printable Torah-reading sheet for each upcoming Shabbat and
// Yom Tov, written as a Letter PDF.
//
// Calendar and aliyah ranges come from Hebcal (the leyning data, Diaspora by
// default). The Hebrew (vocalized, with te'amim) and the English come from
// Sefaria through the app's own client in src/lib/sefaria.js. Nothing scriptural
// is typed by hand.
//
// Usage:
//   node scripts/print-sheet.mjs              next 3 readings (Shabbat or Yom Tov)
//   node scripts/print-sheet.mjs --ahead 6   next 6 readings
//   node scripts/print-sheet.mjs --israel    Israel reading
//   node scripts/print-sheet.mjs --out DIR   write PDFs to DIR (default ~/Downloads/_inbox)
//   node scripts/print-sheet.mjs --from 2026-10-01   start from a date (for testing)
//
// Needs Google Chrome (headless, for PDF printing). Hebcal is CC-BY-4.0 and the
// sheet prints its attribution.

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getParshaText } from '../src/lib/sefaria.js';

const here = dirname(fileURLToPath(import.meta.url));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const HEBCAL = 'https://www.hebcal.com/hebcal';

// ---- arguments ------------------------------------------------------------

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : fallback;
};
const AHEAD = Number(arg('--ahead', 3));
const ISRAEL = argv.includes('--israel');
const OUT = arg('--out', join(homedir(), 'Downloads', '_inbox'));
const SCRATCH = join(homedir(), 'Agent Scratch', 'parsha-sheets');

// ---- calendar -------------------------------------------------------------

// Hebcal items for one Gregorian month: Shabbat parshiyot and major Yom Tov days,
// each with its leyning. Chol HaMoed is excluded (it has no Yom Tov flag).
async function monthReadings(year, month) {
  const url =
    `${HEBCAL}?v=1&cfg=json&year=${year}&month=${month}&maj=on&leyning=on&s=on` +
    `&i=${ISRAEL ? 'on' : 'off'}&geo=none`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Hebcal returned ${res.status}`);
  const data = await res.json();
  return data.items.filter(
    (it) => it.leyning && (it.category === 'parashat' || (it.category === 'holiday' && it.yomtov))
  );
}

// The next `count` readings on or after today, in date order. Looks across the
// months it needs.
async function upcoming(count) {
  const found = [];
  const today = arg('--from', new Date().toISOString().slice(0, 10));
  const [fy, fm] = today.split('-').map(Number);
  let y = fy;
  let m = fm;
  for (let guard = 0; found.length < count && guard < 12; guard++) {
    for (const it of await monthReadings(y, m)) {
      if (it.date.slice(0, 10) >= today) found.push(it);
    }
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return found.sort((a, b) => a.date.localeCompare(b.date)).slice(0, count);
}

// ---- text -----------------------------------------------------------------

// Strip Hebcal's trailing annotation ("I Samuel 20:18-42 | Shabbat Machar Chodesh").
const cleanRef = (s) => (s || '').split('|')[0].trim();

// Hebcal's leyning keys: "1".."7" for aliyot, "8" on some Yom Tov, "maftir".
function aliyahEntries(leyning) {
  const numbered = Object.keys(leyning)
    .filter((k) => /^\d+$/.test(k))
    .sort((a, b) => Number(a) - Number(b));
  const entries = numbered.map((k) => ({ label: `Aliyah ${k}`, ref: cleanRef(leyning[k]) }));
  if (leyning.maftir) entries.push({ label: 'Maftir', ref: cleanRef(leyning.maftir) });
  return entries;
}

async function loadRange(ref) {
  const r = await getParshaText(ref);
  return r.verses;
}

// ---- rendering ------------------------------------------------------------

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function verseBlock(verses) {
  return verses
    .map(
      (v) =>
        `<p class="verse"><span class="vnum">${v.verse}</span><span class="he">${esc(v.he)}</span></p>` +
        `<p class="en">${esc(v.en)}</p>`
    )
    .join('\n');
}

async function renderReading(item) {
  const title = item.title.replace(/^Parashat\s+/, '');
  const isYomTov = item.category === 'holiday';
  const heading = isYomTov ? item.title : `Parashat ${title}`;
  const date = new Date(item.date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
  const parts = [];
  for (const a of aliyahEntries(item.leyning)) {
    const verses = await loadRange(a.ref);
    parts.push(
      `<section class="aliyah"><h2>${esc(a.label)} <span class="ref">${esc(a.ref)}</span></h2>\n${verseBlock(verses)}</section>`
    );
  }
  let haftarah = '';
  const hRef = cleanRef(item.leyning.haftarah);
  if (hRef) {
    const verses = await loadRange(hRef);
    haftarah = `<section class="aliyah haftarah"><h2>Haftarah <span class="ref">${esc(hRef)}</span></h2>\n${verseBlock(verses)}</section>`;
  }
  return `
<header>
  <p class="kicker">${isYomTov ? 'Yom Tov' : 'Shabbat'} · ${esc(date)}</p>
  <h1>${esc(heading)}</h1>
  <p class="he-title">${esc(item.hebrew || '')}</p>
  <p class="small">${ISRAEL ? 'Israel' : 'Diaspora'} reading.${isYomTov ? '' : ` Torah reading ${esc(cleanRef(item.leyning.torah))}.`}</p>
</header>
${parts.join('\n')}
${haftarah}
<footer>
  Hebrew and English text: Sefaria (sefaria.org), each text under its own licence. Calendar and
  aliyah ranges: Hebcal (hebcal.com), CC-BY-4.0. Printed ${esc(new Date().toISOString().slice(0, 10))}.
</footer>`;
}

const CSS = `
@font-face { font-family: "STaM Ashkenaz"; src: url("${join(here, '..', 'public', 'fonts', 'StamAshkenazCLM.ttf')}"); }
@page { size: Letter; margin: 0.6in 0.65in; }
body { font-family: Georgia, "Times New Roman", serif; color: #111; font-size: 10.5pt; line-height: 1.4; margin: 0; }
header { border-bottom: 1px solid #333; margin-bottom: 14pt; padding-bottom: 8pt; }
.kicker { font-family: -apple-system, Helvetica, sans-serif; font-size: 8.5pt; letter-spacing: .08em; text-transform: uppercase; color: #555; margin: 0; }
h1 { font-size: 22pt; margin: 2pt 0 2pt; font-weight: 600; }
.he-title { font-family: "STaM Ashkenaz", serif; font-size: 16pt; margin: 0; direction: rtl; text-align: left; }
.small { font-size: 9pt; color: #444; margin: 4pt 0 0; }
.aliyah { break-inside: auto; margin: 10pt 0 6pt; }
.aliyah h2 { font-family: -apple-system, Helvetica, sans-serif; font-size: 10.5pt; margin: 0 0 4pt; border-bottom: .5pt solid #bbb; padding-bottom: 2pt; }
.aliyah .ref { font-weight: 400; color: #555; margin-left: 6pt; }
.verse { margin: 3pt 0 0; line-height: 1.55; }
.vnum { font-family: -apple-system, Helvetica, sans-serif; font-size: 7pt; color: #666; margin-right: 5pt; vertical-align: super; }
.he { font-family: "STaM Ashkenaz", serif; font-size: 13pt; direction: rtl; unicode-bidi: isolate; }
.en { margin: 0 0 2pt 0; font-size: 9pt; color: #222; line-height: 1.4; }
.haftarah .he { font-size: 12pt; }
footer { margin-top: 18pt; border-top: 1px solid #bbb; padding-top: 6pt; font-size: 7.5pt; color: #666; font-family: -apple-system, Helvetica, sans-serif; }
`;

function page(body, title) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>${CSS}</style></head><body>${body}</body></html>`;
}

// ---- output ---------------------------------------------------------------

function slug(s) {
  return s.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function printPdf(htmlPath, pdfPath) {
  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--no-pdf-header-footer',
    `--print-to-pdf=${pdfPath}`, `file://${htmlPath}`,
  ], { stdio: 'ignore', timeout: 120000 });
}

async function main() {
  if (!existsSync(CHROME)) throw new Error(`Google Chrome not found at ${CHROME}`);
  mkdirSync(OUT, { recursive: true });
  mkdirSync(SCRATCH, { recursive: true });
  const items = await upcoming(AHEAD);
  if (items.length === 0) throw new Error('Hebcal returned no readings.');
  const written = [];
  for (const item of items) {
    const date = item.date.slice(0, 10);
    const name = item.category === 'holiday' ? item.title : `Parashat ${item.title.replace(/^Parashat\s+/, '')}`;
    const base = `${date} ${slug(name)}${ISRAEL ? '-Israel' : ''}`;
    const htmlPath = join(SCRATCH, `${base}.html`);
    const pdfPath = join(OUT, `${base}.pdf`);
    const body = await renderReading(item);
    writeFileSync(htmlPath, page(body, name));
    printPdf(htmlPath, pdfPath);
    written.push(pdfPath);
  }
  for (const p of written) console.log(p);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
