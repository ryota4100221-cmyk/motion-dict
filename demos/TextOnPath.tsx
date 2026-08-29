"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./TextOnPath.module.css";

// パスを流れる文。長すぎると弧に収まらず、短すぎると送りが一瞬で終わる
const SENTENCE = "TEXT ON A PATH · CURVED TYPE ·";

// viewBoxの基準。パスの両端(-100 / VB_W+100)はステージの外に置き、
// 文字の出入りをステージの縁で隠す
const VB_W = 480;
const VB_H = 200;
const BASE_Y = 112;

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

// 左右の画面外から入って抜ける2次ベジェ。制御点のYをcurveぶん持ち上げる(curve=0で直線)
function curvePath(curve: number): string {
  return `M ${-100} ${BASE_Y} Q ${VB_W / 2} ${BASE_Y - curve} ${VB_W + 100} ${BASE_Y}`;
}

export default function TextOnPath({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const pathId = useId();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const textPathRef = useRef<SVGTextPathElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    // reduced-motion時は送りを走らせない(静止位置はJSX側で決めている)
    if (reduce) return;
    const scroller = scrollerRef.current;
    const textPath = textPathRef.current;
    if (!scroller || !textPath) return;

    // 現在の送り位置(パス長に対する%)。スクロール値へ毎フレーム寄せて
    // ホイールの粒を均す。実務のstickyピンでも同じ扱いになる
    let current = 100;
    // 最後にDOMへ書き戻した値。差が小さいフレームは属性更新を省く
    let applied = Number.NaN;

    const removeTick = addTick(() => {
      const { travel } = paramsRef.current;
      const max = scroller.scrollHeight - scroller.clientHeight;
      const progress = max > 0 ? scroller.scrollTop / max : 0;
      const target = 100 - progress * travel;
      current += (target - current) * 0.18;

      if (!Number.isNaN(applied) && Math.abs(current - applied) < 0.1) return;
      applied = current;
      textPath.setAttribute("startOffset", `${current.toFixed(2)}%`);
    });

    return removeTick;
  }, [reduce]);

  return (
    <DemoStage
      hint="PC: ステージ内をホイールでスクロール / スマホ: 上下スワイプ"
      className={styles.stage}
    >
      <svg
        className={styles.svg}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <path id={pathId} d={curvePath(params.curve)} />
        </defs>
        {/* パス自体も薄く見せる。「文字はこの線の上を通っている」が一目で伝わる */}
        <use href={`#${pathId}`} className={styles.guide} />
        <text className={styles.text}>
          <textPath
            ref={textPathRef}
            href={`#${pathId}`}
            startOffset={reduce ? "50%" : "100%"}
            textAnchor={reduce ? "middle" : "start"}
          >
            {SENTENCE}
          </textPath>
        </text>
      </svg>
      {/* スクロール入力だけを担う層。SVGはpointer-events:noneで透過させる */}
      <div className={styles.scroller} ref={scrollerRef}>
        <div
          className={styles.track}
          style={{ height: `${params.length * 100}%` }}
        />
      </div>
    </DemoStage>
  );
}
