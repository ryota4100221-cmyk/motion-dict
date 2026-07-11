"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./SplitScreen.module.css";

// content/split-screen.ts の axis options と同順(割れる方向)
const AXES = ["vertical", "horizontal"] as const;

const EASE = "cubic-bezier(0.77, 0, 0.175, 1)";

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

export default function SplitScreen({ params }: { params: ParamValues }) {
  const [page, setPage] = useState<"A" | "B">("A");
  // idle: パネルは画面外 / cover: パネルが覆う(snap) / open: パネルが割れて逃げる
  const [phase, setPhase] = useState<"idle" | "cover" | "open">("idle");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const axis = AXES[Math.round(params.axis)] ?? "vertical";
  const vertical = axis === "vertical";
  const next = page === "A" ? "B" : "A";
  const totalMs = params.duration * 1000;

  const play = () => {
    if (phase !== "idle") return;
    // reduced-motion: 割らずに即座にページ切り替え
    if (reduce) {
      setPage((p) => (p === "A" ? "B" : "A"));
      return;
    }
    // 同一コミットで「ベース=次ページ・パネル=現ページで覆う」に切り替わるためチラつかない
    setPhase("cover");
    timersRef.current.push(
      // 1フレーム置いてからtransition付きで±101%へ割る
      setTimeout(() => setPhase("open"), 40),
      setTimeout(() => {
        setPage((p) => (p === "A" ? "B" : "A"));
        setPhase("idle");
      }, totalMs + 140)
    );
  };

  // ベースはidle中のみ現ページ、遷移中は割れ目から覗く次ページ
  const baseLabel = phase === "idle" ? page : next;

  // パネル2枚の外枠と、中に入れる元ページ全体の配置(継ぎ目で絵が繋がるようにずらす)
  const panelGeo: [CSSProperties, CSSProperties] = vertical
    ? [
        { top: 0, left: 0, right: 0, height: "50%" },
        { bottom: 0, left: 0, right: 0, height: "50%" },
      ]
    : [
        { top: 0, bottom: 0, left: 0, width: "50%" },
        { top: 0, bottom: 0, right: 0, width: "50%" },
      ];
  const innerGeo: [CSSProperties, CSSProperties] = vertical
    ? [
        { width: "100%", height: "200%", top: 0, left: 0 },
        { width: "100%", height: "200%", bottom: 0, left: 0 },
      ]
    : [
        { width: "200%", height: "100%", top: 0, left: 0 },
        { width: "200%", height: "100%", top: 0, right: 0 },
      ];
  const out = (sign: 1 | -1) =>
    vertical ? `translateY(${sign * 101}%)` : `translateX(${sign * 101}%)`;

  const panelStyle = (i: 0 | 1): CSSProperties => ({
    ...panelGeo[i],
    transform: phase === "cover" ? "none" : out(i === 0 ? -1 : 1),
    transition: phase === "open" ? `transform ${params.duration}s ${EASE}` : "none",
  });

  return (
    <DemoStage hint="クリック / タップ: 画面が割れて遷移">
      <div className={styles.pageFrame} onClick={play}>
        <div
          className={
            baseLabel === "B" ? `${styles.face} ${styles.faceB}` : styles.face
          }
        >
          <span className={baseLabel === "B" ? styles.labelB : styles.label}>
            Page {baseLabel}
          </span>
        </div>
        {([0, 1] as const).map((i) => (
          <div key={i} className={styles.panel} style={panelStyle(i)} aria-hidden>
            <div
              className={
                page === "B" ? `${styles.inner} ${styles.innerB}` : styles.inner
              }
              style={innerGeo[i]}
            >
              <span className={page === "B" ? styles.labelB : styles.label}>
                Page {page}
              </span>
            </div>
          </div>
        ))}
      </div>
    </DemoStage>
  );
}
