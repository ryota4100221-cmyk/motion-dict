"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./FogDrift.module.css";

// 奥の層ほど遅く・薄くする倍率。周期比は割り切れない値にして、全層が揃う瞬間を遠ざける
const SPEED = [1, 1.4, 1.75, 2.15];
const FADE = [1, 0.8, 0.55, 0.4];
// 開始位相(負のdelayの割合)。読み込み直後から各層がばらばらの位置にいるようにする
const PHASE = [0.47, 0.73, 0.89, 0.3];

export default function FogDrift({ params }: { params: ParamValues }) {
  // 手前の1層だけにすると「画像が横に滑っているだけ」に戻る。層のすれ違いが効いていることの実演。
  // ホバーで切り替えると録画(カーソルが中央を周回する)が1層だけの画になるので、クリックで切り替える
  const [solo, setSolo] = useState(false);
  const bankRef = useRef<HTMLDivElement>(null);

  // 画面外では長周期のループを止める。stateにせず属性を直接切り替え、再レンダーを起こさない
  useEffect(() => {
    const bank = bankRef.current;
    if (!bank) return;
    const io = new IntersectionObserver(([e]) => {
      bank.dataset.paused = e.isIntersecting ? "false" : "true";
    });
    io.observe(bank);
    return () => io.disconnect();
  }, []);

  const count = Math.round(params.layers);
  const layers = Array.from({ length: count }, (_, i) => {
    const dur = params.duration * SPEED[i];
    return {
      dur,
      style: {
        "--dur": `${dur.toFixed(2)}s`,
        "--delay": `${(-dur * PHASE[i]).toFixed(2)}s`,
        "--op": `${(params.density * FADE[i]).toFixed(3)}`,
      } as CSSProperties,
    };
  });

  return (
    <DemoStage hint="PC: クリックで手前の1層だけに(比較) / スマホ: タップで切替">
      <figure
        className={styles.card}
        onClick={() => setSolo((v) => !v)}
      >
        <div className={styles.frame}>
          <div className={styles.hills} aria-hidden />
          <div
            ref={bankRef}
            className={styles.bank}
            data-solo={solo}
            style={{ "--travel": `${params.travel}%` } as CSSProperties}
            aria-hidden
          >
            {/* 奥から描く。偶数番目は逆向き(counter-drift)で、同じ霧を左右反転して使い回す */}
            {layers
              .map((l, i) => (
                <span
                  key={i}
                  className={i % 2 ? styles.counter : styles.wisp}
                  data-front={i === 0}
                  style={l.style}
                />
              ))
              .reverse()}
          </div>
          <span className={styles.title}>Nightfall</span>
        </div>
        <figcaption className={styles.caption}>
          {solo
            ? `Solo — 手前の1層だけ(片道 ${params.duration}s)`
            : `${count}層 / 片道 ${layers
                .map((l) => `${l.dur.toFixed(0)}s`)
                .join(" · ")} — 幅 ${params.travel}%`}
        </figcaption>
      </figure>
    </DemoStage>
  );
}
