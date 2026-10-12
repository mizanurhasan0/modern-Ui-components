"use client";

import { ComponentStyles } from "./component-styles";

import { useId, type InputHTMLAttributes } from "react";

export interface GooeyCheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange" | "size" | "children"
> {
  /** Accessible text for the circular checkbox. */
  label?: string;
  onCheckedChange?: (checked: boolean) => void;
}

function CheckboxArtwork({ filterId }: { filterId: string }) {
  return (
    <svg
      className="gc-artwork pointer-events-none absolute top-[-60px] left-[-60px] size-[240px] overflow-visible peer-focus-visible:rounded-[50%] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-[-45px] peer-focus-visible:outline-[#86b6f9]"
      viewBox="0 0 240 240"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <filter
          id={filterId}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
          />
        </filter>
      </defs>
      <circle
        className="gc-ring [transition:opacity_.15s_ease,stroke_.2s_ease] group-data-checked/gc:opacity-0 group-has-checked/gc:opacity-0 group-[:hover:not([data-disabled=true])]/gc:stroke-[#8b9bae] motion-reduce:transition-none"
        cx="120"
        cy="120"
        r="55"
        stroke="#a5a5a5"
        strokeWidth="8"
      />
      <g
        className="gc-ink opacity-0 [transition:opacity_.15s_ease] group-data-checked/gc:opacity-100 group-has-checked/gc:opacity-100 motion-reduce:transition-none"
        fill="#4c95f7"
        filter={`url(#${filterId})`}
      >
        <circle
          className="gc-body origin-center [transform-box:fill-box] group-data-checked/gc:animate-[gc-squash_.6s_ease_both] group-has-checked/gc:animate-[gc-squash_.6s_ease_both] motion-reduce:animate-none!"
          cx="120"
          cy="120"
          r="60"
        />
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <g key={angle} transform={`rotate(${angle} 120 120)`}>
            <circle
              className="gc-drop origin-center [transform-box:fill-box] [transform:scale(0)] group-data-checked/gc:animate-[gc-splash_.6s_ease_both] group-has-checked/gc:animate-[gc-splash_.6s_ease_both] motion-reduce:hidden"
              cx="120"
              cy="120"
              r="20"
            />
          </g>
        ))}
      </g>
      <path
        className="gc-tick opacity-0 [stroke-dasharray:1] [stroke-dashoffset:1] [transition:stroke-dashoffset_.4s_ease,opacity_.15s_ease] group-data-checked/gc:opacity-100 group-data-checked/gc:[stroke-dashoffset:0] group-has-checked/gc:opacity-100 group-has-checked/gc:[stroke-dashoffset:0] motion-reduce:transition-none"
        d="m94 125 19 17 34-47"
        pathLength="1"
        stroke="white"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A native, keyboard-accessible checkbox with a liquid splash on selection. */
export default function GooeyCheckbox({
  checked,
  defaultChecked = false,
  onCheckedChange,
  label = "Select item",
  className = "",
  disabled = false,
  id,
  ...inputProps
}: GooeyCheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? `${generatedId}-checkbox`;
  const filterId = `gooey-${generatedId.replace(/:/g, "")}`;

  return (
    <div
      className={`gooey-checkbox gc-stage @container isolate grid min-h-[420px] w-full min-w-0 place-items-center bg-white px-6 py-[70px] [@container(max-width:420px)]:min-h-[350px] ${className}`}
    >
      <ComponentStyles css={GOOEY_CHECKBOX_STYLES} />
      <label
        className="gc-control group/gc relative block size-[120px] cursor-pointer [-webkit-tap-highlight-color:transparent] data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-45 [@container(max-width:420px)]:scale-80 @min-[1000px]:scale-140"
        htmlFor={inputId}
        data-disabled={disabled}
      >
        <input
          {...inputProps}
          id={inputId}
          className="gc-input peer absolute inset-0 z-1 m-0 size-full cursor-[inherit] opacity-0"
          type="checkbox"
          checked={checked}
          defaultChecked={checked === undefined ? defaultChecked : undefined}
          disabled={disabled}
          onChange={(event) => {
            onCheckedChange?.(event.currentTarget.checked);
          }}
        />
        <CheckboxArtwork filterId={filterId} />
        <span className="sr-only">{label}</span>
      </label>
    </div>
  );
}

/** Noninteractive frames for a component gallery: ring, splash, and check. */
export function GooeyCheckboxThumbnail({
  className = "",
  previewStep = 0,
}: {
  className?: string;
  previewStep?: number;
}) {
  const generatedId = useId();
  const step = Math.abs(Math.trunc(previewStep)) % 4;
  return (
    <div
      className={`gooey-checkbox gc-stage gc-thumbnail pointer-events-none @container isolate grid h-full min-h-0 w-full min-w-0 place-items-center bg-white p-[30px] ${className}`}
      aria-hidden="true"
      inert
    >
      <ComponentStyles css={GOOEY_CHECKBOX_STYLES} />
      {/* Frames 1-2 are checked; entering frame 1 plays the live splash. */}
      <div
        className="gc-control group/gc relative block size-[120px] scale-70"
        data-checked={step === 1 || step === 2 || undefined}
      >
        <CheckboxArtwork
          filterId={`gooey-thumbnail-${generatedId.replace(/:/g, "")}`}
        />
      </div>
    </div>
  );
}

// Only the keyframes stay raw; every other style is a Tailwind utility above.
const GOOEY_CHECKBOX_STYLES = `
@keyframes gc-squash{0%{transform:scale(.88)}22%{transform:scale(.97,1.08)}45%{transform:scale(1.07,.94)}72%{transform:scale(.98,1.02)}100%{transform:scale(1)}}
@keyframes gc-splash{0%{transform:translateY(0) scale(0)}22%{transform:translateY(-59px) scale(.75)}46%{transform:translateY(-83px) scale(1)}70%{transform:translateY(-106px) scale(.55)}100%{transform:translateY(-116px) scale(0)}}
`;
