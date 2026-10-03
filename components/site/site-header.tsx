import Link from "next/link";
import { LabMark, ArrowUpRight } from "./icons";
import { components } from "@/lib/component-registry";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#e6e9ef] bg-[#fafbfc]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1200px] items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          aria-label="Component Lab home"
          className="flex shrink-0 items-center gap-2 text-[#1c2230] sm:gap-3"
        >
          <LabMark className="size-6 sm:size-7" />
          <span className="text-[16px] font-semibold tracking-[-0.7px] sm:text-[18px]">
            component<span className="font-normal text-[#8a909c]">lab</span>
            <span className="ml-0.5 text-[#5474ee]">.</span>
          </span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-4 text-[11px] sm:gap-8 sm:text-[12px]"
        >
          <Link
            href="/#collection"
            className="text-[#363d4b] transition-colors hover:text-[#4866e9]"
          >
            Components
          </Link>
          <Link
            href="/#about"
            className="hidden text-[#858b97] transition-colors hover:text-[#4866e9] min-[380px]:block"
          >
            About
          </Link>
          <span className="hidden h-4 w-px bg-[#e0e4eb] sm:block" />
          {components[0] && (
            <Link
              href={`/components/${components[0].slug}`}
              className="hidden items-center gap-1.5 text-[#858b97] transition-colors hover:text-[#4866e9] sm:flex"
            >
              Latest experiment <ArrowUpRight className="size-3.5" />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
