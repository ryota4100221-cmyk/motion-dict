"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./SquashStretch.module.css";

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

// 跳ぶ高さと滞空時間は固定。この項目で見せたいのは軌道ではなく変形なので、
// スライダーは潰れ/伸び/戻り方だけを動かす。
const HOP = 96; // 頂点の高さ(px)
const AIR = 0.66; // 踏み切りから着地までの時間(s)
const IDLE_GAP = 2400; // 無操作のとき自動で跳ばす間隔(ms)

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

// ジャンプ1回分のキーフレーム。肝は2つ:
//   1. 体積保存 — scaleY を s 倍にしたら scaleX は 1/s 倍にする(preserve=false は
//      その比較用で、scaleX にも同じ s を掛ける = ただの拡大縮小になる)
//   2. 速度と変形量の連動 — 速い区間だけ伸ばし、頂点(速度ゼロ)では 1.0 に戻す
function hopKeyframes(
  squash: number,
  stretch: number,
  recover: number,
  overshoot: number,
  preserve: boolean
): Keyframe[] {
  const down = 1 - squash; // 潰れたときの scaleY
  const up = 1 + stretch; // 伸びたときの scaleY
  const over = 1 + overshoot; // 戻りで行き過ぎるときの scaleY
  const total = AIR + recover;

  const tf = (y: number, sy: number) =>
    `translateY(${y}px) scale(${preserve ? 1 / sy : sy}, ${sy})`;
  const at = (t: number) => Math.min(t / total, 1);

  return [
    { offset: 0, transform: tf(0, 1), easing: "ease-in" },
    // 予備動作。跳ぶ前に一度潰しておくと力の入り方が伝わる
    { offset: at(0.1), transform: tf(0, down), easing: "ease-out" },
    // 踏み切り直後 = 速度最大。ここで伸びる
    { offset: at(0.2), transform: tf(-HOP * 0.38, up), easing: "ease-out" },
    // 頂点は速度ゼロ。変形を必ず 1.0 に戻す
    { offset: at(0.38), transform: tf(-HOP, 1), easing: "ease-in" },
    { offset: at(0.56), transform: tf(-HOP * 0.38, up), easing: "ease-in" },
    // 着地の衝撃で潰れる
    { offset: at(AIR), transform: tf(0, down), easing: "ease-out" },
    // 戻る途中で逆向きに行き過ぎてから収める
    {
      offset: at(AIR + recover * 0.45),
      transform: tf(0, over),
      easing: "ease-in-out",
    },
    { offset: 1, transform: tf(0, 1) },
  ];
}

export default function SquashStretch({ params }: { params: ParamValues }) {
  const okRef = useRef<HTMLDivElement>(null);
  const ngRef = useRef<HTMLDivElement>(null);
  const touchedRef = useRef(false);
  const lastInputRef = useRef(0);
  const reduce = useReducedMotion();

  const play = useCallback(() => {
    const squash = params.squash / 100;
    const stretch = params.stretch / 100;
    const overshoot = params.overshoot / 100;
    const recover = params.recover;
    const duration = (AIR + recover) * 1000;

    for (const [el, preserve] of [
      [okRef.current, true],
      [ngRef.current, false],
    ] as const) {
      if (!el) continue;
      // reduced-motion: 跳躍も変形も止め、短いフェードだけで反応を返す
      if (reduce) {
        el.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 200 });
        continue;
      }
      el.animate(hopKeyframes(squash, stretch, recover, overshoot, preserve), {
        duration,
      });
    }
  }, [
    params.squash,
    params.stretch,
    params.recover,
    params.overshoot,
    reduce,
  ]);

  // マウント時と、スライダーを動かすたびに撃ち直す(数値の効きがその場で分かる)
  useEffect(() => {
    play();
  }, [play]);

  // 無操作でも自走させる(ループ動画がクリック待ちの静止画になるのを防ぐ)。
  // 時刻は rAF から渡る time だけで扱う。
  useEffect(() => {
    if (reduce) return;
    return addTick((time) => {
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInputRef.current = time;
        return;
      }
      if (lastInputRef.current === 0) {
        lastInputRef.current = time;
        return;
      }
      if (time - lastInputRef.current >= IDLE_GAP) {
        lastInputRef.current = time;
        play();
      }
    });
  }, [play, reduce]);

  const replay = () => {
    touchedRef.current = true;
    play();
  };

  return (
    <DemoStage hint="PC: ステージをクリックで再生 / スマホ: タップ(無操作でも自動で跳ねる)">
      <div
        className={styles.rig}
        onClick={replay}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            replay();
          }
        }}
      >
        <div className={styles.lane}>
          <div className={styles.pit}>
            <div ref={okRef} className={`${styles.chip} ${styles.ok}`}>
              JUMP
            </div>
          </div>
          {/* 接地面。ここに落ちてくることが分かると潰れが読みやすい */}
          <div className={styles.ground} aria-hidden="true" />
          <span className={styles.label}>体積保存あり(scaleX = 1 / scaleY)</span>
        </div>

        {/* 比較用。scaleX にも同じ値を掛けた「ただの拡大縮小」 */}
        <div className={styles.lane}>
          <div className={styles.pit}>
            <div ref={ngRef} className={`${styles.chip} ${styles.ng}`}>
              JUMP
            </div>
          </div>
          <div className={styles.ground} aria-hidden="true" />
          <span className={styles.label}>一様スケール(scaleX = scaleY)</span>
        </div>
      </div>
    </DemoStage>
  );
}
