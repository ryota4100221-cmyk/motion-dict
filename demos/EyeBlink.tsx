"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./EyeBlink.module.css";

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

const FACES = [
  { name: "左のキャラ", accent: false },
  { name: "真ん中のキャラ", accent: true },
  { name: "右のキャラ", accent: false },
];

const CLOSED = 0.1; // 閉じきったときの scaleY
const CLOSE_RATIO = 0.4; // 閉じる側の割合(残りが開く側)
const DOUBLE_GAP = 120; // 二度瞬きの間(ms)

// キャラ1体ぶんの予約。時刻はすべて rAF の time(performance.now は使わない)
type Face = { next: number | null; blinks: number[]; tapped: boolean };

const newFaces = (): Face[] =>
  FACES.map(() => ({ next: null, blinks: [], tapped: false }));

export default function EyeBlink({ params }: { params: ParamValues }) {
  const eyeRefs = useRef<(HTMLSpanElement | null)[][]>(FACES.map(() => []));
  const facesRef = useRef<Face[]>(newFaces());
  const reduce = useReducedMotion();

  const { interval, duration, jitter, double } = params;

  useEffect(() => {
    // 数値を変えたら予約を取り直す(古い間隔の予約が残らないように)
    facesRef.current = newFaces();
    if (reduce) {
      eyeRefs.current.flat().forEach((el) => el?.style.removeProperty("transform"));
      return;
    }
    const gap = () => interval * 1000 * (1 + (jitter / 100) * (Math.random() * 2 - 1));

    // 1回の瞬きの開き具合。閉じは ease-in で速く、開きは ease-out でゆっくり
    const openness = (t: number) => {
      const close = duration * CLOSE_RATIO;
      if (t < close) {
        const p = t / close;
        return 1 - (1 - CLOSED) * p * p;
      }
      const p = Math.min(1, (t - close) / (duration - close));
      return CLOSED + (1 - CLOSED) * (1 - (1 - p) * (1 - p));
    };

    const blink = (face: Face, time: number) => {
      face.blinks.push(time);
      let busy = duration;
      if (Math.random() * 100 < double) {
        face.blinks.push(time + duration + DOUBLE_GAP);
        busy += DOUBLE_GAP + duration;
      }
      // 次の予約は瞬き終わりから数える。毎回ずらすのがこの動きの本体
      face.next = time + busy + gap();
    };

    return addTick((time) => {
      facesRef.current.forEach((face, i) => {
        // 初回は1体ずつ別々の時刻に予約する(全員同時に瞬かないように)
        if (face.next === null) face.next = time + 400 + i * 700 + Math.random() * 600;
        if (face.tapped) {
          face.tapped = false;
          face.blinks = [];
          blink(face, time);
        } else if (time >= face.next) {
          blink(face, time);
        }

        let s = 1;
        face.blinks = face.blinks.filter((start) => time - start < duration);
        for (const start of face.blinks) {
          const t = time - start;
          if (t >= 0) s = Math.min(s, openness(t));
        }
        // ノードは入れ替わることがあるので毎フレーム引き直す
        for (const el of eyeRefs.current[i]) {
          if (el) el.style.transform = `scaleY(${s.toFixed(3)})`;
        }
      });
    });
  }, [interval, duration, jitter, double, reduce]);

  const tap = (i: number) => {
    if (reduce) return;
    facesRef.current[i].tapped = true;
  };

  return (
    <DemoStage hint="PC: キャラをクリックでその場で瞬く(間隔は毎回ずれる) / スマホ: タップ">
      <div className={styles.row}>
        {FACES.map((face, i) => (
          <button
            key={face.name}
            type="button"
            className={face.accent ? `${styles.face} ${styles.accent}` : styles.face}
            onClick={() => tap(i)}
            aria-label={`${face.name}を瞬かせる`}
          >
            <span className={styles.eyes} aria-hidden>
              {[0, 1].map((k) => (
                <span
                  key={k}
                  ref={(el) => {
                    eyeRefs.current[i][k] = el;
                  }}
                  className={styles.eye}
                >
                  <span className={styles.pupil} />
                </span>
              ))}
            </span>
            <span className={styles.mouth} aria-hidden />
          </button>
        ))}
      </div>
    </DemoStage>
  );
}
