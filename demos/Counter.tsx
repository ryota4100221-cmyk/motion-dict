"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./Counter.module.css";

const TARGET = 12480;

// content/counter.ts の ease options と同順
const EASES: ((t: number) => number)[] = [
  (t) => t, // linear
  (t) => 1 - Math.pow(1 - t, 3), // ease-out
  (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)), // expo-out
];

export default function Counter({ params }: { params: ParamValues }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const stage = stageRef.current;
    const el = numRef.current;
    if (!stage || !el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // reduced-motion時はカウントせず最終値を即表示
    if (reduce) {
      el.textContent = TARGET.toLocaleString("en-US");
      return;
    }

    let running = false;
    let startTime = 0;

    const start = () => {
      running = true;
      startTime = performance.now();
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      start();
    };

    el.addEventListener("mouseenter", start);
    stage.addEventListener("touchstart", onTouchStart, { passive: false });

    const removeTick = addTick((time) => {
      if (!running) return;
      const p = paramsRef.current;
      const t = Math.min((time - startTime) / (p.duration * 1000), 1);
      const ease = EASES[Math.round(p.ease)] ?? EASES[0];
      el.textContent = Math.round(ease(t) * TARGET).toLocaleString("en-US");
      if (t >= 1) {
        // 終了時は最終値ちょうどで止める
        running = false;
        el.textContent = TARGET.toLocaleString("en-US");
      }
    });

    // 初回表示時に1度だけ自動再生してデモの内容を伝える
    const kickoff = setTimeout(start, 400);

    return () => {
      clearTimeout(kickoff);
      removeTick();
      el.removeEventListener("mouseenter", start);
      stage.removeEventListener("touchstart", onTouchStart);
    };
  }, []);

  return (
    <DemoStage stageRef={stageRef} hint="PC: 数字にホバー / スマホ: タップ">
      <span className={styles.number} ref={numRef}>
        0
      </span>
    </DemoStage>
  );
}
