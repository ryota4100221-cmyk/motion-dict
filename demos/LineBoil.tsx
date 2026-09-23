"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./LineBoil.module.css";

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

// 1周に使う姿勢の枚数(@keyframes の 0/25/50/75%)
const POSES = 4;
// 無操作のあいだボタンを自動で沸かせる周期(録画・初見でも動きが見えるように)
const AUTO_MS = 1600;

export default function LineBoil({ params }: { params: ParamValues }) {
  const [hovered, setHovered] = useState(false);
  const [touched, setTouched] = useState(false);
  const [auto, setAuto] = useState(true);
  const reduce = useReducedMotion();

  // 一度でも触られたら自動再生は止め、以降は操作だけに従う
  useEffect(() => {
    if (touched || reduce) return;
    const id = window.setInterval(() => setAuto((v) => !v), AUTO_MS);
    return () => window.clearInterval(id);
  }, [touched, reduce]);

  const boiling = touched ? hovered : auto;
  const cycle = POSES / params.fps;

  const vars = {
    "--amp": `${params.amplitude}px`,
    "--rot": `${params.rotation}deg`,
    "--cycle": `${cycle.toFixed(3)}s`,
    // 板は文字より少し遅い周期で回し、2層の姿勢が揃わないようにする
    "--cycle-plate": `${(cycle * 1.25).toFixed(3)}s`,
  } as CSSProperties;

  return (
    <DemoStage hint="PC: ボタンにホバー / スマホ: タップで切替">
      <div className={styles.wrap} style={vars}>
        {/* 常時ボイル: 小さな装飾は止めずに沸かせ続ける */}
        <svg className={`${styles.doodle} ${styles.boil}`} viewBox="0 0 64 64" aria-hidden>
          <path d="M32 6 L38.5 24 L57 25.5 L42.5 37.5 L47.5 56 L32 45.5 L16.5 56 L21.5 37.5 L7 25.5 L25.5 24 Z" />
        </svg>

        {/* hover時だけボイル: 板と文字を別周期・逆再生で震わせる */}
        <button
          type="button"
          className={`${styles.button} ${boiling ? styles.on : ""}`}
          onMouseEnter={() => {
            setTouched(true);
            setHovered(true);
          }}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => {
            setTouched(true);
            setHovered(true);
          }}
          onBlur={() => setHovered(false)}
          onTouchStart={() => {
            setTouched(true);
            setHovered((v) => !v);
          }}
        >
          <span className={styles.plate} aria-hidden />
          <span className={styles.label}>Watch trailer</span>
        </button>

        <span className={styles.caption}>
          {params.fps}fps / {POSES} poses / hold {Math.round(1000 / params.fps)}ms
        </span>
      </div>
    </DemoStage>
  );
}
