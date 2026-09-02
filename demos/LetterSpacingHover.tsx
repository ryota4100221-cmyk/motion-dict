"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./LetterSpacingHover.module.css";

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

// content/letter-spacing-hover.ts の ease options と同順
const EASINGS = ["linear", "cubic-bezier(0.16, 1, 0.3, 1)", "ease-in-out"];

const LINKS = ["Work", "Studio", "Journal", "Contact"];

// 実ポインタが離れてからアイドル巡回を再開するまで(ms)と、開ききってから次へ送るまで(ms)
const IDLE_AFTER = 1600;
const IDLE_HOLD = 900;

export default function LetterSpacingHover({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const paramsRef = useRef(params);
  const badgeRef = useRef<HTMLSpanElement>(null);
  // 実ポインタで開いているリンク。null なら誰も指していない
  const [hovered, setHovered] = useState<number | null>(null);
  // 無操作のときに自走で開くリンク。初期は null なので、載った直後は静止状態を測れる
  const [idle, setIdle] = useState<number | null>(null);
  // 何も開いていないときの行末の位置(px)。ここに動かない目盛りを引く
  const [restEnd, setRestEnd] = useState<number | null>(null);
  // 操作されたことだけ立てる。時刻は rAF の time でしか触らない
  const touchedRef = useRef(false);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const open = hovered !== null ? hovered : reduce ? null : idle;

  // 静止状態のときだけ行末を測り直す。ここが基準線になる
  useEffect(() => {
    if (open !== null) return;
    const badge = badgeRef.current;
    if (!badge) return;
    const measure = () => setRestEnd(badge.offsetLeft);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  // ポインタが無い間もどれかが開いていないと、録画も初見も静止画になる
  useEffect(() => {
    if (reduce) return;
    const st = { lastInput: 0, lastStep: 0 };
    return addTick((time) => {
      if (touchedRef.current) {
        touchedRef.current = false;
        st.lastInput = time;
        st.lastStep = time;
        return;
      }
      if (!st.lastInput) {
        st.lastInput = time;
        st.lastStep = time;
        return;
      }
      if (time - st.lastInput < IDLE_AFTER) return;
      if (time - st.lastStep >= paramsRef.current.duration * 1000 + IDLE_HOLD) {
        st.lastStep = time;
        setIdle((i) => (i === null ? 0 : (i + 1) % LINKS.length));
      }
    });
  }, [reduce]);

  const touch = (i: number | null) => {
    touchedRef.current = true;
    setHovered(i);
    setIdle(null);
  };

  const rowStyle = {
    "--lsh-dur": `${reduce ? 0 : params.duration}s`,
    "--lsh-ease": EASINGS[Math.round(params.ease)] ?? "ease-in-out",
  } as CSSProperties;

  const mode = Math.round(params.compensate); // 0=none / 1=trailing / 2=full

  return (
    <DemoStage hint="PC: リンクにホバー(無操作時は自動で巡回) / スマホ: リンクをタップ">
      <div className={styles.wrap}>
        <nav className={styles.row} style={rowStyle}>
          {LINKS.map((label, i) => {
            const on = open === i && !reduce;
            const s = params.spacing;
            // 打ち消し量は必ず文字数から出す。決め打ちだと文字数の違うリンクでズレる
            const half = (-label.length * s) / 2;
            const style = {
              letterSpacing: on ? `${s}em` : "normal",
              // trailing は末尾の1文字ぶんだけ、full は文字数ぶんを左右へ半分ずつ返す
              marginInlineStart: on && mode === 2 ? `${half}em` : "0em",
              marginInlineEnd: on
                ? mode === 1
                  ? `${-s}em`
                  : mode === 2
                    ? `${half}em`
                    : "0em"
                : "0em",
            } as CSSProperties;
            return (
              <a
                key={label}
                href="#"
                className={styles.link}
                data-on={open === i ? "1" : "0"}
                style={style}
                onClick={(e) => e.preventDefault()}
                onMouseEnter={() => touch(i)}
                onMouseLeave={() => touch(null)}
                onTouchStart={() => touch(open === i ? null : i)}
              >
                {label}
              </a>
            );
          })}
          {/* 行の末尾に居座る静止要素。字間が押し広げた分そのまま右へ流される */}
          <span className={styles.badge} ref={badgeRef}>
            EN
          </span>
        </nav>
        {/* 静止状態の行末に引いた動かない基準線。none だと EN がここから外れる */}
        {restEnd !== null && (
          <span className={styles.guide} style={{ left: `${restEnd}px` }} />
        )}
        <span className={styles.caption}>
          {["none — 隣を押す", "trailing — 末尾だけ打ち消す", "full — 外形を固定"][mode]}
        </span>
      </div>
    </DemoStage>
  );
}
