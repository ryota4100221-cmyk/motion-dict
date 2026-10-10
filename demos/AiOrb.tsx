"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./AiOrb.module.css";

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

type State = "idle" | "thinking" | "speaking";

const ORDER: State[] = ["idle", "thinking", "speaking"];
const LABEL: Record<State, string> = {
  idle: "待機",
  thinking: "考えています…",
  speaking: "回答中",
};
// 自動再生で各状態を見せておく時間(ms)。送信→思考→発話→完了の1往復を模す
const HOLD: Record<State, number> = { idle: 2400, thinking: 2200, speaking: 3200 };

// 状態ごとの回転倍率(待機を1とする)。思考は発話の2/3倍速
function spinRate(state: State, boost: number): number {
  if (state === "speaking") return boost;
  if (state === "thinking") return (boost * 2) / 3;
  return 1;
}

export default function AiOrb({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [state, setState] = useState<State>("idle");

  const haloRef = useRef<HTMLSpanElement>(null);
  const paramsRef = useRef(params);
  const stateRef = useRef<State>("idle");
  // ボタンで状態を指定されたら、その時刻から自動再生を数え直す
  const pickedRef = useRef(false);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    if (reduce) return;
    let angle = 0;
    let speed = -1; // deg/s。初回フレームで目標値に合わせる
    let last = -1;
    let since = -1;
    return addTick((time) => {
      const dt = last < 0 ? 0 : Math.min(0.05, (time - last) / 1000);
      last = time;
      if (since < 0 || pickedRef.current) {
        pickedRef.current = false;
        since = time;
      }

      let s = stateRef.current;
      if (time - since > HOLD[s]) {
        s = ORDER[(ORDER.indexOf(s) + 1) % ORDER.length];
        stateRef.current = s;
        since = time;
        setState(s);
      }

      // 角速度を目標へ寄せてから積分する(durationの書き換えだと角度が飛ぶ)
      const p = paramsRef.current;
      const target = (360 / p.idleSpin) * spinRate(s, p.boost);
      if (speed < 0 || p.stateFade <= 0) speed = target;
      else speed += (target - speed) * (1 - Math.exp(-dt / (p.stateFade / 3)));
      angle = (angle + speed * dt) % 360;

      // ノードは毎フレーム引き直す
      haloRef.current?.style.setProperty("--angle", `${angle}deg`);
    });
  }, [reduce]);

  const pick = (s: State) => {
    stateRef.current = s;
    pickedRef.current = true;
    setState(s);
  };

  const vars = {
    "--fade": `${params.stateFade}s`,
    "--bar": `${params.barMax}px`,
  } as CSSProperties;

  return (
    <DemoStage hint="操作不要(待機→思考→発話を自動でループ) / PC: クリック・スマホ: タップで状態を指定">
      <div className={styles.wrap} style={vars}>
        <span className={styles.orb} data-state={state} aria-hidden>
          <span className={styles.drift}>
            <span ref={haloRef} className={styles.halo} />
          </span>
          <span className={styles.body} />
          <span className={styles.dots}>
            <span />
            <span />
            <span />
          </span>
        </span>
        <p className={styles.label} aria-live="polite">
          {LABEL[state]}
        </p>
        <div className={styles.controls}>
          {ORDER.map((s) => (
            <button
              key={s}
              type="button"
              className={styles.button}
              aria-pressed={state === s}
              onClick={() => pick(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </DemoStage>
  );
}
