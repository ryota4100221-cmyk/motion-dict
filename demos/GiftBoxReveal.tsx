"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./GiftBoxReveal.module.css";

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

const DELAY = 0.3; // 観察元: カードの登場から0.3s遅れて箱が動く
const DECAY = 0.45; // 観察元: 14px/9° → 6px/4°
const REST = 1400; // 自走: 再生が終わってから次に跳ねるまでの間(ms)

// フタの跳ねを peeks 回ぶんのキーフレームに展開する。
// 1回目の頂点は区間の50%、2回目以降は36%(観察元の 25% / 68%)、向きは毎回反転
function lidFrames(lift: number, tilt: number, peeks: number): Keyframe[] {
  const frames: Keyframe[] = [{ offset: 0, transform: "none", easing: "ease-out" }];
  for (let i = 0; i < peeks; i++) {
    const start = i / peeks;
    const seg = 1 / peeks;
    const k = Math.pow(DECAY, i);
    const sign = i % 2 === 0 ? -1 : 1;
    frames.push({
      offset: start + seg * (i === 0 ? 0.5 : 0.36),
      transform: `translateY(${-lift * k}px) rotate(${sign * tilt * k}deg)`,
      easing: "ease-out",
    });
    frames.push({ offset: start + seg, transform: "none", easing: "ease-out" });
  }
  return frames;
}

const SPARK_FRAMES: Keyframe[] = [
  { offset: 0, opacity: 0, transform: "scale(0.6)", easing: "ease-out" },
  { offset: 0.2, opacity: 0, transform: "scale(0.6)", easing: "ease-out" },
  { offset: 0.45, opacity: 1, transform: "scale(1.1)", easing: "ease-out" },
  { offset: 1, opacity: 1, transform: "none" },
];

export default function GiftBoxReveal({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const lidRef = useRef<SVGGElement>(null);
  const sparkRef = useRef<SVGGElement>(null);
  const animsRef = useRef<Animation[]>([]);
  const touchedRef = useRef(false);
  const nextRef = useRef(0);

  const lift = params.lift;
  const tilt = params.tilt;
  const peeks = Math.round(params.peeks);
  const duration = params.duration;
  const cycle = (DELAY + duration) * 1000 + REST;

  // 自走もクリックも同じ play で頭から再生し直す
  useEffect(() => {
    const play = () => {
      animsRef.current.forEach((a) => a.cancel());
      const lid = lidRef.current;
      const spark = sparkRef.current;
      if (!lid || !spark) return;
      const timing: KeyframeAnimationOptions = {
        duration: duration * 1000,
        delay: DELAY * 1000,
        fill: "both",
      };
      animsRef.current = [
        lid.animate(lidFrames(lift, tilt, peeks), timing),
        spark.animate(SPARK_FRAMES, timing),
      ];
    };

    if (reduce) {
      animsRef.current.forEach((a) => a.cancel());
      animsRef.current = [];
      return;
    }

    nextRef.current = 0;
    const stop = addTick((time) => {
      if (touchedRef.current) {
        touchedRef.current = false;
        nextRef.current = 0;
      }
      if (time < nextRef.current) return;
      play();
      nextRef.current = time + cycle;
    });
    return () => {
      stop();
      animsRef.current.forEach((a) => a.cancel());
      animsRef.current = [];
    };
  }, [reduce, lift, tilt, peeks, duration, cycle]);

  return (
    <DemoStage hint="PC: 箱をクリック / スマホ: タップ(フタが跳ねてきらめきが灯る)">
      <div className={styles.field}>
        <div className={styles.card}>
          <button
            type="button"
            className={styles.media}
            aria-label="ギフトを再生"
            onClick={() => {
              touchedRef.current = true;
            }}
          >
            <svg className={styles.gift} viewBox="0 0 120 110" aria-hidden>
              <g ref={sparkRef} className={`${styles.spark} ${reduce ? styles.still : ""}`}>
                <path d="M18 30v10M13 35h10" className={styles.sparkAi} />
                <path d="M103 20v8M99 24h8" className={styles.sparkPale} />
                <path d="M106 66v8M102 70h8" className={styles.sparkAi} />
              </g>
              <rect x="22" y="52" width="76" height="52" rx="6" className={styles.box} />
              <rect x="22" y="52" width="76" height="6" className={styles.shade} />
              <rect x="54" y="52" width="12" height="52" className={styles.ribbon} />
              <g ref={lidRef} className={styles.lid}>
                <path d="M60 39C50 24 33 26 39 37c4 6 14 4 21 2Z" className={styles.ribbon} />
                <path d="M60 39C70 24 87 26 81 37c-4 6-14 4-21 2Z" className={styles.ribbon} />
                <rect x="16" y="38" width="88" height="17" rx="5" className={styles.lidTop} />
                <rect x="54" y="38" width="12" height="17" className={styles.ribbon} />
                <circle cx="60" cy="39" r="4.5" className={styles.knot} />
              </g>
            </svg>
          </button>
          <div className={styles.body}>
            <p className={styles.head}>JOIN THE CLUB</p>
            <p className={styles.sub}>特典はメンバー登録のあとで</p>
            <span className={styles.cta} aria-hidden>
              開けてみる
            </span>
          </div>
        </div>
      </div>
    </DemoStage>
  );
}
