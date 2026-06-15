# Prompt C: companions, partner, and ship

Closes issues #5, #7, #8, and #9. Prompts A and B must be done.

## Build

1. The haftarah view. Render the week's haftarah (resolved from the calendars API, with the Ashkenazi and Sephardi variants) in the same read-and-tap view as the Torah, with a short note on why this reading pairs with the portion.

2. The page image. Show the Mikraot Gedolot page (or a Torah-scroll column) for the portion from `manuscripts.sefaria.org`, as the visual anchor, reusing the image component and the PWA image caching already configured.

3. The study partner. Adapt the partner libraries (`anthropic.js`, `providers.js`, and the partner prompt) to the parsha: it discusses a verse, a Rashi, or a thematic question, and challenges the reader's reading rather than handing over the answer. Gate it behind sign-in as havruta does.

4. Ship. Settings for locale (Diaspora or Israel), rite (Ashkenazi or Sephardi), and theme; the install prompt; offline behavior confirmed; and the GitHub Pages deploy verified at the `/chumash/` path.

## Done when

The full week is in the app: the portion, the Targum and Rashi, the haftarah with its note, the page image, the shnayim mikra tracker, and a study partner that pushes back. It installs, works offline after a first visit, and is deployed. The build and smoke test pass.
