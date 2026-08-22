"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./GodRays.module.css";

// 光源(フレーム上辺の中央)から見て、フレームの中に入ってくる扇のおおよその角度。
// 「見えている本数」をこの範囲の本数として数えるための基準
const FAN = 140;

export default function GodRays({ params }: { params: ParamValues }) {
  // 光条を消すと「ただの暗い背景」に戻る。効いているのが濃さだけであることの実演
  const [off, setOff] = useState(false);

  // 全周の本数は整数にする。360がこの本数で割り切れないと、conicの開始角に
  // パターンの継ぎ目(1本だけ太い/細い箇所)ができ、それが回って横切ってしまう
  const around = Math.max(4, Math.round(params.rays * (360 / FAN)));
  // 1周期 = 360÷全周の本数。この角度ぶん回せば見た目が元に戻るので、これをループ単位にする
  const period = 360 / around;
  // 1本の広がりは周期の85%まで。超えると隣とつながって「明るい背景」になる
  const spread = Math.min(params.spread, period * 0.85);

  const vars = {
    "--period": `${period.toFixed(3)}deg`,
    "--spread": `${spread.toFixed(3)}deg`,
    "--half": `${(spread / 2).toFixed(3)}deg`,
    "--cycle": `${(period / params.speed).toFixed(2)}s`,
    "--glow": off ? "0" : `${params.opacity}`,
  } as CSSProperties;

  return (
    <DemoStage hint="PC: ホバーで光条オフ(比較) / スマホ: タップで切替">
      <figure
        className={styles.card}
        onMouseEnter={() => setOff(true)}
        onMouseLeave={() => setOff(false)}
        onTouchStart={() => setOff((v) => !v)}
      >
        <div className={styles.frame} style={vars}>
          {/* 光条はDOMに1本ずつ並べない。この1要素のconic-gradientが全本数を持つ */}
          <div className={styles.rays} aria-hidden />
          <span className={styles.title}>Daybreak</span>
        </div>
        <figcaption className={styles.caption}>
          {off
            ? "Rays off — 光条なしの背景"
            : `見え ${params.rays}本(全周 ${around}本) / 1本 ${spread.toFixed(
                0
              )}deg — 1ループ ${(period / params.speed).toFixed(
                1
              )}s(1周期 ${period.toFixed(1)}deg)`}
        </figcaption>
      </figure>
    </DemoStage>
  );
}
