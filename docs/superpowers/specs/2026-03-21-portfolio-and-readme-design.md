# Portfolio Site & Dynamic README — Design Spec

**Date:** 2026-03-21
**Repo:** arustydev/arustydev (GitHub special profile repo)
**Surfaces:** im.arusty.dev (portfolio site) + README.md (GitHub profile)

---

## Overview

This repo serves two independent purposes:

1. **Portfolio site** at `im.arusty.dev` — an Astro 5 static site with CV, resume variants, portfolio, about, and contact pages. Resume PDFs are generated from structured JSON data via a LaTeX pipeline.
2. **Dynamic README** — a GitHub Action on a cron that queries GitHub APIs and blog RSS to generate SVG visualizations and markdown, committed back to the repo.

The two workstreams share the repo but are independent: different build pipelines, different triggers, different outputs.

---

## Repo Structure

```
arustydev/
├── .github/
│   └── workflows/
│       ├── build-pdfs.yml            # Builds LaTeX PDFs, commits to repo
│       ├── update-readme.yml         # Cron: generates README artifacts + commits
│       ├── auto-assign.yml           # (existing)
│       └── dependabot-issue.yml      # (existing)
├── site/                             # Astro project root
│   ├── astro.config.ts
│   ├── package.json
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index.astro           # Landing page
│   │   │   ├── about.astro
│   │   │   ├── cv.astro              # Full CV rendered from data/cv.json
│   │   │   ├── resume/
│   │   │   │   ├── index.astro       # Resume listing (all variants)
│   │   │   │   └── [slug].astro      # Dynamic route per resume profile
│   │   │   ├── portfolio.astro
│   │   │   └── contact.astro
│   │   ├── layouts/
│   │   ├── components/
│   │   └── styles/
│   ├── content/                      # MDX content collections
│   │   ├── about/
│   │   └── portfolio/
│   └── public/
│       └── resumes/                  # PDFs committed by CI
├── data/
│   ├── cv.json                       # Canonical structured data (superset)
│   ├── schema.ts                     # Canonical TypeScript types for cv.json and resume profiles
│   └── resumes/
│       ├── backend-engineer.json     # Named profile — cherry-picks from cv.json
│       └── devops-engineer.json
├── templates/
│   └── resume.tex                    # LaTeX template (sb2nov/resume-derived)
├── readme/
│   ├── generate.ts                   # README generation script
│   ├── templates/                    # SVG templates / partials
│   └── assets/                       # Generated SVGs (committed by CI)
├── scripts/
│   ├── build-pdf.sh                  # Wrapper: runs render-tex.ts then tectonic
│   ├── build-all-pdfs.sh            # Iterates all profiles, calls build-pdf.sh for each
│   ├── build-readme.sh              # Installs deps, runs readme/generate.ts
│   └── render-tex.ts                 # Resolves profile JSON → .tex file
├── wrangler.jsonc                    # Cloudflare Pages config
├── README.md                         # Generated — do not edit manually
└── package.json                      # Root workspace / shared scripts
```

---

## Data Model

### cv.json (Canonical Data — Superset)

```json
{
  "personal": {
    "name": "...",
    "email": "...",
    "phone": "...",
    "location": "...",
    "links": {
      "github": "...",
      "linkedin": "...",
      "website": "...",
      "blog": "..."
    }
  },
  "experience": [
    {
      "id": "acme-senior-swe",
      "company": "Acme Corp",
      "title": "Senior Software Engineer",
      "location": "Remote",
      "start": "2022-03",
      "end": null,
      "highlights": [
        "Led migration of...",
        "Built distributed..."
      ],
      "tags": ["backend", "rust", "infra"]  // Optional. Not used for filtering — reserved for future use (e.g., portfolio page grouping). Resume profiles use explicit IDs.
    }
  ],
  "education": [
    {
      "id": "mit-cs",
      "institution": "...",
      "degree": "...",
      "field": "...",
      "start": "...",
      "end": "...",
      "highlights": []
    }
  ],
  "skills": [
    {
      "id": "languages",
      "category": "Languages",
      "items": ["Rust", "TypeScript", "Go", "Python"]
    }
  ],
  "projects": [
    {
      "id": "open-source-tool",
      "name": "...",
      "description": "...",
      "url": "...",
      "highlights": []
    }
  ],
  "certifications": [
    {
      "id": "aws-saa",
      "name": "...",
      "issuer": "...",
      "date": "...",
      "url": "..."
    }
  ]
}
```

