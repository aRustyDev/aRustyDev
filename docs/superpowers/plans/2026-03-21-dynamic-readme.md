# Dynamic README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a GitHub Action that runs on a cron, queries GitHub APIs and blog RSS, generates SVG visualizations and markdown, and commits an updated README.md to the repo.

**Architecture:** A TypeScript generation script (`readme/generate.ts`) fetches data from GitHub GraphQL/REST APIs and the blog RSS feed in parallel. It generates SVGs using raw string templates and assembles README.md from a markdown template. A GitHub Action runs this every 6 hours and commits changes.

**Tech Stack:** TypeScript (tsx), GitHub GraphQL API (@octokit/graphql), raw SVG templating, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-03-21-portfolio-and-readme-design.md` — Workstream 2: Dynamic README

**Prerequisite:** Foundation plan must be complete (root package.json, tsx available). This plan is independent of the site and PDF plans.

---

## File Structure

| File | Responsibility |
|---|---|
| `readme/generate.ts` | Main generation script — orchestrates data fetching, SVG generation, README assembly |
| `readme/fetch-github.ts` | GitHub API data fetching (GraphQL + REST) |
| `readme/fetch-github.test.ts` | Tests for GitHub data fetching (with mocked API responses) |
| `readme/fetch-blog.ts` | Blog RSS feed fetching and parsing |
| `readme/fetch-blog.test.ts` | Tests for RSS parsing |
| `readme/svg/language-breakdown.ts` | SVG generator: language donut chart |
| `readme/svg/contribution-trends.ts` | SVG generator: commit frequency bar chart |
| `readme/svg/activity-summary.ts` | SVG generator: compact stats card |
| `readme/svg/top-repos.ts` | SVG generator: high-activity repo cards |
| `readme/svg/pinned-repos.ts` | SVG generator: pinned repo cards |
| `readme/svg/shared.ts` | Shared SVG utilities — colors, dark/light mode, dimensions |
| `readme/svg/shared.test.ts` | Tests for SVG shared utilities |
| `readme/assemble.ts` | README.md assembly from template + dynamic sections |
| `readme/assemble.test.ts` | Tests for README assembly |
| `readme/types.ts` | TypeScript types for GitHub API responses and SVG data |
| `readme/templates/readme.md` | Markdown template with placeholder tokens |
| `scripts/build-readme.sh` | Shell wrapper: installs deps, runs generate.ts |
| `.github/workflows/update-readme.yml` | CI workflow: cron + manual trigger |

---

## Phase 1: Types & Shared Utilities

### Task 1: Define Data Types

**Files:**
- Create: `readme/types.ts`

- [ ] **Step 1: Create types for API responses and SVG data**

```typescript
// readme/types.ts

export interface LanguageData {
  name: string;
  bytes: number;
  color: string;
  percentage: number;
}

export interface ContributionWeek {
  week: string; // ISO date of week start
  count: number;
}

export interface RepoData {
  name: string;
  description: string | null;
  url: string;
  stars: number;
  language: string | null;
  languageColor: string | null;
  updatedAt: string;
  isArchived: boolean;
}

export interface ReleaseData {
  repo: string;
  repoUrl: string;
  tagName: string;
  publishedAt: string;
}

export interface ActivityStats {
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalReviews: number;
  totalDiscussions: number;
  totalStars: number;
  totalRepos: number;
  contributionStreak: number;
}

export interface BlogPost {
  title: string;
  url: string;
  date: string;
}

export interface GitHubData {
  languages: LanguageData[];
  contributions: ContributionWeek[];
  topRepos: RepoData[];
  pinnedRepos: RepoData[];
  releases: ReleaseData[];
  stats: ActivityStats;
}

export interface ReadmeData {
  github: GitHubData;
  blogPosts: BlogPost[];
}
```

- [ ] **Step 2: Commit**

```bash
git add readme/types.ts
git commit -m "feat: add TypeScript types for README generation data"
```

---

### Task 2: Shared SVG Utilities — Tests

**Files:**
- Create: `readme/svg/shared.test.ts`

- [ ] **Step 1: Write failing tests for SVG utilities**

```typescript
import { describe, it, expect } from "vitest";
import { wrapSvg, COLORS, formatNumber } from "./shared.js";

describe("wrapSvg", () => {
  it("wraps content in SVG element with correct dimensions", () => {
    const result = wrapSvg("<rect />", 800, 200);
    expect(result).toContain('width="800"');
    expect(result).toContain('height="200"');
    expect(result).toContain("<rect />");
    expect(result).toContain("xmlns=");
  });

  it("includes prefers-color-scheme media query", () => {
    const result = wrapSvg("<rect />", 800, 200);
    expect(result).toContain("prefers-color-scheme: dark");
  });
});

