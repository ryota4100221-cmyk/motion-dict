"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./CoverTransition.module.css";

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

// 出だしが速く終わりが長い曲線。2枚が同じ曲線を共有することがこの遷移の肝
const EASE = "cubic-bezier(0.11, 0.82, 0.39, 1)";
// 覆われる側が奥へ引く距離(枠高に対する%)と、そこまで落とす不透明度
const RECEDE_SHIFT = -6;
const RECEDE_OPACITY = 0.48;
// 実操作からアイドル自走を再開するまで(ms)と、遷移完了から次の自走までの間(ms)
const IDLE_AFTER = 1400;
const IDLE_HOLD = 1000;

export default function CoverTransition({ params }: { params: ParamValues }) {
  const [page, setPage] = useState<"A" | "B">("A");
  const baseRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const animsRef = useRef<Animation[]>([]);
  // 遷移中ロック。再描画は要らないのでstateにしない
  const busyRef = useRef(false);
  // 操作されたことだけ立てる。時刻は rAF の time でしか触らない
  const touchedRef = useRef(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const anims = animsRef.current;
    return () => anims.forEach((a) => a.cancel());
  }, []);

  const play = () => {
    if (busyRef.current) return;
    // reduced-motion: 覆う動きを出さず即座に差し替える
    if (reduce) {
      setPage((p) => (p === "A" ? "B" : "A"));
      return;
    }
    const base = baseRef.current;
    const cover = coverRef.current;
    if (!base || !cover) return;

    busyRef.current = true;
    const ms = params.duration * 1000;
    const timing = { duration: ms, easing: EASE, fill: "forwards" as const };

    // 上のレイヤー: 下辺から迫り上がりながら等倍へ戻る
    const up = cover.animate(
      [
        {
          clipPath: "inset(100% 0 0)",
          transform: `translateY(${params.rise}%) scale(${params.scaleFrom})`,
        },
        { clipPath: "inset(0)", transform: "translateY(0%) scale(1)" },
      ],
      timing
    );
    // 下のレイヤー: 同じ時間・同じ曲線で奥へ引いて暗くなる
    const back = base.animate(
      [
        { transform: "translateY(0%) scale(1)", opacity: 1 },
        {
          transform: `translateY(${RECEDE_SHIFT}%) scale(${params.recede})`,
          opacity: RECEDE_OPACITY,
        },
      ],
      timing
    );
    animsRef.current = [up, back];

    up.onfinish = () => {
      // ベースを次ページに差し替えてからfillを解除する。どちらも同じコミットで
      // 反映されるため、覆い切った絵とベースの絵が入れ替わってもチラつかない
      setPage((p) => (p === "A" ? "B" : "A"));
      up.cancel();
      back.cancel();
      animsRef.current = [];
      busyRef.current = false;
    };
  };

  // 録画も初見も、ポインタが無い間は誰もクリックしない。放っておくと静止画になるので自走させる
  const playRef = useRef(play);
  useEffect(() => {
    playRef.current = play;
  });

  useEffect(() => {
    if (reduce) return;
    const st = { lastInput: 0, lastStep: 0 };
    return addTick((time) => {
      if (touchedRef.current) {
        touchedRef.current = false;
        st.lastInput = time;
        st.lastStep = time;
        return;
      }
      if (!st.lastInput) {
        st.lastInput = time;
        st.lastStep = time;
        return;
      }
      if (time - st.lastInput < IDLE_AFTER) return;
      if (time - st.lastStep < IDLE_HOLD) return;
      st.lastStep = time;
      playRef.current();
    });
  }, [reduce]);

  const next = page === "A" ? "B" : "A";

  return (
    <DemoStage hint="クリック / タップ: 次のページが下から覆いかぶさる(無操作時は自動で繰り返す)">
      <div
        className={styles.pageFrame}
        onClick={() => {
          touchedRef.current = true;
          play();
        }}
      >
        <div
          ref={baseRef}
          className={
            page === "B" ? `${styles.face} ${styles.faceB}` : styles.face
          }
        >
          <span className={page === "B" ? styles.labelB : styles.label}>
            Page {page}
          </span>
        </div>
        <div
          ref={coverRef}
          className={
            next === "B"
              ? `${styles.face} ${styles.faceB} ${styles.cover}`
              : `${styles.face} ${styles.cover}`
          }
          aria-hidden
        >
          <span className={next === "B" ? styles.labelB : styles.label}>
            Page {next}
          </span>
        </div>
      </div>
    </DemoStage>
  );
}
