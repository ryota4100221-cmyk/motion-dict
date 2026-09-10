"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./DitherDissolve.module.css";

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

// 打った粒の色と、打たなかったマスに残る地の色(枠の背景と同じ墨)
const INK = "#e9e9e3";
const GROUND = "#0a0a0a";

// noiseモードで粒を引き直す間隔(ms)。毎フレーム引くと目に痛いので粗く刻む
const BOIL = 66;

// ベイヤー行列は 2×2 から再帰的に4倍へ広げて作る。
// B(2n) = [[4B, 4B+2], [4B+3, 4B+1]] ── これが順序ディザの定義そのもの。
function bayer(size: number): number[] {
  if (size === 1) return [0];
  const half = size / 2;
  const prev = bayer(half);
  const out = new Array<number>(size * size);
  for (let y = 0; y < half; y += 1) {
    for (let x = 0; x < half; x += 1) {
      const v = prev[y * half + x] * 4;
      out[y * size + x] = v;
      out[y * size + (x + half)] = v + 2;
      out[(y + half) * size + x] = v + 3;
      out[(y + half) * size + (x + half)] = v + 1;
    }
  }
  return out;
}

// options の並び("2×2" / "4×4" / "8×8" / "noise")と対応させる。noiseは行列を使わない
const MATRICES = [bayer(2), bayer(4), bayer(8)];
const MATRIX_SIZES = [2, 4, 8];

// 素材は外部画像ではなく自前で描く(本番のbasePath配下でも確実に出す＆canvasを汚さない)。
// なだらかな空・光の玉・べたの稜線を混ぜると、粒の密度で濃さを出しているのが読める。
function drawSource(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#0d0d0f");
  sky.addColorStop(0.62, "#8f8f96");
  sky.addColorStop(1, "#f2f2ee");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // 光の玉。中心から外へ落ちる階調が、しきい値マップの効き方を一番よく見せる
  const glow = ctx.createRadialGradient(
    w * 0.68,
    h * 0.34,
    0,
    w * 0.68,
    h * 0.34,
    h * 0.5
  );
  glow.addColorStop(0, "#ffffff");
  glow.addColorStop(0.35, "rgba(255,255,255,0.55)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // 稜線はべた塗り。階調のない面が「粒がまったく立たない領域」として対比になる
  ctx.fillStyle = "#08080a";
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h * 0.74);
  ctx.lineTo(w * 0.3, h * 0.56);
  ctx.lineTo(w * 0.52, h * 0.72);
  ctx.lineTo(w * 0.78, h * 0.5);
  ctx.lineTo(w, h * 0.66);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f2f2ee";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 ${Math.round(h * 0.13)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillText("DITHER", w * 0.06, h * 0.94);
}

