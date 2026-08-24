"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./QuadtreeReveal.module.css";

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

// 解析用の縮小解像度。getImageDataは実寸で呼ぶと重いので、ここまで落としてから1回だけ読む
const SRC_W = 160;
const SRC_H = 90;
// 葉が増えすぎると1フレームの矩形塗りが効かなくなるので上限で打ち切る
const MAX_LEAVES = 4000;
// ほどけ切ってから次の周回に入るまでの余韻(s)。実画像を見せる時間
const REST = 0.7;

type Leaf = { x: number; y: number; w: number; h: number; fill: string };

// 元画像に見立てた絵を手続きで描く(public/demo/dummy-01.svg と同じ構図)。
// getImageDataを使う都合でcanvasを汚染させたくないため、素材は外部画像ではなく自前で描く。
// なだらかな空 + くっきりした稜線、という組み合わせが分割の粗密の差を一番よく見せる。
function drawSource(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#2e332a");
  sky.addColorStop(0.55, "#6d7a4e");
  sky.addColorStop(1, "#b8c98a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#cde86b";
  ctx.beginPath();
  ctx.arc(0.68 * w, 0.34 * h, 0.14 * h, 0, Math.PI * 2);
  ctx.fill();

  const ridge = (pts: number[][], fill: string) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
    for (const [px, py] of pts.slice(1)) ctx.lineTo(px * w, py * h);
    ctx.closePath();
    ctx.fill();
  };
  ridge(
    [
      [0, 0.7],
      [0.217, 0.425],
      [0.392, 0.675],
      [0.533, 0.525],
      [0.717, 0.775],
      [1, 0.6],
      [1, 1],
      [0, 1],
    ],
    "#3a4030"
  );
  ridge(
    [
      [0, 0.825],
      [0.267, 0.625],
      [0.467, 0.85],
      [0.683, 0.7],
      [1, 0.875],
      [1, 1],
      [0, 1],
    ],
    "#23261d"
  );
}

