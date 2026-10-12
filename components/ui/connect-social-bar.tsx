"use client";

import { ComponentStyles } from "./component-styles";

import { useState } from "react";

export interface ConnectSocialBarProps {
  className?: string;
  email?: string;
  links?: Partial<Record<SocialNetwork, string>>;
}

export type SocialNetwork =
  | "GitHub"
  | "X"
  | "LinkedIn"
  | "Instagram"
  | "YouTube"
  | "Email"
  | "Discord";

const SOCIALS: Array<{
  name: SocialNetwork;
  color: string;
  href: string;
  icon: React.ReactNode;
}> = [
  {
    name: "GitHub",
    color: "#f4f6ff",
    href: "https://github.com",
    icon: <><path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.1c-3.1.68-3.76-1.32-3.76-1.32-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 .1.74 2.28 3.96 1.62.1-.73.4-1.23.72-1.52-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.16-3-.12-.29-.5-1.43.11-2.98 0 0 .95-.3 3.05 1.15a10.6 10.6 0 0 1 5.55 0c2.1-1.45 3.05-1.15 3.05-1.15.61 1.55.23 2.69.11 2.98.72.78 1.16 1.78 1.16 3 0 4.29-2.61 5.23-5.1 5.51.4.35.76 1.03.76 2.08v3.09c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" /></>,
  },
  {
    name: "X",
    color: "#f4f6ff",
    href: "https://x.com",
    icon: <path d="M18.9 2H22l-6.78 7.75L23.2 22h-6.25l-4.9-7.46L5.52 22H2.4l7.25-8.3L1.8 2h6.41l4.43 6.97L18.9 2Zm-1.1 18h1.73L7.27 3.9H5.41L17.8 20Z" />,
  },
  {
    name: "LinkedIn",
    color: "#35c8ff",
    href: "https://www.linkedin.com",
    icon: <path d="M5.1 3.2a2.1 2.1 0 1 1-4.2 0 2.1 2.1 0 0 1 4.2 0ZM1.2 7h3.7v14.8H1.2V7Zm6 0h3.55v2.02h.05c.5-.95 1.7-2 3.5-2 3.75 0 4.45 2.47 4.45 5.68v9.1h-3.7v-8.07c0-1.93-.03-4.4-2.68-4.4-2.68 0-3.09 2.1-3.09 4.27v8.2H7.2V7Z" />,
  },
  {
    name: "Instagram",
    color: "#ff4d9d",
    href: "https://www.instagram.com",
    icon: <><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2.4" /><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2.4" /><circle cx="17.8" cy="6.5" r="1.3" /></>,
  },
  {
    name: "YouTube",
    color: "#ff4545",
    href: "https://www.youtube.com",
    icon: <><path d="M23.5 6.2a3 3 0 0 0-2.1-2.12C19.55 3.56 12 3.56 12 3.56s-7.55 0-9.4.52A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.12c1.85.52 9.4.52 9.4.52s7.55 0 9.4-.52a3 3 0 0 0 2.1-2.12A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8Z" /><path d="m9.7 15.7 6.3-3.7-6.3-3.7v7.4Z" fill="#111217" /></>,
  },
  {
    name: "Email",
    color: "#ff4d5e",
    href: "mailto:eng.mizanur.hasan@gmail.com",
    icon: <path d="M2.5 5.5A2.5 2.5 0 0 1 5 3h14a2.5 2.5 0 0 1 2.5 2.5v13A2.5 2.5 0 0 1 19 21H5a2.5 2.5 0 0 1-2.5-2.5v-13ZM5 6l7 5.5L19 6H5Zm14 2.5-6.4 5a1 1 0 0 1-1.2 0L5 8.5V18h14V8.5Z" />,
  },
  {
    name: "Discord",
    color: "#8c9bff",
    href: "https://discord.com",
    icon: <path d="M19.7 5.1a18.2 18.2 0 0 0-4.5-1.4l-.56 1.15a16.8 16.8 0 0 0-5.28 0L8.8 3.7a18.2 18.2 0 0 0-4.5 1.4C1.45 9.3.68 13 .95 16.7a18.2 18.2 0 0 0 5.54 2.8l1.2-1.95c-.66-.24-1.3-.55-1.9-.91l.47-.37a13.1 13.1 0 0 0 11.48 0l.47.37c-.6.36-1.24.67-1.9.91l1.2 1.95a18.2 18.2 0 0 0 5.54-2.8c.32-4.3-.55-8-3.35-11.6ZM8.8 14.2c-1.1 0-2-.98-2-2.18s.88-2.18 2-2.18 2.02.98 2 2.18c0 1.2-.88 2.18-2 2.18Zm6.4 0c-1.1 0-2-.98-2-2.18s.88-2.18 2-2.18 2.02.98 2 2.18c0 1.2-.88 2.18-2 2.18Z" />,
  },
];

