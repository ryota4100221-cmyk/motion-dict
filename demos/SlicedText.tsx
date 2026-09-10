"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./SlicedText.module.css";

const WORD = "SLICED";
// slicesスライダーの上限。DOMは常にこの枚数を持ち、使わない帯は非表示にする
const MAX_SLICES = 6;
// ずれが最大になる位置。残りは戻りの余韻に使う(実測サイトも前半3割で開ききる)
const PEAK = 0.3;
// 切り口に沿った横滑りの比率。直角ずらしに対する倍率(実測 0.6〜0.65)
const SLIDE = 0.8;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export default function SlicedText({ params }: { params: ParamValues }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  // 帯の切り分けはスライダーを動かした時点で反映する(再生を待たせない)
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const slices = Array.from(wrap.querySelectorAll<HTMLElement>(`.${styles.slice}`));
    const n = params.slices;
    const t = params.tilt / 100;

    slices.forEach((slice, i) => {
      if (i >= n) {
        slice.style.display = "none";
        return;
      }
      slice.style.display = "";

      // 帯の上端・下端の中心位置。左端は下がり、右端は上がる(右上がりの切り口)
      const top = i / n;
      const bottom = (i + 1) / n;
      // 上下の端の帯はアセンダ・ディセンダを切らないよう箱の外まで伸ばす
      const topL = i === 0 ? -1 : top + t / 2;
      const topR = i === 0 ? -1 : top - t / 2;
      const bottomL = i === n - 1 ? 2 : bottom + t / 2;
      const bottomR = i === n - 1 ? 2 : bottom - t / 2;
      const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

      slice.style.clipPath =
        `polygon(0% ${pct(topL)}, 100% ${pct(topR)}, ` +
        `100% ${pct(bottomR)}, 0% ${pct(bottomL)})`;
    });
  }, [params.slices, params.tilt]);

  useEffect(() => {
    const stage = stageRef.current;
    const wrap = wrapRef.current;
    if (!stage || !wrap) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // reduced-motion時は断片を合わせた静止状態のまま。走査線も出さない
    if (reduce) return;

    const slices = Array.from(wrap.querySelectorAll<HTMLElement>(`.${styles.slice}`));
    const line = wrap.querySelector<HTMLElement>(`.${styles.line}`);
    let running: Animation[] = [];

    const play = () => {
      const p = paramsRef.current;
      for (const anim of running) anim.cancel();
      running = [];

      const duration = p.duration * 1000;
      const box = wrap.getBoundingClientRect();

      slices.forEach((slice, i) => {
        if (i >= p.slices) return;
        // 隣り合う帯を互いに逆向きへ。上向き(-y)を主に、切り口に沿った横滑りを混ぜる
        const dir = i % 2 === 0 ? 1 : -1;
        const dx = dir * p.offset * SLIDE;
        const dy = -dir * p.offset;

        running.push(
          slice.animate(
            [
              { transform: "translate(0px, 0px)", easing: EASE },
              { transform: `translate(${dx}px, ${dy}px)`, offset: PEAK, easing: EASE },
              { transform: "translate(0px, 0px)" },
            ],
            { duration, fill: "both" }
          )
        );
      });

      // 走査線は切り口と同じ角度で中央を一度だけ走る
      if (line && box.height > 0) {
        const rad = Math.atan2(-(p.tilt / 100) * box.height, box.width);
        const deg = (rad * 180) / Math.PI;
        const at = (s: number) => `rotate(${deg.toFixed(2)}deg) scaleX(${s})`;

        running.push(
          line.animate(
            [
              { transform: at(0), opacity: 0, easing: EASE },
              { transform: at(0.35), opacity: 1, offset: 0.15, easing: EASE },
              { transform: at(1), opacity: 1, offset: 0.55 },
              { transform: at(1), opacity: 0 },
            ],
            { duration, fill: "both" }
          )
        );
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      play();
    };

    wrap.addEventListener("mouseenter", play);
    stage.addEventListener("touchstart", onTouchStart, { passive: false });

    // 無操作でも動きが伝わるよう自走させる(ループ動画が静止画になるのを防ぐ)
    const kickoff = setTimeout(play, 400);
    const idle = setInterval(play, 2600);

    return () => {
      clearTimeout(kickoff);
      clearInterval(idle);
      for (const anim of running) anim.cancel();
      wrap.removeEventListener("mouseenter", play);
      stage.removeEventListener("touchstart", onTouchStart);
    };
  }, []);

  return (
    <DemoStage stageRef={stageRef} hint="PC: 見出しにホバーで再生 / スマホ: タップ(無操作でも自動再生)">
      <div className={styles.wrap} ref={wrapRef}>
        <span className={styles.srOnly}>{WORD}</span>
        {/* 箱の大きさを決める実体。表示は帯側が担う */}
        <span className={styles.ghost} aria-hidden="true">
          {WORD}
        </span>
        {Array.from({ length: MAX_SLICES }, (_, i) => (
          <span className={styles.slice} key={i} aria-hidden="true">
            {WORD}
          </span>
        ))}
        <span className={styles.line} aria-hidden="true" />
      </div>
    </DemoStage>
  );
}
