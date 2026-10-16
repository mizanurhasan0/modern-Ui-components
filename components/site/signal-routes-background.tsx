"use client";

import { useEffect, useRef } from "react";
import styles from "./featured-work.module.css";

const RESTING_POINT = { x: 0.7, y: 0.2 };
const MOBILE_RESTING_POINT = { x: 0.9, y: 0.06 };

export function SignalRoutesBackground() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const stage = root?.parentElement;
    const svg = root?.querySelector("svg");
    const hub = root?.querySelector<SVGCircleElement>("[data-hub]");
    const plane = root?.querySelector<SVGGElement>("[data-plane]");
    const glow = root?.querySelector<HTMLElement>("[data-glow]");
    const paths = root?.querySelectorAll<SVGPathElement>("[data-route]");
    if (!root || !stage || !svg || !hub || !plane || !glow || !paths) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const restingPoint = () => stage.clientWidth <= 680 ? MOBILE_RESTING_POINT : RESTING_POINT;
    let current = { ...restingPoint() };
    let target = { ...restingPoint() };
    let heading = 35;
    let frame = 0;
    let pointerInside = false;

    function draw() {
      if (!stage || !svg || !hub || !plane || !glow || !paths) return;
      const { width, height } = stage.getBoundingClientRect();
      if (!width || !height) return;

      const x = current.x * width;
      const y = current.y * height;
      const routes = [
        `M -30 ${height * 0.15} C ${width * 0.21} ${height * 0.06}, ${x - width * 0.27} ${y - height * 0.14}, ${x} ${y}`,
        `M ${width + 30} ${height * 0.05} C ${width * 0.82} ${height * 0.16}, ${x + width * 0.2} ${y - height * 0.13}, ${x} ${y}`,
        `M -30 ${height * 0.91} C ${width * 0.25} ${height * 0.68}, ${x - width * 0.22} ${y + height * 0.24}, ${x} ${y}`,
      ];

      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      paths.forEach((path) => path.setAttribute("d", routes[Number(path.dataset.route)]));
      hub.setAttribute("cx", String(x));
      hub.setAttribute("cy", String(y));
      plane.setAttribute("transform", `translate(${x} ${y}) rotate(${heading})`);
      glow.style.left = `${x}px`;
      glow.style.top = `${y}px`;
    }

    function tick() {
      frame = 0;
      const easing = reducedMotion.matches ? 1 : 0.16;
      if (stage) {
        const dx = (target.x - current.x) * stage.clientWidth;
        const dy = (target.y - current.y) * stage.clientHeight;
        if (Math.hypot(dx, dy) > 1) {
          const desiredHeading = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
          const shortestTurn = ((desiredHeading - heading + 540) % 360) - 180;
          heading += shortestTurn * easing;
        }
      }
      current = {
        x: current.x + (target.x - current.x) * easing,
        y: current.y + (target.y - current.y) * easing,
      };
      draw();
      if (Math.abs(current.x - target.x) + Math.abs(current.y - target.y) > 0.001) {
        frame = window.requestAnimationFrame(tick);
      }
    }

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(tick);
    }

    function onPointerMove(event: PointerEvent) {
      if (!stage || !finePointer.matches || reducedMotion.matches || event.pointerType !== "mouse") return;
      pointerInside = true;
      const bounds = stage.getBoundingClientRect();
      target = {
        x: Math.min(0.95, Math.max(0.05, (event.clientX - bounds.left) / bounds.width)),
        y: Math.min(0.9, Math.max(0.08, (event.clientY - bounds.top) / bounds.height)),
      };
      schedule();
    }

    function onPointerLeave() {
      pointerInside = false;
      target = { ...restingPoint() };
      schedule();
    }

    const observer = new ResizeObserver(() => {
      if (!pointerInside) current = target = { ...restingPoint() };
      draw();
    });
    observer.observe(stage);
    stage.addEventListener("pointermove", onPointerMove, { passive: true });
    stage.addEventListener("pointerleave", onPointerLeave);
    draw();

    return () => {
      observer.disconnect();
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerleave", onPointerLeave);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.backgroundArt} aria-hidden="true">
      <div className={styles.signalGrid} />
      <div className={styles.signalGlow} data-glow />
      <svg className={styles.signalSvg} viewBox="0 0 1100 650" preserveAspectRatio="none" focusable="false">
        {[0, 1, 2].map((route) => (
          <g key={route}>
            <path className={styles.routeBase} data-route={route} />
            <path className={styles.routePulse} data-route={route} />
          </g>
        ))}
        <circle className={styles.signalHub} data-hub cx="770" cy="130" r="19" />
        <g data-plane transform="translate(770 130) rotate(35)">
          <path
            className={styles.signalPlane}
            d="M0-11c1.2 0 2 1.7 2 3.5v5L10 3c1.2.8 1.2 2.1 0 2.1L2 3.5v5.1l2.8 2.6v1L0 11l-4.8 1.2v-1L-2 8.6V3.5l-8 1.6c-1.2 0-1.2-1.3 0-2.1l8-5.5v-5C-2-9.3-1.2-11 0-11Z"
          />
        </g>
      </svg>
    </div>
  );
}
