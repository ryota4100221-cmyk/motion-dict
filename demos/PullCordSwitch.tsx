"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, PointerEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./PullCordSwitch.module.css";

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

// 出典(danyloklochko.com の theme.js)の値。戻りのベジェ・揺れの補間と長さ・クリック時の引き代
const SNAP_EASE = "cubic-bezier(0.3, 1.9, 0.5, 1)";
const SWING_EASE = "cubic-bezier(0.3, 0.6, 0.4, 1)";
const SWING_MS = 1300;
const SWING_RATIOS = [0, 1, -0.7, 0.4, -0.2, 0]; // 出典の 5 / -3.5 / 2 / -1deg を 5deg で割った比
const SWING_OFFSETS = [0, 0.18, 0.4, 0.62, 0.82, 1];
const CLICK_PULL = 18;
const CLICK_HOLD = 130;
const DRAG_SLOP = 4; // これを超えて動いたらドラッグ扱い(後に来る click を無視する)

export default function PullCordSwitch({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [lit, setLit] = useState(false);
  const [used, setUsed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pull, setPull] = useState(0);
  const swingRef = useRef<HTMLSpanElement>(null);
  const startYRef = useRef<number | null>(null);
  const pulledRef = useRef(false);
  const draggedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const { maxPull, threshold, snapBack, swing } = params;
  const fireAt = Math.min(threshold, maxPull);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    []
  );

  const toggle = () => {
    setLit((v) => !v);
    setUsed(true);
    const el = swingRef.current;
    if (!el || reduce || swing <= 0) return;
    // 連続で引いたら最初から。WAAPI の easing オプションは反復全体に掛かるので各フレームに書く
    el.getAnimations().forEach((a) => a.cancel());
    el.animate(
      SWING_OFFSETS.map((offset, k) => ({
        offset,
        transform: `rotate(${(swing * SWING_RATIOS[k]).toFixed(2)}deg)`,
        easing: SWING_EASE,
      })),
      { duration: SWING_MS }
    );
  };

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    startYRef.current = e.clientY;
    pulledRef.current = false;
    draggedRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (startYRef.current === null) return;
    const d = Math.max(0, Math.min(maxPull, e.clientY - startYRef.current));
    if (d > DRAG_SLOP) draggedRef.current = true;
    setPull(d);
    if (d >= fireAt && !pulledRef.current) {
      pulledRef.current = true;
      toggle();
    }
  };

  const release = () => {
    if (startYRef.current === null) return;
    startYRef.current = null;
    setDragging(false);
    setPull(0);
  };

  // ドラッグせずに押した・Enter/Space は「素早く1回引いた」扱い
  const onClick = () => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    setPull(Math.min(CLICK_PULL, maxPull));
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setPull(0), CLICK_HOLD);
    toggle();
  };

  const artStyle: CSSProperties = {
    transform: `translateY(${pull}px)`,
    transition: dragging || reduce ? "none" : `transform ${snapBack}s ${SNAP_EASE}`,
  };

  const cordClass = [styles.cord, used ? styles.used : "", dragging ? styles.drag : "", reduce ? styles.still : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <DemoStage
      hint="PC: 紐をつかんで下へ引く（クリック・Enterでも1回引く） / スマホ: 紐を下へスワイプ"
      className={styles.pullStage}
    >
      {/* 照らされる卓上(photo-10)。写真は舞台いっぱい・色は付けない */}
      <div className={styles.photo} data-md-bleed="" aria-hidden />
      <div className={lit ? `${styles.shade} ${styles.off}` : styles.shade} style={reduce ? { transition: "none" } : undefined} aria-hidden />
      <div className={lit ? `${styles.glow} ${styles.on}` : styles.glow} style={reduce ? { transition: "none" } : undefined} aria-hidden />

      <div className={styles.caption}>
        <p className={styles.folio}>Plate 14 · Reading lamp</p>
        <p className={styles.state}>{lit ? "Lights on" : "Lights off"}</p>
        <p className={styles.sub}>{lit ? "カチッ。もう一度引くと消える" : "紐をぐいっと引くと点く"}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={lit}
        aria-label="Pull the cord"
        className={cordClass}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={release}
        onPointerCancel={release}
        onClick={onClick}
      >
        {/* 揺れ(rotate・根元が軸)と引き下ろし(translateY)は別の要素 */}
        <span ref={swingRef} className={styles.swing}>
          <span className={styles.art} style={artStyle}>
            <i className={styles.string} />
            <i className={styles.bead} />
          </span>
        </span>
        <span className={styles.label} aria-hidden>
          Pull the cord
        </span>
      </button>
    </DemoStage>
  );
}
