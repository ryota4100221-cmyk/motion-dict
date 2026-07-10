"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./WaveText.module.css";

const TEXT = "Wave motion";

export default function WaveText({ params }: { params: ParamValues }) {
  const wordRef = useRef<HTMLSpanElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const word = wordRef.current;
    if (!word) return;

    const chars = Array.from(
      word.querySelectorAll<HTMLElement>(`.${styles.char}`)
    );
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // reduced-motion時は揺らさず静止テキストのまま
    if (reduce) return;

    const removeTick = addTick((time) => {
      const p = paramsRef.current;
      // 経過時間を角速度(2π ÷ 周期)で回し、文字ごとに位相をずらして1本の波にする
      const t = (time / 1000) * ((Math.PI * 2) / p.speed);
      chars.forEach((ch, i) => {
        const phase = (i / chars.length) * Math.PI * 2;
        const y = Math.sin(t - phase) * p.amplitude;
        ch.style.transform = `translateY(${y.toFixed(2)}px)`;
      });
    });

    return removeTick;
  }, []);

  return (
    <DemoStage hint="自動でループ再生">
      <span className={styles.word} ref={wordRef}>
        {TEXT.split("").map((ch, i) => (
          // 通常スペースはインラインブロック内で幅が潰れるためnbspに置換
          <span className={styles.char} key={i}>
            {ch === " " ? " " : ch}
          </span>
        ))}
      </span>
    </DemoStage>
  );
}
