import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeJournal from './src/lib/rehype-journal.mjs';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'https://meetifyy.github.io',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'never',
  // Fetch update pages before they are clicked so client-side navigation
  // swaps instantly instead of waiting on the network.
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover'
  },
  build: {
    format: 'directory'
  },
  integrations: [
    sitemap()
  ],
  markdown: {
    rehypePlugins: [rehypeJournal],
    shikiConfig: {
      theme: 'github-light',
      wrap: true
    }
  }
});
