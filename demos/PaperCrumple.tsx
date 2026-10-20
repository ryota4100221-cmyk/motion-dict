"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./PaperCrumple.module.css";

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

const IDLE_WAIT = 2200; // この時間さわられなければ自走に戻る
const IDLE_REST = 1300; // 自走時、次の紙が出てから捨てるまでの間
const PRINT_MS = 900; // 次の紙が印字されて出てくる時間(観察元は1.6s/14段)
const GAP_MS = 220; // 捨て終わってから次の紙を出すまで

// 観察元(designbyency.com の offer-crumple)のキーフレーム構成。
// at=位置、c=中心への寄せ具合(0=元の四角 / 1=紙玉)、rot=ねじり角
const STAGES = [
  { at: 0, c: 0, rot: 0 },
  { at: 0.13, c: 0.18, rot: -2 },
  { at: 0.28, c: 0.45, rot: 4 },
  { at: 0.43, c: 0.7, rot: -7 },
  { at: 0.57, c: 0.94, rot: 9 },
  { at: 0.68, c: 1, rot: -5 },
];
const CRUMPLE_EASE = "cubic-bezier(0.7, 0, 0.3, 1)";
const THROW_EASE = "cubic-bezier(0.5, 0, 0.9, 0.5)";
const BALL_EXTENT = 0.36; // 紙玉になったときのclip-pathの幅(元の紙比)

// 四角の周に12頂点(各辺4点)。全キーフレームで同じ数・同じ順に揃える
const BASE: [number, number][] = [
  [0, 0], [33, 0], [66, 0], [100, 0],
  [100, 33], [100, 66], [100, 100],
  [66, 100], [33, 100], [0, 100],
  [0, 66], [0, 33],
];

