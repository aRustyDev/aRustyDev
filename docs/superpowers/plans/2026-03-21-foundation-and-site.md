# Foundation + Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the repo foundation (data model, schema, package management) and build the Astro 5 portfolio site that renders CV and resume pages from structured JSON data.

**Architecture:** npm workspaces with `site/` containing the Astro project and `data/` at the repo root as the shared data layer. Astro imports JSON and TypeScript types from `data/` at build time. Content collections (MDX) for about and portfolio pages. Cloudflare Pages deploys via wrangler.jsonc.

**Tech Stack:** Astro 5, TypeScript (strict), Tailwind CSS v4, npm workspaces, Cloudflare Pages

**Spec:** `docs/superpowers/specs/2026-03-21-portfolio-and-readme-design.md`

**Reference codebase:** The blog at `/etc/infra/pub/blog` uses the same Astro 5 + Tailwind v4 stack. Follow its patterns for config, layouts, and components.

---

## File Structure

### Root (repo-level)

| File | Responsibility |
|---|---|
| `package.json` | npm workspace config, root scripts (`build`, `build:readme`, `build:pdfs`), shared dev deps (`tsx`, `typescript`) |
| `wrangler.jsonc` | Cloudflare Pages deployment config — build command, asset directory, custom domain |
| `.gitignore` | Ignore `node_modules/`, `site/dist/`, `build/`, `.superpowers/`, `.wrangler/` |
| `tsconfig.json` | Root TypeScript config extending Astro strict, path aliases |

### Data Layer (`data/`)

| File | Responsibility |
|---|---|
| `data/schema.ts` | Canonical TypeScript types for CV and resume profile data. Single source of truth for data shape. |
| `data/cv.json` | Full CV structured data — all experience, education, skills, projects, certifications |
| `data/resumes/backend-engineer.json` | Example resume profile — cherry-picks entries from cv.json by ID |
| `data/resolve.ts` | Resume resolution logic — takes a profile + cv.json, resolves IDs, applies overrides, returns filtered data |
| `data/validate.ts` | Build-time validation — ensures cv.json and all resume profiles conform to schema |
| `data/resolve.test.ts` | Tests for resume resolution logic |
| `data/validate.test.ts` | Tests for validation logic |

### Astro Site (`site/`)

| File | Responsibility |
|---|---|
| `site/package.json` | Astro project deps — astro, tailwind, etc. |
| `site/astro.config.ts` | Astro config — site URL, Tailwind v4 via Vite, sitemap |
| `site/tsconfig.json` | Extends root tsconfig, adds Astro types |
| `site/src/config.ts` | Site metadata — URL, title, author, description, social links |
| `site/src/styles/global.css` | Tailwind v4 setup, theme tokens, base styles |
| `site/src/layouts/Layout.astro` | Root HTML layout — head, meta, theme, slot |
| `site/src/layouts/Main.astro` | Page layout wrapper — header, main content area, footer |
| `site/src/components/Header.astro` | Navigation header with mobile menu |
| `site/src/components/Footer.astro` | Site footer |
| `site/src/utils/formatDate.ts` | Shared date formatting utility |
| `site/src/pages/index.astro` | Landing page |
| `site/src/pages/about.astro` | About page — renders MDX content |
| `site/src/pages/cv.astro` | Full CV page — renders all data from cv.json |
| `site/src/pages/resume/index.astro` | Resume listing — all variants with PDF download links |
| `site/src/pages/resume/[slug].astro` | Dynamic resume page — filtered view + PDF download |
| `site/src/pages/portfolio.astro` | Portfolio page — renders MDX content collection |
| `site/src/pages/contact.astro` | Contact page — static links |
| `site/src/content.config.ts` | Content collection definitions for about and portfolio |
| `site/src/content/about/index.mdx` | About page MDX content |
| `site/src/content/portfolio/example-project.mdx` | Example portfolio entry |

---

## Phase 1: Repo Foundation

### Task 1: Root Package & Workspace Setup

**Files:**
- Create: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "arustydev",
  "type": "module",
  "version": "1.0.0",
  "private": true,
  "description": "GitHub profile repo — portfolio site + dynamic README",
  "author": "aRustyDev",
  "license": "MIT",
  "engines": {
    "node": ">=20.19.0"
  },
  "workspaces": [
    "site"
  ],
  "scripts": {
    "build": "cd site && npm run build",
    "build:readme": "scripts/build-readme.sh",
    "build:pdfs": "scripts/build-all-pdfs.sh",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "tsx": "^4.21.0",
    "typescript": "^5.9.3",
    "vitest": "^3.1.1"
  }
}
```

- [ ] **Step 2: Update .gitignore**

Replace the current `.gitignore` with:

```
node_modules/
site/dist/
build/
.superpowers/
.wrangler/
```

- [ ] **Step 3: Create root tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "build",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": {
      "@data/*": ["./data/*"]
    },
    "resolveJsonModule": true
  },
  "include": ["data/**/*.ts", "scripts/**/*.ts"],
  "exclude": ["node_modules", "site", "build"]
}
```

- [ ] **Step 4: Install dependencies**

Run: `cd /private/etc/infra/pub/portfolio && npm install`

Expected: `node_modules/` created with tsx, typescript, vitest

- [ ] **Step 5: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    include: ["data/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@data": resolve(import.meta.dirname, "./data"),
    },
  },
});
```

- [ ] **Step 6: Verify setup**

Run: `npm test`

Expected: vitest runs, finds no test files, exits 0

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts .gitignore
git commit -m "chore: scaffold root workspace with npm workspaces, typescript, vitest"
```

---

### Task 2: Data Schema Types

**Files:**
- Create: `data/schema.ts`

- [ ] **Step 1: Write the schema types**

```typescript
// data/schema.ts
// Canonical TypeScript types for cv.json and resume profiles.
// Single source of truth — imported by the Astro site, PDF pipeline, and validation.

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: {
    github: string;
    linkedin: string;
    website: string;
    blog: string;
  };
}

export interface Experience {
  id: string;
  company: string;
  title: string;
  location: string;
  start: string;
  end: string | null;
  highlights: string[];
  tags?: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  start: string;
  end: string;
  highlights: string[];
}

export interface Skill {
  id: string;
  category: string;
  items: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
  highlights: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
}

export interface CV {
  personal: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
}

export interface ResumeProfile {
  slug: string;
  title: string;
  include: {
    experience: string[];
    education: string[];
    skills: string[];
    projects: string[];
    certifications: string[];
  };
  overrides?: Record<string, unknown>;
}

/** The resolved output after applying a profile to cv.json */
export interface ResolvedResume {
  slug: string;
  title: string;
  personal: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit data/schema.ts`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add data/schema.ts
