# Architecture

The stack is havruta's, unchanged: a Vite and React single-page app, Tailwind on a small set of design tokens, built static and served from GitHub Pages under `/chumash/` with HashRouter, a PWA through `vite-plugin-pwa`, with text fetched from Sefaria at read time. The full version is in `docs/ARCHITECTURE.md`.

## The one hard decision: the calendar

Which parsha is read on a given date is not a simple offset. It depends on the Hebrew calendar: leap years, the year-types, festival displacements, the seven doubled pairs, and the Israel/Diaspora divergence. We do not reimplement it.

- Primary source: Sefaria's calendars API, which returns the week's portion and haftarah for a date and locale, and keeps us inside the same data source as the text.
- Fallback: `@hebcal/core`, which computes the sedra locally with no network, for the offline-cold path and as a cross-check.

This is issue #1, stubbed in `src/lib/parsha.js`.

## Reused and new

Reused from havruta, in `src/lib` and `src/components`: the Sefaria client (generic functions as-is, daf-specific ones as patterns to adapt), the transliteration engine, the tappable-Hebrew and translation-compare components, and the study-partner and sign-in plumbing.

New: `src/lib/parsha.js` (the Torah structure and the calendar and fetch stubs), and the reading view, the this-week home, aliyah-a-day, the shnayim mikra tracker, the haftarah, and the page image, each a tracked issue and not yet built.
