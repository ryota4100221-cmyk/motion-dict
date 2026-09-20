"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./DropZone.module.css";

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

const IDLE_WAIT = 2200; // この時間ドラッグが無ければ自走デモに戻る
const LOOP = 4800; // 自走1周の長さ(運ぶ→受け皿が応える→着地→戻す)
// 自走のタイムライン(0〜1)。観察元も「少し待つ→運ぶ→受け入れ→着地→保持」の並びだった
const T_GO = 0.14; // 運び始め
const T_ARRIVE = 0.5; // 受け皿に着く
const T_READY = 0.36; // 受け皿が受け入れ状態に入る(着く手前で先に名乗る)
const T_LAND = 0.58; // カードが消えて受け皿の中身になる
const T_RELEASE = 0.68; // 受け皿がリングを畳む
const T_RESET = 0.88; // 手元に戻す

// 両端の傾きが0になる補間。運搬の加減速に使う
function smoothstep(o: number): number {
  const t = o < 0 ? 0 : o > 1 ? 1 : o;
  return t * t * (3 - 2 * t);
}

export default function DropZone({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();

  const fieldRef = useRef<HTMLDivElement>(null);
  const homeRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const filledRef = useRef<HTMLDivElement>(null);

  // 表示状態は全部refで持ち、毎フレームDOMへ直接書く(スライダー以外で再レンダーしない)
  const posRef = useRef({ x: 0, y: 0 }); // 手元スロットを原点としたカードの位置
  const draggingRef = useRef(false);
  const grabRef = useRef({ x: 0, y: 0 }); // 掴んだ点とカード原点のずれ
  const overRef = useRef(false); // 受け皿に重なっているか
  const readyRef = useRef(false); // 受け皿に今書き込んである状態
  const filledPrevRef = useRef(false);
  const landedRef = useRef(false); // 手で落として着地済み
  const landedAtRef = useRef(0);
  const touchedRef = useRef(false);
  // 最後に操作された時刻はrAFのtimeからだけ確定させる(performance.nowはlintで落ちる)
  const lastInputRef = useRef(-Infinity);

  const ring = Math.round(params.ring);
  const respond = params.respond;
  const shrink = params.shrink;
  const settle = Math.round(params.settle);

  useEffect(() => {
    const field = fieldRef.current;
    const home = homeRef.current;
    const zone = zoneRef.current;
    const slot = slotRef.current;
    const card = cardRef.current;
    const filled = filledRef.current;
    if (!field || !home || !zone || !slot || !card || !filled) return;

    // 手元スロット→受け皿スロットの移動ベクトル。レイアウトが変わったときだけ測り直す
    let travel = { x: 0, y: 0 };
    const measure = () => {
      const h = home.getBoundingClientRect();
      const s = slot.getBoundingClientRect();
      travel = {
        x: s.left + s.width / 2 - (h.left + h.width / 2),
        y: s.top + s.height / 2 - (h.top + h.height / 2),
      };
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(field);

    const setReady = (on: boolean) => {
      if (readyRef.current === on) return;
      readyRef.current = on;
      zone.classList.toggle(styles.ready, on);
    };
    const setFilled = (on: boolean) => {
      if (filledPrevRef.current === on) return;
      filledPrevRef.current = on;
      filled.style.opacity = on ? "1" : "0";
    };

    const paint = (x: number, y: number, scale: number, opacity: number) => {
      card.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      card.style.opacity = String(opacity);
    };

    const removeTick = addTick((time) => {
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInputRef.current = time;
      }

      if (draggingRef.current) {
        const { x, y } = posRef.current;
        // 受け皿に近いほど縮める。重なった時点で縮みきるようにする
        const d = Math.hypot(travel.x - x, travel.y - y);
        const reach = Math.hypot(travel.x, travel.y) || 1;
        const o = smoothstep(1 - d / reach);
        paint(x, y, 1 - (1 - shrink) * o, 1);
        setReady(overRef.current);
        setFilled(false);
        return;
      }

      if (landedRef.current) {
        // 手で落とした直後。受け皿の中身に置き換え、少し見せてから手元へ戻す
        if (landedAtRef.current === Number.NEGATIVE_INFINITY) landedAtRef.current = time;
        const since = time - landedAtRef.current;
        paint(travel.x, travel.y, shrink, 0);
        setFilled(true);
        setReady(since < 420);
        if (since > 1500) {
          landedRef.current = false;
          posRef.current = { x: 0, y: 0 };
          setFilled(false);
        }
        return;
      }

      const idle = !reduce && time - lastInputRef.current > IDLE_WAIT;
      if (!idle) {
        // 操作直後で自走に戻る前。手元に置いたまま静止させる
        paint(posRef.current.x, posRef.current.y, 1, 1);
        setReady(false);
        setFilled(false);
        return;
      }

      // 自走デモ。観察元と同じく「運ぶ→受け皿が先に名乗る→着地」を繰り返す
      const p = (time % LOOP) / LOOP;
      const go = smoothstep((p - T_GO) / (T_ARRIVE - T_GO));
      const x = travel.x * go;
      const y = travel.y * go;
      const scale = 1 - (1 - shrink) * go;
      const fade = p < T_ARRIVE ? 1 : 1 - smoothstep((p - T_ARRIVE) / (T_LAND - T_ARRIVE));
      const back = p >= T_RESET;
      paint(back ? 0 : x, back ? 0 : y, back ? 1 : scale, back ? 1 : fade);
      setReady(p >= T_READY && p < T_RELEASE);
      setFilled(p >= T_LAND && p < T_RESET);
    });

    return () => {
      ro.disconnect();
      removeTick();
    };
  }, [reduce, shrink]);

  function isOverZone(clientX: number, clientY: number): boolean {
    const zone = zoneRef.current;
    if (!zone) return false;
    const r = zone.getBoundingClientRect();
    return (
      clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom
    );
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    landedRef.current = false;
    touchedRef.current = true;
    posRef.current = { x: 0, y: 0 };
    grabRef.current = { x: e.clientX, y: e.clientY };
    overRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    touchedRef.current = true;
    posRef.current = {
      x: e.clientX - grabRef.current.x,
      y: e.clientY - grabRef.current.y,
    };
    overRef.current = isOverZone(e.clientX, e.clientY);
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    touchedRef.current = true;
    if (overRef.current) {
      landedRef.current = true;
      // 着地時刻もrAFのtimeで確定させたいが、ここでは「次のtickを開始点にする」印だけ置く
      landedAtRef.current = Number.NEGATIVE_INFINITY;
    } else {
      posRef.current = { x: 0, y: 0 };
    }
    overRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  return (
    <DemoStage hint="PC: 左のカードを右の枠へドラッグ / スマホ: 同じくドラッグ（放置中は自動で実演）">
      <div
        ref={fieldRef}
        className={styles.field}
        style={{
          ["--ring" as string]: `${ring}px`,
          ["--respond" as string]: reduce ? "0s" : `${respond}s`,
          ["--settle" as string]: `${settle}px`,
          ["--settle-blur" as string]: `${Math.round(settle * 2.3)}px`,
        }}
      >
        <div className={styles.side}>
          <div ref={homeRef} className={styles.home}>
            <div
              ref={cardRef}
              className={styles.card}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <span className={styles.face} aria-hidden />
              <span className={styles.tag}>REF</span>
            </div>
          </div>
          <p className={styles.caption}>drag me</p>
        </div>

        <div className={styles.side}>
          <div ref={zoneRef} className={styles.zone}>
            <div ref={slotRef} className={styles.slot}>
              <span className={styles.plus} aria-hidden />
              <div ref={filledRef} className={styles.filled} aria-hidden>
                <span className={styles.face} aria-hidden />
              </div>
            </div>
            <p className={styles.zoneLabel}>drop here</p>
          </div>
        </div>
      </div>
    </DemoStage>
  );
}
