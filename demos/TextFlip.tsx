"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./TextFlip.module.css";

// 回す単語(同じセルに重ねるので幅は最長の単語に揃う)
const WORDS = ["Design", "Develop", "Deliver"];

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

export default function TextFlip({ params }: { params: ParamValues }) {
  // 何回入れ替えたか。index/prevはここから導出する
  const [count, setCount] = useState(0);
  const reduce = useReducedMotion();
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  // interval変更を次サイクルから反映させるためsetTimeoutを繋いで回す
  useEffect(() => {
    if (reduce) return; // reduced-motion時は回転を止め最初の単語で固定
    let id: number;
    const tick = () => {
      setCount((c) => c + 1);
      id = window.setTimeout(tick, paramsRef.current.interval * 1000);
    };
    id = window.setTimeout(tick, paramsRef.current.interval * 1000);
    return () => clearTimeout(id);
  }, [reduce]);

  const index = count % WORDS.length;
  const prev = (count + WORDS.length - 1) % WORDS.length;

  // perspectiveは3D変形の視点距離。回る単語の親に設定する
  const wrapStyle = {
    perspective: `${params.perspective}px`,
    "--d": `${params.duration}s`,
  } as CSSProperties;

  return (
    <DemoStage hint="自動でループ再生">
      <span className={styles.wrap} style={wrapStyle}>
        {count > 0 && (
          <span className={`${styles.word} ${styles.out}`} key={`out-${count}`}>
            {WORDS[prev]}
          </span>
        )}
        <span
          className={count > 0 ? `${styles.word} ${styles.in}` : styles.word}
          key={`in-${count}`}
        >
          {WORDS[index]}
        </span>
      </span>
    </DemoStage>
  );
}
