# Design: Parsha vs Daf

Havruta studies one daf of Talmud a day on a single global cycle. Chumash studies one Torah portion a week on the annual cycle. They share the plumbing and almost none of the shape. The full version is in `docs/DESIGN-PARSHA-VS-DAF.md`.

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
| Carried over | translation tap, transliteration, Sefaria text, study partner, PWA, design system | same |

The deepest difference is the rhythm. The parsha is weekly but studied across the week, and there is a specific practice with no daf analog: shnayim mikra v'echad targum, reading each verse twice in the Hebrew and once in the Targum before Shabbat. That practice is a built-in progress structure, and the per-verse tracker that follows from it is the signature feature of this app.
