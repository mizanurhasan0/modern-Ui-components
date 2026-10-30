import type { Metadata } from "next";
import { portfolioProfile } from "./portfolio-profile";

/** Canonical origin of the deployed site; every absolute URL (canonical, sitemap, social cards) derives from it. */
export const siteUrl = "https://mizanurhasan.top";
export const siteName = "Component Lab";
export const siteTitle = "Mizanur Hasan — Full-Stack Developer & React Component Lab";
export const siteDescription =
  "Mizanur Hasan is a full-stack developer focused on frontend. Explore live React and Next.js component studies, SaaS case studies, and copy-ready source code.";
export const siteKeywords = [
  "Mizanur Hasan",
  "full-stack developer",
  "frontend developer",
  "React components",
  "Next.js components",
  "TypeScript",
  "Tailwind CSS",
  "UI component library",
  "developer portfolio",
];
export const ownerName = portfolioProfile.name;

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

type PageSeo = {
  /** Page-specific title; the root layout's template appends the site name. Omit on the home page. */
  title?: string;
  description: string;
  /** Path of the page, used for its canonical URL and `og:url`. */
  path: string;
  type?: "website" | "article";
  keywords?: string[];
};

/**
 * Metadata that every page must set for itself. The canonical URL, Open Graph, and Twitter
 * fields replace the layout's values wholesale, so they can't be inherited without
 * carrying the wrong URL.
 */
export function pageMetadata({ title, description, path, type = "website", keywords }: PageSeo): Metadata {
  const socialTitle = title ? `${title} — ${siteName}` : siteTitle;
  return {
    ...(title ? { title } : {}),
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: path },
    openGraph: { type, url: path, siteName, locale: "en_US", title: socialTitle, description },
    twitter: { card: "summary_large_image", title: socialTitle, description },
  };
}
