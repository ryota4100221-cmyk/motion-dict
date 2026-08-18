"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./FlickerOn.module.css";

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

// 区間の長さの不揃い。乱数だと再生のたびに質が変わってスライダーの効きが読めないので、
// 固定テーブルを頭から使う(足りなければ折り返す)
const JITTER = [1.6, 0.5, 1.15, 0.4, 0.85, 0.35, 1.35, 0.45, 0.7, 0.3, 1, 0.4];

// opacityの「段」を組み立てる。肝は2つ:
//   1. 各区間を steps(1, end) で保持し、中間の半透明を作らない(フェードにしない)
//   2. 落ち込みは回を追うごとに浅く、区間は後半ほど短く = 電圧が安定していく因果
function flickerKeyframes(flickers: number, dim: number): Keyframe[] {
  // 消灯 →(点く→落ちる)×flickers→ 点いたまま
  const levels = [0];
  for (let i = 0; i < flickers; i++) {
    levels.push(1);
    // i=0 が最も深い落ち込み。以降は浅くなっていく
    levels.push(dim + (1 - dim) * (i / flickers) * 0.7);
  }
  levels.push(1);

  const widths = levels
    .slice(0, -1)
    .map((_, i) => JITTER[i % JITTER.length] * (1 - (i / levels.length) * 0.55));
  const total = widths.reduce((a, b) => a + b, 0);

  const frames: Keyframe[] = [];
  let acc = 0;
  for (let i = 0; i < levels.length; i++) {
    frames.push({
      // 最終フレームは丸め誤差を持ち込まず1に固定する
      offset: i === levels.length - 1 ? 1 : acc / total,
      opacity: levels[i],
      // この区間はこの値のまま保持し、区間の終わりで次の値へ飛ぶ
      easing: "steps(1, end)",
    });
    if (i < widths.length) acc += widths[i];
  }
  return frames;
}

export default function FlickerOn({ params }: { params: ParamValues }) {
  const signRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation | null>(null);
  const reduce = useReducedMotion();

  const play = useCallback(() => {
    const el = signRef.current;
    if (!el) return;
    animRef.current?.cancel();
    // reduced-motion: 明滅させず、フェードだけで点灯した状態にする
    if (reduce) {
      animRef.current = el.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 200,
        fill: "both",
      });
      return;
    }
    animRef.current = el.animate(
      flickerKeyframes(Math.round(params.flickers), params.dim),
      // fill: "both" が無いと点灯し切った直後に opacity: 0 へ戻る
      { duration: params.duration * 1000, fill: "both" }
    );
  }, [params.duration, params.flickers, params.dim, reduce]);

  // マウント時と、スライダーを動かすたびに点け直す(数値の効きがその場で分かる)
  useEffect(() => {
    play();
  }, [play]);

  useEffect(() => {
    const anim = animRef;
    return () => anim.current?.cancel();
  }, []);

  return (
    <DemoStage hint="PC: 看板をクリックで点け直す / スマホ: タップ(スライダー操作でも再生)">
      <div
        className={styles.board}
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
        {/* 発光はCSS変数で渡す。glowはCSSだけで効くので再生し直す必要がない */}
        <div
          ref={signRef}
          className={styles.sign}
          style={{ "--glow": `${params.glow}px` } as CSSProperties}
        >
          OPEN
        </div>
      </div>
    </DemoStage>
  );
}