### Resume Profile (e.g., `data/resumes/backend-engineer.json`)

```json
{
  "slug": "backend-engineer",
  "title": "Backend Engineer",
  "include": {
    "experience": ["acme-senior-swe", "initech-swe"],
    "education": ["mit-cs"],
    "skills": ["languages", "infrastructure"],
    "projects": ["open-source-tool"],
    "certifications": ["aws-saa"]
  },
  "overrides": {
    "experience.acme-senior-swe.highlights": [
      "Tailored highlight for this specific resume..."
    ]
  }
}
```

Profiles use explicit cherry-picking by entry ID. The `overrides` map allows replacing specific fields per-entry for a given resume variant (e.g., tailored highlights for a backend role vs. a devops role). Profiles are version-controlled and fully manually curated.

### Override Resolution Rules

- Overrides only apply to entries listed in the profile's `include` map. An override referencing an ID not in `include` is a build error.
- Override paths use dot notation: `<collection>.<id>.<field>` (e.g., `experience.acme-senior-swe.highlights`).
- An override targeting a non-existent field path is a build error.
- Overrides are **full replacements** — the entire field value is replaced, not merged. For example, overriding `highlights` replaces the entire array, it does not append to it.
- Only leaf fields can be overridden (e.g., `highlights`, `title`, `location`). You cannot override an entire entry object.

### Shared Type Definitions (`data/schema.ts`)

Canonical TypeScript types for `cv.json` and resume profiles live in `data/schema.ts`. This file is imported by:
- Astro pages (for rendering CV and resume pages)
- `scripts/render-tex.ts` (for PDF generation)
- A build-time validation step that ensures `cv.json` and all resume profiles conform to the schema

This is the single source of truth for the data shape. Fields:
- `experience[].end` is `string | null` (null = current role)
- `highlights` arrays are required but may be empty (`[]`)
- All `id` fields are required and must be unique within their collection

---

## Workstream 1: Portfolio Site (im.arusty.dev)

### Stack

- **Framework:** Astro 5 + TypeScript
- **Styling:** Tailwind CSS v4
- **Deployment:** Cloudflare Pages (static site via Cloudflare App, connected to repo)

### Pages

| Route | Source | Description |
|---|---|---|
| `/` | `index.astro` | Landing page — brief intro, links to sections |
| `/about` | `about.astro` + MDX content | Personal narrative |
| `/cv` | `cv.astro` | Full CV rendered from `data/cv.json`. Web-native layout, not a PDF viewer. All experience, education, skills, projects, certifications. |
| `/resume` | `resume/index.astro` | Listing of all resume variants with target role and PDF download links |
| `/resume/[slug]` | `resume/[slug].astro` | Filtered resume view from named profile + cv.json. Prominent "Download PDF" button. |
| `/portfolio` | `portfolio.astro` + MDX content | Project writeups, case studies |
| `/contact` | `contact.astro` | Contact info and links. No form — static page with email, GitHub, LinkedIn, etc. A contact form via Cloudflare Worker is a future enhancement, out of scope for initial build. |

### Data Flow

Astro reads `data/cv.json` and `data/resumes/*.json` at build time. No runtime data fetching. The CV page renders the full JSON. Resume pages resolve the profile's cherry-picked IDs against cv.json and apply overrides.

