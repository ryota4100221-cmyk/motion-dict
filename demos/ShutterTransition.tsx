"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ShutterTransition.module.css";

// content/shutter-transition.ts の orientation options と同順(スリットの向き)
const ORIENTATIONS = ["vertical", "horizontal"] as const;

const SLAT_DURATION = 0.5; // 1本の帯が開き切るまでの時間(s)

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

export default function ShutterTransition({ params }: { params: ParamValues }) {
  const [page, setPage] = useState<"A" | "B">("A");
  const [covered, setCovered] = useState(false);
  const [snap, setSnap] = useState(false); // リセット時にtransitionを切るフラグ
  const [busy, setBusy] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const orientation =
    ORIENTATIONS[Math.round(params.orientation)] ?? "vertical";
  const axis = orientation === "vertical" ? "scaleX" : "scaleY";
  const panels = Math.round(params.panels);
  const stagger = Math.round(params.stagger);
  const next = page === "A" ? "B" : "A";
  // 全帯が開き切るまでの時間(最後の帯の delay + 帯1本分)
  const totalMs = SLAT_DURATION * 1000 + (panels - 1) * stagger;

  const play = () => {
    if (busy) return;
    // reduced-motion: 帯を出さず即座にページ切り替え
    if (reduce) {
      setPage((p) => (p === "A" ? "B" : "A"));
      return;
    }
    setBusy(true);
    setCovered(true);
    timersRef.current.push(
      // 開き切った瞬間にベースを差し替え、帯はtransitionなしで畳み直す
      setTimeout(() => {
        setPage((p) => (p === "A" ? "B" : "A"));
        setSnap(true);
        setCovered(false);
      }, totalMs + 60),
      setTimeout(() => {
        setSnap(false);
        setBusy(false);
      }, totalMs + 160)
    );
  };

  // 各帯: origin centerのままscale 0→1で「開く」。i本目はstagger分遅れる
  const panelStyle = (i: number): CSSProperties => ({
    transform: covered ? `${axis}(1)` : `${axis}(0)`,
    transition: snap
      ? "none"
      : `transform ${SLAT_DURATION}s cubic-bezier(0.77, 0, 0.175, 1) ${
          i * stagger
        }ms`,
  });

  // 次ページのラベルは帯がほぼ開き切ったタイミングでフェードイン
  const nextLabelStyle: CSSProperties = {
    opacity: covered ? 1 : 0,
    transition: snap
      ? "none"
      : `opacity 0.3s ease ${covered ? Math.max(0, totalMs - 250) : 0}ms`,
  };

  return (
    <DemoStage hint="PLAY: ページ遷移を再生">
      <div className={styles.pageFrame}>
        <div
          className={page === "B" ? `${styles.face} ${styles.faceB}` : styles.face}
        >
          <span className={page === "B" ? styles.labelB : styles.label}>
            PAGE {page}
          </span>
        </div>
        <div
          className={
            orientation === "horizontal"
              ? `${styles.panels} ${styles.panelsH}`
              : styles.panels
          }
          aria-hidden
        >
          {Array.from({ length: panels }, (_, i) => (
            <span
              key={i}
              className={next === "B" ? `${styles.panel} ${styles.panelB}` : styles.panel}
              style={panelStyle(i)}
            />
          ))}
        </div>
        <div className={styles.nextLabel} style={nextLabelStyle} aria-hidden>
          <span className={next === "B" ? styles.labelB : styles.label}>
            PAGE {next}
          </span>
        </div>
      </div>
      <button className={styles.playBtn} onClick={play} disabled={busy}>
        PLAY
      </button>
    </DemoStage>
  );
}