describe("formatNumber", () => {
  it("formats thousands with k suffix", () => {
    expect(formatNumber(1500)).toBe("1.5k");
    expect(formatNumber(15000)).toBe("15k");
  });

  it("leaves small numbers as-is", () => {
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(0)).toBe("0");
  });
});

describe("COLORS", () => {
  it("has light and dark themes", () => {
    expect(COLORS.light.bg).toBeDefined();
    expect(COLORS.dark.bg).toBeDefined();
    expect(COLORS.light.fg).toBeDefined();
    expect(COLORS.dark.fg).toBeDefined();
  });
});
```

- [ ] **Step 2: Update vitest config to include readme tests**

Add `"readme/**/*.test.ts"` to the existing `include` array in `vitest.config.ts`. The include array should now be:

```typescript
include: ["data/**/*.test.ts", "scripts/**/*.test.ts", "readme/**/*.test.ts"],
```

Do NOT replace the entire file — only modify the `include` line to add the readme glob pattern.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL — shared module does not exist

---

### Task 3: Shared SVG Utilities — Implementation

**Files:**
- Create: `readme/svg/shared.ts`

- [ ] **Step 1: Implement shared SVG utilities**

```typescript
// readme/svg/shared.ts

export const COLORS = {
  light: {
    bg: "#ffffff",
    fg: "#1f2328",
    fgMuted: "#656d76",
    border: "#d0d7de",
    accent: "#0969da",
    cardBg: "#f6f8fa",
  },
  dark: {
    bg: "#0d1117",
    fg: "#e6edf3",
    fgMuted: "#8b949e",
    border: "#30363d",
    accent: "#58a6ff",
    cardBg: "#161b22",
  },
} as const;

// GitHub language colors
export const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Rust: "#dea584",
  Go: "#00ADD8",
  Python: "#3572A5",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Nix: "#7e7eff",
  Lua: "#000080",
  Zig: "#ec915c",
};

export function formatNumber(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return String(n);
}

