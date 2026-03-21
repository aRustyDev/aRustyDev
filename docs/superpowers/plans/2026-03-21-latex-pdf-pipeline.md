# LaTeX PDF Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the pipeline that generates resume PDFs from structured JSON data via LaTeX, including the render script, build scripts, LaTeX template, and CI workflow.

**Architecture:** `scripts/render-tex.ts` reads a resume profile + cv.json, resolves IDs, applies overrides, and renders a `.tex` file from a template. `scripts/build-pdf.sh` wraps that with tectonic compilation. A GitHub Action triggers on data/template changes, builds all PDFs, and commits them to `site/public/resumes/`.

**Tech Stack:** TypeScript (tsx), LaTeX (tectonic), shell scripts, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-03-21-portfolio-and-readme-design.md` — Workstream 3: LaTeX PDF Pipeline

**Prerequisite:** Foundation plan must be complete (data/schema.ts, data/resolve.ts, data/cv.json, resume profiles exist).

---

## File Structure

| File | Responsibility |
|---|---|
| `templates/resume.tex` | LaTeX template with placeholder tokens — derived from sb2nov/resume |
| `scripts/render-tex.ts` | Reads profile + cv.json, resolves via data/resolve.ts, renders .tex via string substitution. `renderTex` accepts template content as string for testability. |
| `scripts/render-tex.test.ts` | Tests for .tex rendering logic |
| `scripts/render-tex-cli.ts` | CLI entry point: reads slug from argv, loads files from disk, calls renderTex, writes .tex to stdout |
| `scripts/build-pdf.sh` | Thin wrapper: calls render-tex-cli.ts then tectonic for one profile slug |
| `scripts/build-all-pdfs.sh` | Iterates all profiles in data/resumes/, calls build-pdf.sh for each |
| `.github/workflows/build-pdfs.yml` | CI workflow: triggers on data/template changes, builds all PDFs, commits |

---

## Phase 1: LaTeX Template

### Task 1: Create LaTeX Resume Template

**Files:**
- Create: `templates/resume.tex`

- [ ] **Step 1: Create the LaTeX template**

This is based on sb2nov/resume with token placeholders for template substitution. Tokens use `%%TOKEN_NAME%%` syntax.

```latex
%-------------------------
% Resume in LaTeX
% Based on: github.com/sb2nov/resume
% License: MIT
%-------------------------

\documentclass[letterpaper,11pt]{article}

\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage[usenames,dvipsnames]{color}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\input{glyphtounicode}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1in}
\addtolength{\topmargin}{-.5in}
\addtolength{\textheight}{1.0in}

\urlstyle{same}
\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

\titleformat{\section}{
  \vspace{-4pt}\scshape\raggedright\large
}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

\pdfgentounicode=1

