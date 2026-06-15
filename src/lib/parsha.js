// parsha.js: the Torah-reading structure and the "which parsha is this week" engine.
//
// This is the chumash analog of havruta's shas.js (the Talmud structure). The
// static reference data below (the five books, the fifty-four portions, the seven
// doubled pairs, the aliyah labels) is real and stable. The calendar and fetch
// functions resolve the week's reading and a named portion's verses from Sefaria,
// with @hebcal/core doing the Hebrew-calendar date math.
//
// Design note: the parsha-of-the-week is NOT a simple offset like the daf cycle.
// It depends on the Hebrew calendar (leap years with Adar I/II, the year-types),
// holiday displacements, the seven doubled parshiyot that combine in some years,
// and the Israel/Diaspora divergence that opens when a festival falls on Shabbat.
// We do not reimplement that. Two sources of truth, in order of preference:
//   1. Sefaria's calendars API:  https://www.sefaria.org/api/calendars
//      returns "Parashat Hashavua" with the week's ref, aliyot, and haftarah for a
//      given date and locale. This is the primary source.
//   2. @hebcal/core (Sedra / HDate) as the offline fallback and the engine that
//      maps a parsha date to the Hebrew calendar (the Hebrew date range) and that
//      finds the Shabbat on which a named portion is read.

import { HDate, Sedra } from '@hebcal/core';

const API = 'https://www.sefaria.org/api';

export const BOOKS = [
  { key: 'genesis',     he: 'בְּרֵאשִׁית',  tr: 'Bereshit', en: 'Genesis' },
  { key: 'exodus',      he: 'שְׁמוֹת',      tr: 'Shemot',   en: 'Exodus' },
  { key: 'leviticus',   he: 'וַיִּקְרָא',   tr: 'Vayikra',  en: 'Leviticus' },
  { key: 'numbers',     he: 'בְּמִדְבַּר',  tr: 'Bamidbar', en: 'Numbers' },
  { key: 'deuteronomy', he: 'דְּבָרִים',    tr: 'Devarim',  en: 'Deuteronomy' },
];

// The 54 parshiyot, in order, by book. Transliteration only here; the canonical
// Hebrew name and the verse range come from Sefaria's calendars API at read time,
// so we do not hand-transcribe vocalized text. Doubled pairs are marked below.
export const PARSHIYOT = [
  // Genesis
  'Bereshit','Noach','Lech-Lecha','Vayera','Chayei Sara','Toldot','Vayetzei','Vayishlach','Vayeshev','Miketz','Vayigash','Vayechi',
  // Exodus
  'Shemot','Vaera','Bo','Beshalach','Yitro','Mishpatim','Terumah','Tetzaveh','Ki Tisa','Vayakhel','Pekudei',
  // Leviticus
  'Vayikra','Tzav','Shmini','Tazria','Metzora','Achrei Mot','Kedoshim','Emor','Behar','Bechukotai',
  // Numbers
  'Bamidbar','Nasso',"Beha'alotcha","Sh'lach",'Korach','Chukat','Balak','Pinchas','Matot','Masei',
  // Deuteronomy
  'Devarim',"Va'etchanan",'Eikev',"Re'eh",'Shoftim','Ki Teitzei','Ki Tavo','Nitzavim','Vayeilech',"Ha'azinu",'V\'Zot HaBerachah',
];

// The first parsha of each book, used to slice PARSHIYOT into books for browsing.
const BOOK_FIRST_PARSHA = {
  genesis: 'Bereshit',
  exodus: 'Shemot',
  leviticus: 'Vayikra',
  numbers: 'Bamidbar',
  deuteronomy: 'Devarim',
};

// Return the portions that belong to a given book, in order.
export function parshiyotForBook(bookKey) {
  const start = BOOK_FIRST_PARSHA[bookKey];
  if (!start) return [];
  const startIndex = PARSHIYOT.indexOf(start);
  if (startIndex < 0) return [];
  const keys = BOOKS.map((b) => b.key);
  const nextBookKey = keys[keys.indexOf(bookKey) + 1];
  const nextStart = nextBookKey ? BOOK_FIRST_PARSHA[nextBookKey] : null;
  const endIndex = nextStart ? PARSHIYOT.indexOf(nextStart) : PARSHIYOT.length;
  return PARSHIYOT.slice(startIndex, endIndex);
}

// The seven pairs that combine into a single reading in some years. The calendar
// (Sefaria or hebcal) decides when; this is only the membership.
export const DOUBLED_PAIRS = [
  ['Vayakhel', 'Pekudei'],
  ['Tazria', 'Metzora'],
  ['Achrei Mot', 'Kedoshim'],
  ['Behar', 'Bechukotai'],
  ['Chukat', 'Balak'],
  ['Matot', 'Masei'],
  ['Nitzavim', 'Vayeilech'],
];

