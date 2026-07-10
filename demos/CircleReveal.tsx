"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MouseEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./CircleReveal.module.css";

// content/circle-reveal.ts の origin options と同順(円の発火原点)
const ORIGINS = ["click", "center", "top-left", "bottom-right"] as const;

// プリセット原点のフレーム内座標(%)。click時はクリック位置から都度計算する
const ORIGIN_POINTS: Record<string, { x: number; y: number }> = {
  center: { x: 50, y: 50 },
  "top-left": { x: 0, y: 0 },
  "bottom-right": { x: 100, y: 100 },
};

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

export default function CircleReveal({ params }: { params: ParamValues }) {
  const [page, setPage] = useState<"A" | "B">("A");
  const [busy, setBusy] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => () => animRef.current?.cancel(), []);

  const play = (e: MouseEvent<HTMLDivElement>) => {
    if (busy) return;
    // reduced-motion: 円を出さず即座にページ切り替え
    if (reduce) {
      setPage((p) => (p === "A" ? "B" : "A"));
      return;
    }
    const el = overlayRef.current;
    if (!el) return;

    const origin = ORIGINS[Math.round(params.origin)] ?? "click";
    let { x, y } = ORIGIN_POINTS[origin] ?? { x: 50, y: 50 };
    if (origin === "click") {
      // クリック座標をフレーム内の%へ変換(タップも同じclickイベントで拾う)
      const rect = e.currentTarget.getBoundingClientRect();
      x = ((e.clientX - rect.left) / rect.width) * 100;
      y = ((e.clientY - rect.top) / rect.height) * 100;
    }

    setBusy(true);
    // 半径150%: 原点が四隅でも対角まで届く安全値。fill:forwardsで覆い切りを保持
    const anim = el.animate(
      [
        { clipPath: `circle(0% at ${x}% ${y}%)` },
        { clipPath: `circle(150% at ${x}% ${y}%)` },
      ],
      {
        duration: params.duration * 1000,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "forwards",
      }
    );
    animRef.current = anim;
    anim.onfinish = () => {
      // ベースを差し替えてからfillを解除→オーバーレイは静止状態(circle 0%)へ戻る
      // どちらも同期的に行われ、次のpaint前に反映されるためチラつかない
      setPage((p) => (p === "A" ? "B" : "A"));
      anim.cancel();
      setBusy(false);
    };
  };

  const next = page === "A" ? "B" : "A";

  return (
    <DemoStage hint="クリック / タップ: その地点から円形に遷移">
      <div className={styles.pageFrame} onClick={play}>
        <div
          className={page === "B" ? `${styles.face} ${styles.faceB}` : styles.face}
        >
          <span className={page === "B" ? styles.labelB : styles.label}>
            Page {page}
          </span>
        </div>
        <div
          ref={overlayRef}
          className={
            next === "B"
              ? `${styles.face} ${styles.faceB} ${styles.overlay}`
              : `${styles.face} ${styles.overlay}`
          }
          aria-hidden
        >
          <span className={next === "B" ? styles.labelB : styles.label}>
            Page {next}
          </span>
        </div>
      </div>
    </DemoStage>
  );
}
