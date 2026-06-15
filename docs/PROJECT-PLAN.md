# Project plan

The build follows havruta's method: small, ordered prompts that a coding agent can execute one at a time, each leaving the app working. The prompts live in `prompts/`. The phases and issues are in `ROADMAP.md` and the repository Issues; this document maps them to the build prompts.

## Build prompts

- Prompt A, foundation and the calendar. Wire the parsha-of-the-week from Sefaria with the hebcal fallback, the this-week home, and the navigation by book and parsha. Ends with a reader who can open this week's portion. (Issues #1, #2.)
- Prompt B, reading and rhythm. The parallel reading view (Hebrew, Targum, translation, Rashi), the translation-tap and transliteration carried over, aliyah-a-day, and the shnayim mikra tracker. (Issues #3, #4, #6.)
- Prompt C, companions, partner, and ship. The haftarah view, the Mikraot Gedolot image, the parsha study partner, settings, offline, and deploy. (Issues #5, #7, #8, #9.)

## Method

Each prompt is self-contained and ends with the app building and the smoke test passing. The reusable libraries are already present, so the prompts assemble and adapt rather than start from nothing. The calendar engine in Prompt A is the one piece with real risk; it is isolated behind `src/lib/parsha.js` so the rest of the build does not wait on it.

## Definition of done for the first usable release

A reader opens the app, sees this week's parsha, reads it in Hebrew with the translation a tap away and transliteration on first appearance, follows the Targum and Rashi alongside, and tracks shnayim mikra to a weekly meter. The haftarah and the study partner can follow.
