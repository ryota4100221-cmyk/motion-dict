"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./BarberPole.module.css";

export default function BarberPole({ params }: { params: ParamValues }) {
  const [reverse, setReverse] = useState(false);

  // 縞は直角方向にpitch間隔で並ぶので、横へ何px送れば1周するかはcosで読み替える。
  // ここがずれると1周ごとに柄が飛ぶ(継ぎ目が見える)
  const lean = params.lean;
  const period = params.pitch / Math.cos((lean * Math.PI) / 180);

  const vars = {
    "--angle": `${90 + lean}deg`,
    "--pitch": `${params.pitch}px`,
    "--barw": `${(params.pitch * params.ratio).toFixed(2)}px`,
    "--period": `${period.toFixed(2)}px`,
    "--cycle": `${params.cycle}s`,
    "--dir": reverse ? "reverse" : "normal",
  } as CSSProperties;

  return (
    <DemoStage hint="PC: ホバーで流れる向きを反転 / スマホ: タップで反転">
      <div
        className={styles.wrap}
        style={vars}
        onMouseEnter={() => setReverse(true)}
        onMouseLeave={() => setReverse(false)}
        onTouchStart={() => setReverse((v) => !v)}
      >
        {/* 用途1: 注意帯。ラベルと縞を地続きの1本の帯として並べる */}
        <div className={styles.tag}>
          <span className={styles.label}>CAUTION</span>
          <span className={styles.stripes}>
            <span className={styles.track} aria-hidden />
          </span>
        </div>

        {/* 用途2: 進捗率の出せない処理。同じ柄が「作業中」だけを伝える */}
        <div className={styles.bar}>
          <span className={styles.track} aria-hidden />
        </div>
        <span className={styles.caption}>
          lean {lean}° / pitch {params.pitch}px / {reverse ? "◀ reverse" : "forward ▶"}
        </span>
      </div>
    </DemoStage>
  );
}
