"use client";

import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./BreathingGlow.module.css";

// 並べたステータスの点。呼吸の開始を周期の割合でずらし、一斉に明滅させない
const STATUSES = [
  { label: "Online", phase: 0 },
  { label: "Syncing", phase: 0.33 },
  { label: "Listening", phase: 0.66 },
];

// 大きな面は伸縮させると文字が揺れるので、カードの膨らみは点の1/5に抑える
const CARD_SCALE_RATIO = 0.2;

export default function BreathingGlow({ params }: { params: ParamValues }) {
  const vars = {
    "--period": `${params.period}s`,
    "--glow": `${params.glow}px`,
    "--grow": 1 + params.scale / 100,
    "--grow-card": 1 + (params.scale / 100) * CARD_SCALE_RATIO,
  } as CSSProperties;

  return (
    <DemoStage hint="操作不要(自動でループ再生)／周期・光のにじみ・膨らみをスライダーで">
      <div className={styles.wrap} style={vars}>
        <ul className={styles.statuses}>
          {STATUSES.map((s) => (
            <li key={s.label} className={styles.status}>
              <span
                className={`${styles.dot} ${styles.breathe}`}
                style={{ animationDelay: `${-s.phase * params.period}s` }}
                aria-hidden
              />
              <span className={styles.label}>{s.label}</span>
            </li>
          ))}
        </ul>

        {/* おすすめプラン: 光彩は ::before が持ち、その opacity だけを呼吸させる */}
        <div className={`${styles.card} ${styles.breatheCard}`}>
          <span className={styles.badge}>Recommended</span>
          <span className={styles.plan}>Pro</span>
          <span className={styles.price}>$24 / mo</span>
        </div>

        <span className={styles.caption}>
          {params.period}s / {(60 / params.period).toFixed(1)} breaths per min
        </span>
      </div>
    </DemoStage>
  );
}
