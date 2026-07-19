"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, PointerEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./RubberBand.module.css";

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

// はみ出しの生値rawを、初速pull・上限maxに漸近するカーブへ潰す(Appleのラバーバンド式)
function damp(raw: number, pull: number, max: number): number {
  return (1 - 1 / ((raw * pull) / max + 1)) * max;
}

export default function RubberBand({ params }: { params: ParamValues }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0); // pointerdown時のclientX
  const baseRef = useRef(0); // pointerdown時のx
  const minRef = useRef(0); // 可動域の左端(負値)
  const reduce = useReducedMotion();

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    const frame = frameRef.current;
    const track = trackRef.current;
    if (!frame || !track) return;
    // 可動域はドラッグ開始時に測る(レスポンシブで幅が変わっても追従する)
    minRef.current = Math.min(0, frame.clientWidth - track.scrollWidth);
    startXRef.current = e.clientX;
    baseRef.current = x;
    setDragging(true);
    // 枠外へ出てもドラッグを継続する
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const raw = baseRef.current + (e.clientX - startXRef.current);
    const min = minRef.current;

    // reduced-motion時ははみ出しを作らず、端でそのまま止める
    if (reduce) {
      setX(Math.min(0, Math.max(min, raw)));
      return;
    }
    if (raw > 0) setX(damp(raw, params.pull, params.maxOverscroll));
    else if (raw < min) setX(min - damp(min - raw, params.pull, params.maxOverscroll));
    else setX(raw);
  };

  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    // 離した瞬間に可動域へクランプ。transitionが復活するのでここが戻りの動きになる
    setX((v) => Math.min(0, Math.max(minRef.current, v)));
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const trackStyle: CSSProperties = {
    transform: `translate3d(${x}px, 0, 0)`,
    // ドラッグ中に効かせると追従が一拍遅れ、ゴムではなく鈍い動きになる
    transition:
      dragging || reduce
        ? "none"
        : `transform ${params.snapBack}s cubic-bezier(0.22, 1, 0.36, 1)`,
  };

  return (
    <DemoStage hint="ドラッグ / スワイプ: 端を越えて引っ張ると戻る">
      <div
        className={styles.frame}
        ref={frameRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className={styles.track} ref={trackRef} style={trackStyle}>
          {CARDS.map((n) => (
            <div className={styles.card} key={n}>
              {n}
            </div>
          ))}
        </div>
        <span className={styles.edge} aria-hidden />
      </div>
    </DemoStage>
  );
}
