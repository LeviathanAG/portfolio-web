// Author attribution / profile card.
// Layout (avatar → name → tagline → social icons) adapted from Fuwari's Profile
// widget — source: https://github.com/saicaca/fuwari (by saicaca). Restyled to
// match this site. Design inspiration: epsilon (https://epsilons1na.github.io).
// Everything is driven by `site.author` in lib/site.ts (avatar, name, tagline,
// link target, width, and socials).
import Link from "next/link";
import { site } from "@/lib/site";
import { SocialIcons } from "@/components/social-icons";

export function AuthorCard() {
  const { avatar, name, tagline, href, width, socials } = site.author;

  return (
    <div
      style={{ width }}
      className="flex flex-col items-center gap-4 rounded-lg border border-border bg-muted/40 p-4 text-center"
    >
      <Link href={href} className="group flex w-full flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatar}
          alt={`${name} avatar`}
          className="aspect-square w-full border border-border object-cover"
        />
        <span className="flex flex-col leading-tight">
          <span className="text-base font-semibold transition-colors group-hover:text-primary">
            {name}
          </span>
          <span className="hud-label mt-1 text-muted-foreground">{tagline}</span>
        </span>
      </Link>
      <SocialIcons className="justify-center" socials={socials} />
    </div>
  );
}
