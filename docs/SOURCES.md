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

## Leyning audio (PocketTorah)

Verified on 2026-06-18.

The "chant this aliyah" player streams the Torah reading chanted in the Ashkenazi (Avery-Binder) trope from PocketTorah, the open project by Russel Neiss and Charlie Schwartz. The recordings live in the `rneiss/PocketTorah` GitHub repository under `data/audio`, one MP3 per aliyah.

### URL pattern

```
https://raw.githubusercontent.com/rneiss/PocketTorah/master/data/audio/<Basename>-<n>.mp3
```

`<n>` is `1` through `7` for the seven aliyot and `H` for the haftarah. `<Basename>` is the portion name with spaces and apostrophes removed, with one literal hyphen kept in `Lech-Lecha`. A few names do not reduce cleanly from Sefaria's display form, so `src/lib/leyning.js` carries an explicit table for them: `Re'eh` becomes `Reeh`, `Va'etchanan` becomes `Vaethanan`, `Beha'alotcha` becomes `Behaalotcha`, `Sh'lach` becomes `Shlach`, `V'Zot HaBerachah` becomes `VezotHaberakhah`, `Achrei Mot` becomes `AchreiMot`, `Chayei Sara` becomes `ChayeiSara`, `Ki Tavo` becomes `KiTavo`, `Ki Teitzei` becomes `KiTeitzei`, `Ki Tisa` becomes `KiTisa`, `Ha'azinu` becomes `Haazinu`. All fifty-four basenames were confirmed present in the repository directory listing on the verification date.

Examples that returned HTTP 200: `Bereshit-1.mp3`, `Bereshit-H.mp3`, `Lech-Lecha-1.mp3`, `Reeh-1.mp3`, `Vaethanan-1.mp3`, `VezotHaberakhah-1.mp3`, `Balak-1.mp3`.

A doubled week has no combined recording. PocketTorah recorded each portion separately, so the player uses the first portion of the pair and says so in the interface.

### Cross-origin and range headers (the reason this path is safe)

`curl -I` on `https://raw.githubusercontent.com/rneiss/PocketTorah/master/data/audio/Balak-1.mp3` returned, among others:

```
HTTP/2 200
content-type: audio/mpeg
accept-ranges: bytes
access-control-allow-origin: *
cross-origin-resource-policy: cross-origin
content-length: 1090967
```

A cross-origin GET with `Origin: https://oranburg.github.io` and `Range: bytes=0-1023` returned `HTTP/2 206` with `content-range: bytes 0-1023/1090967` and the same `access-control-allow-origin: *`. So the host serves the files to a different origin, allows the bytes to be read (CORS), and honors range requests, which is what the native scrubber and any cross-origin fetch need from a GitHub Pages site. The `content-disposition: attachment` header does not stop an `<audio>` element or a `fetch`. The player sets `crossOrigin="anonymous"` and `preload="none"` so nothing streams until the reader presses play.

### License and attribution

The recordings are released under Creative Commons Attribution-ShareAlike 3.0 (CC BY-SA 3.0), confirmed on the Internet Archive mirror (`archive.org/details/PockettorahAudioFiles`) and in the project's public account of its 2011 Jewish New Media Fund grant. The PocketTorah application code is LGPL, which does not affect playing the audio. The player carries a visible credit: the recording is from PocketTorah, chanted in the Avery-Binder Ashkenazi trope, released under CC BY-SA 3.0, with links to the source and the license. CC BY-SA requires attribution and that any redistribution of the audio itself carry the same license; this app streams the files in place rather than redistributing them, and the attribution travels with the player.

### Per-word sync (not used)

PocketTorah also ships per-word onset times in `data/torah/labels/<Parsha> -<n>.txt` (note the labels directory uses a different name form than the audio: a space and a lowercase `h`). Each file is a flat comma-separated list of timestamps in seconds, one per word, with no verse or word text in the file. Word-level highlighting is therefore possible but would need its own name mapping plus an alignment between those positions and Sefaria's word tokens. It was left out of this build to keep the player simple and the build safe, and is documented here as a future option.

## Calendar fallback

`@hebcal/core` computes the sedra locally with no network, as the offline-cold path and a cross-check on Sefaria.

## Licensing

Sefaria's texts carry their own licenses, mostly Creative Commons or public domain, surfaced per text. See `LICENSING.md` (inherited from havruta) for the approach to attribution and reuse, and confirm each text's license before any redistribution beyond fetch-at-read-time.
