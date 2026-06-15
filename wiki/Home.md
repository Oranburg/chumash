# Chumash

A weekly Torah-portion study companion. Read the parsha with Targum, Rashi, a translation you tap to reveal, and transliteration on first appearance, at the pace of the week.

The project is the parsha sibling of [havruta](https://github.com/Oranburg/havruta), the daf yomi companion. It reuses havruta's infrastructure (the Sefaria client, the transliteration engine, the study-partner libraries, the PWA shell, the design system) and rebuilds everything that follows from studying a weekly portion instead of a daily page.

**Live site:** not yet deployed. The repository holds a scaffold; the build is planned in the Issues and the Project board.

## This wiki

- [[Roadmap]]: the phases, from scaffold to a usable release.
- [[Architecture]]: the stack and the one hard decision, the parsha calendar.
- [[Design Parsha vs Daf]]: what changes when the unit is a weekly portion, not a daily page.
- [[Status]]: what is built, what is stubbed, what is open.
- [[Transliteration Schemes]]: the transliteration approach, carried over from havruta.

## The repository

The design lives in `docs/`, the ordered build prompts in `prompts/`, the reusable infrastructure in `src/lib` and `src/components`, and the Torah structure in `src/lib/parsha.js`.
