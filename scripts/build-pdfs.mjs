// Renders every built update page to dist/pdf/meetifyy-update-YYYY-MM-DD.pdf.
// Runs after `astro build`: serves ./dist under BASE_PATH, prints each
// /updates/YYYY/MM/DD page with the site's print stylesheet in Chromium.
import { createServer } from 'node:http';
import { readFile, readdir, mkdir, stat } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { chromium } from 'playwright';
import { renderPdf } from './pdf-render.mjs';

const DIST = resolve('dist');
const BASE = (process.env.BASE_PATH ?? '').replace(/\/$/, '');
const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2',
};

async function findUpdates() {
  const root = join(DIST, 'updates');
  const out = [];
  for (const y of await readdir(root))
    for (const m of await readdir(join(root, y)))
      for (const d of await readdir(join(root, y, m))) out.push(`${y}/${m}/${d}`);
  return out.sort();
}

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (BASE && path.startsWith(BASE)) path = path.slice(BASE.length);
  let file = join(DIST, path);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
const page = await browser.newPage();
await mkdir(join(DIST, 'pdf'), { recursive: true });

try {
  for (const slug of await findUpdates()) {
    const out = join(DIST, 'pdf', `meetifyy-update-${slug.replace(/\//g, '-')}.pdf`);
    await renderPdf(page, `${origin}${BASE}/updates/${slug}/`, out);
    console.log(`pdf  ${out.slice(DIST.length + 1)}`);
  }
} finally {
  await browser.close();
  server.close();
}
