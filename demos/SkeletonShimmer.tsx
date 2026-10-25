"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./SkeletonShimmer.module.css";

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

export default function SkeletonShimmer({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  // 読み込み完了の見本。既定は骨組みのまま(自動ループ)で、カードを押すと実コンテンツに差し替わる
  const [loaded, setLoaded] = useState(false);

  // 光の帯: background-size 200% の画像内で、ブロック幅の {width}% に
  // 見える幅のグラデーション(画像幅換算では width/2 %、半幅は width/4 %)
  const half = params.width / 4;

  // reduced-motion時はシマーなしの静止スケルトンのみ表示
  const bone: CSSProperties = reduce
    ? {}
    : {
        backgroundImage: `linear-gradient(105deg, transparent ${
          50 - half
        }%, rgba(165, 224, 46, 0.22) 50%, transparent ${50 + half}%)`,
        animationDuration: `${params.speed}s`,
      };
  const boneClass = reduce
    ? styles.bone
    : `${styles.bone} ${styles.shimmer}`;

  return (
    <DemoStage hint="自動ループ再生 / カードをクリック・タップで読み込み完了の表示と切替">
      <div
        className={styles.card}
        role="button"
        tabIndex={0}
        aria-pressed={loaded}
        aria-label="読み込み完了の表示を切り替える"
        onClick={() => setLoaded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setLoaded((v) => !v);
          }
        }}
      >
        {/* 実コンテンツは骨組みと同じクラス(寸法)を使い、差し替えてもレイアウトが1pxも動かない */}
        {loaded ? (
          <>
            <div className={styles.row}>
              <img
                src="/motion-dict/demo/photo-17.jpg"
                alt=""
                className={`${styles.photo} ${styles.avatar}`}
              />
              <span className={styles.lines}>
                <span className={`${styles.text} ${styles.lineWide}`}>Aki Mori</span>
                <span className={`${styles.text} ${styles.textMute} ${styles.lineNarrow}`}>
                  2 min ago
                </span>
              </span>
            </div>
            <img
              src="/motion-dict/demo/photo-18.jpg"
              alt=""
              className={`${styles.photo} ${styles.thumb}`}
            />
            <span className={`${styles.text} ${styles.lineFull}`}>
              Notes, taken by hand.
            </span>
            <span className={`${styles.text} ${styles.textMute} ${styles.lineHalf}`}>
              Proof, p.12
            </span>
          </>
        ) : (
          <>
            <div className={styles.row}>
              <span className={`${boneClass} ${styles.avatar}`} style={bone} />
              <span className={styles.lines}>
                <span className={`${boneClass} ${styles.lineWide}`} style={bone} />
                <span
                  className={`${boneClass} ${styles.lineNarrow}`}
                  style={bone}
                />
              </span>
            </div>
            <span className={`${boneClass} ${styles.thumb}`} style={bone} />
            <span className={`${boneClass} ${styles.lineFull}`} style={bone} />
            <span className={`${boneClass} ${styles.lineHalf}`} style={bone} />
          </>
        )}
      </div>
    </DemoStage>
  );
}
