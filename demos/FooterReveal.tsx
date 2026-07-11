"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./FooterReveal.module.css";

const SECTIONS = ["Section 01", "Section 02", "Section 03", "Section 04"];

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

export default function FooterReveal({ params }: { params: ParamValues }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  // スクロール残量(px)。露出率は残量 ÷ フッター高さから毎レンダーで計算する
  const [remain, setRemain] = useState(9999);
  const reduce = useReducedMotion();

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onScroll = () => {
      setRemain(scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop);
    };
    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });

    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  // 露出率 0(隠れている)〜1(全部見えている)。
  // reduced-motion時はせり上がり・暗幕なしの固定表示(=露出率1相当)にする
  const progress = reduce
    ? 1
    : Math.min(1, Math.max(0, 1 - remain / params.height));

  const footerStyle: CSSProperties = {
    height: params.height,
    transform: `translateY(${((1 - progress) * params.lift).toFixed(2)}px)`,
  };
  const scrimStyle: CSSProperties = {
    opacity: (1 - progress) * params.dim,
  };

  return (
    <DemoStage hint="ステージ内を最後までスクロール" className={styles.scrollStage}>
      {/* 本文(z-index: 1)の下に固定。本文が捲れると現れる */}
      <div className={styles.footer} style={footerStyle}>
        <span className={styles.footerTitle}>Footer</span>
        <span className={styles.footerNote}>Fixed behind the body</span>
        <div className={styles.scrim} style={scrimStyle} aria-hidden />
      </div>
      <div className={styles.scroller} ref={scrollerRef}>
        <div className={styles.body}>
          {SECTIONS.map((label) => (
            <div className={styles.card} key={label}>
              <span className={styles.cardLabel}>{label}</span>
              <span className={styles.cardLine} />
            </div>
          ))}
        </div>
        {/* 本文下の余白 = フッター高さ。ここが「捲れ」区間になる */}
        <div style={{ height: params.height }} aria-hidden />
      </div>
    </DemoStage>
  );
}
