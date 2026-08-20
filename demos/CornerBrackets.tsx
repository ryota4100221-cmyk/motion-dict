"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./CornerBrackets.module.css";

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

// 出る順は左上→右上→左下→右下。sx/sy は「そのコーナーから見た外向き」の符号、
// dir は回転の向き(左上と右下が反時計回り、右上と左下が時計回り)。
const CORNERS = [
  { key: "tl", cls: "tl", sx: -1, sy: -1, dir: -1 },
  { key: "tr", cls: "tr", sx: 1, sy: -1, dir: 1 },
  { key: "bl", cls: "bl", sx: -1, sy: 1, dir: 1 },
  { key: "br", cls: "br", sx: 1, sy: 1, dir: -1 },
] as const;

// 終端でぴたっと止まるカーブ(easeOutQuint)
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export default function CornerBrackets({ params }: { params: ParamValues }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const play = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const size = Math.round(params.size);
    // 外向きに逃がす距離は腕の長さの半分。size に連動させると見えの比率が崩れない
    const travel = size / 2;

    CORNERS.forEach((c, i) => {
      const el = frame.querySelector<HTMLElement>(`.${styles[c.cls]}`);
      if (!el) return;
      // reduced-motion: 回転も移動も拡縮もせず、定位置のまま短くフェードするだけ
      if (reduce) {
        el.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 200,
          fill: "both",
        });
        return;
      }
      el.animate(
        [
          {
            opacity: 0,
            transform: `rotate(${c.dir * params.spin}deg) translate(${
              c.sx * travel
            }px, ${c.sy * travel}px) scale(0.35)`,
          },
          { opacity: 1, transform: "rotate(0deg) translate(0px, 0px) scale(1)" },
        ],
        {
          duration: params.duration * 1000,
          delay: i * params.stagger * 1000,
          easing: EASE,
          // delay 中にブラケットが素の状態でチラつくのを防ぐ
          fill: "both",
        }
      );
    });
  }, [params.size, params.spin, params.duration, params.stagger, reduce]);

  // マウント時と、スライダーを動かすたびに撃ち直す(数値の効きがその場で分かる)
  useEffect(() => {
    play();
  }, [play]);

  const armStyle = { width: params.size, height: params.size };
  // ブラケットは腕の長さぶん内側へ寄せる。size を変えても枠の見えが破綻しない
  const insetStyle = { padding: params.size };

  return (
    <DemoStage hint="PC: 枠をクリックで再生 / スマホ: タップ(スライダー操作でも再生)">
      <div
        ref={frameRef}
        className={styles.frame}
        style={insetStyle}
        onClick={play}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            play();
          }
        }}
      >
        <div className={`${styles.corner} ${styles.tl}`} style={armStyle} aria-hidden="true" />
        <div className={`${styles.corner} ${styles.tr}`} style={armStyle} aria-hidden="true" />
        <div className={`${styles.corner} ${styles.bl}`} style={armStyle} aria-hidden="true" />
        <div className={`${styles.corner} ${styles.br}`} style={armStyle} aria-hidden="true" />

        {/* 囲まれる中身。四辺を閉じないので視認性が落ちないことが分かる */}
        <div className={styles.body}>
          <span className={styles.eyebrow}>DIGITAL STUDIO</span>
          <span className={styles.title}>Framed,<br />not fenced.</span>
        </div>
      </div>
    </DemoStage>
  );
}
