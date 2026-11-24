"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./BlossomBloom.module.css";

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

// 枝(viewBox 640×360)。3次ベジェ1本ずつ。[始点, 制御点1, 制御点2, 終点]
type Pt = [number, number];
const BRANCHES: [Pt, Pt, Pt, Pt][] = [
  [[-20, 330], [150, 300], [300, 230], [420, 170]], // 幹
  [[420, 170], [500, 130], [560, 90], [660, 70]], // 幹の先
  [[190, 278], [200, 220], [180, 170], [215, 112]], // 左の小枝
  [[330, 210], [380, 240], [440, 260], [520, 262]], // 下へ垂れる小枝
  [[470, 140], [480, 100], [510, 60], [545, 28]], // 上の小枝
];

const bez = (b: [Pt, Pt, Pt, Pt], t: number): Pt => {
  const u = 1 - t;
  const f = (k: 0 | 1) =>
    u * u * u * b[0][k] + 3 * u * u * t * b[1][k] + 3 * u * t * t * b[2][k] + t * t * t * b[3][k];
  return [f(0), f(1)];
};

const tangentDeg = (b: [Pt, Pt, Pt, Pt], t: number) => {
  const a = bez(b, Math.max(0, t - 0.01));
  const c = bez(b, Math.min(1, t + 0.01));
  return (Math.atan2(c[1] - a[1], c[0] - a[0]) * 180) / Math.PI;
};

// 付け根: [枝, 枝上の位置 t, 花の大きさ(半径 px), 枝のどちら側か(1 / -1), 花を付けるか]
const NODES: [number, number, number, 1 | -1, boolean][] = [
  [0, 0.18, 17, -1, true],
  [0, 0.3, 14, 1, false],
  [0, 0.42, 19, 1, true],
  [0, 0.55, 15, -1, true],
  [0, 0.7, 20, 1, true],
  [0, 0.86, 16, -1, true],
  [1, 0.12, 15, 1, false],
  [1, 0.3, 18, -1, true],
  [1, 0.55, 17, 1, true],
  [1, 0.8, 14, -1, true],
  [2, 0.3, 15, 1, true],
  [2, 0.55, 13, -1, false],
  [2, 0.75, 18, -1, true],
  [2, 0.98, 16, 1, true],
  [3, 0.42, 16, 1, true],
  [3, 0.64, 18, -1, true],
  [3, 0.85, 15, 1, true],
  [3, 0.97, 12, -1, false],
  [4, 0.35, 15, -1, true],
  [4, 0.65, 17, 1, true],
  [4, 0.97, 13, -1, false],
];

const branchPath = (b: [Pt, Pt, Pt, Pt]) =>
  `M${b[0][0]} ${b[0][1]}C${b[1][0]} ${b[1][1]} ${b[2][0]} ${b[2][1]} ${b[3][0]} ${b[3][1]}`;

// 花びら1枚(付け根の向き = 上)。先に浅い切れ込みのある桜の形。中心(0,0)から上へ長さ r
const petal = (r: number) =>
  `M0 0C${-r * 0.55} ${-r * 0.3} ${-r * 0.5} ${-r * 0.95} ${-r * 0.12} ${-r}L0 ${-r * 0.86}L${r * 0.12} ${-r}C${r * 0.5} ${-r * 0.95} ${r * 0.55} ${-r * 0.3} 0 0Z`;

// つぼみ(付け根(0,0)から上へ伸びるしずく形)
const bud = (r: number) => {
  const h = r * 0.95;
  const w = r * 0.32;
  return `M0 0C${-w} ${-h * 0.25} ${-w} ${-h * 0.75} 0 ${-h}C${w} ${-h * 0.75} ${w} ${-h * 0.25} 0 0Z`;
};

export default function BlossomBloom({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [round, setRound] = useState(0);

  const nodes = NODES.map(([bi, t, r, side, flower], i) => {
    const b = BRANCHES[bi];
    const [x, y] = bez(b, t);
    // 絵は上向きに描いてあるので +90 で接線方向へ。そこから枝の片側へ 72°(真横より18°だけ枝の先へ傾け「生えている」に見せる)
    const angle = tangentDeg(b, t) + 90 - side * 72;
    const delay = 0.05 + ((x + y) / 1000) * params.wave + (i % 3) * params.jitter;
    const duration = params.duration * (1 + (((i * 37) % 10) / 10) * 0.8);
    return { x, y, r, angle, flower, delay, duration, i };
  });

  const budLead = params.budLead;
  const budDuration = Math.max(0.01, budLead / 0.6);

  // 値を変えたら最初から咲き直す(key に入れて付け直す)
  const playKey = `${round}-${params.duration}-${params.wave}-${params.jitter}-${budLead}`;

  return (
    <DemoStage
      hint="Bloom again(クリック・タップ)で最初から咲き直す / スライダーを動かしても咲き直す"
      className={styles.stage}
    >
      <div className={styles.field} data-reduce={reduce || undefined}>
        <svg className={styles.art} viewBox="0 0 640 360" aria-hidden>
          <g className={styles.wood}>
            {BRANCHES.map((b, i) => (
              <path key={`branch-${i}`} d={branchPath(b)} style={{ strokeWidth: i < 2 ? 7 - i * 2 : 3 }} />
            ))}
          </g>
          <g key={`blooms-${playKey}`}>
            {nodes.map((n) => {
              const vars = {
                "--blossom-delay": `${n.delay}s`,
                "--blossom-duration": `${n.duration}s`,
                "--blossom-bud-delay": `${n.delay - budLead}s`,
                "--blossom-bud-duration": `${budDuration}s`,
              } as CSSProperties;
              return (
                <g
                  key={`node-${n.i}`}
                  transform={`translate(${n.x.toFixed(1)} ${n.y.toFixed(1)}) rotate(${n.angle.toFixed(1)})`}
                  style={vars}
                  data-blossom={n.flower ? "flower" : "bud"}
                >
                  {n.flower ? (
                    <>
                      {budLead > 0 && (
                        <g className={styles.bud}>
                          <path d={bud(n.r * 0.9)} />
                        </g>
                      )}
                      <g className={styles.bloom}>
                        {/* 花の中心は付け根から r 外。拡大の中心は付け根(0,0) */}
                        <g transform={`translate(0 ${-n.r})`}>
                          {[0, 72, 144, 216, 288].map((a) => (
                            <path key={`petal-${a}`} className={styles.petal} d={petal(n.r)} transform={`rotate(${a + n.i * 11})`} />
                          ))}
                          <circle className={styles.heart} r={n.r * 0.16} />
                        </g>
                      </g>
                    </>
                  ) : (
                    // つぼみだけの付け根: 花と同じキーフレームで開き、そのまま残る
                    <g className={styles.bloom}>
                      <path className={styles.budOnly} d={bud(n.r)} />
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
        <p className={styles.caption}>
          Blossom bloom <span className={styles.captionJa}>ぷくっ、ふわっ</span>
        </p>
        <button type="button" className={styles.replay} onClick={() => setRound((r) => r + 1)}>
          Bloom again
        </button>
      </div>
    </DemoStage>
  );
}
