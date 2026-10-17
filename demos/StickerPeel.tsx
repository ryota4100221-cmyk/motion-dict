"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./StickerPeel.module.css";

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

// sweet-tape.com の initPeel(loop)の定数。戻りは 0.8s / 0.5s = めくりの1.6倍
const RETURN_RATIO = 1.6;
const EVERY = 3400; // 1周終えてから次までの休み(ms)
const STAGGER = 1300; // 2枚目以降のずらし(ms)
const BLEED = 4; // 折り目の初期位置を上端よりこれだけ外に置く(px)
const REDUCED_PEEL = 0.3;

const STICKERS = [
  { label: "SWEET", w: 220, h: 76, r: 6, face: "var(--ai)", ink: "var(--sumi)", back: "#d7d2c7" },
  { label: "NEW", w: 112, h: 112, r: 56, face: "var(--paper)", ink: "var(--sumi)", back: "#bdb8ad" },
  { label: "★ 4.9", w: 156, h: 64, r: 32, face: "#2f2f2f", ink: "var(--code-fg)", back: "#6a6a6a" },
];

const easeOut = (x: number) => 1 - (1 - x) * (1 - x); // power2.out
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2); // power3.inOut

// 回した外枠の中で、正立したシールが縦にはみ出す量のぶんだけ折り目の初期位置を外へ逃がす
function padFor(w: number, h: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  const span = w * Math.abs(Math.sin(a)) + h * Math.abs(Math.cos(a));
  return BLEED + Math.max(0, (span - h) / 2);
}

export default function StickerPeel({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const boardRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);
  const startRef = useRef<number[]>(STICKERS.map(() => -Infinity));
  const nextRef = useRef<number[]>(STICKERS.map(() => NaN));
  const pendingRef = useRef<boolean[]>(STICKERS.map(() => false));

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    if (reduce) return;
    const start = startRef.current;
    const next = nextRef.current;
    const pending = pendingRef.current;
    return addTick((time) => {
      const board = boardRef.current;
      if (!board) return;
      const { duration, hold } = paramsRef.current;
      const D = duration * 1000;
      const H = hold * 1000;
      const R = D * RETURN_RATIO;
      const cycle = D + H + R;
      // ノードは毎フレーム引き直す
      const els = board.querySelectorAll<HTMLElement>("[data-sticker]");
      els.forEach((el, i) => {
        if (Number.isNaN(next[i])) next[i] = time + 600 + STAGGER * i;
        const busy = time - start[i] < cycle;
        if (pending[i]) {
          pending[i] = false;
          if (!busy) {
            start[i] = time;
            next[i] = time + cycle + EVERY;
          }
        } else if (!busy && time >= next[i]) {
          start[i] = time;
          next[i] = time + cycle + EVERY;
        }
        const t = time - start[i];
        let p = 0;
        if (t < D) p = easeOut(t / D);
        else if (t < D + H) p = 1;
        else if (t < cycle) p = 1 - easeInOut((t - D - H) / R);
        el.style.setProperty("--sp-peel", p.toFixed(4));
      });
    });
  }, [reduce]);

  const trigger = (i: number) => {
    pendingRef.current[i] = true;
  };

  const { depth, angle } = params;

  return (
    <DemoStage hint="PC: シールにホバー / スマホ: タップ(無操作でも順番にめくれる)">
      <div
        ref={boardRef}
        className={styles.board}
        style={{ "--sp-angle": `${angle}deg`, "--sp-depth": `${depth}%` } as CSSProperties}
      >
        {STICKERS.map((s, i) => (
          <button
            key={`sticker-${s.label}`}
            type="button"
            aria-label={`${s.label} のシールをめくる`}
            className={styles.sticker}
            data-sticker
            onPointerEnter={() => trigger(i)}
            onFocus={() => trigger(i)}
            onClick={() => trigger(i)}
            style={
              {
                "--sp-w": `${s.w}px`,
                "--sp-h": `${s.h}px`,
                "--sp-r": `${s.r}px`,
                "--sp-face": s.face,
                "--sp-ink": s.ink,
                "--sp-back": s.back,
                "--sp-pad": `${padFor(s.w, s.h, angle).toFixed(2)}px`,
                "--sp-peel": reduce ? REDUCED_PEEL : 0,
              } as CSSProperties
            }
          >
            <span className={styles.peel} aria-hidden>
              {/* 表: 折り目より下だけ残す */}
              <span className={styles.face}>
                <span className={styles.turn}>
                  <span className={styles.art}>{s.label}</span>
                </span>
              </span>
              {/* 裏: 同じ形を折り目で鏡写しにし、折り目より上だけ残す */}
              <span className={styles.flapShadow}>
                <span className={styles.flap}>
                  <span className={styles.turn}>
                    <span className={styles.back} />
                  </span>
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </DemoStage>
  );
}
