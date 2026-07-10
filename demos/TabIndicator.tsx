"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./TabIndicator.module.css";

const TABS = ["Home", "Works", "About"];

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

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

export default function TabIndicator({ params }: { params: ParamValues }) {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  const stretchOn = Math.round(params.stretch) === 1;

  // 移動はインジケーター本体のtranslateX(等幅タブなのでindex×100%)
  // reduced-motion時はスライドさせず新しい位置に即時表示
  const indicatorStyle: CSSProperties = {
    transform: `translateX(${active * 100}%)`,
    transition: reduce ? "none" : `transform ${params.duration}s ${EASE_OUT}`,
  };

  // 伸縮は内側の要素のkeyframesに分離し、key={active}で切り替えのたび再生する
  const fillStyle: CSSProperties = {
    animationDuration: `${params.duration}s`,
  };

  return (
    <DemoStage hint="PC: タブをクリック / スマホ: タップ">
      <div className={styles.frame}>
        <div className={styles.tabs}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              className={i === active ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => setActive(i)}
            >
              {tab}
            </button>
          ))}
          <span className={styles.indicator} style={indicatorStyle} aria-hidden>
            <span
              key={active}
              className={
                stretchOn && !reduce ? `${styles.fill} ${styles.stretch}` : styles.fill
              }
              style={fillStyle}
            />
          </span>
        </div>
        <div className={styles.panel}>
          <span className={styles.panelIndex}>0{active + 1}</span>
          {TABS[active]}
        </div>
      </div>
    </DemoStage>
  );
}
