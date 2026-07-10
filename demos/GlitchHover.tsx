"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./GlitchHover.module.css";

const TEXT = "GLITCH";

export default function GlitchHover({ params }: { params: ParamValues }) {
  const [hovered, setHovered] = useState(false);

  // keyframes側でcalc(var(--strength) * n)としてずれ量に使う。
  // reduced-motion対応はCSSの@mediaで完結(アニメ停止+色変化のみ)
  const vars = {
    "--strength": `${params.strength}px`,
    "--period": `${params.period}s`,
  } as CSSProperties;

  return (
    <DemoStage hint="PC: テキストにホバー / スマホ: タップ">
      <span
        className={hovered ? `${styles.glitch} ${styles.on}` : styles.glitch}
        style={vars}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={() => setHovered((h) => !h)}
      >
        {TEXT}
        {/* 本番実装では::before/::after + content: attr(data-text)に集約する想定 */}
        <span className={styles.layerA} aria-hidden>
          {TEXT}
        </span>
        <span className={styles.layerB} aria-hidden>
          {TEXT}
        </span>
      </span>
    </DemoStage>
  );
}
