"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export interface ScorpionCursorProps {
  className?: string;
  stroke?: string;
  initialPaused?: boolean;
}

type Point = { x: number; y: number };
type WireGeometry = { ribs: string[]; legs: string[]; joints: Point[]; spine: string };
const SEGMENTS = 72;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function restingSpine(width: number, height: number, step = 0): Point[] {
  const scale = Math.min(width / 760, height / 460);
  return Array.from({ length: SEGMENTS }, (_, index) => {
    const t = index / (SEGMENTS - 1);
    const angle = -1.8 + t * 4.2 + step * 0.35;
    return { x: width / 2 + Math.cos(angle) * (180 - t * 30) * scale, y: height / 2 + Math.sin(angle) * 95 * scale };
  });
}

function wireGeometry(points: Point[], scale: number, phase: number): WireGeometry {
  const ribs: string[] = [];
  const legs: string[] = [];
  const joints: Point[] = [];
  const number = (value: number) => value.toFixed(2);
  const pair = (point: Point) => `${number(point.x)} ${number(point.y)}`;
  points.forEach((point, index) => {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const angle = Math.atan2(next.y - previous.y, next.x - previous.x);
    const forward = { x: Math.cos(angle), y: Math.sin(angle) };
    const normal = { x: -forward.y, y: forward.x };
    const radius = Math.max(1, Math.sin(Math.PI * (index + 2) / (points.length + 5)) ** 0.72 * 18) * scale;
    const at = (along: number, out: number): Point => ({ x: point.x + forward.x * along + normal.x * out, y: point.y + forward.y * along + normal.y * out });
    const left = at(0, radius);
    const right = at(0, -radius);
    ribs.push(`M${pair(left)} Q${pair(at(-7 * scale, 0))} ${pair(right)} Q${pair(at(6 * scale, 0))} ${pair(left)}`);
    if (index >= 10 && index <= 44 && index % 6 === 2) {
      for (const side of [-1, 1]) {
        const stride = Math.sin(phase + index * 0.7 + side * 1.6) * 9 * scale;
        const hip = at(0, radius * side * 0.85);
        const knee = at(-15 * scale + stride, (radius + 22 * scale) * side);
        const foot = at(12 * scale + stride, (radius + 46 * scale) * side);
        legs.push(`M${pair(hip)} L${pair(knee)} L${pair(foot)}`);
        for (let toe = -1; toe <= 1; toe++) {
          legs.push(`M${pair(foot)} l${number((forward.x * toe * 4 + normal.x * side * 5) * scale)} ${number((forward.y * toe * 4 + normal.y * side * 5) * scale)}`);
        }
        joints.push(foot);
      }
    }
  });
  return { ribs, legs, joints, spine: points.map((point, index) => `${index ? "L" : "M"}${pair(point)}`).join(" ") };
}

