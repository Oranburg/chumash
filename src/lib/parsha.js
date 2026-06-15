// parsha.js: the Torah-reading structure and the "which parsha is this week" engine.
//
// This is the chumash analog of havruta's shas.js (the Talmud structure). It is a
// STUB: the static reference data below is real and stable, but the calendar and
// Sefaria-fetch functions are intentionally left as documented TODOs, because they
// are the heart of the build (see issues #1 and #2). Do not assume they work yet.
//
// Design note: the parsha-of-the-week is NOT a simple offset like the daf cycle.
// It depends on the Hebrew calendar (leap years with Adar I/II, the year-types),
// holiday displacements, the seven doubled parshiyot that combine in some years,
// and the Israel/Diaspora divergence that opens when a festival falls on Shabbat.
// We do not reimplement that. Two sources of truth, in order of preference:
//   1. Sefaria's calendars API:  https://www.sefaria.org/api/calendars
//      returns "Parashat Hashavua" and "Haftarah" for a given date and locale.
//   2. @hebcal/core (HebrewCalendar.getSedra / Sedra) as the offline fallback.

export const BOOKS = [
  { key: 'genesis',     he: 'בְּרֵאשִׁית',  tr: 'Bereshit', en: 'Genesis' },
  { key: 'exodus',      he: 'שְׁמוֹת',      tr: 'Shemot',   en: 'Exodus' },
  { key: 'leviticus',   he: 'וַיִּקְרָא',   tr: 'Vayikra',  en: 'Leviticus' },
  { key: 'numbers',     he: 'בְּמִדְבַּר',  tr: 'Bamidbar', en: 'Numbers' },
  { key: 'deuteronomy', he: 'דְּבָרִים',    tr: 'Devarim',  en: 'Deuteronomy' },
];

// The 54 parshiyot, in order, by book. Transliteration only here; the canonical
// Hebrew name and the verse range come from Sefaria's index (see getParshaIndex)
// so we do not hand-transcribe vocalized text. Doubled pairs are marked.
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

// --- TODO (issue #1): the calendar engine ---------------------------------
// Return { name, ref, he, hebrewDate, isDoubled, haftarah } for the parsha read
// on `date` in `locale` ('diaspora' | 'israel'). Prefer the Sefaria calendars API;
// fall back to @hebcal/core offline. NOT IMPLEMENTED.
export async function getThisWeeksParsha(date = new Date(), locale = 'diaspora') {
  throw new Error('TODO: implement via Sefaria /api/calendars (see ARCHITECTURE.md, issue #1)');
}

// --- TODO (issue #2): Sefaria fetch layer ---------------------------------
// Canonical Hebrew names + verse ranges for every parsha, from Sefaria's index.
export async function getParshaIndex() {
  throw new Error('TODO: fetch the parsha index from Sefaria (issue #2)');
}
// The seven aliyah ranges for a named parsha (for aliyah-a-day + shnayim mikra).
export async function getAliyot(parshaName) {
  throw new Error('TODO: derive aliyah ranges from Sefaria (issue #2)');
}
// The haftarah ref for a named parsha and locale (Ashkenazi/Sephardi vary).
export async function getHaftarah(parshaName, locale = 'diaspora', rite = 'ashkenazi') {
  throw new Error('TODO: resolve haftarah via Sefaria calendars (issue #5)');
}
