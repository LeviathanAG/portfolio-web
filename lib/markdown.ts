import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root, Element, RootContent } from "hast";

export interface MarkdownHeading {
  id: string;
  text: string;
  depth: number;
}

function textContent(node: Element | RootContent): string {
  if (node.type === "text") return node.value;
  if ("children" in node) return node.children.map(textContent).join("");
  return "";
}


function rehypeBlogImages(slug: string) {
  return () => (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "img") return;
      const src = node.properties?.src;
      if (typeof src !== "string") return;
      if (/^(https?:)?\/\//.test(src) || src.startsWith("/")) return;
      const clean = src.replace(/^\.\//, "");
      node.properties.src = `/blog-assets/${slug}/${clean}`;
      node.properties.loading = "lazy";
    });
  };
}

function rehypeCollectHeadings(headings: MarkdownHeading[]) {
  return () => (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (!/^h[2-4]$/.test(node.tagName)) return;
      const id = node.properties?.id;
      if (typeof id !== "string") return;

      const text = textContent(node)
        .trim()
        .replace(/[\s:]+$/, "");
      if (!text) return;

      headings.push({
        id,
        text,
        depth: Number(node.tagName.slice(1)),
      });
    });
  };
}

export async function renderMarkdownWithHeadings(
  content: string,
  slug: string
): Promise<{ html: string; headings: MarkdownHeading[] }> {
  const headings: MarkdownHeading[] = [];
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeBlogImages(slug))
    .use(rehypeSlug)
    .use(rehypeCollectHeadings(headings))
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    .use(rehypePrettyCode, {
      theme: "vesper",
      keepBackground: false,
    })
    .use(rehypeStringify)
    .process(content);

  return { html: String(file), headings };
}

export async function renderMarkdown(
  content: string,
  slug: string
): Promise<string> {
  const { html } = await renderMarkdownWithHeadings(content, slug);
  return html;
}
