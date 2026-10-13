import Image from "next/image";
import type { SVGProps } from "react";
import logoMark from "./logo-mark.png";
import logoWordmark from "./logo-wordmark.png";

type IconProps = SVGProps<SVGSVGElement>;

/** The site's brand mark (also the favicon); decorative, so links using it carry their own label. */
export function LabMark({ className = "" }: { className?: string }) {
  return (
    <Image
      src={logoMark}
      alt=""
      aria-hidden="true"
      className={`shrink-0 object-contain ${className}`}
      sizes="40px"
      loading="eager"
    />
  );
}

/** The "ComponentLab" wordmark; its alt text names the brand for links that use it. */
export function LabWordmark({ className = "" }: { className?: string }) {
  return (
    <Image
      src={logoWordmark}
      alt="ComponentLab"
      className={`h-auto shrink-0 object-contain ${className}`}
      sizes="180px"
      loading="eager"
    />
  );
}

export function ArrowUpRight(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M6 18 18 6M6 6h12v12" />
    </svg>
  );
}

export function CodeIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18" />
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z" />
    </svg>
  );
}
