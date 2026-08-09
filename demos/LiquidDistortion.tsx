"use client";

import { useId, useState, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./LiquidDistortion.module.css";

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

export default function LiquidDistortion({ params }: { params: ParamValues }) {
  const [off, setOff] = useState(false);
  const reduce = useReducedMotion();

  // filterのIDはページ内で一意にする。useIdの記号はurl(#...)で使えないので落とす
  const filterId = `liquid-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const freq = params.frequency;
  const peak = Number((freq * 1.7).toFixed(4));
  // reduced-motion時は<animate>を出さず、歪んだ状態のまま静止させる
  const animated = !reduce && !off;

  return (
    <DemoStage hint="PC: ホバーで歪みオフ(比較) / スマホ: タップで切替">
      <figure
        className={styles.card}
        onMouseEnter={() => setOff(true)}
        onMouseLeave={() => setOff(false)}
        onTouchStart={() => setOff((v) => !v)}
      >
        <svg className={styles.defs} aria-hidden>
          <defs>
            <filter
              id={filterId}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency={`${freq} ${freq}`}
                numOctaves={params.octaves}
                seed="7"
                result="turb"
              >
                {animated && (
                  <animate
                    attributeName="baseFrequency"
                    dur={`${params.duration}s`}
                    values={`${freq} ${freq}; ${peak} ${peak}; ${freq} ${freq}`}
                    keyTimes="0; 0.5; 1"
                    calcMode="spline"
                    keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
                    repeatCount="indefinite"
                  />
                )}
              </feTurbulence>
              <feDisplacementMap
                in="SourceGraphic"
                in2="turb"
                scale={off ? 0 : params.scale}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>

        <div className={styles.frame}>
          {/* 歪ませるのはこの層だけ。フィルタは面ごと再計算されるので範囲を絞る */}
          <div className={styles.surface} style={{ filter: `url(#${filterId})` }}>
            <div className={styles.stripes} aria-hidden />
            <span className={styles.word}>LIQUID</span>
          </div>
        </div>

        <figcaption className={styles.caption}>
          {off
            ? "Distortion off"
            : `scale ${params.scale}px / baseFrequency ${freq}`}
        </figcaption>
      </figure>
    </DemoStage>
  );
}
