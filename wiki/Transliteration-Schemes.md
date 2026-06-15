# Transliteration Schemes

The transliteration engine is carried over from havruta unchanged, and so is its scheme. The full rules and worked examples are in `docs/TRANSLITERATION-SCHEME.md` in the repository, and the engine is `src/lib/transliterate.js`.

In the app, transliteration appears in parentheses on a term's first appearance, never as a replacement for the Hebrew. The Hebrew text shows in Hebrew characters; the transliteration is an aid for reading along, not a substitute.

The smoke test pins the engine to its worked examples (kamats katan, ḥet, vocal shva, dagesh forte), so a regression in the scheme fails the build.
