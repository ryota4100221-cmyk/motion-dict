"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./EqualizerBars.module.css";

// 本ごとの周期のずれ(基準に対する倍率オフセット)。乱数だとSSRと初回描画がずれるため固定値
const OFFSETS = [
  0, -0.8, 0.5, -0.35, 0.9, -0.6, 0.25, -1, 0.7, -0.2, 0.45, -0.55,
];
// 本ごとの上端の高さ。全本が天井まで届くと上辺が横一線に揃って見える
const PEAKS = [
  1, 0.82, 0.95, 0.7, 1, 0.86, 0.74, 0.92, 0.78, 1, 0.68, 0.88,
];

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

export default function EqualizerBars({ params }: { params: ParamValues }) {
  const [playing, setPlaying] = useState(true);
  const reduce = useReducedMotion();

  const count = Math.round(params.bars);
  const bars = Array.from({ length: count }, (_, i) => {
    // 基準周期 ± spread%。オフセットが本ごとに違うので上下が揃わない
    const dur =
      params.speed * (1 + (OFFSETS[i % OFFSETS.length] * params.spread) / 100);
    return {
      "--dur": `${Math.round(dur)}ms`,
      "--floor": `${params.floor / 100}`,
      "--peak": `${PEAKS[i % PEAKS.length]}`,
    } as CSSProperties;
  });

  // reduced-motion時は再生中でも動かさず、高さ違いのまま静止させる
  const barsClass = [
    styles.bars,
    playing && !reduce ? styles.playing : "",
    playing && reduce ? styles.frozen : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <DemoStage hint="PC: クリックで再生/停止 / スマホ: タップ">
      <button
        className={styles.player}
        aria-pressed={playing}
        onClick={() => setPlaying((p) => !p)}
      >
        <span className={styles.icon} aria-hidden>
          {playing ? "❚❚" : "▶"}
        </span>
        <span className={barsClass} aria-hidden>
          {bars.map((style, i) => (
            <span key={i} className={styles.bar}>
              <span className={styles.fill} style={style} />
            </span>
          ))}
        </span>
        <span className={styles.label}>
          {playing ? "Now playing" : "Paused"}
        </span>
      </button>
    </DemoStage>
  );
}
