"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./HintNudge.module.css";

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

const CARDS = ["01", "02", "03", "04", "05", "06"];

// 操作が止まってからヒントを復帰させるまで。
// 実運用では「一度触ったら二度と出さない」でよく、ここはデモとして見返せるようにしている
const RESUME_DELAY = 2500;

export default function HintNudge({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [cycle, setCycle] = useState(0); // 周の通し番号。増やすとkeyが変わり次の周が始まる
  const [engaged, setEngaged] = useState(false); // ユーザーが操作したか
  const idleRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (idleRef.current !== null) window.clearTimeout(idleRef.current);
    },
    []
  );

  // 触った時点でヒントの役目は終わり。放置でまた出す(デモのため)
  const onEngage = () => {
    setEngaged(true);
    if (idleRef.current !== null) window.clearTimeout(idleRef.current);
    idleRef.current = window.setTimeout(() => setEngaged(false), RESUME_DELAY);
  };

  const active = !engaged && !reduce;

  const cueStyle = {
    "--nudge-distance": `${params.distance}px`,
    animationDuration: `${params.duration}s`,
    // 休止はanimation-delayで作る。周ごとに要素を作り直すので毎周この間が入る
    animationDelay: `${params.rest}s`,
  } as CSSProperties;

  return (
    <DemoStage
      hint="横スクロール / スワイプ: 触るとヒントは引っ込む"
      className={styles.hintStage}
    >
      <div
        className={styles.scroller}
        onScroll={onEngage}
        onPointerDown={onEngage}
      >
        {CARDS.map((n) => (
          <div className={styles.card} key={n}>
            {n}
          </div>
        ))}
      </div>
      <span className={styles.fade} aria-hidden />
      {/* 停止中も矢印自体は残す。動きが消えても「右に続く」意味は残るべき。
          keyにパラメータを含め、スライダーを動かした周からすぐ新しい数値で鳴らす */}
      <span
        key={`${cycle}-${params.distance}-${params.duration}-${params.rest}`}
        className={active ? `${styles.cue} ${styles.cueOn}` : styles.cue}
        style={cueStyle}
        onAnimationEnd={() => setCycle((c) => c + 1)}
        aria-hidden
      >
        →
      </span>
    </DemoStage>
  );
}
