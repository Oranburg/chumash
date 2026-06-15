// The reader's calendar locale: 'diaspora' or 'israel'. It decides which week's
// reading shows when a festival falls on Shabbat and the two calendars diverge.
// The choice persists in localStorage so it holds across visits.

const LOCALE_KEY = 'chumash-locale';

export function readLocale() {
  try {
    const v = localStorage.getItem(LOCALE_KEY);
    if (v === 'israel' || v === 'diaspora') return v;
  } catch {
    // localStorage unavailable; use the default.
  }
  return 'diaspora';
}

export function writeLocale(value) {
  try {
    localStorage.setItem(LOCALE_KEY, value === 'israel' ? 'israel' : 'diaspora');
  } catch {
    // localStorage unavailable; the choice holds for this session only.
  }
}
