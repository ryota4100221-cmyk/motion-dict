"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./Scanlines.module.css";

// 走査線を乗せる先の「観測装置の画面」らしいダミー出力
const LINES = ["SIGNAL ....... LOCKED", "DRIFT ........ 0.02%", "UPTIME ....... 1184h"];

export default function Scanlines({ params }: { params: ParamValues }) {
  const [off, setOff] = useState(false);

  // 走査線の間隔・明滅の振れ幅・バーの周期はCSS変数でキーフレーム側へ渡す。
  // 振れ幅は間隔の半分が上限(それ以上ずらすと縞が一周して動いて見えない)
  const vars = {
    "--spacing": `${params.spacing}px`,
    "--jitter": `${((params.flicker * params.spacing) / 2).toFixed(2)}px`,
    "--sweep": `${params.sweep}s`,
  } as CSSProperties;

  return (
    <DemoStage hint="PC: ホバーで走査線オフ(比較) / スマホ: タップで切替">
      <figure
        className={styles.card}
        onMouseEnter={() => setOff(true)}
        onMouseLeave={() => setOff(false)}
        onTouchStart={() => setOff((v) => !v)}
      >
        <div className={styles.screen} style={vars}>
          <div className={styles.content}>
            <span className={styles.brand}>CRT-04</span>
            {LINES.map((line) => (
              <span key={line} className={styles.row}>
                {line}
              </span>
            ))}
          </div>

          {/* ラスタも走査バーもこの1枚の擬似要素。DOMには線を並べない */}
          <div
            className={styles.scanlines}
            style={{ opacity: off ? 0 : params.opacity }}
            data-sweep={params.sweep > 0 ? "on" : "off"}
            aria-hidden
          />
        </div>
        <figcaption className={styles.caption}>
          {off ? "Scanlines off" : "Scanlines on"} — spacing {params.spacing}px
        </figcaption>
      </figure>
    </DemoStage>
  );
}
