// The shnayim mikra v'echad targum tracker.
//
// The practice is to read the week's parsha privately before Shabbat: each
// portion twice in the Hebrew (shnayim mikra) and once in the Aramaic of Targum
// Onkelos (v'echad targum). This module keeps the learner's own record of that
// reading, marked at the level of the aliyah: three marks per aliyah, the first
// Hebrew reading, the second Hebrew reading, and the Onkelos reading.
//
// The record is kept per parsha, keyed by the portion's verse ref, so a new
// week opens a clean slate and a learner returning to a new portion sees last
// week's marks fall away rather than carry over. It is a record the learner
// keeps, never a score and never a nag. Every read and write is wrapped so the
// app degrades gracefully where localStorage is unavailable.

const STORAGE_PREFIX = 'chumash-shnayim-';

// The three marks an aliyah carries, in the order the practice takes them.
export const MARKS = [
  { id: 'hebrew1', label: 'Hebrew, first reading' },
  { id: 'hebrew2', label: 'Hebrew, second reading' },
  { id: 'onkelos', label: 'Targum Onkelos' },
];

// The storage key for one parsha's record. The key is the portion's Sefaria
// verse ref (for example "Numbers 16:1-18:32"), which changes every week and
// covers the doubled-portion case (a doubled reading carries its own combined
// ref), so the record resets cleanly to each new portion.
export function storageKey(parshaRef) {
  return `${STORAGE_PREFIX}${parshaRef}`;
}

// Read the saved record for a parsha. Returns a map from aliyah index to the
// set of completed mark ids, for example { 0: { hebrew1: true, onkelos: true } }.
// A missing or unreadable record reads as an empty object, so a returning
// learner with no record simply starts fresh.
export function readProgress(parshaRef) {
  if (!parshaRef) return {};
  try {
    const raw = localStorage.getItem(storageKey(parshaRef));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    // localStorage unavailable or the record is corrupt; start fresh.
    return {};
  }
}

// Save a parsha's record. A no-op where localStorage is unavailable, so the
// tracker still works for the session even when it cannot persist.
export function writeProgress(parshaRef, progress) {
  if (!parshaRef) return;
  try {
    localStorage.setItem(storageKey(parshaRef), JSON.stringify(progress || {}));
  } catch {
    // No persistence this session; the in-memory record still holds.
  }
}

// Toggle one mark on one aliyah and return the new record, without mutating the
// record passed in.
export function toggleMark(progress, aliyahIndex, markId) {
  const next = { ...(progress || {}) };
  const current = { ...(next[aliyahIndex] || {}) };
  if (current[markId]) {
    delete current[markId];
  } else {
    current[markId] = true;
  }
  next[aliyahIndex] = current;
  return next;
}

// How many of the three marks an aliyah carries.
export function marksDone(progress, aliyahIndex) {
  const current = (progress && progress[aliyahIndex]) || {};
  return MARKS.reduce((n, mark) => (current[mark.id] ? n + 1 : n), 0);
}

// The overall total across all the aliyot, for the quiet running count. Returns
// { done, total } where total is three marks times the number of aliyot.
export function overallProgress(progress, aliyahCount) {
  const count = Math.max(0, aliyahCount || 0);
  let done = 0;
  for (let i = 0; i < count; i += 1) {
    done += marksDone(progress, i);
  }
  return { done, total: count * MARKS.length };
}

// Progress on each of the three readings across the whole portion: for each
// mark, how many of the week's aliyot the learner has read that way. The
// practice is three complete passes over the parsha (twice in Hebrew, once in
// Onkelos), so this per-reading count is the readout that actually means
// something, rather than a single lump of marks. Returns one entry per mark in
// the order the practice takes them: [{ id, label, done, total }].
export function passProgress(progress, aliyahCount) {
  const count = Math.max(0, aliyahCount || 0);
  return MARKS.map((mark) => {
    let done = 0;
    for (let i = 0; i < count; i += 1) {
      if (progress && progress[i] && progress[i][mark.id]) done += 1;
    }
    return { id: mark.id, label: mark.label, done, total: count };
  });
}