export function wrapSvg(content: string, width: number, height: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    .light { display: block; }
    .dark { display: none; }
    @media (prefers-color-scheme: dark) {
      .light { display: none; }
      .dark { display: block; }
    }
    text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
  </style>
  <g class="light">
    <rect width="${width}" height="${height}" fill="${COLORS.light.bg}" rx="6" />
    ${content}
  </g>
  <g class="dark">
    <rect width="${width}" height="${height}" fill="${COLORS.dark.bg}" rx="6" />
    ${content.replace(new RegExp(escapeRegex(COLORS.light.fg), "g"), COLORS.dark.fg)
             .replace(new RegExp(escapeRegex(COLORS.light.fgMuted), "g"), COLORS.dark.fgMuted)
             .replace(new RegExp(escapeRegex(COLORS.light.border), "g"), COLORS.dark.border)
             .replace(new RegExp(escapeRegex(COLORS.light.accent), "g"), COLORS.dark.accent)
             .replace(new RegExp(escapeRegex(COLORS.light.cardBg), "g"), COLORS.dark.cardBg)
             .replace(new RegExp(escapeRegex(COLORS.light.bg), "g"), COLORS.dark.bg)}
  </g>
</svg>`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test`

Expected: All shared SVG tests PASS

- [ ] **Step 3: Commit**

```bash
git add readme/svg/shared.ts readme/svg/shared.test.ts vitest.config.ts
git commit -m "feat: add shared SVG utilities — colors, formatting, wrapper"
```

---

## Phase 2: Data Fetching

### Task 4: Blog RSS Fetcher — Tests

**Files:**
- Create: `readme/fetch-blog.test.ts`

- [ ] **Step 1: Write failing tests for RSS parsing**

```typescript
import { describe, it, expect, vi } from "vitest";
import { parseBlogRss, fetchBlogPosts } from "./fetch-blog.js";

const sampleRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>aRustyDev's Blog</title>
    <item>
      <title>First Post</title>
      <link>https://blog.arusty.dev/posts/first</link>
      <pubDate>Mon, 01 Jan 2026 00:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Second Post</title>
      <link>https://blog.arusty.dev/posts/second</link>
      <pubDate>Fri, 15 Feb 2026 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

describe("parseBlogRss", () => {
  it("extracts posts from RSS XML", () => {
    const posts = parseBlogRss(sampleRss);
    expect(posts).toHaveLength(2);
    expect(posts[0].title).toBe("First Post");
    expect(posts[0].url).toBe("https://blog.arusty.dev/posts/first");
    expect(posts[0].date).toContain("2026");
  });

  it("returns empty array for invalid XML", () => {
    const posts = parseBlogRss("not xml");
    expect(posts).toEqual([]);
  });
});

describe("fetchBlogPosts", () => {
  it("returns empty array on fetch failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const posts = await fetchBlogPosts();
    expect(posts).toEqual([]);
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL — `parseBlogRss` and `fetchBlogPosts` do not exist

---

### Task 5: Blog RSS Fetcher — Implementation

**Files:**
- Create: `readme/fetch-blog.ts`

- [ ] **Step 1: Implement RSS fetching and parsing**

```typescript
// readme/fetch-blog.ts
import type { BlogPost } from "./types.js";

const BLOG_RSS_URL = "https://blog.arusty.dev/rss.xml";

export function parseBlogRss(xml: string): BlogPost[] {
  try {
    const items: BlogPost[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const content = match[1];
      const title = content.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? "";
      const url = content.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? "";
      const pubDate = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";

      if (title && url) {
        const date = pubDate ? new Date(pubDate).toISOString().split("T")[0] : "";
        items.push({ title, url, date });
      }
    }

    return items;
  } catch {
    return [];
  }
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch(BLOG_RSS_URL, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) {
      console.warn(`Blog RSS fetch failed: ${response.status}`);
      return [];
    }
    const xml = await response.text();
    return parseBlogRss(xml);
  } catch (error) {
    console.warn(`Blog RSS fetch error: ${error}`);
    return [];
  }
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test`

Expected: All blog fetch tests PASS

- [ ] **Step 3: Commit**

```bash
git add readme/fetch-blog.ts readme/fetch-blog.test.ts
git commit -m "feat: add blog RSS fetcher with graceful error handling"
```

---

### Task 6: GitHub Data Fetcher — Tests

**Files:**
- Create: `readme/fetch-github.test.ts`

- [ ] **Step 1: Write failing tests for GitHub data processing**

```typescript
import { describe, it, expect } from "vitest";
import { processLanguageData, processContributions } from "./fetch-github.js";

describe("processLanguageData", () => {
  it("calculates percentages and sorts by bytes descending", () => {
    const raw = {
      TypeScript: { bytes: 50000, color: "#3178c6" },
      Rust: { bytes: 30000, color: "#dea584" },
      Shell: { bytes: 20000, color: "#89e051" },
    };

    const result = processLanguageData(raw);

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("TypeScript");
    expect(result[0].percentage).toBe(50);
    expect(result[1].name).toBe("Rust");
    expect(result[1].percentage).toBe(30);
    expect(result[2].name).toBe("Shell");
    expect(result[2].percentage).toBe(20);
  });

  it("returns empty array for empty input", () => {
    expect(processLanguageData({})).toEqual([]);
  });
});

describe("processContributions", () => {
  it("aggregates daily contributions into weekly buckets", () => {
    const weeks = [
      {
        contributionDays: [
          { date: "2026-01-05", contributionCount: 3 },
          { date: "2026-01-06", contributionCount: 5 },
          { date: "2026-01-07", contributionCount: 0 },
        ],
      },
      {
        contributionDays: [
          { date: "2026-01-12", contributionCount: 2 },
        ],
      },
    ];

    const result = processContributions(weeks);
    expect(result).toHaveLength(2);
    expect(result[0].count).toBe(8); // 3+5+0
    expect(result[1].count).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL — functions don't exist

---

### Task 7: GitHub Data Fetcher — Implementation

**Files:**
- Create: `readme/fetch-github.ts`

- [ ] **Step 1: Implement GitHub data fetching**

```typescript
// readme/fetch-github.ts
import type {
  GitHubData,
  LanguageData,
  ContributionWeek,
  RepoData,
  ReleaseData,
  ActivityStats,
} from "./types.js";

const USERNAME = "aRustyDev";

interface RawLanguageData {
  [name: string]: { bytes: number; color: string };
}

interface ContributionDay {
  date: string;
  contributionCount: number;
}

interface RawContributionWeek {
  contributionDays: ContributionDay[];
}

export function processLanguageData(raw: RawLanguageData): LanguageData[] {
  const entries = Object.entries(raw);
  if (entries.length === 0) return [];

  const totalBytes = entries.reduce((sum, [, d]) => sum + d.bytes, 0);

  return entries
    .map(([name, data]) => ({
      name,
      bytes: data.bytes,
      color: data.color,
      percentage: Math.round((data.bytes / totalBytes) * 100),
    }))
    .sort((a, b) => b.bytes - a.bytes);
}

export function processContributions(weeks: RawContributionWeek[]): ContributionWeek[] {
  return weeks.map(week => ({
    week: week.contributionDays[0]?.date ?? "",
    count: week.contributionDays.reduce((sum, day) => sum + day.contributionCount, 0),
  }));
}

export async function fetchGitHubData(token: string): Promise<GitHubData> {
  const headers = {
    Authorization: `bearer ${token}`,
    "Content-Type": "application/json",
  };

  // GraphQL query for comprehensive user data
  const query = `query($username: String!) {
    user(login: $username) {
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
      repositories(first: 100, ownerAffiliations: OWNER, orderBy: {field: UPDATED_AT, direction: DESC}, privacy: PUBLIC) {
        totalCount
        nodes {
          name
          description
          url
          stargazerCount
          primaryLanguage { name color }
          updatedAt
          isArchived
          languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
            edges { size node { name color } }
          }
        }
      }
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name description url stargazerCount
            primaryLanguage { name color }
            updatedAt isArchived
          }
        }
      }
      repositoryDiscussionComments(first: 1) { totalCount }
    }
  }`;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables: { username: USERNAME } }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL API error: ${response.status}`);
  }

  const json = await response.json() as any;
  const user = json.data.user;
  const contrib = user.contributionsCollection;
  const repos = user.repositories.nodes;

  // Aggregate languages across all repos
  const langMap: RawLanguageData = {};
  for (const repo of repos) {
    if (repo.isArchived) continue;
    for (const edge of repo.languages?.edges ?? []) {
      const name = edge.node.name;
      if (!langMap[name]) {
        langMap[name] = { bytes: 0, color: edge.node.color ?? "#888" };
      }
      langMap[name].bytes += edge.size;
    }
  }

  // Fetch recent releases via REST
  const releasesResp = await fetch(
    `https://api.github.com/users/${USERNAME}/repos?type=owner&sort=updated&per_page=20`,
    { headers: { Authorization: `bearer ${token}` } }
  );
  const repoList = await releasesResp.json() as any[];

  const releases: ReleaseData[] = [];
  for (const repo of repoList.slice(0, 10)) {
    try {
      const relResp = await fetch(
        `https://api.github.com/repos/${USERNAME}/${repo.name}/releases?per_page=1`,
        { headers: { Authorization: `bearer ${token}` } }
      );
      const rels = await relResp.json() as any[];
      if (rels.length > 0) {
        releases.push({
          repo: repo.name,
          repoUrl: repo.html_url,
          tagName: rels[0].tag_name,
          publishedAt: rels[0].published_at,
        });
      }
    } catch {
      // Skip repos where release fetch fails
    }
  }

  const mapRepo = (r: any): RepoData => ({
    name: r.name,
    description: r.description,
    url: r.url ?? r.html_url,
    stars: r.stargazerCount ?? r.stargazers_count ?? 0,
    language: r.primaryLanguage?.name ?? r.language ?? null,
    languageColor: r.primaryLanguage?.color ?? null,
    updatedAt: r.updatedAt ?? r.updated_at,
    isArchived: r.isArchived ?? r.archived ?? false,
  });

  const totalStars = repos.reduce((s: number, r: any) => s + (r.stargazerCount ?? 0), 0);

  return {
    languages: processLanguageData(langMap),
    contributions: processContributions(
      contrib.contributionCalendar.weeks,
    ),
    topRepos: repos
      .filter((r: any) => !r.isArchived)
      .slice(0, 6)
      .map(mapRepo),
    pinnedRepos: (user.pinnedItems?.nodes ?? []).map(mapRepo),
    releases: releases.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    ),
    stats: {
      totalCommits: contrib.totalCommitContributions,
      totalPRs: contrib.totalPullRequestContributions,
      totalIssues: contrib.totalIssueContributions,
      totalReviews: contrib.totalPullRequestReviewContributions,
      totalDiscussions: user.repositoryDiscussionComments?.totalCount ?? 0,
      totalStars,
      totalRepos: user.repositories.totalCount,
      contributionStreak: 0, // DEFERRED: Streak calculation requires walking contribution calendar days. Implement after initial launch.
    },
  };
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test`

Expected: All tests PASS (processLanguageData, processContributions)

- [ ] **Step 3: Commit**

```bash
git add readme/fetch-github.ts readme/fetch-github.test.ts
git commit -m "feat: add GitHub data fetcher with GraphQL + REST queries"
```

---

## Phase 3: SVG Generators

### Task 8: Language Breakdown SVG

**Files:**
- Create: `readme/svg/language-breakdown.ts`

- [ ] **Step 1: Implement donut chart SVG generator**

```typescript
import type { LanguageData } from "../types.js";
import { wrapSvg, COLORS, LANG_COLORS } from "./shared.js";

