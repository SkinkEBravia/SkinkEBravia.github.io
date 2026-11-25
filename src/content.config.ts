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
      experimentResults: z.enum(["ocr-fix"]).optional(),
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

const reading = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/reading" }),
  schema: z.object({
    title: z.string(),
    authors: z.array(z.string()),
    shortAuthors: z.string(),
    venue: z.string(),
    year: z.number(),
    arxivId: z.string().optional(),
    submitted: z.string().optional(),
    revised: z.string().optional(),
    license: z.string(),
    licenseUrl: z.string(),
    topic: z.string(),
    abstract: z.string(),
    dateAdded: z.coerce.date(),
    readerPath: z.string().optional(),
    links: z
      .object({
        arxiv: z.string().optional(),
        pdf: z.string().optional(),
        html: z.string().optional(),
        website: z.string().optional(),
      })
      .default({}),
    bibtex: z.string(),
    buildNote: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { research, writing, notes, reading };
