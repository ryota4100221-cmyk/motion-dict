"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./LoadingBar.module.css";

// 90%到達後、実処理の完了通知を待っている想定の時間
const HOLD_MS = 600;
// 完了フィル(0.2s)+フェードアウト(0.25s delay + 0.3s)の後始末余裕
const FINISH_MS = 800;

const LABELS = {
  idle: "STANDBY",
  loading: "LOADING",
  done: "PAGE READY",
} as const;

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

export default function LoadingBar({ params }: { params: ParamValues }) {
  const barRef = useRef<HTMLSpanElement>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<keyof typeof LABELS>("idle");
  const runRef = useRef({ running: false, start: 0 });
  const paramsRef = useRef(params);
  const playRef = useRef<() => void>(() => {});
  const reduce = useReducedMotion();

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // 実処理の完了通知が来た想定: 残りを一気に進めてからフェードで畳む
    const finish = () => {
      bar.style.transition = "transform 0.2s ease-out, opacity 0.3s ease 0.25s";
      bar.style.transform = "scaleX(1)";
      bar.style.opacity = "0";
      setPhase("done");
      timers.push(setTimeout(() => setBusy(false), FINISH_MS));
    };

    const start = () => {
      // reduced-motion時はバー演出なしで完了状態を即表示
      if (reduce) {
        setPhase("done");
        return;
      }
      setBusy(true);
      setPhase("loading");
      bar.style.transition = "none";
      bar.style.opacity = "1";
      bar.style.transform = "scaleX(0)";
      runRef.current = { running: true, start: performance.now() };
    };
    playRef.current = start;

    const removeTick = addTick((time) => {
      const run = runRef.current;
      if (!run.running) return;
      const p = paramsRef.current;
      const t = Math.min((time - run.start) / (p.duration * 1000), 1);
      // expo-out: 序盤に速く進み、90%手前で減速して待機(進んでいるふり)
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      bar.style.transform = `scaleX(${0.9 * eased})`;
      if (t >= 1) {
        run.running = false;
        timers.push(setTimeout(finish, HOLD_MS));
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

  return (
    <DemoStage hint="PLAY: 読み込みを再生">
      <div className={styles.frame}>
        <span
          ref={barRef}
          className={styles.bar}
          style={{ height: `${Math.round(params.height)}px` }}
          aria-hidden
        />
        <span
          className={
            phase === "done" ? `${styles.label} ${styles.done}` : styles.label
          }
        >
          {LABELS[phase]}
        </span>
      </div>
      <button
        className={styles.playBtn}
        onClick={() => playRef.current()}
        disabled={busy}
      >
        PLAY
      </button>
    </DemoStage>
  );
}
