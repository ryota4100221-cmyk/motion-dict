"use client";

import { useEffect, useRef, useSyncExternalStore, type PointerEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./XrayLens.module.css";

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

const MOVE_CANCEL = 12; // 長押し判定中にこれ以上動いたらドラッグとみなして開かない(px)
const AUTO_AFTER = 2500; // 最後に押してからこの時間が経つと自走を再開する(ms)
const SWEEP = 2600; // 自走で1行をなぞる時間(ms)。観察元の初回デモと同じ
const REST = 1300; // なぞり終えてから次の行までレンズを閉じておく時間(ms)
const ARC = 18; // なぞる途中で上へふくらませる量(px)
// 自走でなぞる行(カードの高さに対する割合)。見出し→本文→画像の順に覗く
const ROWS = [0.3, 0.5, 0.72];

// 表と裏で同じ並びを使う。裏だけが寸法のラベルを持つ
const BLOCKS = [
  { key: "eyebrow", text: "CASE 07", note: "label 11px / 0.14em" },
  { key: "title", text: "見えない設計を、見る。", note: "h3 22/28px" },
  {
    key: "body",
    text: "文字の大きさ、行の長さ、余白の比率。仕上がった画面の裏には、決めた数字が残っている。",
    note: "p 13/20px · 27字/行",
  },
  { key: "media", text: "", note: "img 356×52 · r 6px" },
  { key: "button", text: "詳しく見る", note: "button 34px" },
] as const;

type Pointer = {
  x: number;
  y: number;
  inside: boolean;
  down: boolean;
  downAt: number; // pointerdown の e.timeStamp(rAF の time と同じ時間軸)
  startX: number;
  startY: number;
  moved: boolean;
  lastPress: number;
  touch: boolean;
};

export default function XrayLens({ params }: { params: ParamValues }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const coordRef = useRef<HTMLSpanElement>(null);
  const paramsRef = useRef(params);
  // イベントでは座標と押下状態を保存するだけ。判定と描画は rAF 側で行う
  const pointerRef = useRef<Pointer>({
    x: 0,
    y: 0,
    inside: false,
    down: false,
    downAt: 0,
    startX: 0,
    startY: 0,
    moved: false,
    lastPress: -Infinity,
    touch: false,
  });
  const reduce = useReducedMotion();

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    let x = -1;
    let y = -1;
    let r = 0;
    let autoStart: number | null = null;
    let row = 0;

    return addTick((time) => {
      // ノードは入れ替わることがあるので毎フレーム引き直す
      const card = cardRef.current;
      const back = backRef.current;
      const ring = ringRef.current;
      const coord = coordRef.current;
      if (!card || !back || !ring) return;

      const { radius, follow, open, hold } = paramsRef.current;
      const w = card.clientWidth;
      const h = card.clientHeight;
      const p = pointerRef.current;
      if (x < 0) {
        x = w * 0.5;
        y = h * 0.5;
      }

      // 長押し判定。タッチは誤爆が多いので待ちを長めにとる(観察元は 170ms → 380ms)
      const wait = p.touch ? Math.max(hold, 380) : hold;
      const userHeld = p.down && !p.moved && time - p.downAt >= wait;

      let tx = p.x;
      let ty = p.y;
      let held = userHeld;

      if (reduce) {
        // 補間なし。触っていない間は中央に開いた1枚だけを見せる
        if (!p.down && !p.inside) {
          tx = w * 0.5;
          ty = h * 0.52;
          held = true;
        }
      } else if (!p.down && time - p.lastPress > AUTO_AFTER) {
        // 自走: 1行を左から右へ、上にふくらむ弧でなぞってから閉じる
        if (autoStart === null) autoStart = time;
        const t = time - autoStart;
        if (t > SWEEP + REST) {
          autoStart = time;
          row = (row + 1) % ROWS.length;
        }
        const k = Math.min(1, (time - autoStart) / SWEEP);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        tx = w * (0.18 + 0.64 * e);
        ty = h * ROWS[row] - ARC * Math.sin(e * Math.PI);
        held = time - autoStart < SWEEP;
      } else {
        autoStart = null;
        if (!p.inside && !p.down) {
          tx = x;
          ty = y;
        }
      }

      const goal = held ? radius : 0;
      if (reduce) {
        r = goal;
        x = tx;
        y = ty;
      } else {
        r += (goal - r) * open;
        if (Math.abs(goal - r) < 0.3) r = goal;
        x += (tx - x) * follow;
        y += (ty - y) * follow;
      }

      back.style.clipPath = `circle(${r.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px)`;
      const show = r > 1;
      ring.style.opacity = show ? "1" : "0";
      ring.style.width = ring.style.height = `${(r * 2).toFixed(1)}px`;
      ring.style.transform = `translate3d(${(x - r).toFixed(1)}px, ${(y - r).toFixed(1)}px, 0)`;
      if (coord && show) coord.textContent = `x ${Math.round(x)}  y ${Math.round(y)}`;
    });
  }, [reduce]);

  const local = (clientX: number, clientY: number) => {
    const card = cardRef.current;
    if (!card) return { x: 0, y: 0 };
    const rect = card.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const p = pointerRef.current;
    const { x, y } = local(e.clientX, e.clientY);
    Object.assign(p, {
      x,
      y,
      inside: true,
      down: true,
      downAt: e.timeStamp,
      startX: x,
      startY: y,
      moved: false,
      lastPress: e.timeStamp,
      touch: e.pointerType !== "mouse",
    });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = pointerRef.current;
    const { x, y } = local(e.clientX, e.clientY);
    p.x = x;
    p.y = y;
    p.inside = true;
    // 開く前に大きく動いたらドラッグとして諦める(開いた後は自由に動かせる)
    if (p.down && e.timeStamp - p.downAt < paramsRef.current.hold) {
      if (Math.hypot(x - p.startX, y - p.startY) > MOVE_CANCEL) p.moved = true;
    }
  };

  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const p = pointerRef.current;
    p.down = false;
    p.moved = false;
    p.lastPress = e.timeStamp;
  };

  const onLeave = () => {
    const p = pointerRef.current;
    if (!p.down) p.inside = false;
  };

  return (
    <DemoStage hint="PC: カードを長押ししたまま動かす / スマホ: 指で長押しして動かす（放置中は自動で覗く）">
      <div
        ref={cardRef}
        className={styles.card}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={onLeave}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className={`${styles.layout} ${styles.front}`}>
          {BLOCKS.map((b) => (
            <div key={b.key} className={styles[b.key]}>
              {b.text}
            </div>
          ))}
        </div>
        <div ref={backRef} className={`${styles.layout} ${styles.back}`} aria-hidden>
          {BLOCKS.map((b) => (
            <div key={`x-${b.key}`} className={styles[b.key]}>
              {b.text}
              <span className={styles.note}>{b.note}</span>
            </div>
          ))}
        </div>
        <div ref={ringRef} className={styles.ring} aria-hidden>
          <span className={styles.crossX} />
          <span className={styles.crossY} />
          <span ref={coordRef} className={styles.coord} />
        </div>
      </div>
    </DemoStage>
  );
}
