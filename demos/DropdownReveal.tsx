"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./DropdownReveal.module.css";

const ITEMS = ["Overview", "Pricing", "Changelog"];
const EASE_OPEN = "cubic-bezier(0.22, 1, 0.36, 1)"; // 開き: 減速で素早く

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

export default function DropdownReveal({ params }: { params: ParamValues }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const lastTouch = useRef(0); // タップ直後のエミュレートされたmouseenter/leaveを無視する
  const reduce = useReducedMotion();

  // アンマウント時に猶予タイマーを破棄
  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const isTouching = () => Date.now() - lastTouch.current < 700;

  // ホバー離脱: closeDelayの猶予を置いてから閉じる(戻ってきたらキャンセル)
  const scheduleClose = () => {
    if (isTouching()) return;
    cancelClose();
    closeTimer.current = window.setTimeout(
      () => setOpen(false),
      params.closeDelay * 1000
    );
  };

  const enter = () => {
    if (isTouching()) return;
    cancelClose();
    setOpen(true);
  };

  // 閉状態: 浮かせて縮めて透明に。開きはease-out、閉じは瞬時(非対称)
  const menuStyle: CSSProperties = {
    opacity: open ? 1 : 0,
    transform:
      reduce || open
        ? "translateY(0) scale(1)"
        : `translateY(${-params.offset}px) scale(0.98)`,
    visibility: open ? "visible" : "hidden",
    // reduced-motion: transformは動かさず短いフェードのみ
    transition: reduce
      ? "opacity 0.1s linear, visibility 0s"
      : open
        ? `opacity ${params.duration}s ${EASE_OPEN}, transform ${params.duration}s ${EASE_OPEN}, visibility 0s`
        : "none",
  };

  return (
    <DemoStage hint="PC: Productsにホバー / スマホ: タップで開閉">
      <div className={styles.nav}>
        <span className={styles.brand}>Site</span>
        <div
          className={styles.wrap}
          onMouseEnter={enter}
          onMouseLeave={scheduleClose}
        >
          <button
            className={open ? `${styles.trigger} ${styles.triggerOpen}` : styles.trigger}
            onTouchStart={() => {
              lastTouch.current = Date.now();
              cancelClose();
              setOpen((o) => !o);
            }}
          >
            Products
            <span className={styles.chev} aria-hidden>
              ▾
            </span>
          </button>
          <div className={styles.menu} style={menuStyle} aria-hidden={!open}>
            {ITEMS.map((item) => (
              <span key={item} className={styles.item}>
                {item}
              </span>
            ))}
          </div>
        </div>
        <span className={styles.navItem}>About</span>
      </div>
    </DemoStage>
  );
}
