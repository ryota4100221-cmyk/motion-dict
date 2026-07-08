"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./TextScramble.module.css";

const TEXT = "SCRAMBLE";

// content/text-scramble.ts の charset options と同順
const CHARSETS = [
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ", // 英大文字
  "0123456789", // 数字
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン", // カタカナ
  "!<>-_/[]{}=+*^?#$%&", // 記号
];

export default function TextScramble({ params }: { params: ParamValues }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const stage = stageRef.current;
    const el = textRef.current;
    if (!stage || !el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let running = false;
    let startTime = 0;
    let frame = 0;
    let scrambled = TEXT;

    const start = () => {
      if (reduce) return; // シャッフルせず元のテキストのまま
      running = true;
      startTime = performance.now();
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      start();
    };

    el.addEventListener("mouseenter", start);
    stage.addEventListener("touchstart", onTouchStart, { passive: false });

    const removeTick = addTick((time) => {
      if (!running) return;
      const p = paramsRef.current;
      const charset = CHARSETS[Math.round(p.charset)] ?? CHARSETS[0];
      const resolved = Math.floor((time - startTime) / p.speed);

      if (resolved >= TEXT.length) {
        running = false;
        el.textContent = TEXT;
        return;
      }
      // 未確定文字は2フレームごとに入れ替える
      frame++;
      if (frame % 2 === 0) {
        scrambled = TEXT.split("")
          .map((ch, i) =>
            i < resolved
              ? ch
              : charset[Math.floor(Math.random() * charset.length)]
          )
          .join("");
      }
      el.textContent = scrambled;
    });

    // 初回表示時に1度だけ自動再生してデモの内容を伝える
    const kickoff = setTimeout(start, 400);

    return () => {
      clearTimeout(kickoff);
      removeTick();
      el.removeEventListener("mouseenter", start);
      stage.removeEventListener("touchstart", onTouchStart);
    };
  }, []);

  return (
    <DemoStage stageRef={stageRef} hint="PC: テキストにホバー / スマホ: タップ">
      <span className={styles.text} ref={textRef}>
        {TEXT}
      </span>
    </DemoStage>
  );
}
