# Prompt B: reading and rhythm

Closes issues #3, #4, and #6. Prompt A must be done: the parsha of the week resolves and the home and navigation work.

## Build

1. The reading view. Render the portion as a parallel of Hebrew (with vowels and cantillation), Targum Onkelos, and a translation, verse by verse. Carry over the translation-tap (the translation is revealed or compared on a tap, via `TranslationCompare`) and the transliteration on first appearance (via `TappableHebrew` and `WordPopover`). Add Rashi as a layer the reader opens on a verse, fetched through the Sefaria links API. This is the Mikraot Gedolot page rendered for a phone.

2. Aliyah-a-day. Offer a mode that surfaces one aliyah per weekday, Sunday through Friday, and the whole portion on Shabbat, so the weekly portion has a daily cadence.

3. The shnayim mikra tracker. For each verse, three marks: first reading, second reading, and Targum (or Rashi) once. Persist progress locally per portion per cycle, and show a weekly meter that fills toward Shabbat. This is the signature feature; see `docs/HOW-PARSHA-IS-LEARNED.md`.

## Done when

A reader reads the portion in Hebrew with the translation a tap away and transliteration on first appearance, follows the Targum and Rashi alongside, switches to aliyah-a-day, and tracks shnayim mikra to a weekly meter that persists across sessions. The build and smoke test pass.
