# Status

Dated 2026-06-18. A runtime audit confirmed every feature below works on the live Astro build at https://oranburg.law/chumash/. The repository copy is `docs/STATUS.md`.

## Shipped and verified live

- **Parsha calendar.** `getThisWeeksParsha` in `src/lib/parsha.js`, Sefaria calendars with an `@hebcal/core` offline fallback, Diaspora or Israel.
- **Sefaria fetch layer.** `src/lib/sefaria.js` and `src/lib/parsha.js` fetch the parsha index, the aliyot, the verse text, the translations, and the per-verse commentary at read time.
- **The scroll hero.** `src/components/ScrollColumn.jsx`, the day's aliyah in the Culmus STaM scribal letterforms, blessing-framed, Ashkenazi or Sephardi switch, tappable words.
- **The study table.** `src/components/StudyTable.jsx`, transliteration, vocalized Hebrew, English, on a toggle.
- **Aliyah a day.** The week view and the day's-aliyah home in `src/pages/ThisWeek.jsx`.
- **Verse-by-verse reading.** `src/components/ParshaReader.jsx` and `VerseCommentary.jsx` open the six parshanim verbatim from Sefaria; `TranslationCompare.jsx` compares the translations.
- **Shnayim mikra tracker.** `src/components/ShnayimMikraTracker.jsx` and `src/lib/shnayimMikra.js`, twice Hebrew and once Onkelos, per aliyah, reset per parsha, three passes shown.
- **Haftarah.** `src/pages/Haftarah.jsx`, the week's haftarah in the same reading view.
- **Leyning audio.** `src/components/LeyningPlayer.jsx`, per-aliyah chanting from PocketTorah (CC BY-SA 3.0), credited.
- **The AI study partner.** `src/components/VerseHavruta.jsx` and `AliyahHavruta.jsx`, with `src/lib/partner.js`, `usePartnerConversation.js`, and `sefariaTools.js`; human-acts-first gate, tool-only never-invent quoting, reachable per verse and from the home page, bring-your-own-key in Settings.
- **PWA self-heal.** `@vite-pwa/astro` precaches the app and the fonts; `src/sw-register.js` carries `autoUpdate`, `cleanupOutdatedCaches`, a controlled reload on `controllerchange`, and chunk-load recovery, each guarded so a broken build cannot loop.
- **Shared chrome.** Dark and light toggle, the breadcrumb to oranburg.law (`src/components/Breadcrumb.jsx`), the Oranburg design tokens (`src/index.css`).
- **Astro build shell.** `astro.config.mjs` emits the static site; the React app is a client-only island and keeps its HashRouter; GitHub Pages under `/chumash/`.

## Deliberate non-goals and future items

- **Aliyah-level synthesis review** is described in `docs/AI-PARTNER.md` as a possible later addition; the partner works at the verse level by design.
- **A literal Mikraot Gedolot manuscript image** was set aside because Sefaria's Torah manuscript coverage is uneven; the scroll hero and the per-verse commentary apparatus serve that function. It remains a possible future addition.
- **The haftarah thematic connection note** is authored content Sefaria does not supply, so it is not built; tracked as an enhancement issue.

## Known external dependencies

Sefaria must be reachable for the text, the translations, the commentaries, and the calendar (the `@hebcal/core` fallback keeps the parsha resolving offline). PocketTorah's host must serve the leyning audio. A browser-stored model key, supplied by the reader, is required for the study partner.
