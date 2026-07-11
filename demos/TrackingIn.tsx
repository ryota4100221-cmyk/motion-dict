"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./TrackingIn.module.css";

const TEXT = "Maison";
// 収束後の字間(em)
const FINAL_SPREAD = 0.02;

// content/tracking-in.ts の ease options と同順(CSSのtiming-function値)
const EASES = ["ease-out", "cubic-bezier(0.16, 1, 0.3, 1)", "ease-in-out"];

// transitionのリセットを確定させるため、reflowを強制する
function forceReflow(el: HTMLElement) {
  return el.offsetHeight;
}

// letter-spacingは最後の文字の後ろにも付くため、同量のマイナスmarginで中央を保つ
function applySpread(el: HTMLElement, em: number) {
  el.style.letterSpacing = `${em}em`;
  el.style.marginRight = `${-em}em`;
}

export default function TrackingIn({ params }: { params: ParamValues }) {
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

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // reduced-motion時はアニメーションなしで最終状態を即表示
    const showInstant = () => {
      word.style.transition = "none";
      applySpread(word, FINAL_SPREAD);
      word.style.opacity = "1";
    };

    const play = () => {
      if (reduce) {
        showInstant();
        return;
      }
      const p = paramsRef.current;
      // いったん広い字間・透明へ戻す(transitionなしで即座に)
      word.style.transition = "none";
      applySpread(word, p.spread);
      word.style.opacity = "0";
      forceReflow(word);
      // 字間とopacityを同時に収束させる
      const ease = EASES[Math.round(p.ease)] ?? EASES[1];
      word.style.transition = `letter-spacing ${p.duration}s ${ease}, margin-right ${p.duration}s ${ease}, opacity ${p.duration}s ease`;
      applySpread(word, FINAL_SPREAD);
      word.style.opacity = "1";
      btn.textContent = "Replay";
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
    <DemoStage hint="Play: リビールを再生(PC/スマホ共通)">
      <span className={styles.word} ref={wordRef}>
        {TEXT}
      </span>
      <button className={styles.playBtn} ref={btnRef}>
        Play
      </button>
    </DemoStage>
  );
}
