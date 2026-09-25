"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./Orbit.module.css";

// 観察元(byotone.com の .button-orbit)の5点をそのまま正規化した配置。
// r=半径の倍率 / start=軌道面の傾き / phase=初期位相 / tm=tiltの倍率 /
// pm=周期の倍率 / rev=逆回り / s=点の直径(単位はunit)
const DOTS = [
  { r: 0.82, start: -50, phase: 0, tm: 0.9, pm: 1, rev: false, s: 5.8 },
  { r: 1, start: 27, phase: 140, tm: 1.2, pm: 1.5, rev: true, s: 3.5 },
  { r: 0.99, start: 61, phase: 160, tm: 0.7, pm: 1.2, rev: false, s: 3.5 },
  { r: 0.75, start: 231, phase: 215, tm: 1.1, pm: 1.7, rev: true, s: 5.8 },
  { r: 0.26, start: -131, phase: 320, tm: 1, pm: 0.8, rev: false, s: 1.7 },
];

function Dots({ guides }: { guides?: boolean }) {
  return DOTS.map((d, i) => {
    const vars = {
      "--ob-rr": d.r,
      "--ob-start": `${d.start}deg`,
      "--ob-phase": `${d.phase}deg`,
      "--ob-tm": d.tm,
      "--ob-pm": d.pm,
      "--ob-s": d.s,
      "--ob-dir": d.rev ? "reverse" : "normal",
    } as CSSProperties;
    return (
      <span key={i} style={vars} className={styles.slot}>
        {guides && <span className={styles.guide} aria-hidden />}
        <span className={styles.dot} aria-hidden />
      </span>
    );
  });
}

export default function Orbit({ params }: { params: ParamValues }) {
  const [on, setOn] = useState(false);

  const vars = {
    "--ob-radius": `${params.radius}px`,
    "--ob-tilt": params.tilt,
    "--ob-period": `${params.period}s`,
    "--ob-depth": params.depth,
  } as CSSProperties;

  return (
    <DemoStage hint="操作不要(自動で周回)／ボタン: PCはホバー・スマホはタップで回り出す">
      <div className={styles.wrap} style={vars}>
        {/* 常時周回する大きな系。点線の楕円が各点の軌道面 */}
        <div className={styles.system}>
          <span className={styles.core} aria-hidden />
          <Dots guides />
        </div>

        {/* ボタンの装飾: 静止時は星座の配置、ホバーで --ob-mix を補間して回り出す */}
        <button
          type="button"
          className={on ? `${styles.button} ${styles.on}` : styles.button}
          aria-pressed={on}
          onClick={() => setOn((v) => !v)}
        >
          <span className={styles.icon}>
            <Dots />
          </span>
          <span className={styles.label}>Enter with sound</span>
        </button>
      </div>
    </DemoStage>
  );
}
