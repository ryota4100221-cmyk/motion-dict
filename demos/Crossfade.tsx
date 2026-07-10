"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./Crossfade.module.css";

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

export default function Crossfade({ params }: { params: ParamValues }) {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  const layerStyle = (index: number): CSSProperties => {
    const isActive = index === active;
    // reduced-motion: フェードなしで即切替
    const d = reduce ? 0 : params.duration;
    return {
      opacity: isActive ? 1 : 0,
      transform: isActive ? "scale(1)" : `scale(${params.zoomIn})`,
      // 入り側: scale(zoomIn)→1へ戻しながらフェードイン
      // 出側: scaleは動かさず、フェード完了後(遅延d)に次回用の待機値へ瞬時に戻す
      transition: isActive
        ? `opacity ${d}s ease, transform ${d}s cubic-bezier(0.16, 1, 0.3, 1)`
        : `opacity ${d}s ease, transform 0s linear ${d}s`,
    };
  };

  return (
    <DemoStage hint="Switch: 画像を切り替え">
      <div className={styles.frame}>
        <div className={`${styles.layer} ${styles.imgA}`} style={layerStyle(0)}>
          <span className={styles.tag}>01</span>
        </div>
        <div className={`${styles.layer} ${styles.imgB}`} style={layerStyle(1)}>
          <span className={styles.tag}>02</span>
        </div>
      </div>
      <button
        className={styles.playBtn}
        onClick={() => setActive((a) => 1 - a)}
      >
        Switch
      </button>
    </DemoStage>
  );
}
