export type SocialIconName = "github" | "x" | "linkedin" | "mail";

export interface Social {
  label: string;
  href: string;
  icon: SocialIconName;
}

export const site = {
  name: "Satwik",
  title: "Satwik — Security & Software",
  description:
    "Portfolio and blog. CTF writeups, security research, and things I build.",
  url: "https://satwik67.xyz/",
  location: "BENGALURU",
  hudQuote: ["/bin/sh"],

  
  author: {
    name: "Satwik",
    tagline: "Systems security & CTFs",
    avatar: "/106010788.png",
    href: "/about",
    width: 400, 
    socials: [
      { label: "GitHub", href: "https://github.com/leviathanag", icon: "github" },
      { label: "X", href: "https://x.com/Dantxlian_", icon: "x" },
      {
        label: "LinkedIn",
        href: "https://in.linkedin.com/in/satwik-hegde-b0729b32a",
        icon: "linkedin",
      },
      { label: "Email", href: "mailto:hegdsatwik@gmail.com", icon: "mail" },
    ] satisfies Social[],
  },

  socials: [
    { label: "GitHub", href: "https://github.com/leviathanag", icon: "github" },
    { label: "X", href: "https://x.com/Dantxlian_", icon: "x" },
    {
      label: "LinkedIn",
      href: "https://in.linkedin.com/in/satwik-hegde-b0729b32a",
      icon: "linkedin",
    },
    { label: "Email", href: "mailto:hegdsatwik@gmail.com", icon: "mail" },
  ] satisfies Social[],
} as const;
