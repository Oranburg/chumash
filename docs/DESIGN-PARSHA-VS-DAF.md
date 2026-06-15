# Design: a parsha is not a daf

Havruta studies one daf of Talmud a day on a single global cycle. Chumash studies one Torah portion a week on the annual cycle. The two share a great deal of plumbing, and almost none of the shape. This document records what changes and why, so the build follows from the difference rather than from the inherited app.

## The unit and the cycle

A daf is a page, and the daf yomi cycle is linear and global: every learner in the world is on the same page on the same day, and tomorrow's page is today's plus one. Computing "today's daf" is close to a lookup.

A parsha is a named portion, one of fifty-four, read on the annual cycle from Simchat Torah to Simchat Torah. Which parsha falls on a given Shabbat is not a simple offset. It depends on the Hebrew calendar: leap years insert a second month of Adar, the year takes one of fourteen types, festivals that land on Shabbat displace the weekly reading, and seven pairs of portions combine into one in some years and separate in others. On top of that, Israel and the Diaspora fall out of step for several weeks whenever a festival's last day meets a Shabbat, because the Diaspora reads an extra holiday portion and then spends weeks catching up.

The consequence for the build: we do not reimplement the Hebrew calendar. The parsha of the week comes from Sefaria's calendars API, with `@hebcal/core` as an offline fallback. This is the single most important architectural decision and it is the first issue. See `ARCHITECTURE.md`.

## The internal structure

A daf is read straight through. A parsha has structure inside it that the layout should honor: seven aliyot read in sequence (Rishon through Shvi'i), a maftir, and a haftarah, a paired reading from the Prophets chosen to echo the portion. That structure is the basis for two things havruta has no analog for: an aliyah-a-day rhythm, and a companion reading from a different book.

## The companions

Havruta surrounds the daf with Rashi and Tosafot and the network of Talmudic cross-links. Chumash surrounds the verse with a different set: Targum Onkelos, the Aramaic translation read alongside the Hebrew for two thousand years; Rashi, the first commentary a reader meets; and the haftarah as a thematic companion. The reading view is therefore a parallel of Hebrew, Targum, and translation, with Rashi as a layer the reader opens. This is the Mikraot Gedolot page rendered for a phone.

## The study rhythm

This is the deepest difference, and the best opportunity. Daf yomi is a daily discipline with a daily unit. The parsha is weekly, but it is traditionally studied across the week, and there is a specific practice with no daf analog: shnayim mikra v'echad targum, reading each verse of the parsha twice in the Hebrew and once in the Targum before Shabbat. That practice is a built-in progress structure. A per-verse tracker (read once, read twice, Targum once) with a weekly completion meter is the signature feature of this app, and it falls straight out of how the parsha is actually learned. The aliyah-a-day mode gives the weekly portion a daily cadence, so the app has something to open every day, the way havruta does.

## The image

Havruta shows the Vilna daf, the page image that learners picture. The chumash analog is the Mikraot Gedolot page, the rabbinic Bible with the text framed by Targum and commentaries, or a Torah-scroll column. Sefaria hosts manuscript page images; the same image-caching the PWA already does for havruta carries over.

## What this means for the layout

The home screen is "this week's parsha," not "today's page": the name in Hebrew with transliteration and translation, the date range, the seven aliyot, and the haftarah. From there a reader can enter the parallel reading view, switch to aliyah-a-day, open the shnayim mikra tracker, or read the haftarah with the note on why it pairs with the portion. The navigation browses by book and parsha rather than by tractate and daf. The translation-tap and the transliteration-on-first-appearance carry over unchanged, because those are about how a reader meets Hebrew, which is the same problem in both projects.

## Summary table

| Dimension | Daf yomi (havruta) | Weekly parsha (chumash) |
| --- | --- | --- |
| Unit | one daf, daily | one parsha of 54, weekly |
| Cycle | linear global, ~7.5 years | annual, Hebrew-calendar dependent |
| "Today" | offset from cycle start | Sefaria calendars API + hebcal fallback |
| Internal structure | read straight through | 7 aliyot + maftir + haftarah |
| Companions | Rashi, Tosafot, cross-links | Targum Onkelos, Rashi, haftarah |
| Native rhythm | daily page | aliyah-a-day + shnayim mikra |
| Page image | Vilna daf | Mikraot Gedolot page / scroll column |
| Navigation | tractate then daf | book then parsha |
| Carried over unchanged | translation tap, transliteration, Sefaria text, study partner, PWA, design system | same |
