"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** A passive copy of the selected component's artwork, separate from its live preview. */
export function ComponentBackdrop({ slug, children }: { slug: string; children: ReactNode }) {
  const artwork = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scale a normal thumbnail frame, including artwork with fixed-size elements.
    // Rendering it directly at viewport size would leave those elements too small.
    function resize() {
      const scale = Math.max(window.innerWidth / 640, window.innerHeight / 400) * 1.12;
      artwork.current?.style.setProperty("--detail-artwork-scale", String(scale));
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });
    return () => window.removeEventListener("resize", resize);
  }, [slug]);

  return (
    <div className="component-detail-backdrop" aria-hidden="true" inert>
      <div className="component-detail-backdrop-art" key={slug}>
        <div ref={artwork} className="component-detail-backdrop-canvas">
          {children}
        </div>
      </div>
      <div className="component-detail-backdrop-scrim" />
    </div>
  );
}
