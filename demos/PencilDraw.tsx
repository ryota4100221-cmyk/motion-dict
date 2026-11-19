"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./PencilDraw.module.css";

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

// cubic-bezier(0.4, 0, 0.2, 1)。1本ごとの「描き」と「持ち上げて移る」の両方に使う
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (sx(t) - x) / d;
    }
    return sy(Math.min(1, Math.max(0, t)));
  };
}
const ease = bezier(0.4, 0, 0.2, 1);

// 描き終えた鉛筆を置く場所（枠の下の余白。寝かせると本体が右へ伸びて x=308 まで）と、置いたときの角度
const REST = { x: 236, y: 214 };
const REST_ANGLE = 90;
const ERASE = 0.4; // 消してから描き直すまでのフェード s

// 描く順：枠 → 丸（図版）→ 見出しの2行 → 下の箱
const STROKES = [
  "M28 30 C 120 26, 220 33, 292 29 C 295 80, 291 140, 293 192 C 200 196, 110 191, 27 195 C 24 140, 29 85, 28 30 Z",
  "M108 82 C 108 96, 96 108, 82 108 C 68 108, 56 96, 56 82 C 56 68, 68 56, 82 56 C 96 56, 108 68, 108 82",
  "M134 70 C 180 68, 220 72, 262 70",
  "M134 96 C 170 94, 200 98, 230 96",
  "M50 136 C 120 132, 200 138, 268 134 C 269 148, 268 156, 269 166 C 200 170, 120 166, 51 169 C 50 158, 51 146, 50 136 Z",
];

export default function PencilDraw({ params }: { params: ParamValues }) {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const inkRef = useRef<SVGGElement>(null);
  const pencilRef = useRef<SVGGElement>(null);
  const paramsRef = useRef(params);
  const restartRef = useRef(true);
  const reduce = useReducedMotion();

  // スライダーを動かしたら頭から描き直す
  useEffect(() => {
    paramsRef.current = params;
    restartRef.current = true;
  }, [params]);

  const restart = () => {
    restartRef.current = true;
  };

  useEffect(() => {
    const paths = pathRefs.current.filter((p): p is SVGPathElement => !!p);
    const lens = paths.map((p) => p.getTotalLength());
    const starts = paths.map((p) => p.getPointAtLength(0));
    const ends = paths.map((p, i) => p.getPointAtLength(lens[i]));

    const placePencil = (x: number, y: number, angle: number) => {
      pencilRef.current?.setAttribute(
        "transform",
        `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${angle.toFixed(2)})`
      );
    };

    if (reduce) {
      // 描き上がった絵と、置いた鉛筆だけを静止で見せる
      paths.forEach((p, i) => {
        p.style.strokeDasharray = `${lens[i]}`;
        p.style.strokeDashoffset = "0";
      });
      if (inkRef.current) inkRef.current.style.opacity = "1";
      placePencil(REST.x, REST.y, REST_ANGLE);
      return;
    }

    let start = 0;
    return addTick((time) => {
      const { speed, lift, tilt, hold } = paramsRef.current;
      if (restartRef.current) {
        restartRef.current = false;
        start = time;
      }
      let t = (time - start) / 1000;

      // 1周の予定表：[持ち上げて移る lift s → 描く 長さ/speed s] × 本数 → 置きに戻る lift s → hold s → 消す
      const sched: { move0: number; draw0: number; draw1: number }[] = [];
      let c = 0;
      for (let i = 0; i < paths.length; i++) {
        const move0 = c;
        const draw0 = move0 + lift;
        const draw1 = draw0 + lens[i] / speed;
        sched.push({ move0, draw0, draw1 });
        c = draw1;
      }
      const back0 = c;
      const done = back0 + lift;
      const erase0 = done + hold;
      const cycle = erase0 + ERASE;
      if (t >= cycle) {
        start = time;
        t = 0;
      }

      // 線：dashoffset を全長→0
      paths.forEach((p, i) => {
        const { draw0, draw1 } = sched[i];
        const k = ease((t - draw0) / (draw1 - draw0));
        // 間隔を全長＋8にし、描き始める前は L+8 まで送って丸い線端が点で残らないようにする
        p.style.strokeDasharray = `${lens[i]} ${lens[i] + 8}`;
        p.style.strokeDashoffset = k > 0 ? `${(lens[i] * (1 - k)).toFixed(2)}` : `${lens[i] + 8}`;
      });
      if (inkRef.current) {
        inkRef.current.style.opacity = t > erase0 ? `${Math.max(0, 1 - (t - erase0) / ERASE)}` : "1";
      }

      // 鉛筆：描いている線の先端に芯を置く。線と線のあいだは持ち上げて移る
      const hop = (ax: number, ay: number, bx: number, by: number, a0: number, a1: number, u: number) => {
        const k = ease(u);
        const up = Math.sin(Math.PI * k) * 10; // 持ち上げ量（紙から離れて見える）
        placePencil(ax + (bx - ax) * k, ay + (by - ay) * k - up, a0 + (a1 - a0) * k);
      };
      for (let i = 0; i < paths.length; i++) {
        const { move0, draw0, draw1 } = sched[i];
        if (t < draw0) {
          const from = i === 0 ? REST : ends[i - 1];
          const a0 = i === 0 ? REST_ANGLE : tilt;
          hop(from.x, from.y, starts[i].x, starts[i].y, a0, tilt, lift > 0 ? (t - move0) / lift : 1);
          return;
        }
        if (t < draw1) {
          const k = ease((t - draw0) / (draw1 - draw0));
          const pt = paths[i].getPointAtLength(lens[i] * k);
          placePencil(pt.x, pt.y, tilt);
          return;
        }
      }
      if (t < done) {
        const last = ends[ends.length - 1];
        hop(last.x, last.y, REST.x, REST.y, tilt, REST_ANGLE, lift > 0 ? (t - back0) / lift : 1);
        return;
      }
      placePencil(REST.x, REST.y, REST_ANGLE);
    });
  }, [reduce]);

  return (
    <DemoStage hint="操作不要: 自動で描いて消してを繰り返す / PC: 図版にホバー・スマホ: タップで描き直し">
      <div className={styles.plate} onPointerEnter={restart} onPointerDown={restart}>
        <span className={styles.caption}>Plate 31 — Drawing hand</span>
        <svg viewBox="0 0 320 230" className={styles.svg} aria-hidden>
          <g ref={inkRef}>
            {STROKES.map((d, i) => (
              <path
                key={`stroke-${i}`}
                ref={(el) => {
                  pathRefs.current[i] = el;
                }}
                d={d}
                className={styles.stroke}
              />
            ))}
          </g>
          {/* 芯の先が原点。本体は上へ伸び、rotate で傾ける。中を舞台の黒で塗って下の線を隠す */}
          <g ref={pencilRef} className={styles.pencil} transform={`translate(${REST.x} ${REST.y}) rotate(${REST_ANGLE})`}>
            <rect x="-5" y="-72" width="10" height="9" rx="2" />
            <rect x="-5" y="-63" width="10" height="6" />
            <rect x="-5" y="-57" width="10" height="44" />
            <path d="M-5 -13 L0 0 L5 -13 Z" />
            <path className={styles.lead} d="M-1.9 -5 L0 0 L1.9 -5 Z" />
          </g>
        </svg>
      </div>
      <button className={styles.btn} onClick={restart}>
        Redraw plate
      </button>
    </DemoStage>
  );
}
