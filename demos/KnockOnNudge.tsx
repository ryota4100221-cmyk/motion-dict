"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./KnockOnNudge.module.css";

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

// 先頭が突き手、残りが順に押される側
const TABS = ["Index", "Glossary", "Folio", "Plate", "Colophon"];

// 出典(stevenatallah.com の nudge-push / nudge-receive)を distance=8px で割った比。
// 突き手：40% で身を引き(-8)、50% で前へ(+6)、70% で余韻(+2)
const PUSH = [
  [0, 0],
  [0.4, -1],
  [0.5, 0.75],
  [0.7, 0.25],
  [1, 0],
] as const;
// 押される側：30% までは止まったまま、50% で押し出され(+8)、70% で戻りかけ(+3)
const RECEIVE = [
  [0, 0],
  [0.3, 0],
  [0.5, 1],
  [0.7, 0.375],
  [1, 0],
] as const;

export default function KnockOnNudge({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const { distance, duration, relay, interval } = params;
  const rowRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  // CSS の animation-timing-function と同じく、緩急は区間ごと(各フレームに ease-out)
  const knock = useCallback(() => {
    const row = rowRef.current; // 毎回引き直す
    if (!row) return;
    const tabs = Array.from(row.children) as HTMLElement[];
    tabs.forEach((el, i) => {
      el.getAnimations().forEach((a) => a.cancel());
      const table = i === 0 ? PUSH : RECEIVE;
      el.animate(
        table.map(([offset, k]) => ({
          offset,
          transform: `translateX(${(distance * k).toFixed(2)}px)`,
          easing: "ease-out",
        })),
        { duration: duration * 1000, delay: i * relay * 1000 }
      );
    });
  }, [distance, duration, relay]);

  // interval 秒ごとに自動で突く。ボタンで突いたら、そこから数え直す
  const schedule = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(knock, interval * 1000);
  }, [knock, interval]);

  useEffect(() => {
    if (reduce) return;
    const first = window.setTimeout(knock, 300);
    schedule();
    return () => {
      window.clearTimeout(first);
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [reduce, knock, schedule]);

  const onKnock = () => {
    if (reduce) return;
    knock();
    schedule();
  };

  return (
    <DemoStage
      hint={`${interval}秒ごとに自動で突く / PC: Knock again をクリック / スマホ: タップ`}
      className={styles.knockStage}
    >
      <div className={styles.caption}>
        <p className={styles.folio}>Folio 07 · Knock-on nudge</p>
        <p className={styles.sub}>コツン。先頭の勢いが隣へ伝わる</p>
      </div>

      <div className={styles.row} ref={rowRef}>
        {TABS.map((t, i) => (
          <span key={t} className={i === 0 ? `${styles.tab} ${styles.striker}` : styles.tab}>
            {i === 0 && <i className={styles.mark} aria-hidden />}
            {t}
          </span>
        ))}
      </div>

      <button type="button" className={styles.again} onClick={onKnock} disabled={reduce}>
        Knock again
      </button>
    </DemoStage>
  );
}