export default function DitherDissolve({ params }: { params: ParamValues }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef(params);
  // 境目をつまんでいる間のx座標(0〜1)。触っていない間は null で自走に戻す
  const grabRef = useRef<number | null>(null);
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

    // 2値の層を組み立てる作業用canvas。ここへ描いてからマスクを掛けて重ねる
    const dith = document.createElement("canvas");
    const dctx = dith.getContext("2d");
    if (!dctx) return;

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
      dith.width = src.width;
      dith.height = src.height;
      drawSource(sctx, src.width, src.height);
      data = sctx.getImageData(0, 0, src.width, src.height).data;
      stillDrawn = false;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // セル左上の輝度。粒は1マスにつき1個なので、平均は取らず代表点だけ読む
    const luma = (x: number, y: number): number => {
      if (!data) return 0;
      const px = x | 0;
      const py = y | 0;
      if (px < 0 || py < 0 || px >= src.width || py >= src.height) return 0;
      const i = (py * src.width + px) * 4;
      return (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    };

    // noiseモード用の擬似乱数。セル座標と時刻の種から0〜1を作る(配列を持たない)
    const hash = (x: number, y: number, seed: number): number => {
      const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
      return n - Math.floor(n);
    };

    // head: 境目の位置(0〜1)。境目より左が元絵、右が2値の粒。
    // 0なら全面が粒、1まで送りきると左から順に元絵へ解けていく
    const paint = (head: number, seed: number) => {
      const p = paramsRef.current;
      const cell = Math.max(1, Math.round(p.pixel));
      const mode = Math.round(p.matrix);
      const noise = mode >= MATRICES.length;
      const matrix = noise ? MATRICES[MATRICES.length - 1] : MATRICES[mode];
      const msize = noise ? 1 : MATRIX_SIZES[mode];
      const levels = msize * msize;
      // 帯の幅は画面幅に対する割合。0%でも割り算が壊れないよう下限を1pxぶん残す
      const band = Math.max(width * (p.edge / 100), 1);
      const headX = head * (width + band * 2) - band;

      // 2値の層は必ず1枚まるごと描く。マスクを後から掛けるので、
      // 帯の中では「粒の層が半分だけ乗った」状態になり、元絵とクロスして見える
      dctx.setTransform(1, 0, 0, 1, 0, 0);
      dctx.globalCompositeOperation = "source-over";
      dctx.fillStyle = GROUND;
      dctx.fillRect(0, 0, width, height);
      dctx.fillStyle = INK;

      const cols = Math.ceil(width / cell);
      const rows = Math.ceil(height / cell);
      // 粒を打つのは境目より右だけ。左はマスクで消えるので計算ごと省く
      const firstCol = Math.max(0, Math.floor(headX / cell) - 1);
      for (let cy = 0; cy < rows; cy += 1) {
        const y = cy * cell;
        for (let cx = firstCol; cx < cols; cx += 1) {
          const threshold = noise
            ? hash(cx, cy, seed)
            : (matrix[(cy % msize) * msize + (cx % msize)] + 0.5) / levels;
          const x = cx * cell;
          // 輝度がしきい値を超えたマスだけインクを打つ。これが2値化そのもの
          if (luma(x + cell / 2, y + cell / 2) > threshold) {
            dctx.fillRect(x, y, cell, cell);
          }
        }
      }

      // 境目より左を透明にするマスク。destination-in なので粒の層だけが削られる
      const mask = dctx.createLinearGradient(headX, 0, headX + band, 0);
      mask.addColorStop(0, "rgba(0,0,0,0)");
      mask.addColorStop(1, "rgba(0,0,0,1)");
      dctx.globalCompositeOperation = "destination-in";
      dctx.fillStyle = mask;
      dctx.fillRect(0, 0, width, height);
      dctx.globalCompositeOperation = "source-over";

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(src, 0, 0, width, height);
      ctx.drawImage(dith, 0, 0, width, height);
    };

    const removeTick = addTick((time) => {
      if (width === 0 || height === 0 || !data) return;
      // reduced-motion: 境目を中央で止め、粒と元絵が半分ずつ見える1枚を静止表示する
      if (reduce) {
        if (stillDrawn) return;
        stillDrawn = true;
        paint(0.5, 0);
        return;
      }
      const p = paramsRef.current;
      const grab = grabRef.current;
      // 指やカーソルがあればその位置、無ければ左右に往復する三角波で自走させる
      const phase = ((time / (p.cycle * 1000)) % 1) * 2;
      const head = grab ?? (phase > 1 ? 2 - phase : phase);
      paint(head, Math.floor(time / BOIL));
    });

    return () => {
      ro.disconnect();
      removeTick();
    };
  }, [reduce]);

  const track = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    grabRef.current = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const release = () => {
    grabRef.current = null;
  };

  return (
    <DemoStage hint="PC: 絵の上をマウスで左右になぞる / スマホ: 指でなぞる（放置中は自動で往復）">
      <figure
        className={styles.card}
        onPointerMove={(e) => track(e.clientX)}
        onPointerLeave={release}
        onTouchStart={(e) => track(e.touches[0].clientX)}
        onTouchMove={(e) => track(e.touches[0].clientX)}
        onTouchEnd={release}
      >
        <div className={styles.frame}>
          <canvas className={styles.canvas} ref={canvasRef} aria-hidden />
        </div>
        <figcaption className={styles.caption}>source ← threshold → 1-bit</figcaption>
      </figure>
    </DemoStage>
  );
}
