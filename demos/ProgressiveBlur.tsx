"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ProgressiveBlur.module.css";

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

// content/progressive-blur.ts の options と同順
const EDGES = ["bottom", "top"] as const;

const LINES = [
  "01 — anticipation",
  "02 — follow through",
  "03 — overlapping action",
  "04 — slow in slow out",
  "05 — arc",
  "06 — secondary action",
  "07 — timing",
  "08 — exaggeration",
  "09 — solid drawing",
  "10 — appeal",
  "11 — staging",
  "12 — squash and stretch",
];

export default function ProgressiveBlur({ params }: { params: ParamValues }) {
  const edge = EDGES[Math.round(params.edge)] ?? "bottom";
  const reduce = useReducedMotion();

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(true);

  // 「ぼかす側にまだスクロールの余りがあるか」を見て帯を出し入れする。
  // 端まで来たら消えることで終端が伝わる(スクロールアフォーダンス)
  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const remaining =
      edge === "bottom"
        ? el.scrollHeight - el.clientHeight - el.scrollTop
        : el.scrollTop;
    setActive(remaining > 4);
  }, [edge]);

  useEffect(() => {
    update();
  }, [update]);

  const count = Math.round(params.layers);
  const dir = edge === "bottom" ? "to bottom" : "to top";

  // 端に近い層ほど強くぼかす(二次カーブ)。層はすべて重なるので、
  // 端に向かってぼかしが累積し1枚では作れない勾配になる
  const layers = Array.from({ length: count }, (_, i) => {
    const blur = Math.max(1, params.maxBlur * ((i + 1) / count) ** 2);
    // 内側transparent→端側不透明。開始位置を層ごとに 1/count ずつ端へ寄せる
    const from = (i / count) * 100;
    const to = ((i + 1) / count) * 100;
    const mask = `linear-gradient(${dir}, transparent ${from}%, #000 ${to}%)`;
    return {
      backdropFilter: `blur(${blur.toFixed(2)}px)`,
      WebkitBackdropFilter: `blur(${blur.toFixed(2)}px)`,
      maskImage: mask,
      WebkitMaskImage: mask,
    } satisfies CSSProperties;
  });

  const veilStyle: CSSProperties = {
    height: `${params.height}%`,
    [edge === "bottom" ? "bottom" : "top"]: 0,
    opacity: active ? 1 : 0,
    // reduced-motion時は出し入れのトランジションを止める(段階ぼかし自体は静的なので残す)
    transitionDuration: reduce ? "0s" : "0.35s",
  };

  const scrimStyle: CSSProperties = {
    background: `linear-gradient(${dir}, transparent 0%, var(--sumi) 92%)`,
  };

  return (
    <DemoStage
      hint="PC: 枠内をスクロール / スマホ: 枠内を上下スワイプ"
      className={styles.blurStage}
    >
      <div className={styles.scroller} ref={scrollerRef} onScroll={update}>
        {LINES.map((label) => (
          <span className={styles.line} key={label}>
            {label}
          </span>
        ))}
      </div>

      <div className={styles.veil} style={veilStyle}>
        {layers.map((style, i) => (
          <div className={styles.layer} style={style} key={i} />
        ))}
        <div className={styles.scrim} style={scrimStyle} />
      </div>
    </DemoStage>
  );
}
