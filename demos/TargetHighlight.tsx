"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./TargetHighlight.module.css";

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

// 用語集の項目(右のリスト)。目次から飛べるのは INDEX の5つ
const ENTRIES = [
  { id: "anticipation", term: "Anticipation", def: "動く前に一度逆へ引く予備動作。次の動きの向きを先に知らせる。" },
  { id: "easing", term: "Easing", def: "速さの変わり方。同じ0.4sでも、出だしと止まり際で印象が決まる。" },
  { id: "follow-through", term: "Follow-through", def: "本体が止まった後も、末端が少し遅れて揺れ残ること。" },
  { id: "keyframe", term: "Keyframe", def: "動きの途中の要所に置く値。間はブラウザが補間する。" },
  { id: "overshoot", term: "Overshoot", def: "目標を一度行き過ぎてから戻る。ばねらしさの正体。" },
  { id: "reflow", term: "Reflow", def: "レイアウトの再計算。width や top を動かすと毎フレーム走る。" },
  { id: "stagger", term: "Stagger", def: "並んだ要素の動き出しを少しずつずらすこと。" },
  { id: "squash", term: "Squash & stretch", def: "ぶつかって潰れ、跳ねて伸びる。体積は保ったまま。" },
];
const INDEX = ["easing", "keyframe", "overshoot", "stagger", "squash"];

// 出典(paligan.com の glossary-target)の引く区間の緩急
const EASE_OUT = "cubic-bezier(.16, 1, .3, 1)";

export default function TargetHighlight({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const { duration, hold, strength } = params;
  const listRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState<string | null>(null);

  const jump = useCallback(
    (id: string) => {
      const list = listRef.current; // 毎回引き直す
      if (!list) return;
      const el = list.querySelector<HTMLElement>(`[data-entry="${id}"]`);
      if (!el) return;
      // 前の項目の光は消す
      list.querySelectorAll<HTMLElement>("[data-entry]").forEach((n) =>
        n.getAnimations().forEach((a) => a.cancel())
      );
      // 一瞬で飛ぶ(scroll-behavior: auto)。上端に余白 8px を残す
      list.scrollTop = el.offsetTop - 8;
      setCurrent(id);

      const accent = getComputedStyle(el).getPropertyValue("--ai").trim() || "#a5e02e";
      const lit = `color-mix(in srgb, ${accent} ${strength}%, transparent)`;
      const off = `color-mix(in srgb, ${accent} 0%, transparent)`;
      const ms = duration * 1000;
      if (reduce) {
        // 色の変化はアニメーションさせず、点けて一度に消す
        el.animate(
          [
            { offset: 0, backgroundColor: lit, easing: "steps(1, end)" },
            { offset: 1, backgroundColor: lit },
          ],
          { duration: ms }
        );
        return;
      }
      // 0〜hold% は留め、hold% → 100% だけに ease-out を掛ける(区間ごとの緩急)
      const h = hold / 100;
      el.animate(
        [
          { offset: 0, backgroundColor: lit, easing: "linear" },
          { offset: h, backgroundColor: lit, easing: EASE_OUT },
          { offset: 1, backgroundColor: off },
        ],
        { duration: ms }
      );
    },
    [duration, hold, strength, reduce]
  );

  // 開いた直後に1回だけ見本を光らせる(操作前の画が止まらないように)
  useEffect(() => {
    if (reduce) return;
    const t = window.setTimeout(() => jump("overshoot"), 500);
    return () => window.clearTimeout(t);
  }, [jump, reduce]);

  return (
    <DemoStage
      hint="PC: 左の目次をクリック / スマホ: タップ。飛んだ先の項目がぱっと光って引く"
      className={styles.targetStage}
    >
      <nav className={styles.index}>
        <p className={styles.label}>Index</p>
        {INDEX.map((id) => {
          const e = ENTRIES.find((x) => x.id === id)!;
          return (
            <button
              type="button"
              key={id}
              className={current === id ? `${styles.link} ${styles.linkOn}` : styles.link}
              onClick={() => jump(id)}
            >
              <i className={styles.dot} aria-hidden />
              Go to {e.term}
            </button>
          );
        })}
      </nav>

      <div className={styles.list} ref={listRef}>
        <p className={styles.label}>Glossary</p>
        {ENTRIES.map((e) => (
          <article key={e.id} className={styles.entry} data-entry={e.id}>
            <h4 className={styles.term}>{e.term}</h4>
            <p className={styles.def}>{e.def}</p>
          </article>
        ))}
      </div>
    </DemoStage>
  );
}