### Cloudflare Pages Config (`wrangler.jsonc`)

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "portfolio-worker",
  "compatibility_date": "2025-11-15",
  "build": {
    "command": "npm run build"
  },
  "assets": {
    "directory": "./site/dist",
    "not_found_handling": "404-page",
    "html_handling": "auto-trailing-slash"
  },
  "routes": [
    {
      "pattern": "im.arusty.dev",
      "custom_domain": true
    }
  ]
}
```

The Cloudflare Pages App is connected to the repo in the Cloudflare dashboard. On push to `main`, Cloudflare runs `npm run build` (Astro build only — PDFs are already committed as static assets) and deploys `site/dist/`.

**Note:** The root `package.json` `build` script should `cd site && npm install && npm run build` (or use npm workspaces — see Package Management below). The `wrangler.jsonc` build command runs from the repo root, so it must handle navigating to the Astro project.

---

## Workstream 2: Dynamic README

### Trigger

GitHub Action (`update-readme.yml`) on:
- Cron schedule: every 6 hours (`0 */6 * * *`)
- Manual dispatch (`workflow_dispatch`)

### Data Sources

| Source | Method | Data |
|---|---|---|
| GitHub GraphQL API | `@octokit/graphql` or `gh api graphql` | Contribution calendar, PR/issue counts, repos by activity, languages by bytes, stars, releases, discussions |
| GitHub REST API | Supplements GraphQL | Pinned repos, contribution streaks |
| Blog RSS | Fetch `blog.arusty.dev/rss.xml` | Recent post titles, dates, URLs |

### Generated Artifacts

SVGs committed to `readme/assets/`:

| File | Visualization |
|---|---|
| `language-breakdown.svg` | Donut/pie chart of languages by bytes across repos |
| `contribution-trends.svg` | Bar chart or sparkline of commit frequency over last 12 months |
| `activity-summary.svg` | Compact card: PRs reviewed, issues closed, discussions, total lines, contribution rank percentiles |
| `top-repos.svg` | Cards for highest-activity repos with stars, language, description |
| `pinned-repos.svg` | Pinned repo cards |

### README Structure

```markdown
# Hey, I'm Adam 👋

Brief intro line.

## 📊 GitHub Activity

![Activity Summary](readme/assets/activity-summary.svg)
![Languages](readme/assets/language-breakdown.svg)
![Contribution Trends](readme/assets/contribution-trends.svg)

## 🔥 Active Projects

![Top Repos](readme/assets/top-repos.svg)

## 🏷️ Recent Releases

| Repo | Version | Date |
|------|---------|------|
| ... | ... | ... |

## 📝 Recent Blog Posts

- [Post title](url) — *date*
- ...

## 📌 Pinned

![Pinned Repos](readme/assets/pinned-repos.svg)
```

### SVG Design Principles

- Dark/light mode support via `prefers-color-scheme` media query inside the SVG
- Consistent color palette across all visualizations
- Minimal, clean — no gradient soup or drop shadows
- Sized for GitHub's README container (~800px max width)
- Emoji used with taste, not as decoration

### Generation Script (`readme/generate.ts`)

TypeScript script that:
1. Queries all data sources in parallel
2. Generates each SVG using raw SVG string templates (no React/satori dependency — keeps the README pipeline lightweight and independent of the site stack)
3. Writes SVGs to `readme/assets/`
4. Assembles `README.md` from a template, injecting dynamic markdown sections (blog posts, releases as tables/lists)

**Error handling:** If the blog RSS fetch fails (blog down, malformed feed, timeout), the script skips the blog posts section and logs a warning. The workflow does not fail — GitHub data is the primary content. Previous blog post data is not cached; the section simply omits if unavailable.

### Action Flow

1. Checkout repo
2. Setup Node
3. Run `scripts/build-readme.sh` (installs deps, runs `generate.ts`)
4. If any files changed: `git add readme/assets/ README.md` → commit → push

---

## Workstream 3: LaTeX PDF Pipeline

### Template

Based on sb2nov/resume LaTeX structure. ATS-parsable, clean formatting, custom commands (`\resumeSubheading`, `\resumeItem`, etc.). Template lives at `templates/resume.tex`.

### Build Process

```
data/cv.json + data/resumes/<slug>.json + templates/resume.tex
  │
  scripts/build-pdf.sh <slug>
  │
  1. scripts/render-tex.ts reads profile JSON + cv.json
  2. Resolves cherry-picked IDs against cv.json
  3. Applies overrides (per override resolution rules)
  4. Validates against data/schema.ts types
  5. Renders a .tex file via template substitution → build/<slug>.tex
  6. build-pdf.sh invokes tectonic on the .tex file
  7. Outputs to site/public/resumes/<slug>.pdf
