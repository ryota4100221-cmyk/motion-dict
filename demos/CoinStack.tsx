"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./CoinStack.module.css";

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

// 5列×4段＝20枚。左の列から右へ1枚ずつ置き、1段埋まったら上の段へ(観察元と同じ並び)
const COLS = 5;
const ROWS = 4;
const GAP_X = 47; // 列の間隔 px
const LAYER = 12; // 1段ぶんの高さ px
const TILTS = [-5, 0, 5, -1, 4]; // 着地したときの傾き(列ごとに少しずつ崩す)
const COINS = Array.from({ length: COLS * ROWS }, (_, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  return {
    x: (col - (COLS - 1) / 2) * GAP_X,
    lift: -row * LAYER,
    tilt: TILTS[col],
    spin: ((i * 71 + 200) % 360) - 180, // 落ちている間の面の向き(枚ごとにばらつかせる)
  };
});

const LAND_AT = 0.84; // 1枚のアニメーションのうち着地する位置(残りは小さく跳ねて落ち着く分)
const HOLD_MS = 1200; // 積み終わってから崩すまで
const WIPE_MS = 450; // 山を消す時間

export default function CoinStack({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [run, setRun] = useState(0);
  const [wiping, setWiping] = useState(false);

  const coinMs = (params.fall * 1000) / LAND_AT;

  // 無操作でも、積み終わり→1.2s置く→山を消す→最初から積み直す(ずっと繰り返す)。ボタンで数え直す
  useEffect(() => {
    if (reduce) return;
    const built = params.stagger * (COINS.length - 1) + coinMs;
    const t1 = setTimeout(() => setWiping(true), built + HOLD_MS);
    const t2 = setTimeout(() => {
      setWiping(false);
      setRun((r) => r + 1);
    }, built + HOLD_MS + WIPE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [run, reduce, coinMs, params.stagger]);

  const restart = () => {
    setWiping(false);
    setRun((r) => r + 1);
  };

  const vars = {
    "--cs-anim": `${coinMs}ms`,
    "--cs-height": `${params.height}px`,
    "--cs-bounce": `${params.bounce}px`,
  } as CSSProperties;

  return (
    <DemoStage hint="PC/スマホ: 表示でコインが積み上がる／ボタンで落とし直す">
      <div className={styles.desk} style={vars} data-reduce={reduce ? "" : undefined}>
        <div className={styles.pile} data-wiping={wiping ? "" : undefined} aria-hidden>
          {COINS.map((c, i) => (
            <span
              // 接頭辞付きの key で、積み直すたびにノードごと作り直してアニメーションを頭から流す
              key={`cs-${run}-${i}`}
              className={styles.coin}
              style={
                {
                  "--cs-x": `${c.x}px`,
                  "--cs-lift": `${c.lift}px`,
                  "--cs-tilt": `${c.tilt}deg`,
                  "--cs-spin": `${c.spin}deg`,
                  "--cs-delay": `${i * params.stagger}ms`,
                } as CSSProperties
              }
            >
              <span className={styles.face}>
                <span className={styles.glyph}>✳</span>
              </span>
              <span className={styles.edge} />
            </span>
          ))}
        </div>

        <p className={styles.caption}>
          <span className={styles.dot} aria-hidden />
          Loading the glossary
        </p>

        <button type="button" className={styles.again} onClick={restart}>
          Drop coins again
        </button>
      </div>
    </DemoStage>
  );
}
