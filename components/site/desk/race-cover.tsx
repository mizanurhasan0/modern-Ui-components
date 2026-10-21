import { useId } from "react";
import styles from "./race-cover.module.css";

/** Red/white kerb: a white strip with a red block every 20 units (the top and bottom kerbs are offset by half a period). */
const KERB_X = [0, 20, 40, 60, 80, 100, 120, 140];

/**
 * "Box art" for Desk Racer: a flat-vector, 8:5 night-time road seen from above.
 * Four lanes, red/white kerbs, the blue player car (mint stripe, faint headlight cone), an orange car and a
 * grey truck ahead, coins, speed lines, a chequered finish strip and the title across the top-left.
 *
 * Decorative (aria-hidden). While the parent sets `--cover-play: running` (hover / focus of the trigger) the road
 * dashes and the cars drift; otherwise the animations stay paused. Nothing moves under reduced motion.
 */
export function RaceCover({ className = "" }: { className?: string }) {
  const uid = useId();
  const shoulderId = `${uid}-shoulder`;
  const roadId = `${uid}-road`;
  const beamId = `${uid}-beam`;
  const checkerId = `${uid}-checker`;

  return (
    <svg
      className={`${styles.cover} ${className}`.trim()}
      viewBox="0 0 160 100"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={shoulderId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#93d4a9" />
          <stop offset="1" stopColor="#6db388" />
        </linearGradient>
        <linearGradient id={roadId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#243a6e" />
          <stop offset="1" stopColor="#16264a" />
        </linearGradient>
        <linearGradient id={beamId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff6c7" stopOpacity=".5" />
          <stop offset="1" stopColor="#fff6c7" stopOpacity="0" />
        </linearGradient>
        <pattern id={checkerId} width="5" height="6.75" patternUnits="userSpaceOnUse">
          <rect width="5" height="6.75" fill="#fff" />
          <rect width="2.5" height="3.375" fill="#101c33" />
          <rect x="2.5" y="3.375" width="2.5" height="3.375" fill="#101c33" />
        </pattern>
      </defs>

      {/* shoulders, with a few bushes on the top one */}
      <rect width="160" height="100" fill={`url(#${shoulderId})`} />
      <circle cx="122" cy="9" r="5" fill="#5aa078" />
      <circle cx="140" cy="13" r="4" fill="#5aa078" />
      <circle cx="108" cy="15" r="3" fill="#5aa078" />
      <circle cx="30" cy="93" r="4" fill="#5aa078" />
      <circle cx="96" cy="92" r="5" fill="#5aa078" />
      <circle cx="132" cy="94" r="3.5" fill="#5aa078" />

      {/* kerbs */}
      <rect y="22" width="160" height="5" fill="#fff" />
      <rect y="81" width="160" height="5" fill="#fff" />
      {KERB_X.map((x) => (
        <g key={x} fill="#e2483d">
          <rect x={x} y="22" width="10" height="5" />
          <rect x={x + 10} y="81" width="10" height="5" />
        </g>
      ))}

      {/* road */}
      <rect y="27" width="160" height="54" fill={`url(#${roadId})`} />
      <g className={styles.dashes}>
        <path
          d="M-14 40.5H180M-14 54H180M-14 67.5H180"
          stroke="#fff"
          strokeOpacity=".8"
          strokeWidth="1.3"
          strokeDasharray="8 6"
          fill="none"
        />
      </g>

      {/* chequered finish strip */}
      <rect x="146" y="27" width="10" height="54" fill={`url(#${checkerId})`} />

      {/* coins */}
      <g className={styles.coins}>
        <circle cx="112" cy="33.75" r="4.4" fill="#f2b93c" stroke="#c98f12" strokeWidth="1" />
        <path d="M110 32.2a3 3 0 0 1 3.6-.6" fill="none" stroke="#fff4cf" strokeWidth="1" strokeLinecap="round" />
        <circle cx="128" cy="60.75" r="4.4" fill="#f2b93c" stroke="#c98f12" strokeWidth="1" />
        <path d="M126 59.2a3 3 0 0 1 3.6-.6" fill="none" stroke="#fff4cf" strokeWidth="1" strokeLinecap="round" />
      </g>

      {/* grey truck (lane 4) */}
      <g className={styles.truck}>
        <rect x="66" y="69" width="31" height="10.5" rx="2.5" fill="#d5dbe6" />
        <rect x="69" y="73" width="25" height="1.6" fill="#a9b4c7" />
        <rect x="96" y="69.5" width="15" height="9.5" rx="3.5" fill="#7f8ba3" />
        <path d="M103.5 71.3h4.4l1 2.7-1 2.7h-4.4z" fill="#14233f" />
        <rect x="65.6" y="70" width="1.5" height="2.2" fill="#ff6b5e" />
        <rect x="65.6" y="76.3" width="1.5" height="2.2" fill="#ff6b5e" />
      </g>

      {/* orange car (lane 2) */}
      <g className={styles.orange}>
        <rect x="84" y="42.25" width="25" height="10" rx="4" fill="#ff8a3d" />
        <path d="M97 43.8h5.4l1.6 3.45-1.6 3.45H97z" fill="#14233f" />
        <rect x="83.6" y="43.2" width="1.5" height="2" fill="#ff4d3d" />
        <rect x="83.6" y="49.3" width="1.5" height="2" fill="#ff4d3d" />
      </g>

      {/* speed lines behind the player */}
      <g className={styles.lines} stroke="#fff" strokeLinecap="round" strokeWidth="1.2" strokeOpacity=".5">
        <path d="M6 56.6h18M2 60.75h22M8 64.9h16" fill="none" />
      </g>

      {/* the blue player car (lane 3) with a faint headlight cone */}
      <g className={styles.player}>
        <path d="M57 58.2 98 50.5v20.5L57 63.3z" fill={`url(#${beamId})`} />
        <rect x="30" y="55.5" width="27" height="10.5" rx="4.2" fill="#3a86ff" />
        <rect x="32" y="59.9" width="23" height="1.7" rx=".8" fill="#9be8cf" />
        <path d="M44.5 57.1h6.4l2 3.65-2 3.65h-6.4z" fill="#14233f" />
        <rect x="29.6" y="56.4" width="1.5" height="2.2" fill="#ff6b5e" />
        <rect x="29.6" y="62.9" width="1.5" height="2.2" fill="#ff6b5e" />
        <circle cx="56.4" cy="57.7" r="1.1" fill="#fff6c7" />
        <circle cx="56.4" cy="63.8" r="1.1" fill="#fff6c7" />
      </g>

      {/* title plate, title and mint underline */}
      <rect x="4" y="3.5" width="93" height="17" rx="3.2" fill="#101c33" opacity=".9" />
      <g transform="translate(9.5 14.6) skewX(-12)">
        <text
          x="0"
          y="0"
          fontSize="12.8"
          fontWeight="800"
          letterSpacing=".35"
          fill="#fff"
          style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
        >
          DESK RACER
        </text>
      </g>
      <rect x="9" y="16.6" width="46" height="1.7" rx=".85" fill="#9be8cf" />
    </svg>
  );
}

export default RaceCover;
