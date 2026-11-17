"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./JelloWobble.module.css";

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

const WORD = "Glossary";

// trammat.helenadang.work のフッターロゴ(fm-lean / fm-bam)の刻みと緩急。
// CSS の animation-timing-function は区間ごとに掛かるので、WAAPI でも各キーフレームに持たせる
const LEAN_OFFSETS = [0, 0.28, 0.55, 0.78, 1];
const LEAN_EASE = [
  "cubic-bezier(0.55, 0, 0.9, 0.45)",
  "cubic-bezier(0.2, 0.8, 0.3, 1)",
  "ease",
  "ease",
];
// 隣がぶつけられる時刻と長さ(元は 0.62s に対して 170ms 後に 0.45s)
const KNOCK_AT = 0.274;
const KNOCK_LEN = 0.726;

// 無操作が続いたら、左端→右端の順に自動で揺らす(ms)。元は 1400ms と 1920ms
const IDLE_AFTER = 1800;
const PAIR_GAP = 520;
const CYCLE_REST = 1300;

export default function JelloWobble({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const paramsRef = useRef(params);
  const touchedRef = useRef(false);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  // 1文字を1回揺らし、向かう側の隣をつぶす。ノードは呼ばれるたびに引き直す
  const play = (i: number) => {
    const n = WORD.length;
    const ch = charRefs.current[i];
    if (!ch || reduce) return;
    // 揺れている途中に入り直しても頭出しにしない
    if (ch.dataset.active === "true") return;
    const glyph = ch.querySelector<HTMLSpanElement>("[data-glyph]");
    if (!glyph) return;

    const { skew, duration, decay, knock } = paramsRef.current;
    const D = duration * 1000;
    // 左半分は右へ傾いて右の隣へ、右半分は左へ傾いて左の隣へ
    const dir = i < n / 2 ? 1 : -1;
    const peaks = [0, -dir * skew, dir * skew * decay, -dir * skew * decay * decay, 0];

    ch.dataset.active = "true";
    glyph
      .animate(
        LEAN_OFFSETS.map((offset, k) => ({
          offset,
          ...(k < LEAN_EASE.length ? { easing: LEAN_EASE[k] } : {}),
          transform: k === 0 || k === LEAN_OFFSETS.length - 1 ? "none" : `skewX(${peaks[k].toFixed(3)}deg)`,
        })),
        { duration: D }
      )
      .finished.then(() => delete ch.dataset.active, () => {});

    const j = i + dir;
    const hit = charRefs.current[j]?.querySelector<HTMLSpanElement>("[data-glyph]");
    if (!hit || knock <= 0) return;
    hit.getAnimations().forEach((a) => a.cancel());
    hit.animate(
      [
        { offset: 0, transform: "none", easing: "ease" },
        {
          offset: 0.22,
          transform: `translateX(${((dir * knock) / 300).toFixed(4)}em) scale(${(1 + knock * 0.0058).toFixed(4)}, ${(1 - knock / 100).toFixed(4)})`,
          easing: "ease",
        },
        {
          offset: 0.55,
          transform: `translateX(${((-dir * knock) / 1800).toFixed(4)}em) scale(${(1 - knock / 600).toFixed(4)}, ${(1 + knock / 300).toFixed(4)})`,
          easing: "ease",
        },
        { offset: 1, transform: "none" },
      ],
      { duration: D * KNOCK_LEN, delay: D * KNOCK_AT }
    );
  };

  const onEnter = (i: number) => {
    touchedRef.current = true;
    play(i);
  };

  // 無操作時の自走。時刻は rAF の time だけで扱う
  useEffect(() => {
    if (reduce) return;
    let lastInput = -Infinity;
    let lastLeft = -Infinity;
    let rightDone = true;
    return addTick((time) => {
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInput = time;
      }
      if (time - lastInput < IDLE_AFTER) return;
      const D = paramsRef.current.duration * 1000;
      if (!rightDone && time - lastLeft >= PAIR_GAP) {
        rightDone = true;
        play(WORD.length - 1);
        return;
      }
      if (rightDone && time - lastLeft >= PAIR_GAP + D + CYCLE_REST) {
        lastLeft = time;
        rightDone = false;
        play(0);
      }
    });
    // play は毎回ノードを引き直すので依存に入れなくてよい
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  return (
    <DemoStage hint="PC: 文字にホバー / スマホ: 文字をタップ(無操作時は両端が自動で揺れる)">
      <div className={styles.wrap}>
        <p className={styles.word} aria-label={WORD}>
          {WORD.split("").map((c, i) => (
            <span
              key={`ch-${i}`}
              ref={(el) => {
                charRefs.current[i] = el;
              }}
              className={styles.char}
              aria-hidden
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") onEnter(i);
              }}
              onPointerDown={() => onEnter(i)}
            >
              <span className={styles.glyph} data-glyph>
                {c}
              </span>
            </span>
          ))}
        </p>
        <span className={styles.floor} aria-hidden />
        <p className={styles.caption}>Entry 220 — jello wobble</p>
      </div>
    </DemoStage>
  );
}
