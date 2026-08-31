"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./MorphingDropdown.module.css";

// 中身の量をわざと不揃いにする。器が幅も高さも変形することが一目で分かる
const ITEMS = [
  { label: "Work", links: ["Case studies", "Motion reel", "Archive"] },
  { label: "Studio", links: ["About us", "Team", "Careers", "Contact", "Press kit"] },
  { label: "Journal", links: ["Latest", "Notes"] },
];

const PAD = 14; // パネルの内側余白(中身の実寸に足して器のサイズにする)
const GAP = 14; // ナビ下端とパネル上端の間隔
const IDLE_WAIT = 2200; // この時間ポインタが来なければ自走に戻る
const IDLE_STEP = 1300; // 自走時に項目を送る間隔

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

type Metrics = { spots: number[]; sizes: { w: number; h: number }[]; top: number };

export default function MorphingDropdown({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();

  // active=器がいま合わせている項目 / open=パネルが出ているか。
  // 閉じてもactiveは残すので、器は最後の形のまま消える
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(true);

  const frameRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ spots: [], sizes: [], top: 0 });

  // 中身の実寸とトリガー位置を計測する。器を固定サイズにすると項目ごとの情報量の差が消える
  useLayoutEffect(() => {
    const measure = () => {
      const frame = frameRef.current;
      const nav = navRef.current;
      if (!frame || !nav) return;
      const box = frame.getBoundingClientRect();
      const navBox = nav.getBoundingClientRect();
      setMetrics({
        top: navBox.bottom - box.top + GAP,
        spots: ITEMS.map((_, i) => {
          const el = triggerRefs.current[i];
          if (!el) return 0;
          const r = el.getBoundingClientRect();
          return r.left - box.left + r.width / 2;
        }),
        sizes: ITEMS.map((_, i) => {
          const el = contentRefs.current[i];
          return el ? { w: el.offsetWidth, h: el.offsetHeight } : { w: 0, h: 0 };
        }),
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (frameRef.current) ro.observe(frameRef.current);
    return () => ro.disconnect();
  }, []);

  // 録画は無操作のまま回るので、ポインタが来ない間は項目を自走させる。
  // 時刻はrAFから渡ってくるtimeだけで扱い、操作側はフラグを立てるにとどめる
  const lastInputRef = useRef(-Infinity);
  const touchedRef = useRef(false);
  useEffect(() => {
    if (reduce) return;
    return addTick((time) => {
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInputRef.current = time;
      }
      if (time - lastInputRef.current < IDLE_WAIT) return;
      const step = Math.floor(time / IDLE_STEP) % ITEMS.length;
      setActive((prev) => (prev === step ? prev : step));
      setOpen(true);
    });
  }, [reduce]);

  const touch = (i: number) => {
    touchedRef.current = true;
    setActive(i);
    setOpen(true);
  };

  const size = metrics.sizes[active] ?? { w: 0, h: 0 };
  const center = metrics.spots[active] ?? 0;
  const ease = `cubic-bezier(0.22, ${(1 + params.overshoot / 50).toFixed(3)}, 0.36, 1)`;
  const move = reduce ? "none" : `${params.duration}s ${ease}`;

  const panelStyle: CSSProperties = {
    top: metrics.top,
    width: size.w + PAD * 2,
    height: size.h + PAD * 2,
    // leftではなくtransformで動かす(移動のたびにリフローさせない)
    transform: `translate3d(${center - size.w / 2 - PAD}px, 0, 0)`,
    opacity: open && size.w > 0 ? 1 : 0,
    transition: reduce
      ? "none"
      : `transform ${move}, width ${move}, height ${move}, opacity ${params.contentFade}s ease-out`,
  };

  return (
    <DemoStage hint="PC: ナビ項目にホバー / スマホ: タップ">
      <div
        className={styles.frame}
        ref={frameRef}
        onPointerLeave={() => {
          touchedRef.current = true;
          setOpen(false);
        }}
      >
        <nav className={styles.nav} ref={navRef}>
          {ITEMS.map((item, i) => (
            <button
              key={item.label}
              type="button"
              ref={(el) => {
                triggerRefs.current[i] = el;
              }}
              className={
                open && i === active ? `${styles.trigger} ${styles.on}` : styles.trigger
              }
              onPointerEnter={() => touch(i)}
              onFocus={() => touch(i)}
              onClick={() => touch(i)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* 器はナビ全体で1枚だけ。項目が変わってもこの要素は作り直さない */}
        <div className={styles.panel} style={panelStyle} aria-hidden={!open}>
          {ITEMS.map((item, i) => (
            <div
              key={item.label}
              ref={(el) => {
                contentRefs.current[i] = el;
              }}
              className={i === active ? `${styles.content} ${styles.live}` : styles.content}
              style={{
                // 並び順が右の中身は右へ、左の中身は左へ逃がす。進行方向が読める
                transform:
                  i === active
                    ? "translateX(0)"
                    : `translateX(${i > active ? params.contentShift : -params.contentShift}px)`,
                transition: reduce
                  ? "none"
                  : `opacity ${params.contentFade}s ease-out, transform ${params.contentFade}s ease-out`,
              }}
            >
              {item.links.map((link) => (
                <span key={link} className={styles.link}>
                  {link}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </DemoStage>
  );
}
