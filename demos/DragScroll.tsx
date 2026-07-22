"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./DragScroll.module.css";

// 掴んで放り投げるための、幅が表示領域を超える横並びパネル
const PANELS = Array.from({ length: 8 }, (_, i) => i + 1);

export default function DragScroll({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [grabbing, setGrabbing] = useState(false);

  // rAFで直接DOMへ書き込むため、位置と速度はrefで持つ(毎フレームの再レンダーを避ける)
  const posRef = useRef(0); // 現在のtranslateX(<= 0)
  const velRef = useRef(0); // px/frame
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const stopTickRef = useRef<(() => void) | null>(null);

  // トラックが動ける下限(トラック幅 - ステージ幅 のぶんだけ左へ)
  function minPos(): number {
    const track = trackRef.current;
    const stage = track?.parentElement;
    if (!track || !stage) return 0;
    return Math.min(0, stage.clientWidth - track.scrollWidth);
  }

  function apply() {
    const track = trackRef.current;
    if (track) track.style.transform = `translateX(${posRef.current}px)`;
  }

  function clamp() {
    const min = minPos();
    if (posRef.current > 0) posRef.current = 0;
    else if (posRef.current < min) posRef.current = min;
  }

  function stopMomentum() {
    stopTickRef.current?.();
    stopTickRef.current = null;
    velRef.current = 0;
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    stopMomentum(); // 滑走中に掴んだら即その場で掴み直す
    draggingRef.current = true;
    setGrabbing(true);
    lastXRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    posRef.current += dx; // 指に1:1で追従
    clamp();
    velRef.current = dx; // 直近フレームの移動量＝瞬間速度
    apply();
  }

  function onPointerUp() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setGrabbing(false);

    // reduced-motion時は慣性を殺し、離した位置で即停止
    if (reduce) {
      velRef.current = 0;
      return;
    }

    // 放す瞬間のparamsで初速と減衰率を確定させる(滑走中は据え置き)
    const friction = params.friction;
    velRef.current *= params.throw; // 離した瞬間の速度を増幅して放り出す
    if (Math.abs(velRef.current) < 0.1) return;

    stopTickRef.current = addTick(() => {
      posRef.current += velRef.current;
      const min = minPos();
      // 端に達したら弾ませず速度を殺して止める(弾ませたい場合はrubber-bandを重ねる)
      if (posRef.current > 0 || posRef.current < min) {
        clamp();
        apply();
        stopMomentum();
        return;
      }
      apply();
      velRef.current *= friction; // 毎フレーム減衰
      if (Math.abs(velRef.current) < 0.1) stopMomentum();
    });
  }

  // アンマウント時に滑走ループを確実に畳む
  useEffect(() => stopMomentum, []);

  return (
    <DemoStage
      hint="PC: ドラッグして放すと慣性で滑る / スマホ: スワイプ"
      className={styles.stage}
    >
      <div
        ref={trackRef}
        className={grabbing ? `${styles.track} ${styles.grabbing}` : styles.track}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {PANELS.map((n) => (
          <div
            key={n}
            className={n === 3 ? `${styles.panel} ${styles.accent}` : styles.panel}
          >
            <span className={styles.num}>{String(n).padStart(2, "0")}</span>
          </div>
        ))}
      </div>
    </DemoStage>
  );
}

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
