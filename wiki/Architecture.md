# Architecture

Astro is the build shell. The whole React application mounts as a single client-only island and keeps its HashRouter; Astro emits the static site and the GitHub Pages workflow serves it under `/chumash/`. Tailwind runs on a small set of Oranburg design tokens, the PWA comes through `@vite-pwa/astro` (Workbox), and all text is fetched from Sefaria at read time. The repository copy is `docs/ARCHITECTURE.md`.

## The one hard decision: the calendar

Which parsha is read on a given date is not a simple offset. It depends on the Hebrew calendar: leap years, the year-types, festival displacements, the seven doubled pairs, and the Israel and Diaspora divergence. The app does not reimplement it.

- Primary source: Sefaria's calendars API, which returns the week's portion and haftarah for a date and locale, and keeps the app inside the same data source as the text.
- Fallback: `@hebcal/core`, which computes the sedra locally with no network, for the offline-cold path and as a cross-check.

This shipped in `getThisWeeksParsha` in `src/lib/parsha.js`.

## The shape of the app

The Torah structure and the calendar engine are in `src/lib/parsha.js`. The Sefaria fetch layer is `src/lib/sefaria.js`. The reading view (`src/components/ParshaReader.jsx`, `VerseCommentary.jsx`, `TranslationCompare.jsx`), the this-week home and scroll hero (`src/pages/ThisWeek.jsx`, `src/components/ScrollColumn.jsx`), aliyah-a-day, the shnayim mikra tracker (`src/components/ShnayimMikraTracker.jsx`), the haftarah (`src/pages/Haftarah.jsx`), the leyning player (`src/components/LeyningPlayer.jsx`), and the AI study partner (`src/components/VerseHavruta.jsx`, `AliyahHavruta.jsx`, `src/lib/partner.js`) are all built and live. The transliteration engine, the tappable-Hebrew and translation-compare components, and the study-partner plumbing are shared infrastructure.
