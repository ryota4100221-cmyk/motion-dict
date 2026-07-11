"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./LiquidFill.module.css";

// 容器(clip)は中心(60,60)・半径50の円。底=y110、上端=y10
const CLIP_R = 50;
const BOTTOM_Y = 110;

// 波形パス。波長60px×4周期=横幅240pxの面を作る。
// CSS側で translateX を 0 → -120px(波長の2倍)動かすと元と同じ絵に戻り、
// 繋ぎ目なしでループする。invert で山谷を反転させ、2枚目の位相をずらす
function wavePath(amplitude: number, invert: boolean): string {
  const a = (invert ? -1 : 1) * amplitude * 2; // 二次ベジェの中点は制御点の半分の高さ
  let d = "M0 0";
  for (let i = 0; i < 4; i++) {
    d += ` q15 ${-a} 30 0 q15 ${a} 30 0`;
  }
  return d + " V130 H0 Z";
}

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

export default function LiquidFill({ params }: { params: ParamValues }) {
  const [filled, setFilled] = useState(false);
  const [instant, setInstant] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useReducedMotion();
  const clipId = useId();

  // 初回表示時に1度だけ自動再生してデモの内容を伝える
  useEffect(() => {
    const kickoff = setTimeout(() => setFilled(true), 400);
    return () => {
      clearTimeout(kickoff);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const play = () => {
    // reduced-motion: アニメーションなしで最終水位の表示/リセットをトグル
    if (reduce) {
      setFilled((f) => !f);
      return;
    }
    if (!filled) {
      setInstant(false);
      setFilled(true);
      return;
    }
    // 再生済みなら、一度0%に戻してから再充填
    setInstant(true);
    setFilled(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setInstant(false);
      setFilled(true);
    }, 50);
  };

  const shown = filled ? params.progress : 0;
  // 底(y110)から進捗ぶん上げる。100%時は波の谷が容器上端より上に来るよう
  // 振幅ぶん余分に持ち上げ、満タンで波が見えなくなるようにする
  const waterY = BOTTOM_Y - (shown / 100) * (CLIP_R * 2 + params.amplitude * 2);

  const levelStyle: CSSProperties = {
    transform: `translateY(${waterY}px)`,
    transition:
      instant || reduce
        ? "none"
        : `transform ${params.duration}s cubic-bezier(0.16, 1, 0.3, 1)`,
  };

  // 背面の波は周期を1.6倍にして前後の水面をずらし、奥行きを出す
  const backStyle: CSSProperties = { animationDuration: `${params.speed * 1.6}s` };
  const frontStyle: CSSProperties = { animationDuration: `${params.speed}s` };
  const waveClass = reduce ? styles.wave : `${styles.wave} ${styles.waving}`;

  const labelStyle: CSSProperties = {
    opacity: filled ? 1 : 0,
    transition: instant || reduce ? "none" : `opacity ${params.duration}s ease-out`,
  };

  return (
    <DemoStage hint="Play: 充填を再生">
      <div className={styles.wrap}>
        <svg className={styles.svg} width="130" height="130" viewBox="0 0 120 120">
          <defs>
            <clipPath id={clipId}>
              <circle cx="60" cy="60" r={CLIP_R} />
            </clipPath>
          </defs>
          <circle className={styles.vessel} cx="60" cy="60" r="55" />
          <g clipPath={`url(#${clipId})`}>
            {/* 水位(translateY)のグループの中で波(translateX)を回す。transformの衝突なし */}
            <g style={levelStyle}>
              <path
                className={`${waveClass} ${styles.waveBack}`}
                style={backStyle}
                d={wavePath(params.amplitude, true)}
              />
              <path
                className={`${waveClass} ${styles.waveFront}`}
                style={frontStyle}
                d={wavePath(params.amplitude, false)}
              />
            </g>
          </g>
        </svg>
        <span className={styles.label} style={labelStyle}>
          {Math.round(params.progress)}%
        </span>
      </div>
      <button className={styles.playBtn} onClick={play}>
        {filled ? "Replay" : "Play"}
      </button>
    </DemoStage>
  );
}
