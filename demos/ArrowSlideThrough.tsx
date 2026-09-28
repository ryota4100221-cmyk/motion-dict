"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./ArrowSlideThrough.module.css";

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

// 抜けは加速(ease-in)、戻りはわずかにオーバーシュート。前後で性格を変えるのが肝
const EASE_IN = "cubic-bezier(0.55, 0, 0.75, 0.2)";
const EASE_BACK = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

// 矢印の向き=抜ける方向。→は右、↗は右上へ抜けて左下から戻る
const ARROWS = {
  right: { shaft: "M4 12H20", barb: "M13 5L20 12L13 19", dx: 1, dy: 0 },
  upRight: { shaft: "M6 18L18 6", barb: "M8 6H18V16", dx: Math.SQRT1_2, dy: -Math.SQRT1_2 },
} as const;
type ArrowKey = keyof typeof ARROWS;

const ROWS: { label: string; arrow: ArrowKey }[] = [
  { label: "Next project", arrow: "right" },
  { label: "View case study", arrow: "upRight" },
  { label: "Get in touch", arrow: "right" },
];

// 無操作が続いたら、上から順に1本ずつ自動で再生する(ms)
const IDLE_AFTER = 1800;
const AUTO_GAP = 900;

function Arrow({ arrow, role }: { arrow: ArrowKey; role: "main" | "ghost" }) {
  const a = ARROWS[arrow];
  return (
    <svg
      className={role === "main" ? styles.svg : `${styles.svg} ${styles.ghost}`}
      viewBox="0 0 24 24"
      data-role={role}
      aria-hidden
    >
      <path d={a.shaft} pathLength={1} data-part="shaft" />
      <path d={a.barb} pathLength={1} data-part="barb" />
    </svg>
  );
}

export default function ArrowSlideThrough({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const paramsRef = useRef(params);
  const touchedRef = useRef(false);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  // 1本ぶん再生する。ノードは呼ばれるたびに引き直す
  const play = (i: number) => {
    const btn = btnRefs.current[i];
    if (!btn || reduce) return;
    const main = btn.querySelector<SVGSVGElement>('[data-role="main"]');
    const ghost = btn.querySelector<SVGSVGElement>('[data-role="ghost"]');
    if (!main || !ghost) return;

    const { duration, travel, exit, mode } = paramsRef.current;
    const D = duration * 1000;
    const r = exit / 100;
    const a = ARROWS[ROWS[i].arrow];
    const tx = a.dx * travel;
    const ty = a.dy * travel;
    const draw = Math.round(mode) === 1;

    for (const el of [main, ghost, ...main.querySelectorAll("path"), ...ghost.querySelectorAll("path")]) {
      el.getAnimations().forEach((anim) => anim.cancel());
    }

    btn.dataset.active = "true";

    if (!draw) {
      // slide: r で向きの先へ抜け、直後に反対側へ瞬間移動して残りの時間で戻る
      main
        .animate(
          [
            { transform: "translate(0, 0)", opacity: 1, easing: EASE_IN },
            { offset: r, transform: `translate(${tx}%, ${ty}%)`, opacity: 0 },
            { offset: r + 0.001, transform: `translate(${-tx}%, ${-ty}%)`, opacity: 0, easing: EASE_BACK },
            { offset: 1, transform: "translate(0, 0)", opacity: 1 },
          ],
          { duration: D }
        )
        .finished.then(() => delete btn.dataset.active, () => {});
      return;
    }

    // draw: 抜けながら線を消し、戻りは別のSVG(ghost)で軸→矢じりの順に描き直す
    main.animate(
      [
        { transform: "translate(0, 0)", opacity: 1, easing: EASE_IN },
        { offset: r, transform: `translate(${tx * 0.4}%, ${ty * 0.4}%)`, opacity: 1 },
        { offset: r + 0.001, opacity: 0 },
        { offset: 0.999, opacity: 0 },
        { offset: 1, transform: "translate(0, 0)", opacity: 1 },
      ],
      { duration: D }
    );
    const [shaft, barb] = main.querySelectorAll("path");
    shaft.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -1 }], { duration: D * r, easing: EASE_IN });
    barb.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: 1 }], { duration: D * r, easing: EASE_IN });

    const [gShaft, gBarb] = ghost.querySelectorAll("path");
    const shaftDelay = D * r * 0.85;
    const barbDelay = shaftDelay + (D - shaftDelay) * 0.45;
    gShaft.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
      duration: (D - shaftDelay) * 0.75,
      delay: shaftDelay,
      easing: EASE_OUT,
      fill: "both",
    });
    gBarb
      .animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
        duration: D - barbDelay,
        delay: barbDelay,
        easing: EASE_OUT,
        fill: "both",
      })
      .finished.then(() => delete btn.dataset.active, () => {});
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
      if (time - lastAuto < paramsRef.current.duration * 1000 + AUTO_GAP) return;
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
        {ROWS.map((row, i) => (
          <button
            key={row.label}
            type="button"
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            className={styles.btn}
            onPointerEnter={() => onEnter(i)}
            onFocus={() => onEnter(i)}
          >
            <span className={styles.label}>{row.label}</span>
            <span className={styles.clip}>
              <Arrow arrow={row.arrow} role="main" />
              <Arrow arrow={row.arrow} role="ghost" />
            </span>
          </button>
        ))}
      </div>
    </DemoStage>
  );
}
