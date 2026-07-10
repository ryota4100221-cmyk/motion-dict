"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./MosaicReveal.module.css";

// content/mosaic-reveal.ts の tiles / order options と同順
const GRIDS = [
  [4, 3],
  [6, 4],
  [8, 5],
  [10, 6],
] as const;
const ORDERS = ["random", "sequential", "diagonal"] as const;

const TILE_FADE = 0.4; // タイル1枚のフェード時間(s)

// 出現順ごとに各タイルのdelay(ms)を組み立てる
function buildDelays(
  order: (typeof ORDERS)[number],
  cols: number,
  rows: number,
  stagger: number
): number[] {
  const count = cols * rows;
  if (order === "diagonal") {
    // 左上からの斜めライン(col+row)単位で遅らせる
    return Array.from(
      { length: count },
      (_, i) => ((i % cols) + Math.floor(i / cols)) * stagger
    );
  }
  const ranks = Array.from({ length: count }, (_, i) => i);
  if (order === "random") {
    // Fisher–Yates。sort+Math.random()は偏るので使わない
    for (let i = ranks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ranks[i], ranks[j]] = [ranks[j], ranks[i]];
    }
  }
  const delays = new Array<number>(count);
  ranks.forEach((tileIndex, rank) => {
    delays[tileIndex] = rank * stagger;
  });
  return delays;
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

export default function MosaicReveal({ params }: { params: ParamValues }) {
  const [covered, setCovered] = useState(false);
  const [snap, setSnap] = useState(false); // 覆い直しの瞬間はtransitionを切る
  const [busy, setBusy] = useState(false);
  const [delays, setDelays] = useState<number[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const [cols, rows] = GRIDS[Math.round(params.tiles)] ?? GRIDS[1];
  const count = cols * rows;
  const order = ORDERS[Math.round(params.order)] ?? "random";
  const stagger = Math.round(params.stagger);

  const play = () => {
    // reduced-motion: リプレイせず画像は常時表示のまま
    if (busy || reduce) return;
    const d = buildDelays(order, cols, rows, stagger);
    const max = Math.max(...d);
    setDelays(d);
    setBusy(true);
    // transitionなしで一気に覆い、次のフレームからstagger付きで消していく
    setSnap(true);
    setCovered(true);
    timersRef.current.push(
      setTimeout(() => {
        setSnap(false);
        setCovered(false);
      }, 60),
      setTimeout(() => setBusy(false), 60 + max + TILE_FADE * 1000 + 80)
    );
  };

  return (
    <DemoStage hint="クリック / タップ: リプレイ">
      <figure className={styles.card} onClick={play}>
        <div className={styles.frame}>
          <div className={styles.img} />
          <div
            className={styles.grid}
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
            }}
            aria-hidden
          >
            {Array.from({ length: count }, (_, i) => (
              <span
                key={i}
                className={styles.tile}
                style={{
                  opacity: covered ? 1 : 0,
                  transition: snap
                    ? "none"
                    : `opacity ${TILE_FADE}s ease ${delays[i] ?? 0}ms`,
                }}
              />
            ))}
          </div>
        </div>
        <figcaption className={styles.caption}>
          Fig.03 — mosaic reveal study
        </figcaption>
      </figure>
    </DemoStage>
  );
}
