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
