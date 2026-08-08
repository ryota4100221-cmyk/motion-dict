"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./OpeningCrawl.module.css";

// 流す本文。段落の粒度まで含めて「読ませる文章」でないと速度の是非が判断できない
const PARAGRAPHS = [
  "遠い昔、はるか彼方のブラウザで。",
  "文章は奥へ倒れた面の上を等速に流れ、消失点へ吸い込まれて暗闇に溶けていく。傾きと消失点の距離だけで、同じ本文が叙事詩にも報告書にもなる。",
  "読ませたいなら、まず速度を落とすこと。",
];

export default function OpeningCrawl({ params }: { params: ParamValues }) {
  const [paused, setPaused] = useState(false);

  // 面の作り(perspective/tilt)と流速・減衰はCSS変数でキーフレーム側へ渡す。
  // 本文の量は変えないので、durationがそのまま「読める速さ」になる
  const vars = {
    "--perspective": `${params.perspective}px`,
    "--tilt": `${params.tilt}deg`,
    "--duration": `${params.duration}s`,
    "--fade": `${params.fade}%`,
  } as CSSProperties;

  return (
    <DemoStage hint="PC: ホバーで一時停止(読む) / スマホ: タップで一時停止">
      <figure
        className={styles.card}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused((v) => !v)}
      >
        {/* 消失点を持つ「宇宙」。overflow: clipで奥へ抜けた文字を切り落とす */}
        <div className={styles.space} style={vars} data-paused={paused ? "on" : "off"}>
          <div className={styles.crawl}>
            <p className={styles.episode}>EPISODE XII</p>
            <h3 className={styles.title}>
              THE VANISHING
              <br />
              POINT
            </h3>
            {PARAGRAPHS.map((text) => (
              <p key={text} className={styles.body}>
                {text}
              </p>
            ))}
          </div>
        </div>
        <figcaption className={styles.caption}>
          {paused ? "Paused" : "Crawling"} — tilt {params.tilt}deg / {params.duration}s
        </figcaption>
      </figure>
    </DemoStage>
  );
}
