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
      className="gc-artwork"
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
        className="gc-ring"
        cx="120"
        cy="120"
        r="55"
        stroke="#a5a5a5"
        strokeWidth="8"
      />
      <g className="gc-ink" fill="#4c95f7" filter={`url(#${filterId})`}>
        <circle className="gc-body" cx="120" cy="120" r="60" />
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <g key={angle} transform={`rotate(${angle} 120 120)`}>
            <circle className="gc-drop" cx="120" cy="120" r="20" />
          </g>
        ))}
      </g>
      <path
        className="gc-tick"
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
      className={`gooey-checkbox gc-stage grid w-full place-items-center bg-white ${className}`}
    >
      <ComponentStyles css={GOOEY_CHECKBOX_STYLES} />
      <label className="gc-control" htmlFor={inputId} data-disabled={disabled}>
        <input
          {...inputProps}
          id={inputId}
          className="gc-input"
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
      className={`gooey-checkbox gc-stage gc-thumbnail grid w-full place-items-center bg-white ${className}`}
      aria-hidden="true"
      inert
    >
      <ComponentStyles css={GOOEY_CHECKBOX_STYLES} />
      <div
        className="gc-control"
        data-checked={step === 1 || step === 2}
        data-splash={step === 1}
      >
        <CheckboxArtwork
          filterId={`gooey-thumbnail-${generatedId.replace(/:/g, "")}`}
        />
      </div>
    </div>
  );
}

const GOOEY_CHECKBOX_STYLES = `
.gooey-checkbox{container-type:inline-size;isolation:isolate;min-width:0}
.gooey-checkbox.gc-stage{min-height:420px;padding:70px 24px;background:#fff}
.gooey-checkbox .gc-control{position:relative;display:block;width:120px;height:120px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.gooey-checkbox .gc-input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:inherit;z-index:1}
.gooey-checkbox .gc-artwork{position:absolute;top:-60px;left:-60px;width:240px;height:240px;overflow:visible;pointer-events:none}
.gooey-checkbox .gc-ring{transition:opacity .15s ease,stroke .2s ease}
.gooey-checkbox .gc-ink{opacity:0;transition:opacity .15s ease}
.gooey-checkbox .gc-body,.gooey-checkbox .gc-drop{transform-box:fill-box;transform-origin:center}
.gooey-checkbox .gc-drop{transform:scale(0)}
.gooey-checkbox .gc-tick{stroke-dasharray:1;stroke-dashoffset:1;opacity:0;transition:stroke-dashoffset .4s ease,opacity .15s ease}
.gooey-checkbox .gc-control:is([data-checked=true],:has(>.gc-input:checked)) .gc-ring{opacity:0}
.gooey-checkbox .gc-control:is([data-checked=true],:has(>.gc-input:checked)) .gc-ink{opacity:1}
.gooey-checkbox .gc-control:is([data-checked=true],:has(>.gc-input:checked)) .gc-body{animation:gc-squash .6s ease both}
.gooey-checkbox .gc-control:is([data-checked=true],:has(>.gc-input:checked)) .gc-drop{animation:gc-splash .6s ease both}
.gooey-checkbox .gc-control:is([data-checked=true],:has(>.gc-input:checked)) .gc-tick{stroke-dashoffset:0;opacity:1}
.gooey-checkbox .gc-control:hover:not([data-disabled=true]) .gc-ring{stroke:#8b9bae}
.gooey-checkbox .gc-input:focus-visible+.gc-artwork{outline:3px solid #86b6f9;outline-offset:-45px;border-radius:50%}
.gooey-checkbox .gc-control[data-disabled=true]{opacity:.45;cursor:not-allowed}
@keyframes gc-squash{0%{transform:scale(.88)}22%{transform:scale(.97,1.08)}45%{transform:scale(1.07,.94)}72%{transform:scale(.98,1.02)}100%{transform:scale(1)}}
@keyframes gc-splash{0%{transform:translateY(0) scale(0)}22%{transform:translateY(-59px) scale(.75)}46%{transform:translateY(-83px) scale(1)}70%{transform:translateY(-106px) scale(.55)}100%{transform:translateY(-116px) scale(0)}}
@container(max-width:420px){.gooey-checkbox.gc-stage{min-height:350px}.gooey-checkbox .gc-control{scale:.8}}
.gooey-checkbox.gc-thumbnail{height:100%;min-height:0;padding:30px;pointer-events:none}
.gooey-checkbox.gc-thumbnail .gc-control{scale:.7}
.gooey-checkbox.gc-thumbnail .gc-body,.gooey-checkbox.gc-thumbnail .gc-drop{animation:none}
.gooey-checkbox.gc-thumbnail .gc-control[data-splash=true] .gc-drop{transform:translateY(-83px) scale(1)}
@media(prefers-reduced-motion:reduce){.gooey-checkbox .gc-body,.gooey-checkbox .gc-drop{animation:none!important}.gooey-checkbox .gc-ring,.gooey-checkbox .gc-ink,.gooey-checkbox .gc-tick{transition:none!important}.gooey-checkbox .gc-drop{display:none}}
`;
