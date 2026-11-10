"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./ZipperTransition.module.css";

// 交互に開く2枚の図版。直前の項目 fold-transition(photo-02 / 14)と重ならない写真
const PLATES = [
  { src: "/motion-dict/demo/photo-05.jpg", no: "Plate 05", title: "Zipper transition", word: "ジーッ" },
  { src: "/motion-dict/demo/photo-07.jpg", no: "Plate 07", title: "Unzip to the next", word: "パカッ" },
];

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

const clamp = (n: number) => Math.max(0, Math.min(1, n));
// 5次のスムーザーステップ。加速と減速は全部この1本の進み具合から出す(途中で逆戻りさせない)
const smooth = (n: number) => {
  n = clamp(n);
  return n * n * n * (n * (n * 6 - 15) + 10);
};

// スライダーの通り道(3次ベジェ・舞台の寸法比)。両端は舞台の外に置き、最後のコマで開き切る
const ROUTES = [
  { x: [1.08, 0.77, 0.55, -0.18], y: [-0.16, 0.25, 0.62, 1.18] }, // 斜めの弧(右上→左下)
  { x: [0.5, 0.5, 0.5, 0.5], y: [-0.14, 0.3, 0.7, 1.14] }, // まっすぐ縦(上→下)
];

type Pt = { x: number; y: number };

