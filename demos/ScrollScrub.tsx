"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./ScrollScrub.module.css";

// 総フレーム数。実務の<video>ならdurationに当たる値
const TOTAL = 120;
// ターンテーブルを構成する点の数
const DOTS = 18;

// frame番号だけを入力に取り、同じ絵を必ず返す描画。
// <video>のcurrentTimeを書き換える代わりに、ここでは連番画像(frame sequence)を
// その場で描いている。スクラブ側の設計はどちらでも同じ
function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: number
) {
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 16;
  // 横長のステージでも縦に溢れないよう、幅と高さの両方から上限を掛ける
  const radius = Math.min(w * 0.24, h * 0.42);
  const angle = (frame / TOTAL) * Math.PI * 2;

  // 接地面の楕円
  ctx.strokeStyle = "rgba(216, 212, 200, 0.14)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius, radius * 0.34, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 手前ほど大きく濃く描いて奥行きを出す
  for (let i = 0; i < DOTS; i += 1) {
    const t = (i / DOTS) * Math.PI * 2 + angle;
    const depth = (Math.sin(t) + 1) / 2;
    const x = cx + Math.cos(t) * radius;
    const y = cy + Math.sin(t) * radius * 0.34;
    const r = 2 + depth * 5;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle =
      i === 0
        ? `rgba(165, 224, 46, ${0.35 + depth * 0.65})`
        : `rgba(216, 212, 200, ${0.12 + depth * 0.7})`;
    ctx.fill();

    // 手前の点だけ床への影を落とす
    if (depth > 0.5) {
      ctx.beginPath();
      ctx.ellipse(x, cy + radius * 0.46, r * 1.2, r * 0.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(216, 212, 200, ${(depth - 0.5) * 0.16})`;
      ctx.fill();
    }
  }

  // 下部のフィルムストリップ。今どのフレームにいるかを目で追えるようにする
  // (DemoStageのhintが bottom:14px に居るので、そこは避けた高さに置く)
  const stripY = h - 56;
  const stripX = 24;
  const stripW = w - 48;
  ctx.strokeStyle = "rgba(216, 212, 200, 0.16)";
  ctx.beginPath();
  ctx.moveTo(stripX, stripY);
  ctx.lineTo(stripX + stripW, stripY);
  ctx.stroke();

  for (let i = 0; i < TOTAL; i += 4) {
    const x = stripX + (i / (TOTAL - 1)) * stripW;
    ctx.fillStyle = "rgba(216, 212, 200, 0.2)";
    ctx.fillRect(x, stripY - 4, 1, 8);
  }

  const headX = stripX + (frame / (TOTAL - 1)) * stripW;
  ctx.fillStyle = "#a5e02e";
  ctx.fillRect(headX - 1, stripY - 9, 2, 18);
}

export default function ScrollScrub({ params }: { params: ParamValues }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameLabelRef = useRef<HTMLSpanElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const canvas = canvasRef.current;
    const label = frameLabelRef.current;
    if (!scroller || !canvas || !label) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    // 補間中の再生位置(frame)。実務では video.currentTime に当たる
    let current = 0;
    // 最後に実際に描いたフレーム。thresholdの判定はこれとの差で行う
    let drawn = Number.NaN;

    const paint = (frame: number) => {
      drawFrame(ctx, width, height, Math.round(frame));
      label.textContent = `FRAME ${String(Math.round(frame)).padStart(3, "0")} / ${TOTAL}`;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(current);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const removeTick = addTick(() => {
      const p = paramsRef.current;
      const max = scroller.scrollHeight - scroller.clientHeight;
      const progress = max > 0 ? scroller.scrollTop / max : 0;
      const target = progress * (TOTAL - 1);

      // reduced-motion時とsmoothing=1は補間なしの即時代入
      const k = reduce || p.smoothing >= 1 ? 1 : p.smoothing;
      current += (target - current) * k;

      // 差がthreshold未満なら描き換えない。<video>ならここでシークを間引く
      if (!Number.isNaN(drawn) && Math.abs(current - drawn) < p.threshold) return;
      drawn = current;
      paint(current);
    });

    return () => {
      ro.disconnect();
      removeTick();
    };
  }, []);

  return (
    <DemoStage
      hint="PC: ステージ内をホイールでスクロール / スマホ: 上下スワイプ"
      className={styles.scrollStage}
    >
      <canvas className={styles.canvas} ref={canvasRef} aria-hidden />
      <div className={styles.hud} aria-hidden>
        <span className={styles.frame} ref={frameLabelRef}>
          FRAME 000 / {TOTAL}
        </span>
        <span className={styles.tag}>scrub</span>
      </div>
      {/* スクロールを受けるのはこの層。canvasとHUDはpointer-events:noneで透過させる */}
      <div className={styles.scroller} ref={scrollerRef}>
        <div
          className={styles.track}
          style={{ height: `${params.length * 100}%` }}
        />
      </div>
    </DemoStage>
  );
}
