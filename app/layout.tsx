import type { Metadata } from "next";
import { Syne, Space_Mono } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import { Hud } from "@/components/hud";
import { SmoothScroll } from "@/components/smooth-scroll";
import { CatBackground } from "@/components/cat-background";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: site.title,
    template: `%s — ${site.name}`,
  },
  description: site.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${spaceMono.variable}`}>
      <body className="min-h-screen antialiased">
        <SmoothScroll />
        <CatBackground />
        <SiteHeader />
        <Hud />
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}
