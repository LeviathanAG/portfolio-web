import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts, formatDate } from "@/lib/blog";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Blog",
  description: "Writeups and notes.",
};

export default async function BlogIndex({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const posts = getAllPosts();
  const { type } = await searchParams;
  const activeType = type === "writeup" || type === "note" ? type : "all";
  const filteredPosts =
    activeType === "all" ? posts : posts.filter((post) => post.type === activeType);

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 px-5 pb-32 pt-28 md:px-6 md:pt-32 xl:grid-cols-[12rem_minmax(0,1fr)] xl:gap-16">
      <aside className="xl:pt-2">
        <nav aria-label="Filter posts" className="hud-label">
          <p className="mb-4 text-primary">FILTER</p>
          <div className="flex gap-4 xl:flex-col xl:gap-3">
            {[
              ["writeup", "WRITEUPS"],
              ["note", "NOTES"],
            ].map(([value, label]) => (
              <Link
                key={value}
                href={`/blog?type=${value}`}
                aria-current={activeType === value ? "page" : undefined}
                className={`transition-colors hover:text-primary ${
                  activeType === value ? "text-primary" : "text-foreground/60"
                }`}
              >
                {activeType === value ? "> " : "  "}
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      <main>
        <p className="hud-label mb-2 text-primary">WRITEUPS / NOTES</p>
        <h1 className="mb-10 text-3xl font-bold tracking-tight md:mb-12 md:text-4xl">Blog</h1>

        {filteredPosts.length === 0 && (
          <p className="text-muted-foreground">
            No posts in this category yet.
          </p>
        )}

        <ul className="divide-y divide-border">
          {filteredPosts.map((post) => (
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
      </main>
    </div>
  );
}
