"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, PointerEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./BeforeAfter.module.css";

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

export default function BeforeAfter({ params }: { params: ParamValues }) {
  const [pos, setPos] = useState(params.initial);
  const draggingRef = useRef(false);
  const reduce = useReducedMotion();

  // スライダーで初期位置を変えたら即反映(レンダー中のprop同期パターン)
  const [prevInitial, setPrevInitial] = useState(params.initial);
  if (prevInitial !== params.initial) {
    setPrevInitial(params.initial);
    setPos(params.initial);
  }

  // reduced-motion時は追従transitionを切って即時反映
  const follow = reduce ? 0 : params.follow;

  const posFrom = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(97, Math.max(3, x)));
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    // 枠外へ出てもドラッグを継続する
    e.currentTarget.setPointerCapture(e.pointerId);
    posFrom(e);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) posFrom(e);
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // before(上)は「見える窓」だけをclip-pathで動かす。画像は変形しない
  const beforeStyle: CSSProperties = {
    clipPath: `inset(0 ${100 - pos}% 0 0)`,
    transition: `clip-path ${follow}s ease-out`,
  };
  // ハンドルは全幅ラッパーをtranslateXで動かす(pos=50で±0%)
  const handleStyle: CSSProperties = {
    transform: `translateX(${pos - 50}%)`,
    transition: `transform ${follow}s ease-out`,
  };

  return (
    <DemoStage hint="ドラッグ / スワイプ: 境界を動かして比較">
      <div
        className={styles.frame}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className={`${styles.img} ${styles.after}`}>
          <span className={styles.tagAfter}>AFTER</span>
        </div>
        <div className={`${styles.img} ${styles.before}`} style={beforeStyle}>
          <span className={styles.tagBefore}>BEFORE</span>
        </div>
        <div className={styles.handle} style={handleStyle} aria-hidden>
          <span className={styles.handleLine} />
          <span className={styles.knob} />
        </div>
      </div>
    </DemoStage>
  );
}