git commit -m "feat: add canonical TypeScript types for CV and resume data"
```

---

### Task 3: Sample CV Data

**Files:**
- Create: `data/cv.json`

- [ ] **Step 1: Create sample cv.json with placeholder data**

```json
{
  "personal": {
    "name": "Adam",
    "email": "adam@example.com",
    "phone": "+1-555-0100",
    "location": "Remote",
    "links": {
      "github": "https://github.com/aRustyDev",
      "linkedin": "https://linkedin.com/in/arustydev",
      "website": "https://im.arusty.dev",
      "blog": "https://blog.arusty.dev"
    }
  },
  "experience": [
    {
      "id": "example-senior-swe",
      "company": "Example Corp",
      "title": "Senior Software Engineer",
      "location": "Remote",
      "start": "2023-01",
      "end": null,
      "highlights": [
        "Led architecture of distributed event processing system",
        "Reduced deploy times by 60% through CI/CD pipeline optimization"
      ],
      "tags": ["backend", "infra"]
    },
    {
      "id": "example-swe",
      "company": "Startup Inc",
      "title": "Software Engineer",
      "location": "New York, NY",
      "start": "2020-06",
      "end": "2022-12",
      "highlights": [
        "Built real-time data pipeline processing 1M events/day",
        "Designed and implemented REST API serving 50k requests/min"
      ],
      "tags": ["backend", "data"]
    }
  ],
  "education": [
    {
      "id": "example-university",
      "institution": "Example University",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "start": "2016-09",
      "end": "2020-05",
      "highlights": []
    }
  ],
  "skills": [
    {
      "id": "languages",
      "category": "Languages",
      "items": ["Rust", "TypeScript", "Go", "Python"]
    },
    {
      "id": "infrastructure",
      "category": "Infrastructure",
      "items": ["AWS", "Terraform", "Docker", "Kubernetes"]
    }
  ],
  "projects": [
    {
      "id": "example-oss-tool",
      "name": "Example OSS Tool",
      "description": "A CLI tool for automating infrastructure deployments",
      "url": "https://github.com/aRustyDev/example-tool",
      "highlights": [
        "500+ GitHub stars",
        "Used by 3 production teams internally"
      ]
    }
  ],
  "certifications": [
    {
      "id": "aws-saa",
      "name": "AWS Solutions Architect Associate",
      "issuer": "Amazon Web Services",
      "date": "2023-06",
      "url": "https://aws.amazon.com/certification/"
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add data/cv.json
git commit -m "feat: add sample CV data (placeholder — replace with real data)"
```

---

### Task 4: Sample Resume Profile

**Files:**
- Create: `data/resumes/backend-engineer.json`

- [ ] **Step 1: Create sample resume profile**

```json
{
  "slug": "backend-engineer",
  "title": "Backend Engineer",
  "include": {
    "experience": ["example-senior-swe", "example-swe"],
    "education": ["example-university"],
    "skills": ["languages", "infrastructure"],
    "projects": ["example-oss-tool"],
    "certifications": ["aws-saa"]
  },
  "overrides": {
    "experience.example-senior-swe.highlights": [
      "Led architecture of distributed event processing system handling 10M events/day",
      "Reduced deploy times by 60% through CI/CD pipeline optimization using GitHub Actions"
    ]
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add data/resumes/backend-engineer.json
git commit -m "feat: add sample backend-engineer resume profile"
```

---

### Task 5: Resume Resolution Logic — Tests

**Files:**
- Create: `data/resolve.test.ts`

- [ ] **Step 1: Write failing tests for resume resolution**

```typescript
import { describe, it, expect } from "vitest";
import { resolveResume } from "./resolve.js";
import type { CV, ResumeProfile } from "./schema.js";

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
      highlights: ["Original highlight A1", "Original highlight A2"],
      tags: ["backend"],
    },
    {
      id: "job-b",
      company: "Company B",
      title: "Engineer",
      location: "NYC",
      start: "2020-01",
      end: "2022-12",
      highlights: ["Highlight B1"],
      tags: ["frontend"],
    },
    {
      id: "job-c",
      company: "Company C",
      title: "Intern",
      location: "SF",
      start: "2019-06",
      end: "2019-09",
      highlights: ["Highlight C1"],
    },
  ],
  education: [
    {
      id: "edu-a",
      institution: "University A",
      degree: "BS",
      field: "CS",
      start: "2016",
      end: "2020",
      highlights: [],
    },
  ],
  skills: [
    { id: "lang", category: "Languages", items: ["Rust", "Go"] },
    { id: "infra", category: "Infra", items: ["AWS", "Docker"] },
  ],
  projects: [
    {
      id: "proj-a",
      name: "Project A",
      description: "Desc A",
      url: "https://github.com/test/a",
      highlights: ["Star count"],
    },
  ],
  certifications: [
    {
      id: "cert-a",
      name: "Cert A",
      issuer: "Issuer A",
      date: "2023-01",
      url: "https://cert.example.com",
    },
  ],
};

describe("resolveResume", () => {
  it("cherry-picks entries by ID", () => {
    const profile: ResumeProfile = {
      slug: "backend",
      title: "Backend Engineer",
      include: {
        experience: ["job-a", "job-b"],
        education: ["edu-a"],
        skills: ["lang"],
        projects: ["proj-a"],
        certifications: ["cert-a"],
      },
    };

    const result = resolveResume(sampleCV, profile);

    expect(result.slug).toBe("backend");
    expect(result.title).toBe("Backend Engineer");
    expect(result.personal).toEqual(sampleCV.personal);
    expect(result.experience).toHaveLength(2);
    expect(result.experience[0].id).toBe("job-a");
    expect(result.experience[1].id).toBe("job-b");
    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].id).toBe("lang");
  });

  it("preserves order from include list", () => {
    const profile: ResumeProfile = {
      slug: "test",
      title: "Test",
      include: {
        experience: ["job-b", "job-a"],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
      },
    };

    const result = resolveResume(sampleCV, profile);

    expect(result.experience[0].id).toBe("job-b");
    expect(result.experience[1].id).toBe("job-a");
  });

  it("applies overrides as full replacement", () => {
    const profile: ResumeProfile = {
      slug: "backend",
      title: "Backend",
      include: {
        experience: ["job-a"],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
      },
      overrides: {
        "experience.job-a.highlights": ["Custom highlight 1", "Custom highlight 2"],
      },
    };

    const result = resolveResume(sampleCV, profile);

    expect(result.experience[0].highlights).toEqual([
      "Custom highlight 1",
      "Custom highlight 2",
    ]);
    // Original CV data should not be mutated
    expect(sampleCV.experience[0].highlights).toEqual([
      "Original highlight A1",
      "Original highlight A2",
    ]);
  });

  it("throws on override referencing ID not in include", () => {
    const profile: ResumeProfile = {
      slug: "bad",
      title: "Bad",
      include: {
        experience: ["job-a"],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
      },
      overrides: {
        "experience.job-c.highlights": ["Should fail"],
      },
    };

    expect(() => resolveResume(sampleCV, profile)).toThrow(
      /override references ID "job-c" not in include/i
    );
  });

  it("throws on override targeting non-existent field", () => {
    const profile: ResumeProfile = {
      slug: "bad",
      title: "Bad",
      include: {
        experience: ["job-a"],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
      },
      overrides: {
        "experience.job-a.nonexistent": ["Should fail"],
      },
    };

    expect(() => resolveResume(sampleCV, profile)).toThrow(
      /field "nonexistent" does not exist/i
    );
  });

  it("throws on ID not found in CV", () => {
    const profile: ResumeProfile = {
      slug: "missing",
      title: "Missing",
      include: {
        experience: ["job-nonexistent"],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
      },
    };

    expect(() => resolveResume(sampleCV, profile)).toThrow(
      /ID "job-nonexistent" not found in experience/i
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL — `resolveResume` does not exist yet

- [ ] **Step 3: Commit the failing tests**

```bash
git add data/resolve.test.ts
git commit -m "test: add failing tests for resume resolution logic"
```

---

### Task 6: Resume Resolution Logic — Implementation

**Files:**
- Create: `data/resolve.ts`

- [ ] **Step 1: Implement resolveResume**

```typescript
import type {
  CV,
  ResumeProfile,
  ResolvedResume,
  Experience,
  Education,
  Skill,
  Project,
  Certification,
} from "./schema.js";

type CVCollection = "experience" | "education" | "skills" | "projects" | "certifications";
type CVEntry = Experience | Education | Skill | Project | Certification;

function pickByIds<T extends { id: string }>(
  entries: T[],
  ids: string[],
  collectionName: string,
): T[] {
  return ids.map(id => {
    const entry = entries.find(e => e.id === id);
    if (!entry) {
      throw new Error(`ID "${id}" not found in ${collectionName}`);
    }
    return structuredClone(entry);
  });
}

function applyOverrides(
  result: ResolvedResume,
  overrides: Record<string, unknown>,
): void {
  for (const [path, value] of Object.entries(overrides)) {
    const parts = path.split(".");
    if (parts.length !== 3) {
      throw new Error(
        `Override path "${path}" must be <collection>.<id>.<field>`,
      );
    }

    const [collection, id, field] = parts;
    const collectionKey = collection as CVCollection;

    const entries = result[collectionKey] as CVEntry[] | undefined;
    if (!entries) {
      throw new Error(`Collection "${collection}" does not exist`);
    }

    const includeIds = entries.map((e: CVEntry) => e.id);
    if (!includeIds.includes(id)) {
      throw new Error(
        `Override references ID "${id}" not in include for ${collection}`,
      );
    }

    const entry = entries.find((e: CVEntry) => e.id === id);
    if (!entry) {
      throw new Error(`Entry "${id}" not found in resolved ${collection}`);
    }

    if (!(field in entry)) {
      throw new Error(
        `Field "${field}" does not exist on ${collection} entry "${id}"`,
      );
    }

    (entry as Record<string, unknown>)[field] = value;
  }
}

export function resolveResume(cv: CV, profile: ResumeProfile): ResolvedResume {
  const result: ResolvedResume = {
    slug: profile.slug,
    title: profile.title,
    personal: structuredClone(cv.personal),
    experience: pickByIds(cv.experience, profile.include.experience, "experience"),
    education: pickByIds(cv.education, profile.include.education, "education"),
    skills: pickByIds(cv.skills, profile.include.skills, "skills"),
    projects: pickByIds(cv.projects, profile.include.projects, "projects"),
    certifications: pickByIds(cv.certifications, profile.include.certifications, "certifications"),
  };

  if (profile.overrides) {
    applyOverrides(result, profile.overrides);
  }

  return result;
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test`

Expected: All 6 tests PASS

- [ ] **Step 3: Commit**

```bash
git add data/resolve.ts data/resolve.test.ts
git commit -m "feat: add resume resolution logic with override support"
```

---

### Task 7: Data Validation — Tests

**Files:**
- Create: `data/validate.test.ts`

- [ ] **Step 1: Write failing tests for validation**

```typescript
import { describe, it, expect } from "vitest";
import { validateCV, validateProfile } from "./validate.js";

describe("validateCV", () => {
  it("accepts valid CV data", () => {
    const cv = {
      personal: {
        name: "Test",
        email: "t@t.com",
        phone: "555",
        location: "Remote",
        links: { github: "", linkedin: "", website: "", blog: "" },
      },
      experience: [
        {
          id: "a",
          company: "C",
          title: "T",
          location: "L",
          start: "2023-01",
          end: null,
          highlights: [],
        },
      ],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
    };
    expect(() => validateCV(cv)).not.toThrow();
  });

  it("rejects CV with duplicate IDs in a collection", () => {
    const cv = {
      personal: {
        name: "Test",
        email: "t@t.com",
        phone: "555",
        location: "Remote",
        links: { github: "", linkedin: "", website: "", blog: "" },
      },
      experience: [
        { id: "dup", company: "A", title: "T", location: "L", start: "2023", end: null, highlights: [] },
        { id: "dup", company: "B", title: "T", location: "L", start: "2022", end: null, highlights: [] },
      ],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
    };
    expect(() => validateCV(cv)).toThrow(/duplicate.*id.*"dup".*experience/i);
  });

  it("rejects CV missing required fields", () => {
    expect(() => validateCV({ personal: { name: "Test" } } as any)).toThrow();
  });
});

describe("validateProfile", () => {
  it("accepts valid profile", () => {
    const profile = {
      slug: "test",
      title: "Test",
      include: {
        experience: ["a"],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
      },
    };
    expect(() => validateProfile(profile)).not.toThrow();
  });

  it("rejects profile missing slug", () => {
    const profile = {
      title: "Test",
      include: { experience: [], education: [], skills: [], projects: [], certifications: [] },
    };
    expect(() => validateProfile(profile as any)).toThrow(/slug/i);
  });

  it("rejects profile with invalid override path format", () => {
    const profile = {
      slug: "test",
      title: "Test",
      include: { experience: [], education: [], skills: [], projects: [], certifications: [] },
      overrides: { "bad.path": "value" },
    };
    expect(() => validateProfile(profile)).toThrow(/override path/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL — `validateCV` and `validateProfile` do not exist

- [ ] **Step 3: Commit the failing tests**

```bash
git add data/validate.test.ts
git commit -m "test: add failing tests for CV and resume profile validation"
```

---

### Task 8: Data Validation — Implementation

**Files:**
- Create: `data/validate.ts`

- [ ] **Step 1: Implement validation functions**

```typescript
import type { CV, ResumeProfile } from "./schema.js";

const COLLECTIONS = ["experience", "education", "skills", "projects", "certifications"] as const;

export function validateCV(cv: unknown): asserts cv is CV {
  if (!cv || typeof cv !== "object") {
    throw new Error("CV must be an object");
  }

  const data = cv as Record<string, unknown>;

  if (!data.personal || typeof data.personal !== "object") {
    throw new Error("CV must have a personal section");
  }

  const personal = data.personal as Record<string, unknown>;
  for (const field of ["name", "email", "phone", "location"]) {
    if (typeof personal[field] !== "string") {
      throw new Error(`personal.${field} must be a string`);
    }
  }

  if (!personal.links || typeof personal.links !== "object") {
    throw new Error("personal.links must be an object");
  }

  for (const collection of COLLECTIONS) {
    if (!Array.isArray(data[collection])) {
      throw new Error(`CV must have a ${collection} array`);
    }

    const entries = data[collection] as Array<Record<string, unknown>>;
    const ids = new Set<string>();

    for (const entry of entries) {
      if (typeof entry.id !== "string" || entry.id === "") {
        throw new Error(`Each ${collection} entry must have a non-empty id`);
      }
      if (ids.has(entry.id)) {
        throw new Error(`Duplicate id "${entry.id}" in ${collection}`);
      }
      ids.add(entry.id);
    }
  }
}

export function validateProfile(profile: unknown): asserts profile is ResumeProfile {
  if (!profile || typeof profile !== "object") {
    throw new Error("Profile must be an object");
  }

  const data = profile as Record<string, unknown>;

  if (typeof data.slug !== "string" || data.slug === "") {
    throw new Error("Profile must have a non-empty slug");
  }

  if (typeof data.title !== "string" || data.title === "") {
    throw new Error("Profile must have a non-empty title");
  }

  if (!data.include || typeof data.include !== "object") {
    throw new Error("Profile must have an include section");
  }

  const include = data.include as Record<string, unknown>;
  for (const collection of COLLECTIONS) {
    if (!Array.isArray(include[collection])) {
      throw new Error(`include.${collection} must be an array`);
    }
  }

  if (data.overrides) {
    if (typeof data.overrides !== "object") {
      throw new Error("overrides must be an object");
    }

    for (const path of Object.keys(data.overrides as object)) {
      const parts = path.split(".");
      if (parts.length !== 3) {
        throw new Error(
          `Override path "${path}" must be <collection>.<id>.<field> (3 parts)`,
        );
      }
    }
  }
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test`

Expected: All tests PASS (both resolve and validate suites)

- [ ] **Step 3: Commit**

```bash
git add data/validate.ts data/validate.test.ts
git commit -m "feat: add CV and resume profile validation"
```

---

## Phase 2: Astro Site Scaffolding

### Task 9: Initialize Astro Project

**Files:**
- Create: `site/package.json`, `site/astro.config.ts`, `site/tsconfig.json`

- [ ] **Step 1: Create site/package.json**

```json
{
  "name": "arustydev-site",
  "type": "module",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "@astrojs/mdx": "^4.3.0",
    "@astrojs/sitemap": "^3.6.0",
    "@tailwindcss/typography": "^0.5.19",
    "@tailwindcss/vite": "^4.1.18",
    "astro": "^5.16.6",
    "tailwindcss": "^4.1.18"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.6",
    "typescript": "^5.9.3"
  }
}
```

- [ ] **Step 2: Create site/tsconfig.json**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*", "../data/**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@data/*": ["../data/*"]
    },
    "resolveJsonModule": true
  }
}
```

- [ ] **Step 3: Create site/astro.config.ts**

```typescript
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { SITE } from "./src/config";

export default defineConfig({
  site: SITE.website,
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 4: Create site/src/config.ts**

```typescript
export const SITE = {
  website: "https://im.arusty.dev/",
  author: "aRustyDev",
  title: "aRustyDev",
  description: "Portfolio, CV, and resume — Adam's corner of the internet",
  ogImage: "og-image.jpg",
  dir: "ltr" as const,
  lang: "en",
} as const;

export const SOCIALS = [
  { name: "GitHub", href: "https://github.com/aRustyDev", active: true },
  { name: "LinkedIn", href: "https://linkedin.com/in/arustydev", active: true },
  { name: "Blog", href: "https://blog.arusty.dev", active: true },
] as const;

export const NAV_LINKS = [
  { name: "About", href: "/about" },
  { name: "CV", href: "/cv" },
  { name: "Resume", href: "/resume" },
  { name: "Portfolio", href: "/portfolio" },
  { name: "Contact", href: "/contact" },
] as const;
```

- [ ] **Step 5: Install site dependencies**

Run: `cd /private/etc/infra/pub/portfolio && npm install`

Expected: All workspace dependencies installed. `site/node_modules/` or hoisted to root `node_modules/`.

- [ ] **Step 6: Verify Astro runs**

Create a minimal `site/src/pages/index.astro`:

```astro
---
import { SITE } from "@/config";
---

<html lang={SITE.lang}>
  <head>
    <meta charset="utf-8" />
    <title>{SITE.title}</title>
  </head>
  <body>
    <h1>{SITE.title}</h1>
    <p>{SITE.description}</p>
  </body>
</html>
```

Run: `cd site && npx astro check && npx astro build`

Expected: Type check passes, build outputs to `site/dist/`

- [ ] **Step 7: Commit**

```bash
git add site/package.json site/tsconfig.json site/astro.config.ts site/src/config.ts site/src/pages/index.astro
git commit -m "feat: initialize Astro 5 project with Tailwind v4 and site config"
```

---

### Task 10: Tailwind v4 + Base Styles

**Files:**
- Create: `site/src/styles/global.css`

- [ ] **Step 1: Create global.css with Tailwind v4 setup**

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

@theme inline {
  --color-bg: var(--background, #fafafa);
  --color-fg: var(--foreground, #1a1a1a);
  --color-ac: var(--accent, #2563eb);
  --color-mt: var(--muted, #f5f5f5);
  --color-bd: var(--border, #e5e5e5);
}

@layer base {
  :root {
    --background: #fafafa;
    --foreground: #1a1a1a;
    --accent: #2563eb;
    --muted: #f5f5f5;
    --border: #e5e5e5;
  }

  [data-theme="dark"] {
    --background: #0a0a0a;
    --foreground: #ededed;
    --accent: #60a5fa;
    --muted: #1a1a1a;
    --border: #2a2a2a;
  }

  * {
    @apply border-bd;
  }

  body {
    @apply flex min-h-svh flex-col bg-bg text-fg;
  }
}

@utility max-w-app {
  @apply max-w-3xl;
}

@utility app-layout {
  @apply mx-auto w-full max-w-app px-4;
}
```

- [ ] **Step 2: Update index.astro to import styles via frontmatter**

In `site/src/pages/index.astro`, add the CSS import in the frontmatter:

```astro
---
import "@/styles/global.css";
import { SITE } from "@/config";
---
```

- [ ] **Step 3: Verify build with Tailwind**

Run: `cd site && npx astro build`

Expected: Build succeeds, CSS processed

- [ ] **Step 4: Commit**

```bash
git add site/src/styles/global.css site/src/pages/index.astro
git commit -m "feat: add Tailwind v4 setup with dark/light theme tokens"
```

---

### Task 11: Layout Components

**Files:**
- Create: `site/src/layouts/Layout.astro`, `site/src/layouts/Main.astro`, `site/src/components/Header.astro`, `site/src/components/Footer.astro`

- [ ] **Step 1: Create root Layout.astro**

```astro
---
import "@/styles/global.css";
import { SITE } from "@/config";

interface Props {
  title?: string;
  description?: string;
}

const {
  title = SITE.title,
  description = SITE.description,
} = Astro.props;

const pageTitle = title === SITE.title ? title : `${title} | ${SITE.title}`;
---

<!doctype html>
<html lang={SITE.lang} dir={SITE.dir} data-theme="light">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <title>{pageTitle}</title>
    <link rel="canonical" href={new URL(Astro.url.pathname, SITE.website).href} />
    <link rel="sitemap" href="/sitemap-index.xml" />
  </head>
  <body>
    <slot />
  </body>
</html>

<script is:inline>
  const theme = localStorage.getItem("theme") ??
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
</script>
```

- [ ] **Step 2: Create Header.astro**

```astro
---
import { SITE, NAV_LINKS } from "@/config";

const { pathname } = Astro.url;
const currentPath = pathname.endsWith("/") && pathname !== "/"
  ? pathname.slice(0, -1)
  : pathname;

const isActive = (path: string) => {
  if (path === "/") return currentPath === "/";
  return currentPath.startsWith(path);
};
---

<header class="app-layout border-b border-bd py-4 sm:py-6">
  <div class="flex items-center justify-between">
    <a href="/" class="text-xl font-semibold sm:text-2xl">{SITE.title}</a>
    <nav>
      <button
        id="menu-btn"
        class="p-2 sm:hidden"
        aria-label="Open Menu"
        aria-expanded="false"
        aria-controls="menu-items"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path id="menu-icon" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <ul
        id="menu-items"
        class:list={[
          "hidden sm:flex sm:items-center sm:gap-x-5",
          "max-sm:absolute max-sm:right-4 max-sm:top-16 max-sm:z-10",
          "max-sm:rounded max-sm:border max-sm:border-bd max-sm:bg-bg max-sm:p-4",
        ]}
      >
        {NAV_LINKS.map(({ name, href }) => (
          <li>
            <a
              href={href}
              class:list={[
                "block py-1 text-sm transition-colors hover:text-ac",
                { "font-semibold text-ac": isActive(href) },
              ]}
            >
              {name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  </div>
</header>

<script>
  function setupMenu() {
    const btn = document.querySelector("#menu-btn");
    const menu = document.querySelector("#menu-items");
    if (!btn || !menu) return;

    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      menu.classList.toggle("hidden");
    });
  }

  setupMenu();
  document.addEventListener("astro:after-swap", setupMenu);
</script>
```

- [ ] **Step 3: Create Footer.astro**

```astro
---
import { SITE } from "@/config";

const year = new Date().getFullYear();
---

<footer class="app-layout border-t border-bd py-6 text-center text-sm text-fg/60">
  <p>&copy; {year} {SITE.author}. All rights reserved.</p>
</footer>
```

- [ ] **Step 4: Create Main.astro layout**

```astro
---
import Layout from "./Layout.astro";
import Header from "@/components/Header.astro";
import Footer from "@/components/Footer.astro";

interface Props {
  title?: string;
  description?: string;
  pageTitle?: string;
  pageDesc?: string;
}

const { title, description, pageTitle, pageDesc } = Astro.props;
---

<Layout title={title} description={description}>
  <Header />
  <main class="app-layout flex-1 py-8">
    {pageTitle && (
      <div class="mb-8">
        <h1 class="text-3xl font-bold sm:text-4xl">{pageTitle}</h1>
        {pageDesc && <p class="mt-2 text-fg/70">{pageDesc}</p>}
      </div>
    )}
    <slot />
  </main>
  <Footer />
</Layout>
```

- [ ] **Step 5: Update index.astro to use layouts**

```astro
---
import Main from "@/layouts/Main.astro";
import { SITE, SOCIALS } from "@/config";
---

<Main>
  <section class="py-8">
    <h1 class="text-4xl font-bold sm:text-5xl">{SITE.title}</h1>
    <p class="mt-4 text-lg text-fg/80">{SITE.description}</p>
    <div class="mt-6 flex gap-4">
      {SOCIALS.filter(s => s.active).map(({ name, href }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          class="text-ac underline-offset-4 hover:underline"
        >
          {name}
        </a>
      ))}
    </div>
  </section>
</Main>
```

- [ ] **Step 6: Verify build**

Run: `cd site && npx astro check && npx astro build`

Expected: Build passes

- [ ] **Step 7: Commit**

```bash
git add site/src/layouts/ site/src/components/ site/src/pages/index.astro
git commit -m "feat: add layout system — Layout, Main, Header, Footer"
```

---

## Phase 3: Content Pages

### Task 12: CV Page

**Files:**
- Create: `site/src/pages/cv.astro`
- Create: `site/src/components/CvSection.astro`

- [ ] **Step 1: Create CvSection.astro component**

```astro
---
interface Props {
  title: string;
}

const { title } = Astro.props;
---

<section class="mb-8">
  <h2 class="mb-4 border-b border-bd pb-2 text-xl font-semibold">{title}</h2>
  <slot />
</section>
```

- [ ] **Step 2: Create shared formatDate utility**

Create `site/src/utils/formatDate.ts`:

```typescript
export function formatDate(date: string | null): string {
  if (!date) return "Present";
  const [year, month] = date.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return month ? `${months[parseInt(month) - 1]} ${year}` : year;
}
```

- [ ] **Step 3: Create cv.astro page**

```astro
---
import Main from "@/layouts/Main.astro";
import CvSection from "@/components/CvSection.astro";
import { formatDate } from "@/utils/formatDate";
import cvData from "@data/cv.json";
import type { CV } from "@data/schema";

const cv = cvData as CV;
---

<Main title="CV" pageTitle="Curriculum Vitae" pageDesc="Full professional history">
  <CvSection title="Experience">
    {cv.experience.map(job => (
      <div class="mb-6">
        <div class="flex flex-wrap items-baseline justify-between gap-x-4">
          <h3 class="text-lg font-medium">{job.title}</h3>
          <span class="text-sm text-fg/60">
            {formatDate(job.start)} — {formatDate(job.end)}
          </span>
        </div>
        <p class="text-fg/70">{job.company} · {job.location}</p>
        {job.highlights.length > 0 && (
          <ul class="mt-2 list-disc space-y-1 pl-5 text-sm">
            {job.highlights.map(h => <li>{h}</li>)}
          </ul>
        )}
      </div>
    ))}
  </CvSection>

  <CvSection title="Education">
    {cv.education.map(edu => (
      <div class="mb-4">
        <div class="flex flex-wrap items-baseline justify-between gap-x-4">
          <h3 class="text-lg font-medium">{edu.degree} in {edu.field}</h3>
          <span class="text-sm text-fg/60">
            {formatDate(edu.start)} — {formatDate(edu.end)}
          </span>
        </div>
        <p class="text-fg/70">{edu.institution}</p>
      </div>
    ))}
  </CvSection>

  <CvSection title="Skills">
    {cv.skills.map(group => (
      <div class="mb-3">
        <span class="font-medium">{group.category}:</span>{" "}
        <span class="text-fg/80">{group.items.join(", ")}</span>
      </div>
    ))}
  </CvSection>

  <CvSection title="Projects">
    {cv.projects.map(proj => (
      <div class="mb-4">
        <h3 class="text-lg font-medium">
          <a href={proj.url} class="text-ac underline-offset-4 hover:underline" target="_blank" rel="noopener">
            {proj.name}
          </a>
        </h3>
        <p class="text-fg/70">{proj.description}</p>
        {proj.highlights.length > 0 && (
          <ul class="mt-1 list-disc space-y-1 pl-5 text-sm">
            {proj.highlights.map(h => <li>{h}</li>)}
          </ul>
        )}
      </div>
    ))}
  </CvSection>

  <CvSection title="Certifications">
    {cv.certifications.map(cert => (
      <div class="mb-3">
        <a href={cert.url} class="font-medium text-ac underline-offset-4 hover:underline" target="_blank" rel="noopener">
          {cert.name}
        </a>
        <span class="text-fg/60"> · {cert.issuer} · {formatDate(cert.date)}</span>
      </div>
    ))}
  </CvSection>
</Main>
```

- [ ] **Step 4: Verify build**

Run: `cd site && npx astro check && npx astro build`

Expected: Build passes, `/cv/index.html` exists in `dist/`

- [ ] **Step 5: Commit**

```bash
git add site/src/utils/formatDate.ts site/src/pages/cv.astro site/src/components/CvSection.astro
git commit -m "feat: add CV page rendering full history from cv.json"
```

---

### Task 13: Resume Pages (Listing + Dynamic Route)

**Files:**
- Create: `site/src/pages/resume/index.astro`
- Create: `site/src/pages/resume/[slug].astro`
- Create: `site/src/utils/loadResumes.ts`

- [ ] **Step 1: Create resume loader utility**

```typescript
// site/src/utils/loadResumes.ts
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveResume } from "@data/resolve";
import type { CV, ResumeProfile, ResolvedResume } from "@data/schema";
import cvData from "@data/cv.json";

const cv = cvData as CV;

// Load all resume profiles at build time via filesystem.
// Using fs rather than import.meta.glob avoids Vite workspace boundary issues.
const resumesDir = resolve(import.meta.dirname, "../../../data/resumes");

function loadProfiles(): ResumeProfile[] {
  const files = readdirSync(resumesDir).filter(f => f.endsWith(".json"));
  return files.map(f => {
    const raw = readFileSync(resolve(resumesDir, f), "utf-8");
    return JSON.parse(raw) as ResumeProfile;
  });
}

const profiles = loadProfiles();

export function getAllProfiles(): ResumeProfile[] {
  return profiles;
}

export function getAllResolved(): ResolvedResume[] {
  return profiles.map(profile => resolveResume(cv, profile));
}

export function getResolvedBySlug(slug: string): ResolvedResume | undefined {
  const profile = profiles.find(p => p.slug === slug);
  if (!profile) return undefined;
  return resolveResume(cv, profile);
}
```

- [ ] **Step 2: Create resume listing page**

```astro
---
// site/src/pages/resume/index.astro
import Main from "@/layouts/Main.astro";
import { getAllProfiles } from "@/utils/loadResumes";

const profiles = getAllProfiles();
---

<Main title="Resumes" pageTitle="Resumes" pageDesc="Role-specific resume variants">
  <div class="space-y-4">
    {profiles.map(profile => (
      <div class="rounded border border-bd p-4">
        <div class="flex items-center justify-between">
          <div>
            <a href={`/resume/${profile.slug}`} class="text-lg font-medium text-ac underline-offset-4 hover:underline">
              {profile.title}
            </a>
            <p class="text-sm text-fg/60">
              {profile.include.experience.length} roles · {profile.include.skills.length} skill groups
            </p>
          </div>
          <a
            href={`/resumes/${profile.slug}.pdf`}
            class="rounded bg-ac px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            download
          >
            Download PDF
          </a>
        </div>
      </div>
    ))}
  </div>
</Main>
```

- [ ] **Step 3: Create dynamic resume page**

```astro
---
// site/src/pages/resume/[slug].astro
import type { GetStaticPaths } from "astro";
import Main from "@/layouts/Main.astro";
import CvSection from "@/components/CvSection.astro";
import { formatDate } from "@/utils/formatDate";
import { getAllProfiles, getResolvedBySlug } from "@/utils/loadResumes";

export const getStaticPaths: GetStaticPaths = () => {
  return getAllProfiles().map(p => ({ params: { slug: p.slug } }));
};

const { slug } = Astro.params;
const resume = getResolvedBySlug(slug!);

if (!resume) {
  return Astro.redirect("/resume");
}
---

<Main title={`Resume — ${resume.title}`} pageTitle={resume.title} pageDesc="Targeted resume">
  <div class="mb-6">
    <a
      href={`/resumes/${resume.slug}.pdf`}
      class="inline-block rounded bg-ac px-4 py-2 font-medium text-white hover:opacity-90"
      download
    >
      Download PDF
    </a>
    <a href="/resume" class="ml-4 text-sm text-ac underline-offset-4 hover:underline">
      All resumes
    </a>
  </div>

  <CvSection title="Experience">
    {resume.experience.map(job => (
      <div class="mb-6">
        <div class="flex flex-wrap items-baseline justify-between gap-x-4">
          <h3 class="text-lg font-medium">{job.title}</h3>
          <span class="text-sm text-fg/60">
            {formatDate(job.start)} — {formatDate(job.end)}
          </span>
        </div>
        <p class="text-fg/70">{job.company} · {job.location}</p>
        {job.highlights.length > 0 && (
          <ul class="mt-2 list-disc space-y-1 pl-5 text-sm">
            {job.highlights.map(h => <li>{h}</li>)}
          </ul>
        )}
      </div>
    ))}
  </CvSection>

  {resume.education.length > 0 && (
    <CvSection title="Education">
      {resume.education.map(edu => (
        <div class="mb-4">
          <div class="flex flex-wrap items-baseline justify-between gap-x-4">
            <h3 class="text-lg font-medium">{edu.degree} in {edu.field}</h3>
            <span class="text-sm text-fg/60">{formatDate(edu.start)} — {formatDate(edu.end)}</span>
          </div>
          <p class="text-fg/70">{edu.institution}</p>
        </div>
      ))}
    </CvSection>
  )}

  {resume.skills.length > 0 && (
    <CvSection title="Skills">
      {resume.skills.map(group => (
        <div class="mb-3">
          <span class="font-medium">{group.category}:</span>{" "}
          <span class="text-fg/80">{group.items.join(", ")}</span>
        </div>
      ))}
    </CvSection>
  )}

  {resume.projects.length > 0 && (
    <CvSection title="Projects">
      {resume.projects.map(proj => (
        <div class="mb-4">
          <h3 class="text-lg font-medium">
            <a href={proj.url} class="text-ac underline-offset-4 hover:underline" target="_blank" rel="noopener">{proj.name}</a>
          </h3>
          <p class="text-fg/70">{proj.description}</p>
        </div>
      ))}
    </CvSection>
  )}

  {resume.certifications.length > 0 && (
    <CvSection title="Certifications">
      {resume.certifications.map(cert => (
        <div class="mb-3">
          <a href={cert.url} class="font-medium text-ac underline-offset-4 hover:underline" target="_blank" rel="noopener">{cert.name}</a>
          <span class="text-fg/60"> · {cert.issuer} · {formatDate(cert.date)}</span>
        </div>
      ))}
    </CvSection>
  )}
</Main>
```

- [ ] **Step 4: Verify build**

Run: `cd site && npx astro check && npx astro build`

Expected: Build passes, `dist/resume/index.html` and `dist/resume/backend-engineer/index.html` exist

- [ ] **Step 5: Commit**

```bash
git add site/src/utils/loadResumes.ts site/src/pages/resume/
git commit -m "feat: add resume listing and dynamic resume pages"
```

---

### Task 14: Content Collections (About + Portfolio)

**Files:**
- Create: `site/src/content.config.ts`
- Create: `site/src/content/about/index.mdx`
- Create: `site/src/content/portfolio/example-project.mdx`
- Create: `site/src/pages/about.astro`
- Create: `site/src/pages/portfolio.astro`

- [ ] **Step 1: Create content collection config**

```typescript
// site/src/content.config.ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const about = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/about" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

const portfolio = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/portfolio" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      url: z.string().optional(),
      repo: z.string().optional(),
      image: image().or(z.string()).optional(),
      tags: z.array(z.string()).default([]),
      order: z.number().default(0),
    }),
});

export const collections = { about, portfolio };
```

- [ ] **Step 2: Create about page content**

```mdx
---
title: About Me
description: Who I am and what I do
---

# About Me

This is a placeholder for the about page. Replace with your actual content.
```

- [ ] **Step 3: Create example portfolio entry**

```mdx
---
title: Example Project
description: A brief description of this project
url: https://example.com
repo: https://github.com/aRustyDev/example
tags: ["rust", "cli"]
order: 1
---

## Example Project

This is a placeholder portfolio entry. Replace with real project writeups.
```

- [ ] **Step 4: Create about.astro page**

```astro
---
import { getCollection, render } from "astro:content";
import Main from "@/layouts/Main.astro";

const aboutEntries = await getCollection("about");
const entry = aboutEntries[0];
const { Content } = entry ? await render(entry) : { Content: null };
---

<Main title="About" pageTitle="About" pageDesc="Who I am and what I do">
  {Content ? (
    <article class="prose max-w-none">
      <Content />
    </article>
  ) : (
    <p>About content coming soon.</p>
  )}
</Main>
```

- [ ] **Step 5: Create portfolio.astro page**

```astro
---
import { getCollection } from "astro:content";
import Main from "@/layouts/Main.astro";

const projects = (await getCollection("portfolio")).sort(
  (a, b) => a.data.order - b.data.order
);
---

<Main title="Portfolio" pageTitle="Portfolio" pageDesc="Selected projects and work">
  <div class="space-y-6">
    {projects.map(project => (
      <div class="rounded border border-bd p-5">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold">{project.data.title}</h2>
            <p class="mt-1 text-fg/70">{project.data.description}</p>
          </div>
          <div class="flex gap-2">
            {project.data.url && (
              <a href={project.data.url} class="text-sm text-ac underline-offset-4 hover:underline" target="_blank" rel="noopener">
                Live
              </a>
            )}
            {project.data.repo && (
              <a href={project.data.repo} class="text-sm text-ac underline-offset-4 hover:underline" target="_blank" rel="noopener">
                Source
              </a>
            )}
          </div>
        </div>
        {project.data.tags.length > 0 && (
          <div class="mt-3 flex gap-2">
            {project.data.tags.map(tag => (
              <span class="rounded bg-mt px-2 py-0.5 text-xs text-fg/70">{tag}</span>
            ))}
          </div>
        )}
      </div>
    ))}
  </div>
</Main>
```

- [ ] **Step 6: Verify build**

Run: `cd site && npx astro check && npx astro build`

Expected: Build passes, `dist/about/index.html` and `dist/portfolio/index.html` exist

- [ ] **Step 7: Commit**

```bash
git add site/src/content.config.ts site/src/content/ site/src/pages/about.astro site/src/pages/portfolio.astro
git commit -m "feat: add about and portfolio pages with MDX content collections"
```

---

### Task 15: Contact Page

**Files:**
- Create: `site/src/pages/contact.astro`

- [ ] **Step 1: Create contact page**

```astro
---
import Main from "@/layouts/Main.astro";
import { SOCIALS } from "@/config";
import cvData from "@data/cv.json";
import type { CV } from "@data/schema";

const cv = cvData as CV;
---

<Main title="Contact" pageTitle="Contact" pageDesc="Get in touch">
  <div class="space-y-6">
    <div>
      <h2 class="mb-2 text-lg font-medium">Email</h2>
      <a href={`mailto:${cv.personal.email}`} class="text-ac underline-offset-4 hover:underline">
        {cv.personal.email}
      </a>
    </div>

    <div>
      <h2 class="mb-2 text-lg font-medium">Links</h2>
      <ul class="space-y-2">
        {SOCIALS.filter(s => s.active).map(({ name, href }) => (
          <li>
            <a href={href} class="text-ac underline-offset-4 hover:underline" target="_blank" rel="noopener">
              {name}
            </a>
          </li>
        ))}
      </ul>
    </div>

    <div>
      <h2 class="mb-2 text-lg font-medium">Location</h2>
      <p class="text-fg/70">{cv.personal.location}</p>
    </div>
  </div>
</Main>
```

- [ ] **Step 2: Verify build**

Run: `cd site && npx astro check && npx astro build`

Expected: Build passes, `dist/contact/index.html` exists

- [ ] **Step 3: Commit**

```bash
git add site/src/pages/contact.astro
git commit -m "feat: add contact page with email and social links"
```

---

## Phase 4: Deployment Config

### Task 16: Wrangler + Cloudflare Pages Config

**Files:**
- Create: `wrangler.jsonc`

- [ ] **Step 1: Create wrangler.jsonc**

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

- [ ] **Step 2: Add wrangler as dev dependency**

Run: `cd /private/etc/infra/pub/portfolio && npm install -D wrangler`

- [ ] **Step 3: Verify full build from root**

Run: `npm run build`

Expected: Astro build succeeds from root via workspace delegation

- [ ] **Step 4: Commit**

```bash
git add wrangler.jsonc package.json package-lock.json
git commit -m "feat: add Cloudflare Pages deployment config"
```

---

### Task 17: Update Dependabot Config

**Files:**
- Modify: `.github/dependabot.yml`

- [ ] **Step 1: Update dependabot.yml to include npm ecosystems**

Add the npm ecosystem entries after the existing `github-actions` entry:

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

- [ ] **Step 2: Commit**

```bash
git add .github/dependabot.yml
git commit -m "chore: extend dependabot to cover npm dependencies"
```

---

### Task 18: Create placeholder directories and verify end-to-end

**Files:**
- Create: `site/public/resumes/.gitkeep`
- Create: `readme/assets/.gitkeep`
- Create: `readme/templates/.gitkeep`
- Create: `templates/.gitkeep`
- Create: `scripts/.gitkeep`

- [ ] **Step 1: Create placeholder directories for future workstreams**

```bash
mkdir -p site/public/resumes readme/assets readme/templates templates scripts
touch site/public/resumes/.gitkeep readme/assets/.gitkeep readme/templates/.gitkeep templates/.gitkeep scripts/.gitkeep
```

- [ ] **Step 2: Run full test suite**

Run: `npm test`

Expected: All data layer tests pass (resolve + validate)

- [ ] **Step 3: Run full build**

Run: `npm run build`

Expected: Astro builds successfully, all pages present in `site/dist/`

- [ ] **Step 4: Verify dist output contains all expected pages**

Run: `find site/dist -name "index.html" | sort`

Expected:
```
site/dist/404.html (or similar)
site/dist/about/index.html
site/dist/contact/index.html
site/dist/cv/index.html
site/dist/index.html
site/dist/portfolio/index.html
site/dist/resume/backend-engineer/index.html
site/dist/resume/index.html
```

- [ ] **Step 5: Commit**

```bash
git add site/public/resumes/.gitkeep readme/ templates/ scripts/
git commit -m "chore: add placeholder directories for PDF and README pipelines"
```