/** An articulated canvas creature. Animation runs only while visible and moving. */
export default function ScorpionCursor({ className = "", stroke = "#e9eee9", initialPaused = false }: ScorpionCursorProps) {
  const [paused, setPaused] = useState(initialPaused);
  const canvas = useRef<HTMLCanvasElement>(null);
  const points = useRef<Point[]>([]);
  const target = useRef<Point>({ x: 0, y: 0 });
  const dimensions = useRef({ width: 0, height: 0 });
  const wake = useRef<() => void>(() => {});
  const reset = useRef<() => void>(() => {});
  const id = useId();

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let width = 0;
    let height = 0;
    let scale = 1;
    let inView = false;
    let disposed = false;
    let phase = 0;
    let lastTime = 0;
    let settledFrames = 0;
    const canAnimate = () => !disposed && !paused && !motion.matches && inView && document.visibilityState === "visible";

    function paint() {
      if (!context || disposed) return;
      context.clearRect(0, 0, width, height);
      const geometry = wireGeometry(points.current, scale, phase);
      context.strokeStyle = stroke;
      context.fillStyle = stroke;
      context.lineWidth = Math.max(0.55, 0.85 * scale);
      context.globalAlpha = 0.46;
      context.stroke(new Path2D(geometry.spine));
      geometry.ribs.forEach((path, index) => { context.globalAlpha = 0.38 + Math.sin(index / SEGMENTS * Math.PI) * 0.26; context.stroke(new Path2D(path)); });
      context.globalAlpha = 0.48;
      geometry.legs.forEach((path) => context.stroke(new Path2D(path)));
      context.globalAlpha = 0.62;
      geometry.joints.forEach((point) => { context.beginPath(); context.arc(point.x, point.y, Math.max(0.8, scale * 1.6), 0, Math.PI * 2); context.fill(); });
      context.globalAlpha = 1;
    }

    function stop() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
    function animate(time: number) {
      frame = 0;
      if (!canAnimate()) return;
      const dt = Math.min(2, (time - (lastTime || time - 16.67)) / 16.67);
      lastTime = time;
      const head = points.current[0];
      if (!head) return;
      const dx = target.current.x - head.x;
      const dy = target.current.y - head.y;
      const distance = Math.hypot(dx, dy);
      const move = Math.min(distance * 0.07 * dt, 5.5 * scale * dt);
      if (distance > 0.05) { head.x += dx / distance * move; head.y += dy / distance * move; }
      phase += move * 0.035;
      let movement = move;
      for (let index = 1; index < points.current.length; index++) {
        const point = points.current[index];
        const previous = points.current[index - 1];
        const angle = Math.atan2(point.y - previous.y, point.x - previous.x);
        const spacing = (index > 50 ? 4.8 : 5.2) * scale;
        const nextX = previous.x + Math.cos(angle) * spacing;
        const nextY = previous.y + Math.sin(angle) * spacing;
        const spring = Math.min(1, dt * (index > 48 ? 0.67 : 0.92));
        movement += Math.abs(nextX - point.x) + Math.abs(nextY - point.y);
        point.x += (nextX - point.x) * spring;
        point.y += (nextY - point.y) * spring;
      }
      paint();
      settledFrames = movement < 0.15 ? settledFrames + 1 : 0;
      if (settledFrames < 12) frame = requestAnimationFrame(animate);
      else lastTime = 0;
    }

    function start() {
      if (frame || !canAnimate()) return;
      settledFrames = 0;
      frame = requestAnimationFrame(animate);
    }
    function initialize() {
      points.current = restingSpine(width, height);
      target.current = { ...points.current[0] };
      phase = 0;
      stop();
      paint();
    }
    function resize() {
      if (disposed) return;
      const bounds = element!.getBoundingClientRect();
      if (width === bounds.width && height === bounds.height) return;
      width = bounds.width; height = bounds.height;
      scale = Math.max(0.48, Math.min(width / 760, height / 460));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      element!.width = Math.round(width * ratio); element!.height = Math.round(height * ratio);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      const unchanged = dimensions.current.width === width && dimensions.current.height === height;
      dimensions.current = { width, height };
      if (unchanged && points.current.length) { paint(); start(); }
      else initialize();
    }
    function handleVisibility() { if (canAnimate()) start(); else stop(); }
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    const intersection = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; handleVisibility(); });
    intersection.observe(element);
    document.addEventListener("visibilitychange", handleVisibility);
    motion.addEventListener("change", handleVisibility);
    wake.current = start;
    reset.current = initialize;
    resize();
    return () => { disposed = true; stop(); observer.disconnect(); intersection.disconnect(); document.removeEventListener("visibilitychange", handleVisibility); motion.removeEventListener("change", handleVisibility); wake.current = () => {}; reset.current = () => {}; };
  }, [paused, stroke]);

  function guide(event: PointerEvent<HTMLCanvasElement>) {
    if (paused) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    target.current = { x: clamp(event.clientX - bounds.left, 20, bounds.width - 20), y: clamp(event.clientY - bounds.top, 25, bounds.height - 25) };
    wake.current();
  }
  function handleKey(event: KeyboardEvent<HTMLCanvasElement>) {
    if (event.key === " ") { event.preventDefault(); setPaused((value) => !value); return; }
    if (event.key === "Escape" || event.key === "Home") { event.preventDefault(); reset.current(); return; }
    const delta: Record<string, Point> = { ArrowLeft: { x: -35, y: 0 }, ArrowRight: { x: 35, y: 0 }, ArrowUp: { x: 0, y: -35 }, ArrowDown: { x: 0, y: 35 } };
    if (!delta[event.key] || paused) return;
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    target.current = { x: clamp(target.current.x + delta[event.key].x, 25, bounds.width - 25), y: clamp(target.current.y + delta[event.key].y, 25, bounds.height - 25) };
    wake.current();
  }
  return <section className={`scorpion-stage relative w-full overflow-hidden bg-black text-white ${className}`} aria-label="Scorpion cursor experiment">
    <ScorpionStyles />
    <canvas ref={canvas} className="scorpion-canvas block w-full" tabIndex={0} role="img" aria-label="A thin, articulated white scorpion that follows your pointer" aria-describedby={`${id}-help`} onPointerMove={guide} onPointerDown={guide} onKeyDown={handleKey} />
    <div className="scorpion-footer absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 px-5 py-4">
      <p className="text-[10px] tracking-[.08em] text-white/40" id={`${id}-help`}>Move or touch to guide<span className="sr-only">. Arrow keys also move it. Space pauses. Home resets. Reduced motion keeps the creature still.</span></p>
      <div className="flex gap-2"><button type="button" className="scorpion-button" aria-pressed={paused} onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</button><button type="button" className="scorpion-button" onClick={() => reset.current()}>Reset</button></div>
    </div>
  </section>;
}

