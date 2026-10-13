export type Tool = {
  name: string;
  /** Simple Icons slug (https://simpleicons.org); omit to show a monogram. */
  icon?: string;
  /** Monogram shown when there is no icon or it fails to load. */
  mark?: string;
  color: string;
  about: string;
};

export type CategoryIcon = "monitor" | "server" | "database" | "cloud" | "tools";

export type Category = {
  id: string;
  label: string;
  icon: CategoryIcon;
  color: string;
  /** Shown during the intro tour. */
  tagline: string;
  tools: Tool[];
};

/** Edit the stack here: categories render top to bottom, tools left to right. */
export const TECH_STACK: Category[] = [
  {
    id: "frontend",
    label: "Frontend",
    icon: "monitor",
    color: "#2563eb",
    tagline: "Frontend is my passion: the place I spend my best hours.",
    tools: [
      { name: "React", icon: "react", color: "#149eca", about: "Component-based UI library" },
      { name: "Next.js", icon: "nextdotjs", color: "#111111", about: "React framework for routing, SSR, and SEO" },
      { name: "TypeScript", icon: "typescript", color: "#3178c6", about: "Typed JavaScript for safer code" },
      { name: "Tailwind CSS", icon: "tailwindcss", color: "#06b6d4", about: "Utility-first styling" },
      { name: "Shadcn/ui", icon: "shadcnui", color: "#111111", about: "Accessible, copy-paste React components" },
      { name: "Zustand", mark: "Z", color: "#7a4a2b", about: "Lightweight state management" },
    ],
  },
  {
    id: "backend",
    label: "Backend",
    icon: "server",
    color: "#059669",
    tagline: "Solid backends: APIs, real-time features, and clean data layers.",
    tools: [
      { name: "Node.js", icon: "nodedotjs", color: "#5fa04e", about: "JavaScript runtime for servers" },
      { name: "NestJS", icon: "nestjs", color: "#e0234e", about: "Structured, modular Node.js framework" },
      { name: "Express.js", icon: "express", color: "#111111", about: "Minimal Node.js web framework" },
      { name: "REST API", mark: "API", color: "#334155", about: "Resource-based HTTP APIs" },
      { name: "Web Socket", icon: "socketdotio", color: "#111111", about: "Real-time, two-way communication" },
      { name: "Prisma", icon: "prisma", color: "#2d3748", about: "Type-safe database ORM" },
    ],
  },
  {
    id: "database",
    label: "Database",
    icon: "database",
    color: "#7c3aed",
    tagline: "Picking the right database for the data, not the hype.",
    tools: [
      { name: "MongoDB", icon: "mongodb", color: "#47a248", about: "Flexible document database" },
      { name: "PostgreSQL", icon: "postgresql", color: "#336791", about: "Reliable relational SQL database" },
      { name: "MySQL", icon: "mysql", color: "#4479a1", about: "Popular relational database" },
    ],
  },
  {
    id: "devops",
    label: "DevOps",
    icon: "cloud",
    color: "#f97316",
    tagline: "Shipping it: containers, cloud, and automated pipelines.",
    tools: [
      { name: "Docker", icon: "docker", color: "#2496ed", about: "Containers for consistent environments" },
      { name: "AWS", mark: "aws", color: "#ff9900", about: "Cloud infrastructure and services" },
      { name: "Nginx", icon: "nginx", color: "#009639", about: "Web server and reverse proxy" },
      { name: "Git", icon: "git", color: "#f05032", about: "Version control" },
      { name: "GitHub", icon: "github", color: "#181717", about: "Code hosting and collaboration" },
      { name: "CI/CD", icon: "githubactions", color: "#2088ff", about: "Automated build, test, and deploy" },
    ],
  },
  {
    id: "tools",
    label: "Tools & AI",
    icon: "tools",
    color: "#ec4899",
    tagline: "Modern tools and AI that help me build faster and better.",
    tools: [
      { name: "VS Code", mark: "VS", color: "#007acc", about: "Everyday code editor" },
      { name: "Claude", icon: "claude", color: "#d97757", about: "AI assistant for thinking and coding" },
      { name: "Cursor", icon: "cursor", color: "#111111", about: "AI-first code editor" },
      { name: "Codex", icon: "openai", color: "#111111", about: "AI coding agent" },
      { name: "Postman", icon: "postman", color: "#ff6c37", about: "API design and testing" },
      { name: "TanStack Query", icon: "reactquery", color: "#ff4154", about: "Server-state fetching and caching" },
    ],
  },
];
