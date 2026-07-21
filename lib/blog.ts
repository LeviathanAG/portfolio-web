import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  type: "writeup" | "note";
}

export interface Post extends PostMeta {
  content: string;
}

function readPost(slug: string): Post | null {
  const file = path.join(BLOG_DIR, slug, "index.md");
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return {
    slug,
    title: data.title ?? slug,
    date: data.date ? new Date(data.date).toISOString() : "",
    description: data.description ?? "",
    tags: data.tags ?? [],
    type: data.type === "note" ? "note" : "writeup",
    content,
  };
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => readPost(e.name))
    .filter((p): p is Post => p !== null && !p.slug.startsWith("_"))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): Post | null {
  // slugs come from the URL so we never let them escape the blog dir
  if (!/^[a-z0-9-]+$/i.test(slug)) return null;
  return readPost(slug);
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso)
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
    .toUpperCase();
}
