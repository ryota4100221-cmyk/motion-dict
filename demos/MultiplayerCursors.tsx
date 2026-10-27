"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./MultiplayerCursors.module.css";

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

type Tool = "arrow" | "pen" | "comment" | "text";

// 道具の絵は puture.co.kr の cursor-cta と同じ 20×20 のパス
const TOOL_PATH: Record<Exclude<Tool, "text">, string> = {
  arrow: "M2.5 2.5l13.5 6.8-5.8 1.6-2.7 5.6z",
  pen: "M3 17l2.2-6.6 7.4-7.4 4.4 4.4-7.4 7.4zM3 17l4.4-4.4",
  comment: "M3 3.5h14v10H9.5L5 17.5v-4H3z",
};

function ToolIcon({ tool }: { tool: Tool }) {
  if (tool === "text") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden>
        <path d="M7 3h6M10 3v14M7 17h6" fill="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" aria-hidden>
      <path d={TOOL_PATH[tool]} />
    </svg>
  );
}

type Peer = {
  name: string;
  tools: Tool[];
  lines: string[];
  at: { x: number; y: number }; // 舞台に対する位置(%)
  tone: "ai" | "paper";
};

const PEERS: Peer[] = [
  {
    name: "Editor",
    tools: ["arrow", "pen", "comment", "text"],
    lines: ["Tighten this lede?", "Plate 09 reads well.", "Adding alias: ふわっと", "Check the easing value."],
    at: { x: 56, y: 40 },
    tone: "ai",
  },
  {
    name: "Proofreader",
    tools: ["comment", "arrow", "text", "pen"],
    lines: ["Typo in line 3.", "Duration says 0.45s.", "Approved for Folio 12."],
    at: { x: 22, y: 66 },
    tone: "paper",
  },
];

export default function MultiplayerCursors({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  // 半周期ごとに1つ進め、偶数番は Editor・奇数番は Proofreader の発言を入れ替える
  const [tick, setTick] = useState(0);
  // 押したら数え直す(押した直後に次の半周期を待ち直す)
  const [kick, setKick] = useState(0);
  const interval = params.interval;

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setTick((n) => n + 1), (interval * 1000) / 2);
    return () => window.clearInterval(id);
  }, [reduce, interval, kick]);

  const vars = {
    "--mc-drift": `${params.drift}px`,
    "--mc-drift-dur": `${params.driftDuration}s`,
    "--mc-say": `${interval}s`,
    "--mc-pop": `${params.pop}s`,
  } as CSSProperties;

  return (
    <DemoStage hint="操作不要(自動で発言と道具が入れ替わる) / PC: クリック・スマホ: タップで次の発言へ">
      <div
        className={styles.canvas}
        style={vars}
        data-md-bleed=""
        onPointerDown={() => {
          if (reduce) return;
          setTick((n) => n + 1);
          setKick((n) => n + 1);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.photo} src="/motion-dict/demo/photo-09.jpg" alt="" draggable={false} />
        <p className={styles.presence} aria-hidden>
          <span className={styles.dotAi} />
          <span className={styles.dotPaper} />
          Plate 09 — 2 editing
        </p>
        {PEERS.map((peer, p) => {
          // Editor は奇数番(1,3,5…)、Proofreader は偶数番(2,4,6…)で進む＝半周期ずれて交互に話す。
          // Proofreader は最初の番が来るまで黙っている
          const count = p === 0 ? Math.floor((tick + 1) / 2) : Math.max(0, Math.floor(tick / 2) - 1);
          const speaking = reduce || p === 0 || tick >= 2;
          const line = peer.lines[count % peer.lines.length];
          const tool = peer.tools[count % peer.tools.length];
          return (
            <span
              key={peer.name}
              className={styles.cursor}
              data-tone={peer.tone}
              style={{ left: `${peer.at.x}%`, top: `${peer.at.y}%`, animationDelay: `${-p * 1.7}s` }}
              aria-hidden
            >
              {speaking && (
                <span key={`${peer.name}-line-${count}`} className={styles.bubble}>
                  {line}
                </span>
              )}
              <span key={`${peer.name}-tool-${count}`} className={styles.tool} data-tool={tool}>
                <ToolIcon tool={tool} />
              </span>
              <span className={styles.name}>{peer.name}</span>
            </span>
          );
        })}
      </div>
    </DemoStage>
  );
}
