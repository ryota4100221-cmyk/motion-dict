"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./RotateDevicePrompt.module.css";

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

// 出典(longhoang-lyo.com の .rotate-device-phone)の補間。区間ごとに掛ける
const TURN_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
// 出典(iamsunnywang.com の .mobile-orientation-arrow)の補間
const ARROW_EASE = "ease-in-out";
// 回す前の縮み。出典の 0.94 のまま固定(膨らみ側だけをパラメータにする)
const REST_SCALE = 0.94;
// 「回した」後に覆いを戻すまで。実運用では向きが直れば二度と出ないが、デモとして見返せるようにしている
const RESUME_DELAY = 2500;

// hold% 以外を 待ち16% / 回す40% / 戻す28% / 待ち16% に配る。hold=26 で出典の 12/42/68/88 になる
function offsets(hold: number) {
  const r = (100 - hold) / 100;
  const a = r * 0.16;
  const b = a + r * 0.4;
  const c = b + hold / 100;
  const d = c + r * 0.28;
  return [0, a, b, c, d, 1];
}

export default function RotateDevicePrompt({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [turned, setTurned] = useState(false);
  const phoneRef = useRef<HTMLSpanElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const idleRef = useRef<number | null>(null);

  const toLandscape = Math.round(params.direction) === 1;
  const { duration, hold, pop } = params;

  useEffect(
    () => () => {
      if (idleRef.current !== null) window.clearTimeout(idleRef.current);
    },
    []
  );

  // 待つ→回す→止まる→戻す→待つ。offset が hold で変わるので CSS keyframes ではなく WAAPI で組む
  useEffect(() => {
    const phone = phoneRef.current;
    const arrow = arrowRef.current;
    if (!phone || !arrow || reduce || turned) return;

    const from = toLandscape ? 0 : -90;
    const to = toLandscape ? -90 : 0;
    const rest = `rotate(${from}deg) scale(${REST_SCALE})`;
    const goal = `rotate(${to}deg) scale(${pop})`;
    const poses = [rest, rest, goal, goal, rest, rest];

    const arrowRest = { opacity: 0.25, transform: "rotate(20deg) scale(0.82)" };
    const arrowGoal = { opacity: 1, transform: "rotate(-18deg) scale(1)" };
    const arrowPoses = [arrowRest, arrowRest, arrowGoal, arrowGoal, arrowRest, arrowRest];

    const os = offsets(hold);
    const timing = { duration: duration * 1000, iterations: Infinity };
    const a1 = phone.animate(
      os.map((offset, k) => ({ offset, transform: poses[k], easing: TURN_EASE })),
      timing
    );
    const a2 = arrow.animate(
      os.map((offset, k) => ({ offset, ...arrowPoses[k], easing: ARROW_EASE })),
      timing
    );
    return () => {
      a1.cancel();
      a2.cancel();
    };
  }, [toLandscape, duration, hold, pop, reduce, turned]);

  const onTurned = () => {
    setTurned(true);
    if (idleRef.current !== null) window.clearTimeout(idleRef.current);
    idleRef.current = window.setTimeout(() => setTurned(false), RESUME_DELAY);
  };

  // reduced-motion は回し終えた姿勢で静止(出典 iamsunnywang の reduce 指定と同じ)
  const stillPhone = reduce
    ? { transform: `rotate(${toLandscape ? -90 : 0}deg)` }
    : { transform: `rotate(${toLandscape ? 0 : -90}deg) scale(${REST_SCALE})` };
  const stillArrow = reduce
    ? { opacity: 0.9, transform: "rotate(-18deg)" }
    : { opacity: 0.25, transform: "rotate(20deg) scale(0.82)" };

  return (
    <DemoStage
      hint="操作不要: 自動でくるっと回る / クリック・タップ（I've turned it）: 向きを直したことにして覆いを消す"
      className={styles.rotateStage}
    >
      {/* 向きを直すと読める本文の絵。覆いの下に敷いておく */}
      <div className={styles.plate} data-md-bleed="" aria-hidden />

      <div className={turned ? `${styles.overlay} ${styles.done}` : styles.overlay}>
        <p className={styles.badge}>Plate 07 · {toLandscape ? "Landscape only" : "Portrait only"}</p>

        <div className={styles.graphic} aria-hidden>
          {/* 曲がった矢印。to portrait は外側で左右反転し、揺れごと時計回りにする */}
          <span className={toLandscape ? styles.arrowWrap : `${styles.arrowWrap} ${styles.mirror}`}>
            <span ref={arrowRef} className={styles.arrow} style={stillArrow}>
              <svg viewBox="0 0 44 44">
                {/* 反時計回り＝出典 iamsunnywang の to landscape と同じ向き */}
                <path d="M10 30a14 14 0 1 0 0-16" />
                <path d="M9 6v9h9" />
              </svg>
            </span>
          </span>
          <span ref={phoneRef} className={styles.phone} style={stillPhone}>
            <i className={styles.screen} />
          </span>
        </div>

        <p className={styles.title}>{toLandscape ? "Rotate to landscape" : "Rotate to portrait"}</p>
        <p className={styles.text}>
          {toLandscape ? "This plate is a wide spread. くるっと横に。" : "This folio reads upright. くるっと縦に。"}
        </p>
        <button type="button" className={styles.doneBtn} onClick={onTurned}>
          I&apos;ve turned it
        </button>
      </div>
    </DemoStage>
  );
}
