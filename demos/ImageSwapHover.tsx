"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ImageSwapHover.module.css";

// content/image-swap-hover.ts の mode options と同順
const MODES = ["crossfade", "clip-wipe"] as const;

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

export default function ImageSwapHover({ params }: { params: ParamValues }) {
  const [swapped, setSwapped] = useState(false);
  const reduce = useReducedMotion();

  const mode = MODES[Math.round(params.mode)] ?? "crossfade";

  // 上の画像だけを動かす。crossfadeはopacity、clip-wipeは左からのワイプ
  // reduced-motion時はアニメーションなしで即時切替
  const topStyle: CSSProperties =
    mode === "crossfade"
      ? {
          opacity: swapped ? 1 : 0,
          transitionProperty: "opacity",
          transitionDuration: reduce ? "0s" : `${params.duration}s`,
        }
      : {
          clipPath: swapped ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
          transitionProperty: "clip-path",
          transitionDuration: reduce ? "0s" : `${params.duration}s`,
        };

  return (
    <DemoStage hint="PC: カードにホバー / スマホ: タップ">
      <figure
        className={styles.card}
        onMouseEnter={() => setSwapped(true)}
        onMouseLeave={() => setSwapped(false)}
        onTouchStart={() => setSwapped((s) => !s)}
      >
        <div className={styles.frame}>
          {/* 2枚とも最初からDOMに置き事前読込(src差し替えはチラつく) */}
          <img
            src="/demo/dummy-02.svg"
            alt=""
            draggable={false}
            className={styles.img}
          />
          <img
            src="/demo/dummy-03.svg"
            alt=""
            draggable={false}
            className={`${styles.img} ${styles.imgTop}`}
            style={topStyle}
          />
        </div>
        <figcaption className={styles.caption}>
          Fig.02 — swap study
        </figcaption>
      </figure>
    </DemoStage>
  );
}
