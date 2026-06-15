# Sources

All text is fetched from Sefaria at read time. Nothing is bundled.

## Sefaria

- Calendars: `https://www.sefaria.org/api/calendars` returns Parashat Hashavua and the haftarah for a date and locale. This is the calendar engine's primary source.
- Text: the v3 text API for a ref returns Hebrew with vowels and cantillation and the available translations.
- Index: the parsha index gives the canonical Hebrew names and verse ranges for the fifty-four portions, so those are not hand-transcribed.
- Links and commentaries: the links API gives Rashi and the rest of the commentary attached to a verse.
- Manuscript images: `manuscripts.sefaria.org` hosts page scans (Mikraot Gedolot and others) for the page-image feature.

The texts used: the Tanakh (Torah and the haftarah readings from the Prophets), Targum Onkelos, and Rashi. Translations are whatever Sefaria carries for the ref, surfaced through the translation-compare component.

## Calendar fallback

`@hebcal/core` computes the sedra locally with no network, as the offline-cold path and a cross-check on Sefaria.

## Licensing

Sefaria's texts carry their own licenses, mostly Creative Commons or public domain, surfaced per text. See `LICENSING.md` (inherited from havruta) for the approach to attribution and reuse, and confirm each text's license before any redistribution beyond fetch-at-read-time.
