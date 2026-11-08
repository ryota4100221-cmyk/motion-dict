"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./DiceRoll.module.css";

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

// 観察元(charbeltannous.com の preset dice)の固定値
const PRESS_DUR = 0.14; // 押し込み(予備動作)
const SETTLE_DUR = 0.5; // 着地の潰れから戻る elastic
const RISE_RATIO = 0.42; // 跳ね上がり = duration × 0.42、残りが落下
const IDLE_WAIT = 2400; // この時間操作が無ければ自走に戻る
const AUTO_GAP = 2600; // 自走: 振ってから次に振るまで

// 目ごとに点を打つ 3×3 のマス(0始まり)
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

// 出た目で引く見出し語
const ENTRIES = [
  "Split text reveal",
  "Ken Burns effect",
  "Marching ants",
  "Page turn",
  "Stamp in",
  "Squash and stretch",
];

const power1Out = (t: number) => 1 - (1 - t) ** 2;
const power2Out = (t: number) => 1 - (1 - t) ** 3;
const power2In = (t: number) => t ** 3;
// GSAP の elastic.out(1, 0.42) と同じ式
const elasticOut = (t: number) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const p = 0.42;
  return 2 ** (-10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// 除外した目以外から1つ引く(入れ替えは直前の目、最終の目は直前の目と前回の結果を外す)
const otherFace = (...not: number[]) => {
  const pool = [1, 2, 3, 4, 5, 6].filter((f) => !not.includes(f));
  return pool[Math.floor(Math.random() * pool.length)];
};

type Phase =
  | { kind: "idle" }
  | { kind: "press"; start: number }
  | { kind: "cancel"; start: number; from: number }
  | { kind: "roll"; start: number; from: number; shown: number };

export default function DiceRoll({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [face, setFace] = useState(5);
  const [result, setResult] = useState(4); // ENTRIES の index
  const [rolling, setRolling] = useState(false);

  const dieRef = useRef<HTMLSpanElement>(null); // 跳ね・潰れ(接地点=下端基準)
  const rotorRef = useRef<HTMLSpanElement>(null); // 回転(中心基準)
  const phaseRef = useRef<Phase>({ kind: "idle" });
  const faceRef = useRef(5);
  const resultRef = useRef(4);
  // 予約された操作は次のフレームで rAF の time を付けて確定する(performance.now は lint で落ちる)
  const pendingRef = useRef<"press" | "roll" | "cancel" | null>(null);
  const lastInputRef = useRef(-Infinity);
  const nextAutoRef = useRef(0);
  const touchedRef = useRef(false);

  const duration = params.duration;
  const hop = params.hop;
  const squash = params.squash / 100;
  const shuffles = Math.round(params.shuffles);
  const paramRef = useRef({ duration, hop, squash, shuffles });
  useEffect(() => {
    paramRef.current = { duration, hop, squash, shuffles };
  }, [duration, hop, squash, shuffles]);

  const showFace = (f: number) => {
    faceRef.current = f;
    setFace(f);
  };

  // reduced-motion: 動かさず目と見出し語だけ切り替える
  const rollStill = () => {
    const f = otherFace(faceRef.current, resultRef.current + 1);
    resultRef.current = f - 1;
    showFace(f);
    setResult(f - 1);
  };

  useEffect(() => {
    if (reduce) return;
    return addTick((time) => {
      // ノードが作り直されても追えるよう毎フレーム引く
      const die = dieRef.current;
      const rotor = rotorRef.current;
      const P = paramRef.current;
      const pending = pendingRef.current;
      pendingRef.current = null;
      const ph = phaseRef.current;

      // 読み込み直後にいきなり振らない(最初のクリックが振っている最中に当たって捨てられる)
      if (nextAutoRef.current === 0) nextAutoRef.current = time + IDLE_WAIT;
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInputRef.current = time;
        nextAutoRef.current = time + IDLE_WAIT;
      }

      // 押し込みの途中から振る/戻すときは、その時点の押し込み量から始める
      const pressAmount = (p: Phase) =>
        p.kind === "press" ? power2Out(Math.min(1, (time - p.start) / 1000 / PRESS_DUR)) : 0;

      if (pending === "press" && ph.kind === "idle") {
        phaseRef.current = { kind: "press", start: time };
      } else if (pending === "cancel" && ph.kind === "press") {
        phaseRef.current = { kind: "cancel", start: time, from: pressAmount(ph) };
      } else if (pending === "roll" && ph.kind !== "roll") {
        phaseRef.current = { kind: "roll", start: time, from: pressAmount(ph), shown: 0 };
        setRolling(true);
      } else if (
        !pending &&
        ph.kind === "idle" &&
        time - lastInputRef.current >= IDLE_WAIT &&
        time >= nextAutoRef.current
      ) {
        // 無操作のあいだは自走で振る(録画のループ動画にも転がりが映る)
        phaseRef.current = { kind: "roll", start: time, from: 0, shown: 0 };
        nextAutoRef.current = time + AUTO_GAP + P.duration * 1000;
        setRolling(true);
      }

      const cur = phaseRef.current;
      let y = 0;
      let rot = 0;
      let sx = 1;
      let sy = 1;

      if (cur.kind === "press") {
        const k = pressAmount(cur);
        y = 1.5 * k;
        sx = lerp(1, 1.14, k);
        sy = lerp(1, 0.82, k);
      } else if (cur.kind === "cancel") {
        const t = Math.min(1, (time - cur.start) / 1000 / 0.4);
        const k = cur.from * (1 - elasticOut(t));
        y = 1.5 * k;
        sx = lerp(1, 1.14, k);
        sy = lerp(1, 0.82, k);
        if (t >= 1) phaseRef.current = { kind: "idle" };
      } else if (cur.kind === "roll") {
        const t = (time - cur.start) / 1000;
        const D = P.duration;
        const rise = D * RISE_RATIO;
        // 回転: 0→360deg を duration で power1.out
        rot = 360 * power1Out(Math.min(1, t / D));
        if (t < rise) {
          const k = power2Out(t / rise);
          y = lerp(1.5 * cur.from, -P.hop, k);
          sx = lerp(lerp(1, 1.14, cur.from), 0.9, k);
          sy = lerp(lerp(1, 0.82, cur.from), 1.12, k);
        } else if (t < D) {
          const k = power2In((t - rise) / (D - rise));
          y = lerp(-P.hop, 0, k);
          sx = lerp(0.9, 1, k);
          sy = lerp(1.12, 1, k);
        } else {
          // 着地: 潰れた形から elastic で 1 に戻す
          const k = elasticOut(Math.min(1, (t - D) / SETTLE_DUR));
          sx = lerp(1 + P.squash, 1, k);
          sy = lerp(1 - P.squash, 1, k);
          rot = 360;
        }
        // 空中で目を入れ替える: k 回目は duration × 0.67 × (k/n)^1.2(後ろほど間が延びる)
        const n = P.shuffles;
        let due = 0;
        for (let k = 1; k <= n; k++) {
          if (t >= D * 0.67 * (k / n) ** 1.2) due = k;
        }
        if (due > cur.shown && t < D) {
          cur.shown = due;
          showFace(otherFace(faceRef.current));
        }
        if (t >= D && cur.shown <= n) {
          // 着地の瞬間に最終の目を確定し、見出し語を引く
          cur.shown = n + 1;
          const f = otherFace(faceRef.current, resultRef.current + 1);
          resultRef.current = f - 1;
          showFace(f);
          setResult(f - 1);
        }
        if (t >= D + SETTLE_DUR) {
          phaseRef.current = { kind: "idle" };
          setRolling(false);
          rot = 0;
        }
      }

      if (die) {
        die.style.transform = `translateY(${y.toFixed(2)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
      }
      if (rotor) rotor.style.transform = `rotate(${rot.toFixed(2)}deg)`;
    });
  }, [reduce]);

  const request = (what: "press" | "roll" | "cancel") => {
    touchedRef.current = true;
    if (reduce) {
      if (what === "roll") rollStill();
      return;
    }
    pendingRef.current = what;
  };

  return (
    <DemoStage hint="PC: サイコロを押して離す(押している間は縮んで溜める) / スマホ: タップ">
      <div className={styles.field}>
        <p className={styles.kicker}>Random entry</p>
        <button
          type="button"
          className={styles.roll}
          aria-label="Roll the dice"
          aria-busy={rolling}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            request("press");
          }}
          onPointerUp={() => request("roll")}
          onPointerCancel={() => request("cancel")}
          onClick={(e) => {
            // キーボード(Enter / Space)のクリックだけここで振る。ポインタは pointerup で振っている
            if (e.detail === 0) request("roll");
          }}
        >
          <span className={styles.die} ref={dieRef} aria-hidden>
            <span className={styles.rotor} ref={rotorRef}>
              <span className={styles.pips} data-face={face}>
                {Array.from({ length: 9 }, (_, i) => (
                  <i key={i} className={PIPS[face].includes(i) ? styles.on : ""} />
                ))}
              </span>
            </span>
          </span>
          <span className={styles.label}>Roll the dice</span>
        </button>
        <p className={styles.result} aria-live="polite">
          <span className={styles.num}>Entry 0{result + 1}</span>
          <span className={`${styles.name} ${rolling ? styles.dim : ""}`}>
            {ENTRIES[result]}
          </span>
        </p>
      </div>
    </DemoStage>
  );
}
