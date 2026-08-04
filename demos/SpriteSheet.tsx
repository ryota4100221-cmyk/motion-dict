"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./SpriteSheet.module.css";

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

// content/sprite-sheet.ts の options と同順
const LOOP_ONCE = 0;
const LOOP_REPEAT = 1;
const LOOP_ALTERNATE = 2;
const TIMING_STEPS = 0;

// 1コマぶんの絵。跳ねる球を手描き風に「置き直す」だけで、間の絵は作らない
function Cel({ i, n, className }: { i: number; n: number; className?: string }) {
  const t = n > 1 ? i / (n - 1) : 0;
  const lift = Math.sin(Math.PI * t); // 0→1→0(接地→頂点→接地)
  // 接地コマは潰し、頂点コマは伸ばす(スクワッシュ&ストレッチ)
  const ball: CSSProperties = {
    left: `${(10 + t * 80).toFixed(2)}%`,
    bottom: `${(10 + lift * 50).toFixed(2)}%`,
    transform: `translate(-50%, 50%) scale(${(1.3 - 0.4 * lift).toFixed(3)}, ${(
      0.7 +
      0.4 * lift
    ).toFixed(3)})`,
  };

  return (
    <div className={className ? `${styles.cel} ${className}` : styles.cel}>
      <span className={styles.no}>{String(i + 1).padStart(2, "0")}</span>
      <span className={styles.ground} />
      <span className={styles.ball} style={ball} />
    </div>
  );
}

export default function SpriteSheet({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  // 再生のたびに帯をマウントし直して先頭コマから始める
  const [runId, setRunId] = useState(0);
  const [manual, setManual] = useState(0);

  const n = Math.round(params.frames);
  const loop = Math.round(params.loop);
  const smooth = Math.round(params.timing) !== TIMING_STEPS;
  const frames = Array.from({ length: n }, (_, i) => i);

  // ループは帯1本ぶん(=nコマ)送って先頭へ戻す。1回/往復は最終コマで止めたいので、
  // jump-endで最終コマが一瞬しか出ない問題を避けるため steps(n-1) と (n-1)/n の移動量にする
  const wrap = loop === LOOP_REPEAT;
  const stepCount = wrap ? n : Math.max(1, n - 1);
  const shift = wrap ? 100 : ((n - 1) / n) * 100;

  const stripStyle = {
    "--n": String(n),
    "--dur": `${params.duration}s`,
    "--timing": smooth ? "linear" : `steps(${stepCount})`,
    "--iter": loop === LOOP_ONCE ? "1" : "infinite",
    "--dir": loop === LOOP_ALTERNATE ? "alternate" : "normal",
    "--shift": `-${shift.toFixed(4)}%`,
    animationPlayState: playing ? "running" : "paused",
  } as CSSProperties;

  // reduced-motion時は自動再生せず、タップした回数ぶんだけコマを手で送る
  const manualStyle = {
    "--n": String(n),
    transform: `translateX(-${((manual % n) * (100 / n)).toFixed(4)}%)`,
  } as CSSProperties;

  const play = () => {
    setRunId((v) => v + 1);
    setPlaying(true);
  };
  const stop = () => {
    setRunId((v) => v + 1);
    setPlaying(false);
  };

  return (
    <DemoStage
      hint={
        reduce
          ? "reduced-motion: タップで1コマずつ手送り"
          : "PC: 窓にホバーで再生 / スマホ: タップで再生・停止"
      }
    >
      <div className={styles.wrap}>
        <div
          className={styles.window}
          onMouseEnter={reduce ? undefined : play}
          onMouseLeave={reduce ? undefined : stop}
          onTouchStart={
            reduce
              ? () => setManual((v) => v + 1)
              : () => (playing ? stop() : play())
          }
          onClick={reduce ? () => setManual((v) => v + 1) : undefined}
          aria-hidden
        >
          {reduce ? (
            <div className={`${styles.strip} ${styles.frozen}`} style={manualStyle}>
              {frames.map((i) => (
                <Cel key={i} i={i} n={n} />
              ))}
            </div>
          ) : (
            <div key={runId} className={styles.strip} style={stripStyle}>
              {frames.map((i) => (
                <Cel key={i} i={i} n={n} />
              ))}
            </div>
          )}
        </div>

        <div className={styles.caption}>
          {smooth ? "linear" : `steps(${stepCount})`} · {n} frames ·{" "}
          {params.duration.toFixed(2)}s
        </div>

        {/* 窓の外にある帯そのもの。1枚を横にずらして見せているだけだと分かるように */}
        <div className={styles.sheet} aria-hidden>
          {frames.map((i) => (
            <Cel key={i} i={i} n={n} className={styles.sheetCel} />
          ))}
        </div>
      </div>
    </DemoStage>
  );
}
