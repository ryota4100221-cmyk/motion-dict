"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./MarkerLine.module.css";

// transitionのリセットを確定させるため、reflowを強制する
function forceReflow(el: HTMLElement) {
  return el.offsetHeight;
}

export default function MarkerLine({ params }: { params: ParamValues }) {
  const markRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const mark = markRef.current;
    const btn = btnRef.current;
    if (!mark || !btn) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // reduced-motion時はアニメーションなしで引き終わった状態を表示
    const showInstant = () => {
      mark.style.transition = "none";
      mark.style.backgroundSize = `100% ${paramsRef.current.thickness}%`;
    };

    const play = () => {
      if (reduce) {
        showInstant();
        return;
      }
      const p = paramsRef.current;
      // いったんマーカーなしへ戻す(transitionなしで即座に)
      mark.style.transition = "none";
      mark.style.backgroundSize = `0% ${p.thickness}%`;
      forceReflow(mark);
      // delayの「ため」を置いてから、左からスッと引く
      mark.style.transition = `background-size ${p.duration}s ease-out ${p.delay}s`;
      mark.style.backgroundSize = `100% ${p.thickness}%`;
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
    <DemoStage hint="Play: マーカーを再生(PC/スマホ共通)">
      <p className={styles.sentence}>
        デザインの質は
        <span className={styles.mark} ref={markRef}>
          余白
        </span>
        で決まる。
      </p>
      <button className={styles.playBtn} ref={btnRef}>
        Play
      </button>
    </DemoStage>
  );
}
