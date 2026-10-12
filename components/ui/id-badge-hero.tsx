"use client";

/** Placeholder — replaced by the full implementation. */
export default function IdBadgeHero() {
  return <div className="grid min-h-[520px] w-full place-items-center bg-[#0b0d12] text-white">ID Badge Hero</div>;
}

export function IdBadgeHeroThumbnail({ className = "" }: { className?: string; previewStep?: number }) {
  return <div aria-hidden="true" inert className={`grid h-full w-full place-items-center bg-[#0b0d12] text-white ${className}`}>ID Badge Hero</div>;
}
