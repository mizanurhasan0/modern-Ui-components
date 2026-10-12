"use client";

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

function SocialIcon({ name }: { name: SocialNetwork }) {
  const item = SOCIALS.find((social) => social.name === name);
  if (!item) return null;
  return <svg viewBox="0 0 24 24" className="csb-icon" aria-hidden="true" focusable="false">{item.icon}</svg>;
}

/** Seven CONNECT discs reveal the corresponding social icons on hover or focus. */
export default function ConnectSocialBar({ className = "", email = "eng.mizanur.hasan@gmail.com", links = {} }: ConnectSocialBarProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className={`connect-social-bar csb-stage ${className}`}>
      <style>{CONNECT_SOCIAL_STYLES}</style>
      <nav
        className="csb-track"
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
        <span className="csb-sweep" aria-hidden="true" />
        {SOCIALS.map((social, index) => {
          const href = social.name === "Email" ? `mailto:${email}` : links[social.name] ?? social.href;
          return (
            <a
              key={social.name}
              className="csb-link"
              href={href}
              style={{ "--csb-accent": social.color } as React.CSSProperties}
              aria-label={social.name}
              target={social.name === "Email" ? undefined : "_blank"}
              rel={social.name === "Email" ? undefined : "noreferrer"}
            >
              <span className="csb-letter" aria-hidden="true">{"CONNECT"[index]}</span>
              <SocialIcon name={social.name} />
              <span className="csb-tooltip" aria-hidden="true">{social.name}</span>
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
    <div className={`connect-social-bar csb-stage csb-thumbnail ${className}`} aria-hidden="true" inert>
      <style>{CONNECT_SOCIAL_STYLES}</style>
      <div className="csb-track" data-revealed="true">
        <span className="csb-sweep" aria-hidden="true" />
        {SOCIALS.map((social, index) => (
          <span key={social.name} className={`csb-link${index === activeIndex ? " csb-link--preview-active" : ""}`} style={{ "--csb-accent": social.color } as React.CSSProperties}>
            <SocialIcon name={social.name} />
          </span>
        ))}
      </div>
    </div>
  );
}

const CONNECT_SOCIAL_STYLES = `
.connect-social-bar{display:flex;justify-content:center;align-items:center;width:100%;min-width:0;color:#f7f8ff;font-family:inherit}
.csb-stage{position:relative;isolation:isolate;overflow:hidden;min-height:clamp(340px,60cqw,560px);padding:24px 12px;background-color:#030303;background-image:linear-gradient(rgba(255,255,255,.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.016) 1px,transparent 1px);background-size:86px 86px;container-type:inline-size;box-shadow:inset 0 0 110px 65px #030303}
.csb-track{--csb-size:clamp(20px,8.33cqw,60px);--csb-gap:clamp(2px,1.39cqw,10px);--csb-padding:clamp(4px,1.94cqw,14px);isolation:isolate;position:relative;display:flex;align-items:center;justify-content:center;gap:var(--csb-gap);max-width:100%;padding:var(--csb-padding);border:1px solid #111114;border-radius:999px;background:#080809;box-shadow:0 0 18px rgba(255,255,255,.055),inset 0 1px rgba(255,255,255,.025)}
.csb-link{position:relative;z-index:1;display:grid;place-items:center;width:var(--csb-size);height:var(--csb-size);flex:0 0 var(--csb-size);border:1px solid #1b1b1f;border-radius:50%;background:#111113;color:#fff;text-decoration:none;box-shadow:inset 0 1px 3px rgba(255,255,255,.025);transition:color .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease}
.csb-letter,.csb-icon{grid-area:1/1;pointer-events:none;transition:opacity .18s ease,transform .22s ease}
.csb-letter{font:600 clamp(10px,2.78cqw,20px)/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#85858b;opacity:1;transform:translateY(0)}
.csb-icon{width:clamp(13px,3.61cqw,26px);height:clamp(13px,3.61cqw,26px);fill:currentColor;opacity:0;transform:translateY(6px) scale(.85);transition:opacity .18s ease,transform .22s ease,filter .18s ease}
.csb-track[data-revealed=true] .csb-link{background:#060607}
.csb-track[data-revealed=true] .csb-letter{opacity:0;transform:translateY(-6px) scale(.85)}
.csb-track[data-revealed=true] .csb-icon{opacity:1;transform:translateY(0) scale(1)}
.csb-track[data-revealed=true] .csb-link:is(:hover,:focus-visible),.csb-link--preview-active{z-index:4;color:var(--csb-accent);border-color:var(--csb-accent);background:#0b0b0e;box-shadow:0 0 0 1px color-mix(in srgb,var(--csb-accent) 25%,transparent),0 0 14px color-mix(in srgb,var(--csb-accent) 60%,transparent),0 0 30px color-mix(in srgb,var(--csb-accent) 24%,transparent),inset 0 0 12px color-mix(in srgb,var(--csb-accent) 20%,transparent)}
.csb-track[data-revealed=true] .csb-link:is(:hover,:focus-visible) .csb-icon,.csb-link--preview-active .csb-icon{filter:drop-shadow(0 0 4px currentColor)}
.csb-link:focus-visible{outline:1px solid var(--csb-accent);outline-offset:3px}
.csb-tooltip{position:absolute;left:50%;bottom:calc(100% + 18px);z-index:5;transform:translate(-50%,4px);padding:7px 12px;border:1px solid color-mix(in srgb,var(--csb-accent) 70%,#171717);border-radius:5px;background:#050506;color:#f8f8fa;font:600 13px/1.2 Arial,system-ui,sans-serif;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .15s ease,transform .15s ease}
.csb-track[data-revealed=true] .csb-link:is(:hover,:focus-visible) .csb-tooltip{opacity:1;transform:translate(-50%,0)}
.csb-sweep{position:absolute;z-index:0;inset:-1px;overflow:hidden;padding:1px;border-radius:inherit;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
.csb-sweep:before{content:"";position:absolute;left:50%;top:50%;width:120%;aspect-ratio:1;background:conic-gradient(from 0deg,transparent 0deg,transparent 265deg,rgba(240,240,250,.06) 285deg,rgba(248,248,255,.75) 335deg,transparent 336deg);animation:csb-border-travel 4s linear infinite;transform:translate(-50%,-50%) rotate(0deg)}
@keyframes csb-border-travel{to{transform:translate(-50%,-50%) rotate(360deg)}}
@container(max-width:560px){.csb-tooltip{bottom:calc(100% + 12px);font-size:11px;padding:6px 9px}}
.csb-thumbnail.csb-stage{height:100%;min-height:0;aspect-ratio:16/9;padding:12px;container-type:inline-size}
@media(prefers-reduced-motion:reduce){.csb-link,.csb-icon,.csb-letter,.csb-tooltip{transition:none}.csb-sweep:before{animation:none}}
`;
