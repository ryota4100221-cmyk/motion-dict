"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./FoldTransition.module.css";

// 交互に開く2枚の紙面。直前の項目 torn-paper-reveal(photo-09)と重ならない写真
const FOLIOS = [
  {
    src: "/motion-dict/demo/photo-02.jpg",
    no: "Folio 02",
    title: "Fold transition",
    word: "パタン",
    note: "The page folds shut along the gutter.",
  },
  {
    src: "/motion-dict/demo/photo-14.jpg",
    no: "Folio 14",
    title: "Gatefold",
    word: "ぱたっ",
    note: "And opens again on the next spread.",
  },
];

// 畳み切ってから開き始めるまでの間(s)
const HOLD = 0.12;

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

type Phase = "idle" | "fold" | "unfold";

function Folio({ i }: { i: number }) {
  const f = FOLIOS[i];
  return (
    <div className={styles.folio}>
      <div className={styles.plate}>
        <img src={f.src} alt="" draggable={false} className={styles.photo} />
      </div>
      <div className={styles.text}>
        <span className={styles.no}>{f.no}</span>
        <span className={styles.title}>{f.title}</span>
        <span className={styles.word}>{f.word}</span>
        <span className={styles.note}>{f.note}</span>
      </div>
    </div>
  );
}

export default function FoldTransition({ params }: { params: ParamValues }) {
  const [page, setPage] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  // 開き直すたびに増やし、葉を作り直してアニメーションを頭から再生する
  const [run, setRun] = useState(0);
  const reduce = useReducedMotion();

  const { fold, unfold, shade, perspective } = params;

  const turn = () => {
    if (phase !== "idle") return;
    if (reduce) {
      setPage((p) => (p + 1) % FOLIOS.length);
      setRun((r) => r + 1);
      return;
    }
    setPhase("fold");
    setRun((r) => r + 1);
  };

  // 左の葉のアニメーション終了で次の段へ(右の葉も同じ時間で動いている)
  const onEnd = () => {
    if (phase === "fold") {
      setPage((p) => (p + 1) % FOLIOS.length);
      setPhase("unfold");
      setRun((r) => r + 1);
    } else if (phase === "unfold") {
      setPhase("idle");
    }
  };

  const bookStyle = {
    perspective: `${perspective}px`,
    "--ft-fold": `${fold}s`,
    "--ft-unfold": `${unfold}s`,
    "--ft-hold": `${HOLD}s`,
    "--ft-shade": `rgba(55, 53, 45, ${(shade / 100).toFixed(2)})`,
  } as CSSProperties;

  const leafClass = (side: "left" | "right") =>
    [styles.leaf, styles[side], phase === "fold" ? styles.folding : "", phase === "unfold" ? styles.unfolding : ""]
      .filter(Boolean)
      .join(" ");

  return (
    <DemoStage hint="クリック / タップ: 紙面が折り目で畳まれ、次のページが開く">
      <div className={styles.book} style={bookStyle} onClick={turn} aria-hidden>
        <div
          key={`left-${run}`}
          className={leafClass("left")}
          onAnimationEnd={(e) => {
            // 中身のフェードと ::after の陰りの終了は数えない(葉そのものの回転だけ)
            if (e.target === e.currentTarget && !e.pseudoElement) onEnd();
          }}
        >
          <div className={`${styles.inner} ${reduce ? styles.fadeIn : ""}`}>
            <Folio i={page} />
          </div>
        </div>
        <div key={`right-${run}`} className={leafClass("right")}>
          <div className={`${styles.inner} ${reduce ? styles.fadeIn : ""}`}>
            <Folio i={page} />
          </div>
        </div>
      </div>

      <button className={styles.btn} onClick={turn}>
        Turn to next folio
      </button>
    </DemoStage>
  );
}
