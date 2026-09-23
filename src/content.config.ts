import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Categories an update can be filed under. A fixed list so the same area is
 * never spelled two ways (it drives /tags/<category> and the search filter).
 */
export const CATEGORIES = [
  'Authentication',
  'Security',
  'Messaging',
  'Media',
  'Mobile App',
  'Frontend Architecture',
  'Backend',
  'UI/UX',
  'Theming',
  'Performance',
  'Infrastructure',
  'Build & Tooling',
  'Testing',
  'Documentation',
] as const;

/** One commit from the Meetifyy repository, as it appears in `git log`. */
const commit = z.object({
  sha: z.string().regex(/^[0-9a-f]{7,40}$/, 'short or full commit hash'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM, author local time'),
  message: z.string().min(1),
});

/**
 * Daily Update: content/updates/YYYY/MM/DD.md
 *
 * `commits` is the complete list of commits made that day; the commit
 * count, the commit log on the page and part of the search index are all
 * derived from it. Every sha listed here must also be cited in the body
 * (enforced in src/lib/updates.ts), so no commit goes undocumented.
 */
const updates = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/updates' }),
  schema: z
    .object({
      date: z.coerce.date(),
      title: z.string().min(8).max(90),
      summary: z.string().min(40).max(320),
      categories: z.array(z.enum(CATEGORIES)).min(1).max(5),
      commits: z.array(commit).min(1),
    })
    .strict(),
});

export const collections = { updates };
