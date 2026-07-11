"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./LineDraw.module.css";

// content/line-draw.ts の easing options と同順(CSSのtransition-timing-function値)
const EASINGS = ["ease-in-out", "ease-out", "linear"] as const;

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

export default function LineDraw({ params }: { params: ParamValues }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paramsRef = useRef(params);
  const playRef = useRef<() => void>(() => {});
  const reduce = useReducedMotion();

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  // 描画リプレイ。dasharray/dashoffsetに実測全長を入れて不可視化→offsetを0へ戻す
  // reduced-motion時は何もしない=描画済みの初期状態のまま
  const play = () => {
    const svg = svgRef.current;
    if (!svg || reduce) return;
    const p = paramsRef.current;
    const easing = EASINGS[Math.round(p.easing)] ?? "ease-in-out";
    const paths = Array.from(svg.querySelectorAll<SVGPathElement>("path"));

    for (const el of paths) {
      const len = el.getTotalLength();
      el.style.transition = "none";
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = `${len}`;
    }
    // リフローを1度挟んで「全消し」の状態を確定させてからtransitionを張る
    void svg.getBoundingClientRect();
    paths.forEach((el, i) => {
      el.style.transition = `stroke-dashoffset ${p.duration}s ${easing} ${(i * p.stagger).toFixed(2)}s`;
      el.style.strokeDashoffset = "0";
    });

    setBusy(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(
      () => setBusy(false),
      (p.duration + p.stagger * (paths.length - 1)) * 1000
    );
  };

  // 最新のplayをrefに保持(kickoff効果から呼ぶため。レンダー中のref更新は禁止なので効果内で)
  useEffect(() => {
    playRef.current = play;
  });

  useEffect(() => {
    // 初回表示時に1度だけ自動再生してデモの内容を伝える
    const kickoff = setTimeout(() => playRef.current(), 500);
    return () => {
      clearTimeout(kickoff);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <DemoStage hint="Replay: 描画をもう一度再生">
      {/* 奥の稜線 → 手前の稜線 → 太陽 の順に一筆書きされる */}
      <svg ref={svgRef} viewBox="0 0 260 120" className={styles.svg} aria-hidden>
        <path
          className={styles.ridgeBack}
          d="M 6 92 C 40 60 70 82 96 52 C 122 24 152 68 184 46 C 208 30 232 60 254 42"
        />
        <path
          className={styles.ridgeFront}
          d="M 6 106 L 58 50 L 92 82 L 138 30 L 178 90 L 224 46 L 254 72"
        />
        <path className={styles.sun} d="M 212 16 a 11 11 0 1 1 -0.1 0" />
      </svg>
      <button
        className={styles.playBtn}
        onClick={play}
        disabled={busy}
      >
        Replay
      </button>
    </DemoStage>
  );
}
