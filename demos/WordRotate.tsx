"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./WordRotate.module.css";

// 回す単語(全角のみ。マスク幅は文字数から算出する)
const WORDS = ["デザイン", "コピー", "実装"];
// letter-spacing 0.05em 込みの1文字あたりの幅(em)
const CHAR_EM = 1.05;

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

export default function WordRotate({ params }: { params: ParamValues }) {
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

  // 単語幅の変化はマスクのwidthをtransitionで追従させる
  const maskStyle = {
    width: `${(WORDS[index].length * CHAR_EM).toFixed(2)}em`,
    "--d": `${params.duration}s`,
  } as CSSProperties;

  return (
    <DemoStage hint="自動でループ再生">
      <p className={styles.sentence}>
        <span className={styles.mask} style={maskStyle}>
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
        を、伝わる形に
      </p>
    </DemoStage>
  );
}
