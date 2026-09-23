import type { APIRoute } from 'astro';
import { getAllUpdates, markdownToText } from '@/lib/updates';

/**
 * Static search index (/search-index.json), built from the same Update
 * objects the pages render. Consumed by SearchModal.astro.
 */

/** `### headings` inside the Fixes section: the named issues of the day. */
function fixTitles(body: string): string[] {
  const fixes = body.split(/^##\s+/m).find((part) => /^fixes\s*$/im.test(part.split('\n')[0]));
  if (!fixes) return [];
  return [...fixes.matchAll(/^###\s+(.+)$/gm)].map((m) => m[1].trim());
}

export const GET: APIRoute = async () => {
  const updates = await getAllUpdates();

  const index = updates.map((u) => {
    const body = u.entry.body || '';
    return {
      slug: u.slug,
      title: u.title,
      summary: u.summary,
      isoDate: u.isoDate,
      fullDate: u.formattedDate,
      shortDate: u.shortDate,
      categories: u.categories,
      sections: u.sections,
      commitCount: u.commits.length,
      fixes: fixTitles(body),
      // Body text plus every commit message, so a search for a commit subject
      // finds its day even where the prose words it differently.
      content: [markdownToText(body), ...u.commits.map((c) => `${c.sha} ${c.message}`)].join(' ')
    };
  });

  return new Response(JSON.stringify(index), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
