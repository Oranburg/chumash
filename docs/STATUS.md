# Status: final state as of the audit

Dated 2026-06-18. A runtime audit confirmed every feature below works on the live Astro build at https://oranburg.law/chumash/. This file is the record of that shipped state.

## Shipped and verified live

- **Parsha calendar.** `getThisWeeksParsha` in `src/lib/parsha.js` resolves the week's portion from Sefaria's calendars API, with `@hebcal/core` (Sedra and HDate) computing the parsha locally when Sefaria is unreachable. The Diaspora and Israel readings are selectable.
- **Sefaria fetch layer.** `src/lib/sefaria.js` (`getParshaText`, `getVerseCommentaries`) and `src/lib/parsha.js` fetch the parsha index, the aliyot ranges, the verse text, the translations, and the per-verse commentary from Sefaria at read time.
- **The scroll hero.** `src/components/ScrollColumn.jsx` renders the day's aliyah on a parchment panel in the Culmus STaM scribal letterforms, blessing-framed, with an Ashkenazi or Sephardi letterform switch and tappable words. Mounted on the home page in `src/pages/ThisWeek.jsx`.
- **The study table.** `src/components/StudyTable.jsx` opens transliteration, vocalized Hebrew, and English on a toggle.
- **Aliyah a day.** The week view and the day's-aliyah hero live in `src/pages/ThisWeek.jsx`.
- **Verse-by-verse reading view.** `src/components/ParshaReader.jsx` with `src/components/VerseCommentary.jsx` opens Onkelos, Rashi, Rashbam, Ibn Ezra, Ramban, and Sforno on each verse, verbatim from Sefaria, and `src/components/TranslationCompare.jsx` compares the translations.
- **Shnayim mikra tracker.** `src/components/ShnayimMikraTracker.jsx` with `src/lib/shnayimMikra.js` explains the practice, counts twice Hebrew and once Onkelos per aliyah, resets per parsha, and shows the three reading passes across the portion.
- **Haftarah.** `src/pages/Haftarah.jsx` opens the week's haftarah in the same reading view as the Torah portion.
- **Leyning audio.** `src/components/LeyningPlayer.jsx` streams the per-aliyah recordings from PocketTorah (CC BY-SA 3.0), credited in the player, with the URL pattern and the CORS and range verification recorded in `docs/SOURCES.md`.
- **The AI study partner.** `src/components/VerseHavruta.jsx` and `src/components/AliyahHavruta.jsx`, backed by `src/lib/partner.js`, `src/lib/usePartnerConversation.js`, and `src/lib/sefariaTools.js`, with the model key configured in Settings. The learner writes first (human-acts-first gate); the partner quotes only the verse it was handed and what a Sefaria tool returns in the same turn (never-invent, tool-only quoting). Reachable per verse in the reading view and from "Study today's aliyah with your havruta" on the home page. Designed in `docs/AI-PARTNER.md` and `docs/PARTNER-PROMPT.md`.
- **PWA.** `@vite-pwa/astro` precaches the app and the scribal fonts for offline use. `src/sw-register.js` carries the self-heal: `autoUpdate`, `cleanupOutdatedCaches`, a single controlled reload on `controllerchange`, and chunk-load recovery, each guarded by a sessionStorage flag so a broken build cannot loop.
- **Settings.** `src/pages/Settings.jsx` holds the locale, the rite, the theme, and the bring-your-own-key partner model.
- **Shared chrome.** The dark and light toggle, the breadcrumb back to oranburg.law (`src/components/Breadcrumb.jsx`), and the Oranburg design tokens (`src/index.css`, `src/styles/`).
- **Astro build shell.** `astro.config.mjs` emits the static site to `dist/`; the React app mounts as a `client:only` island and keeps its `HashRouter`. Deployed to GitHub Pages under `/chumash/`.

## Deliberate non-goals and future items

- **Aliyah-level synthesis review.** The partner works at the verse level by design. An optional aliyah-level synthesis is described in `docs/AI-PARTNER.md` as a possible later addition; it is not built.
- **A literal Mikraot Gedolot manuscript image.** Sefaria's Torah manuscript coverage is uneven, so rather than a literal page scan the home page renders the aliyah in scribal fonts and the per-verse commentary apparatus provides the text-flanked-by-commentators function. A literal manuscript-image view remains a possible future addition.
- **The haftarah thematic connection note.** The haftarah reading shipped. A note explaining how the haftarah connects to the parsha is authored content that Sefaria does not supply, so it is not built. Tracked as an enhancement issue.

## Known external dependencies

- **Sefaria** must be reachable for the text, the translations, the commentaries, and the calendar. The `@hebcal/core` fallback keeps the parsha of the week resolving offline, but the commentary and verse text depend on Sefaria.
- **PocketTorah's host** (the raw GitHub content for `rneiss/PocketTorah`) must serve the audio for the leyning player. The cross-origin and range behavior the player needs is recorded in `docs/SOURCES.md`.
- **A browser-stored model key** is required for the AI study partner. The reader supplies and stores it in Settings; no key ships with the app.
