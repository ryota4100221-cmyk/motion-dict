"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./CardShuffle.module.css";

const CARDS = ["/demo/dummy-01.svg", "/demo/dummy-02.svg", "/demo/dummy-03.svg"];

// 手前(0)から奥へ、扇の角度を -1→0→+1 の向きで割り当てる
const ROTATION_SIGN = [-1, 0, 1];

export default function CardShuffle({ params }: { params: ParamValues }) {
  const [deck, setDeck] = useState(CARDS);
  const [dropping, setDropping] = useState(false);
  const reduce = useReducedMotion();

  const interval = params.interval;
  const duration = params.duration;
  const { fan, scaleStep } = params;

  const shuffle = useCallback(() => {
    if (dropping) return;
    // reduced-motion時は送り出しを挟まず並び替えだけ行う
    if (reduce) {
      setDeck((d) => [...d.slice(1), d[0]]);
      return;
    }
    setDropping(true);
  }, [dropping, reduce]);

  // 送り出しが終わってから並び替える。着地点が最奥の静止状態と同じなので継ぎ目は見えない
  useEffect(() => {
    if (!dropping) return;
    const id = setTimeout(() => {
      setDeck((d) => [...d.slice(1), d[0]]);
      setDropping(false);
    }, duration * 1000);
    return () => clearTimeout(id);
  }, [dropping, duration]);

  // 自動送り。droppingがfalseに戻るたびに張り直されるので、手動操作でもタイマーが仕切り直される
  useEffect(() => {
    if (interval === 0 || reduce || dropping) return;
    const id = setTimeout(shuffle, interval * 1000);
    return () => clearTimeout(id);
  }, [interval, reduce, dropping, shuffle]);

  const deckStyle = {
    "--front-rot": `${-fan}deg`,
    "--back-rot": `${fan}deg`,
    "--back-scale": `${1 - 2 * scaleStep}`,
    "--drop-duration": `${duration}s`,
  } as CSSProperties;

  return (
    <DemoStage hint="カード/ボタンをクリック・タップ: 次の1枚へ">
      <div className={styles.wrap}>
        <div
          className={styles.deck}
          style={deckStyle}
          onClick={shuffle}
          role="presentation"
        >
          {deck.map((src, i) => {
            const isDropping = dropping && i === 0;
            // 送り出し中は後続を1段ずつ手前へ繰り上げる
            const depth = dropping ? i - 1 : i;
            const cardStyle: CSSProperties = isDropping
              ? {}
              : {
                  transform: `rotate(${ROTATION_SIGN[depth] * fan}deg) scale(${
                    1 - depth * scaleStep
                  })`,
                  zIndex: 3 - depth,
                  transition: reduce
                    ? "none"
                    : `transform ${duration}s cubic-bezier(0.4, 0, 0.2, 1) ${
                        depth * 0.1
                      }s`,
                };
            return (
              <img
                key={src}
                src={src}
                alt=""
                draggable={false}
                className={isDropping ? `${styles.card} ${styles.drop}` : styles.card}
                style={cardStyle}
              />
            );
          })}
        </div>
        <button className={styles.button} onClick={shuffle} aria-label="Next card">
          Shuffle
        </button>
      </div>
    </DemoStage>
  );
}

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
