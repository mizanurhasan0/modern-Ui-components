"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { createHelicopterScene, type HelicopterController, type HelicopterMotion, type HelicopterState } from "./helicopter-scene";
import styles from "./helicopter-model.module.css";

type Props = HelicopterState & { motionRef: RefObject<HelicopterMotion> };

/** Loaded after the first eligible pointer interaction, independently of the gallery. */
export default function HelicopterModel({ active, talking, guideKey, phase, motionRef }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<HelicopterController | null>(null);
  const stateRef = useRef({ active, talking, guideKey, phase });
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => {
    const next = { active, talking, guideKey, phase };
    stateRef.current = next;
    controllerRef.current?.setState(next);
  }, [active, talking, guideKey, phase]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const request = new AbortController();
    let disposed = false;
    const fallback = () => {
      if (disposed) return;
      controllerRef.current?.dispose();
      controllerRef.current = null;
      motionRef.current.footprint = { x: 79, y: 97, top: 25 };
      motionRef.current.onFootprintChange?.();
      setStatus("fallback");
    };
    createHelicopterScene(host, motionRef, request.signal, fallback).then((controller) => {
      if (disposed) { controller.dispose(); return; }
      controllerRef.current = controller;
      controller.setState(stateRef.current);
      setStatus("ready");
    }).catch(() => { if (!request.signal.aborted) fallback(); });
    return () => {
      disposed = true;
      request.abort();
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, [motionRef]);

  return (
    <div className={styles.root} data-renderer={status === "ready" ? "webgl" : status} data-active={active} data-phase={phase}>
      <div ref={hostRef} className={styles.canvas} />
      {status !== "ready" && (
        <svg className={styles.fallback} viewBox="0 0 160 120" fill="none" focusable="false" aria-hidden="true">
          <path d="M35 63 12 56" stroke="#343c48" strokeWidth="7" strokeLinecap="round" />
          <circle cx="12" cy="55" r="7" stroke="#68dcb4" strokeWidth="3" />
          <path d="m59 83-3 12h43l7-5" stroke="#242e3b" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="79" cy="65" rx="34" ry="27" fill="#293340" />
          <path d="M74 39c24 0 39 12 39 27H74V39Z" fill="#d3f0eb" />
          <path d="M77 37V29" stroke="#293340" strokeWidth="4" />
          <ellipse className={styles.rotor} cx="77" cy="28" rx="48" ry="3" fill="#65d9af" />
          <path d="M88 65V54" stroke="#414a56" strokeWidth="13" />
          <circle cx="88" cy="50" r="7" fill="#c79575" />
          <path d="M82 47c0-8 14-8 14 0" fill="#292422" />
          <path d="M83 53q5 6 10 0" stroke="#292422" strokeWidth="2" />
        </svg>
      )}
    </div>
  );
}