// 矩形ノードを再帰的に四分割し、それ以上割らなかった葉だけを集める。
// 「平均色との差の最大値がthresholdを超えたら割る」が分割の粗密を決める唯一の判定。
function buildLeaves(
  data: Uint8ClampedArray,
  maxDepth: number,
  threshold: number
): Leaf[] {
  const leaves: Leaf[] = [];

  const walk = (x: number, y: number, w: number, h: number, depth: number) => {
    if (leaves.length >= MAX_LEAVES) return;
    const x0 = Math.round(x);
    const y0 = Math.round(y);
    const x1 = Math.min(SRC_W, Math.round(x + w));
    const y1 = Math.min(SRC_H, Math.round(y + h));
    let sr = 0;
    let sg = 0;
    let sb = 0;
    let n = 0;
    for (let py = y0; py < y1; py += 1) {
      for (let px = x0; px < x1; px += 1) {
        const i = (py * SRC_W + px) * 4;
        sr += data[i];
        sg += data[i + 1];
        sb += data[i + 2];
        n += 1;
      }
    }
    if (n === 0) return;
    const ar = sr / n;
    const ag = sg / n;
    const ab = sb / n;

    const push = () => {
      leaves.push({
        x,
        y,
        w,
        h,
        fill: `rgb(${Math.round(ar)}, ${Math.round(ag)}, ${Math.round(ab)})`,
      });
    };
    if (depth >= maxDepth || (w <= 1 && h <= 1)) {
      push();
      return;
    }

    // 平均色からいちばん離れた画素との差。1画素でも浮いていれば割る
    let dev = 0;
    for (let py = y0; py < y1; py += 1) {
      for (let px = x0; px < x1; px += 1) {
        const i = (py * SRC_W + px) * 4;
        const d = Math.max(
          Math.abs(data[i] - ar),
          Math.abs(data[i + 1] - ag),
          Math.abs(data[i + 2] - ab)
        );
        if (d > dev) dev = d;
      }
    }
    if (dev < threshold) {
      push();
      return;
    }

    const hw = w / 2;
    const hh = h / 2;
    walk(x, y, hw, hh, depth + 1);
    walk(x + hw, y, hw, hh, depth + 1);
    walk(x, y + hh, hw, hh, depth + 1);
    walk(x + hw, y + hh, hw, hh, depth + 1);
  };

  walk(0, 0, SRC_W, SRC_H, 0);
  // 面積の降順。大きい平らな面から先に出すことで「粗い像→細部」の順に立ち上がる
  leaves.sort((a, b) => b.w * b.h - a.w * a.h);
  return leaves;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

export default function QuadtreeReveal({ params }: { params: ParamValues }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const paramsRef = useRef(params);
  const restartRef = useRef(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const label = labelRef.current;
    if (!canvas || !label) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 解析用の縮小canvas。画素の読み出しはここからしか行わない
    const src = document.createElement("canvas");
    src.width = SRC_W;
    src.height = SRC_H;
    const sctx = src.getContext("2d", { willReadFrequently: true });
    if (!sctx) return;
    drawSource(sctx, SRC_W, SRC_H);
    const data = sctx.getImageData(0, 0, SRC_W, SRC_H).data;

    let width = 0;
    let height = 0;
    let leaves: Leaf[] = [];
    let leafSig = "";
    let start = 0;
    let stillDrawn = false;

    const ensureLeaves = (depth: number, threshold: number) => {
      const sig = `${depth}|${threshold}`;
      if (sig === leafSig) return;
      leafSig = sig;
      leaves = buildLeaves(data, depth, threshold);
      label.textContent = `${leaves.length} leaves — depth ${depth} / threshold ${threshold}`;
      stillDrawn = false;
    };

    // from〜to番目の葉だけを塗る。葉は重ならないので順番に置くだけでよい
    const paintLeaves = (from: number, to: number) => {
      const sx = width / SRC_W;
      const sy = height / SRC_H;
      for (let i = from; i < to; i += 1) {
        const l = leaves[i];
        const x = l.x * sx;
        const y = l.y * sy;
        const w = l.w * sx;
        const h = l.h * sy;
        ctx.fillStyle = l.fill;
        ctx.fillRect(x, y, w + 0.5, h + 0.5);
      }
      // 分割の構造が読めるように、目に見える大きさの葉にだけ細い枠を足す
      ctx.beginPath();
      for (let i = from; i < to; i += 1) {
        const l = leaves[i];
        if (l.w * sx < 5) continue;
        ctx.rect(l.x * sx + 0.5, l.y * sy + 0.5, l.w * sx - 1, l.h * sy - 1);
      }
      ctx.strokeStyle = "rgba(10, 10, 10, 0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const paintPhoto = () => drawSource(ctx, width, height);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stillDrawn = false;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const removeTick = addTick((time) => {
      const p = paramsRef.current;
      const depth = Math.round(p.depth);
      const threshold = Math.round(p.threshold);
      ensureLeaves(depth, threshold);
      if (width === 0 || height === 0) return;

      // reduced-motion: 組み上げも解体も再生せず、分割しきった1枚だけを静止表示する
      if (reduce) {
        if (stillDrawn) return;
        stillDrawn = true;
        ctx.clearRect(0, 0, width, height);
        paintLeaves(0, leaves.length);
        return;
      }

      const dur = p.duration;
      const hold = p.hold;
      const cycle = dur * 2 + hold + REST;
      if (start === 0 || restartRef.current) {
        restartRef.current = false;
        start = time;
      }
      let t = (time - start) / 1000;
      if (t >= cycle) {
        start = time;
        t = 0;
      }

      ctx.clearRect(0, 0, width, height);
      if (t < dur) {
        // 組み上げ: 面積の大きい葉から順に置いていく
        paintLeaves(0, Math.floor(easeInOut(t / dur) * leaves.length));
      } else if (t < dur + hold) {
        paintLeaves(0, leaves.length);
      } else if (t < dur * 2 + hold) {
        // ほどけ: 同じ順序で葉を消し、下から実画像が出てくる
        paintPhoto();
        const k = Math.floor(easeInOut((t - dur - hold) / dur) * leaves.length);
        paintLeaves(k, leaves.length);
      } else {
        paintPhoto();
      }
    });

    return () => {
      ro.disconnect();
      removeTick();
    };
  }, [reduce]);

  const replay = () => {
    restartRef.current = true;
  };

  return (
    <DemoStage hint="クリック / タップ: 最初から再生">
      <figure
        className={styles.card}
        onClick={replay}
        onTouchStart={replay}
      >
        <div className={styles.frame}>
          <canvas className={styles.canvas} ref={canvasRef} aria-hidden />
        </div>
        <figcaption className={styles.caption}>
          <span ref={labelRef}>quadtree</span>
        </figcaption>
      </figure>
    </DemoStage>
  );
}
