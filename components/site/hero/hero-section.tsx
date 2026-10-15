"use client";

import { useEffect, useRef, useState } from "react";
import { HeroActions } from "./hero-actions";
import { CountUp } from "./count-up";
import { TechStack } from "./tech-stack";
import { TECH_STACK } from "./tech-stack-data";
import { WaterRevealPortrait } from "./water-reveal-portrait";
import styles from "./hero-section.module.css";

const TOUR_STEP_MS = 2600;

/** "Watch intro" walks through each stack category with a short caption. */
function useIntroTour() {
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    if (step === null) return;
    const timer = setTimeout(() => setStep(step + 1 < TECH_STACK.length ? step + 1 : null), TOUR_STEP_MS);
    return () => clearTimeout(timer);
  }, [step]);

  return {
    category: step === null ? null : TECH_STACK[step],
    playing: step !== null,
    toggle: () => setStep((current) => (current === null ? 0 : null)),
    stop: () => setStep(null),
  };
}

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const tour = useIntroTour();
  const [hovered, setHovered] = useState<string | null>(null);
  const activeId = tour.category?.id ?? hovered;

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

      <div className="site-container relative grid grid-cols-[minmax(0,1fr)] gap-10 pt-10 pb-14 lg:grid-cols-2 lg:gap-x-6 2xl:min-h-[760px] 2xl:grid-cols-1 2xl:gap-0 2xl:pt-0 2xl:pb-0">
        <div className="relative z-20 flex flex-col justify-center 2xl:max-w-[560px] 2xl:py-16">
          <p className="flex flex-wrap items-center gap-x-1.5 text-[20px] leading-snug text-[#5b6271] sm:text-[22px]">
            Hi, I’m <span className="font-semibold text-[#0b0d12]">Mizanur Hasan</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ml-1 size-5 shrink-0 text-[#2563eb]">
              <rect x="4" y="4" width="16" height="13" rx="2" />
              <path d="M2 20h20m-12-3-.5 3m4.5-3 .5 3M9 8l-2.5 2.5L9 13m6-5 2.5 2.5L15 13" />
            </svg>
          </p>
          <p className="mt-2.5 flex items-center gap-4 text-[11px] font-medium tracking-[0.18em] text-[#697386] uppercase sm:text-[12px]">
            Full stack developer
            <span aria-hidden="true" className="h-px w-10 bg-[#a9b1bf]" />
          </p>
          <h1
            id="hero-heading"
            className="mt-6 text-[clamp(2.35rem,4.2vw,3.75rem)] leading-[1.02] font-bold tracking-[-0.045em] text-[#0b0d12]"
          >
            Turning Ideas Into
            <br />
            <span className={styles.productTitle}>
              <span className={styles.productDepth} aria-hidden="true">Real Products.</span>
              <span className={styles.productFace}>Real Products.</span>
            </span>
          </h1>
          {/* <p className="mt-7 max-w-[440px] text-[17px] leading-[1.6] text-[#5b6271]">
            I build modern, scalable web applications with clean code and real-world impact.
          </p> */}
          <HeroActions playing={tour.playing} onToggleIntro={tour.toggle} />
          <p aria-live="polite" className="mt-4 min-h-6 text-[13px] text-[#4b5563]">
            {tour.category && (
              <span className="inline-flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ backgroundColor: tour.category.color }} />
                <b className="font-semibold text-[#0b0d12]">{tour.category.label}:</b> {tour.category.tagline}
              </span>
            )}
          </p>
          <dl className="mt-6 grid max-w-[460px] grid-cols-[1fr_1fr_1.25fr] items-stretch divide-x divide-[#d6dbe3] sm:flex">
            <div className="min-w-0 pr-3 sm:pr-7">
              <dd className="text-[22px] leading-none font-bold text-[#0b0d12] sm:text-[28px]"><CountUp to={3} suffix="+" /></dd>
              <dt className="mt-2 text-[11px] leading-snug text-[#5b6271] sm:text-[13px]">Years<br />Experience</dt>
            </div>
            <div className="min-w-0 px-3 sm:px-7">
              <dd className="text-[22px] leading-none font-bold text-[#0b0d12] sm:text-[28px]"><CountUp to={50} suffix="+" /></dd>
              <dt className="mt-2 text-[11px] leading-snug text-[#5b6271] sm:text-[13px]">Projects<br />Completed</dt>
            </div>
            <div className="group min-w-0 pl-3 sm:pl-7">
              <dd className="flex items-center gap-1 text-[22px] leading-none font-bold text-[#0b0d12] sm:gap-2.5 sm:text-[28px]">
                Happy
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" className="size-5 shrink-0 transition-transform duration-300 group-hover:rotate-12 sm:size-8">
                  <circle cx="12" cy="12" r="9.5" />
                  <path d="M8.5 14.5c1.9 2 5.1 2 7 0" />
                  <path d="M9 9.5v.5" className="transition-all group-hover:opacity-0" />
                  <path d="M15 9.5v.5" />
                  <path d="M7.8 10h2.4" className="opacity-0 transition-all group-hover:opacity-100" />
                </svg>
              </dd>
              <dt className="mt-2 text-[11px] text-[#5b6271] sm:text-[13px]">Clients</dt>
            </div>
          </dl>
        </div>

        {/* The portrait fades into the scene at its edges; on wide screens it sits behind the stack. */}
        <div className="relative z-10 mx-auto h-[440px] w-full max-w-[560px] sm:h-[520px] lg:h-[600px] lg:max-w-none 2xl:absolute 2xl:bottom-0 2xl:left-[27%] 2xl:h-[90%] 2xl:w-[600px]">
          <WaterRevealPortrait heroRef={heroRef} />
        </div>

        <div className="relative z-20 w-full lg:col-span-2 lg:mx-auto lg:max-w-[920px] 2xl:absolute 2xl:top-1/2 2xl:right-8 2xl:w-[660px] 2xl:-translate-y-1/2">
          <TechStack activeId={activeId} onActiveChange={(id) => { tour.stop(); setHovered(id); }} />
        </div>
      </div>
    </section>
  );
}
