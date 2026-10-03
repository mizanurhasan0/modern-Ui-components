import Link from "next/link";
import { LabMark } from "./icons";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[#e4e7ed]">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-4 px-5 py-7 text-[11px] text-[#9096a1] sm:flex-row sm:items-center sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <LabMark className="size-4 text-[#979eaa]" />
          <span>
            Component Lab <span className="mx-2 text-[#d1d5de]">/</span> A
            personal playground for the web.
          </span>
        </Link>
        <span className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[#7da390]" />
          Always a work in progress.
        </span>
      </div>
    </footer>
  );
}
