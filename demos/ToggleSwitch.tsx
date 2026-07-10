"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ToggleSwitch.module.css";

// content/toggle-switch.ts の overshoot options と同順
const EASES = [
  "cubic-bezier(0.22, 1, 0.36, 1)", // なし(ease-out)
  "cubic-bezier(0.34, 1.56, 0.64, 1)", // あり(back ease)
] as const;

const TRAVEL = 32; // ノブの移動量(track 72px - knob 32px - padding 8px)

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCE_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCE_QUERY).matches,
    () => false
  );
}

export default function ToggleSwitch({ params }: { params: ParamValues }) {
  const [on, setOn] = useState(false);
  const reduce = useReducedMotion();

  const duration = params.duration;
  const ease = EASES[Math.round(params.overshoot)] ?? EASES[1];

  // ノブ移動と色遷移を同じdurationで同期させる(色はease-outのまま)
  const trackStyle: CSSProperties = {
    background: on ? "var(--ai)" : "#2b2b26",
    transition: reduce ? "none" : `background-color ${duration}s ease-out`,
  };

  const knobStyle: CSSProperties = {
    transform: on ? `translateX(${TRAVEL}px)` : "translateX(0)",
    background: on ? "var(--sumi)" : "var(--code-fg)",
    // reduced-motion: アニメーションなしで即時切り替え
    transition: reduce
      ? "none"
      : `transform ${duration}s ${ease}, background-color ${duration}s ease-out`,
  };

  return (
    <DemoStage hint="PC: クリックで切替 / スマホ: タップ">
      <button
        className={styles.wrap}
        role="switch"
        aria-checked={on}
        onClick={() => setOn((o) => !o)}
      >
        <span className={styles.track} style={trackStyle}>
          <span className={styles.knob} style={knobStyle} />
        </span>
        <span className={styles.label}>{on ? "ON" : "OFF"}</span>
      </button>
    </DemoStage>
  );
}
