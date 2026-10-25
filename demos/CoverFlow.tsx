"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./CoverFlow.module.css";

// ジャケット＝写真（public/demo/photo-XX.jpg）。文字が読めるように下へ濃くなる暗幕を重ねる
const photo = (n: number) =>
  `linear-gradient(180deg, rgba(10,10,10,0.05) 40%, rgba(10,10,10,0.6) 100%), url("/motion-dict/demo/photo-${String(n).padStart(2, "0")}.jpg") center / cover`;

const COVERS = [
  { title: "EASE", bg: photo(1) },
  { title: "STAGGER", bg: photo(4) },
  { title: "SCRUB", bg: photo(6) },
  { title: "SPRING", bg: photo(7) },
  { title: "MORPH", bg: photo(9) },
  { title: "REVEAL", bg: photo(14) },
  { title: "PARALLAX", bg: photo(16) },
  { title: "GLITCH", bg: photo(17) },
  { title: "ORBIT", bg: photo(1) },
];

// 中央の隣(|o|=1)のカードまでの横距離。ここから先は spacing で重ねる
const NEIGHBOR_X = 132;
// 平らな横並び(reduced-motion)のときの1枚ぶんの距離
const FLAT_X = 156;
// ドラッグでこの距離動かすと1枚ぶん送る
const DRAG_PX = 110;
const TAP_PX = 5;
// 触ってから自動送りを再開するまで
const IDLE_MS = 2500;
// 自動送りで1枚送ったあとの静止時間
const HOLD_MS = 900;

const LAST = COVERS.length - 1;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export default function CoverFlow({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();

  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const paramsRef = useRef(params);
  const reduceRef = useRef(reduce);

  const posRef = useRef(Math.floor(LAST / 2)); // 今の位置(枚数・小数)
  const targetRef = useRef(Math.floor(LAST / 2));
  const fromRef = useRef(0);
  const startRef = useRef(0);
  const pendingRef = useRef(true); // 新しい送り先が決まったらtickで開始時刻を確定する
  const animatingRef = useRef(false);

  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartPosRef = useRef(0);
  const movedRef = useRef(0);
  const capturedRef = useRef(false);

  const touchedRef = useRef(false);
  const lastInputRef = useRef(-Infinity);
  const lastStepRef = useRef(0);
  const dirRef = useRef(1);

  useEffect(() => {
    paramsRef.current = params;
    reduceRef.current = reduce;
  }, [params, reduce]);

  useEffect(() => {
    return addTick((time) => {
      const { angle, spacing, depth, duration } = paramsRef.current;
      const still = reduceRef.current;
      const durMs = duration * 1000;

      // 操作時刻はrAFのtimeで確定する
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInputRef.current = time;
      }

      // 無操作が続いたら端で折り返しながら1枚ずつ送る(録画でも動きが映るように)
      if (
        !still &&
        !draggingRef.current &&
        !animatingRef.current &&
        !pendingRef.current &&
        time - lastInputRef.current > IDLE_MS &&
        time - lastStepRef.current > durMs + HOLD_MS
      ) {
        if (targetRef.current + dirRef.current > LAST || targetRef.current + dirRef.current < 0) {
          dirRef.current *= -1;
        }
        targetRef.current += dirRef.current;
        pendingRef.current = true;
      }

      if (pendingRef.current) {
        pendingRef.current = false;
        fromRef.current = posRef.current;
        startRef.current = time;
        lastStepRef.current = time;
        animatingRef.current = true;
      }

      if (animatingRef.current && !draggingRef.current) {
        const k = still || durMs === 0 ? 1 : clamp((time - startRef.current) / durMs, 0, 1);
        const eased = 1 - Math.pow(1 - k, 3); // ease-out
        posRef.current = fromRef.current + (targetRef.current - fromRef.current) * eased;
        if (k >= 1) animatingRef.current = false;
      }

      const pos = posRef.current;
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const o = i - pos;
        const a = Math.abs(o);
        const s = Math.sign(o);
        const near = Math.min(a, 1); // 0〜1枚の間だけ角度と沈みを補間する

        let x: number;
        let rot = 0;
        let z = 0;
        if (still) {
          x = o * FLAT_X;
        } else {
          x = a <= 1 ? o * NEIGHBOR_X : s * (NEIGHBOR_X + (a - 1) * spacing);
          // 右のカードは+、左は−。中央側の辺が手前に来て内向きに見える
          rot = s * near * angle;
          z = -near * depth;
        }

        el.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${rot}deg)`;
        el.style.zIndex = String(100 - Math.round(a * 10));
        // 中央以外を暗くし、奥ほど少しずつ沈める
        el.style.setProperty("--shade", String(Math.min(0.78, near * 0.5 + Math.max(0, a - 1) * 0.07)));
        el.style.opacity = String(clamp(6 - a, 0, 1));
        el.dataset.active = a < 0.5 ? "true" : "false";
      });
    });
  }, []);

  function goTo(i: number) {
    targetRef.current = clamp(i, 0, LAST);
    pendingRef.current = true;
    touchedRef.current = true;
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    animatingRef.current = false;
    dragStartXRef.current = e.clientX;
    dragStartPosRef.current = posRef.current;
    movedRef.current = 0;
    touchedRef.current = true;
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const dx = e.clientX - dragStartXRef.current;
    movedRef.current = Math.max(movedRef.current, Math.abs(dx));
    // 押した瞬間に捕捉するとカードのclickが吸われるので、動いてから掴む
    if (movedRef.current > TAP_PX && !capturedRef.current) {
      capturedRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    // 指に1:1で追従。端は少しだけはみ出させて行き止まりを伝える
    posRef.current = clamp(dragStartPosRef.current - dx / DRAG_PX, -0.35, LAST + 0.35);
    touchedRef.current = true;
  }

  function onPointerUp() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    capturedRef.current = false;
    if (movedRef.current > TAP_PX) goTo(Math.round(posRef.current));
  }

  function onKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(targetRef.current + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(targetRef.current - 1);
    }
  }

  function onCardClick(i: number) {
    if (movedRef.current > TAP_PX) return; // ドラッグの流れなら選択しない
    goTo(i);
  }

  return (
    <DemoStage hint="PC: 左右にドラッグ / ←→キー / カードをクリック ・ スマホ: スワイプ・タップ">
      <div
        className={styles.field}
        role="group"
        aria-label="カバーフロー"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <div className={styles.scene}>
          {COVERS.map((c, i) => (
            <button
              key={c.title}
              type="button"
              tabIndex={-1}
              aria-label={`${i + 1}枚目 ${c.title}`}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className={styles.card}
              style={{ "--cover": c.bg } as CSSProperties}
              onClick={() => onCardClick(i)}
            >
              <span className={styles.art}>
                <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.title}>{c.title}</span>
              </span>
              <span className={styles.shade} aria-hidden />
              <span className={styles.mirror} aria-hidden />
            </button>
          ))}
        </div>
        <div className={styles.floor} aria-hidden />
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
