"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { components, type ComponentEntry } from "@/lib/component-registry";
import styles from "./cursor-helicopter.module.css";
import { GuideSpeech } from "./guide-speech";
import type { HelicopterMotion } from "./helicopter-scene";
import { createHelicopterLanding, type HelicopterFlightPhase } from "./helicopter-landing";

type ComponentGuide = Pick<ComponentEntry, "slug" | "title" | "description" | "category">;
const guides = new Map<string, ComponentGuide>(components.map(({ slug, title, description, category }) => [slug, { slug, title, description, category }]));
const accents: Record<string, string> = {
  Commerce: "#52c6aa", Carousels: "#b49aee", Navigation: "#69bbf4",
  Playgrounds: "#ff9196", Dashboards: "#a99cff", Portfolio: "#82a9ff",
  Forms: "#edb17b", Social: "#efa1cc",
};
const FOLLOW_QUERY = "(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";
const HOVER_DELAY_MS = 280;
const MESSAGE_COUNT = 6;
const CURSOR_WIDTH = 160;
const CURSOR_HEIGHT = 120;
const BUBBLE_GAP = 9;
const HelicopterModel = dynamic(() => import("./helicopter-model"), { ssr: false });
const supportsFollow = () => window.matchMedia(FOLLOW_QUERY).matches;
const noFollowOnServer = () => false;
function subscribeFollow(change: () => void) {
  const query = window.matchMedia(FOLLOW_QUERY);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
}
const subscribeToNothing = () => () => {};
const supportsVoice = () => "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
const noVoiceOnServer = () => false;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

function createPilotSpeech(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.88;
  utterance.pitch = 1.5;
  utterance.volume = 0.9;
  const voices = window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  const preferred = ["sandy", "flo", "junior", "samantha", "google us english"];
  utterance.voice = preferred.map((name) => voices.find((voice) => voice.name.toLowerCase().includes(name))).find(Boolean)
    ?? voices.find((voice) => voice.lang.toLowerCase() === "en-us" && voice.localService)
    ?? voices[0]
    ?? null;
  return utterance;
}

