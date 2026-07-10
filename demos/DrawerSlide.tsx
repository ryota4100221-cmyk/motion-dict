"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./DrawerSlide.module.css";

// content/drawer-slide.ts の direction options と同順
const DIRECTIONS = ["left", "right"] as const;

const ITEMS = ["HOME", "WORKS", "CONTACT"];

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

export default function DrawerSlide({ params }: { params: ParamValues }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  const dir = DIRECTIONS[Math.round(params.direction)] ?? "left";
  const duration = params.duration;

  // オーバーレイはパネルと同じdurationでフェード連動
  const overlayStyle: CSSProperties = {
    opacity: open ? 1 : 0,
    pointerEvents: open ? "auto" : "none",
    transition: reduce ? "opacity 0.15s linear" : `opacity ${duration}s ease`,
  };

  // 隠すときは105%(100%+余白)まで逃がし、影が画面端に残らないようにする
  // reduced-motion時はスライドさせずフェードのみ
  const panelStyle: CSSProperties = {
    ...(dir === "left" ? { left: 0 } : { right: 0 }),
    transform:
      reduce || open
        ? "translateX(0)"
        : `translateX(${dir === "left" ? "-105%" : "105%"})`,
    opacity: reduce && !open ? 0 : 1,
    transition: reduce
      ? "opacity 0.15s linear"
      : `transform ${duration}s ${EASE_OUT}`,
  };

  // 右ドロワーはヘッダーのボタンに被さるため、開いている間は配色を反転する
  const btnInverted = open && dir === "right";

  return (
    <DemoStage hint="MENU: クリック / タップで開閉">
      <div className={styles.frame}>
        <div className={styles.header}>
          <span className={styles.logo}>SITE</span>
          <button
            className={
              btnInverted ? `${styles.menuBtn} ${styles.menuBtnOpen}` : styles.menuBtn
            }
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "CLOSE" : "MENU"}
          </button>
        </div>
        <span className={styles.pageLabel}>PAGE</span>
        <div
          className={styles.overlay}
          style={overlayStyle}
          onClick={() => setOpen(false)}
          aria-hidden={!open}
        />
        <div className={styles.panel} style={panelStyle} aria-hidden={!open}>
          <nav className={styles.nav}>
            {ITEMS.map((item, i) => (
              <span key={item} className={styles.item}>
                <span className={styles.index}>0{i + 1}</span>
                {item}
              </span>
            ))}
          </nav>
        </div>
      </div>
    </DemoStage>
  );
}
