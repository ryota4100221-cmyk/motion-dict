"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./StatefulButton.module.css";

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

type Phase = "idle" | "loading" | "success";

const IDLE_WAIT = 1600; // idleに戻ってからこの時間押されなければ自走で押す

export default function StatefulButton({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  // 状態が変わるたびに増やし、中身の key に使ってアニメを頭から再生させる
  const [run, setRun] = useState(0);

  const phaseRef = useRef<Phase>("idle");
  const clickedRef = useRef(false);
  // 遷移の期限はrAFのtimeからだけ確定させる(performance.nowはlintで落ちる)
  const untilRef = useRef(-1);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const go = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
    setRun((n) => n + 1);
  };

  // idle 以外のクリックは捨てる(=二重送信させない)
  const onClick = () => {
    if (phaseRef.current === "idle") clickedRef.current = true;
  };

  useEffect(() => {
    return addTick((time) => {
      const p = paramsRef.current;
      if (untilRef.current < 0) untilRef.current = time + IDLE_WAIT;
      const cur = phaseRef.current;
      if (cur === "idle") {
        // reduced-motion では自走しない(押したときだけ遷移する)
        const auto = !reduce && time >= untilRef.current;
        if (!clickedRef.current && !auto) return;
        clickedRef.current = false;
        go("loading");
        untilRef.current = time + p.loadingTime * 1000;
      } else if (time >= untilRef.current) {
        if (cur === "loading") {
          go("success");
          untilRef.current = time + p.holdTime * 1000;
        } else {
          go("idle");
          untilRef.current = time + IDLE_WAIT;
        }
      }
    });
  }, [reduce]);

  const vars = {
    "--check": `${params.checkDuration}s`,
    "--rise": `${params.rise}px`,
  } as CSSProperties;

  return (
    <DemoStage hint="PC: ボタンをクリック / スマホ: タップ(処理中・完了表示中は押しても反応しない)">
      <div className={styles.wrap} style={vars}>
        <button
          type="button"
          className={styles.btn}
          data-phase={phase}
          aria-disabled={phase !== "idle"}
          aria-busy={phase === "loading"}
          onClick={onClick}
        >
          {phase === "idle" && (
            <span key={`label-${run}`} className={styles.label}>
              送信する
            </span>
          )}
          {phase === "loading" &&
            (reduce ? (
              <span key={`busy-${run}`} className={styles.label}>
                送信中…
              </span>
            ) : (
              <svg key={`spin-${run}`} className={styles.spinner} viewBox="0 0 50 50" aria-hidden>
                <circle cx="25" cy="25" r="20" />
              </svg>
            ))}
          {phase === "success" && (
            <span key={`check-${run}`} className={styles.checkWrap} aria-hidden>
              <svg className={styles.check} viewBox="0 0 24 24">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
          )}
        </button>
        <p className={styles.live} aria-live="polite">
          {phase === "loading" ? "送信中" : phase === "success" ? "送信しました" : ""}
        </p>
        <p className={styles.caption} aria-hidden>
          {phase === "idle" ? "idle" : phase === "loading" ? "loading" : "success"}
        </p>
      </div>
    </DemoStage>
  );
}
