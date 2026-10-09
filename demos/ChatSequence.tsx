"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./ChatSequence.module.css";

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

type Msg = { from: "bot" | "me"; text: string };

const SCRIPT: Msg[] = [
  { from: "bot", text: "こんにちは。どんな動きを探していますか？" },
  { from: "me", text: "押したあとの演出を作りたくて" },
  { from: "bot", text: "それなら「送信ボタンの状態遷移」が近いです。" },
  { from: "bot", text: "数値も一緒に渡すと、AIに意図がそのまま伝わります。" },
  { from: "me", text: "ありがとう！" },
];

const START_DELAY = 500; // 再生開始までの一呼吸(ms)
const HOLD = 2200; // 最後の発言のあと、消すまで見せておく時間(ms)
const FADE = 500; // 全体を消す時間(ms・CSSと合わせる)
const TYPING_CAP = 2400; // 入力中の上限(ms)

type Phase = "wait" | "typing" | "hold" | "fade";

export default function ChatSequence({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);
  const [fading, setFading] = useState(false);
  // 周回ごとに増やして key の接頭辞に使い、吹き出しを頭から出し直す
  const [loop, setLoop] = useState(0);

  const paramsRef = useRef(params);
  const stepRef = useRef({ i: 0, phase: "wait" as Phase, at: -1 });
  const restartRef = useRef(false);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    if (reduce) return;
    return addTick((time) => {
      const s = stepRef.current;
      if (restartRef.current) {
        restartRef.current = false;
        s.i = 0;
        s.phase = "wait";
        s.at = time + START_DELAY;
        setShown(0);
        setTyping(false);
        setFading(false);
        setLoop((n) => n + 1);
        return;
      }
      if (s.at < 0) s.at = time + START_DELAY;
      if (time < s.at) return;

      const p = paramsRef.current;
      const show = () => {
        s.i += 1;
        setShown(s.i);
        setTyping(false);
        s.phase = s.i >= SCRIPT.length ? "hold" : "wait";
        s.at = time + (s.phase === "hold" ? HOLD : p.readPause * 1000);
      };

      if (s.phase === "wait") {
        const msg = SCRIPT[s.i];
        if (msg.from === "me") {
          // 自分の発言は入力中を見せずにそのまま送る
          show();
        } else {
          // 入力中 = 最低時間 + 文字数比例。上限で頭打ち
          const ms = Math.min(TYPING_CAP, p.baseTyping * 1000 + msg.text.length * p.perChar);
          setTyping(true);
          s.phase = "typing";
          s.at = time + ms;
        }
      } else if (s.phase === "typing") {
        show();
      } else if (s.phase === "hold") {
        setFading(true);
        s.phase = "fade";
        s.at = time + FADE;
      } else {
        restartRef.current = true;
      }
    });
  }, [reduce]);

  const visible = reduce ? SCRIPT : SCRIPT.slice(0, shown);
  const next = SCRIPT[shown];

  const vars = { "--enter": `${params.enter}s` } as CSSProperties;

  return (
    <DemoStage hint="操作不要(自動でループ再生) / PC: クリック・スマホ: タップで最初から再生">
      <div
        className={styles.window}
        style={vars}
        onPointerDown={() => {
          if (!reduce) restartRef.current = true;
        }}
      >
        <div className={styles.bar} aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className={styles.log} data-fading={fading || undefined} role="log" aria-live="polite">
          {visible.map((m, i) => (
            <p
              key={`msg-${loop}-${i}`}
              className={m.from === "bot" ? styles.bot : styles.me}
            >
              {m.text}
            </p>
          ))}
          {!reduce && typing && next && (
            <span key={`typing-${loop}-${shown}`} className={styles.typing} aria-hidden>
              <span />
              <span />
              <span />
            </span>
          )}
        </div>
      </div>
    </DemoStage>
  );
}
