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
