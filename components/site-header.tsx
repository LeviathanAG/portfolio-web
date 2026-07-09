"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

const links = [
  { href: "/projects", label: "PROJECTS" },
  { href: "/blog", label: "BLOG" },
  { href: "/about", label: "ABOUT" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const contact = site.socials.find((s) => s.icon === "mail");

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="flex items-center justify-between gap-3 px-4 py-4 md:px-10 md:py-5">
        <div className="flex items-center gap-4 md:gap-8">
          <Link
            href="/"
            aria-label="Home"
            className="hud-label text-foreground transition-colors hover:text-primary"
          >
            {site.name}
          </Link>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "hud-label transition-colors hover:text-primary",
                pathname.startsWith(l.href)
                  ? "text-primary"
                  : "text-foreground/70"
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
        {contact && (
          <a
            href={contact.href}
            className="hud-label text-foreground/70 transition-colors hover:text-primary"
          >
            CONTACT
          </a>
        )}
      </nav>
    </header>
  );
}
