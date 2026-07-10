"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./MenuReveal.module.css";

const ITEMS = ["ABOUT", "WORKS", "JOURNAL", "CONTACT"];

const ITEM_DURATION = 0.5; // 各項目のスライド時間(固定)
const EASE_OVERLAY = "cubic-bezier(0.77, 0, 0.175, 1)";
const EASE_ITEM = "cubic-bezier(0.22, 1, 0.36, 1)";

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

export default function MenuReveal({ params }: { params: ParamValues }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  const duration = params.duration;
  const stagger = params.stagger;

  const overlayStyle: CSSProperties = {
    transform: open ? "translateY(0)" : "translateY(-101%)",
    // reduced-motion: スライドさせず即時開閉
    // 閉じるときは項目が引けてから幕を上げる(0.15s遅延)
    transition: reduce
      ? "none"
      : `transform ${duration}s ${EASE_OVERLAY} ${open ? 0 : 0.15}s`,
  };

  const itemStyle = (i: number): CSSProperties => ({
    transform: open ? "translateY(0)" : "translateY(110%)",
    // 開き: 幕が下り切る少し前(duration×0.55)から上の項目順に滑り込む
    // 閉じ: 逆順で素早く引き、幕より先に消えるようにする
    transition: reduce
      ? "none"
      : `transform ${ITEM_DURATION}s ${EASE_ITEM} ${
          open
            ? duration * 0.55 + i * stagger
            : (ITEMS.length - 1 - i) * stagger * 0.5
        }s`,
  });

  return (
    <DemoStage hint="MENU: クリック / タップで開閉">
      <div className={styles.frame}>
        <div className={styles.header}>
          <span className={styles.logo}>SITE</span>
          <button
            className={
              open ? `${styles.menuBtn} ${styles.menuBtnOpen}` : styles.menuBtn
            }
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "CLOSE" : "MENU"}
          </button>
        </div>
        <span className={styles.pageLabel}>PAGE</span>
        <div className={styles.overlay} style={overlayStyle} aria-hidden={!open}>
          <nav className={styles.nav}>
            {ITEMS.map((item, i) => (
              <div key={item} className={styles.mask}>
                <span className={styles.item} style={itemStyle(i)}>
                  <span className={styles.index}>0{i + 1}</span>
                  {item}
                </span>
              </div>
            ))}
          </nav>
        </div>
      </div>
    </DemoStage>
  );
}
