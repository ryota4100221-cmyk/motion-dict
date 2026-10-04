"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ListAddRemove.module.css";

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

type Item = { id: number; name: string; price: string; hue: number; leaving: boolean; entering: boolean };

const POOL = [
  { name: "Oat Milk", price: "¥480", hue: 72 },
  { name: "Cold Brew", price: "¥620", hue: 28 },
  { name: "Rye Loaf", price: "¥540", hue: 40 },
  { name: "Matcha Tin", price: "¥1,280", hue: 100 },
  { name: "Honey Jar", price: "¥860", hue: 48 },
  { name: "Sea Salt", price: "¥360", hue: 200 },
];

const MAX_ROWS = 4;
// 自動再生の1手ごとの間(動きが終わってから次の手まで)
const REST_MS = 1100;

function makeItem(id: number, entering: boolean): Item {
  return { id, ...POOL[id % POOL.length], leaving: false, entering };
}

type RowProps = {
  item: Item;
  params: ParamValues;
  reduce: boolean;
  onRemove: (id: number) => void;
  onDone: (id: number) => void;
};

function Row({ item, params, reduce, onRemove, onDone }: RowProps) {
  const rowRef = useRef<HTMLLIElement>(null);
  const lidRef = useRef<SVGGElement>(null);

  // 追加: 0から実際の高さまで開く。描画前に始めないと一瞬だけ全高が見える
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row || !item.entering || reduce) return;
    const cs = getComputedStyle(row);
    const h = row.offsetHeight;
    const f = params.fade / 100;
    const anim = row.animate(
      [
        {
          offset: 0,
          height: "0px",
          paddingTop: "0px",
          paddingBottom: "0px",
          opacity: 0,
          borderBottomColor: "transparent",
          transform: `translateX(${-params.slide}px)`,
        },
        ...(f < 1 ? [{ offset: 1 - f, opacity: 0 }] : []),
        {
          offset: 1,
          height: `${h}px`,
          paddingTop: cs.paddingTop,
          paddingBottom: cs.paddingBottom,
          opacity: 1,
          borderBottomColor: cs.borderBottomColor,
          transform: "translateX(0)",
        },
      ],
      { duration: params.duration * 1000, easing: "ease-in-out" }
    );
    return () => anim.cancel();
    // 開くのはマウント時の1回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 削除: 高さを測ってから、待ち→畳む→終わってからDOMを外す
  useEffect(() => {
    const row = rowRef.current;
    if (!row || !item.leaving) return;
    if (reduce) {
      onDone(item.id);
      return;
    }
    const cs = getComputedStyle(row);
    const h = row.offsetHeight;
    const f = params.fade / 100;
    const delay = params.delay * 1000;

    const lid = lidRef.current?.animate(
      [
        { transform: "translateY(0) rotate(0deg)" },
        { transform: "translateY(-3px) rotate(-8deg)", offset: 0.5 },
        { transform: "translateY(0) rotate(0deg)" },
      ],
      { duration: Math.max(delay, 120), easing: "ease-in-out" }
    );

    const anim = row.animate(
      [
        {
          offset: 0,
          height: `${h}px`,
          paddingTop: cs.paddingTop,
          paddingBottom: cs.paddingBottom,
          opacity: 1,
          borderBottomColor: cs.borderBottomColor,
          transform: "translateX(0)",
        },
        ...(f < 1 ? [{ offset: f, opacity: 0 }] : []),
        {
          offset: 1,
          height: "0px",
          paddingTop: "0px",
          paddingBottom: "0px",
          opacity: 0,
          borderBottomColor: "transparent",
          transform: `translateX(${-params.slide}px)`,
        },
      ],
      { duration: params.duration * 1000, delay, easing: "ease-in-out", fill: "forwards" }
    );
    let alive = true;
    anim.finished.then(
      () => alive && onDone(item.id),
      () => {}
    );
    return () => {
      alive = false;
      anim.cancel();
      lid?.cancel();
    };
  }, [item.leaving, item.id, reduce, onDone, params.duration, params.delay, params.slide, params.fade]);

  return (
    <li className={styles.row} ref={rowRef} data-leaving={item.leaving || undefined}>
      <span className={styles.thumb} style={{ background: `hsl(${item.hue} 42% 62%)` }} aria-hidden />
      <span className={styles.name}>{item.name}</span>
      <span className={styles.qty}>×1</span>
      <span className={styles.price}>{item.price}</span>
      <button
        type="button"
        className={styles.remove}
        onClick={() => onRemove(item.id)}
        aria-label={`${item.name} を削除`}
      >
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
          <g ref={lidRef} className={styles.lid}>
            <path d="M2.5 4.5h11M6.5 4.5V3h3v1.5" />
          </g>
          <path d="M4 6.5l.7 7h6.6l.7-7" />
        </svg>
      </button>
    </li>
  );
}

export default function ListAddRemove({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const nextIdRef = useRef(3);
  const stepRef = useRef(0);
  const [items, setItems] = useState<Item[]>(() => [0, 1, 2].map((id) => makeItem(id, false)));

  const remove = (id: number) =>
    setItems((list) => list.map((it) => (it.id === id ? { ...it, leaving: true } : it)));

  const add = () => {
    // ステージからはみ出さないよう手動の追加も上限で止める
    if (items.filter((it) => !it.leaving).length > MAX_ROWS) return;
    const id = nextIdRef.current++;
    // 2行目に差し込むと、下の行が押し下げられる様子まで見える
    setItems((list) => {
      const at = Math.min(1, list.length);
      return [...list.slice(0, at), makeItem(id, true), ...list.slice(at)];
    });
  };

  const done = useCallback((id: number) => setItems((list) => list.filter((it) => it.id !== id)), []);

  // 無操作でも1手ずつ増減させる(録画と初見のため)
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (reduce) return;
    const period = (params.delay + params.duration) * 1000 + REST_MS;
    const timer = window.setInterval(() => {
      const live = itemsRef.current.filter((it) => !it.leaving);
      const step = stepRef.current++;
      if (live.length >= MAX_ROWS) {
        // 端ではなく途中の行を消し、下の行が詰まる動きを見せる
        const target = live[1 + (step % (live.length - 2))];
        setItems((list) => list.map((it) => (it.id === target.id ? { ...it, leaving: true } : it)));
      } else {
        const id = nextIdRef.current++;
        setItems((list) => {
          const at = Math.min(1, list.length);
          return [...list.slice(0, at), makeItem(id, true), ...list.slice(at)];
        });
      }
    }, period);
    return () => window.clearInterval(timer);
  }, [params.delay, params.duration, reduce]);

  const count = items.filter((it) => !it.leaving).length;

  return (
    <DemoStage hint="自動で再生: ゴミ箱で削除 / ＋で追加(PC・スマホ共通)">
      <div className={styles.panel}>
        <div className={styles.head}>
          <span className={styles.title}>CART</span>
          <span className={styles.count}>{count} items</span>
          <button type="button" className={styles.add} onClick={add} aria-label="項目を追加">
            ＋
          </button>
        </div>
        <ul className={styles.list}>
          {items.map((item) => (
            <Row
              key={`row-${item.id}`}
              item={item}
              params={params}
              reduce={reduce}
              onRemove={remove}
              onDone={done}
            />
          ))}
        </ul>
      </div>
    </DemoStage>
  );
}
