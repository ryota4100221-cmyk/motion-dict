"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./Accordion.module.css";

// content/accordion.ts の easing options と同順(CSSのtransition-timing-function値)
const EASINGS = ["ease", "ease-out", "cubic-bezier(0.22, 1, 0.36, 1)"];

const ITEMS = [
  {
    q: "WHY GRID?",
    a: "height: auto はアニメーション不可。grid-template-rows: 0fr→1fr なら「中身の高さぶん」を数値なしで動かせる。",
  },
  {
    q: "WHY NOT MAX-HEIGHT?",
    a: "決め打ちの max-height は内容量が変わると破綻する。長いと途中で切れ、短いと速度が狂う。",
  },
  {
    q: "THE ONE TRICK?",
    a: "グリッド内側に min-height: 0 と overflow: hidden。これがないと 0fr でも潰れず閉じない。",
  },
];

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

export default function Accordion({ params }: { params: ParamValues }) {
  const [openIndex, setOpenIndex] = useState(0);
  const reduce = useReducedMotion();

  const easing = EASINGS[Math.round(params.easing)] ?? "ease-out";

  // reduced-motion時はtransitionなしで即時開閉
  const bodyStyle = (open: boolean): CSSProperties => ({
    gridTemplateRows: open ? "1fr" : "0fr",
    transition: reduce ? "none" : `grid-template-rows ${params.duration}s ${easing}`,
  });

  const iconStyle = (open: boolean): CSSProperties => ({
    transform: open ? "rotate(45deg)" : "rotate(0deg)",
    transition: reduce ? "none" : `transform ${params.duration}s ${easing}`,
  });

  return (
    <DemoStage hint="PC: 質問をクリック / スマホ: タップ">
      <div className={styles.frame}>
        {ITEMS.map((item, i) => {
          const open = openIndex === i;
          return (
            <div key={item.q} className={styles.item}>
              <button
                className={styles.head}
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? -1 : i)}
              >
                <span>{item.q}</span>
                <span className={styles.icon} style={iconStyle(open)} aria-hidden>
                  +
                </span>
              </button>
              <div className={styles.body} style={bodyStyle(open)}>
                <div className={styles.bodyInner}>
                  <p className={styles.answer}>{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DemoStage>
  );
}
