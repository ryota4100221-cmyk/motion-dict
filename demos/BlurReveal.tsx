"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./BlurReveal.module.css";

const TEXT = "REVERIE";

// transitionのリセットを確定させるため、reflowを強制する
function forceReflow(el: HTMLElement) {
  return el.offsetHeight;
}

export default function BlurReveal({ params }: { params: ParamValues }) {
  const wordRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const word = wordRef.current;
    const btn = btnRef.current;
    if (!word || !btn) return;

    const chars = Array.from(
      word.querySelectorAll<HTMLElement>(`.${styles.char}`)
    );
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // reduced-motion時はぼかしアニメーションなしで即表示
    const showInstant = () => {
      for (const ch of chars) {
        ch.style.transition = "none";
        ch.style.filter = "none";
        ch.style.opacity = "1";
      }
    };

    const play = () => {
      if (reduce) {
        showInstant();
        return;
      }
      const p = paramsRef.current;
      // いったん全文字をぼけた状態へ戻す(transitionなしで即座に)
      for (const ch of chars) {
        ch.style.transition = "none";
        ch.style.filter = `blur(${p.blur}px)`;
        ch.style.opacity = "0";
      }
      forceReflow(word);
      // 文字ごとにdelayをずらして順にピントを合わせる
      chars.forEach((ch, i) => {
        const delay = `${i * p.stagger}ms`;
        ch.style.transition = `filter ${p.duration}s ease-out ${delay}, opacity ${p.duration}s ease ${delay}`;
        ch.style.filter = "blur(0px)";
        ch.style.opacity = "1";
      });
      btn.textContent = "REPLAY";
    };

    if (reduce) showInstant();

    btn.addEventListener("click", play);
    // 初回表示時に1度だけ自動再生してデモの内容を伝える
    const kickoff = setTimeout(play, 400);

    return () => {
      clearTimeout(kickoff);
      btn.removeEventListener("click", play);
    };
  }, []);

  return (
    <DemoStage hint="PLAY: リビールを再生(PC/スマホ共通)">
      <span className={styles.word} ref={wordRef}>
        {TEXT.split("").map((ch, i) => (
          <span className={styles.char} key={i}>
            {ch}
          </span>
        ))}
      </span>
      <button className={styles.playBtn} ref={btnRef}>
        PLAY
      </button>
    </DemoStage>
  );
}
