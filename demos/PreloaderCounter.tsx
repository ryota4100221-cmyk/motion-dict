"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./PreloaderCounter.module.css";

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

export default function PreloaderCounter({ params }: { params: ParamValues }) {
  const numRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const runRef = useRef({ running: false, start: 0 });
  const paramsRef = useRef(params);
  const playRef = useRef<() => void>(() => {});
  const reduce = useReducedMotion();

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    const start = () => {
      // reduced-motion時はプリローダーを出さず本編を見せたままにする
      if (reduce) return;
      setBusy(true);
      setOpen(false); // カーテンはtransitionなしで即座に閉じ直す
      if (numRef.current) numRef.current.textContent = "0";
      timers.push(
        // 閉じた状態が描画されてからカウント開始
        setTimeout(() => {
          runRef.current = { running: true, start: performance.now() };
        }, 60)
      );
    };
    playRef.current = start;

    const removeTick = addTick((time) => {
      const run = runRef.current;
      const el = numRef.current;
      if (!run.running || !el) return;
      const p = paramsRef.current;
      const t = Math.min((time - run.start) / (p.duration * 1000), 1);
      // expo-out: 序盤に駆け上がり、100手前で減速して着地する
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      el.textContent = String(Math.round(eased * 100));
      if (t >= 1) {
        run.running = false;
        el.textContent = "100";
        setOpen(true); // 100到達と同時に幕開け
        timers.push(
          setTimeout(
            () => setBusy(false),
            paramsRef.current.curtain * 1000 + 150
          )
        );
      }
    });

    // 初回表示時に1度だけ自動再生してデモの内容を伝える
    const kickoff = setTimeout(start, 500);

    return () => {
      clearTimeout(kickoff);
      removeTick();
      timers.forEach(clearTimeout);
      runRef.current.running = false;
    };
  }, [reduce]);

  const curtainStyle: CSSProperties = reduce
    ? { transform: "translateY(-101%)" }
    : {
        transform: open ? "translateY(-101%)" : "translateY(0)",
        // 幕開けのみtransition。リプレイ時の閉じ直しは瞬時に戻す
        transition: open
          ? `transform ${params.curtain}s cubic-bezier(0.76, 0, 0.24, 1)`
          : "none",
      };

  return (
    <DemoStage hint="Play: プリローダーを再生">
      <div className={styles.frame}>
        <span className={styles.content}>Welcome</span>
        <div className={styles.curtain} style={curtainStyle} aria-hidden>
          <span className={styles.count}>
            <span ref={numRef}>0</span>
            <span className={styles.unit}>%</span>
          </span>
        </div>
      </div>
      <button
        className={styles.playBtn}
        onClick={() => playRef.current()}
        disabled={busy || reduce}
      >
        Play
      </button>
    </DemoStage>
  );
}
