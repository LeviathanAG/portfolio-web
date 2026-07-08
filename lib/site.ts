export const site = {
  name: "Satwik",
  title: "Satwik — Security & Software",
  description:
    "Portfolio and blog. CTF writeups, security research, and things I build.",
  url: "https://example.com",
  location: "BENGALURU",
  hudQuote: ["/bin/sh"],
  socials: [
    { label: "GitHub", href: "https://github.com/leviathanag", icon: "github" },
    { label: "X", href: "https://x.com/Dantxlian_", icon: "x" },
    {
      label: "LinkedIn",
      href: "https://in.linkedin.com/in/satwik-hegde-b0729b32a",
      icon: "linkedin",
    },
    { label: "Email", href: "mailto:hegdsatwik@gmail.com", icon: "mail" },
  ],
} as const;

export type SocialIconName = (typeof site.socials)[number]["icon"];
