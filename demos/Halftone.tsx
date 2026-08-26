"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./Halftone.module.css";

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

// 網点の素になるインクの色。基準の版と、版ズレで左右にはみ出す2色
const INK = "#e9e9e3";
const PLATE_A = "#a5e02e"; // --ai
const PLATE_B = "#2ea5e0";

// 素材は外部画像ではなく自前で描く(canvasを汚染させずに getImageData を通すため)。
// 太い文字となだらかな階調帯を混ぜると、網点の粗密の差がいちばんよく見える。
function drawSource(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // 幅いっぱいに収まる最大サイズまで詰める(端が切れると網点の粗密が読めない)
  let size = h * 0.34;
  ctx.font = `700 ${size}px ui-sans-serif, system-ui, sans-serif`;
  const fit = (w * 0.88) / ctx.measureText("HALFTONE").width;
  if (fit < 1) {
    size *= fit;
    ctx.font = `700 ${size}px ui-sans-serif, system-ui, sans-serif`;
  }
  ctx.fillText("HALFTONE", w / 2, h * 0.4);

  // 下半分に階調の帯を敷く。左から右へ連続的に濃くなるので、
  // 半径がどう効いているかを文字より正確に読める
  const ramp = ctx.createLinearGradient(0, 0, w, 0);
  ramp.addColorStop(0, "#ffffff");
  ramp.addColorStop(1, "#000000");
  ctx.fillStyle = ramp;
  ctx.fillRect(w * 0.12, h * 0.68, w * 0.76, h * 0.16);
}

export default function Halftone({ params }: { params: ParamValues }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef(params);
  // カーソル位置はイベントで保存するだけ。描画は必ずrAF側で行う
  const pointerRef = useRef({ x: -9999, y: -9999 });
  const reduce = useReducedMotion();

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 画素を読むのはこのオフスクリーンだけ。リサイズ時に1回だけ読む
    const src = document.createElement("canvas");
    const sctx = src.getContext("2d", { willReadFrequently: true });
    if (!sctx) return;

    let width = 0;
    let height = 0;
    let data: Uint8ClampedArray | null = null;
    let stillDrawn = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      if (width === 0 || height === 0) return;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      src.width = Math.round(width);
      src.height = Math.round(height);
      drawSource(sctx, src.width, src.height);
      data = sctx.getImageData(0, 0, src.width, src.height).data;
      stillDrawn = false;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // (x, y) の輝度。格子は回転するので整数座標に丸めてから読む
    const luma = (x: number, y: number): number => {
      if (!data) return 1;
      const px = x | 0;
      const py = y | 0;
      if (px < 0 || py < 0 || px >= src.width || py >= src.height) return 1;
      const i = (py * src.width + px) * 4;
      return (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    };

    const paint = () => {
      const p = paramsRef.current;
      const gap = Math.max(2, Math.round(p.gap));
      const reach = p.reach;
      const sep = p.separation;
      const rad = (p.angle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const pointer = pointerRef.current;
      const live = !reduce && pointer.x > -9000;
      // 回転しても画面が欠けないよう、格子は対角線ぶんまで広げて敷く
      const reachOut = Math.ceil(Math.hypot(width, height) / 2 / gap) + 1;
      const cx = width / 2;
      const cy = height / 2;
      // 網点は隣と接する手前で止める。潰れて面になると粒も版ズレも読めなくなる
      const maxR = gap * 0.46;

      ctx.clearRect(0, 0, width, height);

      for (let j = -reachOut; j <= reachOut; j += 1) {
        for (let i = -reachOut; i <= reachOut; i += 1) {
          const ox = i * gap;
          const oy = j * gap;
          const x = cx + ox * cos - oy * sin;
          const y = cy + ox * sin + oy * cos;
          if (x < -gap || y < -gap || x > width + gap || y > height + gap) continue;

          const dark = 1 - luma(x, y);
          let r = dark * maxR;

          let k = 0;
          if (live) {
            const d = Math.hypot(x - pointer.x, y - pointer.y);
            if (d < reach) k = 1 - d / reach;
          }
          // 近づくほど粒が太る。空白の網点まで浮かび上がらせないよう、元の濃さに比例させる
          if (k > 0) r += k * maxR * (0.2 + dark * 0.5);
          if (r < 0.3) continue;
          if (r > maxR) r = maxR;

          if (k > 0.02) {
            // 左右にズラした2色を先に不透明で置き、上から基準の版を重ねる。
            // はみ出した左右の三日月だけが色として残り、これが版ズレに見える
            const shift = sep * k;
            ctx.globalAlpha = k;
            ctx.fillStyle = PLATE_A;
            ctx.beginPath();
            ctx.arc(x - shift, y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = PLATE_B;
            ctx.beginPath();
            ctx.arc(x + shift, y, r, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.globalAlpha = 1;
          ctx.fillStyle = INK;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const removeTick = addTick(() => {
      if (width === 0 || height === 0 || !data) return;
      // reduced-motion: カーソル追従も版ズレも止め、網点化した1枚だけを静止表示する
      if (reduce) {
        if (stillDrawn) return;
        stillDrawn = true;
        paint();
        return;
      }
      paint();
    });

    return () => {
      ro.disconnect();
      removeTick();
    };
  }, [reduce]);

  const track = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    pointerRef.current = { x: clientX - rect.left, y: clientY - rect.top };
  };

  const leave = () => {
    pointerRef.current = { x: -9999, y: -9999 };
  };

  return (
    <DemoStage hint="PC: 網の上をマウスで動かす / スマホ: 指でなぞる">
      <figure
        className={styles.card}
        onPointerMove={(e) => track(e.clientX, e.clientY)}
        onPointerLeave={leave}
        onTouchStart={(e) => track(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => track(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={leave}
      >
        <div className={styles.frame}>
          <canvas className={styles.canvas} ref={canvasRef} aria-hidden />
        </div>
        <figcaption className={styles.caption}>halftone screen</figcaption>
      </figure>
    </DemoStage>
  );
}
