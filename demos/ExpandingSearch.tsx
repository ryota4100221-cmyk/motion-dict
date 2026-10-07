"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, KeyboardEvent, FocusEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./ExpandingSearch.module.css";

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

const ANCHORS = ["right", "left"] as const;

type Phase = "closed" | "open" | "closing";

// 無操作時の自走(録画用)。触られてから IDLE_AFTER ms は自走しない
const IDLE_AFTER = 4000;
const CLOSED_HOLD = 1400;
const OPEN_HOLD = 1900;

export default function ExpandingSearch({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const anchor = ANCHORS[Math.round(params.anchor)] ?? "right";
  const [phase, setPhase] = useState<Phase>("closed");
  const [query, setQuery] = useState("");

  const phaseRef = useRef<Phase>("closed");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // 閉じ終わったらボタンへフォーカスを戻すか(自走で閉じたときは戻さない)
  const returnFocusRef = useRef(false);
  // 時刻はrAFのtimeだけで確定させる(performance.nowはlintで落ちる)
  const touchedRef = useRef(false);
  const lastInputRef = useRef(-Infinity);
  const nextAutoRef = useRef(-1);

  const set = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const open = (byUser: boolean) => {
    if (phaseRef.current !== "closed") return;
    set("open");
    // 自走で開いたときはフォーカスを奪わない(スマホでキーボードが出るのを避ける)
    if (byUser) requestAnimationFrame(() => inputRef.current?.focus());
  };

  const close = (byUser: boolean) => {
    if (phaseRef.current !== "open") return;
    returnFocusRef.current = byUser;
    setQuery("");
    // reduced-motion では縮むアニメが無いので、そのまま外す
    if (reduce) finishClose();
    else set("closing");
  };

  const finishClose = () => {
    set("closed");
    if (returnFocusRef.current) toggleRef.current?.focus();
    returnFocusRef.current = false;
  };

  const touch = () => {
    touchedRef.current = true;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Escape") close(true);
  };

  // 空のままフォーカスが欄の外へ出たら閉じる
  const onBlur = (e: FocusEvent<HTMLInputElement>) => {
    const to = e.relatedTarget as Node | null;
    if (to && formRef.current?.contains(to)) return;
    if (query === "") close(false);
  };

  useEffect(() => {
    return addTick((time) => {
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInputRef.current = time;
        nextAutoRef.current = -1;
      }
      if (reduce) return;
      if (time - lastInputRef.current < IDLE_AFTER) return;
      // 入力欄に人がフォーカスしている間は自走で閉じない
      if (document.activeElement === inputRef.current) return;
      const cur = phaseRef.current;
      if (cur === "closing") return;
      if (nextAutoRef.current < 0) {
        nextAutoRef.current = time + (cur === "open" ? OPEN_HOLD : CLOSED_HOLD);
        return;
      }
      if (time < nextAutoRef.current) return;
      nextAutoRef.current = -1;
      if (cur === "closed") open(false);
      else close(false);
    });
    // open / close は ref 経由で状態を読むので依存に入れない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const vars = {
    "--dur": `${params.duration}s`,
    "--start": `${params.startWidth}px`,
  } as CSSProperties;

  return (
    <DemoStage hint="PC: 虫眼鏡をクリック、Esc か × で閉じる / スマホ: 虫眼鏡をタップ、× で閉じる">
      <div className={styles.wrap} style={vars} onPointerDown={touch} onKeyDown={touch}>
        <div className={styles.bar} data-anchor={anchor}>
          <span className={styles.logo} aria-hidden>
            motion
          </span>
          <span className={styles.nav} aria-hidden>
            <span>Work</span>
            <span>About</span>
            <span>Journal</span>
          </span>
          <button
            ref={toggleRef}
            type="button"
            className={styles.toggle}
            aria-label="検索を開く"
            aria-expanded={phase === "open"}
            aria-controls="expanding-search-form"
            onClick={() => open(true)}
          >
            <SearchIcon />
          </button>

          {phase !== "closed" && (
            <form
              ref={formRef}
              id="expanding-search-form"
              role="search"
              className={styles.form}
              data-phase={phase}
              onSubmit={(e) => e.preventDefault()}
              onKeyDown={onKeyDown}
              onAnimationEnd={(e) => {
                if (e.target === e.currentTarget && phaseRef.current === "closing") finishClose();
              }}
            >
              <span className={styles.formIcon} aria-hidden>
                <SearchIcon />
              </span>
              <label htmlFor="expanding-search-input" className={styles.srOnly}>
                サイト内を検索
              </label>
              <input
                ref={inputRef}
                id="expanding-search-input"
                className={styles.input}
                type="search"
                placeholder="Search motions…"
                value={query}
                autoComplete="off"
                onChange={(e) => setQuery(e.target.value)}
                onBlur={onBlur}
              />
              <button
                type="button"
                className={styles.close}
                aria-label="検索を閉じる"
                onClick={() => close(true)}
              >
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </form>
          )}
        </div>
        <p className={styles.caption} aria-hidden>
          {phase}
        </p>
      </div>
    </DemoStage>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </svg>
  );
}
