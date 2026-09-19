"use client";

import { useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./CounterScale.module.css";

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

// 1サイクル = 開く(25%) → 保持(50%) → 閉じる(25%)。開く時間がdurationと一致するよう4倍で回す
const CYCLE_RATIO = 4;

export default function CounterScale({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const locked = params.mode === 1;

  // lock時は中身を原寸に固定し、枠だけが開く平坦なマスクとの違いを見せる
  const zoom = locked ? 1 : params.zoom;
  // 枠の比率から窓のinset量を出す(0.5なら25%内側から開く)
  const inset = ((1 - params.aperture) / 2) * 100;

  const vars = {
    "--cs-aperture": params.aperture,
    "--cs-zoom": zoom,
    "--cs-inset": `${inset}%`,
    animationDuration: `${params.duration * CYCLE_RATIO}s`,
    // reduced-motion時はanimation-nameを外し、開ききった最終状態で静止させる
    animationName: reduce ? "none" : undefined,
  } as CSSProperties;

  return (
    <DemoStage hint="操作不要(自動で開閉をループ再生)">
      <figure className={styles.card}>
        <div className={styles.field}>
          {/* 原寸の位置を示す目安。枠がどこまで開くかを読ませる */}
          <span className={styles.target} aria-hidden />

          <span className={styles.ring} style={vars} />

          <span className={styles.window} style={vars}>
            <span className={styles.media} style={vars}>
              {/* 画像は使わずCSSで作画する。中央の円が被写体で、縮尺の変化はこれで読む */}
              <span className={styles.sun} />
              <span className={styles.ridge} />
            </span>
          </span>
        </div>
        <figcaption className={styles.caption}>
          {locked ? "lock — 窓が開くだけ" : "counter — 窓は開き中身は引く"}
        </figcaption>
      </figure>
    </DemoStage>
  );
}
