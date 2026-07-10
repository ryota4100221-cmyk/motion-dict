"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./CurtainWipe.module.css";

// content/curtain-wipe.ts の direction options と同順(カーテンの進行方向)
const DIRECTIONS = ["left", "right", "up"] as const;

// 進行方向ごとの設定: 覆うとき/引けるときの transform-origin と伸縮軸。
// originを反転させることで、カーテンが同じ方向へ通り抜けて見える。
const WIPES: Record<
  (typeof DIRECTIONS)[number],
  { cover: string; reveal: string; axis: "scaleX" | "scaleY" }
> = {
  left: { cover: "right", reveal: "left", axis: "scaleX" },
  right: { cover: "left", reveal: "right", axis: "scaleX" },
  up: { cover: "bottom", reveal: "top", axis: "scaleY" },
};

const STAGGER = 0.06; // 短冊ごとの時間差(60ms)

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

export default function CurtainWipe({ params }: { params: ParamValues }) {
  const [page, setPage] = useState<"A" | "B">("A");
  const [covered, setCovered] = useState(false);
  const [busy, setBusy] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const dir = DIRECTIONS[Math.round(params.direction)] ?? "left";
  const wipe = WIPES[dir];
  const panels = Math.round(params.panels);

  const play = () => {
    if (busy) return;
    // reduced-motion: カーテンなしで即座にページ切り替え
    if (reduce) {
      setPage((p) => (p === "A" ? "B" : "A"));
      return;
    }
    const oneWay = params.duration * 1000 + (panels - 1) * STAGGER * 1000;
    setBusy(true);
    setCovered(true);
    timersRef.current.push(
      // 完全に覆った瞬間にページを差し替え、カーテンを引く
      setTimeout(() => {
        setPage((p) => (p === "A" ? "B" : "A"));
        setCovered(false);
      }, oneWay + 60),
      setTimeout(() => setBusy(false), oneWay * 2 + 160)
    );
  };

  const panelStyle = (i: number): CSSProperties => ({
    transform: covered ? `${wipe.axis}(1)` : `${wipe.axis}(0)`,
    transformOrigin: covered ? wipe.cover : wipe.reveal,
    transition: `transform ${params.duration}s cubic-bezier(0.77, 0, 0.175, 1) ${
      i * STAGGER
    }s`,
  });

  return (
    <DemoStage hint="Play: ページ遷移を再生">
      <div
        className={
          page === "B" ? `${styles.pageFrame} ${styles.frameB}` : styles.pageFrame
        }
      >
        <span className={page === "A" ? styles.labelA : styles.labelB}>
          Page {page}
        </span>
        <div className={styles.panels} aria-hidden>
          {Array.from({ length: panels }, (_, i) => (
            <span key={i} className={styles.panel} style={panelStyle(i)} />
          ))}
        </div>
      </div>
      <button className={styles.playBtn} onClick={play} disabled={busy}>
        Play
      </button>
    </DemoStage>
  );
}
