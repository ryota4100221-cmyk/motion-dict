"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ThemeToggleTransition.module.css";

type Theme = "light" | "dark";
type Sweep = { from: Theme; to: Theme; id: number };

const IDLE_REST = 1.6; // 無操作時の自動切替の間隔(s)。録画・ポスター用の自走
const TOUCH_REST = 5; // 触った後は自動切替を待たせる(s)

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

// 1テーマ分の「ページ」。旧テーマ(下)と新テーマ(上)の2枚を重ねて使う
function MockPage({ theme }: { theme: Theme }) {
  return (
    <div className={`${styles.page} ${theme === "dark" ? styles.dark : styles.light}`}>
      <div className={styles.header}>
        <span className={styles.logo} />
        <span className={styles.nav} />
        <span className={styles.nav} />
        <span className={styles.nav} />
      </div>
      <div className={styles.body}>
        <div className={styles.copy}>
          <span className={styles.title}>Aspen</span>
          <span className={styles.line} />
          <span className={`${styles.line} ${styles.short}`} />
        </div>
        <div className={styles.card} />
      </div>
    </div>
  );
}

export default function ThemeToggleTransition({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [theme, setTheme] = useState<Theme>("light");
  const [sweep, setSweep] = useState<Sweep | null>(null);
  const [toggles, setToggles] = useState(0);
  const byUserRef = useRef(false);

  const duration = params.duration;
  const circle = Math.round(params.shape) === 1;
  const flip = Math.round(params.direction) === 0;

  // 表示上の現在テーマ(遷移中は塗り広げている側)
  const current: Theme = sweep ? sweep.to : theme;

  const toggle = (byUser: boolean) => {
    byUserRef.current = byUser;
    const next: Theme = current === "light" ? "dark" : "light";
    setToggles((n) => n + 1);
    if (reduce) {
      // reduced-motion: トランジションなしで即時切替
      setSweep(null);
      setTheme(next);
      return;
    }
    // 遷移中に押されたら、進行中の塗りを確定させてから次を始める
    setTheme(current);
    setSweep({ from: current, to: next, id: toggles + 1 });
  };

  // 無操作時の自走(ポインタが無い録画でも動きが映るように)
  useEffect(() => {
    if (reduce) return;
    const rest = byUserRef.current ? TOUCH_REST : IDLE_REST;
    const t = window.setTimeout(() => toggle(false), (duration + rest) * 1000);
    return () => window.clearTimeout(t);
    // toggle は毎レンダー作り直されるので、切替回数と設定だけを依存にする
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggles, reduce, duration]);

  const sweepClass = circle
    ? styles.sweepCircle
    : !flip || sweep?.to === "dark"
      ? styles.sweepLtr
      : styles.sweepRtl;

  const overlayStyle = { "--dur": `${duration}s` } as CSSProperties;

  return (
    <DemoStage hint="PC: 右上のボタンをクリック / スマホ: タップ">
      <div className={styles.frame}>
        <MockPage theme={sweep ? sweep.from : theme} />
        {sweep && (
          <div
            key={sweep.id}
            className={`${styles.overlay} ${sweepClass}`}
            style={overlayStyle}
            onAnimationEnd={() => {
              setTheme(sweep.to);
              setSweep(null);
            }}
          >
            <MockPage theme={sweep.to} />
          </div>
        )}
        <button
          type="button"
          className={`${styles.toggle} ${current === "dark" ? styles.toggleDark : ""}`}
          aria-label="テーマを切り替える"
          aria-pressed={current === "dark"}
          onClick={() => toggle(true)}
        >
          <span className={styles.ring} />
          <span className={styles.dot} />
        </button>
      </div>
    </DemoStage>
  );
}
