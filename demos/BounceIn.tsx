"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./BounceIn.module.css";

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

// 落下→接地→減衰しながらbounces回跳ねる、のキーフレームを組み立てる。
// 肝は2つ:
//   1. 上りはease-out・下りはease-inと区間ごとにイージングを反転する(重力の見え方)
//   2. 区間の長さは跳ねの高さの平方根に比例させる(自由落下の時間 t ∝ √h)
// 高さを等間隔で刻むと、跳ねではなくゴム紐の往復に見える。
function bounceKeyframes(
  height: number,
  bounces: number,
  damping: number
): Keyframe[] {
  // 各山の高さ: 最初の落下が height、以降は damping 倍ずつ減衰
  const peaks = [height];
  for (let i = 0; i < bounces; i++) {
    peaks.push(peaks[peaks.length - 1] * damping);
  }

  // 区間: [最初の落下] + 各跳ねの[上り][下り]
  const segments = [Math.sqrt(peaks[0])];
  for (let i = 1; i < peaks.length; i++) {
    segments.push(Math.sqrt(peaks[i]), Math.sqrt(peaks[i]));
  }
  const total = segments.reduce((a, b) => a + b, 0);

  // easing はその区間の「始点」のキーフレームに書く(WAAPIの規約)
  const frames: Keyframe[] = [
    { offset: 0, transform: `translateY(${-peaks[0]}px)`, easing: "ease-in" },
  ];
  let acc = 0;
  for (let i = 0; i < segments.length; i++) {
    acc += segments[i];
    const offset = Math.min(acc / total, 1);
    const grounded = i % 2 === 0; // 偶数区間の終端 = 接地、奇数区間の終端 = 山の頂点
    frames.push({
      offset,
      // 奇数区間 i の頂点は peaks[(i+1)/2](i=1→peaks[1], i=3→peaks[2] …)
      transform: grounded
        ? "translateY(0)"
        : `translateY(${-peaks[(i + 1) / 2]}px)`,
      // 次の区間のイージング。接地の次は上り(ease-out)、頂点の次は下り(ease-in)
      easing: grounded ? "ease-out" : "ease-in",
    });
  }
  return frames;
}

export default function BounceIn({ params }: { params: ParamValues }) {
  const badgeRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const play = useCallback(() => {
    const el = badgeRef.current;
    if (!el) return;
    // reduced-motion: 跳ねを完全に止め、フェードインだけで登場させる
    if (reduce) {
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
      return;
    }
    el.animate(
      bounceKeyframes(params.height, Math.round(params.bounces), params.damping),
      { duration: params.duration * 1000 }
    );
  }, [params.height, params.bounces, params.damping, params.duration, reduce]);

  // マウント時と、スライダーを動かすたびに撃ち直す(数値の効きがその場で分かる)
  useEffect(() => {
    play();
  }, [play]);

  return (
    <DemoStage hint="PC: バッジをクリックで再生 / スマホ: タップ(スライダー操作でも再生)">
      <div className={styles.floor}>
        <div
          ref={badgeRef}
          className={styles.badge}
          onClick={play}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              play();
            }
          }}
        >
          NEW
        </div>
        {/* 接地面。ここに落ちてくることが分かると跳ねが読みやすい */}
        <div className={styles.ground} aria-hidden="true" />
      </div>
    </DemoStage>
  );
}
