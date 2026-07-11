"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./StaggerGrid.module.css";

// content/stagger-grid.ts の direction options と同順
const DIRECTIONS = ["diagonal", "row", "column"] as const;

const COLS = 4;
const ROWS = 3;

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

// 方向ごとの遅延計算。diagonalは(行+列)なので同じ和のカードが同時に点く
function delayOf(row: number, col: number, dir: string, stagger: number): number {
  if (dir === "row") return row * stagger;
  if (dir === "column") return col * stagger;
  return (row + col) * stagger;
}

export default function StaggerGrid({ params }: { params: ParamValues }) {
  const [on, setOn] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useReducedMotion();

  // 初回表示時に1度だけ自動再生してデモの内容を伝える
  useEffect(() => {
    const kickoff = setTimeout(() => setOn(true), 400);
    return () => {
      clearTimeout(kickoff);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const play = () => {
    // reduced-motion: アニメーションなしで全カードの表示/非表示をトグル
    if (reduce) {
      setOn((o) => !o);
      return;
    }
    if (!on) {
      setOn(true);
      return;
    }
    // 再生済みなら、一度隠してから再点灯
    setOn(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOn(true), 60);
  };

  const dir = DIRECTIONS[Math.round(params.direction)] ?? "diagonal";

  const cards = Array.from({ length: ROWS * COLS }, (_, i) => {
    const row = Math.floor(i / COLS);
    const col = i % COLS;

    let cls = styles.card;
    let style: CSSProperties | undefined;
    if (on && reduce) {
      cls = `${styles.card} ${styles.shown}`;
    } else if (on) {
      cls = `${styles.card} ${styles.lit}`;
      style = {
        animationDelay: `${delayOf(row, col, dir, params.stagger)}s`,
        animationDuration: `${params.duration}s`,
      };
    }

    return (
      <div key={i} className={cls} style={style}>
        <span className={styles.dot} />
        <span className={styles.bar} />
      </div>
    );
  });

  return (
    <DemoStage hint="Play: 点灯を再生 / directionで進行方向を切替">
      <div className={styles.grid}>{cards}</div>
      <button className={styles.playBtn} onClick={play}>
        {on ? "Replay" : "Play"}
      </button>
    </DemoStage>
  );
}
