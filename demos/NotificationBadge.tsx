"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./NotificationBadge.module.css";

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

const IDLE_WAIT = 2400; // この時間操作が無ければ自走に戻る
// 自走: 届く → もう1件届く → 居座って明滅 → 開いて既読 → 空のまま待つ
const AUTO_STEPS: { act: "arrive" | "read"; wait: number }[] = [
  { act: "arrive", wait: 1300 },
  { act: "arrive", wait: 2600 },
  { act: "read", wait: 1000 },
];

type Phase = "none" | "in" | "out";

export default function NotificationBadge({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const showCount = Math.round(params.style) === 1;

  const [count, setCount] = useState(0);
  const [shown, setShown] = useState(0); // 縮んで消えるあいだも前の件数を出しておく
  const [phase, setPhase] = useState<Phase>("none");
  const [seq, setSeq] = useState(0); // 出るたびに増やし、key でバッジを作り直して頭から再生させる
  const [bump, setBump] = useState(0); // 件数が増えるたびに A/B を入れ替えて弾みを再生させる

  const countRef = useRef(0);
  const reduceRef = useRef(reduce);
  const touchedRef = useRef(false);
  // 最後に操作された時刻はrAFのtimeからだけ確定させる(performance.nowはlintで落ちる)
  const lastInputRef = useRef(-Infinity);
  const nextAutoRef = useRef(0);
  const stepRef = useRef(0);

  useEffect(() => {
    reduceRef.current = reduce;
  }, [reduce]);

  const arrive = () => {
    const next = countRef.current + 1;
    countRef.current = next;
    setCount(next);
    setShown(next);
    if (next === 1) {
      setPhase("in");
      setSeq((n) => n + 1);
      setBump(0);
    } else {
      setBump((n) => n + 1);
    }
  };

  const read = () => {
    if (countRef.current === 0) return;
    countRef.current = 0;
    setCount(0);
    // reduced-motion では縮む演出が無いので animationend を待たずに消す
    setPhase(reduceRef.current ? "none" : "out");
  };

  const onArrive = () => {
    touchedRef.current = true;
    arrive();
  };

  const onRead = () => {
    touchedRef.current = true;
    read();
  };

  // 無操作のあいだは 届く→既読 を自走させる。録画のループ動画にも出入りが映る
  useEffect(() => {
    if (reduce) return;
    return addTick((time) => {
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInputRef.current = time;
        nextAutoRef.current = time + IDLE_WAIT;
        stepRef.current = countRef.current > 0 ? 2 : 0; // 点が残っていれば既読から再開
        return;
      }
      if (time - lastInputRef.current < IDLE_WAIT) return;
      if (time < nextAutoRef.current) return;
      const step = AUTO_STEPS[stepRef.current];
      if (step.act === "arrive") arrive();
      else read();
      stepRef.current = (stepRef.current + 1) % AUTO_STEPS.length;
      nextAutoRef.current = time + step.wait;
    });
  }, [reduce]);

  // 滑り出しの向きは観察元の (-8px, 12px) と同じ左下(アイコンの中心側)
  const vars = {
    "--nb-dur": `${params.duration}s`,
    "--nb-ease": `cubic-bezier(0.34, ${params.overshoot}, 0.64, 1)`,
    "--nb-dx": `${-params.offset * 0.55}px`,
    "--nb-dy": `${params.offset * 0.83}px`,
  } as CSSProperties;

  const bumpClass = bump === 0 ? "" : bump % 2 ? styles.bumpA : styles.bumpB;
  const label = showCount ? (shown > 99 ? "99+" : String(shown)) : "";

  return (
    <DemoStage hint="PC / スマホ: 「通知を受け取る」で点が付く → ベルを押すと既読になって消える(数秒触らなければ自動で繰り返す)">
      <div className={styles.field} style={vars}>
        <button
          type="button"
          className={styles.bell}
          aria-label={count > 0 ? `通知(未読${count}件)` : "通知"}
          onClick={onRead}
        >
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4.47 9.4C4.94 5.6 8.17 2.75 12 2.75s7.06 2.85 7.53 6.65l.69 5.6c.15 1.2-.78 2.25-1.98 2.25H5.76c-1.2 0-2.13-1.05-1.98-2.25l.69-5.6Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M9.5 20.25c.6.62 1.5 1 2.5 1s1.9-.38 2.5-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {phase !== "none" && (
            <span
              key={`badge-${seq}`}
              className={`${styles.badge} ${phase === "out" ? styles.out : ""}`}
              aria-hidden
              onAnimationEnd={(e) => {
                if (e.target === e.currentTarget && phase === "out") setPhase("none");
              }}
            >
              <span className={`${styles.bump} ${bumpClass}`}>
                <span className={`${styles.dot} ${showCount ? styles.count : ""}`}>{label}</span>
              </span>
            </span>
          )}
        </button>
        <button type="button" className={styles.send} onClick={onArrive}>
          通知を受け取る
        </button>
      </div>
    </DemoStage>
  );
}
