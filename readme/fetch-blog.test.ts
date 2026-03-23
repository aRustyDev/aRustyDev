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
