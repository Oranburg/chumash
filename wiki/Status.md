# Status

## Built
- The scaffold: the Vite, React, Tailwind, MDX, and PWA toolchain, the GitHub Pages deploy config under `/chumash/`, the design tokens, and the smoke test (passing, 16 checks).
- Carried over from havruta and present in the tree: the Sefaria client, the transliteration engine, the tappable-Hebrew, word-popover, and translation-compare components, and the study-partner and sign-in libraries.
- The Torah structure in `src/lib/parsha.js`: the five books, the fifty-four portions in order, the seven doubled pairs, and the aliyah labels.

## Stubbed, not built
- The calendar engine (`getThisWeeksParsha`, `getParshaIndex`, `getAliyot`, `getHaftarah`) throws a documented TODO. This is issue #1.
- `src/App.jsx` is a placeholder shell with a scaffold home and a catch-all. No reading view, no this-week home, no tracker.

## Open, tracked in Issues
The build-out is the repository Issues, ordered on the Project board and grouped into three build prompts in `prompts/`. The first usable release is Prompts A and B: the calendar, the this-week home, the reading view, aliyah-a-day, and the shnayim mikra tracker.

## Note
The parsha-specific Sefaria functions in the carried-over `sefaria.js` (today's daf, daf text, daf links, daf images) remain as patterns and should be trimmed or replaced during the build; they are harmless while unused.
