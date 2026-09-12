"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./GestureHint.module.css";

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

const CARDS = ["01", "02", "03", "04", "05", "06", "07", "08"];

// 触ってからヒントを復帰させるまで。
// 実運用では既読を保存して二度と出さないが、デモとして見返せるようにしている
const RESUME_DELAY = 2500;

// 手の形は3枚を重ね、opacityの差し替えだけで切り替える(補間しない)
function OpenHand() {
  return (
    <svg viewBox="0 0 24 24" className={`${styles.pose} ${styles.open}`}>
      <rect x="6" y="3.5" width="3" height="10" rx="1.5" />
      <rect x="9.3" y="2" width="3" height="11" rx="1.5" />
      <rect x="12.6" y="2.6" width="3" height="10.5" rx="1.5" />
      <rect x="15.9" y="4.4" width="3" height="9" rx="1.5" />
      <rect x="2.4" y="10" width="3" height="7.5" rx="1.5" transform="rotate(-35 3.9 13.75)" />
      <rect x="6" y="9.5" width="12.9" height="12" rx="4.5" />
    </svg>
  );
}

function ClosedHand() {
  return (
    <svg viewBox="0 0 24 24" className={`${styles.pose} ${styles.closed}`}>
      <rect x="6" y="7.5" width="3" height="5" rx="1.5" />
      <rect x="9.3" y="6.8" width="3" height="5.5" rx="1.5" />
      <rect x="12.6" y="7" width="3" height="5.5" rx="1.5" />
      <rect x="15.9" y="7.8" width="3" height="5" rx="1.5" />
      <rect x="4" y="11.5" width="3" height="6" rx="1.5" transform="rotate(-20 5.5 14.5)" />
      <rect x="6" y="10" width="12.9" height="11" rx="4.5" />
    </svg>
  );
}

function PointHand() {
  return (
    <svg viewBox="0 0 24 24" className={`${styles.pose} ${styles.point}`}>
      <rect x="9.3" y="1" width="3" height="12" rx="1.5" />
      <rect x="12.6" y="8" width="3" height="5" rx="1.5" />
      <rect x="15.9" y="8.8" width="3" height="4.5" rx="1.5" />
      <rect x="4" y="11.5" width="3" height="6" rx="1.5" transform="rotate(-20 5.5 14.5)" />
      <rect x="6.5" y="10" width="12.4" height="11" rx="4.5" />
    </svg>
  );
}

export default function GestureHint({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [engaged, setEngaged] = useState(false);
  const idleRef = useRef<number | null>(null);
  const tap = Math.round(params.gesture) === 1;

  useEffect(
    () => () => {
      if (idleRef.current !== null) window.clearTimeout(idleRef.current);
    },
    []
  );

  // 実際にギャラリーを触った時点でヒントの役目は終わり。放置でまた出す(デモのため)
  const onEngage = () => {
    setEngaged(true);
    if (idleRef.current !== null) window.clearTimeout(idleRef.current);
    idleRef.current = window.setTimeout(() => setEngaged(false), RESUME_DELAY);
  };

  // 移動・握り込み・形の差し替え・波紋は別レイヤーの別keyframes。
  // 全部に同じdurationを渡し、keyで一斉に作り直して位相を揃える
  const layerStyle = {
    "--gh-distance": `${params.distance}px`,
    "--gh-press": params.press,
    "--gh-duration": `${params.duration}s`,
  } as CSSProperties;

  const handClass = [styles.hand, tap ? styles.tap : styles.drag, reduce ? styles.still : ""].join(
    " "
  );

  return (
    <DemoStage
      hint="自動で実演ループ / ギャラリーを横スクロール・スワイプすると手は引っ込む"
      className={styles.gestureStage}
    >
      <div className={styles.scroller} onScroll={onEngage} onPointerDown={onEngage}>
        {CARDS.map((n) => (
          <div className={styles.card} key={n}>
            {n}
          </div>
        ))}
      </div>

      {/* tapの押し先。ボタン要素にすると押せる物に見えるので飾りのspanにする */}
      {tap && <span className={styles.target} aria-hidden />}

      {/* 引っ込めるフェードは外側で持つ。内側はkeyframesがopacityを握っているので上書きできない */}
      <div className={engaged ? `${styles.layer} ${styles.away}` : styles.layer} aria-hidden>
        <div
          key={`${tap}-${params.duration}-${params.distance}-${params.press}`}
          className={handClass}
          style={layerStyle}
        >
          <span className={styles.body}>
            {tap ? (
              <PointHand />
            ) : (
              <>
                <OpenHand />
                <ClosedHand />
              </>
            )}
          </span>
          {tap && <i className={styles.pulse} />}
        </div>
      </div>

      {/* reduced-motion時は動きの代わりに操作名を言葉で添える */}
      {reduce && <span className={styles.caption}>{tap ? "tap" : "drag ←"}</span>}
    </DemoStage>
  );
}
