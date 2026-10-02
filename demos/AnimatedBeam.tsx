"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./AnimatedBeam.module.css";

const HUB = { x: 160, y: 95 };
const COUNT = 8;
// 黄金比で開始位置をばらす。乱数と違い毎回同じ並びになるので録画が安定する
const PHASE_STEP = 0.618034;

// ハブから楕円上のノードへ、始点側と終点側で逆向きに少し曲げた3次ベジェ
const NODES = Array.from({ length: COUNT }, (_, i) => {
  const a = (i / COUNT) * Math.PI * 2 + 0.3;
  const x = HUB.x + Math.cos(a) * 128;
  const y = HUB.y + Math.sin(a) * 70;
  const dx = x - HUB.x;
  const dy = y - HUB.y;
  const bend = 0.28;
  const c1 = { x: HUB.x + dx * 0.35 - dy * bend, y: HUB.y + dy * 0.35 + dx * bend * 0.5 };
  const c2 = { x: HUB.x + dx * 0.7 + dy * bend, y: HUB.y + dy * 0.7 - dx * bend * 0.5 };
  const f = (n: number) => n.toFixed(1);
  return {
    x,
    y,
    d: `M ${HUB.x} ${HUB.y} C ${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(x)} ${f(y)}`,
  };
});

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

export default function AnimatedBeam({ params }: { params: ParamValues }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const paramsRef = useRef(params);
  // ノードに触れたら、その線の周期をいま始まったことにする(時刻はrAF側で確定)
  const fireRef = useRef<boolean[]>(new Array(COUNT).fill(false));
  const reduce = useReducedMotion();

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    if (reduce) return;
    const shift = NODES.map((_, i) => (i * PHASE_STEP) % 1);

    return addTick((time) => {
      const svg = svgRef.current;
      if (!svg) return;
      const p = paramsRef.current;
      // ノードが入れ替わっても追従できるよう毎フレーム引き直す
      const beams = svg.querySelectorAll<SVGPathElement>(`.${styles.beam}`);
      const dots = svg.querySelectorAll<SVGCircleElement>(`.${styles.node}`);
      const base = time / 1000 / p.cycle;
      const active = p.active / 100;
      const tail = p.tail;

      for (let i = 0; i < COUNT; i++) {
        if (fireRef.current[i]) {
          fireRef.current[i] = false;
          shift[i] = (1 - (base % 1)) % 1;
        }
        const t = (base + shift[i]) % 1;
        const beam = beams[i];
        const dot = dots[i];
        if (!beam || !dot) continue;

        if (t >= active) {
          beam.style.opacity = "0";
          dot.classList.remove(styles.lit);
          continue;
        }
        // 進行度sを 0→1+tail まで進める。頭は終点で止まり、尾が追いついて消える
        const s = (t / active) * (1 + tail);
        const head = Math.min(1, s);
        const from = Math.max(0, s - tail);
        beam.style.opacity = "1";
        beam.style.strokeDasharray = `${(head - from).toFixed(4)} 2`;
        beam.style.strokeDashoffset = (-from).toFixed(4);
        dot.classList.toggle(styles.lit, s >= 1);
      }
    });
  }, [reduce]);

  const fire = (i: number) => {
    fireRef.current[i] = true;
  };

  return (
    <DemoStage hint="PC: ノードにホバーで即送信 / スマホ: ノードをタップ">
      <svg
        ref={svgRef}
        viewBox="0 0 320 190"
        className={`${styles.svg} ${reduce ? styles.still : ""}`}
        aria-hidden
      >
        {NODES.map((n, i) => (
          <path key={`base-${i}`} className={styles.base} d={n.d} />
        ))}
        <g className={styles.glow}>
          {NODES.map((n, i) => (
            <path key={`beam-${i}`} className={styles.beam} d={n.d} pathLength={1} />
          ))}
        </g>
        {NODES.map((n, i) => (
          <circle
            key={`node-${i}`}
            className={`${styles.node} ${reduce ? styles.lit : ""}`}
            cx={n.x}
            cy={n.y}
            r={7}
            onPointerEnter={() => fire(i)}
            onPointerDown={() => fire(i)}
          />
        ))}
        <circle className={styles.hub} cx={HUB.x} cy={HUB.y} r={11} />
      </svg>
    </DemoStage>
  );
}