export function generateLanguageBreakdown(languages: LanguageData[]): string {
  const top = languages.slice(0, 8);
  const width = 800;
  const height = 250;
  const cx = 125;
  const cy = 125;
  const r = 80;
  const strokeWidth = 24;

  // Generate donut chart arcs
  let offset = 0;
  const circumference = 2 * Math.PI * r;
  const arcs = top.map(lang => {
    const color = LANG_COLORS[lang.name] ?? lang.color;
    const dashLength = (lang.percentage / 100) * circumference;
    const arc = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      stroke="${color}" stroke-width="${strokeWidth}"
      stroke-dasharray="${dashLength} ${circumference}"
      stroke-dashoffset="${-offset}"
      transform="rotate(-90 ${cx} ${cy})" />`;
    offset += dashLength;
    return arc;
  }).join("\n    ");

  // Generate legend
  const legendX = 280;
  const legendItems = top.map((lang, i) => {
    const y = 30 + i * 28;
    const color = LANG_COLORS[lang.name] ?? lang.color;
    return `<rect x="${legendX}" y="${y}" width="12" height="12" rx="2" fill="${color}" />
    <text x="${legendX + 20}" y="${y + 11}" fill="${COLORS.light.fg}" font-size="13">${lang.name}</text>
    <text x="${legendX + 200}" y="${y + 11}" fill="${COLORS.light.fgMuted}" font-size="13" text-anchor="end">${lang.percentage}%</text>`;
  }).join("\n    ");

  const content = `
    <text x="20" y="24" fill="${COLORS.light.fg}" font-size="16" font-weight="600">Languages</text>
    ${arcs}
    ${legendItems}`;

  return wrapSvg(content, width, height);
}
```

- [ ] **Step 2: Commit**

- [ ] **Step 2: Verify module compiles**

Run: `npx tsx -e "import { generateLanguageBreakdown } from './readme/svg/language-breakdown.js'; console.log(generateLanguageBreakdown([{name:'TS',bytes:100,color:'#3178c6',percentage:100}]).substring(0,50))"`

Expected: Output starts with `<svg`

- [ ] **Step 3: Commit**

```bash
git add readme/svg/language-breakdown.ts
git commit -m "feat: add language breakdown donut chart SVG generator"
```

---

### Task 9: Activity Summary SVG

**Files:**
- Create: `readme/svg/activity-summary.ts`

- [ ] **Step 1: Implement stats card SVG generator**

```typescript
import type { ActivityStats } from "../types.js";
import { wrapSvg, COLORS, formatNumber } from "./shared.js";

export function generateActivitySummary(stats: ActivityStats): string {
  const width = 800;
  const height = 160;

  const items = [
    { label: "Commits", value: formatNumber(stats.totalCommits), icon: "M12.166 4.94a.5.5 0 0 1 .668 0l5 4.5a.5.5 0 0 1-.668.744L12.5 5.97v12.53a.5.5 0 0 1-1 0V5.97l-4.666 4.214a.5.5 0 0 1-.668-.744l5-4.5z" },
    { label: "PRs", value: formatNumber(stats.totalPRs), icon: "" },
    { label: "Reviews", value: formatNumber(stats.totalReviews), icon: "" },
    { label: "Issues", value: formatNumber(stats.totalIssues), icon: "" },
    { label: "Stars", value: formatNumber(stats.totalStars), icon: "" },
    { label: "Repos", value: formatNumber(stats.totalRepos), icon: "" },
    // DEFERRED: "total lines" and "contribution rank percentiles" from spec.
    // Total lines requires cloning/scanning repos (expensive). Rank percentiles
    // require a reference dataset. Both deferred to post-launch iteration.
  ];

  const colWidth = (width - 40) / items.length;
  const statsContent = items.map((item, i) => {
    const x = 20 + i * colWidth + colWidth / 2;
    return `<text x="${x}" y="75" fill="${COLORS.light.fg}" font-size="22" font-weight="700" text-anchor="middle">${item.value}</text>
    <text x="${x}" y="100" fill="${COLORS.light.fgMuted}" font-size="12" text-anchor="middle">${item.label}</text>`;
  }).join("\n    ");

  const content = `
    <text x="20" y="30" fill="${COLORS.light.fg}" font-size="16" font-weight="600">GitHub Activity</text>
    <line x1="20" y1="42" x2="${width - 20}" y2="42" stroke="${COLORS.light.border}" stroke-width="1" />
    ${statsContent}`;

  return wrapSvg(content, width, height);
}
```

- [ ] **Step 2: Commit**

- [ ] **Step 2: Verify module compiles**

Run: `npx tsx -e "import { generateActivitySummary } from './readme/svg/activity-summary.js'; const s = {totalCommits:1,totalPRs:1,totalIssues:1,totalReviews:1,totalDiscussions:1,totalStars:1,totalRepos:1,contributionStreak:1}; console.log(generateActivitySummary(s).substring(0,50))"`

Expected: Output starts with `<svg`

- [ ] **Step 3: Commit**

```bash
git add readme/svg/activity-summary.ts
git commit -m "feat: add activity summary stats card SVG generator"
```

---

### Task 10: Contribution Trends SVG

**Files:**
- Create: `readme/svg/contribution-trends.ts`

- [ ] **Step 1: Implement bar chart SVG generator**

```typescript
import type { ContributionWeek } from "../types.js";
import { wrapSvg, COLORS } from "./shared.js";

export function generateContributionTrends(contributions: ContributionWeek[]): string {
  // Take last 52 weeks
  const weeks = contributions.slice(-52);
  const width = 800;
  const height = 180;
  const chartX = 20;
  const chartY = 40;
  const chartW = width - 40;
  const chartH = height - 60;

  const maxCount = Math.max(...weeks.map(w => w.count), 1);
  const barWidth = chartW / weeks.length - 1;

  const bars = weeks.map((week, i) => {
    const barHeight = (week.count / maxCount) * chartH;
    const x = chartX + i * (barWidth + 1);
    const y = chartY + chartH - barHeight;
    return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${COLORS.light.accent}" rx="1" opacity="0.8" />`;
  }).join("\n    ");

  const content = `
    <text x="20" y="24" fill="${COLORS.light.fg}" font-size="16" font-weight="600">Contribution Trends (last 52 weeks)</text>
    <line x1="${chartX}" y1="${chartY + chartH}" x2="${chartX + chartW}" y2="${chartY + chartH}" stroke="${COLORS.light.border}" stroke-width="1" />
    ${bars}`;

  return wrapSvg(content, width, height);
}
```

- [ ] **Step 2: Commit**

```bash
git add readme/svg/contribution-trends.ts
git commit -m "feat: add contribution trends bar chart SVG generator"
```

---

### Task 11: Top Repos + Pinned Repos SVGs

**Files:**
- Create: `readme/svg/top-repos.ts`
- Create: `readme/svg/pinned-repos.ts`

- [ ] **Step 1: Create repo card SVG generator (shared by both)**

```typescript
// readme/svg/top-repos.ts
import type { RepoData } from "../types.js";
import { wrapSvg, COLORS, LANG_COLORS, formatNumber } from "./shared.js";

