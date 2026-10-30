import { ogContentType, ogSize, renderOgCard } from "@/components/site/og-card";
import { caseStudies, getCaseStudy } from "@/lib/case-studies";
import { siteUrl } from "@/lib/site";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Mizanur Hasan — product case study";

export function generateStaticParams() {
  return caseStudies.map(({ slug }) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = getCaseStudy(slug);

  return renderOgCard({
    eyebrow: study ? `Case study ${study.number}` : "Case study",
    title: study?.title ?? "Case study",
    description: study?.summary ?? "A product case study by Mizanur Hasan.",
    footer: `${new URL(siteUrl).host} · ${study?.role ?? "Mizanur Hasan"}`,
  });
}
