"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./SplitTextReveal.module.css";

const TEXT = "Reveal";

// transitionのリセットを確定させるため、reflowを強制する
function forceReflow(el: HTMLElement) {
  return el.offsetHeight;
}

export default function SplitTextReveal({ params }: { params: ParamValues }) {
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

    // reduced-motion時は分割アニメーションなしで即表示
    if (reduce) {
      for (const ch of chars) {
        ch.style.transition = "none";
        ch.style.transform = "none";
        ch.style.opacity = "1";
      }
      return;
    }

    const play = () => {
      const p = paramsRef.current;
      // いったん全文字を隠し位置へ戻す(transitionなしで即座に)
      for (const ch of chars) {
        ch.style.transition = "none";
        ch.style.transform = `translateY(${p.yOffset}px)`;
        ch.style.opacity = "0";
      }
      forceReflow(word);
      // 文字ごとにdelayをずらして下からせり上げる
      chars.forEach((ch, i) => {
        const delay = `${i * p.stagger}ms`;
        ch.style.transition = `transform ${p.duration}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}, opacity ${p.duration}s ease ${delay}`;
        ch.style.transform = "translateY(0)";
        ch.style.opacity = "1";
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
      word.removeEventListener("mouseenter", play);
      stage.removeEventListener("touchstart", onTouchStart);
    };
  }, []);

  return (
    <DemoStage stageRef={stageRef} hint="PC: テキストにホバー / スマホ: タップ">
      <span className={styles.word} ref={wordRef}>
        {TEXT.split("").map((ch, i) => (
          <span className={styles.mask} key={i}>
            <span className={styles.char}>{ch}</span>
          </span>
        ))}
      </span>
    </DemoStage>
  );
}
