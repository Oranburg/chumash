// leyning.js: the map from a portion to its PocketTorah recording.
//
// PocketTorah recorded the whole Torah chanted in the Ashkenazi (Avery-Binder)
// trope and released the recordings under Creative Commons Attribution-ShareAlike
// 3.0. The files live in the rneiss/PocketTorah repository under data/audio, one
// MP3 per aliyah, named "<Parsha>-<n>.mp3" for the seven aliyot and
// "<Parsha>-H.mp3" for the haftarah. They are served by raw.githubusercontent.com,
// which sends Access-Control-Allow-Origin: * and honors range requests, so a
// GitHub Pages origin can play them and scrub them. See docs/SOURCES.md for the
// verification record (CORS and range headers confirmed by curl on 2026-06-18).
//
// We do not bundle the audio. Each aliyah's URL is built at play time, and a
// missing or failed file is reported in the player rather than spun on forever.

const AUDIO_BASE =
  'https://raw.githubusercontent.com/rneiss/PocketTorah/master/data/audio';

// The PocketTorah file basenames have no spaces, no apostrophes, and no hyphens
// except in Lech-Lecha. Sefaria's display names carry spaces and apostrophes
// (for example "Lech Lecha", "Chayei Sara", "Re'eh"), so a few portions need an
// explicit basename. Everything not listed falls through to a normalizer that
// strips spaces and apostrophes, which resolves the regular cases.
const BASENAME_OVERRIDES = {
  'Lech Lecha': 'Lech-Lecha',
  'Lech-Lecha': 'Lech-Lecha',
  "Re'eh": 'Reeh',
  "Va'etchanan": 'Vaethanan',
  "Beha'alotcha": 'Behaalotcha',
  "Sh'lach": 'Shlach',
  "V'Zot HaBerachah": 'VezotHaberakhah',
  "Vezot Haberakhah": 'VezotHaberakhah',
  'Achrei Mot': 'AchreiMot',
  'Chayei Sara': 'ChayeiSara',
  'Ki Tavo': 'KiTavo',
  'Ki Teitzei': 'KiTeitzei',
  'Ki Tisa': 'KiTisa',
  "Ha'azinu": 'Haazinu',
};

// Strip spaces and apostrophes so a regular display name resolves to its
// PocketTorah basename. The overrides above catch the names that do not reduce
// cleanly (mostly the doubled apostrophe-and-space names).
function normalizeName(name) {
  if (!name) return '';
  return name.replace(/['’]/g, '').replace(/\s+/g, '');
}

// The PocketTorah basename for a portion, from its Sefaria display name. A
// doubled portion (for example "Tazria-Metzora") is recorded under each half;
// PocketTorah has no combined file, so we take the first half's recording and
// the player labels it as the first portion of the pair.
export function pocketTorahBasename(parshaName) {
  if (!parshaName) return null;
  const firstHalf = parshaName.split(/[-\u2013]/)[0].trim();
  if (BASENAME_OVERRIDES[parshaName]) return BASENAME_OVERRIDES[parshaName];
  if (BASENAME_OVERRIDES[firstHalf]) return BASENAME_OVERRIDES[firstHalf];
  return normalizeName(firstHalf);
}

// Whether a portion is a doubled pair, so the player can say plainly that the
// recording covers the first half. Sefaria joins the pair with a hyphen.
export function isDoubledName(parshaName) {
  return Boolean(parshaName) && /[-\u2013]/.test(parshaName);
}

// The recording URL for one aliyah. aliyahIndex is zero-based for the seven
// aliyot (0..6 -> files 1..7). Pass kind 'haftarah' for the "-H" file. Returns
// null when there is no basename to build from, so the caller shows a message
// rather than fetching a broken URL.
export function aliyahAudioUrl(parshaName, aliyahIndex, kind = 'aliyah') {
  const base = pocketTorahBasename(parshaName);
  if (!base) return null;
  if (kind === 'haftarah') return `${AUDIO_BASE}/${base}-H.mp3`;
  if (!Number.isInteger(aliyahIndex) || aliyahIndex < 0) return null;
  // PocketTorah recorded seven aliyot per portion. A doubled portion can list
  // more than seven ranges from Sefaria; there is no eighth file, so the highest
  // playable aliyah is the seventh.
  const fileNumber = Math.min(aliyahIndex + 1, 7);
  return `${AUDIO_BASE}/${base}-${fileNumber}.mp3`;
}

// The attribution shown beside the player and recorded in docs. The recordings
// are PocketTorah's, the trope is the Ashkenazi (Avery-Binder) chant, and the
// license is CC BY-SA 3.0. The text the source asks reusers to carry.
export const LEYNING_CREDIT = {
  source: 'PocketTorah',
  reader: 'Avery-Binder Ashkenazi trope',
  license: 'CC BY-SA 3.0',
  sourceUrl: 'https://github.com/rneiss/PocketTorah',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
};
