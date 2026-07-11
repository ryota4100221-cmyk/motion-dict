"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./PressFeedback.module.css";

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

export default function PressFeedback({ params }: { params: ParamValues }) {
  const [pressed, setPressed] = useState(false);
  const reduce = useReducedMotion();

  // 入りは0.05sで瞬時、戻りはrelease。この非対称が「押した感」を作る
  const btnStyle: CSSProperties = reduce
    ? {
        // reduced-motion: transformを使わず背景の即時変化のみで押下を伝える
        background: pressed ? "rgba(233, 233, 227, 0.18)" : "transparent",
        transition: "none",
      }
    : {
        transform: pressed
          ? `translateY(${params.depth}px) scale(${params.scale})`
          : "translateY(0) scale(1)",
        transitionDuration: pressed ? "0.05s" : `${params.release}s`,
      };

  return (
    <DemoStage hint="PC: ボタンを押し込む / スマホ: 長押し">
      <button
        className={styles.btn}
        style={btnStyle}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
      >
        Press me
      </button>
    </DemoStage>
  );
}
