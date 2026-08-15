"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./AsciiEffect.module.css";

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

// 暗い順に並べた文字ランプ。ASCII化は「輝度をこの並びの添字に写像する」だけの処理で、
// 表現の印象はほぼこの3本の選び方で決まる
const RAMPS = [
  " .:-=+*#%@",
  " .'^,;Il!i><~+_-?][}{1)(|tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  " ░▒▓█",
];
const RAMP_NAMES = ["standard", "dense", "blocks"];

// 等幅フォントのおおよその縦横比。セル高さはこれを掛けて決める
const CELL_RATIO = 1.8;
// 元映像に見立てた素材の解像度。実務ならここが<video>の中身にあたる
const SRC_W = 216;
const SRC_H = 120;
// reduced-motion時に固定する時刻。光球が重なりすぎない位置を選んである
const STILL_T = 1.6;

// 「元映像」を手続きで描く。2つの光球がリサージュ軌道で交差するだけの絵だが、
// なだらかな階調があるとASCII化したとき文字が等高線のように並ぶ
function drawSource(ctx: CanvasRenderingContext2D, t: number) {
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, SRC_W, SRC_H);

  const orbs = [
    {
      x: 0.5 + 0.3 * Math.cos(t * 0.6),
      y: 0.5 + 0.26 * Math.sin(t * 0.9),
      r: 0.78 + 0.1 * Math.sin(t * 1.3),
    },
    {
      x: 0.5 + 0.26 * Math.cos(t * 0.9 + 2.1),
      y: 0.5 + 0.22 * Math.sin(t * 0.5 + 1.2),
      r: 0.56,
    },
  ];

  // 重なった部分だけ明るくしたいので加算合成
  ctx.globalCompositeOperation = "lighter";
  for (const o of orbs) {
    const cx = o.x * SRC_W;
    const cy = o.y * SRC_H;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, o.r * SRC_H * 1.6);
    g.addColorStop(0, "rgba(255, 255, 255, 1)");
    g.addColorStop(0.45, "rgba(255, 255, 255, 0.34)");
    g.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SRC_W, SRC_H);
  }
  ctx.globalCompositeOperation = "source-over";
}

export default function AsciiEffect({ params }: { params: ParamValues }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const paramsRef = useRef(params);
  const [raw, setRaw] = useState(false);
  const rawRef = useRef(raw);
  const reduce = useReducedMotion();

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    rawRef.current = raw;
  }, [raw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const label = labelRef.current;
    if (!canvas || !label) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 元映像に見立てた素材。表示はせず、縮小元としてだけ使う
    const src = document.createElement("canvas");
    src.width = SRC_W;
    src.height = SRC_H;
    const sctx = src.getContext("2d");
    // 読み出すのはこの極小canvasだけ。実寸で getImageData すると毎フレーム落ちる
    const grid = document.createElement("canvas");
    const gctx = grid.getContext("2d", { willReadFrequently: true });
    if (!sctx || !gctx) return;

    let width = 0;
    let height = 0;
    let last = 0;
    // reduced-motion時の再描画判定。paramsやサイズが変わったときだけ描き直す
    let stillSig = "";

    const paint = (t: number) => {
      const p = paramsRef.current;
      drawSource(sctx, t);

      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, width, height);

      // 比較用。フィルタを外すと元の階調がそのまま見える
      if (rawRef.current) {
        ctx.drawImage(src, 0, 0, width, height);
        label.textContent = "SOURCE — フィルタ off";
        return;
      }

      const cellW = p.cell;
      const cellH = p.cell * CELL_RATIO;
      const cols = Math.max(1, Math.floor(width / cellW));
      const rows = Math.max(1, Math.floor(height / cellH));
      if (grid.width !== cols || grid.height !== rows) {
        grid.width = cols;
        grid.height = rows;
      }

      // drawImageの縮小がセル平均の代わりになる。自前で画素を平均しなくてよい
      gctx.drawImage(src, 0, 0, cols, rows);
      const data = gctx.getImageData(0, 0, cols, rows).data;

      const ramp = RAMPS[Math.round(p.ramp)] ?? RAMPS[0];
      ctx.font = `${(cellH * 0.92).toFixed(1)}px Menlo, Monaco, "Courier New", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const i = (r * cols + c) * 4;
          const lum =
            (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
          // 中間調を基準に伸縮させる。0.5を軸にすると明暗どちらにも均等に効く
          const l = Math.min(1, Math.max(0, (lum - 0.5) * p.contrast + 0.5));
          const ch = ramp[Math.min(ramp.length - 1, Math.floor(l * ramp.length))];
          if (ch === " ") continue;
          ctx.fillStyle =
            l > 0.8 ? "#a5e02e" : `rgba(216, 212, 200, ${(0.18 + l * 0.82).toFixed(2)})`;
          ctx.fillText(ch, c * cellW + cellW / 2, r * cellH + cellH / 2);
        }
      }

      label.textContent = `${cols}×${rows} cells — ${RAMP_NAMES[Math.round(p.ramp)]} ramp`;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stillSig = "";
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const removeTick = addTick((time) => {
      const p = paramsRef.current;
      // reduced-motion時は文字を一切ちらつかせない。静止した1フレームだけを描く
      if (reduce) {
        const sig = `${p.cell}|${p.ramp}|${p.contrast}|${rawRef.current}`;
        if (sig === stillSig) return;
        stillSig = sig;
        paint(STILL_T);
        return;
      }
      // 毎フレーム描き換えない。間引くほど「端末で処理している」質感が出る
      if (time - last < 1000 / p.fps) return;
      last = time;
      paint(time / 1000);
    });

    return () => {
      ro.disconnect();
      removeTick();
    };
  }, [reduce]);

  return (
    <DemoStage hint="PC: ホバーで元映像と比較 / スマホ: タップで切替">
      <figure
        className={styles.card}
        onMouseEnter={() => setRaw(true)}
        onMouseLeave={() => setRaw(false)}
        onTouchStart={() => setRaw((v) => !v)}
      >
        <div className={styles.frame}>
          <canvas className={styles.canvas} ref={canvasRef} aria-hidden />
        </div>
        <figcaption className={styles.caption}>
          <span ref={labelRef}>ascii</span>
        </figcaption>
      </figure>
    </DemoStage>
  );
}
