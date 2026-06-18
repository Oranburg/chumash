# Roadmap

The project moved from an inherited scaffold to a working weekly-parsha companion in phases. As of the 2026-06-18 audit every phase shipped and is live at https://oranburg.law/chumash/. See [[Status]] for the current feature-by-feature state and `docs/ROADMAP.md` for the repository copy. This page is the record of the plan and how it was met.

- **Phase 0, done.** The scaffold: the toolchain, Sefaria client, transliteration engine, study-partner libraries, design system, PWA shell, and the Torah structure in `src/lib/parsha.js`.
- **Phase 1, done.** The calendar engine: the parsha of the week from Sefaria's calendars API with an `@hebcal/core` fallback, the haftarah, and the locale (#1).
- **Phase 2, done.** The this-week home and the verse-by-verse reading view with the translation compare and the classical commentaries (#2, #3).
- **Phase 3, done.** The study rhythm: aliyah-a-day and the shnayim mikra tracker (#4, #6).
- **Phase 4, done.** The haftarah reading, plus the scroll hero in the Culmus STaM scribal letterforms as the visual anchor in place of a literal manuscript page scan. The haftarah connection note and a literal manuscript image remain future items (#5, #7).
- **Phase 5, done.** The AI study partner at the verse level, human-acts-first and tool-only never-invent, reachable per verse and from the home page (#8).
- **Phase 6, done.** Offline behavior, the install prompt, Settings, the service-worker self-heal, and the GitHub Pages deploy (#9). The build shell later moved to Astro.
