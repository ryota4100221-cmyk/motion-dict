"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./BootSequence.module.css";

const LINES = [
  "boot v2.1.0",
  "loading modules ... ok",
  "connecting api ... ok",
  "fetching assets ... ok",
  "ready",
];
const BLINK_MS = 800; // キャレット点滅周期

export default function BootSequence({ params }: { params: ParamValues }) {
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const caretRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // reduced-motion時は全行を即時表示し、キャレットは出さない
    if (reduce) {
      LINES.forEach((line, i) => {
        const row = rowRefs.current[i];
        const text = textRefs.current[i];
        if (row) row.style.opacity = "1";
        if (text) text.textContent = line;
      });
      return;
    }

    let startTime = -1;

    const removeTick = addTick((time) => {
      const p = paramsRef.current;
      if (startTime < 0) startTime = time;
      const elapsed = time - startTime;

      // 各行の開始時刻: 前の行のタイプ時間 + lineDelay の累積
      let lineStart = 0;
      let total = 0;
      for (const line of LINES) {
        total = lineStart + line.length * p.charSpeed;
        lineStart = total + p.lineDelay;
      }

      // 全行完了 → hold秒静止してループ
      if (elapsed > total + p.hold * 1000) {
        startTime = time;
        return;
      }

      const blinkOn = time % BLINK_MS < BLINK_MS / 2;
      lineStart = 0;
      LINES.forEach((line, i) => {
        const started = elapsed >= lineStart;
        const doneAt = lineStart + line.length * p.charSpeed;
        const nextStart = doneAt + p.lineDelay;
        const chars = Math.max(
          0,
          Math.min(Math.floor((elapsed - lineStart) / p.charSpeed), line.length)
        );
        // 「いまの行」= 開始済みで、次の行がまだ始まっていない行(最終行は完了後も保持)
        const isCurrent =
          started && (i === LINES.length - 1 || elapsed < nextStart);

        const row = rowRefs.current[i];
        const text = textRefs.current[i];
        const caret = caretRefs.current[i];
        if (row) row.style.opacity = started ? "1" : "0";
        if (text && text.textContent !== line.slice(0, chars))
          text.textContent = line.slice(0, chars);
        // タイプ中の行の末尾にだけキャレットを置いて点滅させる
        if (caret) caret.style.opacity = isCurrent && blinkOn ? "1" : "0";

        lineStart = nextStart;
      });
    });

    return removeTick;
  }, []);

  return (
    <DemoStage hint="自動でループ再生">
      <div className={styles.terminal}>
        <div className={styles.titlebar} aria-hidden>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
        <div className={styles.body}>
          {LINES.map((line, i) => (
            <div
              key={line}
              className={styles.row}
              ref={(el) => {
                rowRefs.current[i] = el;
              }}
            >
              <span className={styles.prompt} aria-hidden>
                {">"}
              </span>
              {/* 全文と同じ幅を透明ダミーで確保し、行が伸びてもレイアウトを動かさない */}
              <span className={styles.cell}>
                <span className={styles.ghost} aria-hidden>
                  {line}
                </span>
                <span className={styles.live}>
                  <span
                    ref={(el) => {
                      textRefs.current[i] = el;
                    }}
                  />
                  <span
                    className={styles.caret}
                    ref={(el) => {
                      caretRefs.current[i] = el;
                    }}
                    aria-hidden
                  >
                    ▌
                  </span>
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </DemoStage>
  );
}
