import Link from "next/link";

const links = [
  { href: "/projects", label: "PROJECTS" },
  { href: "/blog", label: "BLOG" },
  { href: "/about", label: "ABOUT" },
];

export default function Home() {
  return (
    <div className="relative flex h-dvh items-end justify-center pb-16 md:pb-10">
      <h1 className="sr-only">Satwik — portfolio and blog</h1>
      <nav aria-label="Primary" className="hud-label flex items-center gap-3">
        {links.map((link, index) => (
          <span key={link.href} className="flex items-center gap-3">
            {index > 0 && (
              <span aria-hidden className="text-foreground/35">
                ·
              </span>
            )}
            <Link
              href={link.href}
              className="text-foreground/50 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          </span>
        ))}
      </nav>
    </div>
  );
}