export default function ZipperTransition({ params }: { params: ParamValues }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const oldRef = useRef<HTMLDivElement>(null);
  const newRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef(params);
  const [page, setPage] = useState(0);
  const [running, setRunning] = useState(false);
  const [fade, setFade] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const next = (page + 1) % PLATES.length;

  useEffect(() => {
    if (!running) return;
    const stage = stageRef.current;
    if (!stage) return;
    const { duration, flare, pitch, route } = paramsRef.current;
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const diagonal = Math.hypot(w, h);
    // 歯・テープの太さ。小さい舞台では細くする(出典は幅600px未満で0.76)
    const hw = Math.max(0.6, Math.min(1, w / 900));
    const R = ROUTES[Math.round(route)] ?? ROUTES[0];
    const curve = (t: number): Pt => {
      const u = 1 - t;
      const b = (k: number[]) => u * u * u * k[0] + 3 * u * u * t * k[1] + 3 * u * t * t * k[2] + t * t * t * k[3];
      return { x: b(R.x) * w, y: b(R.y) * h };
    };
    // 弧長の表(等速で歯を並べ、スライダーを弧長で進める)
    const N = 160;
    const table: (Pt & { len: number })[] = [{ ...curve(0), len: 0 }];
    for (let i = 1; i <= N; i++) {
      const p = curve(i / N);
      const prev = table[i - 1];
      table.push({ ...p, len: prev.len + Math.hypot(p.x - prev.x, p.y - prev.y) });
    }
    const length = table[N].len;
    const center = (s: number): Pt => {
      const d = clamp(s) * length;
      let lo = 1;
      let hi = N;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (table[mid].len < d) lo = mid + 1;
        else hi = mid;
      }
      const a = table[lo - 1];
      const b = table[lo];
      const t = (d - a.len) / (b.len - a.len || 1);
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    };
    // 開く向き=始点と終点を結ぶ軸の法線(左右の縁はこの1本の向きへ押し広げる)
    const first = center(0);
    const last = center(1);
    const axis = Math.hypot(last.x - first.x, last.y - first.y);
    const nx = -(last.y - first.y) / axis;
    const ny = (last.x - first.x) / axis;
    const axisAngle = Math.atan2(last.y - first.y, last.x - first.x);

    const count = Math.max(40, Math.round(length / (pitch * hw)));
    const SEG = 72;
    const samples = Array.from({ length: SEG + 1 }, (_, i) => ({ s: i / SEG, c: center(i / SEG) }));
    const teeth = [1, -1].flatMap((side) =>
      Array.from({ length: count }, (_, i) => {
        const s = clamp((i + (side === 1 ? 0 : 0.5)) / (count - 1));
        return { side, s, c: center(s), a: center(clamp(s - 0.002)), b: center(clamp(s + 0.002)) };
      })
    );

    const canvas = canvasRef.current;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas) {
      canvas.width = Math.ceil(w * dpr);
      canvas.height = Math.ceil(h * dpr);
    }

    let started: number | null = null;
    let done = false;

    const draw = (progress: number) => {
      // ノードは入れ替わることがあるので毎フレーム引き直す
      const oldEl = oldRef.current;
      const newEl = newRef.current;
      const cv = canvasRef.current;
      const ctx = cv?.getContext("2d");
      if (!oldEl || !newEl || !cv || !ctx) return;

      const q = smooth(progress);
      const tension = Math.sin(Math.PI * q);
      const spread = 0.24 + 1.66 * q;
      const release = 0.3 * Math.pow(q, 4);
      const edge = (s: number, side: number, c: Pt): Pt => {
        const dist = Math.max(0, q - s);
        // スライダーから後ろへの距離の flare 乗で開く。左右でわずかに抵抗を変え、鏡写しの板に見せない
        const gap = diagonal * spread * (Math.pow(dist, flare) * (1 + side * 0.065 * tension) + release);
        const loosen = smooth(dist / 0.12);
        const bow = Math.sin(Math.PI * dist) * Math.exp(-dist * 2.5) * tension * 24 * hw * loosen;
        const ripple = Math.sin(dist * 18) * Math.exp(-dist * 7) * tension * 12 * hw * loosen;
        const d = (gap + ripple) * side + bow;
        return { x: c.x + nx * d, y: c.y + ny * d };
      };

      // 去る側の紙面: 少し左下へ流れながら拡大し、わずかに暗くなる。開口部は evenodd の穴で抜く
      const departure = `translate(${(-w * 0.05 * q).toFixed(2)}px, ${(h * 0.04 * q).toFixed(2)}px) scale(${(1 + 0.11 * q).toFixed(5)})`;
      const edges = [1, -1].map((side) => samples.map(({ s, c }) => edge(s, side, c)));
      const hole = [...edges[0], ...edges[1].slice().reverse()];
      const d = "M" + hole.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("L") + "Z";
      oldEl.style.transform = departure;
      oldEl.style.filter = `brightness(${(1 - 0.1 * q).toFixed(3)})`;
      oldEl.style.clipPath = `path(evenodd, "M-2 -2H${w + 2}V${h + 2}H-2Z ${d}")`;
      // 開口部が舞台を抜けた80%以降は古い紙面を消す(縁の取り残しを出さない)
      oldEl.style.visibility = progress >= 0.8 ? "hidden" : "visible";
      // 来る側の紙面: 奥から手前へ寄ってくる
      const rem = 1 - q;
      newEl.style.transform = `translate(${(w * 0.03 * rem).toFixed(2)}px, ${(-h * 0.024 * rem).toFixed(2)}px) scale(${(1 + 0.08 * rem).toFixed(5)})`;

      // ファスナー(テープ・縫い目・縁・歯・スライダー)は去る紙面と同じ変形に乗せる
      cv.style.transform = departure;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = smooth(progress / 0.09);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      const line = (pts: Pt[]) => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      };
      const offset = (pts: Pt[], dist: number, side: number) =>
        pts.map((p, i) => {
          const a = pts[Math.max(0, i - 1)];
          const b = pts[Math.min(pts.length - 1, i + 1)];
          const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
          return { x: p.x - ((b.y - a.y) / len) * dist * side, y: p.y + ((b.x - a.x) / len) * dist * side };
        });
      [1, -1].forEach((side, k) => {
        const pts = edges[k];
        const tape = offset(pts, 17 * hw, side);
        const stitch = offset(pts, 23 * hw, side);
        // 紙が持ち上がるほど影を広く
        line(pts);
        ctx.strokeStyle = "rgba(0,0,0,.08)";
        ctx.lineWidth = 44 + 20 * tension;
        ctx.stroke();
        ctx.strokeStyle = "rgba(0,0,0,.2)";
        ctx.lineWidth = 25 + 7 * tension;
        ctx.stroke();
        line(tape);
        ctx.strokeStyle = "#141210";
        ctx.lineWidth = 24 * hw;
        ctx.stroke();
        ctx.strokeStyle = "#2c2925";
        ctx.lineWidth = 22 * hw;
        ctx.stroke();
        line(stitch);
        ctx.setLineDash([2.5, 4]);
        ctx.strokeStyle = "rgba(233,233,227,.55)";
        ctx.lineWidth = 0.85;
        ctx.stroke();
        ctx.setLineDash([]);
        line(pts);
        ctx.strokeStyle = "#0b0a09";
        ctx.lineWidth = 5 * hw;
        ctx.stroke();
      });
      // 歯: 縁の上に、縁の向きへ回して並べる(片側は半ピッチずらして噛み合わせる)
      for (const t of teeth) {
        const p = edge(t.s, t.side, t.c);
        if (p.x < -40 || p.x > w + 40 || p.y < -40 || p.y > h + 40) continue;
        const a = edge(clamp(t.s - 0.002), t.side, t.a);
        const b = edge(clamp(t.s + 0.002), t.side, t.b);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(b.y - a.y, b.x - a.x));
        ctx.scale(hw, hw * t.side);
        ctx.fillStyle = "#cfccc3";
        ctx.fillRect(-pitch * 0.32, -3, pitch * 0.64, 14);
        ctx.fillStyle = "rgba(20,18,16,.45)";
        ctx.fillRect(-pitch * 0.32, 8, pitch * 0.64, 3);
        ctx.restore();
      }
      // スライダーと引き手。引き手は同じ進み具合の速さで振れる(別の弾きは足さない)
      const sp = center(q);
      const speed = 30 * progress * progress * Math.pow(1 - progress, 2);
      ctx.globalAlpha = smooth(progress / 0.055);
      ctx.save();
      ctx.translate(sp.x, sp.y);
      ctx.rotate(axisAngle - Math.PI / 2);
      ctx.scale(hw, hw);
      ctx.fillStyle = "#1a1816";
      ctx.beginPath();
      ctx.roundRect(-15, -26, 30, 40, 6);
      ctx.fill();
      ctx.fillStyle = "#cfccc3";
      ctx.beginPath();
      ctx.roundRect(-12, -23, 24, 34, 5);
      ctx.fill();
      ctx.rotate((-12 * speed * Math.PI) / 180);
      ctx.fillStyle = "#1a1816";
      ctx.beginPath();
      ctx.roundRect(-7, -64, 14, 44, 7);
      ctx.fill();
      ctx.fillStyle = "#e9e9e3";
      ctx.beginPath();
      ctx.roundRect(-4.5, -60, 9, 30, 4.5);
      ctx.fill();
      // ライムは印だけ: 引き手の先の点
      ctx.fillStyle = getComputedStyle(cv).getPropertyValue("--ai").trim() || "#c6f432";
      ctx.beginPath();
      ctx.arc(0, -54, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    draw(0);
    const removeTick = addTick((time) => {
      if (done) return;
      if (started === null) started = time;
      const progress = clamp((time - started) / (duration * 1000));
      draw(progress);
      if (progress >= 1) {
        done = true;
        setPage((p) => (p + 1) % PLATES.length);
        setRunning(false);
      }
    });
    return () => {
      removeTick();
    };
  }, [running]);

  // 再生していないときは変形と穴を全部外す(差し替えた次の紙面をそのまま見せる)
  useEffect(() => {
    if (running) return;
    const oldEl = oldRef.current;
    const newEl = newRef.current;
    const cv = canvasRef.current;
    if (oldEl) {
      oldEl.style.transform = "";
      oldEl.style.filter = "";
      oldEl.style.clipPath = "";
      oldEl.style.visibility = "";
    }
    if (newEl) newEl.style.transform = "";
    if (cv) {
      cv.style.transform = "";
      cv.getContext("2d")?.clearRect(0, 0, cv.width, cv.height);
    }
  }, [running, page]);

  const unzip = () => {
    if (running) return;
    if (reduce) {
      setPage((p) => (p + 1) % PLATES.length);
      setFade((f) => f + 1);
      return;
    }
    setRunning(true);
  };

  const plate = (i: number) => {
    const p = PLATES[i];
    return (
      <>
        <img src={p.src} alt="" draggable={false} className={styles.photo} />
        <div className={styles.card}>
          <span className={styles.no}>{p.no}</span>
          <span className={styles.title}>{p.title}</span>
          <span className={styles.word}>
            <span className={styles.mark} aria-hidden />
            {p.word}
          </span>
        </div>
      </>
    );
  };

  return (
    <DemoStage
      stageRef={stageRef}
      hint="クリック / タップ: ファスナーが右上から下りて紙面が開き、次の図版が出る"
    >
      <div className={styles.scene} onClick={unzip} aria-hidden>
        {/* 下に敷く次の紙面(再生中だけ見える) */}
        <div ref={newRef} className={styles.page} data-md-bleed="">
          {plate(running ? next : page)}
        </div>
        {/* 上の紙面。再生中は開口部を evenodd の穴で抜く */}
        <div
          key={`old-${fade}`}
          ref={oldRef}
          className={`${styles.page} ${reduce && fade > 0 ? styles.fadeIn : ""}`}
          data-md-bleed=""
        >
          {plate(page)}
        </div>
        <canvas ref={canvasRef} className={styles.chain} />
      </div>

      <button className={styles.btn} onClick={unzip} disabled={running}>
        Unzip to next plate
      </button>
    </DemoStage>
  );
}
