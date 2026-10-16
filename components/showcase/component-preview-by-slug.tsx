"use client";

import { Suspense } from "react";
import { componentPreviews, componentThumbnails } from "@/lib/component-previews";

export function ComponentPreviewBySlug({ slug }: { slug: string }) {
  const Preview = componentPreviews[slug];
  if (!Preview) return null;

  return (
    <Suspense fallback={<div className="flex min-h-80 items-center justify-center text-sm text-[#5b6574]">Loading preview…</div>}>
      <Preview />
    </Suspense>
  );
}

export function ComponentThumbnailBySlug({ slug }: { slug: string }) {
  const Thumbnail = componentThumbnails[slug];
  if (!Thumbnail) return null;

  return (
    <Suspense fallback={null}>
      <Thumbnail className="h-full w-full" previewStep={0} />
    </Suspense>
  );
}