export function ScorpionCursorThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const geometry = wireGeometry(restingSpine(760, 460, previewStep % 6), 1, previewStep);
  return <div className={`scorpion-stage scorpion-thumbnail relative w-full overflow-hidden bg-black ${className}`} aria-hidden="true"><ScorpionStyles /><svg viewBox="0 0 760 460" className="h-full w-full" fill="none" stroke="#dde5df" strokeWidth=".9"><path d={geometry.spine} opacity=".4" />{geometry.ribs.map((path, index) => <path d={path} key={`rib-${index}`} opacity=".63" />)}{geometry.legs.map((path, index) => <path d={path} key={`leg-${index}`} opacity=".6" />)}</svg></div>;
}

function ScorpionStyles() {
  return <style>{`.scorpion-stage{container-type:inline-size;container-name:scorpion}.scorpion-stage .scorpion-canvas{height:480px;touch-action:pan-y}.scorpion-stage .scorpion-canvas:focus-visible{outline:1px solid #a9b6aa;outline-offset:-10px}.scorpion-stage .scorpion-footer{background:linear-gradient(transparent,#000)}.scorpion-stage .scorpion-button{border:1px solid #ffffff24;border-radius:5px;background:#ffffff06;color:#b7beb8;padding:6px 10px;font:10px ui-monospace,monospace}.scorpion-stage .scorpion-button:hover,.scorpion-stage .scorpion-button[aria-pressed=true]{background:#ffffff15;color:#fff}.scorpion-stage.scorpion-thumbnail{height:100%;min-height:0;display:grid;place-items:center}.scorpion-stage.scorpion-thumbnail svg{display:block;width:100%;height:100%;min-height:0}.scorpion-thumbnail path{transition:d 650ms ease}@media(prefers-reduced-motion:reduce){.scorpion-thumbnail path{transition:none}}@container scorpion (max-width:500px){.scorpion-stage .scorpion-canvas{height:390px}}`}</style>;
}

export { ScorpionCursor };
