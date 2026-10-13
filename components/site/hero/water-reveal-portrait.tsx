"use client";

import Image from "next/image";
import { useEffect, useRef, type RefObject } from "react";
import desk from "../assets/hasan-desk.webp";

const IMAGE_SIZES = "(min-width: 1536px) 600px, (min-width: 1024px) 50vw, 100vw";
const WAVE_DURATION = 1600;
const FOLLOW_FREQUENCY = 18;
type Wave = { x: number; y: number; born: number; power: number };

/** Only the portrait is masked; the hero's foreground remains sharp and clickable. */
export function WaterRevealPortrait({ heroRef }: { heroRef: RefObject<HTMLElement | null> }) {
  const portraitRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const waterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const portrait = portraitRef.current;
    const reveal = revealRef.current;
    const water = waterRef.current;
    if (!hero || !portrait || !reveal || !water) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let bounds = portrait.getBoundingClientRect();
    let radius = Math.min(140, Math.max(100, bounds.width * 0.24));
    let frame = 0;
    let previousTime = 0;
    let lastWave = 0;
    let active = false;
    let strength = 0;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let travel = 0;
    let waves: Wave[] = [];

    function mask(value: string) {
      reveal!.style.maskImage = value;
      reveal!.style.webkitMaskImage = value;
    }

    function reset() {
      active = false;
      strength = 0;
      waves = [];
      velocityX = 0;
      velocityY = 0;
      travel = 0;
      cancelAnimationFrame(frame);
      frame = 0;
      reveal!.style.opacity = "0";
      water!.style.opacity = "0";
    }

    function animate(now: number) {
      const elapsed = Math.min(64, now - previousTime || 16);
      previousTime = now;
      // A critically damped spring glides behind the pointer without overshooting.
      // The exact integration keeps the same feel on different refresh rates.
      const dt = elapsed / 1000;
      const decay = Math.exp(-FOLLOW_FREQUENCY * dt);
      const dx = x - targetX;
      const dy = y - targetY;
      const springX = (velocityX + FOLLOW_FREQUENCY * dx) * dt;
      const springY = (velocityY + FOLLOW_FREQUENCY * dy) * dt;
      const nextX = targetX + (dx + springX) * decay;
      const nextY = targetY + (dy + springY) * decay;
      velocityX = (velocityX - FOLLOW_FREQUENCY * springX) * decay;
      velocityY = (velocityY - FOLLOW_FREQUENCY * springY) * decay;
      travel += Math.hypot(nextX - x, nextY - y);
      x = nextX;
      y = nextY;
      strength += ((active ? 1 : 0) - strength) * (1 - Math.exp(-elapsed / 100));

      // The clearing softly stretches with motion; its center stays perfectly sharp.
      const speed = Math.hypot(velocityX, velocityY);
      const rx = radius + Math.sin(now / 260) * 6 + Math.min(14, Math.abs(velocityX) / 70);
      const ry = radius + Math.cos(now / 310) * 7 + Math.min(14, Math.abs(velocityY) / 70);
      const masks = [
        `radial-gradient(ellipse ${rx}px ${ry}px at ${x}px ${y}px, #000 0%, #000 55%, rgba(0,0,0,.65) 76%, transparent 100%)`,
      ];
      const highlights: string[] = [];

      // Accumulated travel catches slow, small pointer events too. Ripples originate
      // at the moving clearing, leaving a visible wake rather than jumping ahead.
      if (active && ((travel > 18 && now - lastWave > 95) || now - lastWave > 700)) {
        waves.push({ x, y, born: now, power: Math.min(1.15, 0.7 + speed / 1600) });
        lastWave = now;
        travel = 0;
      }
      waves = waves.filter((wave) => now - wave.born < WAVE_DURATION).slice(-8);
      for (const wave of waves) {
        const age = (now - wave.born) / WAVE_DURATION;
        const spread = 1 - Math.pow(1 - age, 1.5);
        const size = radius * 0.7 + spread * 180;
        const opacity = wave.power * Math.min(1, age / 0.08) * Math.pow(1 - age, 1.5);
        const inner = size - 22;
        const position = `${wave.x}px ${wave.y}px`;
        masks.push(
          `radial-gradient(circle at ${position}, transparent ${size - 15}px, rgba(0,0,0,${opacity * 0.85}) ${size}px, transparent ${size + 15}px)`,
          `radial-gradient(circle at ${position}, transparent ${inner - 8}px, rgba(0,0,0,${opacity * 0.4}) ${inner}px, transparent ${inner + 8}px)`,
        );
        highlights.push(
          `radial-gradient(circle at ${position}, transparent ${size - 4}px, rgba(255,255,255,${opacity * 0.58}) ${size - 1}px, rgba(255,255,255,${opacity * 0.32}) ${size + 1}px, rgba(65,111,145,${opacity * 0.28}) ${size + 4}px, transparent ${size + 9}px)`,
          `radial-gradient(circle at ${position}, transparent ${inner - 3}px, rgba(255,255,255,${opacity * 0.26}) ${inner}px, rgba(65,111,145,${opacity * 0.12}) ${inner + 3}px, transparent ${inner + 7}px)`,
        );
      }

      mask(masks.join(","));
      reveal!.style.opacity = String(strength);
      water!.style.backgroundImage = highlights.length ? highlights.join(",") : "none";
      water!.style.opacity = String(strength);

      if (active || strength > 0.005) {
        frame = requestAnimationFrame(animate);
      } else {
        reset();
      }
    }

    function move(event: PointerEvent) {
      // Touch scrolling stays native; mouse and hovering pens reveal the photo.
      if (event.pointerType === "touch") return;
      const nextX = event.clientX - bounds.left;
      const nextY = event.clientY - bounds.top;
      const nearPortrait = nextX > -radius && nextX < bounds.width + radius &&
        nextY > -radius && nextY < bounds.height + radius;
      if (!nearPortrait) {
        leave();
        return;
      }

      if (!active) {
        x = nextX;
        y = nextY;
        velocityX = 0;
        velocityY = 0;
        travel = 0;
        waves = [];
        lastWave = 0;
      }
      targetX = nextX;
      targetY = nextY;
      active = true;

      if (motion.matches) {
        mask(`radial-gradient(circle ${radius}px at ${nextX}px ${nextY}px, #000 60%, transparent 100%)`);
        reveal!.style.opacity = "1";
        return;
      }
      if (!frame) {
        previousTime = performance.now();
        frame = requestAnimationFrame(animate);
      }
    }

    function leave() {
      active = false;
      if (motion.matches) reset();
    }

    function measure() {
      bounds = portrait!.getBoundingClientRect();
      radius = Math.min(140, Math.max(100, bounds.width * 0.24));
      reset();
    }

    const resize = new ResizeObserver(measure);
    resize.observe(portrait);
    hero.addEventListener("pointerenter", move);
    hero.addEventListener("pointermove", move);
    hero.addEventListener("pointerleave", leave);
    hero.addEventListener("pointercancel", reset);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", reset);
    motion.addEventListener("change", reset);

    return () => {
      reset();
      resize.disconnect();
      hero.removeEventListener("pointerenter", move);
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", leave);
      hero.removeEventListener("pointercancel", reset);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", reset);
      motion.removeEventListener("change", reset);
    };
  }, [heroRef]);

  return (
    <div
      ref={portraitRef}
      className="pointer-events-none absolute inset-0 mix-blend-multiply [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,#000_26%,#000_80%,transparent),linear-gradient(to_bottom,transparent,#000_14%)]"
    >
      <Image
        src={desk}
        alt="Hasan at his desk with a sticker-covered laptop"
        fill
        preload
        sizes={IMAGE_SIZES}
        className="object-cover object-[50%_20%] blur-[10px]"
      />
      <div ref={revealRef} aria-hidden="true" className="absolute inset-0 opacity-0 [mask-image:linear-gradient(transparent,transparent)]">
        <Image src={desk} alt="" fill loading="eager" sizes={IMAGE_SIZES} className="object-cover object-[50%_20%]" />
      </div>
      <div ref={waterRef} aria-hidden="true" className="absolute inset-0 opacity-0" />
    </div>
  );
}
