# Meetifyy — Daily Technical Updates

A high-performance, aesthetic static documentation website and engineering journal for Meetifyy's daily development logs.

Built with **Astro**, **Markdown / MDX**, and modern **Vanilla CSS**. Hosted publicly via **GitHub Pages** while maintaining the source repository strictly **private**.

---

## Architecture & Features

- **Markdown as Source of Truth**: Dropping any file into `content/updates/YYYY/MM/DD.md` automatically generates pages, updates the desktop and mobile navigation, computes commit metrics, and refreshes the search index.
- **Pure Static Output**: Zero backend, zero database, zero API servers, zero authentication requirements.
- **Fast Client Search**: Instant search modal (`⌘K` / `Ctrl+K`) powered by a build-time pre-indexed JSON index with matching snippet highlights and keyboard navigation.
- **Chronological Navigation**: Left sidebar organized by Year → Month → Date with commit counts and tactile active state indicators.
- **Selective Visual Hierarchy**: Distinct callout treatments for **🐛 Major Issues Addressed**, **🔍 Technical Findings**, **🧪 Testing**, and **⚙️ Technical Improvements**, while keeping standard narrative sections as clean, spacious editorial text.
- **Private Repository to Public Pages**: Deployable via GitHub Actions with zero credential exposure.

---

## Adding a Daily Update

To publish a new daily engineering journal entry, simply create a Markdown file matching the date structure:

```text
content/updates/2026/09/23.md
```

### Frontmatter Specification

```yaml
---
date: 2026-09-23                 # must match the file path
title: "A specific title for the day's work"
summary: "One or two sentences used on cards, in search and as the page description."
categories:                      # 1–5, from CATEGORIES in src/content.config.ts
  - Mobile App
  - UI/UX
commits:                         # every commit made that day, oldest first
  - sha: "5c12709"
    time: "23:09"
    message: "feat(ui): …"
---

## Fixes
### A named fix
- What changed and why. (`5c12709`)

## Improvements
## Findings
## Testing
## Documentation
## Build & Tooling
```

Only these `##` sections are allowed (see `src/lib/sections.mjs`), and every commit
listed in `commits` must be cited by its sha in the body; the build fails otherwise.

---

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production static bundle into ./dist
npm run build

# Preview production build locally
npm run preview
```

---

## GitHub Pages Deployment Setup

1. **Keep Repository Private**: Ensure the repository visibility is set to **Private** in GitHub settings.
2. **Configure GitHub Pages Source**:
   - Go to repository **Settings** → **Pages**.
   - Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. **Automatic Deployment**:
   - Every push to the `main` branch automatically runs `.github/workflows/deploy.yml`, builds the static site into `./dist`, and deploys it publicly to GitHub Pages.
   - The generated static site contains only pre-rendered HTML, CSS, assets, and markdown logs—no secrets or internal Git credentials are exposed.