export function generateRepoCards(repos: RepoData[], title: string): string {
  const width = 800;
  const cardH = 80;
  const cols = 2;
  const rows = Math.ceil(repos.length / cols);
  const height = 40 + rows * (cardH + 10);
  const cardW = (width - 50) / cols;

  const cards = repos.map((repo, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 20 + col * (cardW + 10);
    const y = 40 + row * (cardH + 10);
    const langColor = LANG_COLORS[repo.language ?? ""] ?? repo.languageColor ?? "#888";
    const desc = repo.description
      ? repo.description.length > 50 ? repo.description.slice(0, 47) + "..." : repo.description
      : "";

    return `<rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="6"
      fill="${COLORS.light.cardBg}" stroke="${COLORS.light.border}" stroke-width="1" />
    <text x="${x + 12}" y="${y + 22}" fill="${COLORS.light.accent}" font-size="14" font-weight="600">${repo.name}</text>
    <text x="${x + 12}" y="${y + 42}" fill="${COLORS.light.fgMuted}" font-size="11">${desc}</text>
    <circle cx="${x + 12}" cy="${y + 62}" r="5" fill="${langColor}" />
    <text x="${x + 22}" y="${y + 66}" fill="${COLORS.light.fgMuted}" font-size="11">${repo.language ?? "Unknown"}</text>
    <text x="${x + cardW - 12}" y="${y + 66}" fill="${COLORS.light.fgMuted}" font-size="11" text-anchor="end">\u2605 ${formatNumber(repo.stars)}</text>`;
  }).join("\n    ");

  const content = `
    <text x="20" y="24" fill="${COLORS.light.fg}" font-size="16" font-weight="600">${title}</text>
    ${cards}`;

  return wrapSvg(content, width, height);
}

