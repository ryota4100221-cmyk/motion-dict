"use client";

import { useEffect, useRef, useState } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./SplitFlap.module.css";

// 表示する語。全て同じ桁数になるよう空白で右埋めして固定する
const LEN = 7;
const WORDS = ["MOTION", "DESIGN", "SOLARI", "TOKYO", "AWWWARD", "MIDDLE"].map(
  (w) => w.slice(0, LEN).padEnd(LEN, " ")
);
// ドラムの文字順(空白 + A〜Z)。この並びを1コマずつ進んで目標へ着く
const DRUM = " ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const N = DRUM.length;

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

// char=表示中の文字 / prev=いま倒れつつある旧文字 / key=めくるたびに増やしてフラップを再生
type Cell = { char: string; prev: string; key: number };

export default function SplitFlap({ params }: { params: ParamValues }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);
  const [cells, setCells] = useState<Cell[]>(() =>
    Array.from({ length: LEN }, () => ({ char: " ", prev: " ", key: 0 }))
  );

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const reduce = window.matchMedia(REDUCE_QUERY).matches;

    // 現在のセル状態はクロージャで持ち、変化したときだけsetCellsで反映する
    const current: Cell[] = Array.from({ length: LEN }, () => ({
      char: " ",
      prev: " ",
      key: 0,
    }));
    // 各桁の進行計画。seq[0]→…→seq[last]=目標 を時間で1コマずつ送る
    let plan: { seq: string[]; startAt: number; done: number }[] = [];
    let wordIndex = 0;
    let settled = true;
    let holdTimer: ReturnType<typeof setTimeout> | undefined;

    const push = () => setCells(current.map((c) => ({ ...c })));

    // reduced-motion: めくらず最終文字へ即差し替え
    const setInstant = (word: string) => {
      for (let i = 0; i < LEN; i++) {
        current[i] = { char: word[i], prev: word[i], key: current[i].key };
      }
      push();
    };

    const schedule = (word: string) => {
      const p = paramsRef.current;
      const steps = Math.max(1, Math.round(p.steps));
      const now = performance.now();
      plan = [];
      for (let i = 0; i < LEN; i++) {
        const idx = DRUM.indexOf(word[i]);
        const t = idx < 0 ? 0 : idx;
        // 目標tの手前stepsコマから並べる → 前進しながらちょうどtに着地する
        const seq: string[] = [];
        for (let k = 0; k <= steps; k++) {
          seq.push(DRUM[(((t - steps + k) % N) + N) % N]);
        }
        plan.push({ seq, startAt: now + i * p.stagger, done: 0 });
        current[i] = { char: seq[0], prev: seq[0], key: current[i].key + 1 };
      }
      settled = false;
      push();
    };

    const advance = () => {
      const word = WORDS[wordIndex % WORDS.length];
      wordIndex += 1;
      if (reduce) setInstant(word);
      else schedule(word);
    };

    const tick = (time: number) => {
      if (settled) return;
      const p = paramsRef.current;
      const flipMs = Math.max(30, p.flip * 1000);
      let changed = false;
      let allDone = true;
      for (let i = 0; i < LEN; i++) {
        const pl = plan[i];
        const steps = pl.seq.length - 1;
        const want = Math.min(
          steps,
          Math.max(0, Math.floor((time - pl.startAt) / flipMs))
        );
        if (pl.done < steps) allDone = false;
        while (pl.done < want) {
          pl.done += 1;
          current[i] = {
            prev: pl.seq[pl.done - 1],
            char: pl.seq[pl.done],
            key: current[i].key + 1,
          };
          changed = true;
        }
      }
      if (changed) push();
      if (allDone) {
        settled = true;
        // 少し止めてから次の語へ(自動デモ)
        holdTimer = setTimeout(advance, 1600);
      }
    };

    const onTap = () => {
      if (holdTimer) clearTimeout(holdTimer);
      advance();
    };
    stage.addEventListener("click", onTap);

    const unsub = reduce ? undefined : addTick(tick);
    // 初回に内容を伝えるため一度自動再生
    const kickoff = setTimeout(reduce ? () => setInstant(WORDS[0]) : advance, 500);

    return () => {
      clearTimeout(kickoff);
      if (holdTimer) clearTimeout(holdTimer);
      unsub?.();
      stage.removeEventListener("click", onTap);
    };
  }, []);

  return (
    <DemoStage stageRef={stageRef} hint="PC: クリックで次の語 / スマホ: タップ">
      <div className={styles.board}>
        {cells.map((cell, i) => (
          <span className={styles.cell} key={i}>
            {/* 下に見えている確定後の文字 */}
            <span className={styles.face}>{cell.char}</span>
            {/* 上半分が手前に倒れて旧文字を消し、下の新文字を見せる */}
            <span
              className={styles.flap}
              key={cell.key}
              style={{ animationDuration: `${params.flip}s` }}
              aria-hidden
            >
              <span className={styles.flapFace}>{cell.prev}</span>
            </span>
            <span className={styles.seam} aria-hidden />
          </span>
        ))}
      </div>
    </DemoStage>
  );
}