/* Shared Tailwind classes. The lit-disc state, focus outline and sweep mask stay in CONNECT_SOCIAL_STYLES below. */
const STAGE_CLASS =
  "relative isolate flex w-full min-w-0 items-center justify-center overflow-hidden bg-[#030303] bg-[linear-gradient(rgba(255,255,255,.016)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.016)_1px,transparent_1px)] bg-[length:86px_86px] text-[#f7f8ff] shadow-[inset_0_0_110px_65px_#030303] [font-family:inherit] @container";
const TRACK_CLASS =
  "csb-track group/csb relative isolate flex max-w-full items-center justify-center gap-(--csb-gap) rounded-[999px] border border-[#111114] bg-[#080809] p-(--csb-padding) shadow-[0_0_18px_rgba(255,255,255,.055),inset_0_1px_rgba(255,255,255,.025)] [--csb-gap:clamp(2px,1.39cqw,10px)] [--csb-padding:clamp(4px,1.94cqw,14px)] [--csb-size:clamp(20px,8.33cqw,60px)]";
const SWEEP_CLASS =
  "csb-sweep pointer-events-none absolute -inset-px z-0 overflow-hidden rounded-[inherit] p-px before:absolute before:top-1/2 before:left-1/2 before:aspect-square before:w-[120%] before:animate-[csb-border-travel_4s_linear_infinite] before:bg-[conic-gradient(from_0deg,transparent_0deg,transparent_265deg,rgba(240,240,250,.06)_285deg,rgba(248,248,255,.75)_335deg,transparent_336deg)] before:transform-[translate(-50%,-50%)_rotate(0deg)] before:content-[''] motion-reduce:before:animate-none";
const LINK_CLASS =
  "csb-link relative z-1 grid size-(--csb-size) flex-[0_0_var(--csb-size)] place-items-center rounded-[50%] border border-[#1b1b1f] bg-[#111113] text-white no-underline shadow-[inset_0_1px_3px_rgba(255,255,255,.025)] [transition:color_.18s_ease,border-color_.18s_ease,background_.18s_ease,box-shadow_.18s_ease] group-data-[revealed=true]/csb:bg-[#060607] motion-reduce:[transition:none]";
const LETTER_CLASS =
  "pointer-events-none transform-[translateY(0)] text-[#85858b] opacity-100 [font:600_clamp(10px,2.78cqw,20px)/1_ui-monospace,SFMono-Regular,Menlo,monospace] [grid-area:1/1] [transition:opacity_.18s_ease,transform_.22s_ease] group-data-[revealed=true]/csb:transform-[translateY(-6px)_scale(.85)] group-data-[revealed=true]/csb:opacity-0 motion-reduce:[transition:none]";
const ICON_CLASS =
  "csb-icon pointer-events-none size-[clamp(13px,3.61cqw,26px)] transform-[translateY(6px)_scale(.85)] fill-current opacity-0 [grid-area:1/1] [transition:opacity_.18s_ease,transform_.22s_ease,filter_.18s_ease] group-data-[revealed=true]/csb:transform-[translateY(0)_scale(1)] group-data-[revealed=true]/csb:opacity-100 motion-reduce:[transition:none]";
const TOOLTIP_CLASS =
  "csb-tooltip pointer-events-none absolute bottom-[calc(100%+18px)] left-1/2 z-5 transform-[translate(-50%,4px)] rounded-[5px] border border-[color-mix(in_srgb,var(--csb-accent)_70%,#171717)] bg-[#050506] px-3 py-[7px] whitespace-nowrap text-[#f8f8fa] opacity-0 [font:600_13px/1.2_Arial,system-ui,sans-serif] [transition:opacity_.15s_ease,transform_.15s_ease] motion-reduce:[transition:none] [@container(max-width:560px)]:bottom-[calc(100%+12px)] [@container(max-width:560px)]:px-[9px] [@container(max-width:560px)]:py-1.5 [@container(max-width:560px)]:text-[11px]";

