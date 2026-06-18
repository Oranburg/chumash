# Changelog

All notable milestones for the Chumash study companion. The app is feature-complete and live at https://oranburg.law/chumash/.

## Shipped

- **The parsha calendar engine.** This week's portion resolves from Sefaria's calendars API with an `@hebcal/core` offline fallback, including the haftarah and the Diaspora or Israel locale.
- **The Sefaria fetch layer.** The parsha index, the aliyot ranges, the verse text, and the translations come from Sefaria at read time.
- **The reading view with the classical commentaries.** Each verse opens Onkelos, Rashi, Rashbam, Ibn Ezra, Ramban, and Sforno verbatim from Sefaria, with a per-verse translation compare.
- **The scroll hero.** The day's aliyah renders on a parchment panel in the Culmus STaM scribal letterforms, blessing-framed, with an Ashkenazi or Sephardi letterform switch and tappable words.
- **The weekly rhythm.** The aliyah-a-day week view and the day's-aliyah home, paced across the days of the week.
- **The shnayim mikra tracker.** Twice Hebrew and once Onkelos, counted per aliyah, reset per parsha, with the three reading passes shown across the portion.
- **The haftarah reading view.** The week's haftarah opens in the same reading view as the Torah portion.
- **Leyning audio.** Per-aliyah chanting from PocketTorah's recordings (CC BY-SA 3.0), credited in the player.
- **The AI study partner.** A verse-level havruta with a human-acts-first gate and tool-only, never-invent quoting, reachable per verse and from "Study today's aliyah with your havruta" on the home page, configured with a bring-your-own-key model in Settings.
- **The PWA self-heal.** Offline precache including the scribal fonts, plus a service-worker self-heal (`autoUpdate`, `cleanupOutdatedCaches`, a controlled reload on `controllerchange`, and chunk-load recovery) so a returning visitor never lands on a stale build.
- **The Astro migration.** The build shell moved from a plain Vite app to Astro. The React app now mounts as a single `client:only` island; Astro emits the static site for the GitHub Pages deploy under `/chumash/`.
- **The home partner entry.** A single prominent entry on the home page opens the study partner on the day's aliyah.
