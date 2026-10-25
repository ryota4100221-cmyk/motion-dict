"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./FlameFlicker.module.css";

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

// twain.ai の anim-mode-icon-flame を lean=6 / stretch=5 の基準値として読み、
// 各刻みの値をスライダーの比で伸縮する。刻みが不規則なのが炎らしさの元
const OFFSETS = [0, 0.07, 0.17, 0.28, 0.4, 0.53, 0.67, 0.8, 0.9, 1];
const SCALE_X = [0.94, 1, 0.985, 1.008, 0.99, 1.004, 0.996, 1, 1, 1];
const SCALE_Y = [0.9, 0.99, 1.05, 0.975, 1.04, 0.982, 1.02, 1.008, 1, 1];
const SKEW = [0, 0, 4, 6, 2.5, 4.5, 1.75, 0.6, 0, 0];
const ROTATE = [0, 0, 1.5, 2.25, 1, 1.75, 0.75, 0.15, 0, 0];
// 元サイトは負の delay(-0.105s / 1.5s = 7%)で頭のフェードインを飛ばしていた
const SKIP = 0.07;

// 火の粉の置き場所(アイコン幅に対する%)と流れる向き。元は8px/13px(24px中)
const SPARKS = [
  { left: 33, dx: 2.5 },
  { left: 54, dx: 1.5 },
  { left: 44, dx: -2 },
  { left: 62, dx: 3 },
];

const ROWS = ["Trending now", "Most read", "12-day streak"];

// 無操作が続いたら、上から順に1つずつ自動で燃やす(ms)
const IDLE_AFTER = 1800;
const AUTO_GAP = 700;

export default function FlameFlicker({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const paramsRef = useRef(params);
  const touchedRef = useRef(false);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  // 1回ぶん再生する。ノードは呼ばれるたびに引き直す
  const play = (i: number) => {
    const btn = btnRefs.current[i];
    if (!btn || reduce) return;
    // 再生中に入り直しても頭出しにしない(炎が途中で跳ねる)
    if (btn.dataset.active === "true") return;
    const flame = btn.querySelector<SVGSVGElement>("[data-flame]");
    const sparks = btn.querySelectorAll<HTMLSpanElement>("[data-spark]");
    if (!flame) return;

    const { duration, lean, stretch } = paramsRef.current;
    const count = Math.round(paramsRef.current.sparks);
    const D = duration * 1000;
    const kL = lean / 6;
    const kS = stretch / 5;

    btn.dataset.active = "true";
    flame
      .animate(
        OFFSETS.map((offset, k) => ({
          offset,
          easing: "ease-in-out",
          transform:
            `scale(${(1 + (SCALE_X[k] - 1) * kS).toFixed(4)}, ${(1 + (SCALE_Y[k] - 1) * kS).toFixed(4)}) ` +
            `skewX(${(SKEW[k] * kL).toFixed(3)}deg) rotate(${(ROTATE[k] * kL).toFixed(3)}deg)`,
        })),
        // CSS と同じく easing は区間ごと(options.easing だと反復全体に掛かり、頭飛ばしがずれる)
        { duration: D, delay: -D * SKIP }
      )
      .finished.then(() => delete btn.dataset.active, () => {});

    // 火の粉: 1粒目は14%、以降は24%おき(数が多いときは詰める)
    const gap = count > 1 ? Math.min(0.24, 0.42 / (count - 1)) : 0;
    sparks.forEach((el, k) => {
      el.getAnimations().forEach((a) => a.cancel());
      if (k >= count) return;
      const s = SPARKS[k];
      const start = 0.14 + gap * k;
      const peak = start + 0.09;
      const end = Math.min(start + 0.3, 0.98);
      el.animate(
        [
          { offset: 0, opacity: 0, transform: "translate(0, 0) scale(1)" },
          { offset: start, opacity: 0, transform: "translate(0, 0) scale(1)", easing: "ease-out" },
          { offset: peak, opacity: 0.9, transform: `translate(${s.dx * 0.8}px, -5px) scale(0.9)`, easing: "ease-out" },
          { offset: end, opacity: 0, transform: `translate(${s.dx * 2}px, -15px) scale(0.45)` },
          { offset: 1, opacity: 0, transform: `translate(${s.dx * 2}px, -15px) scale(0.45)` },
        ],
        { duration: D, delay: -D * SKIP }
      );
    });
  };

  const onEnter = (i: number) => {
    touchedRef.current = true;
    play(i);
  };

  // 無操作時の自走。時刻は rAF の time だけで扱う
  useEffect(() => {
    if (reduce) return;
    let lastInput = -Infinity;
    let lastAuto = -Infinity;
    let next = 0;
    return addTick((time) => {
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInput = time;
      }
      if (time - lastInput < IDLE_AFTER) return;
      if (time - lastAuto < paramsRef.current.duration * 1000 * (1 - SKIP) + AUTO_GAP) return;
      lastAuto = time;
      play(next);
      next = (next + 1) % ROWS.length;
    });
    // play は毎回ノードを引き直すので依存に入れなくてよい
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  return (
    <DemoStage hint="PC: ボタンにホバー / スマホ: タップ(無操作時は自動で再生)">
      <div className={styles.list}>
        {ROWS.map((label, i) => (
          <button
            key={label}
            type="button"
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            className={styles.btn}
            onPointerEnter={() => onEnter(i)}
            onFocus={() => onEnter(i)}
            onClick={() => onEnter(i)}
          >
            <span className={styles.icon} aria-hidden>
              {/* 回転の中心は炎の底(transform-origin: 50% 87.5% = y21/24) */}
              <svg className={styles.flame} viewBox="0 0 24 24" data-flame>
                <path
                  className={styles.outer}
                  d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5Z"
                />
                <path
                  className={styles.inner}
                  d="M12 15.6c-1.4 1.2-2.2 2.3-2.2 3.3a2.2 2.2 0 0 0 4.4 0c0-1-.8-2.1-2.2-3.3Z"
                />
              </svg>
              {SPARKS.map((s, k) => (
                <span
                  key={`spark-${k}`}
                  className={styles.spark}
                  style={{ left: `${s.left}%` }}
                  data-spark
                />
              ))}
            </span>
            <span className={styles.label}>{label}</span>
          </button>
        ))}
      </div>
    </DemoStage>
  );
}
