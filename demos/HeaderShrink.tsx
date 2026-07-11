"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./HeaderShrink.module.css";

const SECTIONS = [
  "Section 01",
  "Section 02",
  "Section 03",
  "Section 04",
  "Section 05",
];

// 縮小前のヘッダー高さ(px)。縮小後は BASE_HEIGHT × ratio
const BASE_HEIGHT = 72;

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

export default function HeaderShrink({ params }: { params: ParamValues }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);
  const [shrunk, setShrunk] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onScroll = () => {
      const t = paramsRef.current.threshold;
      const top = scroller.scrollTop;
      // 発火(threshold)と解除(threshold - 24)をずらすヒステリシスでチラつきを防ぐ
      setShrunk((s) => (s ? top > Math.max(0, t - 24) : top > t));
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });

    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  // reduced-motion時は遷移なしで状態だけ即座に切り替える
  const headerStyle: CSSProperties = {
    height: shrunk ? BASE_HEIGHT * params.ratio : BASE_HEIGHT,
    transitionDuration: reduce ? "0s" : `${params.duration}s`,
  };
  const logoStyle: CSSProperties = {
    transform: shrunk ? `scale(${params.ratio})` : "scale(1)",
    transitionDuration: reduce ? "0s" : `${params.duration}s`,
  };

  return (
    <DemoStage hint="ステージ内をスクロール" className={styles.scrollStage}>
      <div className={styles.scroller} ref={scrollerRef}>
        <header className={styles.header} style={headerStyle}>
          <span className={styles.logo} style={logoStyle}>
            Monaka
          </span>
          <nav className={styles.nav}>
            <span>Work</span>
            <span>About</span>
            <span>Contact</span>
          </nav>
        </header>
        <div className={styles.content}>
          {SECTIONS.map((label) => (
            <div className={styles.card} key={label}>
              <span className={styles.cardLabel}>{label}</span>
              <span className={styles.cardLine} />
            </div>
          ))}
        </div>
        {/* この線がヘッダー下端に達すると縮む(= scrollTopがthresholdを超える位置) */}
        <div
          className={styles.marker}
          style={{ top: BASE_HEIGHT + params.threshold }}
          aria-hidden
        >
          <span className={styles.markerLabel}>Threshold</span>
        </div>
      </div>
    </DemoStage>
  );
}
