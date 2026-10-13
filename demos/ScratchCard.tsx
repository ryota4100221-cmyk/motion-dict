"use client";

import { useEffect, useRef, useSyncExternalStore, type PointerEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./ScratchCard.module.css";

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

const AUTO_AFTER = 2200; // 最後に触ってからこの時間が経つとコインの自走を再開する(ms)
const AUTO_DUR = 3600; // 自走で1往復ぶんのジグザグをなぞる時間(ms)
const AUTO_PASSES = 3; // これだけなぞっても閾値に届かなければ打ち切って剥がす
const HOLD = 1600; // 剥がれてから膜を張り直すまで(ms)
const MEASURE_EVERY = 6; // 削れ率は数フレームに1回だけ測る
const SAMPLE = 6; // 削れ率を数えるときに飛ばす画素(device px)

// 観察元(atomato.co)の d="M24 70 L116 60 L24 94 …" と同じ、右上がりに往復するジグザグ。
// 2本目は1本目の行間を埋める位置にずらす
const PATHS = [
  [
    [0.1, 0.3],
    [0.9, 0.18],
    [0.1, 0.54],
    [0.9, 0.42],
    [0.1, 0.78],
    [0.9, 0.66],
    [0.12, 0.94],
    [0.88, 0.86],
  ],
  [
    [0.9, 0.1],
    [0.1, 0.2],
    [0.9, 0.32],
    [0.1, 0.44],
    [0.9, 0.56],
    [0.1, 0.68],
    [0.9, 0.8],
    [0.1, 0.9],
  ],
];

// 折れ線の全長に対する割合 t の位置
const along = (pts: number[][], t: number, w: number, h: number) => {
  const p = pts.map(([x, y]) => [x * w, y * h]);
  const lens = p.slice(1).map((q, i) => Math.hypot(q[0] - p[i][0], q[1] - p[i][1]));
  let d = t * lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const k = lens[i] ? Math.min(1, d / lens[i]) : 0;
      return { x: p[i][0] + (p[i + 1][0] - p[i][0]) * k, y: p[i][1] + (p[i + 1][1] - p[i][1]) * k };
    }
    d -= lens[i];
  }
  return { x: p[0][0], y: p[0][1] };
};

// 銀の膜。観察元と同じ5段のフォイル色に、案内文と点線を載せる
const paintFoil = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#e9e9e9");
  g.addColorStop(0.35, "#bdbdbd");
  g.addColorStop(0.55, "#f5f5f5");
  g.addColorStop(0.8, "#b3b3b3");
  g.addColorStop(1, "#dadada");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#7a7a7a";
  ctx.font = "600 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SCRATCH TO REVEAL", w / 2, h * 0.2);
  ctx.strokeStyle = "#a6a6a6";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const x = w * (0.2 + i * 0.1);
    ctx.moveTo(x - 6, h * 0.84);
    ctx.lineTo(x + 6, h * 0.84);
  }
  ctx.stroke();
};

type Pt = { x: number; y: number; start: boolean };