export function generateTopRepos(repos: RepoData[]): string {
  return generateRepoCards(repos, "Most Active Repositories");
}
```

- [ ] **Step 2: Create pinned repos SVG (reuses card pattern)**

```typescript
// readme/svg/pinned-repos.ts
// Reuses the shared generateRepoCards function from top-repos.ts
import type { RepoData } from "../types.js";
import { generateRepoCards } from "./top-repos.js";

export function generatePinnedRepos(repos: RepoData[]): string {
  return generateRepoCards(repos, "Pinned Repositories");
}
```

- [ ] **Step 3: Commit**

```bash
git add readme/svg/top-repos.ts readme/svg/pinned-repos.ts
git commit -m "feat: add top repos and pinned repos SVG generators"
```

---

## Phase 4: README Assembly & Generation

### Task 12: README Assembly — Tests

**Files:**
- Create: `readme/templates/readme.md`
- Create: `readme/assemble.test.ts`

- [ ] **Step 1: Create README markdown template**

```markdown
# Hey, I'm Adam 👋

Software engineer building things with Rust, TypeScript, and Go.

## 📊 GitHub Activity

![Activity Summary](readme/assets/activity-summary.svg)
![Languages](readme/assets/language-breakdown.svg)
![Contribution Trends](readme/assets/contribution-trends.svg)

