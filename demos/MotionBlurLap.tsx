"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./MotionBlurLap.module.css";

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

// 抜けは加速、戻りは減速。42% で右端から左端へ瞬間移動する(webrace.agency の値)
const EASE_RUN = "cubic-bezier(0.6, 0.02, 0.82, 0.38)";
const EASE_BACK = "cubic-bezier(0.16, 0.72, 0.32, 1)";
const WARP = 0.42;

// 残像4枚。出典は trail 0.78em の値なので、それを基準に trail で伸縮する
// [ずれ em, ぼかし em, 不透明度] × 4枚
type Layer = [number, number, number];
const TRAIL_BASE = 0.78;
const TRAIL_FRAMES: { offset: number; layers: Layer[] }[] = [
  { offset: 0.12, layers: [[0.05, 0.005, 0.25], [0.14, 0.008, 0.15], [0.28, 0.012, 0.08], [0.48, 0.018, 0.04]] },
  { offset: 0.3, layers: [[0.08, 0.008, 0.48], [0.21, 0.012, 0.32], [0.42, 0.018, 0.18], [0.78, 0.024, 0.09]] },
  { offset: 0.52, layers: [[0.08, 0.008, 0.48], [0.21, 0.012, 0.32], [0.42, 0.018, 0.18], [0.78, 0.024, 0.09]] },
  { offset: 0.78, layers: [[0.04, 0.004, 0.2], [0.11, 0.007, 0.12], [0.22, 0.011, 0.06], [0.38, 0.016, 0.03]] },
];
const INK = "233, 233, 227";
const NO_SHADOW = Array(4).fill(`rgba(${INK}, 0) 0em 0 0em`).join(", ");

const shadow = (layers: Layer[], k: number) =>
  layers.map(([x, b, a]) => `rgba(${INK}, ${a}) ${(-x * k).toFixed(3)}em 0 ${(b * k).toFixed(4)}em`).join(", ");

const LABELS = ["Read the entry", "Next plate", "Open glossary"];

// 無操作が続いたら、上から順に1本ずつ自動で走らせる(ms)
const IDLE_AFTER = 1800;
const AUTO_GAP = 900;

export default function MotionBlurLap({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const paramsRef = useRef(params);
  const touchedRef = useRef(false);
  const filterId = `mbl-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  // 1本ぶん走らせる。ノードは呼ばれるたびに引き直す
  const play = (i: number) => {
    const btn = btnRefs.current[i];
    if (!btn || reduce || btn.dataset.active === "true") return;
    const glyphs = [...btn.querySelectorAll<HTMLElement>("[data-glyph]")];
    if (!glyphs.length) return;

    const { duration, stagger, trail } = paramsRef.current;
    const T = duration * 1000;
    const D = btn.clientWidth; // どの字もボタンの外まで出切る距離
    const k = trail / TRAIL_BASE;
    const n = glyphs.length;
    let last: Animation | null = null;

    btn.dataset.active = "true";
    glyphs.forEach((g, idx) => {
      if (g.dataset.space === "true") return;
      // 右端の字が先頭。左へ1字ごとに遅れる
      const delay = (n - 1 - idx) * stagger;
      const opts: KeyframeAnimationOptions = { duration: T, delay, fill: "both" };
      const lap = g.animate(
        [
          { offset: 0, transform: "translateX(0px)", easing: EASE_RUN },
          { offset: WARP, transform: `translateX(${D}px)` },
          { offset: WARP + 0.0001, transform: `translateX(${-D}px)`, easing: EASE_BACK },
          { offset: 1, transform: "translateX(0px)" },
        ],
        opts
      );
      g.animate(
        [
          { offset: 0, textShadow: NO_SHADOW },
          ...TRAIL_FRAMES.map((f) => ({ offset: f.offset, textShadow: k > 0 ? shadow(f.layers, k) : NO_SHADOW })),
          { offset: 1, textShadow: NO_SHADOW },
        ],
        opts
      );
      const ghost = g.querySelector<HTMLElement>("[data-ghost]");
      if (ghost && k > 0) {
        ghost.animate(
          [
            { offset: 0, opacity: 0 },
            { offset: 0.12, opacity: 0.36 },
            { offset: 0.3, opacity: 0.9 },
            { offset: 0.52, opacity: 0.9 },
            { offset: 0.78, opacity: 0.24 },
            { offset: 1, opacity: 0 },
          ],
          opts
        );
      }
      // idx が小さいほど遅れが大きい＝最初に走らせた字が最後に戻る
      if (!last) last = lap;
    });
    // 先頭の字(いちばん遅い)が戻ったら終わり。次のホバーで走り直せるよう後片付け
    const done = () => {
      for (const g of glyphs) {
        g.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      }
      delete btn.dataset.active;
    };
    (last as Animation | null)?.finished.then(done, done);
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
      const p = paramsRef.current;
      if (time - lastAuto < p.duration * 1000 + p.stagger * 16 + AUTO_GAP) return;
      lastAuto = time;
      play(next);
      next = (next + 1) % LABELS.length;
    });
    // play は毎回ノードを引き直すので依存に入れなくてよい
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const blurX = (3.2 * params.trail) / TRAIL_BASE;

  return (
    <DemoStage hint="PC: ボタンにホバー / スマホ: タップ(無操作時は自動で再生)">
      {/* 横だけのぼかし。CSS の blur() は全方向なので SVG で持つ */}
      <svg className={styles.defs} aria-hidden>
        <filter id={filterId} x="-180%" y="-30%" width="460%" height="160%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation={`${blurX.toFixed(2)} 0.08`} edgeMode="duplicate" result="h" />
          <feOffset in="h" dx={-2.4} dy={0} />
        </filter>
      </svg>
      <div className={styles.list}>
        {LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            className={styles.btn}
            onPointerEnter={() => onEnter(i)}
            onFocus={() => onEnter(i)}
          >
            <span className={styles.label} aria-hidden>
              {[...label].map((ch, j) => (
                <span
                  key={`${label}-${j}`}
                  className={styles.glyph}
                  data-glyph=""
                  data-space={ch === " " ? "true" : undefined}
                >
                  {ch === " " ? " " : ch}
                  {ch !== " " && (
                    <span className={styles.ghost} data-ghost="" style={{ filter: `url(#${filterId})` }}>
                      {ch}
                    </span>
                  )}
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>
    </DemoStage>
  );
}
