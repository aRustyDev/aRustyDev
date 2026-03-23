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
