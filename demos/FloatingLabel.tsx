"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./FloatingLabel.module.css";

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

export default function FloatingLabel({ params }: { params: ParamValues }) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");
  const reduce = useReducedMotion();

  // フォーカス中 or 値が入っていれば浮かせたまま(記入済み判定)
  const floated = focused || value.length > 0;

  const labelStyle: CSSProperties = {
    transform: floated
      ? `translateY(-${params.rise}px) scale(${params.scale})`
      : "translateY(0) scale(1)",
    color: floated ? "var(--ai)" : "rgba(216, 212, 200, 0.55)",
    // reduced-motion時はアニメーションなしで即時切り替え
    transitionDuration: reduce ? "0s" : `${params.duration}s`,
  };

  return (
    <DemoStage hint="PC / スマホ: 入力欄をタップして文字を入力">
      <div className={styles.field}>
        <input
          id="floating-label-demo"
          className={styles.input}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete="off"
        />
        <label
          htmlFor="floating-label-demo"
          className={styles.label}
          style={labelStyle}
        >
          Your name
        </label>
      </div>
    </DemoStage>
  );
}
