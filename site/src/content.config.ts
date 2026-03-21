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
