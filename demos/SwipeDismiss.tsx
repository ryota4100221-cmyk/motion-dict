"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./SwipeDismiss.module.css";

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

const CARDS = [
  { from: "Aoi Tanaka", body: "見積もりの件、明日までに返します" },
  { from: "Deploy Bot", body: "main へのビルドが成功しました" },
  { from: "Ren Kobayashi", body: "ラフ2案、フォルダに入れました" },
  { from: "Calendar", body: "15:00 からレビューが始まります" },
  { from: "Mika Sato", body: "撮影のロケハン写真を共有します" },
];

const CARD_W = 268; // .card の width と一致させる(飛び去り距離の基準)
const STACK = 3; // 同時に見せる枚数
const TILT = 6; // しきい値ぶん引いたときの傾き(deg)
const FADE = 0.28; // しきい値ぶん引いたときに落ちる不透明度(下の札が透けて字が重ならない範囲)

const VEL_WINDOW = 80; // 速度を見る直近の時間(ms)。全体平均だと止めてから離しても飛ぶ
const IDLE_WAIT = 1400; // この時間操作が無ければ自走デモに戻る
const AUTO_DRAG = 520; // 自走が1枚を引ききるまでの時間(ms)
const AUTO_PAUSE = 620; // 引ききってから離すまでの溜め(ms)
const AUTO_REST = 700; // 1枚ぶん終わってから次を始めるまで(ms)
// 自走は「越えて消す」と「届かず戻る」を交互に見せる。値はthresholdに対する倍率
const AUTO_STEPS = [
  { dir: 1, reach: 1.3 },
  { dir: -1, reach: 0.62 },
  { dir: -1, reach: 1.3 },
  { dir: 1, reach: 0.62 },
];

type Mode = "rest" | "drag" | "fly" | "snap";

