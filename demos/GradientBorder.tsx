"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./GradientBorder.module.css";

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

export default function GradientBorder({ params }: { params: ParamValues }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);
  const reduce = useReducedMotion();

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    // reduced-motion時は帯を1箇所に固定し、回さずに静的な枠として見せる
    if (reduce) {
      el.style.setProperty("--angle", "120deg");
      return;
    }
    // 角度変数だけを回す。conic-gradientの開始角が動いて光の帯が周回する
    const removeTick = addTick((time) => {
      const period = paramsRef.current.speed;
      const deg = ((time / 1000 / period) * 360) % 360;
      el.style.setProperty("--angle", `${deg.toFixed(1)}deg`);
    });
    return removeTick;
  }, [reduce]);

  const wrapStyle = {
    "--thickness": `${params.thickness}px`,
    "--glow": `${params.glow}px`,
  } as CSSProperties;

  return (
    <DemoStage hint="PC/スマホ: スライダーで速度・太さ・発光を変える">
      <div className={styles.wrap} ref={wrapRef} style={wrapStyle}>
        <div className={styles.glow} aria-hidden />
        <div className={styles.card}>
          <div className={styles.inner}>
            <span className={styles.kicker}>PRO</span>
            <span className={styles.title}>Gradient border</span>
            <span className={styles.sub}>conic border glow</span>
          </div>
        </div>
      </div>
    </DemoStage>
  );
}
