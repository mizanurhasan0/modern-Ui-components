import { portfolioProfile } from "./portfolio-profile";
import { absoluteUrl, ownerName, siteDescription, siteName } from "./site";

/** Stable `@id`s let every page's JSON-LD point at the same person and website. */
export const personId = absoluteUrl("/#person");
export const websiteId = absoluteUrl("/#website");

export type JsonLdData = Record<string, unknown>;

export const siteGraph: JsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: absoluteUrl("/"),
      name: `${siteName} — ${ownerName}`,
      description: siteDescription,
      inLanguage: "en",
      publisher: { "@id": personId },
    },
    {
      "@type": "Person",
      "@id": personId,
      name: ownerName,
      url: absoluteUrl("/"),
      jobTitle: "Full-stack developer",
      description: "Full-stack developer with a frontend focus, building SaaS and marketplace products with React, Next.js, and TypeScript.",
      sameAs: [portfolioProfile.github, portfolioProfile.linkedin],
      knowsAbout: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Node.js", "MongoDB", "Frontend engineering", "UI design systems"],
    },
  ],
};

export function breadcrumbList(items: { name: string; path: string }[]): JsonLdData {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function creativeWork(work: { name: string; description: string; path: string; keywords: string[]; genre: string }): JsonLdData {
  return {
    "@type": "CreativeWork",
    "@id": `${absoluteUrl(work.path)}#work`,
    name: work.name,
    description: work.description,
    url: absoluteUrl(work.path),
    keywords: work.keywords.join(", "),
    genre: work.genre,
    inLanguage: "en",
    author: { "@id": personId },
    isPartOf: { "@id": websiteId },
  };
}

/** Wraps nodes in one `@graph` document so a page ships a single script. */
export function graph(...nodes: JsonLdData[]): JsonLdData {
  return { "@context": "https://schema.org", "@graph": nodes };
}
