import { getCollection, type CollectionEntry } from "astro:content";

type Key = "research" | "writing" | "notes";

/** Published entries; drafts show up in `npm run dev` only. */
export async function entries<K extends Key>(key: K): Promise<CollectionEntry<K>[]> {
  const all = await getCollection(key, ({ data }) => import.meta.env.DEV || !data.draft);
  return all.sort((a, b) => sortKey(b) - sortKey(a)) as CollectionEntry<K>[];
}

function sortKey(e: CollectionEntry<Key>): number {
  const d = e.data as { date?: Date; year?: number };
  return d.date ? d.date.getTime() : new Date(d.year ?? 0, 0).getTime();
}

export const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "2-digit" }).toUpperCase();

export const pad = (n: number) => String(n).padStart(2, "0");

export function readingTime(body = "") {
  return Math.max(1, Math.round(body.split(/\s+/).length / 230));
}

/** Deterministic hue pair from a slug, for generative covers. */
export function hues(slug: string) {
  let h = 2166136261;
  for (const c of slug) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const a = (h >>> 0) % 360;
  return [a, (a + 140 + ((h >>> 9) % 80)) % 360];
}

import type { Row } from "./components/EntryList.astro";

export const researchRows = (es: CollectionEntry<"research">[]): Row[] =>
  es.map((e) => ({
    href: `/research/${e.id}/`, slug: e.id, title: e.data.title,
    meta: e.data.venue, aside: String(e.data.year), kind: "Paper", cover: e.data.cover?.src,
  }));

export const writingRows = (es: CollectionEntry<"writing">[]): Row[] =>
  es.map((e) => ({
    href: `/writing/${e.id}/`, slug: e.id, title: e.data.title,
    meta: e.data.tags.slice(0, 2).join(" · ") || "Essay", aside: fmtDate(e.data.date), kind: "Writing", cover: e.data.cover?.src,
  }));

export const noteRows = (es: CollectionEntry<"notes">[]): Row[] =>
  es.map((e) => ({
    href: `/notes/${e.id}/`, slug: e.id, title: e.data.title,
    meta: e.data.topic, aside: fmtDate(e.data.date), kind: "Note",
  }));
