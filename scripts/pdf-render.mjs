// Shared PDF rendering: used by the post-build step (build-pdfs.mjs) and by
// the dev-server route in astro.config.mjs, so both produce the same file.
export const PDF_PATTERN = /\/pdf\/meetifyy-update-(\d{4})-(\d{2})-(\d{2})\.pdf$/;

// Chromium renders header/footer templates in their own context: styles must
// be inline and fonts are the system's. pageNumber/totalPages are filled in.
function footerTemplate() {
  return `<div style="width:100%;margin:0 14mm;display:flex;justify-content:space-between;
      font-family:'Helvetica Neue',Arial,sans-serif;font-size:7.5px;font-weight:400;color:#000">
    <span>Meetifyy - Daily Technical Update</span>
    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
  </div>`;
}

/** Loads `url` in `page` with print media and returns the PDF (optionally also written to `path`). */
export async function renderPdf(page, url, path) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => document.fonts.ready);
  // Category chips are plain labels in the PDF, not links back to the site.
  await page.$$eval('.journal-category', (els) => els.forEach((el) => el.removeAttribute('href')));
  return page.pdf({
    path,
    format: 'A4',
    printBackground: true,
    margin: { top: '16mm', bottom: '20mm', left: '14mm', right: '14mm' },
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: footerTemplate(),
  });
}

/** Astro integration: serves /pdf/meetifyy-update-YYYY-MM-DD.pdf under `astro dev`, rendered on request. */
export function devPdfRoute() {
  return {
    name: 'dev-pdf-route',
    hooks: {
      'astro:server:setup': ({ server }) => {
        let browser;
        server.middlewares.use(async (req, res, next) => {
          const match = req.url && PDF_PATTERN.exec(req.url.split('?')[0]);
          if (!match) return next();
          const [, y, m, d] = match;
          const base = req.url.split('/pdf/')[0];
          const origin = `http://${req.headers.host}`;
          let page;
          try {
            const { chromium } = await import('playwright');
            // Fresh import per request so edits to this file apply without restarting dev.
            const { renderPdf } = await import(`./pdf-render.mjs?t=${Date.now()}`);
            browser ??= await chromium.launch();
            page = await browser.newPage();
            const pdf = await renderPdf(page, `${origin}${base}/updates/${y}/${m}/${d}`);
            res.writeHead(200, {
              'content-type': 'application/pdf',
              'content-disposition': `attachment; filename="meetifyy-update-${y}-${m}-${d}.pdf"`,
            });
            res.end(pdf);
          } catch (err) {
            res.writeHead(500, { 'content-type': 'text/plain' }).end(`PDF render failed: ${err.message}`);
          } finally {
            await page?.close();
          }
        });
        server.httpServer?.on('close', () => browser?.close());
      },
    },
  };
}