export default function ScratchCard({ params }: { params: ParamValues }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coinRef = useRef<HTMLSpanElement>(null);
  const meterRef = useRef<HTMLSpanElement>(null);
  const resultRef = useRef<HTMLParagraphElement>(null);
  const paramsRef = useRef(params);
  // イベントでは座標を溜めるだけ。消す・測る・剥がすは rAF 側で行う
  const queueRef = useRef<Pt[]>([]);
  const downRef = useRef(false);
  const touchedRef = useRef(false);
  const hoverRef = useRef<{ x: number; y: number; mouse: boolean } | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    let cw = 0;
    let ch = 0;
    let dpr = 1;
    let phase: "scratch" | "open" = "scratch";
    let openAt = 0;
    let lastInput = -Infinity;
    let autoStart: number | null = null;
    let pass = 0;
    let prev: { x: number; y: number } | null = null;
    let frame = 0;
    let dirty = false;

    const reset = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      paintFoil(ctx, cw, ch);
      canvas.style.transition = "none";
      canvas.style.opacity = "1";
      canvas.style.pointerEvents = "";
      phase = "scratch";
      autoStart = null;
      pass = 0;
      prev = null;
      queueRef.current = [];
      if (cardRef.current) delete cardRef.current.dataset.open;
      if (meterRef.current) meterRef.current.textContent = "0";
      if (resultRef.current) resultRef.current.textContent = "";
    };

    const open = (time: number, canvas: HTMLCanvasElement) => {
      phase = "open";
      openAt = time;
      const { fade } = paramsRef.current;
      canvas.style.transition = reduce ? "none" : `opacity ${fade}s ease-out`;
      canvas.style.opacity = "0";
      canvas.style.pointerEvents = "none";
      if (cardRef.current) cardRef.current.dataset.open = "1";
      if (resultRef.current) resultRef.current.textContent = "当たり：20% OFF（コード MOTION20）";
    };

    return addTick((time) => {
      // ノードは入れ替わることがあるので毎フレーム引き直す
      const card = cardRef.current;
      const canvas = canvasRef.current;
      const coin = coinRef.current;
      if (!card || !canvas || !coin) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      // 寸法が変わったら解像度を取り直して膜を張り直す
      const w = card.clientWidth;
      const h = card.clientHeight;
      const r = Math.min(window.devicePixelRatio || 1, 2);
      if (w !== cw || h !== ch || r !== dpr) {
        cw = w;
        ch = h;
        dpr = r;
        canvas.width = Math.round(w * r);
        canvas.height = Math.round(h * r);
        ctx.setTransform(r, 0, 0, r, 0, 0);
        reset(canvas, ctx);
      }

      if (touchedRef.current) {
        touchedRef.current = false;
        lastInput = time;
      }
      const user = downRef.current || time - lastInput < AUTO_AFTER;
      const { brush, threshold, fade } = paramsRef.current;
      let coinAt: { x: number; y: number; tilt: number } | null = null;

      if (phase === "open") {
        queueRef.current = [];
        if (time - openAt > fade * 1000 + HOLD) reset(canvas, ctx);
      } else {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = brush;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        const q = queueRef.current;
        if (q.length) {
          // 前回の点から線でつなぐ。点だけ打つと速い操作で跡が途切れる
          ctx.beginPath();
          for (const pt of q) {
            if (pt.start || !prev) ctx.moveTo(pt.x, pt.y);
            else ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(pt.x + (pt.start ? 0.01 : 0), pt.y);
            prev = pt;
          }
          ctx.stroke();
          queueRef.current = [];
          dirty = true;
          autoStart = null;
        } else if (!user && !reduce) {
          // 自走: コインが観察元と同じジグザグで擦る。届かなければ行間をずらしてもう一往復
          if (autoStart === null) {
            autoStart = time;
            prev = null;
          }
          let k = (time - autoStart) / AUTO_DUR;
          if (k >= 1) {
            pass += 1;
            autoStart = time;
            prev = null;
            k = 0;
          }
          if (pass >= AUTO_PASSES) {
            open(time, canvas);
          } else {
            const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
            const pos = along(PATHS[pass % PATHS.length], e, cw, ch);
            ctx.beginPath();
            ctx.moveTo(prev ? prev.x : pos.x, prev ? prev.y : pos.y);
            ctx.lineTo(pos.x + 0.01, pos.y);
            ctx.stroke();
            const dx = prev ? pos.x - prev.x : 0;
            prev = pos;
            dirty = true;
            coinAt = { x: pos.x, y: pos.y, tilt: Math.max(-14, Math.min(14, dx * 1.5)) };
          }
        }

        // 削れ率は画素を飛ばして数え、数フレームに1回だけ測る
        frame += 1;
        if (phase === "scratch" && dirty && frame % MEASURE_EVERY === 0) {
          dirty = false;
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let clear = 0;
          let total = 0;
          for (let y = 0; y < canvas.height; y += SAMPLE) {
            for (let x = 0; x < canvas.width; x += SAMPLE) {
              total += 1;
              if (data[(y * canvas.width + x) * 4 + 3] < 128) clear += 1;
            }
          }
          const pct = Math.round((clear / total) * 100);
          if (meterRef.current) meterRef.current.textContent = String(pct);
          if (pct >= threshold) open(time, canvas);
        }

        // マウスで触っている間はコインがカーソルの代わりになる
        const hov = hoverRef.current;
        if (!coinAt && hov && hov.mouse && phase === "scratch") coinAt = { x: hov.x, y: hov.y, tilt: 0 };
      }

      if (coinAt && !reduce) {
        coin.style.opacity = "1";
        coin.style.transform = `translate3d(${coinAt.x}px, ${coinAt.y}px, 0) rotate(${coinAt.tilt}deg)`;
      } else {
        coin.style.opacity = "0";
      }
    });
  }, [reduce]);

  const local = (e: PointerEvent<HTMLDivElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - b.left, y: e.clientY - b.top };
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    downRef.current = true;
    touchedRef.current = true;
    queueRef.current.push({ ...local(e), start: true });
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = local(e);
    hoverRef.current = { ...p, mouse: e.pointerType === "mouse" };
    if (!downRef.current) return;
    touchedRef.current = true;
    queueRef.current.push({ ...p, start: false });
  };

  const onUp = () => {
    downRef.current = false;
    touchedRef.current = true;
  };

  const onLeave = () => {
    hoverRef.current = null;
  };

  return (
    <DemoStage
      hint={`PC: ドラッグで削る / スマホ: 指でなぞる(${params.threshold}%削れたら残りが剥がれる)`}
    >
      <div className={styles.wrap}>
        <div
          ref={cardRef}
          className={styles.card}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={onLeave}
        >
          <div className={styles.prize}>
            <span className={styles.big}>20%</span>
            <span className={styles.small}>OFF</span>
            <span className={styles.code}>CODE · MOTION20</span>
          </div>
          <canvas ref={canvasRef} className={styles.foil} aria-hidden />
          <span ref={coinRef} className={styles.coin} aria-hidden />
        </div>
        <p className={styles.meter} aria-hidden>
          削れた面積 <span ref={meterRef}>0</span>% / {params.threshold}%で全開
        </p>
        <p ref={resultRef} className={styles.sr} aria-live="polite" />
      </div>
    </DemoStage>
  );
}
