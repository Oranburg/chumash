// Repackage the Astro build for a Cloudflare Workers preview deploy.
//
// The GitHub Pages deploy serves this app at oranburg.law/chumash/, so
// astro.config.mjs bakes '/chumash/' into every asset URL in dist/index.html.
// That base path stays put deliberately: the smoke suite asserts on it, and
// changing it would also change the GitHub Pages build we still ship. But a
// Cloudflare Workers preview site is served from a bare workers.dev root, and
// Workers static assets are matched by exact pathname against files on disk,
// so a request for /chumash/_astro/foo.js only resolves if a file actually
// lives at chumash/_astro/foo.js relative to the assets directory.
//
// This script solves that by copying dist/ into dist-cf/chumash/ (mirroring
// the base path on disk) and adding a tiny redirect page at dist-cf/index.html
// so the bare workers.dev root sends a visitor straight to /chumash/, where
// the real app and all of its base-prefixed asset paths resolve correctly.
//
// Nothing here touches src/, astro.config.mjs, or the engine surface; it only
// rearranges the already-built dist/ output for one extra deploy target.

import { existsSync, rmSync, mkdirSync, cpSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(root, 'dist');
const cfDir = join(root, 'dist-cf');

if (!existsSync(distDir)) {
  console.error('dist-cf: dist/ not found, run `npm run build` first');
  process.exit(1);
}

rmSync(cfDir, { recursive: true, force: true });
mkdirSync(cfDir, { recursive: true });
cpSync(distDir, join(cfDir, 'chumash'), { recursive: true });

writeFileSync(
  join(cfDir, 'index.html'),
  `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="0; url=/chumash/">
<link rel="canonical" href="/chumash/">
<title>Chumash</title>
</head>
<body>
<p>Redirecting to <a href="/chumash/">/chumash/</a>.</p>
</body>
</html>
`
);

console.log('dist-cf: wrote', cfDir);
