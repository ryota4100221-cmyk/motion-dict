"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./TornPaperReveal.module.css";

const EASE = "cubic-bezier(0.7, 0, 0.3, 1)";

// 紙片1枚の高さ(舞台比)。上下で58%ずつ持たせ、中央の16%を重ねる(出典 sotz.org と同じ)
const PANEL_H = 0.58;
// 舞台の中心線(50%)を、紙片ローカルの%に直した値
const TOP_MID = (0.5 / PANEL_H) * 100; // 86.207%
const BOTTOM_MID = ((0.5 - (1 - PANEL_H)) / PANEL_H) * 100; // 13.793%

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

// 破れ目ごとに形を変えるための小さな擬似乱数(同じ seed なら同じ破れ目)
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type EdgePoint = { x: number; y: number; rim: number };

// 破れ目の折れ線。x は 0.6〜2.0% の不揃いな間隔、y は「ゆるいうねり＋細かいギザ」(px)
function tearEdge(seed: number, jag: number, rim: number): EdgePoint[] {
  const rand = mulberry32(seed);
  const phase = rand() * Math.PI * 2;
  const pts: EdgePoint[] = [];
  let x = 0;
  while (x < 100) {
    const drift = Math.sin((x / 100) * Math.PI * 1.3 + phase) * jag * 0.6;
    const fine = (rand() * 2 - 1) * jag * 0.55;
    // 繊維の縁の幅も点ごとに 0.7〜1.3 倍で揺らす
    pts.push({ x, y: drift + fine, rim: rim * (0.7 + rand() * 0.6) });
    x += 0.6 + rand() * 1.4;
  }
  const last = pts[pts.length - 1];
  pts.push({ x: 100, y: last.y, rim: last.rim });
  return pts;
}

const at = (mid: number, px: number) => `calc(${mid.toFixed(3)}% + ${px.toFixed(2)}px)`;

export default function TornPaperReveal({ params }: { params: ParamValues }) {
  // closed: 紙が覆っている / open: 破れて上下へ退いた
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState(7);
  const busyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const { duration, jag, rim, tilt } = params;

  const clips = useMemo(() => {
    const pts = tearEdge(seed, jag, rim);
    // 上の紙片: 上辺全部＋破れ目。中身(地の色)は rim ぶん内側で切り、縁に淡い繊維を残す
    const topEdge = pts.map((p) => `${p.x.toFixed(2)}% ${at(TOP_MID, p.y)}`);
    const topBody = pts.map((p) => `${p.x.toFixed(2)}% ${at(TOP_MID, p.y - p.rim)}`);
    // 下の紙片: 縁を rim ぶん上へずらして上の紙片に重ね、閉じているとき隙間を作らない
    const botEdge = pts.map((p) => `${p.x.toFixed(2)}% ${at(BOTTOM_MID, p.y - rim)}`);
    const botBody = pts.map((p) => `${p.x.toFixed(2)}% ${at(BOTTOM_MID, p.y - rim + p.rim)}`);
    return {
      topEdge: `polygon(0% 0%, 100% 0%, ${[...topEdge].reverse().join(", ")})`,
      topBody: `polygon(0% 0%, 100% 0%, ${[...topBody].reverse().join(", ")})`,
      botEdge: `polygon(${botEdge.join(", ")}, 100% 100%, 0% 100%)`,
      botBody: `polygon(${botBody.join(", ")}, 100% 100%, 0% 100%)`,
    };
  }, [seed, jag, rim]);

  const toggle = () => {
    if (busyRef.current) return;
    if (!open) {
      setOpen(true);
      if (reduce) return;
      // 退いている間の操作は無視する
      busyRef.current = true;
      timerRef.current = setTimeout(() => {
        busyRef.current = false;
      }, duration * 1000);
      return;
    }
    // 破れた紙は戻さない。新しい破れ目の紙を差し替えて覆い直す(key 替えで0.3sのフェード)
    setSeed(Math.floor(Math.random() * 1e9));
    setOpen(false);
  };

  const wrap = (sign: -1 | 1): CSSProperties => ({
    transform: open
      ? `translateY(${sign * 118}%) rotate(${sign === -1 ? -tilt : tilt * 0.8}deg)`
      : "none",
    transition: open && !reduce ? `transform ${duration}s ${EASE}` : "none",
    visibility: open && reduce ? "hidden" : "visible",
  });

  return (
    <DemoStage hint="クリック / タップ: 紙が破れて下の図版が現れる">
      <div data-md-bleed="" className={styles.plate}>
        <img
          src="/motion-dict/demo/photo-09.jpg"
          alt=""
          draggable={false}
          className={styles.photo}
        />
        <span className={styles.caption}>Plate 09</span>
      </div>

      <div
        key={`sheet-${seed}`}
        className={seed === 7 ? styles.sheet : `${styles.sheet} ${styles.fresh}`}
        aria-hidden
      >
        <div className={`${styles.wrap} ${styles.wrapTop}`} style={wrap(-1)}>
          <div className={styles.fiber} style={{ clipPath: clips.topEdge }}>
            <div className={styles.body} style={{ clipPath: clips.topBody }}>
              <div className={`${styles.print} ${styles.printTop}`}>
                <span className={styles.title}>Torn paper reveal</span>
                <span className={styles.folio}>Folio 09 — ビリッ</span>
              </div>
            </div>
          </div>
        </div>
        <div className={`${styles.wrap} ${styles.wrapBottom}`} style={wrap(1)}>
          <div className={styles.fiber} style={{ clipPath: clips.botEdge }}>
            <div className={styles.body} style={{ clipPath: clips.botBody }}>
              <div className={`${styles.print} ${styles.printBottom}`}>
                <span className={styles.title}>Torn paper reveal</span>
                <span className={styles.folio}>Folio 09 — ビリッ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button className={styles.btn} onClick={toggle}>
        {open ? "Cover with a new sheet" : "Tear open"}
      </button>
      <div className={styles.hit} onClick={toggle} aria-hidden />
    </DemoStage>
  );
}
