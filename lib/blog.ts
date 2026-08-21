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
  hidden: boolean;
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
    hidden: data.hidden === true,
    content,
  };
}

function postMetadata(post: Post): PostMeta {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    description: post.description,
    tags: post.tags,
    type: post.type,
    hidden: post.hidden,
  };
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => readPost(e.name))
    .filter(
      (p): p is Post =>
        p !== null && !p.hidden && !p.slug.startsWith("_"),
    )
    .map(postMetadata)
    .sort((a, b) => b.date.localeCompare(a.date));
}

const NON_TOPIC_TAGS = new Set(["pwn", "theory"]);

export function getTopics(posts: PostMeta[]): string[] {
  return Array.from(
    new Set(
      posts.flatMap((post) =>
        post.tags.filter((tag) => !NON_TOPIC_TAGS.has(tag.toLowerCase())),
      ),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

export function hasTopic(post: PostMeta, topic: string): boolean {
  return post.tags.some((tag) => tag.toLowerCase() === topic.toLowerCase());
}

export function getPost(slug: string): Post | null {
  // slugs come from the URL so we never let them escape the blog dir
  if (!/^[a-z0-9-]+$/i.test(slug)) return null;
  const post = readPost(slug);
  return post?.hidden ? null : post;
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
