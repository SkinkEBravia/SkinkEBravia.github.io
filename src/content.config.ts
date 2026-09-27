import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const research = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/research" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      authors: z.array(z.string()),
      venue: z.string(),
      year: z.number(),
      abstract: z.string(),
      cover: image().optional(),
      teaserVideo: z.string().optional(),
      links: z
        .object({
          paper: z.string().optional(),
          arxiv: z.string().optional(),
          code: z.string().optional(),
          video: z.string().optional(),
          project: z.string().optional(),
        })
        .default({}),
      bibtex: z.string().optional(),
      selected: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

const writing = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/writing" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      tags: z.array(z.string()).default([]),
      cover: image().optional(),
      draft: z.boolean().default(false),
    }),
});

const notes = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    topic: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { research, writing, notes };
