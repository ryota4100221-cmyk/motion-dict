"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./GradientMorph.module.css";

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

// content/gradient-morph.ts の easing options と同順
const EASINGS = ["linear", "cubic-bezier(0.16, 1, 0.3, 1)", "ease-in-out"];

// セクションごとの「場」。位置・広がり・色・ストップを全部ずらしてあるので、
// 切り替わると光源が移動しながら広がり、色の帯も伸び縮みする。
type Field = {
  name: string;
  x: number;
  y: number;
  sx: number; // 楕円の半径(%)。spread を掛ける前の基準値
  sy: number;
  c1: string;
  c2: string;
  c3: string;
  s1: number; // カラーストップ(%)
  s2: number;
};

const FIELDS: Field[] = [
  {
    name: "hero",
    x: 50,
    y: 44,
    sx: 56,
    sy: 62,
    c1: "#f4fbe2",
    c2: "#a5e02e",
    c3: "#101508",
    s1: 4,
    s2: 34,
  },
  {
    name: "about",
    x: 12,
    y: 86,
    sx: 100,
    sy: 86,
    c1: "#a5e02e",
    c2: "#3d7a56",
    c3: "#07100c",
    s1: 0,
    s2: 44,
  },
  {
    name: "work",
    x: 88,
    y: 14,
    sx: 66,
    sy: 104,
    c1: "#e4f5bd",
    c2: "#6b8f1e",
    c3: "#0b0d06",
    s1: 12,
    s2: 26,
  },
];

// 遷移が終わってから次に動くまでの静止(s)。ここは動きのパラメータではないので固定。
const HOLD = 1.6;

export default function GradientMorph({ params }: { params: ParamValues }) {
  const bgRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  // 手動で送られたことだけ立てておき、時刻は rAF の time で確定する
  const touchedRef = useRef(false);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  // 状態が変わったら変数を書き換えるだけ。値の補間はCSSのtransitionが持つ
  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;
    const f = FIELDS[index];
    const k = params.spread / 100;
    el.style.setProperty("--gm-x", `${f.x}%`);
    el.style.setProperty("--gm-y", `${f.y}%`);
    el.style.setProperty("--gm-size-x", `${Math.round(f.sx * k)}%`);
    el.style.setProperty("--gm-size-y", `${Math.round(f.sy * k)}%`);
    el.style.setProperty("--gm-c1", f.c1);
    el.style.setProperty("--gm-c2", f.c2);
    el.style.setProperty("--gm-c3", f.c3);
    el.style.setProperty("--gm-s1", `${f.s1}%`);
    el.style.setProperty("--gm-s2", `${f.s2}%`);
    el.style.transitionDuration = reduce ? "0s" : `${params.duration}s`;
    el.style.transitionTimingFunction = EASINGS[Math.round(params.easing)] ?? "ease-in-out";
  }, [index, params, reduce]);

  // 無操作でも場が巡回し続ける(触られていない間も動きが見えるようにする)
  useEffect(() => {
    if (reduce) return;
    const st = { last: 0 };
    return addTick((time) => {
      if (touchedRef.current) {
        touchedRef.current = false;
        st.last = time;
        return;
      }
      if (!st.last) {
        st.last = time;
        return;
      }
      if (time - st.last >= (paramsRef.current.duration + HOLD) * 1000) {
        st.last = time;
        setIndex((i) => (i + 1) % FIELDS.length);
      }
    });
  }, [reduce]);

  const next = () => {
    touchedRef.current = true;
    setIndex((i) => (i + 1) % FIELDS.length);
  };

  return (
    <DemoStage hint="自動で巡回 / クリック・タップで次のセクションへ">
      <div className={styles.frame} onClick={next}>
        <div className={styles.bg} ref={bgRef} />
        <span className={styles.label}>{FIELDS[index].name}</span>
        <div className={styles.dots}>
          {FIELDS.map((f, i) => (
            <span
              key={f.name}
              className={i === index ? `${styles.dot} ${styles.dotOn}` : styles.dot}
            />
          ))}
        </div>
      </div>
      <button className={styles.nextBtn} onClick={next}>
        Next
      </button>
    </DemoStage>
  );
}
