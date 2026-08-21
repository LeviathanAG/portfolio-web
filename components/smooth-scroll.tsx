"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { usePathname } from "next/navigation";

export function SmoothScroll() {
  const pathname = usePathname();
  const isBlog = pathname.startsWith("/blog");

  useEffect(() => {
    // Native scrolling is noticeably smoother for long, code-heavy posts.
    if (isBlog) return;

    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    let raf = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [isBlog]);

  return null;
}
