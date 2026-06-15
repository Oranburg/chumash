# Chumash

A weekly Torah-portion study companion. Read the parsha with Targum, Rashi, a translation you tap to reveal, and transliteration on first appearance, at the pace of the week.

This repository is a scaffold. The infrastructure is carried over from its sibling project [havruta](https://github.com/Oranburg/havruta), the daf yomi companion: the Sefaria client, the transliteration scheme, the study-partner libraries, the PWA shell, and the design system. What is new here is everything that follows from studying a weekly Torah portion instead of a daily Talmud page. None of that is built yet. It is planned in the Issues, the Project board, and the wiki.

## What is reused from havruta

- The Sefaria API client (`src/lib/sefaria.js`), with its generic helpers (text, translations, word lookup, search) intact and its daf-specific fetchers left as patterns to adapt.
- The transliteration engine (`src/lib/transliterate.js`) and the tappable-Hebrew and word-popover components.
- The translation-compare component, so a reader taps to reveal or compare translations.
- The study-partner libraries (`anthropic.js`, `providers.js`) for a future AI chevruta on the parsha.
- The Vite + React + Tailwind + MDX + PWA toolchain, the GitHub Pages deploy under the `/chumash/` subpath, and the house design tokens.

## What is new, because a parsha is not a daf

The differences are set out in `docs/DESIGN-PARSHA-VS-DAF.md`. In short: the unit is a weekly portion of 54, not a daily page; "this week" depends on the Hebrew calendar rather than a simple offset; the companions are Targum Onkelos and the haftarah, not Tosafot; and the native study rhythm is one aliyah a day and shnayim mikra, the practice of reading the text twice and the Targum once.

## Run it

You need Node 18 or newer.

```sh
npm install
npm run dev
```

The dev server prints a local URL. Right now it serves the scaffold home page only.

## Where the plan lives

- `docs/` holds the design: the parsha-vs-daf differences, the architecture and the calendar decision, how a parsha is learned, the roadmap, and the build plan.
- The repository Issues hold the build-out as discrete tasks.
- The Project board orders them.
- `wiki/` holds the staged wiki pages; `scripts/push-wiki.sh` publishes them once the GitHub wiki has been initialized by hand.
