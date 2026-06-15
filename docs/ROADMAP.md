# Roadmap

The project moves from an inherited scaffold to a working weekly-parsha companion, in phases that each end in something usable.

## Phase 0, done

The scaffold: havruta's toolchain, Sefaria client, transliteration engine, study-partner libraries, design system, and PWA shell copied and adapted to the `/chumash/` deploy. The Torah structure (books, the fifty-four portions, doubled pairs, aliyah labels) is in `src/lib/parsha.js`. The parsha experience is not built.

## Phase 1, next: the calendar engine

Resolve the parsha of the week from Sefaria's calendars API with an `@hebcal/core` fallback, including the haftarah and the Israel/Diaspora locale. This unblocks everything else. (Issue #1.)

## Phase 2: the this-week home and the reading view

A home screen that shows this week's parsha (Hebrew, transliteration, translation, dates, the seven aliyot, the haftarah), and a parallel reading view of Hebrew, Targum, and translation with the translation-tap and transliteration carried over, and Rashi as an expandable layer. (Issues #2, #3.)

## Phase 3: the study rhythm

Aliyah-a-day, so the weekly portion has a daily cadence, and the shnayim mikra tracker, the per-verse read-twice-and-Targum progress structure. (Issues #4, #6.)

## Phase 4: the haftarah and the page image

The haftarah view with its connection note, and the Mikraot Gedolot page image as the visual anchor. (Issues #5, #7.)

## Phase 5: the study partner

The AI chevruta adapted to the parsha, reusing the partner libraries: discuss a verse, a Rashi, a thematic question, without handing over the answer. (Issue #8.)

## Phase 6: polish and ship

Offline behavior, install prompt, settings (locale, rite, theme), and the deploy. (Issue #9.)
