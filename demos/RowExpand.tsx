"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./RowExpand.module.css";

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

// 帯の基準高さと、キャプションが占める高さ(行間+上マージン)。
// 「飲み込む」= 畳んだ CAP_BLOCK をそのまま帯の高さへ足すこと
const BASE_H = 46;
const CAP_LINE = 13;
const CAP_GAP = 9;
const CAP_BLOCK = CAP_LINE + CAP_GAP;

const ROWS = [
  { title: "Europa", meta: "Brand system", tints: [0.92, 0.46, 0.24] },
  { title: "Molteni", meta: "Art direction", tints: [0.3, 0.86, 0.5] },
  { title: "Kessel", meta: "Digital", tints: [0.56, 0.26, 0.9] },
];

export default function RowExpand({ params }: { params: ParamValues }) {
  // 開いている行は1つだけ持つ。行ごとにフラグを持つと素早く移したとき前の行が残る
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduce = useReducedMotion();

  const swallow = Math.round(params.swallow) === 0;
  // reduced-motion時は展開後の状態へ即時に切り替える
  const dur = reduce ? 0 : params.duration;

  return (
    <DemoStage hint="PC: 一覧の行にホバー / スマホ: タップ">
      <div className={styles.list}>
        {ROWS.map((row, i) => {
          const open = openIndex === i;
          const stripH = open
            ? BASE_H * params.grow + (swallow ? CAP_BLOCK : 0)
            : BASE_H;
          const folded = open && swallow;

          const stripStyle: CSSProperties = {
            height: `${stripH}px`,
            transitionDuration: `${dur}s`,
          };
          const captionStyle: CSSProperties = {
            maxHeight: folded ? 0 : CAP_LINE,
            marginTop: folded ? 0 : CAP_GAP,
            opacity: folded ? 0 : 1,
            transitionDuration: `${dur}s`,
          };

          return (
            <div
              key={row.title}
              className={styles.row}
              onMouseEnter={() => setOpenIndex(i)}
              onMouseLeave={() => setOpenIndex(null)}
              onTouchStart={() => setOpenIndex((cur) => (cur === i ? null : i))}
            >
              <div className={styles.strip} style={stripStyle}>
                {row.tints.map((t, j) => (
                  <span
                    key={j}
                    className={styles.thumb}
                    style={{ background: `rgba(233, 233, 227, ${t})` }}
                    aria-hidden
                  />
                ))}
              </div>
              <div className={styles.caption} style={captionStyle}>
                <span>{row.title}</span>
                <span className={styles.meta}>{row.meta}</span>
              </div>
            </div>
          );
        })}
      </div>
    </DemoStage>
  );
}
