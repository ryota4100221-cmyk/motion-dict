"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./PageTurn.module.css";

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

// 1枚のリーフ=表裏2ページ。0ページ目(見返し)と最後(裏表紙)は動かない台紙
const LEAVES = 4;
const PAGES = ["Contents", "01 Hover", "02 Scroll", "03 Text", "04 Transition", "05 Media", "06 UI", "07 Loading", "08 Index", "Colophon"];
// 本文の行の長さ(%)。ページごとに少しずつ変えて、めくったことが中身で分かるようにする
const LINES = [
  [88, 72, 94, 60],
  [70, 92, 84, 48],
  [94, 66, 78, 86],
  [62, 90, 74, 80],
];

// 自走時、めくり終えてから次の1枚までの間(ms)
const HOLD = 700;

type LeafState = "rest" | "fwd" | "back";
type Book = { turned: number; states: LeafState[]; active: number };

// 1枚進める/戻す。めくった(戻した)リーフを active にして最上位へ上げる
function turn(b: Book, dir: 1 | -1): Book {
  const next = b.turned + dir;
  if (next < 0 || next > LEAVES) return b;
  const leaf = dir === 1 ? b.turned : next;
  return {
    turned: next,
    states: b.states.map((v, i) => (i === leaf ? (dir === 1 ? "fwd" : "back") : v)),
    active: leaf,
  };
}

function Page({ index }: { index: number }) {
  const lines = LINES[index % LINES.length];
  return (
    <div className={styles.content}>
      <span className={styles.title}>{PAGES[index]}</span>
      {lines.map((w, i) => (
        <span key={i} className={styles.line} style={{ width: `${w}%` }} />
      ))}
      <span className={styles.folio}>{index}</span>
    </div>
  );
}

export default function PageTurn({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [book, setBook] = useState<Book>(() => ({
    turned: 0,
    states: Array(LEAVES).fill("rest"),
    active: -1,
  }));
  const dirRef = useRef<1 | -1>(1);
  const { turned, states, active } = book;

  const go = (dir: 1 | -1) => setBook((b) => turn(b, dir));

  // 自走: 最後までめくったら1枚ずつ戻し、また進める。操作があればそこから数え直す
  useEffect(() => {
    if (reduce) return;
    const id = window.setTimeout(() => {
      if (turned >= LEAVES) dirRef.current = -1;
      if (turned <= 0) dirRef.current = 1;
      setBook((b) => turn(b, dirRef.current));
    }, params.duration * 1000 + HOLD);
    return () => window.clearTimeout(id);
  }, [turned, params.duration, reduce]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  };

  const vars = {
    "--duration": `${params.duration}s`,
    "--perspective": `${params.perspective}px`,
    "--shade": params.shade / 100,
  } as CSSProperties;

  return (
    <DemoStage hint="自動でめくる／PCは←→キーかボタン・スマホはボタンで1枚ずつ">
      <div className={styles.wrap} style={vars} tabIndex={0} onKeyDown={onKeyDown}>
        {reduce ? (
          // 回転させず、見開きの中身をクロスフェードで差し替えるだけ
          <div key={turned} className={`${styles.book} ${styles.fade}`}>
            <div className={`${styles.page} ${styles.left}`}>
              <Page index={turned * 2} />
            </div>
            <div className={`${styles.page} ${styles.right}`}>
              <Page index={turned * 2 + 1} />
            </div>
          </div>
        ) : (
          <div className={styles.book}>
            <div className={`${styles.page} ${styles.left}`}>
              <Page index={0} />
            </div>
            <div className={`${styles.page} ${styles.right}`}>
              <Page index={LEAVES * 2 + 1} />
            </div>
            {states.map((state, i) => {
              const isTurned = i < turned;
              // めくり済みは後からめくったほど上、未めくりは手前のページほど上、めくり中は最上位
              const z = i === active ? LEAVES + 2 : isTurned ? i + 1 : LEAVES - i;
              return (
                <div
                  key={i}
                  className={`${styles.leaf} ${isTurned ? styles.turned : ""} ${
                    state === "fwd" ? styles.shadeFwd : state === "back" ? styles.shadeBack : ""
                  }`}
                  style={{ zIndex: z }}
                >
                  <div className={`${styles.face} ${styles.front}`}>
                    <Page index={i * 2 + 1} />
                  </div>
                  <div className={`${styles.face} ${styles.back}`}>
                    <Page index={i * 2 + 2} />
                  </div>
                </div>
              );
            })}
            <span className={styles.spine} aria-hidden />
          </div>
        )}

        <div className={styles.controls}>
          <button type="button" className={styles.btn} onClick={() => go(-1)} disabled={turned === 0}>
            ← Prev
          </button>
          <span className={styles.caption}>
            {turned} / {LEAVES} leaves
          </span>
          <button type="button" className={styles.btn} onClick={() => go(1)} disabled={turned === LEAVES}>
            Next →
          </button>
        </div>
      </div>
    </DemoStage>
  );
}
