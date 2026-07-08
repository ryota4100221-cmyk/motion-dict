"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./Typewriter.module.css";

const TEXT = "Hello, I'm monaka design.";
const HOLD_MS = 1500; // 打ち終わってからクリアまでの静止時間

export default function Typewriter({ params }: { params: ParamValues }) {
  const textRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const el = textRef.current;
    const caret = caretRef.current;
    if (!el || !caret) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // reduced-motion時は全文を即表示し、キャレットは点滅させない
    if (reduce) {
      el.textContent = TEXT;
      caret.style.opacity = "1";
      return;
    }

    let startTime = -1;
    let shown = -1;

    const removeTick = addTick((time) => {
      const p = paramsRef.current;
      if (startTime < 0) startTime = time;
      const elapsed = time - startTime;

      // 打ち終わったらHOLD_MSだけ静止 → クリアしてループ
      if (elapsed > TEXT.length * p.speed + HOLD_MS) {
        startTime = time;
        shown = -1;
        el.textContent = "";
        return;
      }

      const count = Math.min(Math.floor(elapsed / p.speed), TEXT.length);
      if (count !== shown) {
        shown = count;
        el.textContent = TEXT.slice(0, count);
      }

      // キャレット点滅: 周期blink秒の前半で表示、後半で非表示
      const cycle = p.blink * 1000;
      caret.style.opacity = time % cycle < cycle / 2 ? "1" : "0";
    });

    return removeTick;
  }, []);

  return (
    <DemoStage hint="自動でループ再生">
      <span className={styles.line}>
        {/* 全文と同じ幅を先に確保して、タイプ中にレイアウトが動かないようにする */}
        <span className={styles.ghost} aria-hidden>
          {TEXT}
        </span>
        <span className={styles.live}>
          <span ref={textRef} className={styles.text} />
          <span ref={caretRef} className={styles.caret} aria-hidden>
            ▌
          </span>
        </span>
      </span>
    </DemoStage>
  );
}
