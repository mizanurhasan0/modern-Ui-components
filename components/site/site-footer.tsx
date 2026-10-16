import Link from "next/link";
import { contactHref, portfolioProfile } from "@/lib/portfolio-profile";
import { LabMark } from "./icons";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[#e4e7ed]">
      <div className="site-container site-footer-container flex flex-col items-start justify-between gap-6 py-8 text-[12px] text-[#4b5563] lg:flex-row lg:items-center">
        <Link href="/" className="flex items-center gap-2.5 text-[#35435b]">
          <LabMark className="size-4 text-[#4b5563]" />
          <span>
            Component Lab <span className="mx-2 text-[#a2aab8]">/</span> Built by Mizanur Hasan.
          </span>
        </Link>
        <nav aria-label="Contact and social links" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a href={contactHref} className="inline-flex min-h-11 items-center font-medium text-[#3152b4] underline underline-offset-4 hover:text-[#1e3783]">
            {portfolioProfile.email}
          </a>
          <a href={portfolioProfile.github} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-[#35435b] underline underline-offset-4 hover:text-[#1e3783]">GitHub</a>
          <a href={portfolioProfile.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-[#35435b] underline underline-offset-4 hover:text-[#1e3783]">LinkedIn</a>
          <a href={portfolioProfile.portfolio} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-[#35435b] underline underline-offset-4 hover:text-[#1e3783]">Full portfolio</a>
          <a href={portfolioProfile.resume} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-[#35435b] underline underline-offset-4 hover:text-[#1e3783]">Résumé</a>
        </nav>
      </div>
    </footer>
  );
}
