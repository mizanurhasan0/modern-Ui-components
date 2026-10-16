import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

const geistSans = localFont({
  src: "./fonts/geist-latin.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Mizanur Hasan — Component Lab",
    template: "%s — Component Lab",
  },
  description:
    "Interactive interface work by Mizanur Hasan. Explore React and Next.js component studies, test the live interactions, and inspect reusable source code.",
  authors: [{ name: "Mizanur Hasan" }],
  creator: "Mizanur Hasan",
  openGraph: {
    title: "Mizanur Hasan — Component Lab",
    description: "Interactive interface work, live component studies, and reusable source code.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        <a
          href="#main-content"
          className="sr-only fixed top-3 left-3 z-50 rounded-lg bg-[#4866e9] px-4 py-3 text-sm text-white focus:not-sr-only"
        >
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
