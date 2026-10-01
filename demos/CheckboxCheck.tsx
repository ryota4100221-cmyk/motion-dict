"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./CheckboxCheck.module.css";

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

const IDLE_WAIT = 2400; // この時間操作が無ければ自走に戻る
const AUTO_STEP = 650; // 自走: 1行ずつチェックを入れる間隔
const AUTO_HOLD = 1400; // 自走: 全部入った状態を見せる時間

const ITEMS = ["ニュースレターを受け取る", "利用規約に同意する", "ログイン状態を保持する"];

export default function CheckboxCheck({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [checked, setChecked] = useState<boolean[]>(() => ITEMS.map(() => false));

  const checkedRef = useRef(checked);
  const touchedRef = useRef(false);
  // 最後に操作された時刻はrAFのtimeからだけ確定させる(performance.nowはlintで落ちる)
  const lastInputRef = useRef(-Infinity);
  const nextAutoRef = useRef(0);

  const apply = (next: boolean[]) => {
    checkedRef.current = next;
    setChecked(next);
  };

  const onChange = (i: number) => {
    touchedRef.current = true;
    apply(checkedRef.current.map((v, j) => (j === i ? !v : v)));
  };

  // 無操作のあいだは上から1行ずつチェック→全部外す、を繰り返す。録画のループ動画にも線の描画が映る
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
      if (time < nextAutoRef.current) return;
      const cur = checkedRef.current;
      const i = cur.indexOf(false);
      if (i === -1) {
        apply(cur.map(() => false));
        nextAutoRef.current = time + AUTO_STEP;
      } else {
        apply(cur.map((v, j) => (j === i ? true : v)));
        nextAutoRef.current = time + (i === cur.length - 1 ? AUTO_HOLD : AUTO_STEP);
      }
    });
  }, [reduce]);

  const vars = {
    "--fill": `${params.fillDuration}s`,
    "--draw": `${params.drawDuration}s`,
    "--delay": `${params.drawDelay}s`,
    "--pop": String(params.popScale),
  } as CSSProperties;

  return (
    <DemoStage hint="PC: 行をクリック / スマホ: タップ(入れるときだけ線が描かれる)">
      <div className={styles.field} style={vars}>
        {ITEMS.map((label, i) => (
          <label key={label} className={styles.row}>
            <span className={styles.box}>
              <input
                type="checkbox"
                className={styles.input}
                checked={checked[i]}
                onChange={() => onChange(i)}
              />
              <span className={styles.fill} aria-hidden>
                <svg className={styles.mark} viewBox="0 0 24 24">
                  <path d="M5.5 12.5l4.5 4.5L18.5 7.5" pathLength={1} />
                </svg>
              </span>
            </span>
            <span className={styles.label}>{label}</span>
          </label>
        ))}
      </div>
    </DemoStage>
  );
}
