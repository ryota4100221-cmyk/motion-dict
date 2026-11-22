"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./Misregistration.module.css";

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

// CSS の ease-in-out = cubic-bezier(0.42, 0, 0.58, 1)。
// 出典(birkar.me)は keyframes の ease-in-out alternate で往復させているので、
// rAF でも同じ曲線になるよう x(t)=u を解いて y(t) を返す。
function easeInOut(u: number): number {
  const x1 = 0.42;
  const x2 = 0.58;
  const bx = (t: number) =>
    3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
  const dbx = (t: number) =>
    3 * (1 - t) * (1 - t) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
  let t = u;
  for (let i = 0; i < 6; i++) {
    const d = dbx(t);
    if (Math.abs(d) < 1e-6) break;
    t -= (bx(t) - u) / d;
    t = Math.min(1, Math.max(0, t));
  }
  // y1=0, y2=1
  return 3 * (1 - t) * t * t + t * t * t;
}

const WORD = "Misregister";

// 見当合わせの十字(トンボ)。版ごとに1組ずつ刷る
function Marks() {
  return (
    <>
      <span className={`${styles.mark} ${styles.markTl}`} />
      <span className={`${styles.mark} ${styles.markBr}`} />
    </>
  );
}

export default function Misregistration({ params }: { params: ParamValues }) {
  const plateRef = useRef<HTMLDivElement | null>(null);
  const readoutRef = useRef<HTMLSpanElement | null>(null);
  const kRef = useRef(1);
  const [aligned, setAligned] = useState(false);
  const reduce = useReducedMotion();

  const { offset, wobble, duration, ink } = params;

  useEffect(() => {
    const target = aligned ? 0 : 1;

    // 端A・端B(出典: translate(0.05em,-0.035em) scale(1.012) ↔ translate(-0.03em,0.05em) scale(0.994))
    const ax = offset;
    const ay = -0.7 * offset;
    const as = wobble / 100;
    const bx = -0.6 * offset;
    const by = offset;
    const bs = -wobble / 200;

    const write = (e: number, k: number) => {
      const el = plateRef.current;
      if (!el) return;
      const x = (ax + (bx - ax) * e) * k;
      const y = (ay + (by - ay) * e) * k;
      const s = 1 + (as + (bs - as) * e) * k;
      el.style.transform = `translate(${x.toFixed(4)}em, ${y.toFixed(4)}em) scale(${s.toFixed(4)})`;
      const r = readoutRef.current;
      if (r) r.textContent = `${Math.hypot(x, y).toFixed(3)}em`;
    };

    if (reduce) {
      // 往復は止め、端A(ずれた状態)か見当が合った状態で静止させる
      kRef.current = target;
      write(0, target);
      return;
    }

    const leg = duration * 1000;
    return addTick((time) => {
      // 見当合わせは係数 k を目標へ毎フレーム寄せる(0.12/フレーム＝60fpsで約0.4sでほぼ収まる)
      kRef.current += (target - kRef.current) * 0.12;
      if (Math.abs(target - kRef.current) < 0.001) kRef.current = target;

      // 片道 duration の往復(alternate)。奇数区間は折り返して戻る
      const tt = time / leg;
      const n = Math.floor(tt);
      let u = tt - n;
      if (n % 2 === 1) u = 1 - u;
      write(easeInOut(u), kRef.current);
    });
  }, [offset, wobble, duration, aligned, reduce]);

  const toggle = () => setAligned((a) => !a);

  return (
    <DemoStage hint="PC: Align plates ボタンか紙面をクリックで見当合わせ / スマホ: タップで切り替え">
      <div className={styles.sheet} onClick={toggle} role="presentation">
        <div className={styles.head}>
          <span>Plate 2 / 2</span>
          <span>Glossary · Folio 07</span>
        </div>

        <div className={styles.forme}>
          {/* 1枚目の版：墨100%で静止 */}
          <div className={styles.plate}>
            <p className={styles.word}>{WORD}</p>
            <Marks />
          </div>
          {/* 2枚目の版：同じ墨を半分の濃さで刷り重ね、ずらす */}
          <div
            className={`${styles.plate} ${styles.second}`}
            ref={plateRef}
            style={{ opacity: ink }}
            aria-hidden
          >
            <p className={styles.word}>{WORD}</p>
            <Marks />
          </div>
        </div>

        <div className={styles.foot}>
          <span className={styles.readout}>
            <span className={styles.dot} data-on={aligned ? "" : undefined} />
            offset <span ref={readoutRef}>0.000em</span>
          </span>
          <button
            type="button"
            className={styles.button}
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
          >
            {aligned ? "Release plates" : "Align plates"}
          </button>
        </div>
      </div>
    </DemoStage>
  );
}
