"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./BarChartGrow.module.css";

// 7日分の値(最大値に対する%)。最終日を「今日」として強調する
const DATA = [
  { day: "Mon", value: 36 },
  { day: "Tue", value: 55 },
  { day: "Wed", value: 45 },
  { day: "Thu", value: 74 },
  { day: "Fri", value: 66 },
  { day: "Sat", value: 94 },
  { day: "Sun", value: 84 },
];

const EASINGS = [
  "cubic-bezier(0.22, 1, 0.36, 1)",
  "cubic-bezier(0.34, 1.56, 0.64, 1)",
  "linear",
];

// 伸び切ってから次の再生までの間(録画とアイドル時に形を読ませる時間)
const HOLD_MS = 1600;

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

export default function BarChartGrow({ params }: { params: ParamValues }) {
  const [run, setRun] = useState(0);
  const reduce = useReducedMotion();

  const easing = EASINGS[Math.round(params.easing)] ?? EASINGS[0];
  const clip = Math.round(params.method) === 1;
  const total =
    params.duration * 1000 + params.stagger * (DATA.length - 1) + HOLD_MS;

  // 伸び切って少し見せたら自動で再生し直す。reduced-motion時は静止のまま
  useEffect(() => {
    if (reduce) return;
    const id = window.setTimeout(() => setRun((r) => r + 1), total);
    return () => window.clearTimeout(id);
  }, [run, total, reduce]);

  const chartStyle = {
    "--dur": `${params.duration}s`,
    "--stagger": `${params.stagger}ms`,
    "--ease": easing,
  } as CSSProperties;

  const barsClass = [
    styles.bars,
    clip ? styles.clip : styles.scale,
    reduce ? styles.still : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <DemoStage hint="PC: Replayをクリックで再生し直し / スマホ: Replayをタップ(数秒ごとに自動再生)">
      <div className={styles.card} style={chartStyle}>
        <div className={styles.head}>
          <span className={styles.eyebrow}>Revenue</span>
          <button
            type="button"
            className={styles.replay}
            onClick={() => setRun((r) => r + 1)}
          >
            Replay
          </button>
        </div>
        <div className={styles.value}>$1,047</div>
        {/* key を付け替えてアニメーションを最初から再生し直す */}
        <ul key={`run-${run}`} className={barsClass}>
          {DATA.map((d, i) => (
            <li key={d.day} className={styles.col}>
              <span className={styles.track}>
                <span
                  className={
                    i === DATA.length - 1
                      ? `${styles.fill} ${styles.now}`
                      : styles.fill
                  }
                  style={{ "--i": i, height: `${d.value}%` } as CSSProperties}
                  aria-label={`${d.day}: ${d.value}`}
                />
              </span>
              <span className={styles.day} aria-hidden>
                {d.day}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </DemoStage>
  );
}
