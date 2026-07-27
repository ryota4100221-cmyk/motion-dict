"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./BlockReveal.module.css";

const WORDS = ["Design", "in", "motion"];

export default function BlockReveal({ params }: { params: ParamValues }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  // barHeightはバー側のCSS変数で持たせる(再生のたびに書き換えない)
  useEffect(() => {
    lineRef.current?.style.setProperty("--bar-h", `${params.barHeight}%`);
  }, [params.barHeight]);

  useEffect(() => {
    const stage = stageRef.current;
    const line = lineRef.current;
    if (!stage || !line) return;

    const words = Array.from(line.querySelectorAll<HTMLElement>(`.${styles.word}`));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // reduced-motion時はバーを出さず、文字を最初から表示する
    if (reduce) {
      for (const word of words) {
        const text = word.querySelector<HTMLElement>(`.${styles.text}`);
        if (text) text.style.opacity = "1";
      }
      return;
    }

    let running: Animation[] = [];

    const play = () => {
      const p = paramsRef.current;
      // 前回の再生を打ち切ってから初期状態に戻す
      for (const anim of running) anim.cancel();
      running = [];

      const duration = p.duration * 1000;
      // 入れ替え点。0/1に接する値を避けてキーフレームのoffsetを単調増加に保つ
      const swap = Math.min(Math.max(p.pivot / 100, 0.05), 0.95);
      const after = swap + 0.001;

      words.forEach((word, i) => {
        const bar = word.querySelector<HTMLElement>(`.${styles.bar}`);
        const text = word.querySelector<HTMLElement>(`.${styles.text}`);
        if (!bar || !text) return;

        const delay = i * p.stagger;
        const ease = "cubic-bezier(0.76, 0, 0.24, 1)";

        // 行きはleft originで覆い、入れ替え点でright originに反転して抜ける
        running.push(
          bar.animate(
            [
              // translateY(-50%)は縦位置合わせ。transformを丸ごと差し替えるので毎フレーム書く
              {
                transform: "translateY(-50%) scaleX(0)",
                transformOrigin: "left center",
                easing: ease,
              },
              {
                transform: "translateY(-50%) scaleX(1)",
                transformOrigin: "left center",
                offset: swap,
                easing: ease,
              },
              {
                transform: "translateY(-50%) scaleX(1)",
                transformOrigin: "right center",
                offset: after,
              },
              { transform: "translateY(-50%) scaleX(0)", transformOrigin: "right center" },
            ],
            { duration, delay, fill: "backwards" }
          )
        );

        // 文字はバーが覆いきった一瞬で切り替えるので、切り替え自体は見えない
        running.push(
          text.animate(
            [
              { opacity: 0 },
              { opacity: 0, offset: swap },
              { opacity: 1, offset: after },
              { opacity: 1 },
            ],
            { duration, delay, fill: "both" }
          )
        );
      });
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      play();
    };

    line.addEventListener("mouseenter", play);
    stage.addEventListener("touchstart", onTouchStart, { passive: false });

    // 初回表示時に1度だけ自動再生してデモの内容を伝える
    const kickoff = setTimeout(play, 400);

    return () => {
      clearTimeout(kickoff);
      for (const anim of running) anim.cancel();
      line.removeEventListener("mouseenter", play);
      stage.removeEventListener("touchstart", onTouchStart);
    };
  }, []);

  return (
    <DemoStage stageRef={stageRef} hint="PC: 見出しにホバーで再生 / スマホ: タップ">
      <div className={styles.line} ref={lineRef}>
        {WORDS.map((w) => (
          <span className={styles.word} key={w}>
            <span className={styles.text}>{w}</span>
            <span className={styles.bar} aria-hidden="true" />
          </span>
        ))}
      </div>
    </DemoStage>
  );
}
