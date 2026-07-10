"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./NumberRoll.module.css";

const TARGET = "6,048";

// 0〜9を2周分。2周目(10+d行目)を目標にすると小さい数字でも必ず1回転する
const CELLS = Array.from({ length: 20 }, (_, i) => i % 10);

// transitionのリセットを確定させるため、reflowを強制する
function forceReflow(el: HTMLElement) {
  return el.offsetHeight;
}

export default function NumberRoll({ params }: { params: ParamValues }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLSpanElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const stage = stageRef.current;
    const row = rowRef.current;
    if (!stage || !row) return;

    const cols = Array.from(
      row.querySelectorAll<HTMLElement>(`.${styles.column}`)
    );
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 2周目側の目標数字の位置(セル高=1em)
    const finalTransform = (col: HTMLElement) =>
      `translateY(${-(10 + Number(col.dataset.digit))}em)`;

    // reduced-motion時は回転させず最終値を即表示
    if (reduce) {
      for (const col of cols) {
        col.style.transition = "none";
        col.style.transform = finalTransform(col);
      }
      return;
    }

    const play = () => {
      const p = paramsRef.current;
      // 全桁を0の位置へ戻す(transitionなしで即座に)
      for (const col of cols) {
        col.style.transition = "none";
        col.style.transform = "translateY(0)";
      }
      forceReflow(row);
      // 左の桁から順にstaggerをかけて目標まで回す
      cols.forEach((col, i) => {
        col.style.transition = `transform ${p.duration}s cubic-bezier(0.22, 1, 0.36, 1) ${i * p.stagger}ms`;
        col.style.transform = finalTransform(col);
      });
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      play();
    };

    row.addEventListener("mouseenter", play);
    stage.addEventListener("touchstart", onTouchStart, { passive: false });

    // 初回表示時に1度だけ自動再生してデモの内容を伝える
    const kickoff = setTimeout(play, 400);

    return () => {
      clearTimeout(kickoff);
      row.removeEventListener("mouseenter", play);
      stage.removeEventListener("touchstart", onTouchStart);
    };
  }, []);

  return (
    <DemoStage stageRef={stageRef} hint="PC: 数字にホバー / スマホ: タップ">
      <span className={styles.row} ref={rowRef}>
        {TARGET.split("").map((ch, i) =>
          /\d/.test(ch) ? (
            <span className={styles.mask} key={i}>
              <span className={styles.column} data-digit={ch}>
                {CELLS.map((n, j) => (
                  <span className={styles.cell} key={j}>
                    {n}
                  </span>
                ))}
              </span>
            </span>
          ) : (
            // カンマなどの記号は回さず静的に置く
            <span className={styles.symbol} key={i}>
              {ch}
            </span>
          )
        )}
      </span>
    </DemoStage>
  );
}
