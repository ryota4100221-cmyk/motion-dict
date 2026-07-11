"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ErrorShake.module.css";

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

// ±amplitudeから0へ直線的に減衰するtranslateXキーフレームを生成
function shakeKeyframes(amplitude: number, shakes: number): Keyframe[] {
  const frames: Keyframe[] = [{ transform: "translateX(0)" }];
  const steps = shakes * 2; // 1往復 = 左右2振り
  for (let i = 0; i < steps; i++) {
    const decay = 1 - i / steps;
    const sign = i % 2 === 0 ? -1 : 1;
    frames.push({ transform: `translateX(${sign * amplitude * decay}px)` });
  }
  frames.push({ transform: "translateX(0)" });
  return frames;
}

export default function ErrorShake({ params }: { params: ParamValues }) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [value, setValue] = useState("");
  const reduce = useReducedMotion();

  const submit = () => {
    setError(true);
    // reduced-motion: シェイクせず色とメッセージだけで伝える
    if (reduce) return;
    // animate()は同じ要素で何度でも撃ち直せる(再送信のたびに最初から再生)
    fieldRef.current?.animate(
      shakeKeyframes(params.amplitude, Math.round(params.shakes)),
      { duration: params.duration * 1000, easing: "ease-out" }
    );
  };

  return (
    <DemoStage hint="PC: Submitをクリック / スマホ: タップ(入力し直すと解除)">
      <div className={styles.form}>
        <div
          ref={fieldRef}
          className={error ? `${styles.field} ${styles.fieldError}` : styles.field}
        >
          <input
            className={styles.input}
            type="text"
            placeholder="Email"
            value={value}
            aria-invalid={error}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false); // 入力を修正し始めたらエラー解除
            }}
          />
          <button className={styles.submit} onClick={submit}>
            Submit
          </button>
        </div>
        <span
          className={styles.message}
          style={{ opacity: error ? 1 : 0 }}
          role="alert"
        >
          Enter a valid email address
        </span>
      </div>
    </DemoStage>
  );
}
