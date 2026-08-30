"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./GradientWipe.module.css";

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

// content/gradient-wipe.ts の easing options と同順
const EASINGS: ((t: number) => number)[] = [
  (t) => t, // linear
  (t) => 1 - Math.pow(1 - t, 3), // ease-out
  (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), // ease-in-out
];

const HOLD = 0.55; // 掃き切ってから折り返すまでの静止(s)

// 境目を1本だけ持つマスク。停止位置の % は「グラデーションの線」上の距離なので、
// angleを変えても start=-softness → 100 で必ず全面を通過し切る。
// reveal は不透明が伸びて絵が現れ、その逆は透明が伸びて絵が溶ける。
function maskFor(progress: number, angle: number, softness: number, reveal: boolean): string {
  const start = progress * (100 + softness) - softness;
  const end = start + softness;
  const a = `${angle}deg`;
  return reveal
    ? `linear-gradient(${a}, #000 0%, #000 ${start}%, transparent ${end}%, transparent 100%)`
    : `linear-gradient(${a}, transparent 0%, transparent ${start}%, #000 ${end}%, #000 100%)`;
}

export default function GradientWipe({ params }: { params: ParamValues }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);
  const reduce = useReducedMotion();
  // reduced-motion時の表示側(掃かずに即切替する先)
  const [shown, setShown] = useState(true);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const apply = useCallback((progress: number, reveal: boolean) => {
    const el = layerRef.current;
    if (!el) return;
    const { angle, softness } = paramsRef.current;
    const mask = maskFor(progress, angle, softness, reveal);
    el.style.setProperty("-webkit-mask-image", mask);
    el.style.setProperty("mask-image", mask);
  }, []);

  useEffect(() => {
    // reduced-motion: 掃かずに、切り替え後の状態だけを出す
    if (reduce) {
      apply(shown ? 1 : 0, true);
      return;
    }
    // 進捗は「今の向きで何割掃いたか」。掃き切ったらHOLDだけ静止して向きを反転する。
    // Switchは初手の向きを変える = その場から逆向きに掃き直す
    const st = { p: 0, reveal: shown, hold: 0, last: 0 };
    apply(0, st.reveal); // 初回tickまでの1フレーム、マスク無しで出てしまうのを防ぐ
    return addTick((time) => {
      const t = time / 1000;
      const dt = st.last ? Math.min(t - st.last, 0.05) : 0;
      st.last = t;
      if (st.hold > 0) {
        st.hold -= dt;
      } else {
        st.p += dt / paramsRef.current.duration;
        if (st.p >= 1) {
          st.p = 1;
          st.hold = HOLD;
        }
      }
      if (st.p >= 1 && st.hold <= 0) {
        st.p = 0;
        st.reveal = !st.reveal;
      }
      const ease = EASINGS[Math.round(paramsRef.current.easing)] ?? EASINGS[0];
      apply(ease(st.p), st.reveal);
    });
  }, [reduce, shown, apply]);

  return (
    <DemoStage hint="自動でループ再生 / Switch: 手動で切り替え(タップも可)">
      <div className={styles.frame}>
        <div className={`${styles.layer} ${styles.imgB}`}>
          <span className={`${styles.tag} ${styles.tagB}`}>02</span>
        </div>
        <div className={`${styles.layer} ${styles.imgA}`} ref={layerRef}>
          <span className={`${styles.tag} ${styles.tagA}`}>01</span>
        </div>
      </div>
      <button className={styles.playBtn} onClick={() => setShown((s) => !s)}>
        Switch
      </button>
    </DemoStage>
  );
}
