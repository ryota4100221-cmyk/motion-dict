"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./HeaderHideOnScroll.module.css";

const SECTIONS = [
  "Section 01",
  "Section 02",
  "Section 03",
  "Section 04",
  "Section 05",
  "Section 06",
];

// ヘッダー高さ(px)。格納時はこの分だけ上へ逃がす
const HEADER_HEIGHT = 64;

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

export default function HeaderHideOnScroll({ params }: { params: ParamValues }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);
  const lastYRef = useRef(0);
  // 方向が変わった位置。ここからの移動量がtoleranceを超えたときだけ切り替える
  const anchorYRef = useRef(0);
  const dirRef = useRef(0);
  const [hidden, setHidden] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onScroll = () => {
      const { offset, tolerance } = paramsRef.current;
      const y = scroller.scrollTop;
      // 差が0のフレームは前回の向きを引き継ぐ(0を新しい向きにすると判定が暴れる)
      const dir = y > lastYRef.current ? 1 : y < lastYRef.current ? -1 : dirRef.current;
      lastYRef.current = y;

      if (dir !== dirRef.current) {
        dirRef.current = dir;
        anchorYRef.current = y;
      }

      // 最上部の安全地帯では必ず表示する
      if (y <= offset) {
        setHidden(false);
        return;
      }
      if (Math.abs(y - anchorYRef.current) < tolerance) return;
      setHidden(dir === 1);
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });

    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  // reduced-motion時は遷移なしで状態だけ即座に切り替える
  const headerStyle: CSSProperties = {
    height: HEADER_HEIGHT,
    transform: hidden ? `translateY(${-HEADER_HEIGHT}px)` : "translateY(0)",
    transitionDuration: reduce ? "0s" : `${params.duration}s`,
  };

  return (
    <DemoStage hint="ステージ内を下へ、そして上へスクロール" className={styles.scrollStage}>
      <div className={styles.scroller} ref={scrollerRef}>
        <header className={styles.header} style={headerStyle}>
          <span className={styles.logo}>Monaka</span>
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
        {/* この線がヘッダー下端を通り過ぎるまでは格納しない(= scrollTop <= offset) */}
        <div
          className={styles.marker}
          style={{ top: HEADER_HEIGHT + params.offset }}
          aria-hidden
        >
          <span className={styles.markerLabel}>offset</span>
        </div>
      </div>
      {/* ヘッダーが画面外へ出ると状態が見えなくなるので手前に出す */}
      <span className={styles.status} data-hidden={hidden || undefined} aria-hidden>
        {hidden ? "HIDDEN" : "VISIBLE"}
      </span>
    </DemoStage>
  );
}
