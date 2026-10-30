import { ogContentType, ogSize, renderOgCard } from "@/components/site/og-card";
import { components, getComponent } from "@/lib/component-registry";
import { siteUrl } from "@/lib/site";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Component Lab — live React component study";

export function generateStaticParams() {
  return components.map(({ slug }) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getComponent(slug);

  return renderOgCard({
    eyebrow: entry ? `Component ${entry.number} · ${entry.category}` : "Component",
    title: entry?.title ?? "Component",
    description: entry?.description ?? "A live React component study.",
    footer: `${new URL(siteUrl).host} · React · Tailwind CSS · TypeScript`,
  });
}
