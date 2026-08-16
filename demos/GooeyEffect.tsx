"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./GooeyEffect.module.css";

const STOPS = [0, 1, 2, 3];

// SVGのユーザー単位。ドットの並びはgapで動くのでviewBoxは固定しておく
const VIEW_W = 320;
const VIEW_H = 90;
const CY = VIEW_H / 2;

const FILTER_ID = "gooeyDemoFilter";

const EASE = "cubic-bezier(0.5, 0, 0.2, 1)";

// 追従ブロブの遅れ。1.4倍前後で移動中に離れ、到着で1つに戻る
const TAIL_LAG = 1.45;

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

export default function GooeyEffect({ params }: { params: ParamValues }) {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  const gap = params.gap;
  const centerX = (i: number) => VIEW_W / 2 + (i - (STOPS.length - 1) / 2) * gap;

  // アルファ行は「倍率 / その半分の負値」で50%を境に切り立たせる
  const alphaScale = params.threshold;
  const alphaOffset = -alphaScale / 2;

  const blobStyle: CSSProperties = {
    transform: `translateX(${centerX(active)}px)`,
    transition: reduce ? "none" : `transform ${params.duration}s ${EASE}`,
  };

  const tailStyle: CSSProperties = {
    transform: `translateX(${centerX(active)}px)`,
    transition: reduce ? "none" : `transform ${params.duration * TAIL_LAG}s ${EASE}`,
  };

  return (
    <DemoStage hint="PC: ドットをクリック / スマホ: タップ">
      <div className={styles.wrap}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          aria-hidden
        >
          <defs>
            {/* 既定のフィルタ領域だとぼかしの裾が切れて融合が途切れる */}
            <filter
              id={FILTER_ID}
              x="-30%"
              y="-80%"
              width="160%"
              height="260%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation={params.blur}
                result="blurred"
              />
              {/* ぼけた裾野をアルファのコントラストで硬い輪郭に戻す＝融合の正体 */}
              <feColorMatrix
                in="blurred"
                type="matrix"
                values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${alphaScale} ${alphaOffset}`}
              />
            </filter>
          </defs>

          {/* 融合させたいものは必ず同じgにまとめる。個別に掛けると繋がらない */}
          <g filter={`url(#${FILTER_ID})`} className={styles.blobs}>
            {STOPS.map((i) => (
              <circle key={i} cx={centerX(i)} cy={CY} r={5} className={styles.stop} />
            ))}
            <circle cx={0} cy={CY} r={11} className={styles.tail} style={tailStyle} />
            <circle cx={0} cy={CY} r={15} className={styles.blob} style={blobStyle} />
          </g>
        </svg>

        {/* 当たり判定はフィルタ外の別レイヤーで取る(タッチでも押せる大きさ) */}
        {STOPS.map((i) => (
          <button
            key={i}
            type="button"
            className={styles.hit}
            style={{ left: `${(centerX(i) / VIEW_W) * 100}%` }}
            aria-label={`${i + 1}番目へ`}
            aria-pressed={i === active}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
    </DemoStage>
  );
}
