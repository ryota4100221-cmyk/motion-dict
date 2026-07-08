"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ClipReveal.module.css";

// content/clip-reveal.ts の direction options と同順(現れる方向)
const DIRECTIONS = ["left", "up", "center"] as const;

// 隠れているときの clip-path。inset(0)へ開くと各方向のリビールになる
const HIDDEN_CLIP: Record<(typeof DIRECTIONS)[number], string> = {
  left: "inset(0 100% 0 0)", // 左端から右へ開く
  up: "inset(100% 0 0 0)", // 下端から上へ開く
  center: "inset(50%)", // 中心の一点から四方へ開く
};

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

export default function ClipReveal({ params }: { params: ParamValues }) {
  const [revealed, setRevealed] = useState(false);
  const [instant, setInstant] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const dir = DIRECTIONS[Math.round(params.direction)] ?? "left";

  const play = () => {
    // reduced-motion: クリップなしで即表示/即非表示のトグル
    if (reduce) {
      setRevealed((r) => !r);
      return;
    }
    if (!revealed) {
      setInstant(false);
      setRevealed(true);
      return;
    }
    // 再生済みなら、一度隠してから再リビール
    setInstant(true);
    setRevealed(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setInstant(false);
      setRevealed(true);
    }, 50);
  };

  const imgStyle: CSSProperties = {
    clipPath: revealed ? "inset(0 0 0 0)" : HIDDEN_CLIP[dir],
    transition:
      instant || reduce
        ? "none"
        : `clip-path ${params.duration}s cubic-bezier(0.16, 1, 0.3, 1)`,
  };

  return (
    <DemoStage hint="PLAY: リビールを再生">
      <div className={styles.frame}>
        <div className={styles.img} style={imgStyle} />
      </div>
      <button className={styles.playBtn} onClick={play}>
        {revealed ? "REPLAY" : "PLAY"}
      </button>
    </DemoStage>
  );
}
