"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./GrainOverlay.module.css";

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

// feTurbulenceのノイズをdata URI化する。生成は初回とbaseFrequency変更時だけで、
// ゆらぎはこの画像を作り直さずtransformで動かす
function grainUri(baseFrequency: number): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">` +
    `<filter id="n">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${baseFrequency}" numOctaves="2" stitchTiles="stitch"/>` +
    `<feColorMatrix type="saturate" values="0"/>` +
    `</filter>` +
    `<rect width="100%" height="100%" filter="url(#n)"/>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default function GrainOverlay({ params }: { params: ParamValues }) {
  const grainRef = useRef<HTMLDivElement>(null);
  const [off, setOff] = useState(false);
  const paramsRef = useRef(params);
  const reduce = useReducedMotion();

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const uri = useMemo(() => grainUri(params.grain), [params.grain]);

  useEffect(() => {
    const el = grainRef.current;
    // reduced-motion時はゆらぎを止め、静止テクスチャとして重ねるだけ
    if (!el || reduce) return;

    let last = 0;
    const removeTick = addTick((time) => {
      const p = paramsRef.current;
      if (p.fps <= 0) return;
      if (time - last < 1000 / p.fps) return;
      last = time;
      // 200%サイズで敷いてあるので±12%飛ばしても端は露出しない
      const x = (Math.random() * 24 - 12).toFixed(1);
      const y = (Math.random() * 24 - 12).toFixed(1);
      el.style.transform = `translate(${x}%, ${y}%)`;
    });
    return removeTick;
  }, [reduce]);

  return (
    <DemoStage hint="PC: ホバーで粒子オフ(比較) / スマホ: タップで切替">
      <figure
        className={styles.card}
        onMouseEnter={() => setOff(true)}
        onMouseLeave={() => setOff(false)}
        onTouchStart={() => setOff((v) => !v)}
      >
        <div className={styles.frame}>
          <div className={styles.moon} aria-hidden />
          <span className={styles.title}>Night drive</span>
          <div
            ref={grainRef}
            className={styles.grain}
            style={{
              backgroundImage: `url("${uri}")`,
              opacity: off ? 0 : params.opacity,
            }}
            aria-hidden
          />
        </div>
        <figcaption className={styles.caption}>
          {off ? "Grain off" : "Grain on"} — opacity {params.opacity.toFixed(2)}
        </figcaption>
      </figure>
    </DemoStage>
  );
}
