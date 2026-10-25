"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./SpeedDial.module.css";

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

// 上から順に並べる。index 0 がいちばん遠い(FAB から最も離れた)項目
const ACTIONS = [
  { label: "電話", icon: "M6.5 3.5h3l1.5 4-2 1.25a9 9 0 0 0 6.25 6.25L16.5 13l4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z" },
  { label: "メール", icon: "M3.5 6.5h17v11h-17Z M3.5 7l8.5 6.5L20.5 7" },
  { label: "共有", icon: "M12 15V3.5 M7.5 8 12 3.5 16.5 8 M5 12.5v6.5h14v-6.5" },
];

const IDLE_WAIT = 2400; // この時間操作が無ければ自走に戻る
const AUTO_OPEN = 2200; // 自走: 開いたまま見せる時間
const AUTO_CLOSED = 1400; // 自走: 閉じたまま待つ時間

export default function SpeedDial({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);

  const openRef = useRef(false);
  const touchedRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  // 最後に操作された時刻はrAFのtimeからだけ確定させる(performance.nowはlintで落ちる)
  const lastInputRef = useRef(-Infinity);
  const nextAutoRef = useRef(0);

  const set = (next: boolean) => {
    openRef.current = next;
    setOpen(next);
  };

  const onFab = () => {
    touchedRef.current = true;
    set(!openRef.current);
  };

  const onAction = () => {
    touchedRef.current = true;
    set(false);
    fabRef.current?.focus();
  };

  // 開いている間だけ: 外側を押す・Escape で閉じる
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      touchedRef.current = true;
      set(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      touchedRef.current = true;
      set(false);
      fabRef.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 無操作のあいだは 開く→閉じる を自走させる。録画のループ動画にも開閉が映る
  useEffect(() => {
    if (reduce) return;
    return addTick((time) => {
      // 最初の自走も IDLE_WAIT 待ってから(読み込み直後にいきなり開かない)
      if (nextAutoRef.current === 0) nextAutoRef.current = time + IDLE_WAIT;
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInputRef.current = time;
        nextAutoRef.current = time + IDLE_WAIT;
        return;
      }
      if (time - lastInputRef.current < IDLE_WAIT) return;
      if (time < nextAutoRef.current) return;
      const next = !openRef.current;
      set(next);
      nextAutoRef.current = time + (next ? AUTO_OPEN : AUTO_CLOSED);
    });
  }, [reduce]);

  const n = ACTIONS.length;
  const vars = {
    "--sd-dur": `${params.duration}s`,
    "--sd-dist": `${params.distance}px`,
  } as CSSProperties;

  return (
    <DemoStage hint="PC / スマホ: 右下の丸いボタンを押すと項目が順に立ち上がる → もう一度・外側・Esc で閉じる(数秒触らなければ自動で繰り返す)">
      <div ref={rootRef} className={`${styles.dial} ${open ? styles.open : ""}`} style={vars}>
        <ul className={styles.items} id="sd-actions" aria-hidden={!open}>
          {ACTIONS.map((a, i) => {
            // FAB に近い順(下から)に出し、閉じるときは遠い順(上から)に引っ込める
            const fromFab = n - 1 - i;
            const delay = (open ? fromFab : i) * params.stagger;
            return (
              <li key={a.label} className={styles.item} style={{ "--sd-delay": `${delay}s` } as CSSProperties}>
                <span className={styles.label}>{a.label}</span>
                <button type="button" className={styles.action} tabIndex={open ? 0 : -1} aria-label={a.label} onClick={onAction}>
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d={a.icon} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
        <button
          ref={fabRef}
          type="button"
          className={styles.fab}
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={open}
          aria-controls="sd-actions"
          onClick={onFab}
        >
          <svg className={styles.plus} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <svg className={styles.close} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </DemoStage>
  );
}
