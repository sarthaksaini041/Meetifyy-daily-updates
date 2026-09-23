/**
 * Build-time structure for update pages (registered in astro.config.mjs).
 *
 * - Wraps each `## Section` (see src/lib/sections.mjs) and everything up to
 *   the next `##` in <section class="update-section update-section--<key>">.
 * - Wraps every <table> in <div class="table-wrapper"> (horizontal scroll)
 *   and every <pre> in <div class="code-block"> (anchors the copy button
 *   outside the horizontally scrolling <pre>).
 *
 * Done at build time so the HTML is final on first paint; nothing shifts.
 */
import { sectionForHeading } from './sections.mjs';

const isEl = (node, tag) => node?.type === 'element' && node.tagName === tag;

function textOf(node) {
  if (node.type === 'text') return node.value;
  return (node.children || []).map(textOf).join('');
}

function wrapSections(tree) {
  const out = [];
  const kids = tree.children;
  for (let i = 0; i < kids.length; i++) {
    const node = kids[i];
    const section = isEl(node, 'h2') ? sectionForHeading(textOf(node)) : null;
    if (!section) {
      out.push(node);
      continue;
    }
    const wrapper = {
      type: 'element',
      tagName: 'section',
      properties: {
        className: ['update-section', `update-section--${section.key}`],
        dataSection: section.key,
      },
      children: [node],
    };
    while (i + 1 < kids.length && !isEl(kids[i + 1], 'h2')) {
      wrapper.children.push(kids[++i]);
    }
    out.push(wrapper);
  }
  tree.children = out;
}

const WRAPPERS = { table: 'table-wrapper', pre: 'code-block' };

function wrapBlocks(node) {
  if (!node.children) return;
  node.children = node.children.map((child) => {
    // Astro inserts Shiki-highlighted code as raw HTML, so match that too.
    const cls = child.type === 'element'
      ? WRAPPERS[child.tagName]
      : child.type === 'raw' && /^\s*<pre[\s>]/.test(child.value) && WRAPPERS.pre;
    if (cls) {
      return {
        type: 'element',
        tagName: 'div',
        properties: { className: [cls] },
        children: [child],
      };
    }
    wrapBlocks(child);
    return child;
  });
}

export default function rehypeJournal() {
  return (tree) => {
    wrapSections(tree);
    wrapBlocks(tree);
  };
}
