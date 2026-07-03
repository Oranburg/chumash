// Route-path helper for the multi-page Astro site.
//
// The app is deployed at oranburg.law/chumash/ (astro.config.mjs sets
// base: '/chumash/'), and the Cloudflare Workers preview mirrors that same
// base on disk (see scripts/postbuild-cf.mjs). Every real page is now its own
// static route (src/pages/browse.astro, src/pages/haftarah.astro, and so on)
// instead of a client-side HashRouter route inside one big App.jsx island, so
// every cross-page link in the React screens has to be a plain <a href>
// carrying that base path, not a react-router <Link>.
//
// import.meta.env.BASE_URL is set by Vite/Astro at build time from the same
// `base` config value, and it is available identically whether this module
// runs during the server-side (build-time, Node) render pass or the client
// hydration pass, so href() produces the same string on both passes and
// never causes a hydration mismatch.
const BASE = import.meta.env.BASE_URL || '/';

// Build a same-origin href under the app's base path. Accepts a path with or
// without a leading slash; always returns one with the base prefix and no
// double slash, e.g. href('browse/') -> '/chumash/browse/'.
export function href(path = '') {
  const clean = String(path).replace(/^\/+/, '');
  return BASE + clean;
}