// A parsha is read across the week in seven aliyot (Sun..Shabbat), plus a maftir
// and a haftarah (a paired reading from the Prophets). These labels drive the
// aliyah-a-day rhythm and the shnayim-mikra tracker.
export const ALIYAH_LABELS = ['Rishon', 'Sheni', 'Shlishi', 'Revi\'i', 'Chamishi', 'Shishi', 'Shvi\'i', 'Maftir'];

// --- internals ------------------------------------------------------------

// Fetch JSON from a URL and throw a readable error if the request fails, so a
// failed calendar lookup surfaces plainly instead of inventing a reading.
async function getJson(url) {
  let res;
  try {
    res = await fetch(url);
  } catch (cause) {
    throw new Error(`Could not reach Sefaria at ${url}.`, { cause });
  }
  if (!res.ok) {
    throw new Error(`Sefaria returned ${res.status} for ${url}.`);
  }
  return res.json();
}

// The coming Shabbat on or after a date, as an @hebcal HDate. The parsha read
// "this week" is the one read on the Shabbat that closes the week, so a lookup on
// any weekday resolves forward to that Shabbat.
function comingShabbat(date) {
  const hd = new HDate(date);
  // getDay(): 6 = Saturday. onOrAfter(6) gives the Shabbat on or after this date.
  return hd.onOrAfter(6);
}

// Render the Hebrew-calendar date range a parsha's reading spans, from the Sunday
// that opens the week through its closing Shabbat, as two English-rendered Hebrew
// dates. Used for the "this week" header so the reader sees the Hebrew dates too.
function hebrewDateRange(shabbat) {
  const sunday = shabbat.subtract(6, 'd');
  return {
    startHe: sunday.render('en'),
    endHe: shabbat.render('en'),
    startHeHebrew: sunday.renderGematriya(),
    endHeHebrew: shabbat.renderGematriya(),
  };
}

// The Gregorian date range for the same week, as ISO date strings.
function gregorianRange(shabbat) {
  const sunday = shabbat.subtract(6, 'd');
  return {
    start: sunday.greg(),
    end: shabbat.greg(),
  };
}

// Find the Shabbat in a Hebrew year on which a named portion is read, using the
// local Sedra calendar. Returns an HDate, or null if the name is not read that
// year (which happens for a portion that is doubled with its pair that year, when
// queried under one of the two names that the Sedra does not list separately).
function findParshaShabbat(name, hebrewYear, israel) {
  const sedra = new Sedra(hebrewYear, israel);
  let hd = new HDate(1, 'Tishrei', hebrewYear).onOrAfter(6);
  const end = new HDate(1, 'Tishrei', hebrewYear + 1).abs();
  while (hd.abs() < end) {
    const portions = sedra.get(hd);
    if (Array.isArray(portions) && portions.includes(name)) return hd;
    hd = hd.add(7, 'd');
  }
  return null;
}

// Read the week's Parashat Hashavua item out of a Sefaria calendars payload, and
// shape it into the app's parsha record. Returns null when the payload carries no
// Torah portion (for example a date inside a long festival can read differently),
// so the caller can fall back rather than invent.
function shapeFromCalendars(data, shabbat) {
  const items = Array.isArray(data && data.calendar_items) ? data.calendar_items : [];
  const parsha = items.find(
    (item) => item && item.title && item.title.en === 'Parashat Hashavua'
  );
  if (!parsha || !parsha.ref) return null;

  const haftarah = items.find(
    (item) => item && item.title && item.title.en === 'Haftarah'
  );

  const displayEn = (parsha.displayValue && parsha.displayValue.en) || parsha.ref;
  const aliyotRanges =
    parsha.extraDetails && Array.isArray(parsha.extraDetails.aliyot)
      ? parsha.extraDetails.aliyot
      : [];

  return {
    name: displayEn,
    he: (parsha.displayValue && parsha.displayValue.he) || '',
    ref: parsha.ref,
    heRef: parsha.heRef || '',
    isDoubled: displayEn.includes('-'),
    aliyot: aliyotRanges,
    description:
      (parsha.description && parsha.description.en) || '',
    haftarah: haftarah
      ? {
          ref: haftarah.ref,
          displayEn: (haftarah.displayValue && haftarah.displayValue.en) || haftarah.ref,
          displayHe: (haftarah.displayValue && haftarah.displayValue.he) || '',
        }
      : null,
    hebrewDate: hebrewDateRange(shabbat),
    gregorian: gregorianRange(shabbat),
  };
}

