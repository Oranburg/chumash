# Roadmap

From an inherited scaffold to a working weekly-parsha companion, in phases that each end in something usable. The full version is in `docs/ROADMAP.md`.

## Phase 0, done
The scaffold: havruta's toolchain, Sefaria client, transliteration engine, study-partner libraries, design system, and PWA shell, copied and adapted to the `/chumash/` deploy. The Torah structure is in `src/lib/parsha.js`. The parsha experience is not built.

## Phase 1, next: the calendar engine
Resolve the parsha of the week from Sefaria's calendars API with an `@hebcal/core` fallback, including the haftarah and the Israel/Diaspora locale. This unblocks everything else (#1).

## Phase 2: the this-week home and the reading view
The home screen for this week's portion, and the parallel reading view of Hebrew, Targum, and translation, with the translation-tap and transliteration carried over and Rashi as a layer (#2, #3).

## Phase 3: the study rhythm
Aliyah-a-day and the shnayim mikra tracker, the per-verse read-twice-and-Targum progress structure (#4, #6).

## Phase 4: the haftarah and the page image
The haftarah view with its connection note, and the Mikraot Gedolot page image (#5, #7).

## Phase 5: the study partner
The AI chevruta adapted to the parsha, reusing the partner libraries (#8).

## Phase 6: polish and ship
Offline, install prompt, settings, and the deploy (#9).