%--- Custom commands ---
\newcommand{\resumeItem}[1]{
  \item\small{#1 \vspace{-2pt}}
}

\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & #2 \\
      \textit{\small #3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeProjectHeading}[2]{
  \vspace{-2pt}\item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \small #1 & #2 \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}

%--- Document ---
\begin{document}

%%HEADER%%

%%EXPERIENCE%%

%%EDUCATION%%

%%SKILLS%%

%%PROJECTS%%

%%CERTIFICATIONS%%

\end{document}
```

- [ ] **Step 2: Commit**

```bash
git add templates/resume.tex
git commit -m "feat: add LaTeX resume template based on sb2nov/resume"
```

---

## Phase 2: TeX Rendering Script

### Task 2: Render Script — Tests

**Files:**
- Create: `scripts/render-tex.test.ts`

- [ ] **Step 1: Write failing tests for .tex rendering**

```typescript
import { describe, it, expect } from "vitest";
import { renderHeader, renderExperience, renderEducation, renderSkills, renderProjects, renderCertifications, renderTex } from "./render-tex.js";
import type { CV, ResumeProfile } from "../data/schema.js";

const sampleCV: CV = {
  personal: {
    name: "Test User",
    email: "test@example.com",
    phone: "+1-555-0100",
    location: "Remote",
    links: {
      github: "https://github.com/test",
      linkedin: "https://linkedin.com/in/test",
      website: "https://test.dev",
      blog: "https://blog.test.dev",
    },
  },
  experience: [
    {
      id: "job-a",
      company: "Company A",
      title: "Senior Engineer",
      location: "Remote",
      start: "2023-01",
      end: null,
      highlights: ["Built systems", "Led teams"],
    },
  ],
  education: [
    {
      id: "edu-a",
      institution: "University A",
      degree: "BS",
      field: "Computer Science",
      start: "2016-09",
      end: "2020-05",
      highlights: [],
    },
  ],
  skills: [
    { id: "lang", category: "Languages", items: ["Rust", "Go", "TypeScript"] },
  ],
  projects: [
    {
      id: "proj-a",
      name: "Project A",
      description: "A CLI tool",
      url: "https://github.com/test/a",
      highlights: ["500+ stars"],
    },
  ],
  certifications: [
    {
      id: "cert-a",
      name: "AWS SAA",
      issuer: "AWS",
      date: "2023-06",
      url: "https://aws.amazon.com",
    },
  ],
};

describe("renderHeader", () => {
  it("produces LaTeX header with personal info", () => {
    const result = renderHeader(sampleCV.personal);
    expect(result).toContain("Test User");
    expect(result).toContain("test@example.com");
    expect(result).toContain("github.com/test");
    expect(result).toContain("\\begin{center}");
  });
});

describe("renderExperience", () => {
  it("produces LaTeX experience section", () => {
    const result = renderExperience(sampleCV.experience);
    expect(result).toContain("\\section{Experience}");
    expect(result).toContain("Company A");
    expect(result).toContain("Senior Engineer");
    expect(result).toContain("Built systems");
    expect(result).toContain("\\resumeSubheading");
  });

  it("returns empty string for empty array", () => {
    expect(renderExperience([])).toBe("");
  });
});

describe("renderSkills", () => {
  it("formats skills as category: items", () => {
    const result = renderSkills(sampleCV.skills);
    expect(result).toContain("\\section{Skills}");
    expect(result).toContain("Languages");
    expect(result).toContain("Rust, Go, TypeScript");
  });
});

describe("renderTex", () => {
  it("produces a complete .tex document", () => {
    const profile: ResumeProfile = {
      slug: "test",
      title: "Test",
      include: {
        experience: ["job-a"],
        education: ["edu-a"],
        skills: ["lang"],
        projects: ["proj-a"],
        certifications: ["cert-a"],
      },
    };

    const template = `\\begin{document}\n%%HEADER%%\n%%EXPERIENCE%%\n%%EDUCATION%%\n%%SKILLS%%\n%%PROJECTS%%\n%%CERTIFICATIONS%%\n\\end{document}`;
    const result = renderTex(sampleCV, profile, template);
    expect(result).toContain("\\begin{document}");
    expect(result).toContain("\\end{document}");
    expect(result).toContain("Test User");
    expect(result).toContain("Company A");
    expect(result).not.toContain("%%HEADER%%");
    expect(result).not.toContain("%%EXPERIENCE%%");
  });
});

describe("renderEducation", () => {
  it("produces LaTeX education section", () => {
    const result = renderEducation(sampleCV.education);
    expect(result).toContain("\\section{Education}");
    expect(result).toContain("University A");
    expect(result).toContain("BS in Computer Science");
  });

  it("returns empty string for empty array", () => {
    expect(renderEducation([])).toBe("");
  });
});

describe("renderProjects", () => {
  it("produces LaTeX projects section", () => {
    const result = renderProjects(sampleCV.projects);
    expect(result).toContain("\\section{Projects}");
    expect(result).toContain("Project A");
    expect(result).toContain("github.com/test/a");
  });

  it("returns empty string for empty array", () => {
    expect(renderProjects([])).toBe("");
  });
});

describe("renderCertifications", () => {
  it("produces LaTeX certifications section", () => {
    const result = renderCertifications(sampleCV.certifications);
    expect(result).toContain("\\section{Certifications}");
    expect(result).toContain("AWS SAA");
    expect(result).toContain("AWS");
  });

  it("returns empty string for empty array", () => {
    expect(renderCertifications([])).toBe("");
  });
});
```

- [ ] **Step 2: Update vitest config to include scripts tests**

Modify `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    include: ["data/**/*.test.ts", "scripts/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@data": resolve(import.meta.dirname, "./data"),
    },
  },
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL — render functions do not exist

---

### Task 3: Render Script — Implementation

**Files:**
- Create: `scripts/render-tex.ts`

- [ ] **Step 1: Implement the render functions**

```typescript
import { resolveResume } from "../data/resolve.js";
import type {
  CV,
  ResumeProfile,
  PersonalInfo,
  Experience,
  Education,
  Skill,
  Project,
  Certification,
} from "../data/schema.js";

function escapeLatex(text: string): string {
  // Order matters: escape backslash last to avoid double-escaping braces
  return text
    .replace(/[&%$#_]/g, match => `\\${match}`)
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/[{}]/g, match => `\\${match}`);
}

function formatDate(date: string | null): string {
  if (!date) return "Present";
  const [year, month] = date.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return month ? `${months[parseInt(month) - 1]}. ${year}` : year;
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, "");
}

export function renderHeader(personal: PersonalInfo): string {
  const e = escapeLatex;
  return `\\begin{center}
  \\textbf{\\Huge \\scshape ${e(personal.name)}} \\\\ \\vspace{1pt}
  \\small ${e(personal.phone)} $|$
  \\href{mailto:${personal.email}}{\\underline{${e(personal.email)}}} $|$
  \\href{${personal.links.linkedin}}{\\underline{${stripProtocol(personal.links.linkedin)}}} $|$
  \\href{${personal.links.github}}{\\underline{${stripProtocol(personal.links.github)}}}
\\end{center}`;
}

export function renderExperience(experience: Experience[]): string {
  if (experience.length === 0) return "";
  const e = escapeLatex;

  const items = experience.map(job => {
    const highlights = job.highlights
      .map(h => `      \\resumeItem{${e(h)}}`)
      .join("\n");

    return `    \\resumeSubheading
      {${e(job.title)}}{${formatDate(job.start)} -- ${formatDate(job.end)}}
      {${e(job.company)}}{${e(job.location)}}
      \\resumeItemListStart
${highlights}
      \\resumeItemListEnd`;
  }).join("\n");

  return `\\section{Experience}
  \\resumeSubHeadingListStart
${items}
  \\resumeSubHeadingListEnd`;
}

export function renderEducation(education: Education[]): string {
  if (education.length === 0) return "";
  const e = escapeLatex;

  const items = education.map(edu =>
    `    \\resumeSubheading
      {${e(edu.institution)}}{${formatDate(edu.start)} -- ${formatDate(edu.end)}}
      {${e(edu.degree)} in ${e(edu.field)}}{}`
  ).join("\n");

  return `\\section{Education}
  \\resumeSubHeadingListStart
${items}
  \\resumeSubHeadingListEnd`;
}

export function renderSkills(skills: Skill[]): string {
  if (skills.length === 0) return "";
  const e = escapeLatex;

  const rows = skills
    .map(s => `    \\textbf{${e(s.category)}}{: ${e(s.items.join(", "))}} \\\\`)
    .join("\n");

  return `\\section{Skills}
  \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
${rows}
    }}
  \\end{itemize}`;
}

export function renderProjects(projects: Project[]): string {
  if (projects.length === 0) return "";
  const e = escapeLatex;

  const items = projects.map(proj => {
    const highlights = proj.highlights
      .map(h => `      \\resumeItem{${e(h)}}`)
      .join("\n");

    return `    \\resumeProjectHeading
      {\\textbf{${e(proj.name)}} $|$ \\href{${proj.url}}{\\underline{${stripProtocol(proj.url)}}}}{}
      \\resumeItemListStart
