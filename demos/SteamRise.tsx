"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./SteamRise.module.css";

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

// 出典(bar-topas.ch の .visit-steam)と同じ1本の形。x だけ差し替えて並べる。
// 相対コマンドなので、始点を動かせば形はそのまま平行移動する
const wispPath = (x: number) => `M${x} 86c-14-14 14-24 0-40s12-26 2-42`;

export default function SteamRise({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);

  const count = Math.round(params.wisps);
  // viewBox の横幅 160 を本数+1で等分(3本なら 40 / 80 / 120)
  const xs = Array.from({ length: count }, (_, i) => (160 * (i + 1)) / (count + 1));

  const vars = {
    "--steam-duration": `${params.duration}s`,
    "--steam-from": `${params.rise * 0.4}px`,
    "--steam-to": `${-params.rise * 0.6}px`,
  } as CSSProperties;

  return (
    <DemoStage
      hint="操作不要: 自動で立ちのぼる / クリック・タップ: 一時停止と再開"
      className={styles.steamStage}
    >
      {/* 停止のきっかけは div の pointerdown。録画が押す button にはしない */}
      <div
        className={styles.field}
        onPointerDown={() => setPaused((p) => !p)}
        style={vars}
        data-paused={paused || undefined}
        data-reduce={reduce || undefined}
      >
        <div className={styles.cupWrap}>
          <div className={styles.steam} aria-hidden>
            {xs.map((x, i) => (
              <svg
                // 本数を変えたら作り直して位相を揃え直す
                key={`wisp-${count}-${i}`}
                className={styles.wisp}
                viewBox="0 0 160 90"
                style={{ animationDelay: `${i * params.stagger}s` }}
              >
                <path
                  d={wispPath(x)}
                  className={styles.wispPath}
                  style={{ animationDelay: `${i * params.stagger}s` }}
                />
              </svg>
            ))}
          </div>
          <svg className={styles.cup} viewBox="0 0 200 120" aria-hidden>
            {/* 受け皿・器・取っ手。静止した線画 */}
            <path d="M18 112h164" />
            <path d="M40 18h112v38c0 34-24 50-56 50s-56-16-56-50z" />
            <path d="M152 32h10c14 0 20 10 20 20s-8 22-26 24" />
          </svg>
        </div>
        <p className={styles.caption}>
          Steam rise <span className={styles.captionJa}>ゆらゆら</span>
        </p>
        {paused && <p className={styles.state}>Paused — tap to resume</p>}
      </div>
    </DemoStage>
  );
}
