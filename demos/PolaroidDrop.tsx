"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties, PointerEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./PolaroidDrop.module.css";

// 置く順(左上→右下)に並べた写真と添え書き。card-shuffle(06/10/18)と重ならない組
const PHOTOS = [
  { src: "/motion-dict/demo/photo-01.jpg", plate: "Plate 01", word: "ぱさっ" },
  { src: "/motion-dict/demo/photo-03.jpg", plate: "Plate 03", word: "トスッ" },
  { src: "/motion-dict/demo/photo-05.jpg", plate: "Plate 05", word: "Folio" },
  { src: "/motion-dict/demo/photo-08.jpg", plate: "Plate 08", word: "Index" },
  { src: "/motion-dict/demo/photo-12.jpg", plate: "Plate 12", word: "パラパラ" },
  { src: "/motion-dict/demo/photo-15.jpg", plate: "Plate 15", word: "Colophon" },
];

// 着地角度の係数(出典 juliamoresco.com.br の -5 / 3 / -2 / 4 / -3.5 / 5 deg を最大5degで割った値)。
// 乱数にしないので、置き直しても同じ散らばり方になる
const TILT_RATIO = [-1, 0.6, -0.4, 0.8, -0.7, 1];

// 置く前の大きさ(出典 scale 1.08)と、最初の1枚までの待ち(出典 0.12s)
const LIFT_SCALE = 1.08;
const FIRST_DELAY = 0.12;

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

export default function PolaroidDrop({ params }: { params: ParamValues }) {
  // 置き直すたびに増やして写真を作り直す(=CSSアニメーションを頭から再生)
  const [deal, setDeal] = useState(0);
  const [lifted, setLifted] = useState<number | null>(null);
  const reduce = useReducedMotion();

  const { drop, tilt, duration, stagger } = params;

  const relay = () => {
    setLifted(null);
    setDeal((d) => d + 1);
  };

  // マウスは入っている間だけ持ち上げ、タッチはタップでトグルする
  const onEnter = (i: number) => (e: PointerEvent) => {
    if (e.pointerType === "mouse") setLifted(i);
  };
  const onLeave = (e: PointerEvent) => {
    if (e.pointerType === "mouse") setLifted(null);
  };
  const onDown = (i: number) => (e: PointerEvent) => {
    if (e.pointerType !== "mouse") setLifted((cur) => (cur === i ? null : i));
  };

  const boardStyle = {
    "--pd-drop": `${-drop}%`,
    "--pd-lift": `${LIFT_SCALE}`,
    "--pd-dur": `${duration}s`,
  } as CSSProperties;

  // 値を動かしたら作り直して置き直す(スライダーの効き目がすぐ見える)
  const keyBase = `deal-${deal}-${drop}-${tilt}-${duration}-${stagger}`;

  return (
    <DemoStage hint="写真に触れる / タップ: 持ち上がる">
      <ul className={styles.board} style={boardStyle}>
        {PHOTOS.map((p, i) => {
          const slotStyle = {
            "--pd-r": `${(TILT_RATIO[i] * tilt).toFixed(2)}deg`,
            animationDelay: `${(FIRST_DELAY + (i * stagger) / 1000).toFixed(3)}s`,
          } as CSSProperties;
          return (
            <li
              key={`${keyBase}-${i}`}
              className={reduce ? styles.slot : `${styles.slot} ${styles.drop}`}
              style={slotStyle}
            >
              <figure
                className={lifted === i ? `${styles.polaroid} ${styles.lifted}` : styles.polaroid}
                onPointerEnter={onEnter(i)}
                onPointerLeave={onLeave}
                onPointerDown={onDown(i)}
              >
                <img src={p.src} alt="" draggable={false} className={styles.photo} />
                <figcaption className={styles.caption}>
                  {p.plate}
                  <span className={styles.word}> — {p.word}</span>
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ul>

      <button className={styles.btn} onClick={relay}>
        Lay out again
      </button>
    </DemoStage>
  );
}
