"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./VinylSlideOut.module.css";

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

// ジャケット3枚。写真は紙と活字のモノクロ(photo-0x)。ラベルにも同じ写真を丸く抜いて使う
const SLEEVES = [
  { photo: "photo-04", side: "Side A", title: "Glossary" },
  { photo: "photo-06", side: "Side B", title: "Folio" },
  { photo: "photo-16", side: "Side C", title: "Colophon" },
] as const;

// 出典(alexandracapitanescu.com /music)と同じ ease-out-expo
const EASE = "cubic-bezier(.16, 1, .3, 1)";

export default function VinylSlideOut({ params }: { params: ParamValues }) {
  const [active, setActive] = useState<number | null>(null);
  const reduce = useReducedMotion();

  return (
    <DemoStage hint="PC: ジャケットにホバー / スマホ: タップ">
      <div className={styles.room}>
      <ul className={styles.crate}>
        {SLEEVES.map((s, i) => {
          const on = active === i;
          // 盤はジャケットの裏から右へ、盤の直径の slide% だけ引き出す
          const discStyle: CSSProperties = {
            transform: `translateX(${on ? params.slide : 0}%)`,
            transition: reduce
              ? "none"
              : `transform ${params.duration}s ${EASE}, box-shadow ${params.duration}s ${EASE}`,
          };
          // ラベルは常に回転アニメーションを持たせ、ホバー外は paused で止める
          // (外したときに0°へ飛ばない。次に出したときは止めた角度から回り出す)
          const labelStyle: CSSProperties = {
            animationDuration: `${params.spin}s`,
            animationPlayState: on && !reduce ? "running" : "paused",
          };
          return (
            <li key={s.photo} className={styles.item}>
              <span
                className={styles.cover}
                data-on={on ? "true" : "false"}
                tabIndex={0}
                role="button"
                aria-label={`${s.side} ${s.title}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive((a) => (a === i ? null : a))}
                onFocus={() => setActive(i)}
                onBlur={() => setActive((a) => (a === i ? null : a))}
                onTouchStart={(e) => {
                  e.preventDefault();
                  setActive((a) => (a === i ? null : i));
                }}
              >
                <span className={styles.disc} style={discStyle}>
                  <span className={styles.label} style={labelStyle}>
                    <img
                      src={`/motion-dict/demo/${s.photo}.jpg`}
                      alt=""
                      draggable={false}
                    />
                  </span>
                  <span className={styles.hole} />
                </span>
                <span className={styles.sleeve}>
                  <img
                    src={`/motion-dict/demo/${s.photo}.jpg`}
                    alt=""
                    draggable={false}
                  />
                </span>
              </span>
              <span
                className={styles.caption}
                style={{
                  transform: `translateX(${on ? 12 : 0}px)`,
                  transition: reduce ? "none" : `transform 0.6s ${EASE}`,
                }}
              >
                <span className={styles.side} data-on={on ? "true" : "false"}>
                  {s.side}
                </span>
                <span className={styles.title}>{s.title}</span>
              </span>
            </li>
          );
        })}
      </ul>
      </div>
    </DemoStage>
  );
}
