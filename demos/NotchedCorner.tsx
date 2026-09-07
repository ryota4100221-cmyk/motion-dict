"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./NotchedCorner.module.css";

const CHIPS = ["Overview", "Specs", "Access"];

const ALL_CORNERS = ["tl", "tr", "br", "bl"] as const;

type Corner = (typeof ALL_CORNERS)[number];
type Depths = Record<Corner, number>;

// 欠けを入れる角の組。cornersパラメータのindexと並びを合わせる
const CORNER_SETS: readonly (readonly Corner[])[] = [
  ["tl", "br"],
  ["tl"],
  ["tl", "tr", "br", "bl"],
];

const IDLE_WAIT = 2200; // この時間ポインタが来なければ自走に戻る
const IDLE_STEP = 1500; // 自走時に選択を送る間隔

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

// 頂点は常に12個。欠けが0の角も「角に重なった3点」として書く。
// ここで点の数が変わると clip-path は補間を諦め、動かずに切り替わる
function polygon(d: Depths): string {
  const x = (v: number) => `${v}px`;
  const rx = (v: number) => `calc(100% - ${v}px)`;
  const pts = [
    `${x(d.tl)} 0`,
    `${rx(d.tr)} 0`,
    `${rx(d.tr)} ${x(d.tr)}`,
    `100% ${x(d.tr)}`,
    `100% ${rx(d.br)}`,
    `${rx(d.br)} ${rx(d.br)}`,
    `${rx(d.br)} 100%`,
    `${x(d.bl)} 100%`,
    `${x(d.bl)} ${rx(d.bl)}`,
    `0 ${rx(d.bl)}`,
    `0 ${x(d.tl)}`,
    `${x(d.tl)} ${x(d.tl)}`,
  ].join(", ");
  return `polygon(${pts})`;
}

function depths(set: readonly Corner[], notch: number): Depths {
  return {
    tl: set.includes("tl") ? notch : 0,
    tr: set.includes("tr") ? notch : 0,
    br: set.includes("br") ? notch : 0,
    bl: set.includes("bl") ? notch : 0,
  };
}

export default function NotchedCorner({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(1);
  const [hovered, setHovered] = useState<number | null>(null);

  // 録画は無操作のまま回るので、ポインタが来ない間は選択を自走させる。
  // 時刻はrAFから渡るtimeだけで扱い、操作側はフラグを立てるにとどめる
  const lastInputRef = useRef(-Infinity);
  const touchedRef = useRef(false);
  useEffect(() => {
    if (reduce) return;
    return addTick((time) => {
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInputRef.current = time;
      }
      if (time - lastInputRef.current < IDLE_WAIT) return;
      const step = Math.floor(time / IDLE_STEP) % CHIPS.length;
      setActive((prev) => (prev === step ? prev : step));
      setHovered(null);
    });
  }, [reduce]);

  const touch = (i: number) => {
    touchedRef.current = true;
    setActive(i);
  };

  const notch = params.notch;
  const base = CORNER_SETS[Math.round(params.corners)] ?? CORNER_SETS[0];
  // 選択時: 0=欠けを0まで閉じる / 1=欠けた角と直角だった角を入れ替える
  const flip = Math.round(params.swap) === 1;
  const onSet: readonly Corner[] = flip
    ? ALL_CORNERS.filter((c) => !base.includes(c))
    : [];

  const idleClip = polygon(depths(base, notch));
  const onClip = polygon(depths(onSet, notch));
  const move = reduce
    ? "none"
    : `clip-path ${params.duration}s cubic-bezier(0.7, 0, 0.3, 1)`;

  return (
    <DemoStage hint="PC: チップにホバー / クリックで選択 / スマホ: タップ">
      <div className={styles.panel}>
        <span className={styles.caption}>SECTOR / 07</span>
        <div className={styles.row}>
          {CHIPS.map((label, i) => {
            const on = i === active || i === hovered;
            const style: CSSProperties = {
              clipPath: on ? onClip : idleClip,
              transition: move,
            };
            return (
              <button
                key={label}
                type="button"
                className={
                  i === active ? `${styles.chip} ${styles.current}` : styles.chip
                }
                style={style}
                onMouseEnter={() => {
                  touchedRef.current = true;
                  setHovered(i);
                }}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => {
                  touchedRef.current = true;
                  setHovered(i);
                }}
                onBlur={() => setHovered(null)}
                onClick={() => touch(i)}
                onTouchStart={() => touch(i)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </DemoStage>
  );
}
