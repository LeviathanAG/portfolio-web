import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts, formatDate } from "@/lib/blog";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Blog",
  description: "Writeups and notes.",
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-3xl px-5 pb-32 pt-28 md:px-6 md:pt-32">
      <p className="hud-label mb-2 text-primary">WRITEUPS / NOTES</p>
      <h1 className="mb-10 text-3xl font-bold tracking-tight md:mb-12 md:text-4xl">Blog</h1>

      {posts.length === 0 && (
        <p className="text-muted-foreground">
          Nothing here yet. Drop a folder with an{" "}
          <code className="font-mono text-sm">index.md</code> into{" "}
          <code className="font-mono text-sm">content/blog/</code>.
        </p>
      )}

      <ul className="divide-y divide-border">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex flex-col gap-2 py-7"
            >
              <span className="hud-label text-muted-foreground">
                {formatDate(post.date)}
              </span>
              <span className="text-xl font-semibold transition-colors group-hover:text-primary">
                {post.title}
              </span>
              {post.description && (
                <span className="text-sm text-muted-foreground">
                  {post.description}
                </span>
              )}
              {post.tags.length > 0 && (
                <span className="mt-1 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="hud-label border-border text-muted-foreground"
                    >
                      {tag}
                    </Badge>
                  ))}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
