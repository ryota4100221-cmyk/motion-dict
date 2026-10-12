"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, TransitionEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./PrizeWheel.module.css";

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

// atomato.co の spin-to-win と同じ減速カーブ(序盤で一気に回り、終盤を長く引く)
const EASE = "cubic-bezier(0.12, 0.7, 0.18, 1)";
const LABELS = ["10%", "FREE", "15%", "5%", "20%", "GIFT", "10%", "5%", "30%", "FREE", "25%", "GIFT"];
// 当たりは回す前に決める。デモでは固定の順で引く(Math.random は lint の purity で落ちる)
const ORDER = [1, 5, 2, 7, 4, 0, 6, 3, 9, 11, 8, 10];
const IDLE_WAIT = 1800; // 止まってからこの時間押されなければ自走で回す
const R = 90;

// 真上を0度として時計回りの角度 a(deg)にある円周上の点
const at = (a: number, r: number) => {
  const rad = (a * Math.PI) / 180;
  return `${(100 + r * Math.sin(rad)).toFixed(2)} ${(100 - r * Math.cos(rad)).toFixed(2)}`;
};

const sector = (i: number, n: number) => {
  const seg = 360 / n;
  const a0 = i * seg - seg / 2;
  return `M100 100L${at(a0, R)}A${R} ${R} 0 0 1 ${at(a0 + seg, R)}Z`;
};

export default function PrizeWheel({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const n = Math.round(params.segments);
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  // 当選のたびに増やし、強調の key に使って頭から再生させる
  const [run, setRun] = useState(0);

  const angleRef = useRef(0);
  const spinningRef = useRef(false);
  const targetRef = useRef(0);
  const pickRef = useRef(0);
  const clickedRef = useRef(false);
  const settledRef = useRef(false);
  // 自走の期限はrAFのtimeからだけ確定させる(performance.nowはlintで落ちる)
  const untilRef = useRef(-1);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const land = (target: number) => {
    spinningRef.current = false;
    settledRef.current = true;
    setSpinning(false);
    setWinner(target);
    setRun((k) => k + 1);
  };

  // 回転中のクリックは捨てる(=二重に回させない)
  const onClick = () => {
    if (!spinningRef.current) clickedRef.current = true;
  };

  const onEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    if (spinningRef.current) land(targetRef.current);
  };

  useEffect(() => {
    return addTick((time) => {
      if (settledRef.current || untilRef.current < 0) {
        settledRef.current = false;
        untilRef.current = time + IDLE_WAIT;
      }
      if (spinningRef.current) return;
      // reduced-motion では自走しない(押したときだけ抽選する)
      const auto = !reduce && time >= untilRef.current;
      if (!clickedRef.current && !auto) return;
      clickedRef.current = false;

      const p = paramsRef.current;
      const count = Math.round(p.segments);
      const seg = 360 / count;
      const target = ORDER[pickRef.current % ORDER.length] % count;
      pickRef.current += 1;
      // 枠 target を針の下へ運ぶ角度は -target*seg。いまの角度から turns 周以上回って着く最小の値にする
      const base = -target * seg;
      const min = angleRef.current + p.turns * 360;
      const next = base + Math.ceil((min - base) / 360) * 360;
      angleRef.current = next;
      targetRef.current = target;
      setAngle(next);
      setWinner(null);
      if (reduce) {
        land(target);
      } else {
        spinningRef.current = true;
        setSpinning(true);
      }
    });
  }, [reduce]);

  const discStyle = {
    transform: `rotate(${angle}deg)`,
    transition: reduce ? "none" : `transform ${params.duration}s ${EASE}`,
  } as CSSProperties;

  const pegs = Array.from({ length: n * 2 }, (_, i) => at((i * 180) / n, 95).split(" "));

  return (
    <DemoStage hint="PC: 「回す」をクリック / スマホ: タップ(回転中は押しても反応しない)">
      <div className={styles.wrap}>
        <div className={styles.wheel}>
          <div className={styles.disc} style={discStyle} onTransitionEnd={onEnd}>
            <svg viewBox="0 0 200 200" aria-hidden>
              <circle cx="100" cy="100" r="99" className={styles.rim} />
              {Array.from({ length: n }, (_, i) => {
                // 奇数枠だと交互が1か所崩れるので、最後の枠だけ第3の色にする
                const tone = n % 2 === 1 && i === n - 1 ? "c" : i % 2 === 0 ? "a" : "b";
                return <path key={i} d={sector(i, n)} className={styles.seg} data-tone={tone} />;
              })}
              {winner !== null && winner < n && (
                <path key={`win-${run}`} d={sector(winner, n)} className={styles.win} />
              )}
              {Array.from({ length: n }, (_, i) => {
                const tone = n % 2 === 1 && i === n - 1 ? "c" : i % 2 === 0 ? "a" : "b";
                return (
                  <text
                    key={i}
                    transform={`rotate(${(i * 360) / n} 100 100)`}
                    x="100"
                    y="38"
                    className={styles.label}
                    data-tone={tone}
                  >
                    {LABELS[i % LABELS.length]}
                  </text>
                );
              })}
              {pegs.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="1.8" className={styles.peg} />
              ))}
            </svg>
          </div>
          <svg className={styles.hub} viewBox="0 0 200 200" aria-hidden>
            <circle cx="100" cy="100" r="16" className={styles.hubOuter} />
            <circle cx="100" cy="100" r="8" className={styles.hubInner} />
          </svg>
          <svg className={styles.pointer} viewBox="0 0 24 26" aria-hidden>
            <path d="M12 24 1 2h22z" />
          </svg>
        </div>
        <div className={styles.side}>
          <p className={styles.head}>SPIN TO WIN</p>
          <button
            type="button"
            className={styles.btn}
            aria-disabled={spinning}
            onClick={onClick}
          >
            回す
          </button>
          <p className={styles.result} aria-live="polite">
            {spinning ? "抽選中…" : winner !== null && winner < n ? `${LABELS[winner % LABELS.length]} が当たり` : " "}
          </p>
        </div>
      </div>
    </DemoStage>
  );
}
