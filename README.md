# Chumash

A weekly Torah-portion study companion. Read the parsha at the pace of the week, see the day's aliyah written in real scribal letterforms, open the classical commentators on any verse, track shnayim mikra, chant the reading, and study a verse with an AI havruta that quotes only what it can fetch from Sefaria.

**Live site:** https://oranburg.law/chumash/

## What it does

- **This week.** The home screen resolves the current parsha from the Hebrew calendar and shows the day's aliyah in the weekly rhythm, with the Diaspora or Israel reading selected by a locale toggle.
- **The scroll hero.** The day's aliyah renders on a parchment panel in authentic STaM scribal letterforms (the Culmus fonts, self-hosted), framed by the blessings, with an Ashkenazi or Sephardi letterform switch and tappable words.
- **The study table.** A toggle opens transliteration, vocalized Hebrew, and English side by side.
- **Aliyah a day.** A week view paces the seven aliyot across the days so the portion arrives one reading at a time.
- **Verse-by-verse reading.** A reading view opens each verse with its classical commentaries fetched verbatim from Sefaria (Onkelos, Rashi, Rashbam, Ibn Ezra, Ramban, Sforno) and a per-verse translation compare.
- **Shnayim mikra.** A tracker for the practice of reading the text twice in Hebrew and once in Onkelos, counted per aliyah, reset per parsha, with the three reading passes shown across the portion.
- **Haftarah.** The week's haftarah opens in the same reading view as the Torah portion.
- **Leyning audio.** Each aliyah can be chanted from PocketTorah's recordings, credited in the player.
- **The AI study partner.** From the home page ("Study today's aliyah with your havruta") and from any verse in the reading view, a study partner opens. The learner writes what she notices first; only then does the partner speak. It quotes only the verse it was handed and what it fetches from Sefaria through tools, and it never produces a commentary line from memory. You bring your own model key, configured in Settings.
- **PWA.** The app installs, precaches for offline use (including the scribal fonts), and carries a service-worker self-heal so a returning visitor lands on the current build rather than a stale cache.
- **The rest.** A dark and light toggle, a breadcrumb back to oranburg.law, and the Diaspora and Israel locale toggle.

## How it is built

- **Astro** is the build shell. The whole React application mounts as a single `client:only` island; Astro emits the static site and the GitHub Pages workflow uploads it under the `/chumash/` subpath. The app keeps a `HashRouter`, so deep links resolve client-side with no SPA rewrite.
- **React, Vite, and Tailwind** carry the application, with `@vite-pwa/astro` (Workbox) for the offline precache and the update behavior.
- **Sefaria is the only text source.** Every Hebrew verse, every translation, every commentary, and the calendar all come from Sefaria at read time, with `@hebcal/core` computing the parsha of the week locally as an offline fallback and a cross-check. Nothing scriptural is bundled or generated.
- **The never-invent discipline.** The study partner can quote only the verse it was handed and what a Sefaria tool returns in the same turn. A confident invented Rashi with a citation is treated as the worst possible failure and is prevented by construction. See `docs/AI-PARTNER.md` and `docs/PARTNER-PROMPT.md`.
- **Bring-your-own-key.** The partner uses a model key the reader supplies and stores locally in Settings. No key ships with the app.

## Run it

You need Node 18 or newer.

```sh
npm install
npm run dev
```

The dev server prints a local URL. To produce the static build and preview it:

```sh
npm run build
npm run preview
```

`npm run smoke` runs the build's smoke checks.

## Sources and licenses

- **Sefaria** supplies all text: the Tanakh (Torah and the haftarah readings), Targum Onkelos, and the commentaries. Sefaria's texts carry their own licenses, mostly Creative Commons or public domain, and the app credits Sefaria as the source. See `docs/SOURCES.md` and `docs/LICENSING.md`.
- **Culmus STaM fonts** (`StamAshkenazCLM` and `StamSefaradCLM`) render the scroll hero. They are released by the Culmus project under the GNU GPL with a font exception, self-hosted in `public/fonts/` with their license text (`CULMUS-STAM-LICENSE.txt` and `GNU-GPL.txt`).
- **PocketTorah** supplies the leyning audio, chanted in the Avery-Binder Ashkenazi trope, released under CC BY-SA 3.0. The app streams the files in place and the player carries the credit and the license. See `docs/SOURCES.md`.
- **The application code** is offered under the MIT License (see `LICENSE`). The MIT license covers the code and does not relicense the Sefaria texts, the fonts, or the audio, which keep their own terms.

## Where the documentation lives

- `docs/STATUS.md`: the final state as of the runtime audit, feature by feature, with the deliberate non-goals and the external dependencies.
- `docs/SOURCES.md`: every external source, its endpoint or URL pattern, and the verification record.
- `docs/AI-PARTNER.md` and `docs/PARTNER-PROMPT.md`: the study partner's design and its system prompt.
- `docs/LICENSING.md`: the attribution approach and the license terms.
- `CHANGELOG.md`: the milestones shipped.
- The repository wiki: a short tour of the live app and its features.

## Design system
This site uses the shared Oranburg design system: the canonical `--og-` tokens, a shared breadcrumb, and a shared footer, maintained at [oranburg.github.io/design-system](https://github.com/Oranburg/oranburg.github.io/tree/main/design-system). Adopted 2026-06-20.
