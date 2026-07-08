"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { site } from "@/lib/site";
import { SocialIcons } from "@/components/social-icons";

function Clock() {
  const [time, setTime] = useState<{ h: string; m: string; ampm: string }>();

  useEffect(() => {
    const update = () => {
      const now = new Date();
      let h = now.getHours();
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      setTime({
        h: String(h),
        m: String(now.getMinutes()).padStart(2, "0"),
        ampm,
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;
  return (
    <span>
      {time.h}
      <span className="blink-colon">:</span>
      {time.m} {time.ampm} {site.location}
    </span>
  );
}

export function Hud() {
  const pathname = usePathname();
  const showClock = !pathname.startsWith("/blog");

  return (
    <>
      {showClock && (
        <div className="hud-label pointer-events-none fixed left-6 top-1/2 z-40 -translate-y-1/2 text-foreground/60 max-md:top-1/4 md:left-10">
          <Clock />
        </div>
      )}
      <div className="hud-label pointer-events-none fixed right-6 top-1/2 z-40 -translate-y-1/2 text-right text-foreground/60 max-md:top-3/4 md:right-10">
        {site.hudQuote.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </div>
      <div className="fixed bottom-5 right-6 z-40 md:right-10">
        <SocialIcons />
      </div>
    </>
  );
}
