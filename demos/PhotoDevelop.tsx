"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties, PointerEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./PhotoDevelop.module.css";

// コンタクトシート 3段×5コマ。blur-load(07)・rack-focus(02/03)と重ならない15枚
const PHOTOS = [1, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const COLS = 5;
const ROWS = 3;

// 出典 patike.ch の遅延式: 150 + 90 * hypot(列, 1.6 * 行) ms（列・行は中央のコマからのずれ）。
// 行に 1.6 を掛けるのは、コマの縦の間隔が横より詰まって見えるぶん、縦方向の波を遅らせるため
const FIRST_DELAY = 150;
const ROW_WEIGHT = 1.6;

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

export default function PhotoDevelop({ params }: { params: ParamValues }) {
  // シート全体を焼き直す回数(増やすとコマを作り直し、CSSアニメーションを頭から再生)
  const [sheet, setSheet] = useState(0);
  // 1コマだけ焼き直した回数(コマごと)。0より大きいコマは待ちなしで始める
  const [single, setSingle] = useState<number[]>(() => PHOTOS.map(() => 0));
  const [lit, setLit] = useState<number | null>(null);
  const reduce = useReducedMotion();

  const { duration, exposure, contrast, stagger } = params;

  const developAll = () => {
    setSingle(PHOTOS.map(() => 0));
    setSheet((s) => s + 1);
  };

  const developOne = (i: number) => {
    setSingle((cur) => cur.map((v, k) => (k === i ? v + 1 : v)));
  };

  // マウスは乗っている間だけ明るくし、押したらそのコマだけ焼き直す。タッチはタップで焼き直しのみ
  const onEnter = (i: number) => (e: PointerEvent) => {
    if (e.pointerType === "mouse") setLit(i);
  };
  const onLeave = (e: PointerEvent) => {
    if (e.pointerType === "mouse") setLit(null);
  };

  const sheetStyle = {
    "--pdv-dur": `${duration}s`,
    "--pdv-exp": `${exposure}`,
    "--pdv-con": `${contrast}`,
  } as CSSProperties;

  // 値を動かしたら作り直して焼き直す(スライダーの効き目がすぐ見える)
  const keyBase = `sheet-${sheet}-${duration}-${exposure}-${contrast}-${stagger}`;

  return (
    <DemoStage hint="写真を押す: 1コマ焼き直し">
      <div className={styles.table} data-md-bleed="">
        <div className={styles.sheet} style={sheetStyle}>
          {Array.from({ length: ROWS }, (_, r) => (
            <div key={r} className={styles.strip}>
              {Array.from({ length: COLS }, (_, c) => {
                const i = r * COLS + c;
                const dc = c - (COLS - 1) / 2;
                const dr = r - (ROWS - 1) / 2;
                const delay =
                  single[i] > 0 ? 0 : FIRST_DELAY + stagger * Math.hypot(dc, ROW_WEIGHT * dr);
                const no = String(PHOTOS[i]).padStart(2, "0");
                return (
                  <div key={c} className={styles.cell}>
                    <span className={styles.label} aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                      <span className={styles.arrow}> ▸{i + 1}A</span>
                    </span>
                    <button
                      type="button"
                      aria-label={`Develop plate ${no} again`}
                      className={lit === i ? `${styles.frame} ${styles.lit}` : styles.frame}
                      onPointerEnter={onEnter(i)}
                      onPointerLeave={onLeave}
                      onClick={() => developOne(i)}
                    >
                      <span
                        key={`${keyBase}-${i}-${single[i]}`}
                        className={reduce ? styles.print : `${styles.print} ${styles.develop}`}
                        style={{ animationDelay: `${Math.round(delay)}ms` }}
                      >
                        <img
                          src={`/motion-dict/demo/photo-${no}.jpg`}
                          alt=""
                          draggable={false}
                          className={styles.photo}
                        />
                      </span>
                    </button>
                    {c % 2 === 0 && (
                      <span className={styles.edge} aria-hidden>
                        Folio 121
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <button className={styles.btn} onClick={developAll} data-develop-all="">
        Develop again
      </button>
    </DemoStage>
  );
}
