"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./BottomSheet.module.css";

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

const ROWS = [
  { term: "Bottom sheet", note: "ui" },
  { term: "Drawer slide", note: "ui" },
  { term: "Swipe to dismiss", note: "ui" },
  { term: "Toast slide", note: "ui" },
];

const IDLE_WAIT = 1600; // この時間操作が無ければ自走に戻る
const AUTO_PULL = 450; // 自走: 引き下ろしにかける時間(ms)
const AUTO_HOLD = 280; // 自走: 引いたまま離すまでの溜め(ms)
// 自走の段取り。開く→少しだけ引いて戻る→大きく引いて閉じる→閉じたまま待つ
// reach は threshold に対する倍率、wait はその段の後に置く間(ms)
const AUTO_STEPS = [
  { kind: "open", reach: 0, wait: 1100 },
  { kind: "pull", reach: 0.55, wait: 900 },
  { kind: "pull", reach: 1.5, wait: 1300 },
] as const;

export default function BottomSheet({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [grabbing, setGrabbing] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const openBtnRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef(false);

  // ドラッグ量はrefで持ち、毎フレームDOMへ直接書く(指に1:1で付いてくる区間)
  const dyRef = useRef(0);
  const draggingRef = useRef(false);
  const startYRef = useRef(0);

  const touchedRef = useRef(false);
  // 最後に操作された時刻はrAFのtimeからだけ確定させる(performance.nowはlintで落ちる)
  const lastInputRef = useRef(-Infinity);
  const autoRef = useRef(0); // AUTO_STEPS のどこを演じているか
  const autoStartRef = useRef(-Infinity);
  const autoPullRef = useRef(false); // 自走が引き下ろしを演じている最中か

  const threshold = Math.round(params.threshold);

  const set = (next: boolean) => {
    openRef.current = next;
    setOpen(next);
  };

  // 離した瞬間の判定。インラインの transition/transform を外すと CSS の transition に戻り、
  // 閉じるなら今の位置から translateY(100%) へ、戻るなら 0 へ流れる(観察元と同じ作り)
  const release = () => {
    const sheet = sheetRef.current;
    const dy = dyRef.current;
    draggingRef.current = false;
    dyRef.current = 0;
    setGrabbing(false);
    if (sheet) {
      sheet.style.transition = "";
      sheet.style.transform = "";
    }
    if (dy > threshold) set(false);
  };
  const releaseRef = useRef(release);
  useEffect(() => {
    releaseRef.current = release;
  });

  useEffect(() => {
    return addTick((time) => {
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInputRef.current = time;
        autoStartRef.current = -Infinity;
        // 自走の引き下ろし途中で触られたら、書きかけのインライン指定を外して CSS に戻す
        if (autoPullRef.current && !draggingRef.current && sheetRef.current) {
          sheetRef.current.style.transition = "";
          sheetRef.current.style.transform = "";
        }
        autoPullRef.current = false;
      }

      // シートのノードは毎フレーム引き直す(開閉で再レンダーされても外れたノードへ書かない)
      const sheet = sheetRef.current;

      if (!reduce && !draggingRef.current && time - lastInputRef.current > IDLE_WAIT) {
        if (autoStartRef.current === -Infinity) autoStartRef.current = time;
        const step = AUTO_STEPS[autoRef.current % AUTO_STEPS.length];
        const at = time - autoStartRef.current;

        if (step.kind === "open") {
          if (at >= 0 && !openRef.current) set(true);
          if (at >= step.wait) {
            autoRef.current += 1;
            autoStartRef.current = time;
          }
        } else {
          const goal = threshold * step.reach;
          if (at < AUTO_PULL + AUTO_HOLD) {
            // 自走の途中で閉じられていたら、開く段からやり直す
            if (!openRef.current) {
              autoRef.current = 0;
              autoStartRef.current = time;
              return;
            }
            autoPullRef.current = true;
            const t = Math.min(1, at / AUTO_PULL);
            dyRef.current = goal * (1 - Math.pow(1 - t, 3));
            if (sheet) {
              sheet.style.transition = "none";
              sheet.style.transform = `translateY(${dyRef.current}px)`;
            }
          } else if (autoPullRef.current) {
            autoPullRef.current = false;
            releaseRef.current();
          } else if (at >= AUTO_PULL + AUTO_HOLD + step.wait) {
            autoRef.current += 1;
            autoStartRef.current = time;
          }
        }
        return;
      }

      if (draggingRef.current && sheet) {
        sheet.style.transition = "none";
        sheet.style.transform = `translateY(${dyRef.current}px)`;
      }
    });
  }, [reduce, threshold]);

  // 開いている間だけ Escape で閉じる
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      touchedRef.current = true;
      set(false);
      openBtnRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function onOpen() {
    touchedRef.current = true;
    set(true);
  }

  function onClose() {
    touchedRef.current = true;
    set(false);
    openBtnRef.current?.focus();
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!openRef.current) return;
    // ×ボタンの上では掴まない
    if ((e.target as HTMLElement).closest("button")) return;
    touchedRef.current = true;
    draggingRef.current = true;
    startYRef.current = e.clientY;
    dyRef.current = 0;
    setGrabbing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    touchedRef.current = true;
    // 下向きだけ指に付いてくる。上へは動かさない
    dyRef.current = Math.max(0, e.clientY - startYRef.current);
  }

  function onPointerUp() {
    if (!draggingRef.current) return;
    touchedRef.current = true;
    release();
  }

  const vars = {
    "--bs-dur": reduce ? "0s" : `${params.duration}s`,
    "--bs-h": `${params.height}%`,
    "--bs-scrim": String(params.scrim),
  } as CSSProperties;

  return (
    <DemoStage hint="PC / スマホ: Open index で開く → 上の取っ手を下へ引いて離す(届かなければ戻る)・黒幕・× で閉じる(数秒触らなければ自動で繰り返す)">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        data-md-bleed=""
        className={styles.photo}
        src="/motion-dict/demo/photo-08.jpg"
        alt=""
        draggable={false}
      />
      <div className={`${styles.screen} ${open ? styles.open : ""}`} style={vars}>
        <div className={styles.page}>
          <p className={styles.folio}>Plate 08 — Glossary</p>
          <button
            ref={openBtnRef}
            type="button"
            className={styles.openBtn}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={onOpen}
          >
            Open index
          </button>
        </div>

        <div className={styles.scrim} onClick={onClose} aria-hidden />

        <div
          ref={sheetRef}
          className={styles.sheet}
          role="dialog"
          aria-modal="true"
          aria-label="Index"
          aria-hidden={!open}
        >
          <div
            className={`${styles.grip} ${grabbing ? styles.grabbing : ""}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <span className={styles.grabber} aria-hidden />
            <div className={styles.head}>
              <span className={styles.title}>Index</span>
              <span className={styles.edge} aria-hidden>
                release past {threshold}px to close
              </span>
              <button
                type="button"
                className={styles.close}
                aria-label="Close index"
                tabIndex={open ? 0 : -1}
                onClick={onClose}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
          <ul className={styles.list}>
            {ROWS.map((r, i) => (
              <li key={r.term} className={styles.row}>
                <span className={styles.num}>0{i + 1}</span>
                <span className={styles.term}>{r.term}</span>
                <span className={styles.note}>{r.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DemoStage>
  );
}
