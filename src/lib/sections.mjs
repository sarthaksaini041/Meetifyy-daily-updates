/**
 * The one list of sections a Daily Update body may contain.
 *
 * Every `## Heading` in an update must be one of these (checked at build
 * time in src/lib/updates.ts). The rehype plugin, the page styling, the
 * search index and the search filters all read this list, so a section is
 * defined in exactly one place.
 *
 * `callout: true` sections get a tinted card (see markdown.css,
 * `.update-section--<key>`); the rest render as plain prose.
 *
 * Plain .mjs (not .ts) because astro.config.mjs imports the rehype plugin
 * that uses it before TypeScript is involved.
 */
export const SECTIONS = [
  { key: 'fixes', heading: 'Fixes', callout: true },
  { key: 'improvements', heading: 'Improvements', callout: true },
  { key: 'findings', heading: 'Findings', callout: true },
  { key: 'testing', heading: 'Testing', callout: true },
  { key: 'documentation', heading: 'Documentation', callout: false },
  { key: 'tooling', heading: 'Build & Tooling', callout: false },
];

const BY_HEADING = new Map(SECTIONS.map((s) => [s.heading.toLowerCase(), s]));

/** The section a `## heading` text names, or undefined. */
export function sectionForHeading(text) {
  return BY_HEADING.get(String(text).trim().toLowerCase());
}
