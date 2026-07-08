import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { GithubIcon } from "@/components/social-icons";
import { projects } from "@/lib/projects";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Projects",
  description: "Things I've built.",
};

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 pb-32 pt-32">
      <p className="hud-label mb-2 text-primary">SELECTED WORK</p>
      <h1 className="mb-12 text-4xl font-bold tracking-tight">Projects</h1>

      <div className="grid gap-5 sm:grid-cols-2">
        {projects.map((project) => (
          <Card
            key={project.title}
            className="group border-border bg-card/60 backdrop-blur-sm transition-colors hover:border-primary/40"
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-lg">{project.title}</CardTitle>
                <span className="hud-label text-muted-foreground">
                  {project.year}
                </span>
              </div>
              <CardDescription>{project.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-end justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="hud-label border-border text-muted-foreground"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-3">
                {project.repo && (
                  <a
                    href={project.repo}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${project.title} source`}
                    className="text-foreground/60 transition-colors hover:text-primary"
                  >
                    <GithubIcon className="h-4 w-4" />
                  </a>
                )}
                {project.href && (
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${project.title} live site`}
                    className="text-foreground/60 transition-colors hover:text-primary"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