${highlights}
      \\resumeItemListEnd`;
  }).join("\n");

  return `\\section{Projects}
  \\resumeSubHeadingListStart
${items}
  \\resumeSubHeadingListEnd`;
}

export function renderCertifications(certifications: Certification[]): string {
  if (certifications.length === 0) return "";
  const e = escapeLatex;

  const items = certifications
    .map(c => `    \\resumeItem{\\href{${c.url}}{\\underline{${e(c.name)}}} -- ${e(c.issuer)} (${formatDate(c.date)})}`)
    .join("\n");

  return `\\section{Certifications}
  \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
${items}
    }}
  \\end{itemize}`;
}

/** Accepts template content as a string (not a file path) for testability.
 *  The CLI wrapper (render-tex-cli.ts) handles file I/O. */
export function renderTex(
  cv: CV,
  profile: ResumeProfile,
  templateContent: string,
): string {
  const resolved = resolveResume(cv, profile);

  return templateContent
    .replace("%%HEADER%%", renderHeader(resolved.personal))
    .replace("%%EXPERIENCE%%", renderExperience(resolved.experience))
    .replace("%%EDUCATION%%", renderEducation(resolved.education))
    .replace("%%SKILLS%%", renderSkills(resolved.skills))
    .replace("%%PROJECTS%%", renderProjects(resolved.projects))
    .replace("%%CERTIFICATIONS%%", renderCertifications(resolved.certifications));
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test`

Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add scripts/render-tex.ts scripts/render-tex.test.ts vitest.config.ts
git commit -m "feat: add LaTeX render script — JSON to .tex via template substitution"
```

---

## Phase 3: Build Scripts

### Task 4: Shell Build Scripts

**Files:**
- Create: `scripts/build-pdf.sh`
- Create: `scripts/build-all-pdfs.sh`

- [ ] **Step 1: Create build-pdf.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/build-pdf.sh <slug>
# Renders a resume profile to .tex then compiles to PDF via tectonic.

SLUG="${1:?Usage: build-pdf.sh <slug>}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

PROFILE="$REPO_ROOT/data/resumes/${SLUG}.json"
if [[ ! -f "$PROFILE" ]]; then
  echo "Error: Profile not found: $PROFILE" >&2
  exit 1
fi

# Ensure build directory exists
mkdir -p "$REPO_ROOT/build"

# Step 1: Render .tex from JSON
echo "Rendering ${SLUG}.tex..."
npx tsx "$REPO_ROOT/scripts/render-tex-cli.ts" "$SLUG" > "$REPO_ROOT/build/${SLUG}.tex"

# Step 2: Compile .tex to .pdf
echo "Compiling ${SLUG}.pdf..."
cd "$REPO_ROOT/build"
tectonic "${SLUG}.tex"

# Step 3: Move to site output
mkdir -p "$REPO_ROOT/site/public/resumes"
mv "${SLUG}.pdf" "$REPO_ROOT/site/public/resumes/${SLUG}.pdf"

echo "Done: site/public/resumes/${SLUG}.pdf"
```

