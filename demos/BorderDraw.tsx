"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./BorderDraw.module.css";

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

// 上→右→下→左 の順に描く。transform-originはCSS側で「描き始めの端」に設定済み
const SIDES = [
  { cls: styles.top, axis: "scaleX" },
  { cls: styles.right, axis: "scaleY" },
  { cls: styles.bottom, axis: "scaleX" },
  { cls: styles.left, axis: "scaleY" },
] as const;

export default function BorderDraw({ params }: { params: ParamValues }) {
  const [hovered, setHovered] = useState(false);
  const reduce = useReducedMotion();

  const seg = params.duration / 4; // 1辺あたりの時間
  const on = reduce || hovered;

  const sideStyle = (i: number): CSSProperties => ({
    // 太さは辺の向きで width / height に振り分ける
    ...(SIDES[i].axis === "scaleX"
      ? { height: params.thickness }
      : { width: params.thickness }),
    transform: on ? `${SIDES[i].axis}(1)` : `${SIDES[i].axis}(0)`,
    transitionDuration: reduce ? "0s" : `${seg}s`,
    // 描くときは 上→右→下→左、消すときは逆順(左→下→右→上)に連鎖させる
    transitionDelay: reduce ? "0s" : `${(hovered ? i : 3 - i) * seg}s`,
  });

  return (
    <DemoStage hint="PC: ボタンにホバー / スマホ: タップ">
      <button
        className={styles.drawBtn}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={() => setHovered((h) => !h)}
      >
        {SIDES.map((s, i) => (
          <span key={i} className={`${styles.side} ${s.cls}`} style={sideStyle(i)} aria-hidden />
        ))}
        HOVER ME
      </button>
    </DemoStage>
  );
}