## 🔥 Active Projects

![Top Repos](readme/assets/top-repos.svg)

%%RELEASES%%

%%BLOG_POSTS%%

## 📌 Pinned

![Pinned Repos](readme/assets/pinned-repos.svg)
```

- [ ] **Step 2: Write failing tests for assembly**

```typescript
import { describe, it, expect } from "vitest";
import { renderReleases, renderBlogPosts, assembleReadme } from "./assemble.js";
import type { ReleaseData, BlogPost } from "./types.js";

describe("renderReleases", () => {
  it("renders a markdown table", () => {
    const releases: ReleaseData[] = [
      { repo: "tool", repoUrl: "https://github.com/test/tool", tagName: "v1.0.0", publishedAt: "2026-01-15T00:00:00Z" },
    ];
    const result = renderReleases(releases);
    expect(result).toContain("## 🏷️ Recent Releases");
    expect(result).toContain("| [tool]");
    expect(result).toContain("v1.0.0");
  });

  it("returns empty string for no releases", () => {
    expect(renderReleases([])).toBe("");
  });
});

describe("renderBlogPosts", () => {
  it("renders a markdown list", () => {
    const posts: BlogPost[] = [
      { title: "First Post", url: "https://blog.test.dev/first", date: "2026-01-01" },
    ];
    const result = renderBlogPosts(posts);
    expect(result).toContain("## 📝 Recent Blog Posts");
    expect(result).toContain("[First Post]");
  });

  it("returns empty string for no posts", () => {
    expect(renderBlogPosts([])).toBe("");
  });
});