export default function SwipeDismiss({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [top, setTop] = useState(0); // 何枚消したか。先頭カードの位置でもある
  const [grabbing, setGrabbing] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLSpanElement>(null);

  // 位置はrefで持ち毎フレームDOMへ直接書く(スライダー以外で再レンダーしない)
  const dxRef = useRef(0);
  const modeRef = useRef<Mode>("rest");
  const releaseRef = useRef(false); // pointerupが立てるフラグ。判定はtick側で行う
  const fromRef = useRef(0); // fly/snap の開始位置
  const startRef = useRef(0); // fly/snap の開始時刻(rAFのtime)
  const dirRef = useRef(1);
  const lastXRef = useRef(0);

  // 速度はrAFのtimeだけで出す(performance.nowはreact-hooks/purityで落ちる)
  const velRef = useRef(0);
  const sampleTimeRef = useRef(0);
  const sampleDxRef = useRef(0);

  const touchedRef = useRef(false);
  const lastInputRef = useRef(-Infinity);
  const autoRef = useRef(0); // AUTO_STEPS のどこを演じているか
  const autoStartRef = useRef(-Infinity);

  const threshold = Math.round(params.threshold);
  const fling = Math.round(params.fling);
  const flyout = params.flyout;
  const snapBack = params.snapBack;

  useEffect(() => {
    const paint = () => {
      // 先頭が入れ替わるたびにDOMノードも変わるので、毎フレーム引き直す
      // (effect先頭で1度だけ掴むと、1枚消した瞬間から外れたノードへ書き続ける)
      const card = cardRef.current;
      if (!card) return;
      const dx = dxRef.current;
      const over = Math.min(1, Math.abs(dx) / threshold);
      const flying = modeRef.current === "fly";
      // 飛び去り中は over が 1 で張り付くので、透明度だけ距離から別に作る
      const gone = flying
        ? Math.min(1, Math.max(0, (Math.abs(dx) - threshold) / (CARD_W + 80 - threshold)))
        : 0;
      const tilt = Math.sign(dx) * over * TILT; // しきい値ぶんで6degに達し、そこで頭打ち
      card.style.transform = `translateX(${dx}px) rotate(${tilt}deg)`;
      card.style.opacity = String(Math.max(0, 1 - FADE * over - (1 - FADE) * gone));

      const tag = tagRef.current;
      if (tag) {
        const armed = Math.abs(dx) >= threshold;
        tag.textContent = armed ? "RELEASE TO DISMISS" : "KEEP DRAGGING";
        tag.dataset.armed = armed ? "on" : "off";
        tag.style.opacity = String(Math.min(1, over * 1.2));
      }
    };

    // 離した瞬間の判定。距離ORしきい速度のどちらかで消す(sonnerの実装と同じ二重判定)
    const release = (time: number) => {
      const dx = dxRef.current;
      const fast = Math.abs(velRef.current) >= fling;
      const far = Math.abs(dx) >= threshold;
      dirRef.current = dx === 0 ? 1 : Math.sign(dx);
      if (far || (fast && Math.abs(dx) > 2)) {
        if (reduce) {
          dxRef.current = 0;
          modeRef.current = "rest";
          setTop((n) => n + 1);
          return;
        }
        modeRef.current = "fly";
      } else {
        modeRef.current = reduce ? "rest" : "snap";
        if (reduce) dxRef.current = 0;
      }
      fromRef.current = dx;
      startRef.current = time;
    };

    const removeTick = addTick((time) => {
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInputRef.current = time;
      }

      // 直近VEL_WINDOWぶんの移動量から速度(px/s)を作る
      const dt = time - sampleTimeRef.current;
      if (dt >= VEL_WINDOW) {
        velRef.current = ((dxRef.current - sampleDxRef.current) / dt) * 1000;
        sampleTimeRef.current = time;
        sampleDxRef.current = dxRef.current;
      }

      if (releaseRef.current) {
        releaseRef.current = false;
        if (modeRef.current === "drag") release(time);
      }

      const mode = modeRef.current;
      if (mode === "fly" || mode === "snap") {
        const span = (mode === "fly" ? flyout : snapBack) * 1000;
        const t = Math.min(1, (time - startRef.current) / span);
        const e = 1 - Math.pow(1 - t, 3); // ease-out。指の勢いの続きに見える
        if (mode === "fly") {
          const goal = fromRef.current + dirRef.current * (CARD_W + 80);
          dxRef.current = fromRef.current + (goal - fromRef.current) * e;
        } else {
          dxRef.current = fromRef.current * (1 - e);
        }
        if (t === 1) {
          if (mode === "fly") {
            dxRef.current = 0;
            setTop((n) => n + 1);
          }
          modeRef.current = "rest";
          autoStartRef.current = time + AUTO_REST; // 消えた直後に次を始めない
        }
      }

      // 無操作が続いたら自走デモへ戻る(ループ動画が静止画になるのを防ぐ)
      if (!reduce && mode === "rest" && time - lastInputRef.current > IDLE_WAIT) {
        if (autoStartRef.current < lastInputRef.current) autoStartRef.current = time;
        const at = time - autoStartRef.current;
        if (at >= 0) {
          const step = AUTO_STEPS[autoRef.current % AUTO_STEPS.length];
          const goal = step.dir * threshold * step.reach;
          if (at < AUTO_DRAG) {
            const t = at / AUTO_DRAG;
            dxRef.current = goal * (1 - Math.pow(1 - t, 3));
          } else if (at < AUTO_DRAG + AUTO_PAUSE) {
            dxRef.current = goal;
          } else {
            dxRef.current = goal;
            autoRef.current += 1;
            release(time);
          }
        }
      }

      paint();
    });

    return removeTick;
  }, [reduce, threshold, fling, flyout, snapBack]);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (modeRef.current === "fly") return;
    modeRef.current = "drag";
    touchedRef.current = true;
    autoStartRef.current = -Infinity;
    lastXRef.current = e.clientX;
    setGrabbing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (modeRef.current !== "drag") return;
    touchedRef.current = true;
    // 指に1:1で追従させる。transitionは当てずフレームごとに書き換える
    // (movementXはタッチで0を返す端末があるのでclientXの差分から出す)
    dxRef.current += e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
  }

  function onPointerUp() {
    if (modeRef.current !== "drag") return;
    touchedRef.current = true;
    releaseRef.current = true;
    setGrabbing(false);
  }

  return (
    <DemoStage hint="PC: カードを左右にドラッグして離す / スマホ: 横にスワイプ（放置中は自動で実演）">
      <div className={styles.field}>
        <span ref={tagRef} className={styles.tag} data-armed="off" aria-hidden>
          KEEP DRAGGING
        </span>

        <div className={styles.stack}>
          <span
            className={styles.guide}
            style={{ ["--edge" as string]: `${threshold}px` }}
            aria-hidden
          />
          {Array.from({ length: STACK }, (_, i) => {
            const card = CARDS[(top + i) % CARDS.length];
            const front = i === 0;
            return (
              <div
                key={top + i}
                ref={front ? cardRef : undefined}
                className={[
                  styles.card,
                  front ? styles.front : "",
                  front && grabbing ? styles.grabbing : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={
                  front
                    ? undefined
                    : {
                        transform: `translateY(${i * 13}px) scale(${1 - i * 0.055})`,
                        opacity: 1 - i * 0.42,
                        zIndex: STACK - i,
                      }
                }
                onPointerDown={front ? onPointerDown : undefined}
                onPointerMove={front ? onPointerMove : undefined}
                onPointerUp={front ? onPointerUp : undefined}
                onPointerCancel={front ? onPointerUp : undefined}
              >
                <p className={styles.from}>{card.from}</p>
                <p className={styles.body}>{card.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </DemoStage>
  );
}