// 頂点ごと・段ごとに決まった値を返す疑似乱数(毎回同じ崩れ方にする)
function hash(i: number, s: number): number {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function polygonAt(c: number, stage: number, wrinkle: number): string {
  if (c === 0) return `polygon(${BASE.map(([x, y]) => `${x}% ${y}%`).join(", ")})`;
  const pts = BASE.map(([x, y], i) => {
    const tx = 50 + (x - 50) * BALL_EXTENT;
    const ty = 50 + (y - 50) * BALL_EXTENT;
    let px = x + (tx - x) * c;
    let py = y + (ty - y) * c;
    // 中心方向へ内外交互にずらして輪郭をギザギザにする。玉に近づくほど振れ幅を絞る
    const sign = i % 2 === 0 ? 1 : -1;
    const amt = wrinkle * (0.55 + 0.45 * hash(i, stage)) * (1 - 0.45 * c) * sign;
    const dx = 50 - px;
    const dy = 50 - py;
    const len = Math.hypot(dx, dy) || 1;
    px += (dx / len) * amt;
    py += (dy / len) * amt;
    const clamp = (v: number) => Math.min(100, Math.max(0, v));
    return `${clamp(px).toFixed(2)}% ${clamp(py).toFixed(2)}%`;
  });
  return `polygon(${pts.join(", ")})`;
}

// 捨てるたびに中身が替わる2枚のレシート
const RECEIPTS = [
  {
    no: "0418",
    plan: "MANAGED",
    rows: [["Design & build", "INCL."], ["Hosting", "INCL."], ["Updates", "INCL."]],
    total: "£150 / mo",
  },
  {
    no: "0419",
    plan: "BESPOKE",
    rows: [["Discovery call", "INCL."], ["Full build", "INCL."], ["Handover", "INCL."]],
    total: "£3,000",
  },
];

function cancelAll(ref: { current: Animation[] }) {
  ref.current.forEach((a) => a.cancel());
  ref.current = [];
}

export default function PaperCrumple({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const { duration, ball, wrinkle, toss } = params;

  const paperRef = useRef<HTMLDivElement>(null);
  const creaseRef = useRef<HTMLSpanElement>(null);
  const animsRef = useRef<Animation[]>([]);
  const busyRef = useRef(false);
  const touchedRef = useRef(false);
  const lastInputRef = useRef(-Infinity);
  const nextAutoRef = useRef(0);
  const [index, setIndex] = useState(0);

  const printIn = useCallback(() => {
    const paper = paperRef.current;
    if (!paper) return null;
    // reduced-motion: 印字の段送りはせず、フェードだけで出す
    const anim = reduce
      ? paper.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: "both" })
      : paper.animate(
          [
            // 段送り(steps)でレシートプリンタが1行ずつ吐き出す感じを出す
            { clipPath: "inset(0 0 100% 0)", transform: "translateY(14px)", easing: "steps(14)" },
            { clipPath: "inset(0 0 0% 0)", transform: "none" },
          ],
          { duration: PRINT_MS, fill: "both" }
        );
    animsRef.current = [anim];
    return anim;
  }, [reduce]);

  const discard = useCallback(async () => {
    const paper = paperRef.current;
    const crease = creaseRef.current;
    if (!paper || !crease || busyRef.current) return;
    busyRef.current = true;
    cancelAll(animsRef);
    const ms = duration * 1000;
    let anims: Animation[];
    if (reduce) {
      anims = [paper.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" })];
    } else {
      const s = ball / BALL_EXTENT; // clip-pathの縮みと掛け合わせて見た目の幅をballにする
      const crumple: Keyframe[] = STAGES.map((st, i) => {
        const sc = 1 + (s - 1) * st.c;
        return {
          offset: st.at,
          clipPath: polygonAt(st.c, i, wrinkle),
          transform: `translate(0px, 0px) scale(${sc}, ${sc * (1 - 0.06 * st.c)}) rotate(${st.rot}deg)`,
          opacity: 1,
          // WAAPIのeasingオプションは反復全体に掛かるので、区間ごとに書く
          easing: i === STAGES.length - 1 ? "ease-out" : CRUMPLE_EASE,
        };
      });
      const final = polygonAt(1, STAGES.length - 1, wrinkle);
      const keys: Keyframe[] = [
        ...crumple,
        // 一瞬沈んで溜めてから放る
        {
          offset: 0.8,
          clipPath: final,
          transform: `translate(0px, 6px) scale(${s * 1.08}, ${s * 0.96}) rotate(0deg)`,
          opacity: 1,
          easing: THROW_EASE,
        },
        {
          offset: 1,
          clipPath: final,
          transform: `translate(${toss}px, ${Math.round(toss * 0.4 + 24)}px) scale(${s * 0.9}, ${s * 0.84}) rotate(260deg)`,
          opacity: 0,
        },
      ];
      anims = [
        paper.animate(keys, { duration: ms, fill: "forwards" }),
        crease.animate(
          [
            { offset: 0, opacity: 0 },
            { offset: 0.14, opacity: 0.7 },
            { offset: 0.3, opacity: 1 },
            { offset: 1, opacity: 1 },
          ],
          { duration: ms, fill: "forwards" }
        ),
      ];
    }
    animsRef.current = anims;
    try {
      await Promise.all(anims.map((a) => a.finished));
    } catch {
      busyRef.current = false;
      return; // 途中でキャンセルされた(スライダー操作など)
    }
    await new Promise((r) => setTimeout(r, GAP_MS));
    cancelAll(animsRef);
    setIndex((n) => n + 1);
    const next = printIn();
    try {
      await next?.finished;
    } catch {}
    busyRef.current = false;
  }, [duration, ball, wrinkle, toss, reduce, printIn]);

  // スライダーを動かしたら紙を出し直す(途中の破棄は打ち切る)
  useEffect(() => {
    busyRef.current = false;
    printIn();
    return () => cancelAll(animsRef);
  }, [printIn, discard]);

  // 無操作のあいだは「出る→少し置く→捨てる」を自走させる(録画が静止画にならないように)
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
      if (busyRef.current) {
        nextAutoRef.current = time + IDLE_REST;
        return;
      }
      if (time < nextAutoRef.current) return;
      discard();
    });
  }, [reduce, discard]);

  const onDiscard = () => {
    touchedRef.current = true;
    discard();
  };

  const r = RECEIPTS[index % RECEIPTS.length];
  const vars = { "--pc-toss": `${toss}px` } as CSSProperties;

  return (
    <DemoStage hint="PC: 「破棄」かレシートをクリックで丸めて捨てる / スマホ: タップ">
      <div className={styles.scene} style={vars}>
        <span className={styles.bin} aria-hidden />
        <div
          ref={paperRef}
          className={styles.paper}
          onClick={onDiscard}
          role="button"
          tabIndex={0}
          aria-label="このレシートを破棄"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onDiscard();
            }
          }}
        >
          <p className={styles.head}>RECEIPT #{r.no}</p>
          <p className={styles.plan}>{r.plan}</p>
          <ul className={styles.rows}>
            {r.rows.map(([k, v]) => (
              <li key={k}>
                <span>{k}</span>
                <i />
                <span>{v}</span>
              </li>
            ))}
          </ul>
          <p className={styles.total}>
            <span>TOTAL</span>
            <strong>{r.total}</strong>
          </p>
          {/* しわの影。紙と一緒に切り抜かれ、丸め始めに浮き上がる */}
          <span ref={creaseRef} className={styles.crease} aria-hidden />
        </div>
      </div>
      <button type="button" className={styles.discard} onClick={onDiscard}>
        破棄 / Discard
      </button>
    </DemoStage>
  );
}
