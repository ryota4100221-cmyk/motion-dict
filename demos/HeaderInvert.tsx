"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./HeaderInvert.module.css";

// dark:true のセクションだけがDOM側に目印を持つ(色はCSSに置く)
const SECTIONS = [
  { label: "01 / Intro", dark: false },
  { label: "02 / Manifesto", dark: true },
  { label: "03 / Works", dark: false },
  { label: "04 / Contact", dark: true },
];

const HEADER_HEIGHT = 56;

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

export default function HeaderInvert({ params }: { params: ParamValues }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [onDark, setOnDark] = useState(false);
  const reduce = useReducedMotion();
  const probe = params.probe;
  // blend-difference は合成モード任せなので、判定結果を色に使わない
  const blend = params.mode === 1;

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let raf = 0;
    const measure = () => {
      raf = 0;
      // ステージ上端から probe px 下を走る判定ライン。
      // 暗いセクションの矩形がこの線を跨いでいるかだけを見る
      const probeY = scroller.getBoundingClientRect().top + probe;
      const hit = Array.from(
        scroller.querySelectorAll<HTMLElement>("[data-dark]")
      ).some((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= probeY && r.bottom >= probeY;
      });
      setOnDark(hit);
    };
    // スクロールは1フレーム1回に間引き、初回とリサイズは即座に測る
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, [probe]);

  // reduced-motion時は補間なしの即時切替(反転そのものは可読性のため残す)
  const headerStyle: CSSProperties = {
    height: HEADER_HEIGHT,
    // 高さぶんの負のマージンで流れから抜き、実際のfixedヘッダーと同じく
    // セクションの「上に重なる」状態にする(重ならないと反転する意味がない)
    marginBottom: -HEADER_HEIGHT,
    transitionDuration: reduce ? "0s" : `${params.duration}s`,
  };

  const headerClass = [
    styles.header,
    blend ? styles.blend : onDark ? styles.invert : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <DemoStage
      hint="ステージ内をスクロール(スマホは指で上下)/ ライムの線が判定ライン"
      className={styles.scrollStage}
    >
      <div className={styles.scroller} ref={scrollerRef}>
        <header className={headerClass} style={headerStyle}>
          <span className={styles.logo}>Monaka</span>
          <nav className={styles.nav}>
            <span>Work</span>
            <span>About</span>
            <span>Contact</span>
          </nav>
        </header>
        <div className={styles.content}>
          {SECTIONS.map((s) => (
            <section
              className={s.dark ? `${styles.section} ${styles.dark}` : styles.section}
              data-dark={s.dark ? true : undefined}
              key={s.label}
            >
              <span className={styles.sectionLabel}>{s.label}</span>
              <span className={styles.sectionLine} />
            </section>
          ))}
        </div>
      </div>
      {/* 明暗を判定している位置。スクロールしても動かない */}
      <div className={styles.probe} style={{ top: probe }} aria-hidden />
    </DemoStage>
  );
}
