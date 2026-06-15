# Build prompts

Chumash is built the way havruta was: a few ordered prompts, each handed to a coding agent, each leaving the app building and the smoke test passing. The reusable libraries are already in place, so the prompts assemble and adapt rather than start from nothing.

Run them in order. Each prompt names the issues it closes and ends with a definition of done.

- `A-foundation-and-calendar.md` resolves the parsha of the week and builds the this-week home and the navigation.
- `B-reading-and-rhythm.md` builds the parallel reading view, the aliyah-a-day mode, and the shnayim mikra tracker.
- `C-companions-and-ship.md` adds the haftarah, the page image, the study partner, settings, offline, and the deploy.

The one piece with real risk is the calendar engine in Prompt A. It is isolated behind `src/lib/parsha.js` so the rest of the build does not wait on it. Read `docs/DESIGN-PARSHA-VS-DAF.md` and `docs/ARCHITECTURE.md` before starting.
