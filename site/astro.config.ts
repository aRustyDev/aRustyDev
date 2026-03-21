import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { SITE } from "./src/config";

export default defineConfig({
  site: SITE.website,
  integrations: [mdx(), sitemap()],
  vite: {
    // @ts-ignore — Tailwind v4 Vite plugin type mismatch (fixed in Astro 6 / Vite 7)
    plugins: [tailwindcss()],
  },
});
