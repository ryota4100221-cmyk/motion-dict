"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { addTick } from "@/lib/raf";
import styles from "./Hero.module.css";

const TITLE = "動きの伝え方辞典";
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

// このヒーロー自体が辞典の項目3つ(split-text-reveal / counter / marquee)でできている。
// 辞典が自分自身を実演する、が本サイトのFVの設計意図。
export default function Hero({
  total,
  categories,
  names,
}: {
  total: number;
  categories: number;
  names: string[];
}) {
  const reduce = useReducedMotion();
  const [count, setCount] = useState(0);

  // counter: 0 → total(easeOutExpo)。項目「カウントアップ」の自己実演
  useEffect(() => {
    if (reduce) return;
    let start: number | null = null;
    const DELAY = 600;
    const DURATION = 1400;
    const stop = addTick((time) => {
      if (start === null) start = time;
      const t = Math.min(1, Math.max(0, (time - start - DELAY) / DURATION));
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setCount(Math.round(eased * total));
      if (t >= 1) stop();
    });
    return stop;
  }, [reduce, total]);

  const shownCount = reduce ? total : count;

  const marqueeText = names.join("　·　");

  return (
    <header className={styles.hero}>
      <p className={styles.crumb}>
        MOTION<span className={styles.crumbDash}>→</span>WORDS
        <span className={styles.crumbDash}>→</span>PROMPT
      </p>

      {/* 項目「分割テキストリビール」の自己実演(CSSアニメーションのみで駆動) */}
      <h1 className={`${styles.title} palt`} aria-label={TITLE}>
        {[...TITLE].map((ch, i) => (
          <span className={styles.charMask} key={i} aria-hidden>
            <span
              className={styles.char}
              style={{ animationDelay: `${0.08 + i * 0.055}s` }}
            >
              {ch}
            </span>
          </span>
        ))}
      </h1>

      <div className={styles.below}>
        <p className={styles.lede}>
          「あの動き」に名前と数値を。デモを触ってパラメータを決めれば、
          そのままAIに渡せるプロンプトが手に入る、デザイナーのための対訳辞典。
        </p>
        <div className={styles.stats}>
          <span className={styles.statNum}>
            {String(shownCount).padStart(2, "0")}
          </span>
          <span className={styles.statLabel}>
            MOTIONS
            <br />
            {categories} CATEGORIES
          </span>
        </div>
      </div>

      <p className={styles.selfDemo}>
        ↳ この画面も辞典の項目でできている:{" "}
        <Link href="/motion/split-text-reveal">分割テキストリビール</Link> /{" "}
        <Link href="/motion/counter">カウントアップ</Link> /{" "}
        <Link href="/motion/marquee">無限マーキー</Link>
      </p>

      {/* 項目「無限マーキー」の自己実演 */}
      <div className={styles.marquee} aria-hidden>
        <div className={reduce ? styles.marqueeStill : styles.marqueeTrack}>
          <span className={styles.marqueeText}>{marqueeText}　·　</span>
          <span className={styles.marqueeText}>{marqueeText}　·　</span>
        </div>
      </div>
    </header>
  );
}
