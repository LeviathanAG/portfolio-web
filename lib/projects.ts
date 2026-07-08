export interface Project {
  title: string;
  year: string;
  description: string;
  tags: string[];
  href?: string;
  repo?: string;
}


export const projects: Project[] = [
  {
    title: "envv",
    year: "2025",
    description:
      "git for env file. A tool to instantly inject all the env files into your workspace for streamling onboarding to a new project.",
    tags: ["GO", "MongoDB", "CLI"],
    repo: "https://github.com/LeviathanAG/envv",
  },
  
];
