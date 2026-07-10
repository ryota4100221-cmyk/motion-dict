"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, PointerEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./RippleTap.module.css";

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

type Ripple = { id: number; x: number; y: number };

export default function RippleTap({ params }: { params: ParamValues }) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [flashes, setFlashes] = useState<number[]>([]);
  const idRef = useRef(0);
  const reduce = useReducedMotion();

  const duration = params.duration;
  const size = params.size;

  // タップ座標を要素内の相対座標に直して波紋を追加。連打は重ねる
  const tap = (e: PointerEvent<HTMLButtonElement>) => {
    const id = ++idRef.current;
    if (reduce) {
      // reduced-motion: 波紋を出さず、動きのない背景フェードで返す
      setFlashes((fs) => [...fs, id]);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setRipples((rs) => [
      ...rs,
      { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
    ]);
  };

  // 終わった波紋はanimationendでDOMから削除(後始末)
  const rippleStyle = (r: Ripple): CSSProperties => ({
    width: size,
    height: size,
    left: r.x - size / 2,
    top: r.y - size / 2,
    animationDuration: `${duration}s`,
  });

  return (
    <DemoStage hint="PC: パッド内をクリック / スマホ: タップ(連打で重なる)">
      <button className={styles.pad} onPointerDown={tap}>
        <span className={styles.label}>Tap here</span>
        {ripples.map((r) => (
          <span
            key={r.id}
            className={styles.ripple}
            style={rippleStyle(r)}
            onAnimationEnd={() =>
              setRipples((rs) => rs.filter((x) => x.id !== r.id))
            }
            aria-hidden
          />
        ))}
        {flashes.map((id) => (
          <span
            key={id}
            className={styles.flash}
            onAnimationEnd={() =>
              setFlashes((fs) => fs.filter((x) => x !== id))
            }
            aria-hidden
          />
        ))}
      </button>
    </DemoStage>
  );
}
