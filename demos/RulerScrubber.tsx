"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./RulerScrubber.module.css";

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

// 目盛は0〜120の121本。majorEveryが4〜12のどれでも端まで割り切れる長さにしてある
const TICKS = 121;
const MINOR_H = 9; // 短い目盛の実寸(px)。CSS側の .line の height と一致させる
const MAJOR_H = 18; // 長い目盛の実寸(px)。針元で短い目盛が到達する高さでもある

const IDLE_WAIT = 1800; // この時間ドラッグが無ければ自走スイープに戻る
const SWEEP_PERIOD = 11000; // 自走が左端→右端→左端を1往復する時間
const REJOIN = 0.05; // 自走へ復帰するときの追従率(いきなり飛ばさないための一次遅れ)

export default function RulerScrubber({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [grabbing, setGrabbing] = useState(false);

  const winRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // 進捗(0〜1)はrefで持ち、毎フレームDOMへ直接書く(スライダー以外で再レンダーしない)
  const progressRef = useRef(0.5);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const spanRef = useRef(1);
  // 最後に操作された時刻はrAFのtimeからだけ確定させる(performance.nowはlintで落ちる)
  const touchedRef = useRef(false);
  const lastInputRef = useRef(-Infinity);

  const pitch = Math.round(params.pitch);
  const majorEvery = Math.round(params.majorEvery);
  const focusTicks = Math.round(params.focusTicks);
  const edgeFade = Math.round(params.edgeFade);

  useEffect(() => {
    const win = winRef.current;
    const track = trackRef.current;
    if (!win || !track) return;

    const span = (TICKS - 1) * pitch; // 帯が動ける全長
    const radius = focusTicks * pitch; // 針の周りで目盛が伸びる範囲(px)
    const lift = MAJOR_H - MINOR_H;
    // 目盛ごとの現在の高さ。同じ値なら書き込まない(121本×60fpsのstyle書き換えを避ける)
    const drawn = new Float32Array(TICKS).fill(MINOR_H);

    let center = win.clientWidth / 2;
    const ro = new ResizeObserver(() => {
      center = win.clientWidth / 2;
    });
    ro.observe(win);
    spanRef.current = span;

    const paint = (progress: number) => {
      const head = progress * span; // 針が指している帯上の座標
      track.style.transform = `translateX(${center - head}px)`;

      const lines = lineRefs.current;
      for (let i = 0; i < TICKS; i++) {
        if (i % majorEvery === 0) continue; // 長い目盛は常に18pxで据え置く
        const line = lines[i];
        if (!line) continue;
        const d = Math.abs(i * pitch - head);
        if (d >= radius) {
          if (drawn[i] !== MINOR_H) {
            line.style.transform = "scaleY(1)";
            drawn[i] = MINOR_H;
          }
          continue;
        }
        // 針に近いほど長い目盛の高さへ。両端の傾きが0になるsmoothstepで補間する
        const o = d / radius;
        const h = MAJOR_H - lift * (o * o * (3 - 2 * o));
        if (h !== drawn[i]) {
          line.style.transform = `scaleY(${h / MINOR_H})`;
          drawn[i] = h;
        }
      }

      const readout = readoutRef.current;
      if (readout) {
        const value = String(Math.round(progress * (TICKS - 1))).padStart(3, "0");
        if (readout.textContent !== value) readout.textContent = value;
      }
    };

    const removeTick = addTick((time) => {
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInputRef.current = time;
      }
      // reduced-motion: 自走させず、ドラッグで置かれた位置をそのまま描くだけ
      const idle =
        !reduce && !draggingRef.current && time - lastInputRef.current > IDLE_WAIT;
      if (idle) {
        // 端でゆっくり折り返すよう、往復はcosで作る(0.05〜0.95に収めて端を残す)
        const target = 0.5 - 0.45 * Math.cos((time / SWEEP_PERIOD) * Math.PI * 2);
        progressRef.current += (target - progressRef.current) * REJOIN;
      }
      paint(progressRef.current);
    });

    return () => {
      ro.disconnect();
      removeTick();
    };
  }, [reduce, pitch, majorEvery, focusTicks, edgeFade]);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    touchedRef.current = true;
    setGrabbing(true);
    lastXRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    touchedRef.current = true;
    // 指を右に動かしたら帯も右へ＝小さい値へ戻る(紙の定規を手繰る向き)
    const next = progressRef.current - dx / spanRef.current;
    progressRef.current = next < 0 ? 0 : next > 1 ? 1 : next;
  }

  function onPointerUp() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    touchedRef.current = true;
    setGrabbing(false);
  }

  return (
    <DemoStage hint="PC: 目盛を左右にドラッグ / スマホ: スワイプ（放置中は自動で往復）">
      <div className={styles.gauge}>
        <p className={styles.readout}>
          <span ref={readoutRef} className={styles.value}>
            060
          </span>
          <span className={styles.unit}>mm</span>
        </p>

        <div
          ref={winRef}
          className={grabbing ? `${styles.window} ${styles.grabbing}` : styles.window}
          style={{ ["--fade" as string]: `${edgeFade}%` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div ref={trackRef} className={styles.track} aria-hidden>
            {Array.from({ length: TICKS }, (_, i) => {
              const major = i % majorEvery === 0;
              return (
                <div
                  key={i}
                  className={major ? `${styles.tick} ${styles.major}` : styles.tick}
                  style={{ left: `${i * pitch}px` }}
                >
                  <span
                    className={styles.line}
                    ref={(el) => {
                      lineRefs.current[i] = el;
                    }}
                  />
                  {major ? <span className={styles.label}>{i}</span> : null}
                </div>
              );
            })}
          </div>
          <span className={styles.needle} aria-hidden />
        </div>
      </div>
    </DemoStage>
  );
}