```

`scripts/render-tex.ts` is the Node/TS script that handles JSON resolution and .tex generation. `scripts/build-pdf.sh` is a thin shell wrapper that calls `render-tex.ts` then `tectonic`.

### Compiler

`tectonic` — self-contained LaTeX compiler, downloads packages on demand, no full TeX Live install. Falls back to `latexmk` + TeX Live Docker image (`danteev/texlive`) if needed.

### GitHub Action (`build-pdfs.yml`)

**Trigger:** Push to `main` when `data/**` or `templates/**` change + manual dispatch.

**Steps:**
1. Checkout repo
2. Install tectonic (or use Docker)
3. Setup Node
4. For each profile in `data/resumes/*.json`: run `scripts/build-pdf.sh <slug>`
5. PDFs output to `site/public/resumes/`
6. If changes: commit + push

The committed PDFs then trigger a Cloudflare Pages rebuild, deploying the site with fresh PDFs.

### Scope

The CV page (`/cv`) is web-only — no PDF generated. Only named resume profiles get PDFs. The pipeline can be extended to generate a CV PDF later if desired.

---

## CI/CD Summary

Three independent pipelines:

| Pipeline | Trigger | What it does | Outputs |
|---|---|---|---|
| **Cloudflare Pages App** | Push to `main` (auto, via Cloudflare dashboard) | `npm run build` → Astro build | Deploys `site/dist/` to im.arusty.dev |
| **`build-pdfs.yml`** | Push to `main` (paths: `data/**`, `templates/**`) + manual | Builds LaTeX PDFs via tectonic, commits to `site/public/resumes/` | PDF files in repo |
| **`update-readme.yml`** | Cron every 6h + manual | Queries GitHub APIs + blog RSS, generates SVGs, assembles README | `readme/assets/*.svg` + `README.md` committed |

**Ordering for resume updates:**
1. Push changes to `data/` or `templates/`
2. `build-pdfs.yml` triggers → builds PDFs → commits them
3. That commit triggers Cloudflare Pages rebuild (since `site/public/resumes/` changed)
4. Site deploys with fresh PDFs

### Preventing Infinite Commit Loops

Both `build-pdfs.yml` and `update-readme.yml` commit and push to `main`. To prevent their commits from re-triggering workflows:

- **All CI commits must use the default `GITHUB_TOKEN`** for the push step. Pushes made with `GITHUB_TOKEN` do not trigger further GitHub Actions workflows (built-in behavior). This is critical — using a PAT for pushing would create infinite loops.
- **The `update-readme.yml` workflow needs a PAT with `read:user` scope** for querying the GitHub GraphQL API (contribution data). This PAT is used **only for API reads**, never for the commit/push step.
- **Natural path isolation:** `build-pdfs.yml` already triggers only on `paths: [data/**, templates/**]`, so commits to `readme/` or `README.md` cannot trigger it. `update-readme.yml` triggers only on `schedule` and `workflow_dispatch` (no `push` trigger), so it is immune to any commit-based triggering. The `GITHUB_TOKEN` mandate is the primary guard; path filters provide additional natural isolation without needing explicit `paths-ignore`.

### Preventing Concurrent Push Conflicts

`update-readme.yml` (cron) and `build-pdfs.yml` (push) could theoretically run concurrently, and both push to `main`. To prevent non-fast-forward failures:

- Both workflows use a shared `concurrency` group: `concurrency: { group: commit-to-main, cancel-in-progress: false }`. This ensures only one workflow commits at a time — the second queues until the first completes.

### Secrets/Permissions

- `GITHUB_TOKEN` — used for all commit/push operations in both workflows (prevents cascade triggers)
- `GH_PAT` (repo secret) — PAT with `read:user` scope, used only by `update-readme.yml` for GitHub API queries
- Cloudflare API credentials configured in the Cloudflare Pages App dashboard (not in GitHub secrets for site deploys)

### Package Management

This repo uses **npm workspaces** with the root `package.json` defining:

```json
{
  "workspaces": ["site"],
  "scripts": {
    "build": "cd site && npm run build",
    "build:readme": "scripts/build-readme.sh",
    "build:pdfs": "scripts/build-all-pdfs.sh"
  }
}
```

- `site/package.json` — Astro, Tailwind, and site-specific dependencies
- Root `package.json` — shared dev dependencies (`tsx`, `typescript`) used by `readme/generate.ts` and `scripts/render-tex.ts`
- The Cloudflare Pages build runs `npm run build` from the repo root, which delegates to the Astro build in `site/`

### Dependabot

The existing `.github/dependabot.yml` covers `github-actions` only. It should be extended to also track npm dependencies:

```yaml
- package-ecosystem: "npm"
  directory: "/"
  schedule:
    interval: "weekly"
- package-ecosystem: "npm"
  directory: "/site"
  schedule:
    interval: "weekly"
```

### .gitignore

The `.gitignore` should include:

```
node_modules/
site/dist/
build/              # Intermediate .tex files from render-tex.ts
.superpowers/
.wrangler/
```

Note: `site/public/resumes/*.pdf` and `readme/assets/*.svg` are **not** gitignored — they are committed build artifacts.
