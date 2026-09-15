"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./FloatingReactions.module.css";

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

// 同時に存在できる粒の上限。連打やinterval最小でもDOMが溜まらないようにする
const MAX_ALIVE = 40;
const COLORS = ["var(--ai)", "var(--ai-pale)", "var(--code-fg)"];
const HEART =
  "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.6 4.5c2.1 0 3.9 1.2 5.4 3.1 1.5-1.9 3.3-3.1 5.4-3.1 3.6 0 5.7 3.9 4.2 7.3C19.5 16.4 12 21 12 21z";
const STAR = "M12 2.5l2.7 6.3 6.8.6-5.2 4.5 1.6 6.7L12 17.1l-5.9 3.5 1.6-6.7-5.2-4.5 6.8-.6z";

type Reaction = {
  id: number;
  x: number; // 発生点からの横ずれ px
  size: number;
  color: string;
  star: boolean;
  swayDur: number; // 揺れの周期 s
  swayDelay: number; // 負のdelayで位相をずらす
  swayDir: number; // 揺れ始めの向き(±1)
};

function makeReaction(id: number, duration: number): Reaction {
  return {
    id,
    x: (Math.random() - 0.5) * 36,
    size: 18 + Math.random() * 12,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    star: Math.random() < 0.25,
    swayDur: duration * (0.3 + Math.random() * 0.2),
    swayDelay: -Math.random() * duration,
    swayDir: Math.random() < 0.5 ? -1 : 1,
  };
}

export default function FloatingReactions({ params }: { params: ParamValues }) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [count, setCount] = useState(128);
  const idRef = useRef(0);
  const reduce = useReducedMotion();

  const { rise, duration, sway, interval } = params;

  const emit = (n: number) => {
    if (reduce) return;
    setReactions((rs) => {
      const next = [...rs];
      for (let i = 0; i < n; i++) next.push(makeReaction(++idRef.current, duration));
      return next.slice(-MAX_ALIVE);
    });
  };

  // 無操作でも interval ごとに1粒湧かせる(録画でも常に動きが映るように)
  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => {
      setReactions((rs) =>
        [...rs, makeReaction(++idRef.current, duration)].slice(-MAX_ALIVE)
      );
    }, interval * 1000);
    return () => window.clearInterval(timer);
  }, [interval, duration, reduce]);

  const press = () => {
    setCount((c) => c + 1);
    emit(4);
  };

  const rootStyle = {
    "--rise": `${rise}px`,
    "--sway": `${sway}px`,
  } as CSSProperties;

  return (
    <DemoStage hint="PC: ハートをクリックで追加 / スマホ: タップ(放っておいても湧く)">
      <div className={styles.field} style={rootStyle}>
        <div className={styles.emitter} aria-hidden>
          {reactions.map((r) => (
            <span
              key={r.id}
              className={styles.rise}
              style={{ left: `${r.x}px`, animationDuration: `${duration}s` }}
              onAnimationEnd={(e) => {
                if (e.target !== e.currentTarget) return;
                setReactions((rs) => rs.filter((x) => x.id !== r.id));
              }}
            >
              <span
                className={styles.sway}
                style={
                  {
                    animationDuration: `${r.swayDur.toFixed(2)}s`,
                    animationDelay: `${r.swayDelay.toFixed(2)}s`,
                    "--dir": r.swayDir,
                  } as CSSProperties
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  width={r.size}
                  height={r.size}
                  style={{ color: r.color }}
                >
                  <path d={r.star ? STAR : HEART} fill="currentColor" />
                </svg>
              </span>
            </span>
          ))}
        </div>

        <button className={styles.button} onClick={press} aria-label="いいね">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
            <path d={HEART} fill="currentColor" />
          </svg>
          <span className={styles.count}>{count}</span>
        </button>
      </div>
    </DemoStage>
  );
}
