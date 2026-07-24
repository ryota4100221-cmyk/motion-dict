"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./MotionPath.module.css";

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

// ステージ内座標(offset-pathのpath座標系=コンテナ左上原点)。
// 全要素が同じ始点から発火し、右側へ扇状に着地する。
const STAGE_W = 300;
const STAGE_H = 260;
const START = { x: 52, y: 206 };
const COUNT = 5;
const END_X = 244;
const END_Y0 = 52;
const END_GAP = 30;

// 始点→終点の2次ベジェをpath文字列で返す。
// 制御点は中点を垂直方向にcurveだけ持ち上げた点。curve=0なら中点が線上に乗り直線になる。
function pathFor(endY: number, curve: number): string {
  const mx = (START.x + END_X) / 2;
  const my = (START.y + endY) / 2;
  const cx = mx;
  const cy = my - curve;
  return `path("M ${START.x} ${START.y} Q ${cx} ${cy} ${END_X} ${endY}")`;
}

export default function MotionPath({ params }: { params: ParamValues }) {
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const animsRef = useRef<Animation[]>([]);
  const reduce = useReducedMotion();

  const rotate = Math.round(params.rotate) === 1;

  const play = useCallback(() => {
    // 前回の再生を止めてから撃ち直す(スライダー連打でも溜まらない)
    animsRef.current.forEach((a) => a.cancel());
    animsRef.current = [];

    itemsRef.current.forEach((el, i) => {
      if (!el) return;
      const endY = END_Y0 + i * END_GAP;
      // 軌道と接線追従はスタイルで、進む位置(offset-distance)はWAAPIで動かす
      el.style.offsetPath = pathFor(endY, params.curve);
      el.style.offsetRotate = rotate ? "auto" : "0deg";

      // reduced-motion: パス移動をやめ、終点でフェードインだけ
      if (reduce) {
        el.style.offsetDistance = "100%";
        animsRef.current.push(
          el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: "both" })
        );
        return;
      }

      animsRef.current.push(
        el.animate([{ offsetDistance: "0%" }, { offsetDistance: "100%" }], {
          duration: params.duration * 1000,
          delay: i * params.stagger * 1000,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)", // expo.out寄り: 勢いよく出て静かに着地
          fill: "both", // 発火待ちの間は始点に、着地後は終点に留める
        })
      );
    });
  }, [params.curve, params.stagger, params.duration, rotate, reduce]);

  // マウント時と、スライダーを動かすたびに撃ち直す(数値の効きがその場で分かる)
  useEffect(() => {
    play();
  }, [play]);

  return (
    <DemoStage hint="PC: ステージをクリックで再生 / スマホ: タップ(スライダー操作でも再生)">
      <div
        className={styles.stage}
        style={{ width: STAGE_W, height: STAGE_H }}
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
        {/* 着地の目印。並ぶ先が見えると«流れ»の着地が読みやすい */}
        <div
          className={styles.targets}
          style={{ left: END_X, top: END_Y0 }}
          aria-hidden="true"
        >
          {Array.from({ length: COUNT }, (_, i) => (
            <span key={i} className={styles.slot} style={{ top: i * END_GAP }} />
          ))}
        </div>
        {Array.from({ length: COUNT }, (_, i) => (
          <div
            key={i}
            ref={(el) => {
              itemsRef.current[i] = el;
            }}
            className={styles.chip}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </DemoStage>
  );
}
