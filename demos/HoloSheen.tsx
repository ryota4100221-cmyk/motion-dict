"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./HoloSheen.module.css";

// 操作が途切れてから照り返しが自走を再開するまでの間(ms)
const IDLE_AFTER = 1500;

export default function HoloSheen({ params }: { params: ParamValues }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(false);
  const touchedRef = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastInput = -Infinity;

    // 観察元(stediconsulting.fr)は照り返しをポインタにだけ付ける。
    // 無操作のあいだは照り返しをカード上でゆっくり巡回させ、録画でも2層が見えるようにする
    const removeTick = addTick((time) => {
      const card = cardRef.current;
      if (!card) return;
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInput = time;
      }
      if (reduce || activeRef.current || time - lastInput < IDLE_AFTER) return;
      const gx = 50 + 34 * Math.sin(time * 0.0009);
      const gy = 45 + 32 * Math.sin(time * 0.0013 + 1);
      card.style.setProperty("--gx", `${gx.toFixed(1)}%`);
      card.style.setProperty("--gy", `${gy.toFixed(1)}%`);
      card.style.setProperty("--glow", "0.85");
    });
    return removeTick;
  }, []);

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const card = e.currentTarget;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--gx", `${((e.clientX - r.left) / r.width) * 100}%`);
    card.style.setProperty("--gy", `${((e.clientY - r.top) / r.height) * 100}%`);
    card.style.setProperty("--glow", "1");
    activeRef.current = true;
    touchedRef.current = true;
  }

  function onPointerLeave(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.style.setProperty("--glow", "0");
    activeRef.current = false;
    touchedRef.current = true;
  }

  const vars = {
    "--hs-period": `${params.period}s`,
    "--hs-angle": `${params.angle}deg`,
    "--hs-intensity": params.intensity,
    "--hs-glare": `${params.glare}px`,
  } as CSSProperties;

  return (
    <DemoStage hint="操作不要(膜は自動で流れる)／照り返し: PCはカード上でマウスを動かす・スマホはカードをなぞる">
      <div
        ref={cardRef}
        className={styles.card}
        style={vars}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerLeave}
      >
        {/* 絵柄はCSSだけで描く(ダミー画像は本番のbasePathで404になる) */}
        <div className={styles.art} aria-hidden>
          <span className={styles.rings} />
          <span className={styles.emblem} />
        </div>
        <div className={styles.meta}>
          <span className={styles.no}>No. 07</span>
          <span className={styles.title}>Holo Foil</span>
          <span className={styles.rarity} aria-hidden>
            ★★★
          </span>
        </div>
        <span className={styles.sheen} aria-hidden />
      </div>
    </DemoStage>
  );
}