- [ ] **Step 2: Create render-tex-cli.ts (CLI wrapper for render-tex)**

```typescript
// scripts/render-tex-cli.ts
// CLI entry point: reads a profile slug from argv, renders .tex to stdout.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderTex } from "./render-tex.js";
import { validateCV, validateProfile } from "../data/validate.js";
import type { CV, ResumeProfile } from "../data/schema.js";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: render-tex-cli.ts <slug>");
  process.exit(1);
}

const repoRoot = resolve(import.meta.dirname, "..");
const cvPath = resolve(repoRoot, "data/cv.json");
const profilePath = resolve(repoRoot, `data/resumes/${slug}.json`);
const templatePath = resolve(repoRoot, "templates/resume.tex");

const cv = JSON.parse(readFileSync(cvPath, "utf-8"));
validateCV(cv);

const profile: ResumeProfile = JSON.parse(readFileSync(profilePath, "utf-8"));
validateProfile(profile);

const templateContent = readFileSync(templatePath, "utf-8");
const tex = renderTex(cv as CV, profile, templateContent);
process.stdout.write(tex);
```

- [ ] **Step 3: Create build-all-pdfs.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Iterates all resume profiles and builds PDFs for each.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROFILES_DIR="$REPO_ROOT/data/resumes"

if [[ ! -d "$PROFILES_DIR" ]]; then
  echo "No profiles directory found at $PROFILES_DIR" >&2
  exit 1