// The local-only fallback shape, built from @hebcal when Sefaria is unreachable.
// It carries the portion name and the Hebrew/Gregorian range, but not the verse
// ref or the aliyot, because those come from Sefaria and are never invented here.
// The reading view that needs the ref reports the offline state plainly.
function shapeFromHebcal(shabbat, israel) {
  const sedra = new Sedra(shabbat.getFullYear(), israel);
  const portions = sedra.get(shabbat);
  const name = Array.isArray(portions) ? portions.join('-') : sedra.getString(shabbat);
  return {
    name: name || sedra.getString(shabbat).replace(/^Parashat\s+/, ''),
    he: '',
    ref: null,
    heRef: '',
    isDoubled: Array.isArray(portions) && portions.length > 1,
    aliyot: [],
    description: '',
    haftarah: null,
    hebrewDate: hebrewDateRange(shabbat),
    gregorian: gregorianRange(shabbat),
    offline: true,
  };
}

// --- the calendar engine --------------------------------------------------

// Resolve the parsha read on the week of `date` in `locale` ('diaspora' |
// 'israel'). Asks Sefaria's calendars API first, for the week's closing Shabbat,
// and falls back to @hebcal/core when Sefaria is unreachable so the app still
// shows the right portion offline. Returns the parsha record shaped above.
export async function getThisWeeksParsha(date = new Date(), locale = 'diaspora') {
  const israel = locale === 'israel';
  const shabbat = comingShabbat(date);
  const greg = shabbat.greg();
  const url =
    `${API}/calendars?year=${greg.getFullYear()}` +
    `&month=${greg.getMonth() + 1}&day=${greg.getDate()}` +
    `&diaspora=${israel ? 0 : 1}`;

  try {
    const data = await getJson(url);
    const shaped = shapeFromCalendars(data, shabbat);
    if (shaped) return shaped;
  } catch {
    // Sefaria unreachable; fall through to the offline @hebcal path.
  }
  return shapeFromHebcal(shabbat, israel);
}

// --- the named-portion fetch layer ----------------------------------------

// Resolve a named portion to its full reading record (the same shape as the
// this-week record) by finding the Shabbat it is read on in the current Hebrew
// year and asking Sefaria's calendars API for that date. The verse ref, the
// canonical Hebrew name, the aliyot, and the haftarah all come from Sefaria.
//
// A portion that is doubled this year resolves under either of its two names to
// the combined reading, because the Sedra reports both names on the shared
// Shabbat. A portion that does not fall in the current Hebrew year (it can happen
// near the year boundary) is retried in the next Hebrew year.
export async function getParshaReading(parshaName, locale = 'diaspora') {
  const israel = locale === 'israel';
  const today = new HDate(new Date());
  const years = [today.getFullYear(), today.getFullYear() + 1];

  let shabbat = null;
  for (const y of years) {
    shabbat = findParshaShabbat(parshaName, y, israel);
    if (shabbat) break;
  }
  if (!shabbat) {
    throw new Error(`Could not place ${parshaName} on the Hebrew calendar.`);
  }

  const greg = shabbat.greg();
  const url =
    `${API}/calendars?year=${greg.getFullYear()}` +
    `&month=${greg.getMonth() + 1}&day=${greg.getDate()}` +
    `&diaspora=${israel ? 0 : 1}`;
  const data = await getJson(url);
  const shaped = shapeFromCalendars(data, shabbat);
  if (!shaped) {
    throw new Error(`Sefaria returned no portion for the week of ${parshaName}.`);
  }
  return shaped;
}

// The fifty-four portions sliced into their five books, each entry carrying the
// book and the transliterated name, for the browse-by-book navigation. The
// canonical Hebrew name and the verse range are not fetched here; they load when
// the reader opens a portion. Returns [{ book, parshiyot:[name,...] }].
export function getParshaIndex() {
  return BOOKS.map((book) => ({
    book,
    parshiyot: parshiyotForBook(book.key),
  }));
}

// The seven aliyah ranges for a named portion, from Sefaria via the calendars
// API. Returns [refString, ...]; an empty array when Sefaria carries no aliyot
// breakdown for the week.
export async function getAliyot(parshaName, locale = 'diaspora') {
  const reading = await getParshaReading(parshaName, locale);
  return reading.aliyot;
}

// The haftarah for a named portion and locale, from Sefaria's calendars API.
// Returns { ref, displayEn, displayHe } or null when none is carried.
export async function getHaftarah(parshaName, locale = 'diaspora') {
  const reading = await getParshaReading(parshaName, locale);
  return reading.haftarah;
}
