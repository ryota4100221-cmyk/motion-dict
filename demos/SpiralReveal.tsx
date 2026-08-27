"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./SpiralReveal.module.css";

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

const COLS = 3;
const ROWS = 3;
const COUNT = COLS * ROWS;

// 軌道が非線形なのでCSSのkeyframes 2点では表現できない。
// tを等間隔でサンプリングし、その座標列をWAAPIに渡す(rAFは回さない)
const SAMPLES = 28;

// expo.out相当。回りながら減速して«吸い付く»着地にする
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

// 最終位置からのズレを極座標で持つ。
// t: 0→1 で 距離 radius→0、角度は turns回転ぶん戻る = 軌道が渦になる
function spiralKeyframes(baseAngle: number, radius: number, turns: number): Keyframe[] {
  const frames: Keyframe[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const p = i / SAMPLES;
    const t = easeOutExpo(p); // イージングはサンプリング側に掛ける
    const dist = radius * (1 - t);
    const angle = baseAngle + turns * Math.PI * 2 * (1 - t);
    frames.push({
      offset: p,
      transform: `translate(${(Math.cos(angle) * dist).toFixed(2)}px, ${(
        Math.sin(angle) * dist
      ).toFixed(2)}px) scale(${(0.4 + 0.6 * t).toFixed(3)})`,
      opacity: Math.min(1, t * 3).toFixed(3),
    });
  }
  return frames;
}

export default function SpiralReveal({ params }: { params: ParamValues }) {
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const animsRef = useRef<Animation[]>([]);
  const loopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useReducedMotion();

  const play = useCallback(() => {
    // 前回の再生を止めてから撃ち直す(スライダー連打でも溜まらない)
    animsRef.current.forEach((a) => a.cancel());
    animsRef.current = [];
    if (reduce) return;

    itemsRef.current.forEach((el, i) => {
      if (!el) return;
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      // 開始角度はグリッド中心から自分の枠へ向かう方向。
      // こうすると渦が中心から巻き取られるように読める(中央の1枚だけ真上から)
      const dx = col - (COLS - 1) / 2;
      const dy = row - (ROWS - 1) / 2;
      const baseAngle = dx === 0 && dy === 0 ? -Math.PI / 2 : Math.atan2(dy, dx);

      const anim = el.animate(
        spiralKeyframes(baseAngle, params.radius, params.turns),
        {
          duration: params.duration * 1000,
          delay: i * params.stagger * 1000,
          easing: "linear", // イージングは既にサンプリング済み
          fill: "both",
        }
      );
      animsRef.current.push(anim);
    });
  }, [params.radius, params.turns, params.duration, params.stagger, reduce]);

  // パラメータが変わるたびに撃ち直し、そのあとは自動でループ再生する。
  // 無操作でも動き続けるので、ループ動画にしたときも静止画にならない
  useEffect(() => {
    if (reduce) {
      animsRef.current.forEach((a) => a.cancel());
      animsRef.current = [];
      return;
    }
    const cycle = params.duration * 1000 + COUNT * params.stagger * 1000 + 1100;
    const tick = () => {
      play();
      loopRef.current = setTimeout(tick, cycle);
    };
    tick();
    return () => {
      if (loopRef.current) clearTimeout(loopRef.current);
      animsRef.current.forEach((a) => a.cancel());
      animsRef.current = [];
    };
  }, [play, reduce, params.duration, params.stagger]);

  return (
    <DemoStage hint="自動で繰り返し再生 / Replayで撃ち直し（タップも可）">
      <div
        className={styles.grid}
        onClick={play}
        onTouchStart={play}
        data-reduce={reduce ? "on" : undefined}
      >
        {Array.from({ length: COUNT }, (_, i) => (
          <div
            key={i}
            className={styles.cell}
            ref={(el) => {
              itemsRef.current[i] = el;
            }}
          >
            <span className={styles.thumb} />
          </div>
        ))}
      </div>
      <button className={styles.playBtn} onClick={play} type="button">
        Replay
      </button>
    </DemoStage>
  );
}