export function CursorHelicopter({ componentCount }: { componentCount: number }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const motionRef = useRef<HelicopterMotion>({ lookX: 0, lookY: 0, velocityX: 0, velocityY: 0, facing: 1, movedAt: 0, tapAt: 0 });
  const [hasFollowed, setHasFollowed] = useState(false);
  const [phase, setPhase] = useState<HelicopterFlightPhase>("flying");
  const followSupported = useSyncExternalStore(subscribeFollow, supportsFollow, noFollowOnServer);
  const [visible, setVisible] = useState(false);
  const [idle, setIdle] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [guide, setGuide] = useState<ComponentGuide | null>(null);
  const [speakingKey, setSpeakingKey] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState("");
  const voiceSupported = useSyncExternalStore(subscribeToNothing, supportsVoice, noVoiceOnServer);
  const messages = ["Hi, I'm Hasan. Your co-pilot!", "Move left or right. I'll follow.", "Hover a card. Let's explore!", `Explore ${componentCount} live components`, "A little pause. A little flight.", "Click empty space for a happy hop!"];
  const message = messages[messageIndex];
  const announcementKey = phase === "flying" ? guide?.slug ?? (idle ? `intro-${messageIndex}` : "") : "";
  const announcement = guide ? `${guide.title}. ${guide.description}` : idle ? message : "";
  const talking = Boolean((announcementKey && speakingKey === announcementKey) || (voiceEnabled && speakingKey === "voice-preview"));

  useEffect(() => () => {
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const bubble = bubbleRef.current;
    if (!root || !bubble) return;
    const element = root;
    const canFollow = window.matchMedia(FOLLOW_QUERY);
    let frame = 0;
    let idleTimer = 0;
    let guideTimer = 0;
    let scrollTimer = 0;
    let currentX = -240;
    let currentY = -240;
    let targetX = -240;
    let targetY = -240;
    let currentScale = 1;
    let lastFrameAt = 0;
    let hasPosition = false;
    let isVisible = false;
    let isIdle = false;
    let idleCount = 0;
    let currentCard: HTMLElement | null = null;
    let lastPointer: { x: number; y: number } | null = null;
    let directionTravel = 0;
    let bubbleWidth = bubble.offsetWidth;
    let bubbleHeight = bubble.offsetHeight;
    const header = document.querySelector("header");
    let safeTop = Math.max(8, (header?.getBoundingClientRect().bottom ?? 0) + 10);
    const landing = createHelicopterLanding({
      motion: motionRef,
      safeTop: () => safeTop,
      position: () => ({ x: currentX, y: currentY, scale: currentScale }),
      wake,
      show() {
        stopIdle(); clearGuide();
        if (!hasPosition) {
          const goal = landing.target();
          if (goal) { currentX = goal.x + 35; currentY = goal.y - 10; currentScale = goal.scale; }
          hasPosition = true;
          applyPosition();
        }
        if (!isVisible) { isVisible = true; setHasFollowed(true); setVisible(true); }
      },
      phaseChanged(next) {
        setPhase(next);
        if (next === "taking-off") {
          targetX = clamp((lastPointer?.x ?? currentX + 80) - 28, 8, window.innerWidth - CURSOR_WIDTH - 8);
          targetY = clamp((lastPointer?.y ?? currentY + 100) + 22, safeTop, window.innerHeight - CURSOR_HEIGHT - 8);
        }
      },
    });
    motionRef.current.onFootprintChange = () => { if (landing.docked) wake(); };

    function wake() { if (!frame) frame = requestAnimationFrame(animate); }
    function applyPosition() {
      element.style.transform = `translate3d(${currentX.toFixed(1)}px, ${currentY.toFixed(1)}px, 0) scale(${currentScale.toFixed(4)})`;
      const footprint = motionRef.current.footprint;
      if (footprint) {
        element.style.setProperty("--landing-anchor-x", `${footprint.x}px`);
        element.style.setProperty("--landing-anchor-y", `${footprint.y}px`);
      }
    }

    function placeBubble() {
      element.dataset.side = currentX + bubbleWidth > window.innerWidth - 12 ? "left" : "right";
      const below = currentY - safeTop < bubbleHeight + BUBBLE_GAP && window.innerHeight - currentY - CURSOR_HEIGHT - BUBBLE_GAP > currentY - safeTop;
      element.dataset.vertical = below ? "below" : "above";
      const top = below ? currentY + CURSOR_HEIGHT + BUBBLE_GAP : currentY - bubbleHeight - BUBBLE_GAP;
      element.style.setProperty("--bubble-shift-y", `${clamp(top, safeTop, window.innerHeight - bubbleHeight - 8) - top}px`);
      // Keep the wider bubble inside the viewport even while the helicopter catches up.
      const left = element.dataset.side === "left" ? currentX + CURSOR_WIDTH - bubbleWidth : currentX;
      element.style.setProperty("--bubble-shift-x", `${clamp(left, 8, window.innerWidth - bubbleWidth - 8) - left}px`);
    }
    function stopIdle() {
      window.clearTimeout(idleTimer);
      if (isIdle) { isIdle = false; setIdle(false); }
    }
    function clearGuide() {
      window.clearTimeout(guideTimer);
      currentCard = null;
      setGuide((previous) => previous === null ? previous : null);
    }
    function hide() {
      landing.reset();
      stopIdle();
      clearGuide();
      window.clearTimeout(scrollTimer);
      if (isVisible) { isVisible = false; setVisible(false); }
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      hasPosition = false;
      lastFrameAt = 0;
    }
    function leave() { lastPointer = null; hide(); }
    function animate(now: number) {
      const delta = lastFrameAt ? Math.min((now - lastFrameAt) / 1000, .05) : 1 / 60;
      lastFrameAt = now;
      const flightTarget = { x: targetX, y: targetY, scale: 1 };
      const goal = landing.target() ?? flightTarget;
      const amount = 1 - Math.exp(-delta * (landing.docked ? 8 : 13));
      currentX += (goal.x - currentX) * amount;
      currentY += (goal.y - currentY) * amount;
      currentScale += (goal.scale - currentScale) * amount;
      if (Math.hypot(goal.x - currentX, goal.y - currentY) < .3 && Math.abs(goal.scale - currentScale) < .002) {
        currentX = goal.x; currentY = goal.y; currentScale = goal.scale;
      }
      applyPosition();
      placeBubble();
      landing.settle({ x: currentX, y: currentY, scale: currentScale }, flightTarget);
      const next = landing.target() ?? flightTarget;
      const moving = Math.hypot(next.x - currentX, next.y - currentY) > .1 || Math.abs(next.scale - currentScale) > .001;
      frame = moving || landing.phase === "taking-off" ? requestAnimationFrame(animate) : 0;
      if (!frame) lastFrameAt = 0;
    }
    function trackCard(target: Element | null) {
      const card = target?.closest<HTMLElement>("[data-component-guide], a[href^='/components/']") ?? null;
      // Moving within one card must not restart its explanation.
      if (card === currentCard) return;
      clearGuide();
      const slug = card?.dataset.componentGuide ?? card?.getAttribute("href")?.split("/components/")[1]?.split(/[?#]/)[0];
      const next = slug ? guides.get(slug) : null;
      if (!card || !next) return;
      currentCard = card;
      stopIdle();
      element.style.setProperty("--cursor-accent", accents[next.category] ?? "#82a9ff");
      guideTimer = window.setTimeout(() => {
        if (currentCard === card && card.isConnected) {
          setGuide(next);
        }
      }, HOVER_DELAY_MS);
    }
    function follow(x: number, y: number, target: Element | null, movementX = 0, movementY = 0) {
      if (!canFollow.matches || document.hidden) return;
      if (landing.pointer(x, y, target)) { wake(); return; }
      const searchTarget = target?.closest("[data-helicopter-pad='search']");
      if (!searchTarget && target?.closest("[data-cursor-knight-hide], input, textarea, select, [contenteditable='true'], [role='dialog']")) { hide(); return; }
      targetX = clamp(x - CURSOR_WIDTH * .25 + 12, 8, window.innerWidth - CURSOR_WIDTH - 8);
      targetY = clamp(y + 22, safeTop, window.innerHeight - CURSOR_HEIGHT - 8);
      const previous = motionRef.current;
      const moving = Math.abs(movementX) + Math.abs(movementY) > .1;
      let facing = previous.facing;
      if (Math.abs(movementX) > .1 && Math.abs(movementX) > Math.abs(movementY) * .3) {
        directionTravel = Math.sign(directionTravel) === Math.sign(movementX) ? clamp(directionTravel + movementX, -12, 12) : movementX;
        if (Math.abs(directionTravel) >= 6) facing = directionTravel < 0 ? -1 : 1;
      }
      motionRef.current = {
        ...previous,
        lookX: x / window.innerWidth * 2 - 1,
        lookY: y / window.innerHeight * 2 - 1,
        velocityX: moving ? clamp(movementX / 20, -1, 1) : previous.velocityX,
        velocityY: moving ? clamp(movementY / 20, -1, 1) : previous.velocityY,
        facing,
        movedAt: moving ? performance.now() : previous.movedAt,
      };
      element.dataset.facing = facing === -1 ? "left" : "right";
      element.style.setProperty("--fallback-facing", String(facing));
      if (!hasPosition) {
        currentX = targetX; currentY = targetY;
        currentScale = 1;
        applyPosition();
        hasPosition = true;
      }
      if (!isVisible) { isVisible = true; setHasFollowed(true); setVisible(true); }
      stopIdle();
      trackCard(target);
      if (!currentCard) {
        const accent = target?.closest<HTMLElement>("[data-knight-accent]")?.dataset.knightAccent;
        element.style.setProperty("--cursor-accent", accent ?? "#4d80ff");
        if (!target?.closest("a, button, input, label, summary, [role='button'], [role='link'], [data-knight-accent]")) {
          idleTimer = window.setTimeout(() => {
            isIdle = true;
            if (idleCount > 0) setMessageIndex((index) => (index + 1) % MESSAGE_COUNT);
            idleCount += 1;
            setIdle(true);
          }, 1000);
        }
      }
      wake();
    }
    function move(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      const dx = lastPointer ? event.clientX - lastPointer.x : event.movementX;
      const dy = lastPointer ? event.clientY - lastPointer.y : event.movementY;
      lastPointer = { x: event.clientX, y: event.clientY };
      follow(event.clientX, event.clientY, event.target instanceof Element ? event.target : null, dx, dy);
    }
    function play(event: PointerEvent) {
      if (event.pointerType !== "mouse" || event.button !== 0 || !canFollow.matches) return;
      if (event.target instanceof Element && event.target.closest("[data-helicopter-pad='search']")) { landing.focus(event.target); return; }
      if (!isVisible || landing.docked) return;
      if (event.target instanceof Element && event.target.closest("button, a, input, textarea, select, [role='dialog']")) return;
      motionRef.current.tapAt = performance.now();
    }
    function out(event: PointerEvent) {
      if (currentCard && !(event.relatedTarget instanceof Node && currentCard.contains(event.relatedTarget))) clearGuide();
    }
    function scroll() {
      if (landing.docked && landing.refresh()) return;
      hide();
      if (!lastPointer) return;
      scrollTimer = window.setTimeout(() => {
        if (lastPointer) follow(lastPointer.x, lastPointer.y, document.elementFromPoint(lastPointer.x, lastPointer.y));
      }, 160);
    }
    function visibilityChange() { if (document.hidden) leave(); }
    function resized() {
      safeTop = Math.max(8, (header?.getBoundingClientRect().bottom ?? 0) + 10);
      if (landing.docked && landing.refresh()) return;
      hide();
    }
    function focused(event: FocusEvent) {
      if (canFollow.matches && event.target instanceof Element) landing.focus(event.target);
    }
    function blurred(event: FocusEvent) { landing.blur(event.relatedTarget instanceof Element ? event.relatedTarget : null); }
    const observer = new ResizeObserver(() => {
      bubbleWidth = bubble.offsetWidth;
      bubbleHeight = bubble.offsetHeight;
      placeBubble();
    });
    observer.observe(bubble);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", move, { passive: true });
    window.addEventListener("pointerout", out, { passive: true });
    window.addEventListener("pointerdown", play, { passive: true });
    window.addEventListener("blur", leave);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", resized);
    document.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", visibilityChange);
    document.addEventListener("focusin", focused);
    document.addEventListener("focusout", blurred);
    canFollow.addEventListener("change", leave);
    return () => {
      window.clearTimeout(idleTimer);
      window.clearTimeout(guideTimer);
      window.clearTimeout(scrollTimer);
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      landing.dispose();
      motionRef.current.onFootprintChange = undefined;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", move);
      window.removeEventListener("pointerout", out);
      window.removeEventListener("pointerdown", play);
      window.removeEventListener("blur", leave);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", resized);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", visibilityChange);
      document.removeEventListener("focusin", focused);
      document.removeEventListener("focusout", blurred);
      canFollow.removeEventListener("change", leave);
    };
  }, []);

  useEffect(() => {
    if (!idle || guide) return;
    const timer = window.setInterval(() => setMessageIndex((index) => (index + 1) % MESSAGE_COUNT), 4100);
    return () => window.clearInterval(timer);
  }, [idle, guide]);

  useEffect(() => {
    if (!announcementKey || !announcement) return;
    let finishTimer = 0;
    let utterance: SpeechSynthesisUtterance | null = null;
    const startTimer = window.setTimeout(() => {
      if (voiceEnabled && !guide) return;
      if (voiceEnabled && guide && voiceSupported) {
        window.speechSynthesis.cancel();
        utterance = createPilotSpeech(announcement);
        utteranceRef.current = utterance;
        utterance.onstart = () => setSpeakingKey(announcementKey);
        utterance.onend = () => {
          if (utteranceRef.current !== utterance) return;
          utteranceRef.current = null;
          setSpeakingKey("");
        };
        utterance.onerror = (event) => {
          if (utteranceRef.current !== utterance || event.error === "canceled" || event.error === "interrupted") return;
          utteranceRef.current = null;
          setSpeakingKey("");
          setVoiceEnabled(false);
          setVoiceNotice("Voice is unavailable in this browser. The guide continues with text.");
        };
        finishTimer = window.setTimeout(() => {
          if (utteranceRef.current === utterance) {
            window.speechSynthesis.cancel();
            utteranceRef.current = null;
            setSpeakingKey("");
          }
        }, 30000);
        window.speechSynthesis.speak(utterance);
        return;
      }
      setSpeakingKey(announcementKey);
      const duration = clamp(announcement.split(/\s+/).length * 300, 2400, 10000);
      finishTimer = window.setTimeout(() => setSpeakingKey(""), duration);
    }, 0);
    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(finishTimer);
      if (utterance && utteranceRef.current === utterance) {
        utteranceRef.current = null;
        window.speechSynthesis.cancel();
      }
    };
  }, [announcementKey, announcement, guide, voiceEnabled, voiceSupported]);

  function toggleVoice() {
    setVoiceNotice("");
    if (voiceEnabled) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      setSpeakingKey("");
      setVoiceEnabled(false);
      return;
    }
    setVoiceEnabled(true);
    window.speechSynthesis.cancel();
    const preview = createPilotSpeech("Hi! I'm your little co-pilot. Let's explore the projects together!");
    utteranceRef.current = preview;
    preview.onstart = () => setSpeakingKey("voice-preview");
    preview.onend = () => {
      if (utteranceRef.current === preview) {
        utteranceRef.current = null;
        setSpeakingKey("");
      }
    };
    preview.onerror = (event) => {
      if (utteranceRef.current !== preview || event.error === "canceled" || event.error === "interrupted") return;
      utteranceRef.current = null;
      setSpeakingKey("");
      setVoiceEnabled(false);
      setVoiceNotice("Voice is unavailable in this browser. The guide continues with text.");
    };
    window.speechSynthesis.speak(preview);
  }

  return (
    <>
      <div ref={rootRef} className={styles.root} data-visible={visible} data-idle={idle} data-presenting={Boolean(announcementKey)} data-component={guide?.slug} data-talking={talking} data-flight-phase={phase} data-side="right" data-cursor-guide="helicopter" aria-hidden="true">
        <span className={styles.halo} /><span className={styles.ground} />
        <div className={styles.modelStage}>
          {followSupported && hasFollowed && (
            <HelicopterModel active={visible} talking={talking} guideKey={guide?.slug ?? ""} phase={phase} motionRef={motionRef} />
          )}
        </div>
        <div ref={bubbleRef} className={styles.bubble}>
          {announcementKey && <GuideSpeech key={announcementKey} title={guide?.title} text={guide?.description ?? message} category={guide?.category} talking={talking} />}
        </div>
      </div>
      {voiceSupported && followSupported && (
        <button type="button" className={styles.voiceControl} onClick={toggleVoice} aria-pressed={voiceEnabled} aria-label={`${voiceEnabled ? "Turn off" : "Turn on"} pilot baby-style voice`} data-cursor-knight-hide title="A childlike voice reads each project title and description when you hover its card">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z" />{voiceEnabled ? <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /> : <path d="m16 9 5 6m0-6-5 6" />}</svg>
          Pilot voice <span>{voiceEnabled ? "On" : "Off"}</span>
        </button>
      )}
      <span className="sr-only" role="status">{voiceNotice}</span>
    </>
  );
}
