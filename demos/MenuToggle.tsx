"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./MenuToggle.module.css";

const EASE = "cubic-bezier(0.65, 0, 0.35, 1)"; // 変形のease-in-out
const GAP = 7; // 上下線の中央からの離れ(px)

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

export default function MenuToggle({ params }: { params: ParamValues }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  const duration = params.duration;
  const thickness = params.thickness;
  const spin = params.spin;

  // reduced-motion時はtransitionなしで即時切替
  const transition = reduce
    ? "none"
    : `transform ${duration}s ${EASE}, opacity ${duration}s ${EASE}`;

  // ラッパー全体をspin度回して「ひねって閉じる」手応えを出す
  const wrapStyle: CSSProperties = {
    transform: open ? `rotate(${spin}deg)` : "rotate(0deg)",
    transition: reduce ? "none" : `transform ${duration}s ${EASE}`,
  };

  const barBase: CSSProperties = { height: thickness, transition };

  // translateY(-50%)で線自身を50%基準線の中央に載せ、太さに依らず中央を保つ。
  // 上下線: 閉=そこから±GAPに離す / 開=中央へ寄せて±45度で交差
  const topStyle: CSSProperties = {
    ...barBase,
    transform: open
      ? "translateY(-50%) rotate(45deg)"
      : `translateY(calc(-50% - ${GAP}px)) rotate(0deg)`,
  };
  const midStyle: CSSProperties = {
    ...barBase,
    transform: open ? "translateY(-50%) scaleX(0)" : "translateY(-50%) scaleX(1)",
    opacity: open ? 0 : 1,
  };
  const bottomStyle: CSSProperties = {
    ...barBase,
    transform: open
      ? "translateY(-50%) rotate(-45deg)"
      : `translateY(calc(-50% + ${GAP}px)) rotate(0deg)`,
  };

  return (
    <DemoStage hint="PC: クリックで開閉 / スマホ: タップ">
      <button
        className={styles.button}
        aria-label="メニュー"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.icon} style={wrapStyle}>
          <span className={styles.bar} style={topStyle} />
          <span className={styles.bar} style={midStyle} />
          <span className={styles.bar} style={bottomStyle} />
        </span>
        <span className={styles.label}>{open ? "Close" : "Menu"}</span>
      </button>
    </DemoStage>
  );
}
