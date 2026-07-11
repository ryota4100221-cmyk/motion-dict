"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./SharedElement.module.css";

// content/shared-element.ts の easing options と同順(Play時のイージング)
const EASINGS = [
  "cubic-bezier(0.33, 1, 0.68, 1)", // ease-out
  "cubic-bezier(0.65, 0, 0.35, 1)", // ease-in-out
  "cubic-bezier(0.34, 1.56, 0.64, 1)", // overshoot
] as const;

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

export default function SharedElement({ params }: { params: ParamValues }) {
  const [view, setView] = useState<"list" | "detail">("list");
  const figureRef = useRef<HTMLDivElement>(null);
  const firstRectRef = useRef<DOMRect | null>(null); // First(切替前の位置)
  const animRef = useRef<Animation | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => () => animRef.current?.cancel(), []);

  const easing = EASINGS[Math.round(params.easing)] ?? EASINGS[0];

  const toggle = () => {
    if (animRef.current) return;
    const el = figureRef.current;
    // reduced-motion: 計測せず即座にレイアウト切り替えのみ
    if (el && !reduce) {
      firstRectRef.current = el.getBoundingClientRect(); // First
    }
    setView((v) => (v === "list" ? "detail" : "list"));
  };

  // レイアウト切替直後(paint前)にLast計測→Invert→Playまで同一フレームで行う
  useLayoutEffect(() => {
    const first = firstRectRef.current;
    const el = figureRef.current;
    if (!first || !el) return;
    firstRectRef.current = null;

    const last = el.getBoundingClientRect(); // Last
    const dx = first.left - last.left;
    const dy = first.top - last.top;
    const sx = first.width / last.width;
    const sy = first.height / last.height;

    // Invert: 差分transformから transform: none へ再生(Play)
    const anim = el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        { transform: "none" },
      ],
      { duration: params.duration * 1000, easing }
    );
    animRef.current = anim;
    anim.onfinish = () => {
      animRef.current = null;
    };
  }, [view, params.duration, easing]);

  return (
    <DemoStage hint="クリック / タップ: サムネ ⇄ ヒーローへモーフ">
      <div
        className={
          view === "detail"
            ? `${styles.pageFrame} ${styles.detail}`
            : styles.pageFrame
        }
        onClick={toggle}
      >
        <div ref={figureRef} className={styles.figure}>
          <img
            src="/demo/dummy-02.svg"
            alt=""
            draggable={false}
            className={styles.img}
          />
        </div>
        <div className={styles.bars} aria-hidden>
          <span />
          <span />
          <span />
        </div>
      </div>
    </DemoStage>
  );
}