describe("assembleReadme", () => {
  it("replaces tokens in template", () => {
    const template = "Before\n%%RELEASES%%\n%%BLOG_POSTS%%\nAfter";
    const result = assembleReadme(template, "releases-md", "posts-md");
    expect(result).toContain("Before");
    expect(result).toContain("releases-md");
    expect(result).toContain("posts-md");
    expect(result).toContain("After");
    expect(result).not.toContain("%%RELEASES%%");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL

---

### Task 13: README Assembly — Implementation

**Files:**
- Create: `readme/assemble.ts`

- [ ] **Step 1: Implement assembly functions**

```typescript
import type { ReleaseData, BlogPost } from "./types.js";

export function renderReleases(releases: ReleaseData[]): string {
  if (releases.length === 0) return "";

  const rows = releases.slice(0, 5).map(r => {
    const date = new Date(r.publishedAt).toISOString().split("T")[0];
    return `| [${r.repo}](${r.repoUrl}) | \`${r.tagName}\` | ${date} |`;
  }).join("\n");

  return `## 🏷️ Recent Releases

| Repo | Version | Date |
|------|---------|------|
${rows}`;
}

export function renderBlogPosts(posts: BlogPost[]): string {
  if (posts.length === 0) return "";

  const items = posts.slice(0, 5).map(p =>
    `- [${p.title}](${p.url}) — *${p.date}*`
  ).join("\n");

  return `## 📝 Recent Blog Posts

${items}`;
}

export function assembleReadme(
  template: string,
  releasesSection: string,
  blogPostsSection: string,
): string {
  return template
    .replace("%%RELEASES%%", releasesSection)
    .replace("%%BLOG_POSTS%%", blogPostsSection);
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test`

Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add readme/assemble.ts readme/assemble.test.ts readme/templates/readme.md
git commit -m "feat: add README assembly logic with release and blog post rendering"
```

---

### Task 14: Main Generation Script

**Files:**
- Create: `readme/generate.ts`

- [ ] **Step 1: Implement the orchestrator**

```typescript
// readme/generate.ts
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fetchGitHubData } from "./fetch-github.js";
import { fetchBlogPosts } from "./fetch-blog.js";
import { generateLanguageBreakdown } from "./svg/language-breakdown.js";
import { generateContributionTrends } from "./svg/contribution-trends.js";
import { generateActivitySummary } from "./svg/activity-summary.js";
import { generateTopRepos } from "./svg/top-repos.js";
import { generatePinnedRepos } from "./svg/pinned-repos.js";
import { renderReleases, renderBlogPosts, assembleReadme } from "./assemble.js";

async function main() {
  const token = process.env.GH_PAT ?? process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("Error: GH_PAT or GITHUB_TOKEN environment variable required");
    process.exit(1);
  }

  const repoRoot = resolve(import.meta.dirname, "..");
  const assetsDir = resolve(repoRoot, "readme/assets");
  mkdirSync(assetsDir, { recursive: true });

  console.log("Fetching data...");
  const [github, blogPosts] = await Promise.all([
    fetchGitHubData(token),
    fetchBlogPosts(),
  ]);

  console.log("Generating SVGs...");
  const svgs: [string, string][] = [
    ["activity-summary.svg", generateActivitySummary(github.stats)],
    ["language-breakdown.svg", generateLanguageBreakdown(github.languages)],
    ["contribution-trends.svg", generateContributionTrends(github.contributions)],
    ["top-repos.svg", generateTopRepos(github.topRepos)],
  ];

  if (github.pinnedRepos.length > 0) {
    svgs.push(["pinned-repos.svg", generatePinnedRepos(github.pinnedRepos)]);
  }

  for (const [filename, svg] of svgs) {
    const path = resolve(assetsDir, filename);
    writeFileSync(path, svg);
    console.log(`  Wrote ${filename}`);
  }

  console.log("Assembling README...");
  const templatePath = resolve(repoRoot, "readme/templates/readme.md");
  const template = readFileSync(templatePath, "utf-8");

  const releasesSection = renderReleases(github.releases);
  const blogSection = renderBlogPosts(blogPosts);
  const readme = assembleReadme(template, releasesSection, blogSection);

  const readmePath = resolve(repoRoot, "README.md");
  writeFileSync(readmePath, readme);
  console.log("Done! README.md updated.");
}

main().catch(err => {
  console.error("Generation failed:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Commit**

```bash
git add readme/generate.ts
git commit -m "feat: add main README generation orchestrator"
```

---

## Phase 5: CI & Build Script

### Task 15: Build Script + CI Workflow

**Files:**
- Create: `scripts/build-readme.sh`
- Create: `.github/workflows/update-readme.yml`

- [ ] **Step 1: Create build-readme.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Installs deps and runs the README generation script.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$REPO_ROOT"

echo "Installing dependencies..."
npm ci --ignore-scripts 2>/dev/null || npm install

echo "Generating README..."
npx tsx readme/generate.ts

echo "README generation complete."
```

- [ ] **Step 2: Make executable**

Run: `chmod +x scripts/build-readme.sh`

- [ ] **Step 3: Create update-readme.yml workflow**

```yaml
name: Update README

on:
  schedule:
    - cron: "0 */6 * * *"
  workflow_dispatch:

concurrency:
  group: commit-to-main
  cancel-in-progress: false

permissions:
  contents: write

jobs:
  update-readme:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Generate README
        env:
          GH_PAT: ${{ secrets.GH_PAT }}
        run: scripts/build-readme.sh

      - name: Check for changes
        id: changes
        run: |
          if git diff --quiet readme/assets/ README.md; then
            echo "changed=false" >> $GITHUB_OUTPUT
          else
            echo "changed=true" >> $GITHUB_OUTPUT
          fi

      - name: Commit and push
        if: steps.changes.outputs.changed == 'true'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add readme/assets/ README.md
          git commit -m "ci: update README with latest GitHub activity"
          git push
```

- [ ] **Step 4: Commit**

```bash
git add scripts/build-readme.sh .github/workflows/update-readme.yml
git commit -m "ci: add README update workflow — cron every 6h + manual dispatch"
```

---

### Task 16: Verify All Tests Pass

**Files:** None — verification only

- [ ] **Step 1: Run full test suite**

Run: `npm test`

Expected: All tests PASS across data/, scripts/, and readme/ suites

- [ ] **Step 2: Verify generate.ts loads without errors (dry run check)**

Run: `npx tsx -e "import './readme/generate.ts'" 2>&1 || true`

This will fail at runtime (no token), but should compile and import without TypeScript errors.
