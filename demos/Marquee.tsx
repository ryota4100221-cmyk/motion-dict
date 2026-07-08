"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./Marquee.module.css";

const TEXT = "MOTION DICTIONARY —";
// ステージ幅+1セット分を必ず覆えるだけ複製しておく
const COPIES = 10;

// content/marquee.ts の direction options と同順: 0=left, 1=right

export default function Marquee({ params }: { params: ParamValues }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLSpanElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const track = trackRef.current;
    const item = itemRef.current;
    if (!track || !item) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // reduced-motion時は動かさず静止テキストのまま
    if (reduce) return;

    let pos = 0;
    let lastTime = -1;

    const removeTick = addTick((time) => {
      const p = paramsRef.current;
      if (lastTime < 0) lastTime = time;
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // 1セット = テキスト幅 + gap。この幅で剰余を取れば継ぎ目なくループする
      const unit = item.offsetWidth + p.gap;
      if (unit <= 0) return;

      pos += p.speed * dt * (Math.round(p.direction) === 0 ? 1 : -1);
      const wrapped = ((pos % unit) + unit) % unit;
      track.style.transform = `translateX(${-wrapped}px)`;
    });

    return removeTick;
  }, []);

  return (
    <DemoStage hint="自動でループ再生">
      <div className={styles.viewport}>
        <div
          className={styles.track}
          ref={trackRef}
          style={{ columnGap: params.gap }}
        >
          {Array.from({ length: COPIES }, (_, i) => (
            <span
              className={styles.item}
              ref={i === 0 ? itemRef : undefined}
              aria-hidden={i > 0}
              key={i}
            >
              {TEXT}
            </span>
          ))}
        </div>
      </div>
    </DemoStage>
  );
}
