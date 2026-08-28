"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./CubeRoll.module.css";

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

// 箱の寸法(px)。depthだけがスライダーで動く
const W = 200;
const H = 56;

// ポインタが離れてから自走を再開するまでの待ち(ms)。
// 触られない間もころがし続けないと、この項目は静止画にしか見えない
const IDLE_WAIT = 2200;

export default function CubeRoll({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [rot, setRot] = useState(0);
  const [hovered, setHovered] = useState(false);
  // rAFのコールバックから読むので、hover状態と最終操作時刻はrefでも持つ
  const hoveredRef = useRef(false);
  const lastRef = useRef(0);

  const axisY = Math.round(params.axis) === 1;

  useEffect(() => {
    if (reduce) return;
    return addTick((time) => {
      if (hoveredRef.current) return;
      if (time - lastRef.current < IDLE_WAIT) return;
      lastRef.current = time;
      setRot((r) => r + 180);
    });
  }, [reduce]);

  const touch = () => {
    lastRef.current = performance.now();
  };

  const enter = () => {
    hoveredRef.current = true;
    touch();
    setHovered(true);
    if (!reduce) setRot((r) => r + 180);
  };

  const leave = () => {
    hoveredRef.current = false;
    touch();
    setHovered(false);
    if (!reduce) setRot((r) => r - 180);
  };

  // 制御点のyを1より大きくすると終端で行き過ぎてから戻る
  const ease = `cubic-bezier(0.34, ${(1 + params.overshoot / 25).toFixed(2)}, 0.64, 1)`;

  // reduced-motion時は回さず、ホバーで表裏を即時に入れ替えるだけにする
  const angle = reduce ? (hovered ? 180 : 0) : rot;

  const cubeStyle: CSSProperties = {
    transform: `translateZ(calc(var(--d) / -2)) ${axisY ? "rotateY" : "rotateX"}(${angle}deg)`,
    transitionDuration: reduce ? "0s" : `${params.duration}s`,
    transitionTimingFunction: reduce ? "linear" : ease,
  };

  const sceneStyle: CSSProperties = {
    ["--w" as string]: `${W}px`,
    ["--h" as string]: `${H}px`,
    ["--d" as string]: `${params.depth}px`,
  };

  // X軸で回すと背面は上下が逆さまになるので、中身だけ立て直す
  const backContentStyle: CSSProperties = axisY
    ? {}
    : { transform: "rotate(180deg)" };

  return (
    <DemoStage hint="PC: ボタンにホバー / スマホ: タップ（無操作の間は自分でころがる）">
      <div
        className={styles.scene}
        style={sceneStyle}
        onMouseEnter={enter}
        onMouseLeave={leave}
        onTouchStart={enter}
      >
        <div className={styles.cube} style={cubeStyle}>
          <div className={`${styles.face} ${styles.front}`}>
            <span className={styles.label}>View project</span>
          </div>
          <div className={`${styles.face} ${styles.back}`}>
            <span className={styles.label} style={backContentStyle}>
              View project ↗
            </span>
          </div>
          <div className={`${styles.face} ${styles.side} ${styles.top}`} />
          <div className={`${styles.face} ${styles.side} ${styles.bottom}`} />
          <div className={`${styles.face} ${styles.side} ${styles.left}`} />
          <div className={`${styles.face} ${styles.side} ${styles.right}`} />
        </div>
      </div>
    </DemoStage>
  );
}
