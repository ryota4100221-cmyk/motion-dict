"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./LikeBurst.module.css";

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

const IDLE_WAIT = 2400; // この時間操作が無ければ自走に戻る
const AUTO_ON = 1600; // 自走: ONのまま見せる時間
const AUTO_OFF = 700; // 自走: OFFに戻して待つ時間
const BASE_COUNT = 128;

const HEART =
  "M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.6 4.5c2.1 0 3.6 1.2 5.4 3.2 1.8-2 3.3-3.2 5.4-3.2 3.6 0 5.7 3.7 4.2 7.2C19.5 16.4 12 21 12 21z";

export default function LikeBurst({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(false);
  // ONにするたび増やし、円と粒をkeyで作り直して頭から再生させる
  const [burstId, setBurstId] = useState(0);

  const activeRef = useRef(false);
  const touchedRef = useRef(false);
  // 最後に操作された時刻はrAFのtimeからだけ確定させる(performance.nowはlintで落ちる)
  const lastInputRef = useRef(-Infinity);
  const nextAutoRef = useRef(0);

  const count = Math.round(params.count);
  const spread = params.spread;
  const duration = params.duration;
  const startScale = params.startScale;

  const toggle = () => {
    const next = !activeRef.current;
    activeRef.current = next;
    setActive(next);
    if (next) setBurstId((n) => n + 1);
  };

  const onPress = () => {
    touchedRef.current = true;
    toggle();
  };

  // 無操作のあいだは ON(弾ける)→OFF を自走させる。録画のループ動画にも弾けが映る
  useEffect(() => {
    if (reduce) return;
    return addTick((time) => {
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInputRef.current = time;
        nextAutoRef.current = time + IDLE_WAIT;
        return;
      }
      if (time - lastInputRef.current < IDLE_WAIT) return;
      if (time < nextAutoRef.current) return;
      toggle();
      nextAutoRef.current = time + (activeRef.current ? AUTO_ON : AUTO_OFF);
    });
  }, [reduce]);

  // 尺を変えても3層の区間の比率は観察元(円0〜60% / ハート40〜70% / 粒20〜100%)のまま
  const vars = {
    "--dur": `${duration}s`,
    "--spread": `${spread}px`,
    "--start": String(startScale),
  } as CSSProperties;

  const angles = Array.from({ length: count }, (_, i) => (360 / count) * i);

  return (
    <DemoStage hint="PC: ハートをクリック / スマホ: タップ(ONの瞬間だけ弾ける)">
      <div className={styles.field} style={vars}>
        <button
          type="button"
          className={`${styles.button} ${active ? styles.on : ""}`}
          aria-pressed={active}
          aria-label="いいね"
          onClick={onPress}
        >
          <span className={styles.icon}>
            {active && !reduce && (
              <span key={`burst-${burstId}`} className={styles.burst} aria-hidden>
                <span className={styles.circle} />
                {angles.map((a) => (
                  <span key={a}>
                    <span
                      className={`${styles.particle} ${styles.big}`}
                      style={{ "--angle": `${a}deg` } as CSSProperties}
                    />
                    <span
                      className={`${styles.particle} ${styles.small}`}
                      style={{ "--angle": `${a + 10}deg` } as CSSProperties}
                    />
                  </span>
                ))}
              </span>
            )}
            <svg
              key={active && !reduce ? `heart-${burstId}` : "heart-idle"}
              className={`${styles.heart} ${active && !reduce ? styles.pop : ""}`}
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path d={HEART} />
            </svg>
          </span>
          <span className={styles.count}>{BASE_COUNT + (active ? 1 : 0)}</span>
        </button>
      </div>
    </DemoStage>
  );
}
