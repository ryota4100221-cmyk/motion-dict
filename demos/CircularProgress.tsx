"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./CircularProgress.module.css";

// 半径44pxの円周(2πr ≈ 276.5)。dasharray/dashoffsetの基準値
const R = 44;
const C = 2 * Math.PI * R;

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

export default function CircularProgress({ params }: { params: ParamValues }) {
  const [filled, setFilled] = useState(false);
  const [instant, setInstant] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useReducedMotion();

  // 初回表示時に1度だけ自動再生してデモの内容を伝える
  useEffect(() => {
    const kickoff = setTimeout(() => setFilled(true), 400);
    return () => {
      clearTimeout(kickoff);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const play = () => {
    // reduced-motion: アニメーションなしで最終進捗の表示/リセットをトグル
    if (reduce) {
      setFilled((f) => !f);
      return;
    }
    if (!filled) {
      setInstant(false);
      setFilled(true);
      return;
    }
    // 再生済みなら、一度0%に戻してから再描画
    setInstant(true);
    setFilled(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setInstant(false);
      setFilled(true);
    }, 50);
  };

  const shown = filled ? params.progress : 0;

  const arcStyle: CSSProperties = {
    // 円周長 × (1 - 進捗率) だけ「描かない」= 進捗分だけ弧が残る
    strokeDashoffset: C * (1 - shown / 100),
    transition:
      instant || reduce
        ? "none"
        : `stroke-dashoffset ${params.duration}s cubic-bezier(0.16, 1, 0.3, 1)`,
  };

  const labelStyle: CSSProperties = {
    opacity: filled ? 1 : 0,
    transition: instant || reduce ? "none" : `opacity ${params.duration}s ease-out`,
  };

  return (
    <DemoStage hint="PLAY: 進捗の描画を再生">
      <div className={styles.wrap}>
        {/* svgごと-90deg回転させて弧を12時始まりにする(トラックは真円なので影響なし) */}
        <svg className={styles.svg} width="120" height="120" viewBox="0 0 120 120">
          <circle className={styles.track} cx="60" cy="60" r={R} />
          <circle
            className={styles.arc}
            cx="60"
            cy="60"
            r={R}
            strokeDasharray={C}
            style={arcStyle}
          />
        </svg>
        <span className={styles.label} style={labelStyle}>
          {Math.round(params.progress)}%
        </span>
      </div>
      <button className={styles.playBtn} onClick={play}>
        {filled ? "REPLAY" : "PLAY"}
      </button>
    </DemoStage>
  );
}
