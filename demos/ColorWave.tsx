"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ColorWave.module.css";

const TEXT = "Color Wave";

// 発色までの立ち上がり/戻りの時間。波の速さはstaggerで作るので固定値にする
const FADE = 120;

// transitionのリセットを確定させるため、reflowを強制する
function forceReflow(el: HTMLElement) {
  return el.offsetHeight;
}

export default function ColorWave({ params }: { params: ParamValues }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const stage = stageRef.current;
    const word = wordRef.current;
    if (!stage || !word) return;

    const chars = Array.from(
      word.querySelectorAll<HTMLElement>(`.${styles.char}`)
    );
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // reduced-motion時は波を再生せず、最初から最終色で表示する
    if (reduce) {
      for (const ch of chars) {
        ch.style.transition = "none";
        ch.style.opacity = "1";
      }
      return;
    }

    let timers: ReturnType<typeof setTimeout>[] = [];

    const play = () => {
      const p = paramsRef.current;
      for (const t of timers) clearTimeout(t);
      timers = [];

      // 全文字を「沈んだ」初期状態へ戻す(transitionなしで即座に)
      for (const ch of chars) {
        ch.style.transition = "none";
        ch.style.color = "";
        ch.style.opacity = String(p.dim / 100);
      }
      forceReflow(word);

      chars.forEach((ch, i) => {
        // batch文字を1組にして、組ごとにstaggerずつ遅らせる
        const delay = Math.floor(i / p.batch) * p.batch * p.stagger;
        ch.style.transition = `color ${FADE}ms ease-out ${delay}ms, opacity ${FADE}ms ease-out ${delay}ms`;
        ch.style.color = "var(--ai)";
        ch.style.opacity = "1";
        // 発色をholdだけ保ってから最終色へ戻す(opacityは1のまま)
        timers.push(
          setTimeout(() => {
            ch.style.transition = `color ${FADE}ms ease-in`;
            ch.style.color = "";
          }, delay + FADE + p.hold)
        );
      });
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      play();
    };

    word.addEventListener("mouseenter", play);
    stage.addEventListener("touchstart", onTouchStart, { passive: false });

    // 初回表示時に1度だけ自動再生してデモの内容を伝える
    const kickoff = setTimeout(play, 400);

    return () => {
      clearTimeout(kickoff);
      for (const t of timers) clearTimeout(t);
      word.removeEventListener("mouseenter", play);
      stage.removeEventListener("touchstart", onTouchStart);
    };
  }, []);

  return (
    <DemoStage stageRef={stageRef} hint="PC: テキストにホバー / スマホ: タップ">
      <span className={styles.word} ref={wordRef}>
        {TEXT.split("").map((ch, i) => (
          <span className={styles.char} key={i}>
            {ch}
          </span>
        ))}
      </span>
    </DemoStage>
  );
}
