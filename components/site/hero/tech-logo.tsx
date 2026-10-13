"use client";

import { useEffect, useRef, useState } from "react";
import type { Tool } from "./tech-stack-data";

/** A tool's logo from Simple Icons, falling back to a colored monogram. */
export function TechLogo({ tool, className = "size-[22px]" }: { tool: Tool; className?: string }) {
  const [failed, setFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // An image can fail before hydration attaches onError; catch that case too.
  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth === 0) setFailed(true);
  }, []);

  if (!tool.icon || failed) {
    const mark = tool.mark ?? tool.name.charAt(0);
    return (
      <span
        aria-hidden="true"
        style={{ backgroundColor: tool.color }}
        className={`${className} grid shrink-0 place-items-center rounded-md font-bold text-white ${mark.length > 2 ? "text-[7px]" : "text-[9px]"}`}
      >
        {mark}
      </span>
    );
  }

  return (
    // Tiny external SVG logos; next/image adds nothing here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imageRef}
      src={`https://cdn.simpleicons.org/${tool.icon}/${tool.color.slice(1)}`}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`${className} shrink-0 object-contain`}
    />
  );
}
