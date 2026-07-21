"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ConfettiBurst.module.css";

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

// ライム基調のブランド配色。破片ごとに1色を割り当てる
const COLORS = ["var(--ai)", "var(--ai-pale)", "var(--code-fg)", "var(--sumi-soft)"];

type Piece = { dx: number; dy: number; rot: number; color: string; delay: number };
type Burst = { id: number; pieces: Piece[]; duration: number };

// 1発分の破片を生成。角度と距離を散らし、gravityで縦に落下量を足す
function makePieces(count: number, spread: number, gravity: number): Piece[] {
  const pieces: Piece[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = spread * (0.5 + Math.random() * 0.5);
    const dx = Math.cos(angle) * dist;
    // 縦成分に「打ち上げ」ぶんの上向きと、gravityに比例した落下量を足す
    const dy = Math.sin(angle) * dist + gravity * spread * (0.4 + Math.random() * 0.6);
    pieces.push({
      dx,
      dy,
      rot: (Math.random() - 0.5) * 720,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.08,
    });
  }
  return pieces;
}

export default function ConfettiBurst({ params }: { params: ParamValues }) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [flashes, setFlashes] = useState<number[]>([]);
  const idRef = useRef(0);
  const reduce = useReducedMotion();

  const count = Math.round(params.count);
  const spread = params.spread;
  const duration = params.duration;
  const gravity = params.gravity;

  // クリックで1発。連打は前の破片を消さず重ねる
  const fire = () => {
    const id = ++idRef.current;
    if (reduce) {
      // reduced-motion: 破片を飛ばさず、位置の動かない色のパルスで返す
      setFlashes((fs) => [...fs, id]);
      return;
    }
    setBursts((bs) => [
      ...bs,
      { id, pieces: makePieces(count, spread, gravity), duration },
    ]);
  };

  const pieceStyle = (p: Piece, duration: number): CSSProperties =>
    ({
      background: p.color,
      animationDuration: `${duration}s`,
      animationDelay: `${p.delay}s`,
      "--dx": `${p.dx.toFixed(1)}px`,
      "--dy": `${p.dy.toFixed(1)}px`,
      "--rot": `${p.rot.toFixed(0)}deg`,
    }) as CSSProperties;

  return (
    <DemoStage hint="PC: ボタンをクリック / スマホ: タップ(連打で重なる)">
      <div className={styles.field}>
        <button className={styles.button} onPointerDown={fire}>
          <span className={styles.label}>Celebrate</span>
          {flashes.map((id) => (
            <span
              key={id}
              className={styles.flash}
              onAnimationEnd={() =>
                setFlashes((fs) => fs.filter((x) => x !== id))
              }
              aria-hidden
            />
          ))}
        </button>

        {/* 破片は中央のこの点を原点に飛ぶ。原点自身の尺で1発ごとDOMから削除する
            (子破片のanimationendはバブリングで来るので target で弾く) */}
        {bursts.map((b) => (
          <span
            key={b.id}
            className={styles.origin}
            aria-hidden
            style={{ animationDuration: `${(b.duration + 0.2).toFixed(2)}s` }}
            onAnimationEnd={(e) => {
              if (e.target !== e.currentTarget) return;
              setBursts((bs) => bs.filter((x) => x.id !== b.id));
            }}
          >
            {b.pieces.map((p, i) => (
              <span
                key={i}
                className={styles.piece}
                style={pieceStyle(p, b.duration)}
              />
            ))}
          </span>
        ))}
      </div>
    </DemoStage>
  );
}
