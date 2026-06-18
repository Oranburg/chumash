# Sources

All text is fetched from Sefaria at read time. Nothing is bundled.

## Sefaria

- Calendars: `https://www.sefaria.org/api/calendars` returns Parashat Hashavua and the haftarah for a date and locale. This is the calendar engine's primary source.
- Text: the v3 text API for a ref returns Hebrew with vowels and cantillation and the available translations.
- Index: the parsha index gives the canonical Hebrew names and verse ranges for the fifty-four portions, so those are not hand-transcribed.
- Links and commentaries: the links API gives Rashi and the rest of the commentary attached to a verse.
- Manuscript images: `manuscripts.sefaria.org` hosts page scans (Mikraot Gedolot and others) for the page-image feature.

### Per-verse classical commentary

Verified on 2026-06-18 against the current weekly portion, Korach (Numbers 16:1 through 18:32).

The reading view opens the six classical parshanim on a single verse from one endpoint:

```
https://www.sefaria.org/api/links/<verse ref>?with_text=1
```

For example `https://www.sefaria.org/api/links/Numbers%2016:1?with_text=1`. The response is a JSON array of link objects. Each object carries `category`, `collectiveTitle` (with `en` and `he`), `index_title`, `ref`, and (because `with_text=1`) `he` and `text` holding the Hebrew and English of the linked work inline. `getVerseCommentaries` in `src/lib/sefaria.js` keeps only six of these works and ignores the rest:

- Onkelos sits in the `Targum` category; its title is `Onkelos <Book>` (for example `Onkelos Numbers`), matched on the substring `onkelos`.
- Rashi, Rashbam, Ibn Ezra, Ramban, and Sforno sit in the `Commentary` category, each under a `collectiveTitle.en` that is exactly the commentator's name.

One commentator can carry several comment segments on one verse. Sefaria returns those as separate link objects whose refs are numbered (`Rashi on Numbers 16:1:1`, `Rashi on Numbers 16:1:2`, and so on). The function collects them sorted by ref so they read in written order. A commentator with no comment on the verse is absent from the response and so is absent from the panel.

What Numbers 16:1 returned on the verification date: Onkelos (the Aramaic of the verse plus an English rendering), Rashi (five segments, the first opening "This section is beautifully expounded in the Midrash of Rabbi Tanchuma"), Rashbam (two segments), Ibn Ezra (two segments), Ramban (one), and Sforno (one). The same array also held Midrash, Chasidut, Talmud, later supercommentary (for example Divrei David, whose English came back as an empty array), and other categories; none of those reach the panel.

The HTML in `he` and `text` is stripped and its entities decoded by the same `stripHtml` the rest of the data layer uses. The text is otherwise Sefaria's, verbatim.

The texts used: the Tanakh (Torah and the haftarah readings from the Prophets), Targum Onkelos, and Rashi. Translations are whatever Sefaria carries for the ref, surfaced through the translation-compare component.

## Calendar fallback

`@hebcal/core` computes the sedra locally with no network, as the offline-cold path and a cross-check on Sefaria.

## Licensing

Sefaria's texts carry their own licenses, mostly Creative Commons or public domain, surfaced per text. See `LICENSING.md` (inherited from havruta) for the approach to attribution and reuse, and confirm each text's license before any redistribution beyond fetch-at-read-time.
