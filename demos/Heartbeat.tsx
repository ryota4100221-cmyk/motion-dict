"use client";

import { useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./Heartbeat.module.css";

const HEART =
  "M12 20.6s-7.4-4.5-9.4-9.1C1.2 8.2 3.3 4.4 7 4.4c2.1 0 3.7 1.1 5 2.8 1.3-1.7 2.9-2.8 5-2.8 3.7 0 5.8 3.8 4.4 7.1-2 4.6-9.4 9.1-9.4 9.1z";
const STAR =
  "M12 3.2l2.7 5.6 6.1.8-4.4 4.3 1.1 6.1L12 17.1 6.5 20l1.1-6.1-4.4-4.3 6.1-.8z";

const COUNT = 5;
// 反動(1拍目直後の縮み)は1拍目の膨らみの35%(観察元 krea.ai: 1.34 → 0.88)
const RECOIL = 0.35;
// 星→ハートの出る順のずれ(観察元のまま)
const POP_STAGGER = 42;

export default function Heartbeat({ params }: { params: ParamValues }) {
  const [loved, setLoved] = useState(false);

  const peak = params.peak / 100;
  const vars = {
    "--heartbeat-duration": `${params.duration}s`,
    "--heartbeat-peak": 1 + peak,
    "--heartbeat-dip": 1 - peak * RECOIL,
    "--heartbeat-echo": 1 + peak * (params.echo / 100),
  } as CSSProperties;

  // マウスは行に入る/出るで切り替え、タッチ・ペンはタップごとに切り替える
  const enter = (e: PointerEvent) => {
    if (e.pointerType === "mouse") setLoved(true);
  };
  const leave = (e: PointerEvent) => {
    if (e.pointerType === "mouse") setLoved(false);
  };
  const tap = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") setLoved((v) => !v);
  };

  const bpm = Math.round(60 / params.duration);

  return (
    <DemoStage hint="大きなハートは自動で鼓動／PC: 星の列にカーソルを乗せるとハートに変わって順に打つ・スマホ: 星の列をタップで切り替え">
      <div className={styles.wrap} style={vars}>
        {/* 主役: 表示した時点から打ち続ける */}
        <svg className={`${styles.heart} ${styles.big}`} viewBox="0 0 24 24" aria-hidden>
          <path d={HEART} />
        </svg>

        <div
          className={styles.row}
          role="group"
          aria-label="Rate this entry"
          onPointerEnter={enter}
          onPointerLeave={leave}
          onPointerUp={tap}
        >
          {Array.from({ length: COUNT }, (_, i) => (
            <span key={i} className={styles.slot}>
              {loved ? (
                // 出る動き(親)と拍(子)を別の要素に分け、transform を取り合わせない
                <span
                  key={`heart-${i}`}
                  className={styles.pop}
                  style={{ animationDelay: `${i * POP_STAGGER}ms` }}
                >
                  <svg
                    className={styles.heart}
                    viewBox="0 0 24 24"
                    style={{ animationDelay: `${i * params.stagger}ms` }}
                    aria-hidden
                  >
                    <path d={HEART} />
                  </svg>
                </span>
              ) : (
                <svg key={`star-${i}`} className={styles.star} viewBox="0 0 24 24" aria-hidden>
                  <path d={STAR} />
                </svg>
              )}
            </span>
          ))}
        </div>

        <span className={styles.caption}>
          {loved ? "Loved it" : "Rate this entry"} · {params.duration}s / {bpm} bpm
        </span>
      </div>
    </DemoStage>
  );
}
