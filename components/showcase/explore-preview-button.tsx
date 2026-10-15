"use client";

import { ArrowUpRight } from "@/components/site/icons";
import { openPreviewFullscreen } from "./preview-events";

export function ExplorePreviewButton() {
  return (
    <button
      type="button"
      onClick={(event) => openPreviewFullscreen(event.currentTarget)}
      className="hidden h-11 w-fit shrink-0 items-center gap-2 rounded-full bg-[#0b0d12] px-5 text-[12px] font-medium text-white shadow-[0_8px_20px_-10px_rgba(11,13,18,0.7)] transition hover:-translate-y-0.5 hover:bg-[#252b36] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4666ee] lg:inline-flex"
    >
      Explore the preview <ArrowUpRight className="size-4" />
    </button>
  );
}
