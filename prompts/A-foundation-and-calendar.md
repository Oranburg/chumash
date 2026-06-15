# Prompt A: foundation and the calendar

Closes issues #1 and #2. Read `docs/DESIGN-PARSHA-VS-DAF.md`, `docs/ARCHITECTURE.md`, and `docs/HOW-PARSHA-IS-LEARNED.md` first. The toolchain, the Sefaria client, the transliteration engine, and the Torah structure in `src/lib/parsha.js` are already present.

## Build

1. Implement the calendar engine in `src/lib/parsha.js`. `getThisWeeksParsha(date, locale)` returns the week's portion (name, canonical Hebrew name, verse range, whether it is a doubled reading, and the haftarah ref) from Sefaria's calendars API at `https://www.sefaria.org/api/calendars`. Add `@hebcal/core` as the offline fallback that computes the sedra locally when Sefaria is unreachable, and reconcile the two. Implement `getParshaIndex()` to fetch the canonical Hebrew names and verse ranges from Sefaria's index, and `getAliyot(parshaName)` to derive the seven aliyah ranges.

2. Build the this-week home page. Show the portion's name in Hebrew with transliteration and English, the Gregorian and Hebrew date range, the seven aliyot as entries, and the haftarah. Handle the doubled-reading and Israel/Diaspora cases.

3. Build the navigation: browse by book, then by portion, reusing the drawer component. Replace the placeholder routes in `src/App.jsx`.

## Done when

A reader opens the app and sees this week's parsha correctly for both the Diaspora and Israel locales, including a week when the two diverge and a week with a doubled reading, and can navigate to any of the fifty-four portions. The build passes and the smoke test passes.
