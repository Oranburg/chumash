import { href } from '../lib/routes.js';

// The 404 body. Astro's static build emits this at dist/404.html (via
// src/pages/404.astro), which GitHub Pages serves automatically for any
// unmatched path under /chumash/. No client state, so no client directive
// is needed on the page that hosts it either.
export default function NotFoundScreen() {
  return (
    <main className="app-main">
      <h1>That page is not here</h1>
      <p>
        The page you asked for does not exist. Read this week&rsquo;s portion or
        browse the five books.
      </p>
      <p style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
        <a href={href('')} className="pill-button">This week</a>
        <a href={href('browse/')} className="pill-button">Browse</a>
      </p>
    </main>
  );
}
