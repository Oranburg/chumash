# Roadmap

The project moved from an inherited scaffold to a working weekly-parsha companion in phases. As of the 2026-06-18 audit, every phase below shipped and is live at https://oranburg.law/chumash/. For the current feature-by-feature state see `docs/STATUS.md`; for the milestones see `CHANGELOG.md`. This file is kept as the record of the plan and how it was met.

## Phase 0, done

The scaffold: the toolchain, Sefaria client, transliteration engine, study-partner libraries, design system, and PWA shell, adapted to the `/chumash/` deploy. The Torah structure (books, the fifty-four portions, doubled pairs, aliyah labels) is in `src/lib/parsha.js`.

## Phase 1, done: the calendar engine

The parsha of the week resolves from Sefaria's calendars API with an `@hebcal/core` fallback, including the haftarah and the Israel or Diaspora locale. `getThisWeeksParsha` in `src/lib/parsha.js`. (Issue #1.)

## Phase 2, done: the this-week home and the reading view

The home screen shows this week's parsha, and the reading view opens each verse with its Hebrew, the translation compare, and the classical commentaries. `src/pages/ThisWeek.jsx`, `src/components/ParshaReader.jsx`, `src/components/VerseCommentary.jsx`, `src/components/TranslationCompare.jsx`. (Issues #2, #3.)

## Phase 3, done: the study rhythm

Aliyah-a-day, so the weekly portion has a daily cadence, and the shnayim mikra tracker. `src/components/ShnayimMikraTracker.jsx`, `src/lib/shnayimMikra.js`. (Issues #4, #6.)

## Phase 4, done: the haftarah and the visual anchor

The haftarah reading shipped (`src/pages/Haftarah.jsx`). For the visual anchor, the home page renders the day's aliyah in the Culmus STaM scribal letterforms (`src/components/ScrollColumn.jsx`) rather than a literal manuscript page scan, since Sefaria's Torah manuscript coverage is uneven; the per-verse commentary apparatus provides the text-flanked-by-commentators function. The haftarah thematic connection note (authored content Sefaria does not supply) and a literal manuscript image remain future items. (Issues #5, #7.)

## Phase 5, done: the study partner

The AI havruta works at the verse level, with the human-acts-first gate and tool-only, never-invent quoting from Sefaria. Reachable per verse and from the home page. `src/components/VerseHavruta.jsx`, `src/components/AliyahHavruta.jsx`, `src/lib/partner.js`. (Issue #8.)

## Phase 6, done: polish and ship

Offline behavior, the install prompt, Settings (locale, rite, theme, partner key), the service-worker self-heal, and the GitHub Pages deploy. (Issue #9.) The build shell later moved to Astro, with the React app mounting as a `client:only` island.
