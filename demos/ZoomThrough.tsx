"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MouseEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ZoomThrough.module.css";

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

export default function ZoomThrough({ params }: { params: ParamValues }) {
  const [page, setPage] = useState<"A" | "B">("A");
  const [busy, setBusy] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => () => animRef.current?.cancel(), []);

  const play = (e: MouseEvent<HTMLButtonElement>) => {
    if (busy) return;
    // reduced-motion: ズームせず即座にページ切り替え
    if (reduce) {
      setPage((p) => (p === "A" ? "B" : "A"));
      return;
    }
    const el = topRef.current;
    if (!el) return;

    // クリックしたタイルの中心をフレーム内%に変換し、transform-originに据える
    const frame = el.getBoundingClientRect();
    const tile = e.currentTarget.getBoundingClientRect();
    const x = ((tile.left + tile.width / 2 - frame.left) / frame.width) * 100;
    const y = ((tile.top + tile.height / 2 - frame.top) / frame.height) * 100;
    el.style.transformOrigin = `${x}% ${y}%`;

    setBusy(true);
    const zoom = params.zoom;
    // 前半は不透過のまま加速し、後半でフェードして下のページへ抜ける
    const anim = el.animate(
      [
        { transform: "scale(1)", opacity: 1 },
        { transform: `scale(${1 + (zoom - 1) * 0.5})`, opacity: 1, offset: 0.5 },
        { transform: `scale(${zoom})`, opacity: 0 },
      ],
      {
        duration: params.duration * 1000,
        easing: "cubic-bezier(0.4, 0, 1, 1)",
        fill: "forwards",
      }
    );
    animRef.current = anim;
    anim.onfinish = () => {
      // ベースを差し替えてからfillを解除→上のレイヤーは静止状態へ戻る
      setPage((p) => (p === "A" ? "B" : "A"));
      anim.cancel();
      setBusy(false);
    };
  };

  const next = page === "A" ? "B" : "A";

  // 上=現在ページ(クリック可)、下=次ページ(遷移の抜け先)
  const face = (p: "A" | "B", top: boolean) => (
    <div
      ref={top ? topRef : undefined}
      className={[
        styles.face,
        p === "B" ? styles.faceB : "",
        top ? styles.top : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={p === "B" ? styles.labelB : styles.label}>PAGE {p}</span>
      <div className={styles.tiles}>
        {[0, 1].map((i) => (
          <button
            key={i}
            className={p === "B" ? `${styles.tile} ${styles.tileB}` : styles.tile}
            onClick={top ? play : undefined}
            tabIndex={top ? 0 : -1}
            disabled={top && busy}
            aria-label={`タイル${i + 1}へズームして遷移`}
          >
            {String(i + 1).padStart(2, "0")}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <DemoStage hint="クリック / タップ: タイルへズームして遷移">
      <div className={styles.pageFrame}>
        {face(next, false)}
        {face(page, true)}
      </div>
    </DemoStage>
  );
}
