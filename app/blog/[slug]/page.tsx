import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPosts, getPost, formatDate } from "@/lib/blog";
import { renderMarkdownWithHeadings } from "@/lib/markdown";
import { Badge } from "@/components/ui/badge";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return { title: post.title, description: post.description };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const { html, headings } = await renderMarkdownWithHeadings(
    post.content,
    post.slug
  );

  return (
    <div className="relative">
      <aside className="fixed left-6 top-32 z-30 hidden w-48 xl:block 2xl:left-10">
        <nav aria-label="Blog index" className="hud-label">
          <p className="mb-4 text-primary">INDEX</p>
          <ol className="space-y-3 border-l border-border pl-4">
            <li>
              <a
                href="#top"
                className="block text-foreground/70 transition-colors hover:text-primary"
              >
                START
              </a>
            </li>
            {headings.map((heading) => (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  className="block text-foreground/70 transition-colors hover:text-primary"
                  style={{
                    paddingLeft: `${Math.max(heading.depth - 2, 0) * 0.75}rem`,
                  }}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </aside>

      <article id="top" className="mx-auto max-w-3xl px-6 pb-32 pt-32">
        <Link
          href="/blog"
          className="hud-label text-muted-foreground transition-colors hover:text-primary"
        >
          ← BLOG
        </Link>

        <header className="mb-12 mt-8">
          <p className="hud-label mb-3 text-primary">{formatDate(post.date)}</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            {post.title}
          </h1>
          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="hud-label border-border text-muted-foreground"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </header>

        {headings.length > 0 && (
          <details className="mb-10 border-y border-border py-4 xl:hidden">
            <summary className="hud-label cursor-pointer text-primary">
              INDEX
            </summary>
            <ol className="hud-label mt-4 space-y-3">
              <li>
                <a
                  href="#top"
                  className="block text-foreground/70 transition-colors hover:text-primary"
                >
                  START
                </a>
              </li>
              {headings.map((heading) => (
                <li key={heading.id}>
                  <a
                    href={`#${heading.id}`}
                    className="block text-foreground/70 transition-colors hover:text-primary"
                    style={{
                      paddingLeft: `${
                        Math.max(heading.depth - 2, 0) * 0.75
                      }rem`,
                    }}
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ol>
          </details>
        )}

        <div
          className="prose-writeup"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </div>
  );
}
