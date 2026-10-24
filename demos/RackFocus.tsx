"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./RackFocus.module.css";

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

// 手前と奥の2被写体。距離表示はピントを送っている感じを出すための飾り。
// 被写体は写真。手前=卓上の物撮り(photo-02)、奥=遠景の山(photo-08)にして、
// 「手前の物から奥の景色へピントを送る」という撮影の実際の画で見せる
const SUBJECTS = [
  { key: "near", tag: "NEAR — 1.2m" },
  { key: "far", tag: "FAR — 12m" },
];

export default function RackFocus({ params }: { params: ParamValues }) {
  // 合焦している被写体のindex。片方だけがピント内、が rack focus の前提
  const [focus, setFocus] = useState(0);
  const reduce = useReducedMotion();

  // reduced-motion時は0sで走らせ、fill: both で合焦後の状態へ即時に落とす
  const dur = reduce ? 0 : params.duration;

  const sceneStyle = {
    "--b": `${params.blur}`,
    "--hunt": `${params.hunt}`,
    "--dur": `${dur}s`,
  } as CSSProperties;

  return (
    <DemoStage hint="PC: 手前 / 奥にホバー / スマホ: タップでピントを送る">
      <div className={styles.scene} style={sceneStyle}>
        {SUBJECTS.map((s, i) => (
          <div
            key={s.key}
            className={[
              styles.subject,
              styles[s.key],
              focus === i ? styles.in : styles.out,
            ].join(" ")}
            onMouseEnter={() => setFocus(i)}
            onTouchStart={() => setFocus(i)}
          >
            <div className={styles.plate}>
              <span className={styles.photo} aria-hidden />
            </div>
            <span className={styles.tag}>{s.tag}</span>
          </div>
        ))}
        <div className={styles.readout}>FOCUS → {SUBJECTS[focus].tag}</div>
      </div>
    </DemoStage>
  );
}
