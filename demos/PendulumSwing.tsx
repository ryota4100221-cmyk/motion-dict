"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { CSSProperties, MouseEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./PendulumSwing.module.css";

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

const TAGS = [
  { label: "NEW", accent: false },
  { label: "−30%", accent: true },
  { label: "SALE", accent: false },
];

const IDLE_WAIT = 2000; // この時間さわられなければ自走に戻る
const IDLE_STEP = 2600; // 自走時に次のタグを押す間隔
const REST = 0.05; // 振れ幅がこれを切ったら止める(deg)
const MAX_IMPULSES = 4; // 連打で揺れが際限なく育たないように

// 1回の「押し」。start は rAF の time で確定させる(performance.now は使わない)
type Impulse = { start: number | null; dir: number; delay: number };

export default function PendulumSwing({ params }: { params: ParamValues }) {
  const tagRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const impulsesRef = useRef<Impulse[][]>(TAGS.map(() => []));
  const touchedRef = useRef(false);
  const lastInputRef = useRef(0);
  const lastStepRef = useRef(-1);
  const nextRef = useRef(0);
  const reduce = useReducedMotion();

  const { angle, pivot, period, damping } = params;

  // 揺れている最中でも足し合わせる。角度を0に戻さないので跳ねない
  const push = (i: number, dir: number, delay = 0) => {
    const list = impulsesRef.current[i];
    // 減衰しない(100%)ときは一度揺れ出したら揺れ続けるので、重ねない
    if (damping >= 100 && list.length > 0) return;
    list.push({ start: null, dir, delay });
    if (list.length > MAX_IMPULSES) list.shift();
  };

  // スライダーを動かしたとき、止まっているタグだけ押し直して数値の効きを見せる
  useEffect(() => {
    if (reduce) return;
    impulsesRef.current.forEach((list, i) => {
      if (list.length === 0) {
        list.push({ start: null, dir: i % 2 === 0 ? 1 : -1, delay: i * 180 });
      }
    });
  }, [angle, pivot, period, damping, reduce]);

  useEffect(() => {
    if (reduce) {
      tagRefs.current.forEach((el) => el?.style.removeProperty("transform"));
      return;
    }
    const r = damping / 100;
    const half = (period * 1000) / 2;
    return addTick((time) => {
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInputRef.current = time;
      }
      // 無操作のあいだはタグを順番に押す(録画が静止画にならないように)
      if (time - lastInputRef.current >= IDLE_WAIT) {
        const step = Math.floor(time / IDLE_STEP);
        if (step !== lastStepRef.current) {
          lastStepRef.current = step;
          const i = nextRef.current % TAGS.length;
          const list = impulsesRef.current[i];
          if (!(r >= 1 && list.length > 0)) {
            list.push({ start: null, dir: nextRef.current % 2 === 0 ? 1 : -1, delay: 0 });
          }
          nextRef.current += 1;
        }
      }

      impulsesRef.current.forEach((list, i) => {
        // 100%に切り替えたら揺れを1本に絞る(減衰しない揺れが足し算で育つのを防ぐ)
        if (r >= 1 && list.length > 1) list.splice(0, list.length - 1);
        let theta = 0;
        for (let k = list.length - 1; k >= 0; k--) {
          const imp = list[k];
          if (imp.start === null) imp.start = time + imp.delay;
          const t = time - imp.start;
          if (t < 0) continue;
          // 包絡線: 半周期ごとに r 倍。ここが減衰振動の本体
          const env = angle * Math.pow(r, t / half);
          if (r < 1 && env < REST) {
            list.splice(k, 1);
            continue;
          }
          theta += imp.dir * env * Math.sin((Math.PI * t) / half);
        }
        // 連打の重ね合わせは angle を超えたぶんだけ柔らかく頭打ちにする
        const limit = angle * 1.8;
        const mag = Math.abs(theta);
        if (mag > angle) {
          theta =
            Math.sign(theta) *
            (angle + (limit - angle) * Math.tanh((mag - angle) / (limit - angle)));
        }
        const el = tagRefs.current[i];
        if (el) el.style.transform = `rotate(${theta.toFixed(3)}deg)`;
      });
    });
  }, [angle, period, damping, reduce]);

  const touch = (i: number, e: MouseEvent<HTMLButtonElement>) => {
    touchedRef.current = true;
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    // 左から触れたら右へ振り出す。rotate の正は時計回り=下端が左へ動く向き
    // (キーボード操作や真ん中のクリックは交互にする)
    const dir =
      e.clientX === 0 || Math.abs(e.clientX - center) < 2
        ? nextRef.current++ % 2 === 0
          ? 1
          : -1
        : e.clientX < center
          ? -1
          : 1;
    push(i, dir);
  };

  return (
    <DemoStage hint="PC: タグをクリックで押す(連打で揺れが足される) / スマホ: タップ">
      <div
        className={styles.rack}
        style={{ "--pivot": `${pivot}px` } as CSSProperties}
      >
        {/* レール。吊り具側は動かさない(動くのはタグだけ) */}
        <span className={styles.rail} aria-hidden />
        {TAGS.map((tag, i) => (
          <div key={tag.label} className={styles.slot}>
            {/* 吊り点。transform-origin はここ(タグの上辺から pivot px 上)に合わせる */}
            <span className={styles.pin} aria-hidden />
            <button
              type="button"
              ref={(el) => {
                tagRefs.current[i] = el;
              }}
              className={tag.accent ? `${styles.tag} ${styles.accent}` : styles.tag}
              onClick={(e) => touch(i, e)}
              aria-label={`${tag.label} のタグを揺らす`}
            >
              {/* 紐と吊り穴はタグの内側に持たせ、タグと一緒に回す */}
              <span className={styles.string} aria-hidden />
              <span className={styles.hole} aria-hidden />
              <span className={styles.label}>{tag.label}</span>
            </button>
          </div>
        ))}
      </div>
    </DemoStage>
  );
}
