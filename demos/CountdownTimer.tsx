"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./CountdownTimer.module.css";

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

// 観察元(enigmascult.com の auction.js)と同じく、1秒ごとに残り秒を数え直して
// 「残り closingAt 秒以下」「残り finalAt 秒以下」でクラスを付け替えるだけ。数字そのものは動かさない
const TICK_MS = 1000;
const ENDED_HOLD = 2; // 「Ended」を見せてから数え直すまでの秒

type Lot = { name: string; photo: number };

// 写真は紙と活字のモノクロ(public/demo/photo-NN.jpg)。品名もその絵柄に合わせる
const LOTS: Lot[] = [
  { name: "Plate 03 — Type specimen", photo: 4 },
  { name: "Plate 07 — Folio, first state", photo: 9 },
  { name: "Plate 12 — Drafting sheet", photo: 13 },
];

// 3つの札を「まだ余裕がある / もうすぐ最後の1分 / もうすぐ最後の10秒」の手前から始め、
// 境目を越える瞬間が数秒以内に見えるようにする(無操作でもくり返す)
function startLeft(i: number, closingAt: number, finalAt: number): number {
  if (i === 0) return 2 * 3600 + 14 * 60 + 7;
  if (i === 1) return closingAt + 2;
  return finalAt + 4;
}

// 札ごとの折り返し点。ここまで減ったら開始値へ戻す(0 なら Ended を挟む)
function loopFloor(i: number, closingAt: number, finalAt: number): number {
  if (i === 0) return 2 * 3600;
  if (i === 1) return Math.max(finalAt + 2, closingAt - 14);
  return -ENDED_HOLD;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

function Segments({ left }: { left: number }) {
  if (left <= 0) return <span className={styles.ended}>Ended</span>;
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  return (
    <>
      {[
        [pad2(h), "H"],
        [pad2(m), "M"],
        [pad2(s), "S"],
      ].map(([n, unit]) => (
        <span className={styles.seg} key={unit}>
          <b className={styles.num}>{n}</b>
          <i className={styles.unit}>{unit}</i>
        </span>
      ))}
    </>
  );
}

type BoardProps = { closingAt: number; finalAt: number; reduce: boolean; vars: CSSProperties };

// しきい値が変わると key ごと作り直し、新しい境目の手前から数え直す
function Board({ closingAt, finalAt, reduce, vars }: BoardProps) {
  const [lefts, setLefts] = useState<number[]>(() =>
    LOTS.map((_, i) => startLeft(i, closingAt, finalAt))
  );

  const restart = () => setLefts(LOTS.map((_, i) => startLeft(i, closingAt, finalAt)));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLefts((prev) =>
        prev.map((left, i) => {
          const next = left - 1;
          return next < loopFloor(i, closingAt, finalAt) ? startLeft(i, closingAt, finalAt) : next;
        })
      );
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [closingAt, finalAt]);

  return (
    <div className={styles.panel} style={vars} data-reduce={reduce || undefined}>
      <div className={styles.head}>
        <span className={styles.title}>Closing lots</span>
        <button type="button" className={styles.restart} onClick={restart}>
          Restart countdown
        </button>
      </div>
      <ul className={styles.list}>
        {LOTS.map((lot, i) => {
          const left = lefts[i];
          const closing = left > 0 && left <= closingAt;
          const final = left > 0 && left <= finalAt;
          const state = final ? "final" : closing ? "closing" : left <= 0 ? "ended" : "open";
          return (
            <li className={styles.row} key={lot.name}>
              <span
                className={styles.thumb}
                style={{
                  backgroundImage: `url("/motion-dict/demo/photo-${pad2(lot.photo)}.jpg")`,
                }}
                aria-hidden
              />
              <span className={styles.meta}>
                <span className={styles.name}>{lot.name}</span>
                <span className={styles.state} data-state={state}>
                  {state === "final"
                    ? "Final seconds"
                    : state === "closing"
                      ? "Closing"
                      : state === "ended"
                        ? "Sold"
                        : "Open"}
                </span>
              </span>
              <span
                className={styles.timer}
                data-closing={closing || undefined}
                data-final={final || undefined}
                role="timer"
                aria-label={`${lot.name} 残り ${left > 0 ? left : 0} 秒`}
              >
                <Segments left={left} />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function CountdownTimer({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const closingAt = Math.round(params.closingAt);
  const finalAt = Math.round(params.finalAt);

  const vars = {
    "--cd-period": `${params.period}s`,
    "--cd-final-period": `${params.period / 2}s`,
    "--cd-dim": params.dim,
  } as CSSProperties;

  return (
    <DemoStage hint="自動で再生: 残り時間が減ると明滅が始まり、最後は速く赤く(PC・スマホ共通。ボタンで数え直し)">
      <Board key={`cd-${closingAt}-${finalAt}`} closingAt={closingAt} finalAt={finalAt} reduce={reduce} vars={vars} />
    </DemoStage>
  );
}
