"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./PillExpand.module.css";

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

// 畳んだときの直径 = 展開後の高さ。円→カプセルの落差はここで決まる
const PILL_H = 40;

// 起点。scaleの原点と、幅が伸びる向き(どちら側で固定するか)の両方を決める
const ORIGINS = [
  { origin: "0% 100%", anchor: "left" },
  { origin: "50% 100%", anchor: "center" },
  { origin: "100% 100%", anchor: "right" },
] as const;

// 伸びは減速強めのカーブ、出現(scale)はもう少し素直に
const EASE_GROW = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_POP = "cubic-bezier(0.34, 1.2, 0.64, 1)";

export default function PillExpand({ params }: { params: ParamValues }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  const { origin, anchor } = ORIGINS[Math.round(params.origin)] ?? ORIGINS[0];
  const width = params.width;
  // reduced-motion時は展開状態で据え置き、時間もすべて0にする
  const shown = reduce || open;
  const dur = reduce ? 0 : params.duration;
  const labelDelay = reduce ? 0 : params.labelDelay;
  const pop = dur * 0.66; // 出現は幅より速く終わらせる

  const pillStyle: CSSProperties = {
    width: shown ? `${width}px` : `${PILL_H}px`,
    height: `${PILL_H}px`,
    opacity: shown ? 1 : 0,
    transformOrigin: origin,
    transform: `${anchor === "center" ? "translateX(-50%) " : ""}scale(${
      shown ? 1 : 0
    })`,
    // 開く=出現→伸長、閉じる=収縮→消滅。往復で順番を入れ替えるのがこの動きの肝
    transition: open
      ? `transform ${pop}s ${EASE_POP} 0s,` +
        ` opacity ${pop * 0.6}s linear 0s,` +
        ` width ${dur}s ${EASE_GROW} ${dur * 0.4}s`
      : `transform ${pop * 0.85}s ${EASE_GROW} ${dur * 0.8}s,` +
        ` opacity ${pop * 0.5}s linear ${dur * 0.8}s,` +
        ` width ${dur * 0.75}s ${EASE_GROW} ${dur * 0.25}s`,
    ...(anchor === "center"
      ? { left: "50%" }
      : anchor === "right"
        ? { right: 0 }
        : { left: 0 }),
  };

  const labelStyle: CSSProperties = {
    opacity: shown ? 1 : 0,
    // 開くときだけ待たせる。閉じるときは真っ先に消して、幅の収縮を隠す
    transition: open
      ? `opacity ${dur * 0.6}s linear ${labelDelay}s`
      : `opacity ${dur * 0.4}s linear 0s`,
  };

  const dotStyle: CSSProperties = {
    ...(anchor === "center"
      ? { left: "50%", transform: "translateX(-50%)" }
      : anchor === "right"
        ? { right: 0 }
        : { left: 0 }),
  };

  return (
    <DemoStage hint="PC: タイルにホバー / スマホ: タップ">
      <div
        className={styles.tile}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onTouchStart={() => setOpen((o) => !o)}
      >
        <span className={styles.caption}>Project 01</span>
        <div className={styles.rail}>
          <span className={styles.dot} style={dotStyle} aria-hidden />
          <div className={styles.pill} style={pillStyle}>
            <span className={styles.label} style={labelStyle}>
              View project
            </span>
          </div>
        </div>
      </div>
    </DemoStage>
  );
}
