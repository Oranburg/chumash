# Chumash

A weekly Torah-portion study companion. Read the parsha at the pace of the week, see the day's aliyah written in real scribal letterforms, open the classical commentators on any verse, track shnayim mikra, chant the reading, and study a verse with an AI havruta that quotes only what it can fetch from Sefaria.

**Live site:** https://oranburg.law/chumash/

## What it does

- **This week.** The home screen resolves the current parsha from the Hebrew calendar and shows the day's aliyah, with a Diaspora or Israel locale toggle.
- **The scroll hero.** The day's aliyah renders on a parchment panel in authentic STaM scribal letterforms, framed by the blessings, with an Ashkenazi or Sephardi letterform switch and tappable words.
- **The study table.** A toggle opens transliteration, vocalized Hebrew, and English together.
- **Aliyah a day.** A week view paces the seven aliyot across the days.
- **Verse-by-verse reading.** Each verse opens its classical commentaries verbatim from Sefaria (Onkelos, Rashi, Rashbam, Ibn Ezra, Ramban, Sforno) with a per-verse translation compare.
- **Shnayim mikra.** A tracker for reading the text twice in Hebrew and once in Onkelos, counted per aliyah, reset per parsha.
- **Haftarah.** The week's haftarah opens in the same reading view.
- **Leyning audio.** Each aliyah can be chanted from PocketTorah's recordings, credited in the player.
- **The AI study partner.** From the home page and from any verse, a havruta opens. The learner writes what she notices first; the partner quotes only the verse it was handed and what it fetches from Sefaria, never a commentary line from memory. The reader brings a model key, stored in Settings.
- **PWA.** The app installs, precaches for offline use including the fonts, and self-heals so a returning visitor lands on the current build.

## How it is built

Astro is the build shell; the React app mounts as a single client-only island and keeps its HashRouter, deployed to GitHub Pages under `/chumash/`. React, Vite, and Tailwind carry the app, with Workbox (`@vite-pwa/astro`) for offline and updates. Sefaria is the only text source, with `@hebcal/core` computing the parsha of the week locally as a fallback. The study partner can quote only what it was handed or fetched, so an invented commentary is prevented by construction.

## This wiki

- [[Status]]: every feature and that it is verified live, the deliberate non-goals, the external dependencies.
- [[Roadmap]]: the phases, from scaffold to the live release.
- [[Architecture]]: the stack and the parsha-calendar decision.
- [[Design Parsha vs Daf]]: what changes when the unit is a weekly portion, not a daily page.
- [[Transliteration Schemes]]: the transliteration approach.

## In the repository

`docs/STATUS.md`, `docs/SOURCES.md`, `docs/AI-PARTNER.md`, `docs/PARTNER-PROMPT.md`, `docs/LICENSING.md`, and `CHANGELOG.md` hold the documentation. The application code is in `src/`, with the Torah structure and the calendar engine in `src/lib/parsha.js`.
