"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./Strikethrough.module.css";

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

// 頼み方の言い直し。上3行(曖昧な頼み方)を消し、最後の1行(数値で言えた頼み方)だけ残す
const ROWS = [
  { n: "[01]", text: "Make it pop", note: "[Too vague]", struck: true },
  { n: "[02]", text: "Something smooth", note: "[Says nothing]", struck: true },
  { n: "[03]", text: "Animate it nicely", note: "[No numbers]", struck: true },
  { n: "[04]", text: "Fade up 24px in 0.6s", note: "[Approved]", struck: false },
] as const;

// 出典(adriangnzl.es の404)の固定値：行の出 0.7s、線は行が出て 0.55s 後、沈めるのは 0.5s
const ENTER = 0.7;
const STRIKE_AT = 0.55;
const DIM_DUR = 0.5;
// 最終状態を見せておく時間と、次の周回の前に消える時間(ms)
const HOLD = 1800;
const LEAVE = 450;

export default function Strikethrough({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [run, setRun] = useState(0);
  const [leaving, setLeaving] = useState(false);

  const { duration, stagger, dim, thickness } = params;

  // 1周 = 最後の行が出きる/最後の消し行が沈みきるまで + HOLD。その後いったん消えて頭から
  useEffect(() => {
    if (reduce) return;
    const lastStruck = ROWS.length - 2;
    const dimEnd =
      (lastStruck * stagger + STRIKE_AT + duration * 0.8 + DIM_DUR) * 1000;
    const enterEnd = ((ROWS.length - 1) * stagger + ENTER) * 1000;
    const total = Math.max(dimEnd, enterEnd) + HOLD;
    const t1 = setTimeout(() => setLeaving(true), total);
    const t2 = setTimeout(() => {
      setLeaving(false);
      setRun((r) => r + 1);
    }, total + LEAVE);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [run, reduce, duration, stagger]);

  const replay = () => {
    setLeaving(false);
    setRun((r) => r + 1);
  };

  const vars = {
    "--st-dur": `${duration}s`,
    "--st-stagger": `${stagger}s`,
    "--st-dim": dim,
    "--st-thick": `${thickness / 100}em`,
    "--st-enter": `${ENTER}s`,
    "--st-at": `${STRIKE_AT}s`,
    "--st-dim-dur": `${DIM_DUR}s`,
  } as CSSProperties;

  return (
    <DemoStage hint="自動で再生 / Strike again で最初から(PC・スマホ共通)">
      <div
        className={styles.sheet}
        style={vars}
        data-reduce={reduce ? "true" : "false"}
        data-leaving={leaving ? "true" : "false"}
      >
        <ol className={styles.list}>
          {ROWS.map((r, i) => (
            <li
              // 周回と時間のパラメータを key に入れ、変えたら頭から再生し直す
              key={`row-${run}-${duration}-${stagger}-${i}`}
              className={styles.row}
              data-struck={r.struck ? "true" : "false"}
              style={{ "--i": i } as CSSProperties}
            >
              <span className={styles.n} aria-hidden="true">
                {r.n}
              </span>
              <span className={styles.txt}>
                {r.struck ? (
                  <span className={styles.strike}>{r.text}</span>
                ) : (
                  r.text
                )}
              </span>
              <span className={styles.note} aria-hidden="true">
                {r.note}
              </span>
            </li>
          ))}
        </ol>
        <button type="button" className={styles.replay} onClick={replay}>
          Strike again
        </button>
      </div>
    </DemoStage>
  );
}