function SocialIcon({ name }: { name: SocialNetwork }) {
  const item = SOCIALS.find((social) => social.name === name);
  if (!item) return null;
  return <svg viewBox="0 0 24 24" className={ICON_CLASS} aria-hidden="true" focusable="false">{item.icon}</svg>;
}

/** Seven CONNECT discs reveal the corresponding social icons on hover or focus. */
export default function ConnectSocialBar({ className = "", email = "eng.mizanur.hasan@gmail.com", links = {} }: ConnectSocialBarProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className={`connect-social-bar ${STAGE_CLASS} min-h-[clamp(340px,60cqw,560px)] px-3 py-6 ${className}`}>
      <ComponentStyles css={CONNECT_SOCIAL_STYLES} />
      <nav
        className={TRACK_CLASS}
        aria-label="Connect on social media"
        data-revealed={isRevealed}
        onPointerEnter={() => setIsRevealed(true)}
        onPointerLeave={(event) => {
          if (!event.currentTarget.contains(document.activeElement)) setIsRevealed(false);
        }}
        onFocusCapture={() => setIsRevealed(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setIsRevealed(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setIsRevealed(false);
        }}
      >
        <span className={SWEEP_CLASS} aria-hidden="true" />
        {SOCIALS.map((social, index) => {
          const href = social.name === "Email" ? `mailto:${email}` : links[social.name] ?? social.href;
          return (
            <a
              key={social.name}
              className={LINK_CLASS}
              href={href}
              style={{ "--csb-accent": social.color } as React.CSSProperties}
              aria-label={social.name}
              target={social.name === "Email" ? undefined : "_blank"}
              rel={social.name === "Email" ? undefined : "noreferrer"}
            >
              <span className={LETTER_CLASS} aria-hidden="true">{"CONNECT"[index]}</span>
              <SocialIcon name={social.name} />
              <span className={TOOLTIP_CLASS} aria-hidden="true">{social.name}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}

/** Gallery preview uses the same seven discs and highlights one social network. */
export function ConnectSocialBarThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const activeIndex = Math.abs(Math.trunc(previewStep)) % SOCIALS.length;

  return (
    <div className={`connect-social-bar ${STAGE_CLASS} aspect-[16/9] h-full min-h-0 p-3 ${className}`} aria-hidden="true" inert>
      <ComponentStyles css={CONNECT_SOCIAL_STYLES} />
      <div className={TRACK_CLASS} data-revealed="true">
        <span className={SWEEP_CLASS} aria-hidden="true" />
        {SOCIALS.map((social, index) => (
          <span key={social.name} className={`${LINK_CLASS}${index === activeIndex ? " csb-link--preview-active" : ""}`} style={{ "--csb-accent": social.color } as React.CSSProperties}>
            <SocialIcon name={social.name} />
          </span>
        ))}
      </div>
    </div>
  );
}

/* Raw CSS only for what Tailwind cannot express cleanly: the keyframes, the prefixed
   mask that hollows the sweep into a 1px ring, the focus outline (it must beat the
   app's unlayered :focus-visible rule), and the "lit" disc state keyed on
   track[data-revealed] > link:hover/focus-visible > icon/tooltip. */
const CONNECT_SOCIAL_STYLES = `
.csb-sweep{-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
@keyframes csb-border-travel{to{transform:translate(-50%,-50%) rotate(360deg)}}
.csb-link:focus-visible{outline:1px solid var(--csb-accent);outline-offset:3px}
.csb-track[data-revealed=true] .csb-link:is(:hover,:focus-visible){background:#0b0b0e}
.csb-track[data-revealed=true] .csb-link:is(:hover,:focus-visible),.csb-link--preview-active{z-index:4;color:var(--csb-accent);border-color:var(--csb-accent);box-shadow:0 0 0 1px color-mix(in srgb,var(--csb-accent) 25%,transparent),0 0 14px color-mix(in srgb,var(--csb-accent) 60%,transparent),0 0 30px color-mix(in srgb,var(--csb-accent) 24%,transparent),inset 0 0 12px color-mix(in srgb,var(--csb-accent) 20%,transparent)}
.csb-track[data-revealed=true] .csb-link:is(:hover,:focus-visible) .csb-icon,.csb-link--preview-active .csb-icon{filter:drop-shadow(0 0 4px currentColor)}
.csb-track[data-revealed=true] .csb-link:is(:hover,:focus-visible) .csb-tooltip{opacity:1;transform:translate(-50%,0)}
`;
