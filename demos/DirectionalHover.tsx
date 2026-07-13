"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./DirectionalHover.module.css";

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

const CARDS = ["SPEEDSTER", "ROADSTER", "TECHNOLOGY", "OWNERSHIP"];

type Edge = { x: number; y: number };

// カーソルと4辺の距離を比べ、最も近い辺の「外側」へのオフセット(±101%)を返す。
// これが方向連動ホバーの本体：入った辺＝塗りの出発点になる。
function nearestEdge(el: HTMLElement, clientX: number, clientY: number): Edge {
  const r = el.getBoundingClientRect();
  const left = clientX - r.left;
  const top = clientY - r.top;
  const right = r.width - left;
  const bottom = r.height - top;
  const min = Math.min(left, right, top, bottom);
  if (min === top) return { x: 0, y: -101 }; // 上辺が最近→上から流れ込む
  if (min === bottom) return { x: 0, y: 101 }; // 下辺
  if (min === left) return { x: -101, y: 0 }; // 左辺
  return { x: 101, y: 0 }; // 右辺
}

export default function DirectionalHover({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const paramsRef = useRef(params);
  // 進入辺をカードごとに覚えておき、leaveMode=「入った辺へ戻す」で使う
  const entryRef = useRef<WeakMap<HTMLElement, Edge>>(new WeakMap());

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const dur = () => paramsRef.current.duration;
  const leaveToEntry = () => Math.round(paramsRef.current.leaveMode) === 1;

  const getFill = (item: HTMLElement) =>
    item.querySelector<HTMLElement>(`.${styles.fill}`);

  function handleEnter(e: ReactMouseEvent<HTMLButtonElement>) {
    if (reduce) return;
    const item = e.currentTarget;
    const fill = getFill(item);
    if (!fill) return;
    const edge = nearestEdge(item, e.clientX, e.clientY);
    entryRef.current.set(item, edge);
    // 一旦その辺の外へ退避（トランジション無し）→ 次フレームで0へ流し込む
    fill.style.transition = "none";
    fill.style.transform = `translate(${edge.x}%, ${edge.y}%)`;
    void fill.offsetWidth; // 強制リフローで退避位置を確定させる
    fill.style.transition = `transform ${dur()}s cubic-bezier(.3,.7,.2,1)`;
    fill.style.transform = "translate(0%, 0%)";
  }

  function handleLeave(e: ReactMouseEvent<HTMLButtonElement>) {
    if (reduce) return;
    const item = e.currentTarget;
    const fill = getFill(item);
    if (!fill) return;
    const exit = nearestEdge(item, e.clientX, e.clientY);
    const target = leaveToEntry() ? entryRef.current.get(item) ?? exit : exit;
    fill.style.transition = `transform ${dur()}s cubic-bezier(.5,.1,.7,.4)`;
    fill.style.transform = `translate(${target.x}%, ${target.y}%)`;
  }

  // タッチは辺判定ができないので、下辺からの流し込みをトグルするフォールバック
  function handleTap(e: ReactTouchEvent<HTMLButtonElement>) {
    const item = e.currentTarget;
    const fill = getFill(item);
    if (!fill) return;
    const on = item.dataset.on === "1";
    item.dataset.on = on ? "0" : "1";
    fill.style.transition = reduce ? "none" : `transform ${dur()}s cubic-bezier(.3,.7,.2,1)`;
    fill.style.transform = on ? "translate(0%, 101%)" : "translate(0%, 0%)";
  }

  return (
    <DemoStage hint="PC: カードの各辺からホバー / スマホ: タップで表示">
      <div className={styles.grid}>
        {CARDS.map((label) => (
          <button
            key={label}
            type="button"
            className={styles.item}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            onTouchStart={handleTap}
          >
            {/* reduce時は薄い定常オーバーレイを常時表示（スライドなし） */}
            <span
              className={styles.fill}
              style={reduce ? { transform: "translate(0%,0%)", opacity: 0.22 } : undefined}
              aria-hidden
            />
            <span className={styles.label}>{label}</span>
          </button>
        ))}
      </div>
    </DemoStage>
  );
}
