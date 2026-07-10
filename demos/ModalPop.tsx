"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ModalPop.module.css";

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

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

export default function ModalPop({ params }: { params: ParamValues }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  // 閉じは開きの6〜7割に短縮する
  const duration = open ? params.duration : params.duration * 0.65;

  const overlayStyle: CSSProperties = {
    opacity: open ? 1 : 0,
    pointerEvents: open ? "auto" : "none",
    transition: reduce ? "opacity 0.15s linear" : `opacity ${duration}s ease`,
  };

  // reduced-motion時はscaleをやめフェードのみ
  const panelStyle: CSSProperties = {
    opacity: open ? 1 : 0,
    transform: reduce || open ? "scale(1)" : `scale(${params.scaleFrom})`,
    transition: reduce
      ? "opacity 0.15s linear"
      : `transform ${duration}s ${EASE_OUT}, opacity ${duration}s ease`,
  };

  return (
    <DemoStage hint="Open modal: クリック / タップで開閉">
      <div className={styles.frame}>
        <span className={styles.pageLabel}>Page</span>
        <button className={styles.openBtn} onClick={() => setOpen(true)}>
          Open modal
        </button>
        <div
          className={styles.overlay}
          style={overlayStyle}
          onClick={() => setOpen(false)}
          aria-hidden={!open}
        >
          <div
            className={styles.panel}
            style={panelStyle}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <p className={styles.title}>Dialog</p>
            <p className={styles.text}>
              scale({params.scaleFrom.toFixed(2)} → 1) + fade
            </p>
            <button className={styles.closeBtn} onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      </div>
    </DemoStage>
  );
}
