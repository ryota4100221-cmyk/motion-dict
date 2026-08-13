"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./MoireDrift.module.css";

export default function MoireDrift({ params }: { params: ParamValues }) {
  // 2枚目を消すと「等間隔のドット1枚」に戻る。モアレは重なりでしか出ないことの実演
  const [solo, setSolo] = useState(false);

  const pitch2 = params.pitch + params.beat;
  // 干渉縞の間隔。ピッチ p と p+d の格子が作るうなりの周期 = p×(p+d)÷d
  const fringe = Math.round((params.pitch * pitch2) / params.beat);

  // ピッチ2枚・回転角・周期はCSS変数でキーフレーム側へ渡す。
  // ドリフト量は2枚目のピッチちょうど1タイル分(それ以外だとループに継ぎ目が出る)
  const vars = {
    "--pitch": `${params.pitch}px`,
    "--pitch2": `${pitch2.toFixed(2)}px`,
    "--angle": `${params.angle}deg`,
    "--cycle": `${params.cycle}s`,
  } as CSSProperties;

  return (
    <DemoStage hint="PC: ホバーで2枚目を消す(モアレの正体) / スマホ: タップで切替">
      <figure
        className={styles.card}
        onMouseEnter={() => setSolo(true)}
        onMouseLeave={() => setSolo(false)}
        onTouchStart={() => setSolo((v) => !v)}
      >
        {/* ドットはDOMに並べない。2枚のグリッドはこの1要素の擬似要素が持つ */}
        <div
          className={styles.band}
          style={vars}
          data-solo={solo ? "on" : "off"}
          aria-hidden
        />
        <figcaption className={styles.caption}>
          {solo
            ? `1枚だけ — ${params.pitch}px の等間隔ドット(干渉なし)`
            : `${params.pitch}px + ${pitch2.toFixed(1)}px → 縞の間隔 ≒ ${fringe}px`}
        </figcaption>
      </figure>
    </DemoStage>
  );
}
