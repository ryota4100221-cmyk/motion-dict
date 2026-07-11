"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./LogoMarquee.module.css";

// content/logo-marquee.ts の hoverPause options と同順: 0=off, 1=pause

// ダミーロゴ(インラインSVG)。実案件では filter: grayscale(1) で無彩色化するが、
// ここでは最初から単色で描き、「見た目の面積」が揃うよう各ロゴの寸法を個別に調整している
const LOGOS: { name: string; node: ReactNode }[] = [
  {
    name: "Orbit",
    node: (
      <svg width="88" height="26" viewBox="0 0 88 26" aria-hidden>
        <circle cx="13" cy="13" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="13" cy="13" r="3" fill="currentColor" />
        <text
          x="30"
          y="18"
          fill="currentColor"
          fontSize="14"
          letterSpacing="1.5"
          fontFamily="var(--font-mono), monospace"
        >
          Orbit
        </text>
      </svg>
    ),
  },
  {
    name: "Kado",
    node: (
      <svg width="82" height="24" viewBox="0 0 82 24" aria-hidden>
        <polygon points="12 2 22 12 12 22 2 12" fill="currentColor" />
        <text
          x="30"
          y="17"
          fill="currentColor"
          fontSize="13"
          letterSpacing="1.5"
          fontFamily="var(--font-mono), monospace"
        >
          Kado
        </text>
      </svg>
    ),
  },
  {
    name: "Monaka & co.",
    node: (
      // ワードマークのみのロゴ。横長なので高さを抑えて面積を合わせる
      <svg width="118" height="16" viewBox="0 0 118 16" aria-hidden>
        <text
          x="0"
          y="13"
          fill="currentColor"
          fontSize="13"
          letterSpacing="1"
          fontFamily="var(--font-mono), monospace"
        >
          Monaka &amp; co.
        </text>
      </svg>
    ),
  },
  {
    name: "Peak",
    node: (
      <svg width="84" height="24" viewBox="0 0 84 24" aria-hidden>
        <polygon
          points="2 20 12 4 22 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <text
          x="30"
          y="17"
          fill="currentColor"
          fontSize="13"
          letterSpacing="1.5"
          fontFamily="var(--font-mono), monospace"
        >
          Peak
        </text>
      </svg>
    ),
  },
  {
    name: "Nova",
    node: (
      <svg width="90" height="26" viewBox="0 0 90 26" aria-hidden>
        <circle cx="11" cy="13" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="19" cy="13" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <text
          x="36"
          y="18"
          fill="currentColor"
          fontSize="14"
          letterSpacing="1.5"
          fontFamily="var(--font-mono), monospace"
        >
          Nova
        </text>
      </svg>
    ),
  },
];

// ステージ幅+1セット分を必ず覆えるだけ複製しておく
const COPIES = 3;

export default function LogoMarquee({ params }: { params: ParamValues }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const track = trackRef.current;
    const set = setRef.current;
    if (!track || !set) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // reduced-motion時は動かさず静的なロゴ一覧のまま
    if (reduce) return;

    let pos = 0;
    let lastTime = -1;

    const removeTick = addTick((time) => {
      const p = paramsRef.current;
      if (lastTime < 0) lastTime = time;
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // hoverPause=pause(1) のときだけホバー/タッチで停止する
      if (pausedRef.current && Math.round(p.hoverPause) === 1) return;

      // 1セット = ロゴ列の幅 + gap。この幅で剰余を取れば継ぎ目なくループする
      const unit = set.offsetWidth + p.gap;
      if (unit <= 0) return;

      pos += p.speed * dt;
      const wrapped = ((pos % unit) + unit) % unit;
      track.style.transform = `translateX(${-wrapped}px)`;
    });

    return removeTick;
  }, []);

  // 両端 fade(px) を mask-image で透明に溶かし、ロゴの見切れを隠す
  const fade = Math.round(params.fade);
  const mask =
    fade > 0
      ? `linear-gradient(to right, transparent 0, #000 ${fade}px, #000 calc(100% - ${fade}px), transparent 100%)`
      : undefined;
  const viewportStyle: CSSProperties = { maskImage: mask, WebkitMaskImage: mask };

  return (
    <DemoStage hint="PC: ホバーで一時停止 / スマホ: タップで停止・再開">
      <div
        className={styles.viewport}
        style={viewportStyle}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused((v) => !v)}
      >
        <div className={styles.track} ref={trackRef} style={{ columnGap: params.gap }}>
          {Array.from({ length: COPIES }, (_, i) => (
            <div
              className={styles.set}
              ref={i === 0 ? setRef : undefined}
              style={{ columnGap: params.gap }}
              aria-hidden={i > 0}
              key={i}
            >
              {LOGOS.map((logo) => (
                <span className={styles.logo} key={logo.name}>
                  {logo.node}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </DemoStage>
  );
}
