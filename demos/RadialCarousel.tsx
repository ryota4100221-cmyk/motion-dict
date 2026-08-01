"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./RadialCarousel.module.css";

// リング上の見出し。countの最大値ぶん用意しておき、先頭からcount個だけ使う
const WORDS = [
  "INTRO",
  "WORKS",
  "STUDIO",
  "PROCESS",
  "TEAM",
  "NEWS",
  "CAREER",
  "CONTACT",
  "JOURNAL",
  "AWARDS",
  "LAB",
  "PRESS",
  "STORE",
  "LEGAL",
];

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
// 真上からこの角度まで離れたら消える。視界の外の項目もDOMには残す
const FADE_ANGLE = 100;
// これ以下の移動はドラッグではなくタップとみなす
const TAP_PX = 5;

// 角度を -180〜180 に畳む(真上からのズレを測るため)
function norm(deg: number): number {
  const d = ((deg % 360) + 360) % 360;
  return d > 180 ? d - 360 : d;
}

export default function RadialCarousel({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [rot, setRot] = useState(0); // リング全体の回転角(deg)
  const [dragging, setDragging] = useState(false);

  const radius = params.radius;
  const count = Math.round(params.count);
  const duration = params.duration;
  const upright = params.upright === 0;

  const stepAngle = 360 / count; // 円がちょうど閉じるので回転量に上限が要らない

  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const movedRef = useRef(0);
  const capturedRef = useRef(false);

  // ドラッグ中は指に1:1で追従させたいのでトランジションを外す
  const still = reduce || dragging;
  const spin = still ? "none" : `transform ${duration}s ${EASE}`;
  const fade = still ? "none" : `opacity ${duration}s ${EASE}`;

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    setDragging(true);
    lastXRef.current = e.clientX;
    movedRef.current = 0;
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    movedRef.current += Math.abs(dx);
    // 掴むのはタップの許容量を超えてから。押した瞬間に捕捉すると
    // clickイベントがこの要素へ吸われ、項目の選択が効かなくなる
    if (movedRef.current > TAP_PX && !capturedRef.current) {
      capturedRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    // 横の移動量を弧長とみなして角度へ。半径が大きいほど同じ距離でも回らない
    setRot((r) => r + (dx / radius) * (180 / Math.PI));
  }

  function onPointerUp() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    capturedRef.current = false;
    setDragging(false);
    // 最寄りの項目の角度へ丸める。ここでトランジションが戻るのでスナップが効く
    setRot((r) => Math.round(r / stepAngle) * stepAngle);
  }

  // クリックされた項目を真上へ。今の回転からの最短経路で寄せる
  function focus(i: number) {
    if (movedRef.current > TAP_PX) return; // ドラッグの流れなら選択しない
    const target = -i * stepAngle;
    setRot((r) => target + Math.round((r - target) / 360) * 360);
  }

  const fieldStyle = {
    "--ring-r": `${radius}px`,
    // 半径を変えても真上の項目の高さが動かないよう、沈める量を半径に連動させる
    "--ring-sink": `${radius - 210}px`,
  } as CSSProperties;

  return (
    <DemoStage hint="PC: 左右にドラッグ / 項目クリックで真上へ ・ スマホ: スワイプ">
      <div
        className={dragging ? `${styles.field} ${styles.grabbing}` : styles.field}
        style={fieldStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className={styles.ring} aria-hidden />
        <div className={styles.marker} aria-hidden />
        <div
          className={styles.wheel}
          style={{ transform: `rotate(${rot}deg)`, transition: spin }}
        >
          {WORDS.slice(0, count).map((word, i) => {
            const angle = i * stepAngle;
            const off = norm(angle + rot); // 真上からのズレ
            const opacity = Math.max(0, 1 - Math.abs(off) / FADE_ANGLE);
            const active = Math.abs(off) < stepAngle / 2;
            return (
              <div
                key={word}
                className={styles.slot}
                style={{
                  transform: `rotate(${angle}deg) translateY(calc(var(--ring-r) * -1))`,
                  opacity,
                  transition: fade,
                  pointerEvents: opacity < 0.2 ? "none" : "auto",
                }}
              >
                <button
                  type="button"
                  className={active ? `${styles.pill} ${styles.active}` : styles.pill}
                  style={{
                    // 輪の回転と自分の配置角を打ち消して文字を正立させる
                    transform: upright ? `rotate(${-(angle + rot)}deg)` : undefined,
                    transition: spin,
                  }}
                  onClick={() => focus(i)}
                >
                  <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                  {word}
                </button>
              </div>
            );
          })}
        </div>
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
