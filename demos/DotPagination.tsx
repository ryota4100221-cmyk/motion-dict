"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./DotPagination.module.css";

const COUNT = 15;
// 点の中心間の距離(px)。トラックはこの整数倍だけ送る
const PITCH = 18;
// 無操作のときに自走で送る間隔(ms)。録画やプレビューでも窓が動いて見えるように
const IDLE_STEP = 1100;
// 触ってから自走に戻るまでの猶予(ms)
const IDLE_AFTER = 3200;

export default function DotPagination({ params }: { params: ParamValues }) {
  const visible = Math.min(Math.round(params.visible), COUNT);
  const reduce = useReducedMotion();

  const [active, setActive] = useState(0);
  // 弾みを頭から再生し直すための通し番号。点のkeyに混ぜる
  const [blipId, setBlipId] = useState(0);

  const state = useRef({ active: 0, dir: 1, last: 0, lastInput: -Infinity, reduce: false });
  const touchedRef = useRef(false);
  const swipeX = useRef<number | null>(null);

  useEffect(() => {
    state.current.reduce = reduce;
  }, [reduce]);

  const go = (next: number) => {
    const i = Math.max(0, Math.min(COUNT - 1, next));
    state.current.active = i;
    setActive(i);
    setBlipId((n) => n + 1);
  };

  const touch = () => {
    touchedRef.current = true;
  };

  // 無操作なら端で折り返しながら1枚ずつ送る。時刻はrAFのtimeだけで扱う
  useEffect(() => {
    return addTick((time) => {
      const s = state.current;
      if (touchedRef.current) {
        touchedRef.current = false;
        s.lastInput = time;
        s.last = time;
      }
      if (s.reduce) return;
      if (s.last === 0) {
        s.last = time;
        return;
      }
      if (time - s.lastInput < IDLE_AFTER || time - s.last < IDLE_STEP) return;
      s.last = time;
      if (s.active + s.dir > COUNT - 1 || s.active + s.dir < 0) s.dir *= -1;
      const next = s.active + s.dir;
      s.active = next;
      setActive(next);
      setBlipId((n) => n + 1);
    });
  }, []);

  // 現在地が窓の中央に来る位置を、窓が端から飛び出さないようclampする
  const start = Math.min(Math.max(Math.round(active - (visible - 1) / 2), 0), COUNT - visible);
  const end = start + visible - 1;

  const trackStyle: CSSProperties = {
    transform: `translateX(${-start * PITCH}px)`,
    transition: reduce ? "none" : `transform ${params.slide}s cubic-bezier(0.16, 1, 0.3, 1)`,
  };
  const viewportStyle = {
    width: `${visible * PITCH}px`,
    "--dp-blip": params.blip,
  } as CSSProperties;

  const scaleOf = (i: number) => {
    if (i < start || i > end) return 0;
    // 窓の外にまだ点があるときだけ端を縮める。最初と最後の点は縮めない
    if ((i === start && start > 0) || (i === end && end < COUNT - 1)) return params.edge;
    return 1;
  };

  return (
    <DemoStage hint="PC: 点・矢印をクリック / スマホ: カードを左右にスワイプ・点をタップ(触らなければ自動で送る)">
      <div className={styles.wrap} onPointerDown={touch}>
        <div
          className={styles.card}
          onPointerDown={(e) => {
            swipeX.current = e.clientX;
          }}
          onPointerUp={(e) => {
            if (swipeX.current === null) return;
            const dx = e.clientX - swipeX.current;
            swipeX.current = null;
            if (Math.abs(dx) > 30) go(active + (dx < 0 ? 1 : -1));
          }}
          onPointerCancel={() => {
            swipeX.current = null;
          }}
        >
          <span className={styles.num}>{String(active + 1).padStart(2, "0")}</span>
          <span className={styles.cap}>/ {COUNT}</span>
        </div>

        <div className={styles.bar}>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => go(active - 1)}
            disabled={active === 0}
            aria-label="前へ"
          >
            ‹
          </button>

          <div className={styles.viewport} style={viewportStyle}>
            <div className={styles.track} style={trackStyle}>
              {Array.from({ length: COUNT }, (_, i) => {
                const current = i === active;
                const inWindow = i >= start && i <= end;
                return (
                  <button
                    key={i}
                    type="button"
                    className={styles.dot}
                    onClick={() => go(i)}
                    aria-label={`${i + 1}枚目`}
                    aria-current={current ? "true" : undefined}
                    tabIndex={inWindow ? 0 : -1}
                    aria-hidden={!inWindow}
                  >
                    <span
                      className={styles.scale}
                      style={{
                        transform: `scale(${scaleOf(i)})`,
                        transition: reduce
                          ? "none"
                          : `transform ${params.slide}s cubic-bezier(0.16, 1, 0.3, 1)`,
                      }}
                    >
                      <span
                        key={current ? `blip-${blipId}` : `idle-${i}`}
                        className={
                          current && !reduce ? `${styles.fill} ${styles.blip}` : styles.fill
                        }
                        data-current={current ? "true" : undefined}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            className={styles.arrow}
            onClick={() => go(active + 1)}
            disabled={active === COUNT - 1}
            aria-label="次へ"
          >
            ›
          </button>
        </div>
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
