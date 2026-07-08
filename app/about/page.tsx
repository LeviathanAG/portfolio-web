import type { Metadata } from "next";
import { site } from "@/lib/site";
import { SocialIcons } from "@/components/social-icons";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "About",
  description: `About ${site.name}.`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 pb-32 pt-32">
      <p className="hud-label mb-2 text-primary">WHO</p>
      <h1 className="mb-10 text-4xl font-bold tracking-tight">About me</h1>

      <div className="space-y-5 leading-relaxed text-foreground/85">
        <p>
          Hey, I&apos;m {site.name}.Im an avid CTF player and systems security enthusiast. I love to learn and share my knowledge with the community. 
          I delve into binary and kernel exploitation during the weekends and work my normal SDE and webdev intern during the weekdays.
        </p>
        <p>
          This is my portfolio and blog where I share my recent findings and things im building.
        </p>
      </div>

      <Separator className="my-10 bg-border" />

      <p className="hud-label mb-4 text-muted-foreground">FIND ME</p>
      <SocialIcons />
    </div>
  );
}
