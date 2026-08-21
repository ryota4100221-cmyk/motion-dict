"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./StoryProgress.module.css";

// 送り終わったセグメントは1、これからは0、表示中だけ進捗を入れる。
// フィルはscaleXなのでレイアウト計算(リフロー)が走らない
function paint(
  fills: (HTMLSpanElement | null)[],
  index: number,
  ratio: number
) {
  fills.forEach((el, i) => {
    if (!el) return;
    const v = i < index ? 1 : i > index ? 0 : ratio;
    el.style.transform = `scaleX(${v})`;
  });
}

export default function StoryProgress({ params }: { params: ParamValues }) {
  const count = Math.round(params.segments);
  const height = Math.round(params.height);
  const reduce = useReducedMotion();

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // segmentsを減らすとindexが範囲外になりうるので、描画側で丸める
  const active = Math.min(index, count - 1);

  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  const state = useRef({
    index: 0,
    count,
    duration: params.duration,
    elapsed: 0,
    last: 0,
    paused: false,
    reduce: false,
  });

  useEffect(() => {
    const s = state.current;
    s.duration = params.duration;
    s.count = count;
    s.paused = paused;
    s.reduce = reduce;
  }, [params.duration, count, paused, reduce]);

  // スライドが変わったら経過時間を捨てて、その時点の見た目に塗り直す。
  // reduced-motion時は表示中のセグメントも満杯にした静的インジケーターにする
  useEffect(() => {
    state.current.index = active;
    state.current.elapsed = 0;
    paint(fills.current, active, reduce ? 1 : 0);
  }, [active, count, reduce]);

  useEffect(() => {
    state.current.last = 0;
    return addTick((time) => {
      const s = state.current;
      if (s.last === 0) {
        s.last = time;
        return;
      }
      // タブが裏に回っている間の巨大なdtで一気に送られるのを防ぐ
      const dt = Math.min((time - s.last) / 1000, 0.1);
      s.last = time;
      if (s.paused || s.reduce) return;
      s.elapsed += dt;
      const ratio = Math.min(s.elapsed / s.duration, 1);
      paint(fills.current, s.index, ratio);
      if (ratio >= 1) {
        s.elapsed = 0;
        setIndex((s.index + 1) % s.count);
      }
    });
  }, []);

  const barStyle: CSSProperties = { height: `${height}px` };
  const slideStyle: CSSProperties = {
    transition: reduce ? "none" : "opacity 0.35s ease",
  };

  return (
    <DemoStage hint="PC: 押している間だけ一時停止 / スマホ: 長押しで一時停止(バーをタップでジャンプ)">
      <div
        className={styles.viewport}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
      >
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className={styles.slide}
            style={{ ...slideStyle, opacity: i === active ? 1 : 0 }}
            aria-hidden={i !== active}
          >
            <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
            <span className={styles.cap}>STORY</span>
          </div>
        ))}

        <div
          className={styles.bars}
          role="group"
          aria-label={`スライド ${active + 1} / ${count}`}
        >
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              className={styles.track}
              style={barStyle}
              onClick={() => setIndex(i)}
              aria-label={`${i + 1}枚目`}
            >
              <span
                className={styles.fill}
                ref={(el) => {
                  fills.current[i] = el;
                }}
              />
            </button>
          ))}
        </div>

        {paused && !reduce ? <span className={styles.paused}>‖</span> : null}
      </div>
    </DemoStage>
  );
}

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