fi

BUILT=0
for profile in "$PROFILES_DIR"/*.json; do
  [[ -f "$profile" ]] || continue
  SLUG=$(basename "$profile" .json)
  echo "=== Building resume: $SLUG ==="
  "$REPO_ROOT/scripts/build-pdf.sh" "$SLUG"
  BUILT=$((BUILT + 1))
done

echo "Built $BUILT PDF(s)."
```

- [ ] **Step 4: Make scripts executable**

Run: `chmod +x scripts/build-pdf.sh scripts/build-all-pdfs.sh`

- [ ] **Step 5: Verify render-tex-cli produces .tex output**

Run: `npx tsx scripts/render-tex-cli.ts backend-engineer | head -20`

Expected: LaTeX output starting with `\documentclass[letterpaper,11pt]{article}` and containing the personal info from cv.json

- [ ] **Step 6: Commit**

```bash
git add scripts/build-pdf.sh scripts/build-all-pdfs.sh scripts/render-tex-cli.ts
git commit -m "feat: add shell build scripts for PDF generation pipeline"
```

---

## Phase 4: CI Workflow

### Task 5: GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/build-pdfs.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: Build Resume PDFs

on:
  push:
    branches: [main]
    paths:
      - "data/**"
      - "templates/**"
  workflow_dispatch:

concurrency:
  group: commit-to-main
  cancel-in-progress: false

permissions:
  contents: write

jobs:
  build-pdfs:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install Node dependencies
        run: npm ci

      - name: Install tectonic
        run: |
          curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | sh
          echo "$HOME/.local/bin" >> $GITHUB_PATH

      - name: Build all PDFs
        run: scripts/build-all-pdfs.sh

      - name: Check for changes
        id: changes
        run: |
          git add site/public/resumes/
          if git diff --cached --quiet; then
            echo "changed=false" >> $GITHUB_OUTPUT
          else
            echo "changed=true" >> $GITHUB_OUTPUT
          fi

      - name: Commit and push PDFs
        if: steps.changes.outputs.changed == 'true'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git commit -m "ci: rebuild resume PDFs"
          git push
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/build-pdfs.yml
git commit -m "ci: add GitHub Action to build resume PDFs on data/template changes"
```

---

### Task 6: Verify Full Pipeline Locally (Without Tectonic)

**Files:** None — verification only

- [ ] **Step 1: Verify .tex rendering for all profiles**

Run: `for f in data/resumes/*.json; do slug=$(basename "$f" .json); echo "=== $slug ==="; npx tsx scripts/render-tex-cli.ts "$slug" | head -5; echo "..."; done`

Expected: Each profile renders LaTeX output without errors

- [ ] **Step 2: Verify all tests still pass**

Run: `npm test`

Expected: All tests PASS (data + scripts suites)

- [ ] **Step 3: If tectonic is available locally, test full PDF build**

Run: `scripts/build-all-pdfs.sh`

Expected: PDFs appear in `site/public/resumes/`. If tectonic is not installed, skip — the CI workflow handles this.
