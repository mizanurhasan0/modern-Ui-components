import type { MetadataRoute } from "next";
import { caseStudies } from "@/lib/case-studies";
import { components } from "@/lib/component-registry";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), priority: 1 },
    { url: absoluteUrl("/about"), priority: 0.8 },
    ...caseStudies.map(({ slug }) => ({ url: absoluteUrl(`/work/${slug}`), priority: 0.8 })),
    ...components.map(({ slug }) => ({ url: absoluteUrl(`/components/${slug}`), priority: 0.7 })),
  ];
}
