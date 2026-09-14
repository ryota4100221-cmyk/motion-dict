"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./Twinkle.module.css";

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

const MAX_STARS = 160;

// シード付き乱数(mulberry32)。配置をSSRとクライアントで一致させ、毎回同じ夜空にする
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// offsetは周期のずらし係数(-1〜1)、phaseは開始位相(0〜1)、restは静止時の明るさ
const rand = seeded(20260915);
const STARS = Array.from({ length: MAX_STARS }, () => {
  const r = rand();
  return {
    x: rand() * 100,
    y: rand() * 100,
    // 小さい星を多く、大きい星を少なく。一様だと全体がのっぺりする
    size: r < 0.55 ? 1 : r < 0.85 ? 2 : r < 0.96 ? 3 : 4,
    offset: rand() * 2 - 1,
    phase: rand(),
    rest: 0.3 + rand() * 0.6,
    accent: rand() < 0.06,
  };
});

// 流れ星の出発点(%)と、2本目の周期倍率。周期を互いに素に近い比でずらし、毎回同じ場所から出ないようにする
const METEORS = [
  { x: 14, y: 62, ratio: 1, lag: 0.05 },
  { x: 54, y: 84, ratio: 1.45, lag: 0.55 },
];
const TRAVEL_MS = 1100;

export default function Twinkle({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [synced, setSynced] = useState(false);
  const meteorRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const count = Math.round(params.count);
  const shootEvery = params.shootEvery;

  useEffect(() => {
    if (reduce || shootEvery <= 0) return;
    const animations = METEORS.map((m, i) => {
      const el = meteorRefs.current[i];
      if (!el) return null;
      const period = shootEvery * 1000 * m.ratio;
      // 周期の大半は待機。走るのは先頭の TRAVEL_MS だけ
      const end = Math.min(TRAVEL_MS / period, 0.9);
      const anim = el.animate(
        [
          { offset: 0, opacity: 0, transform: "rotate(-35deg) translateX(0)" },
          { offset: end * 0.15, opacity: 1 },
          { offset: end, opacity: 0, transform: "rotate(-35deg) translateX(220px)" },
          { offset: 1, opacity: 0, transform: "rotate(-35deg) translateX(220px)" },
        ],
        { duration: period, iterations: Infinity, easing: "ease-out" }
      );
      anim.currentTime = -period * m.lag + period;
      return anim;
    });
    return () => animations.forEach((a) => a?.cancel());
  }, [reduce, shootEvery]);

  return (
    <DemoStage
      hint="星空は自走 / ボタン: 周期を揃えた比較(NG)に切替"
      className={styles.skyStage}
    >
      <div className={styles.sky} aria-hidden>
        {STARS.slice(0, count).map((star, i) => {
          // 揃えた比較では周期も位相も全点同じ=一斉点滅になる
          const duration = synced
            ? params.duration
            : params.duration * (1 + (params.jitter / 100) * star.offset);
          const style = {
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            "--glow": `${star.size * 2}px`,
            "--rest": star.rest,
            animationDuration: `${duration}s`,
            // 負のdelayで再生済みの状態から開始し、初回表示から位相をばらす
            animationDelay: synced ? "0s" : `${-duration * star.phase}s`,
          } as CSSProperties;

          return (
            <span
              key={synced ? `s${i}` : i}
              className={[
                styles.star,
                star.accent ? styles.starAccent : "",
                reduce ? "" : styles.starOn,
              ]
                .filter(Boolean)
                .join(" ")}
              style={style}
            />
          );
        })}
        {!reduce && shootEvery > 0
          ? METEORS.map((m, i) => (
              <span
                key={i}
                ref={(el) => {
                  meteorRefs.current[i] = el;
                }}
                className={styles.meteor}
                style={{ left: `${m.x}%`, top: `${m.y}%` }}
              />
            ))
          : null}
      </div>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setSynced((s) => !s)}
        aria-pressed={synced}
      >
        {synced ? "周期を揃えた(NG)" : "周期をばらした(OK)"}
      </button>
    </DemoStage>
  );
}
