"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ConicSweep.module.css";

// content/conic-sweep.ts の mode options と同順: 0=chase, 1=spin
const MODES = ["chase", "spin"] as const;

export default function ConicSweep({ params }: { params: ParamValues }) {
  const [paused, setPaused] = useState(false);
  const mode = MODES[Math.round(params.mode)] ?? "chase";

  // 数値はすべてCSS変数で渡す。角度も太さもCSS側で補間されるので、
  // スライダーを動かしてもアニメーションを作り直す必要がない
  const vars = {
    "--cs-dur": `${params.duration}s`,
    "--cs-arc": `${Math.round(params.arc)}deg`,
    "--cs-thick": `${Math.round(params.thickness)}px`,
  } as CSSProperties;

  const arcClass = [
    styles.arc,
    mode === "spin" ? styles.spin : styles.chase,
    paused ? styles.paused : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <DemoStage hint="PC: クリックで一時停止 / スマホ: タップ(スライダー操作でも数値が効く)">
      <div
        className={styles.ring}
        style={vars}
        onClick={() => setPaused((p) => !p)}
        role="button"
        aria-pressed={paused}
        aria-label="円弧スイープを一時停止"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setPaused((p) => !p);
          }
        }}
      >
        <div className={styles.track} />
        <div className={arcClass} />
        <span className={styles.label}>{mode}</span>
      </div>
    </DemoStage>
  );
}
