"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./StarRating.module.css";

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

const IDLE_WAIT = 2400; // この時間操作が無ければ自走に戻る

// 観察元(cognichip の QuickRating)の5段階ラベル
const LABELS = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

const STAR =
  "M10 1.5L12.39 6.92L18.18 7.46L13.83 11.41L15.09 17.08L10 14.27L4.91 17.08L6.17 11.41L1.82 7.46L7.61 6.92L10 1.5Z";

type Step = { hover: number | null; select?: number | null; hold: number };

// 自走の台本: 星をなぞって選ぶ→離す→低い値へ付け直す→取り消す
function buildScript(count: number): Step[] {
  const high = Math.max(1, count - 1);
  const low = Math.max(1, Math.round(count * 0.4));
  const steps: Step[] = [];
  for (let i = 1; i <= count; i++) steps.push({ hover: i, hold: 170 });
  steps.push({ hover: high, hold: 380 });
  steps.push({ hover: high, select: high, hold: 520 });
  steps.push({ hover: null, hold: 1200 });
  for (let i = high - 1; i >= low; i--) steps.push({ hover: i, hold: 200 });
  steps.push({ hover: low, select: low, hold: 520 });
  steps.push({ hover: null, hold: 1000 });
  steps.push({ hover: low, hold: 360 });
  steps.push({ hover: low, select: null, hold: 520 });
  steps.push({ hover: null, hold: 900 });
  return steps;
}

export default function StarRating({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const count = Math.round(params.count);
  const lift = params.lift;
  const duration = params.duration;
  const stagger = params.stagger;

  const [value, setValue] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const touchedRef = useRef(false);
  // 最後に操作された時刻はrAFのtimeからだけ確定させる(performance.nowはlintで落ちる)
  const lastInputRef = useRef(-Infinity);
  const stepRef = useRef(0);
  const nextStepRef = useRef(0);

  // 表示値は hover ?? value。変わった星を手前から遅らせるため、直前の表示値も持つ
  const shown = Math.min(hover ?? value ?? 0, count);
  const [track, setTrack] = useState({ shown, from: shown });
  if (track.shown !== shown) setTrack({ shown, from: track.shown });
  const from = track.from;

  const select = (n: number) => {
    touchedRef.current = true;
    // 確定中の星をもう一度押したら取り消す(allow clear)
    setValue((v) => (v === n ? null : n));
  };

  const preview = (n: number | null) => {
    touchedRef.current = true;
    setHover(n);
  };

  // 星の数が変わったら台本を頭から読み直す
  useEffect(() => {
    stepRef.current = 0;
    nextStepRef.current = 0;
  }, [count]);

  // 無操作のあいだは台本どおりに星をなぞって選ぶ。録画のループ動画にもプレビューが映る
  useEffect(() => {
    if (reduce) return;
    const script = buildScript(count);
    return addTick((time) => {
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInputRef.current = time;
        nextStepRef.current = time + IDLE_WAIT;
        stepRef.current = 0;
        return;
      }
      if (time - lastInputRef.current < IDLE_WAIT) return;
      if (time < nextStepRef.current) return;
      const step = script[stepRef.current % script.length];
      setHover(step.hover);
      if (step.select !== undefined) setValue(step.select);
      stepRef.current += 1;
      nextStepRef.current = time + step.hold;
    });
  }, [reduce, count]);

  const vars = {
    "--sr-dur": `${reduce ? 0 : duration}s`,
    "--sr-lift": String(reduce ? 1 : lift),
  } as CSSProperties;

  const stars = Array.from({ length: count }, (_, i) => i + 1);
  const label =
    shown === 0
      ? "—"
      : count === 5
        ? LABELS[shown - 1]
        : `${shown} / ${count}`;

  return (
    <DemoStage hint="PC: 星にホバーして手前まで灯す→クリックで確定(同じ星で取り消し) / スマホ: タップで確定">
      <div className={styles.field} style={vars}>
        <p className={styles.caption}>この記事の満足度</p>
        <div className={styles.row} onPointerLeave={() => preview(null)}>
          <div className={styles.stars}>
            {stars.map((n) => {
              const lit = n <= shown;
              // 今回の変化で切り替わった星だけ、手前(変化の起点側)から順に遅らせる
              const lo = Math.min(from, shown);
              const hi = Math.max(from, shown);
              const changed = n > lo && n <= hi;
              const order = shown >= from ? n - lo - 1 : hi - n;
              const delay = changed && !reduce ? order * stagger : 0;
              return (
                <button
                  key={n}
                  type="button"
                  className={`${styles.star} ${lit ? styles.lit : ""} ${hover === n ? styles.lifted : ""}`}
                  style={{ transitionDelay: `${delay}ms` }}
                  aria-label={`Rate ${n} out of ${count}`}
                  aria-pressed={value === n}
                  onPointerEnter={(e) => {
                    if (e.pointerType === "mouse") preview(n);
                  }}
                  onClick={() => select(n)}
                >
                  <svg viewBox="0 0 20 20" aria-hidden>
                    <path d={STAR} />
                  </svg>
                </button>
              );
            })}
          </div>
          <span className={styles.label} aria-live="polite">
            {label}
          </span>
        </div>
        <p className={styles.score}>
          確定値 <strong>{value ?? "—"}</strong> / {count}
        </p>
      </div>
    </DemoStage>
  );
}
