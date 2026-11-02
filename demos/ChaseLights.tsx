"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ChaseLights.module.css";

// content/chase-lights.ts の direction options と同順: 0=clockwise, 1=counterclockwise
const CLOCKWISE = 0;

// 看板の縁の電球。上辺13個(角を含む)・右辺5個・下辺13個・左辺5個=36個。
// 36 は 2・3・4 のどれでも割り切れるので、組の数を変えても角で継ぎ目が出ない
const COLS = 12; // 上辺の間隔の数(電球は COLS+1 個)
const ROWS = 6; // 縦辺の間隔の数(角を除いた電球は ROWS-1 個)

// 左上の角から時計回りに番号を振った位置(縁の枠に対する %)
const BULBS: { x: number; y: number }[] = (() => {
  const pts: { x: number; y: number }[] = [];
  for (let c = 0; c <= COLS; c++) pts.push({ x: (c / COLS) * 100, y: 0 });
  for (let r = 1; r < ROWS; r++) pts.push({ x: 100, y: (r / ROWS) * 100 });
  for (let c = COLS; c >= 0; c--) pts.push({ x: (c / COLS) * 100, y: 100 });
  for (let r = ROWS - 1; r >= 1; r--) pts.push({ x: 0, y: (r / ROWS) * 100 });
  return pts;
})();

// 点け直すとき1個あたりの遅れ(出典 18ms)
const POWER_STEP = 0.018;

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

export default function ChaseLights({ params }: { params: ParamValues }) {
  const [on, setOn] = useState(true);
  // 点け直すたびに増やし、電球を作り直して「順に点く」を頭から再生する
  const [run, setRun] = useState(0);
  const reduce = useReducedMotion();

  const cycle = params.cycle;
  const groups = Math.max(2, Math.round(params.groups));
  const clockwise = Math.round(params.direction) === CLOCKWISE;

  const toggle = () => {
    if (!on) setRun((r) => r + 1);
    setOn((v) => !v);
  };

  const signStyle = {
    "--cl-cycle": `${cycle}s`,
    "--cl-dim": String(params.dim / 100),
  } as CSSProperties;

  return (
    <DemoStage hint="看板をクリック/タップ: 消して順に点け直す">
      <div className={styles.room}>
        <div
          className={`${styles.sign} ${on ? "" : styles.off} ${reduce ? styles.still : ""}`}
          style={signStyle}
          onClick={toggle}
          aria-hidden
        >
          <div className={styles.plate}>
            <span className={styles.kicker}>
              <i className={styles.mark} />
              Now showing · Entry 207
            </span>
            <span className={styles.title}>Chase lights</span>
            <span className={styles.word}>ピカピカ · Marquee bulbs</span>
          </div>

          <div className={styles.rail}>
            {BULBS.map((b, i) => {
              const k = i % groups;
              // 時計回り=番号が進むほど遅らせる。負の delay で最初から位相がずれた状態で始める
              const lag = clockwise ? k : (groups - k) % groups;
              const delay = (lag * cycle) / groups - cycle;
              return (
                <span
                  key={`bulb-${run}-${i}`}
                  className={styles.bulb}
                  style={
                    {
                      left: `${b.x}%`,
                      top: `${b.y}%`,
                      animationDelay: `${(i * POWER_STEP).toFixed(3)}s`,
                    } as CSSProperties
                  }
                >
                  <span className={styles.lamp} style={{ animationDelay: `${delay.toFixed(3)}s` }} />
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <button className={styles.btn} onClick={toggle}>
        {on ? "Switch off" : "Switch on"}
      </button>
    </DemoStage>
  );
}
