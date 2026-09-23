import { getCollection, type CollectionEntry } from 'astro:content';
import { SECTIONS, sectionForHeading } from './sections.mjs';

export type UpdateEntry = CollectionEntry<'updates'>;
export type Commit = UpdateEntry['data']['commits'][number];

export interface Update {
  entry: UpdateEntry;
  /** URL slug, e.g. "2026/09/22" (from the file path). */
  slug: string;
  year: string;
  month: string;
  day: string;
  /** "22 September 2026" */
  formattedDate: string;
  /** "22 Sep" */
  shortDate: string;
  /** "2026-09-22" */
  isoDate: string;
  title: string;
  summary: string;
  categories: string[];
  commits: Commit[];
  /** Keys of the sections present in the body, in order (see sections.mjs). */
  sections: string[];
}

export interface MonthGroup {
  name: string;
  monthNum: string;
  updates: Update[];
}

export interface YearGroup {
  year: string;
  months: MonthGroup[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Checks the rules the schema cannot express, failing the build with a
 * message that names the file:
 *  - the file path (YYYY/MM/DD) matches the `date` field;
 *  - every `##` heading is a known section (sections.mjs);
 *  - every commit in `commits` is cited by its sha in the body.
 */
function validate(entry: UpdateEntry, slug: string, isoDate: string): string[] {
  const where = `content/updates/${slug}.md`;
  const body = entry.body || '';

  if (slug !== isoDate.replace(/-/g, '/')) {
    throw new Error(`${where}: file path does not match date ${isoDate}`);
  }

  const sections: string[] = [];
  for (const [, heading] of body.matchAll(/^##\s+(.+?)\s*$/gm)) {
    const section = sectionForHeading(heading);
    if (!section) {
      const allowed = SECTIONS.map((s) => s.heading).join(', ');
      throw new Error(`${where}: unknown section "## ${heading}". Allowed: ${allowed}`);
    }
    sections.push(section.key);
  }

  const missing = entry.data.commits.filter((c) => !body.includes(c.sha));
  if (missing.length) {
    throw new Error(
      `${where}: ${missing.length} commit(s) not cited in the body: ` +
      missing.map((c) => `${c.sha} (${c.message})`).join('; ')
    );
  }

  return sections;
}

export function normalizeUpdate(entry: UpdateEntry): Update {
  const slug = entry.id.replace(/\.md$/, '');
  const date = entry.data.date;
  const year = String(date.getUTCFullYear());
  const monthIndex = date.getUTCMonth();
  const month = String(monthIndex + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const isoDate = `${year}-${month}-${day}`;

  return {
    entry,
    slug,
    year,
    month,
    day,
    formattedDate: `${date.getUTCDate()} ${MONTH_NAMES[monthIndex]} ${year}`,
    shortDate: `${date.getUTCDate()} ${MONTH_SHORT[monthIndex]}`,
    isoDate,
    title: entry.data.title,
    summary: entry.data.summary,
    categories: [...entry.data.categories],
    commits: entry.data.commits,
    sections: validate(entry, slug, isoDate),
  };
}

/** All updates, newest first. */
export async function getAllUpdates(): Promise<Update[]> {
  const entries = await getCollection('updates');
  return entries
    .map(normalizeUpdate)
    .sort((a, b) => b.entry.data.date.getTime() - a.entry.data.date.getTime());
}

/** Updates grouped Year → Month (both newest first), for the sidebar. */
export async function getGroupedUpdates(): Promise<YearGroup[]> {
  const updates = await getAllUpdates();
  const years = new Map<string, Map<string, Update[]>>();

  for (const u of updates) {
    if (!years.has(u.year)) years.set(u.year, new Map());
    const months = years.get(u.year)!;
    if (!months.has(u.month)) months.set(u.month, []);
    months.get(u.month)!.push(u);
  }

  return [...years.keys()]
    .sort((a, b) => Number(b) - Number(a))
    .map((year) => ({
      year,
      months: [...years.get(year)!.keys()]
        .sort((a, b) => Number(b) - Number(a))
        .map((mo) => ({
          name: MONTH_NAMES[Number(mo) - 1],
          monthNum: mo,
          updates: years.get(year)!.get(mo)!
        }))
    }));
}

/** The updates immediately newer and older than `slug`. */
export async function getAdjacentUpdates(slug: string) {
  const updates = await getAllUpdates();
  const i = updates.findIndex((u) => u.slug === slug);
  return {
    newer: i > 0 ? updates[i - 1] : null,
    older: i >= 0 && i < updates.length - 1 ? updates[i + 1] : null
  };
}

/** URL-safe slug for a category ("UI/UX" → "ui-ux", "Build & Tooling" → "build-tooling"). */
export function slugifyCategory(category: string): string {
  return category
    .toLowerCase()
    .trim()
    .replace(/[/&]/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Plain text of a Markdown body (for the search index). */
export function markdownToText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_>~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
