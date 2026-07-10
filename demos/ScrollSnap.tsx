"use client";

import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ScrollSnap.module.css";

// content/scroll-snap.ts の options と同順
const STRICTNESS = ["mandatory", "proximity"] as const;
const ALIGN = ["start", "center"] as const;

const SECTIONS = ["SECTION 01", "SECTION 02", "SECTION 03", "SECTION 04"];

export default function ScrollSnap({ params }: { params: ParamValues }) {
  const strictness = STRICTNESS[Math.round(params.strictness)] ?? "mandatory";
  const align = ALIGN[Math.round(params.align)] ?? "start";

  // scroll-snapはユーザー操作主導の「止まる位置の指定」であり、
  // 自動再生のアニメーションを持たないため prefers-reduced-motion での停止処理は不要
  // (scroll-behavior: smooth は使っていない)
  return (
    <DemoStage
      hint="ステージ内をスクロール(指を離すと吸着)"
      className={styles.scrollStage}
    >
      <div
        className={styles.scroller}
        style={{ scrollSnapType: `y ${strictness}` }}
      >
        {SECTIONS.map((label) => (
          <div
            className={styles.section}
            style={{ scrollSnapAlign: align }}
            key={label}
          >
            <span className={styles.sectionLabel}>{label}</span>
            <span className={styles.sectionLine} />
          </div>
        ))}
      </div>
    </DemoStage>
  );
}
