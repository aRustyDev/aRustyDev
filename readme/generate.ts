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
