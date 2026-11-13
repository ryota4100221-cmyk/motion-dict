"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./MapPinDrop.module.css";

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

// 先端(しずく形の下端)が刺さる座標。製図用紙の上に散らした4か所
const PINS = [
  { x: 22, y: 60, name: "Folio 03" },
  { x: 41, y: 36, name: "Plate 07" },
  { x: 62, y: 66, name: "Index" },
  { x: 79, y: 40, name: "Colophon" },
];

const STAGGER_MS = 90; // 隣のピンとの落ち始めのずれ
const AUTO_MS = 2400; // 無操作のとき選択を次へ送る間隔

export default function MapPinDrop({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [run, setRun] = useState(0);
  const [active, setActive] = useState(-1);
  // 一度でも触ったら自動送りを止める(ボタンで落ち直すと再開)
  const [touched, setTouched] = useState(false);

  // 無操作の間は、全部が落ち終わってから選択を左から順に回す(録画で静止画にしないため)
  useEffect(() => {
    if (touched) return;
    const landed = params.duration * 1000 + STAGGER_MS * (PINS.length - 1) + 350;
    let iv: ReturnType<typeof setInterval> | undefined;
    const t = setTimeout(() => {
      setActive(0);
      iv = setInterval(() => setActive((a) => (a + 1) % PINS.length), AUTO_MS);
    }, reduce ? 600 : landed);
    return () => {
      clearTimeout(t);
      if (iv) clearInterval(iv);
    };
  }, [run, touched, params.duration, reduce]);

  const select = (i: number) => {
    setTouched(true);
    setActive(i);
  };

  const replay = () => {
    setRun((r) => r + 1);
    setActive(-1);
    setTouched(false);
  };

  const vars = {
    "--mpd-height": `${params.height}px`,
    "--mpd-duration": `${params.duration}s`,
    "--mpd-ease": `cubic-bezier(0.33, 0.85, 0.4, ${params.overshoot})`,
    "--mpd-float": `${params.float}px`,
  } as CSSProperties;

  return (
    <DemoStage hint="PC: ピンにポインタを乗せて選ぶ／スマホ: タップで選ぶ／ボタンで落とし直す">
      <div className={styles.plate} style={vars} data-reduce={reduce ? "" : undefined}>
        <div className={styles.photo} data-md-bleed="" aria-hidden />
        <span className={styles.caption} aria-hidden>
          Plate 13 — Index of places
        </span>

        {PINS.map((p, i) => (
          <button
            // 接頭辞付きの key で、落とし直すたびにノードごと作り直してアニメーションを頭から流す
            key={`pin-${run}-${i}`}
            type="button"
            className={styles.pin}
            data-pin=""
            data-active={active === i ? "true" : undefined}
            aria-label={p.name}
            aria-pressed={active === i}
            style={{ left: `${p.x}%`, top: `${p.y}%`, "--mpd-delay": `${i * STAGGER_MS}ms` } as CSSProperties}
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") select(i);
            }}
            onClick={() => select(i)}
          >
            <span className={styles.shadow} aria-hidden>
              <span className={styles.shadowFloat} />
            </span>
            <span className={styles.drop} aria-hidden>
              <span className={styles.float}>
                <span className={styles.label}>{p.name}</span>
                <svg className={styles.icon} viewBox="0 0 32 44" width="44" height="60">
                  <path
                    d="M16 1.5C8 1.5 1.5 7.8 1.5 15.7 1.5 26.6 16 42.5 16 42.5S30.5 26.6 30.5 15.7C30.5 7.8 24 1.5 16 1.5Z"
                    className={styles.body}
                  />
                  <circle cx="16" cy="15.5" r="5.2" className={styles.hole} />
                </svg>
              </span>
            </span>
          </button>
        ))}

        <button type="button" className={styles.again} onClick={replay}>
          Drop pins again
        </button>
      </div>
    </DemoStage>
  );
}
