"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./FocusDim.module.css";

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

// 実績リストを模したダミー項目(制作会社サイトの定番レイアウト)
const ITEMS = [
  { title: "ATLAS FILMS", meta: "Title Sequence" },
  { title: "NOIR STUDIO", meta: "Color Grade" },
  { title: "HELIOS", meta: "VFX / Comp" },
  { title: "MONSOON", meta: "Edit / Online" },
];

export default function FocusDim({ params }: { params: ParamValues }) {
  // ホバー中(PC)またはタップで選択中(スマホ)の項目index。未選択は null
  const [focused, setFocused] = useState<number | null>(null);
  const reduce = useReducedMotion();

  // 沈み量はCSS変数で流し込む。reduced-motion時はtransitionを0にして即時切替
  const listStyle = {
    "--dim-opacity": params.dimOpacity,
    "--dim-blur": `${params.dimBlur}px`,
    "--dim-duration": reduce ? "0s" : `${params.duration}s`,
  } as CSSProperties;

  return (
    <DemoStage hint="PC: 行にホバー / スマホ: 行をタップ">
      <ul
        className={styles.list}
        style={listStyle}
        // コンテナから離れたらフォーカス解除(全項目が原寸に戻る)
        onMouseLeave={() => setFocused(null)}
      >
        {ITEMS.map((item, i) => {
          // focusedがあり自分でない項目だけ沈める
          const dimmed = focused !== null && focused !== i;
          const rowStyle: CSSProperties = {
            opacity: dimmed ? "var(--dim-opacity)" : 1,
            filter: dimmed ? "blur(var(--dim-blur))" : "blur(0px)",
          };
          return (
            <li
              key={item.title}
              className={styles.row}
              style={rowStyle}
              onMouseEnter={() => setFocused(i)}
              // タッチ: 同じ行の再タップで解除、別行なら付け替え
              onTouchStart={(e) => {
                e.preventDefault();
                setFocused((cur) => (cur === i ? null : i));
              }}
            >
              <span className={styles.title}>{item.title}</span>
              <span className={styles.meta}>{item.meta}</span>
            </li>
          );
        })}
      </ul>
    </DemoStage>
  );
}
