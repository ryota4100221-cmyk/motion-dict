"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./RankClimb.module.css";

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

// 「今週よく引かれた見出し語」。最後の行(自分＝Rank climb)が下から追い抜いていく
const ROWS = ["Split text reveal", "Magnetic hover", "Scroll fade-in", "Marquee"];
const MINE = "Rank climb";
const N = ROWS.length + 1; // 5行。自分は最下段(#5)から

// 1行の高さ＋行間(px)。CSS の .row の height 36px ＋ 6px と揃える
const PITCH = 42;

// 出典(weflash.studio の SERP モック)の GSAP の値
const IN_DUR = 0.4; // 各行の入り(x:-20 → 0, 透明 → 不透明)
const IN_STAGGER = 0.08;
const CLIMB_DELAY = 0.3; // 全行が入ってから1段目まで
const POP_LEG = 0.25; // バッジの弾み(片道)
const HOLD = 1.6; // 首位で止めて見せる
const OUT_DUR = 0.35;
const REST = 0.4;

// GSAP power2.out = easeOutCubic / power3.inOut = easeInOutQuart / power1.out = easeOutQuad
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const inOutQuart = (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2);
const outQuad = (t: number) => 1 - (1 - t) * (1 - t);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default function RankClimb({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const { step, overlap, climb, pop } = params;
  const boardRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<number | null>(null); // 今の周回の開始時刻(rAF の time)
  const [replays, setReplays] = useState(0);

  useEffect(() => {
    if (reduce) return;
    startRef.current = null;
    const gap = Math.max(0.05, step - overlap); // 段と段の間隔(重ねる分だけ前倒し)
    const climbStart = IN_DUR + IN_STAGGER * (N - 1) + CLIMB_DELAY;
    const climbEnd = climbStart + gap * (climb - 1) + step;
    const popEnd = climbEnd + POP_LEG * 2;
    const cycle = popEnd + HOLD + OUT_DUR + REST;

    return addTick((time) => {
      const board = boardRef.current; // ノードは毎フレーム引き直す
      if (!board) return;
      if (startRef.current === null) startRef.current = time;
      const t = ((time - startRef.current) / 1000) % cycle;
      const rows = Array.from(board.querySelectorAll<HTMLElement>("[data-row]"));
      const badge = board.querySelector<HTMLElement>("[data-badge]");
      const outK = clamp01((t - (popEnd + HOLD)) / OUT_DUR);

      // k 段目(1始まり)の進み具合 0→1
      const prog = (k: number) => inOutQuart(clamp01((t - (climbStart + gap * (k - 1))) / step));

      rows.forEach((el) => {
        const home = Number(el.dataset.row); // 最初の段(0=首位)
        const inK = outCubic(clamp01((t - home * IN_STAGGER) / IN_DUR));
        let slot = home;
        if (home === N - 1) {
          // 自分：段ごとの進みを足し引きして上へ
          for (let k = 1; k <= climb; k++) slot -= prog(k);
        } else {
          // 追い抜かれる行：自分が来た段で1段下へ
          const k = N - 1 - home;
          if (k <= climb) slot += prog(k);
        }
        el.style.transform = `translate3d(${(-20 * (1 - inK)).toFixed(2)}px, ${(slot * PITCH).toFixed(2)}px, 0)`;
        el.style.opacity = (inK * (1 - outK)).toFixed(3);
      });

      if (badge) {
        // 表示順位は各段の 2/3(出典 0.45s のうち 0.3s)で1つ繰り上がる
        let rank = N;
        for (let k = 1; k <= climb; k++) if (t >= climbStart + gap * (k - 1) + step * (2 / 3)) rank--;
        badge.textContent = `#${rank}`;
        const p = t - climbEnd;
        const leg = p < 0 || p > POP_LEG * 2 ? 0 : p < POP_LEG ? outQuad(p / POP_LEG) : outQuad(1 - (p - POP_LEG) / POP_LEG); // 戻りは往きの逆再生(yoyo)
        badge.style.transform = `scale(${(1 + (pop - 1) * leg).toFixed(3)})`;
        badge.toggleAttribute("data-lit", leg > 0.02);
      }
    });
  }, [reduce, step, overlap, climb, pop, replays]);

  const final = N - 1 - climb; // 動かないときの自分の段

  return (
    <DemoStage
      hint="自動で繰り返す / PC: Replay climb をクリック / スマホ: タップ"
      className={styles.rankStage}
    >
      <div className={styles.board} ref={boardRef}>
        <div className={styles.head}>
          <p className={styles.label}>Index · most looked-up this week</p>
          <button
            type="button"
            className={styles.replay}
            onClick={() => setReplays((n) => n + 1)}
            disabled={reduce}
          >
            Replay climb
          </button>
        </div>
        <div className={styles.list}>
          {ROWS.map((name, i) => {
            const slot = reduce && N - 1 - i <= climb ? i + 1 : i;
            return (
              <div
                key={`r-${name}`}
                className={styles.row}
                data-row={i}
                style={reduce ? { transform: `translateY(${slot * PITCH}px)` } : { opacity: 0 }}
              >
                <i className={styles.fav} aria-hidden />
                <span className={styles.name}>{name}</span>
                <span className={styles.bar} style={{ width: `${64 - i * 9}px` }} aria-hidden />
              </div>
            );
          })}
          <div
            key="r-mine"
            className={`${styles.row} ${styles.mine}`}
            data-row={N - 1}
            style={reduce ? { transform: `translateY(${final * PITCH}px)` } : { opacity: 0 }}
          >
            <i className={`${styles.fav} ${styles.favMine}`} aria-hidden />
            <span className={styles.name}>{MINE}</span>
            {/* 文字は毎フレーム書き換えるので、条件が変わったら作り直す */}
            <span key={`b-${reduce ? final : "live"}`} className={styles.badge} data-badge="">
              {`#${reduce ? final + 1 : N}`}
            </span>
          </div>
        </div>
      </div>
    </DemoStage>
  );
}
