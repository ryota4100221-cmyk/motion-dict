"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./SpringEasing.module.css";

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
const IDLE_WAIT = 2000; // この時間クリックが無ければ自走に戻る
const IDLE_STEP = 1800; // 自走時に左右を往復させる間隔
const SAMPLES = 40; // linear()に刻む点の数。40点あれば折れ線と実曲線の差は見えない

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

// 質量1・ばね定数k・減衰係数cの減衰振動を解いて、0→1の変位を返す。
// 減衰比 zeta で式が3つに分かれる。UIで使うのはほぼ zeta < 1(行き過ぎる)側だが、
// スライダーで damping を上げ切ると臨界・過減衰に入るので3本とも要る。
function displacement(k: number, c: number, t: number): number {
  const w0 = Math.sqrt(k);
  const zeta = c / (2 * Math.sqrt(k));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return (
      1 -
      Math.exp(-zeta * w0 * t) *
        (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t))
    );
  }
  if (zeta === 1) {
    return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  }
  const s = w0 * Math.sqrt(zeta * zeta - 1);
  const r1 = -zeta * w0 + s;
  const r2 = -zeta * w0 - s;
  return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
}

// ばねを duration 秒ぶん等間隔にサンプリングして CSS の linear() に落とす。
// 値だけを並べれば時間は自動で等分されるので、パーセント指定は書かない。
// 終端は必ず1に丸める(ばねが落ち着く前に尺が切れると、最後にカクッと跳ぶため)。
function springEasing(k: number, c: number, duration: number) {
  const values: number[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = (i / SAMPLES) * duration;
    values.push(displacement(k, c, t));
  }
  values[values.length - 1] = 1;
  const peak = Math.max(...values);
  return {
    css: `linear(${values.map((v) => v.toFixed(4)).join(", ")})`,
    peak,
  };
}

export default function SpringEasing({ params }: { params: ParamValues }) {
  const [on, setOn] = useState(false);
  const reduce = useReducedMotion();
  const lastInputRef = useRef(-Infinity);
  const touchedRef = useRef(false);

  const { css, peak } = useMemo(
    () => springEasing(params.stiffness, params.damping, params.duration),
    [params.stiffness, params.damping, params.duration]
  );

  // 無操作でも左右に往復させ続ける(録画・スクロール中のどちらでも動きが見える)。
  // 時刻は rAF から渡る time だけで扱う。
  useEffect(() => {
    return addTick((time) => {
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInputRef.current = time;
        return;
      }
      if (time - lastInputRef.current < IDLE_WAIT) return;
      setOn(Math.floor(time / IDLE_STEP) % 2 === 1);
    });
  }, []);

  const toggle = () => {
    touchedRef.current = true;
    setOn((v) => !v);
  };

  // reduced-motion では linear() を渡さず、transition ごと切って位置だけ確定させる。
  // 行き過ぎ(オーバーシュート)は目の負担そのものなので、弱めるのではなく外す。
  const vars = {
    "--spring": reduce ? "linear" : css,
    "--dur": reduce ? "0s" : `${params.duration}s`,
    "--x": on ? "var(--travel)" : "0px",
  } as React.CSSProperties;

  return (
    <DemoStage hint="PC: ステージをクリックで往復 / スマホ: タップ(無操作なら自動で往復)">
      <div
        className={styles.wrap}
        style={vars}
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <div className={styles.row}>
          <span className={styles.label}>spring</span>
          <div className={styles.track}>
            <div className={`${styles.chip} ${styles.spring}`} />
          </div>
        </div>

        {/* 比較用の対照。同じ尺・同じ距離でも「行き過ぎない」ことが一目で分かる */}
        <div className={styles.row}>
          <span className={styles.label}>ease-out</span>
          <div className={styles.track}>
            <div className={`${styles.chip} ${styles.easeOut}`} />
          </div>
        </div>

        <p className={styles.readout}>
          ζ={(params.damping / (2 * Math.sqrt(params.stiffness))).toFixed(2)}
          {" / overshoot "}
          {(peak * 100).toFixed(1)}%
        </p>
      </div>
    </DemoStage>
  );
}
