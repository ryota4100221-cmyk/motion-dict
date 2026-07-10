"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ToastSlide.module.css";

const LABELS = ["SAVED", "COPIED", "SENT", "ARCHIVED"];
const TOAST_STEP = 52; // トースト高さ44px + 間隔8px
const MAX_TOASTS = 4; // これ以上積まれたら古いものから退場
const EASE_IN = "cubic-bezier(0.22, 1, 0.36, 1)"; // 入り: 減速で素早く
const EASE_OUT = "cubic-bezier(0.55, 0, 1, 0.45)"; // 出: 加速で静かに

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

type Toast = {
  id: number;
  label: string;
  entered: boolean; // 画面内に入ったか
  exiting: boolean; // 退場中か
};

export default function ToastSlide({ params }: { params: ParamValues }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const reduce = useReducedMotion();

  const duration = params.duration;
  const hold = params.hold;

  // アンマウント時にタイマーを全て破棄
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };

  // 退場開始 → スライドアウト完了後にDOMから削除(残りが詰め直される)
  const dismiss = (id: number) => {
    setToasts((ts) =>
      ts.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    later(
      () => setToasts((ts) => ts.filter((t) => t.id !== id)),
      (reduce ? 0.15 : duration) * 1000
    );
  };

  const spawn = () => {
    const id = ++idRef.current;
    // 溢れる場合は最も古いものを先に退場させる
    const alive = toasts.filter((t) => !t.exiting);
    if (alive.length >= MAX_TOASTS) dismiss(alive[0].id);

    setToasts((ts) => [
      ...ts,
      { id, label: LABELS[id % LABELS.length], entered: reduce, exiting: false },
    ]);
    // 画面外の初期位置を描画してからスライドイン
    if (!reduce) {
      later(
        () =>
          setToasts((ts) =>
            ts.map((t) => (t.id === id ? { ...t, entered: true } : t))
          ),
        30
      );
    }
    later(() => dismiss(id), hold * 1000);
  };

  // 新しいものほど下。indexFromBottom分だけtransformで持ち上げる(詰め直しも滑らか)
  const toastStyle = (t: Toast, indexFromBottom: number): CSSProperties => {
    const x = reduce ? "0%" : t.exiting || !t.entered ? "120%" : "0%";
    return {
      transform: `translate(${x}, ${-indexFromBottom * TOAST_STEP}px)`,
      opacity: t.exiting ? 0 : 1,
      // reduced-motion: スライドさせずフェードのみ
      transition: reduce
        ? "opacity 0.15s linear"
        : `transform ${duration}s ${t.exiting ? EASE_OUT : EASE_IN}, opacity ${duration}s linear`,
    };
  };

  return (
    <DemoStage hint="PC: クリックで通知を発行 / スマホ: タップ(連打でスタック)">
      <button className={styles.spawnBtn} onClick={spawn}>
        NOTIFY
      </button>
      <div className={styles.toastLayer} aria-live="polite">
        {toasts.map((t, i) => (
          <div
            key={t.id}
            className={styles.toast}
            style={toastStyle(t, toasts.length - 1 - i)}
          >
            <span className={styles.dot} aria-hidden />
            {t.label}
          </div>
        ))}
      </div>
    </DemoStage>
  );
}
