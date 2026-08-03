"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./MarchingAnts.module.css";

// content/marching-ants.ts の direction options と同順: 0=forward, 1=reverse
const FORWARD = 0;

// source → filter、filter → output をつなぐエルボー経路
const WIRE_A = "M 76 75 H 97 V 37 H 118";
const WIRE_B = "M 182 37 H 203 V 113 H 224";

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

export default function MarchingAnts({ params }: { params: ParamValues }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [paused, setPaused] = useState(false);
  const paramsRef = useRef(params);
  const pausedRef = useRef(paused);
  const reduce = useReducedMotion();

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const svg = svgRef.current;
    // reduced-motion時は流さない=静止した破線のまま(向きは矢印で伝わる)
    if (!svg || reduce) return;
    const targets = Array.from(
      svg.querySelectorAll<SVGGeometryElement>(`.${styles.march}`)
    );

    let pos = 0;
    let lastTime = -1;

    return addTick((time) => {
      const p = paramsRef.current;
      if (lastTime < 0) lastTime = time;
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      if (pausedRef.current) return;

      // 1周期 = dash + gap。この幅で剰余を取るので、何周してもズレが溜まらない
      const unit = p.dash + p.gap;
      if (unit <= 0) return;
      pos = (pos + (unit / p.cycle) * dt) % unit;

      // offsetを減らす向きが始点→終点。reverseは増やす向き
      const offset = Math.round(p.direction) === FORWARD ? unit - pos : pos;
      for (const el of targets) el.style.strokeDashoffset = String(offset);
    });
  }, [reduce]);

  const forward = Math.round(params.direction) === FORWARD;
  const dash = { strokeDasharray: `${params.dash} ${params.gap}` };

  return (
    <DemoStage hint="Pause: 流れを止めて破線の形を見る">
      <svg ref={svgRef} viewBox="0 0 300 150" className={styles.svg} aria-hidden>
        <rect className={styles.node} x="12" y="58" width="64" height="34" rx="3" />
        <rect className={styles.node} x="118" y="20" width="64" height="34" rx="3" />
        <rect className={styles.node} x="224" y="96" width="64" height="34" rx="3" />
        <text className={styles.label} x="44" y="79" textAnchor="middle">
          source
        </text>
        <text className={styles.label} x="150" y="41" textAnchor="middle">
          filter
        </text>
        <text className={styles.label} x="256" y="117" textAnchor="middle">
          output
        </text>

        {/* 下に実線のベースライン、上に流れる破線を重ねる */}
        <path className={styles.base} d={WIRE_A} />
        <path className={styles.base} d={WIRE_B} />
        <path className={styles.march} style={dash} d={WIRE_A} />
        <path className={styles.march} style={dash} d={WIRE_B} />

        {/* 静止時(reduced-motion・Pause中)にも向きが分かるよう終端に矢印 */}
        {forward ? (
          <>
            <path className={styles.arrow} d="M 118 37 L 112 33.8 L 112 40.2 Z" />
            <path className={styles.arrow} d="M 224 113 L 218 109.8 L 218 116.2 Z" />
          </>
        ) : (
          <>
            <path className={styles.arrow} d="M 76 75 L 82 71.8 L 82 78.2 Z" />
            <path className={styles.arrow} d="M 182 37 L 188 33.8 L 188 40.2 Z" />
          </>
        )}

        {/* 名前の由来である「選択範囲の枠」も同じ原理で流れる */}
        <rect
          className={styles.march}
          style={dash}
          x="218"
          y="90"
          width="76"
          height="46"
          rx="4"
        />
      </svg>

      <button className={styles.playBtn} onClick={() => setPaused((v) => !v)}>
        {paused ? "Play" : "Pause"}
      </button>
    </DemoStage>
  );
}
