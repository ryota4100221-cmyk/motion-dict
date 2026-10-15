"use client";

import { useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./Snowfall.module.css";

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

const MAX_FLAKES = 120;

// シード付き乱数(mulberry32)。配置をSSRとクライアントで一致させ、毎回同じ降り方にする
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// zは奥行き(0=奥〜1=手前)。fallPhase/swayPhaseは開始位相、restYは静止時の高さ(%)
const rand = seeded(20261016);
const FLAKES = Array.from({ length: MAX_FLAKES }, () => ({
  x: rand() * 100,
  // 奥の粒を多く、手前の粒を少なく。一様だと手前の大粒が画面を埋める
  z: Math.pow(rand(), 1.6),
  fallPhase: rand(),
  swayPhase: rand(),
  restY: 4 + rand() * 88,
}));

// 出典(titzmachproject.com)の実測レンジ。直径2.6〜6.7px・不透明度0.31〜0.88・揺れ周期2.6〜4.9s
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function Snowfall({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const count = Math.round(params.count);
  const depth = params.depth / 100;

  return (
    <DemoStage hint="雪は自走 / depthを0にすると奥行きのない水玉(NG)" className={styles.snowStage}>
      <div className={styles.scene} aria-hidden>
        <div className={styles.ridge} />
        <div className={styles.snow}>
          {FLAKES.slice(0, count).map((f, i) => {
            // depth 0 では全粒を中間の z に寄せる=大きさも速さも揃う
            const z = lerp(0.5, f.z, depth);
            const fall = params.duration * lerp(1.3, 0.7, z);
            const swayDur = lerp(4.9, 2.6, z);
            const outer = {
              left: `${f.x}%`,
              "--op": lerp(0.3, 0.9, z).toFixed(2),
              animationDuration: `${fall}s`,
              // 負のdelayで再生済みから始め、初回表示から全粒を空中に散らす
              animationDelay: `${-fall * f.fallPhase}s`,
              ...(reduce ? { top: `${f.restY}%`, opacity: lerp(0.3, 0.9, z) } : null),
            } as CSSProperties;
            const inner = {
              "--d": `${lerp(2.5, 6.5, z).toFixed(1)}px`,
              "--sw": `${(params.sway * lerp(0.3, 1, z)).toFixed(1)}px`,
              animationDuration: `${swayDur}s`,
              animationDelay: `${-swayDur * f.swayPhase}s`,
            } as CSSProperties;

            return (
              <i key={i} className={reduce ? styles.flake : `${styles.flake} ${styles.fallOn}`} style={outer}>
                <b className={reduce ? styles.dot : `${styles.dot} ${styles.swayOn}`} style={inner} />
              </i>
            );
          })}
        </div>
      </div>
    </DemoStage>
  );
}
