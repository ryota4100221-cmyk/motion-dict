"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Inter } from "next/font/google";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./WeightMorph.module.css";

// wght軸を100〜900で連続に持つ可変フォント。
// 🔴 weight を指定すると静的ウェイトが落ちてきて太さが段で飛ぶ。
// 可変軸を丸ごと受け取るために weight は「書かない」のが正解
// (このNextでは "100 900" のようなレンジ指定は通らない)。
// next/font はビルド時に自前ホストするので basePath 配下でも確実に出る。
const variable = Inter({
  subsets: ["latin"],
  display: "swap",
});

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

const WORD = "VARIABLE";
const LETTERS = [...WORD];

export default function WeightMorph({ params }: { params: ParamValues }) {
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  const { wmin, wmax, duration, stagger } = params;
  // スライダーの上下が入れ替わっても波が消えないように正規化する
  const lo = Math.min(wmin, wmax);
  const hi = Math.max(wmin, wmax);

  // 字幅の固定。太らせると advance width が伸びて隣の字が動くので、
  // 最大ウェイトでの幅を1度だけ実測して width に焼く。
  // 「全文字に最大ウェイトを当てる」→「まとめて幅を読む」の順にして
  // 書き込みと読み出しを分け、レイアウトを1回で済ませる。
  useEffect(() => {
    let cancelled = false;

    const lock = () => {
      if (cancelled) return;
      letterRefs.current.forEach((el) => {
        el?.style.removeProperty("width");
        el?.style.setProperty("font-weight", String(hi));
      });
      const widths = letterRefs.current.map((el) =>
        el ? el.getBoundingClientRect().width : 0
      );
      letterRefs.current.forEach((el, i) => {
        el?.style.setProperty("width", `${widths[i].toFixed(2)}px`);
      });
    };

    // フォント到着前に測るとフォールバックの幅で固定されてしまう
    document.fonts.ready.then(lock);
    return () => {
      cancelled = true;
    };
  }, [hi]);

  useEffect(() => {
    if (reduce) {
      // 動かさず、波の中間の太さで止める
      const mid = Math.round((lo + hi) / 2);
      letterRefs.current.forEach((el) => {
        el?.style.setProperty("font-weight", String(mid));
      });
      return;
    }

    if (paused) return;

    const span = hi - lo;
    const cycle = duration * 1000;
    return addTick((time) => {
      letterRefs.current.forEach((el, i) => {
        if (!el) return;
        // 位相を1文字ぶんずつ遅らせると、太さの変化が語を渡る波になる
        const phase = (time - i * stagger) / cycle;
        const w = lo + span * (0.5 - 0.5 * Math.cos(2 * Math.PI * phase));
        el.style.setProperty("font-weight", w.toFixed(1));
      });
    });
  }, [lo, hi, duration, stagger, reduce, paused]);

  return (
    <DemoStage hint="PC: 文字をクリックで一時停止 / スマホ: タップで一時停止">
      <div
        className={`${styles.wrap} ${variable.className}`}
        onPointerDown={() => setPaused((p) => !p)}
        role="presentation"
      >
        <p className={styles.word}>
          {LETTERS.map((ch, i) => (
            <span
              key={`${ch}-${i}`}
              ref={(el) => {
                letterRefs.current[i] = el;
              }}
              className={styles.letter}
            >
              {ch}
            </span>
          ))}
        </p>
        <span className={styles.axis} aria-hidden>
          wght {Math.round(lo)} – {Math.round(hi)}
        </span>
      </div>
    </DemoStage>
  );
}
