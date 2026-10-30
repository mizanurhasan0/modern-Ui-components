"use client";

import { useRef, useState } from "react";
import { HeroActions } from "./hero-actions";
import { TechStack } from "./tech-stack";
import { WaterRevealPortrait } from "./water-reveal-portrait";
import styles from "./hero-section.module.css";

export function HeroSection({ componentCount }: { componentCount: number }) {
  const heroRef = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <section
      ref={heroRef}
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#f6f8fb_0%,#eef2f7_70%,#e9edf3_100%)]"
    >
      {/* Soft window light and floor, standing in for the office backdrop. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,.95),rgba(255,255,255,0)_70%)]" />
        <div className="absolute top-0 left-[38%] h-full w-24 -skew-x-12 bg-[linear-gradient(180deg,rgba(255,255,255,.7),rgba(255,255,255,0))]" />
        <div className="absolute top-0 left-[44%] h-full w-10 -skew-x-12 bg-[linear-gradient(180deg,rgba(255,255,255,.5),rgba(255,255,255,0))]" />
        <div className="absolute -right-24 bottom-0 h-[420px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(186,214,255,.35),rgba(186,214,255,0)_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,.85))]" />
      </div>

      <div className="site-container relative grid grid-cols-[minmax(0,1fr)] gap-5 pt-8 pb-9 sm:gap-10 sm:pt-10 sm:pb-14 lg:min-h-[790px] lg:gap-0 lg:pt-0 lg:pb-0 min-[1100px]:min-h-[750px] xl:min-h-[700px]">
        <div className="relative z-20 flex flex-col justify-center lg:max-w-[480px] lg:pb-14 xl:max-w-[520px] xl:py-16 2xl:max-w-[560px]">
          <p className="flex flex-wrap items-center gap-x-1.5 text-[20px] leading-snug text-[#5b6271] sm:text-[22px]">
            Hi, I’m <span className="font-semibold text-[#0b0d12]">Mizanur Hasan</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ml-1 size-5 shrink-0 text-[#2563eb]">
              <rect x="4" y="4" width="16" height="13" rx="2" />
              <path d="M2 20h20m-12-3-.5 3m4.5-3 .5 3M9 8l-2.5 2.5L9 13m6-5 2.5 2.5L15 13" />
            </svg>
          </p>
          <p className="mt-2.5 flex items-center gap-4 text-[11px] font-medium tracking-[0.12em] text-[#4b5563] uppercase sm:text-[12px] sm:tracking-[0.18em]">
            Full-stack developer · Frontend focused
            <span aria-hidden="true" className="hidden h-px w-10 bg-[#a9b1bf] sm:block" />
          </p>
          <h1
            id="hero-heading"
            className="mt-6 text-[clamp(2.35rem,4.2vw,3.75rem)] leading-[1.02] font-bold tracking-[-0.045em] text-[#0b0d12]"
          >
            Turning Ideas Into{" "}
            <br />
            <span className={styles.productTitle} data-text="Real Products.">
              <span className={styles.productFace}>Real Products.</span>
            </span>
          </h1>
          <p className="mt-4 max-w-[470px] text-[15px] leading-6 text-[#4b5563] sm:text-[16px] lg:max-w-[340px] min-[1120px]:max-w-[400px] xl:max-w-[470px]">
            I lead frontend engineering for a SaaS CRM and build marketplace features across the UI and API.
          </p>
          <HeroActions />
          <dl className="mt-5 grid max-w-[460px] grid-cols-3 items-stretch divide-x divide-[#d6dbe3] sm:mt-6 sm:flex">
            <div className="flex min-w-0 flex-col pr-3 sm:pr-7">
              <dt className="order-2 mt-2 text-[11px] leading-snug text-[#4b5563] sm:text-[13px]">Live<br />components</dt>
              <dd className="order-1 text-[22px] leading-none font-bold text-[#0b0d12] sm:text-[28px]">{componentCount}</dd>
            </div>
            <div className="flex min-w-0 flex-col px-3 sm:px-7">
              <dt className="order-2 mt-2 text-[11px] leading-snug text-[#4b5563] sm:text-[13px]">Interactive<br />previews</dt>
              <dd className="order-1 text-[22px] leading-none font-bold text-[#0b0d12] sm:text-[28px]">Live</dd>
            </div>
            <div className="flex min-w-0 flex-col pl-3 sm:pl-7">
              <dt className="order-2 mt-2 text-[11px] leading-snug text-[#4b5563] sm:text-[13px]">Source<br />included</dt>
              <dd className="order-1 text-[22px] leading-none font-bold text-[#0b0d12] sm:text-[28px]">Code</dd>
            </div>
          </dl>
        </div>

        {/* The portrait fades into the scene at its edges; from 1024px it sits between the text and the stack. */}
        <div className="relative z-10 mx-auto -mt-5 h-[330px] w-full max-w-[560px] sm:-mt-[110px] sm:h-[400px] lg:absolute lg:bottom-0 lg:left-[calc(51%_-_240px)] lg:mx-0 lg:mt-0 lg:h-[90%] lg:w-[520px] lg:max-w-none xl:left-[27%] xl:w-[600px]">
          <WaterRevealPortrait heroRef={heroRef} />
        </div>

        {/* The stack is always visible. Below 1024px it rises over the lower part of the portrait; above, it stands beside it. */}
        <div className="relative z-20 -mt-[110px] w-full sm:-mt-[225px] lg:absolute lg:top-1/2 lg:right-8 lg:mt-0 lg:w-[clamp(400px,40%,500px)] lg:-translate-y-1/2 xl:w-[660px]">
          <TechStack activeId={activeId} onActiveChange={setActiveId} />
        </div>
      </div>
    </section>
  );
}
