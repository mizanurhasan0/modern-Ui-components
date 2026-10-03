"use client";

import { useEffect, useRef, useState } from "react";
import { componentThumbnails } from "@/lib/component-previews";
import { startThumbnailPlayback } from "@/lib/thumbnail-playback";
import { CodeIcon } from "@/components/site/icons";
import "./gallery-thumbnail.css";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

export function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function getReducedMotion() {
  return window.matchMedia(reducedMotionQuery).matches;
}

/** Thumbnails remain inert: clicking anywhere still opens the component page. */
export function GalleryThumbnail({ slug, paused }: { slug: string; paused: boolean }) {
  const element = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const Thumbnail = componentThumbnails[slug];

  useEffect(() => {
    if (!element.current || !Thumbnail) return;
    return startThumbnailPlayback(element.current, () => setStep((frame) => (frame + 1) % 180), paused);
  }, [paused, Thumbnail]);

  return (
    <div ref={element} className="gallery-thumbnail h-full w-full" data-running="false" aria-hidden="true" inert>
      {Thumbnail ? <Thumbnail className="h-full w-full" previewStep={step} /> : (
        <div className="flex h-full items-center justify-center text-white"><CodeIcon className="size-12" /></div>
      )}
    </div>
  );
}
