import { ogContentType, ogSize, renderOgCard } from "@/components/site/og-card";
import { siteUrl } from "@/lib/site";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "About Mizanur Hasan — full-stack developer";

export default function Image() {
  return renderOgCard({
    eyebrow: "About",
    title: "About Mizanur Hasan",
    description: "SaaS and marketplace product work, professional experience, and interactive React component studies.",
    footer: `${new URL(siteUrl).host} · Full-stack developer · Frontend focused`,
  });
}
