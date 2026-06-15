# Architecture

The stack is havruta's, unchanged: a Vite + React single-page app, styled with Tailwind on a small set of design tokens, built to a static `dist/` and served from GitHub Pages under the `/chumash/` subpath, with HashRouter so deep links resolve client-side. It is a PWA through `vite-plugin-pwa`, so a studied parsha is available offline after a first visit. The text comes from Sefaria at read time.

## The calendar decision

The one piece of real engineering that has no havruta equivalent is deciding which parsha is read on a given date. This is hard for the reasons set out in `DESIGN-PARSHA-VS-DAF.md`: leap years, year-types, festival displacements, the seven doubled pairs, and the Israel/Diaspora divergence. We do not reimplement it.

The primary source is Sefaria's calendars API at `https://www.sefaria.org/api/calendars`, which returns the week's Parashat Hashavua and its haftarah for a date and locale. It keeps us inside the same data source as the text, and the PWA already caches Sefaria responses, so the calendar works offline after a first load.

The fallback is `@hebcal/core`, whose `HebrewCalendar`/`Sedra` computes the sedra locally with no network. It is the offline-cold path and the cross-check. Keeping both means the app never shows the wrong parsha because one source was unreachable.

This decision is issue #1, and `src/lib/parsha.js` carries the stubbed functions it will fill.

## What is reused, and where it sits

The reusable libraries were copied from havruta into `src/lib`:

- `sefaria.js` is the Sefaria client. Its generic functions (get text, get translations, look up a word, search, build a Sefaria URL, get links for a ref, get a verse's commentaries) are used as-is. Its daf-specific functions (today's daf, daf text, daf links, daf images) remain as patterns to adapt into parsha equivalents and should be trimmed during the build.
- `transliterate.js` is domain-neutral and used unchanged.
- `anthropic.js` and `providers.js` are the study-partner and sign-in plumbing, carried for the future parsha chevruta.

The reusable components were copied into `src/components`: `SefariaText`, `TappableHebrew`, `WordPopover`, and `TranslationCompare` give the read-and-tap experience; `NavDrawer`, `ScrollProgress`, `InstallPrompt`, and `Mermaid` are shell pieces.

## What is new, and where it goes

- `src/lib/parsha.js` holds the Torah structure (the five books, the fifty-four portions, the doubled pairs, the aliyah labels) and the calendar and fetch stubs.
- The reading view, the this-week home, the aliyah-a-day mode, the shnayim-mikra tracker, the haftarah view, and the Mikraot Gedolot image are new pages and components, each a tracked issue. They are not built; `src/App.jsx` is a placeholder shell.

## Build and deploy

`npm run build` writes the static site to `dist/`; the GitHub Actions workflow builds, runs the smoke test, and deploys to Pages on every push to `main`. The PWA caches the app shell, local images, the Sefaria text and calendars API, and Sefaria manuscript images, each with the right strategy (precache the shell, stale-while-revalidate the APIs, cache-first the images).
