"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./FlyToCart.module.css";

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

// 飛ぶ分身1つぶん。位置はステージ左上を原点にしたpx
type Flyer = {
  id: number;
  left: number;
  top: number;
  size: number;
  dx: number;
  dy: number;
};

export default function FlyToCart({ params }: { params: ParamValues }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [count, setCount] = useState(0);
  const [bumping, setBumping] = useState(false);
  const reduce = useReducedMotion();

  const duration = params.duration;
  const arc = params.arc;
  const endScale = params.endScale / 100;
  const bump = params.bump / 100;

  // 着地の受け止め。バンプのクラスを一度外してから付け直し、連打でも毎回発火させる
  const land = () => {
    setCount((c) => c + 1);
    setBumping(false);
    requestAnimationFrame(() => setBumping(true));
  };

  const add = () => {
    const stage = stageRef.current;
    const thumb = thumbRef.current;
    const cart = cartRef.current;
    if (!stage || !thumb || !cart) return;

    if (reduce) {
      // reduced-motion: 分身を飛ばさず、結果(バッジ+1)だけ即座に返す
      land();
      return;
    }

    // 出発点と到達点は毎回実測する。スライダー操作や画面幅で位置が変わるため
    const stageBox = stage.getBoundingClientRect();
    const from = thumb.getBoundingClientRect();
    const to = cart.getBoundingClientRect();

    setFlyers((fs) => [
      ...fs,
      {
        id: ++idRef.current,
        left: from.left - stageBox.left,
        top: from.top - stageBox.top,
        size: from.width,
        dx: to.left + to.width / 2 - (from.left + from.width / 2),
        dy: to.top + to.height / 2 - (from.top + from.height / 2),
      },
    ]);
  };

  const flyerStyle = (f: Flyer): CSSProperties =>
    ({
      left: `${f.left}px`,
      top: `${f.top}px`,
      width: `${f.size}px`,
      height: `${f.size}px`,
      animationDuration: `${duration}s`,
      "--dx": `${f.dx.toFixed(1)}px`,
      "--dy": `${f.dy.toFixed(1)}px`,
      "--arc": `${arc}px`,
    }) as CSSProperties;

  return (
    <DemoStage
      hint="PC: 「カートに入れる」をクリック / スマホ: タップ(連打で重なる)"
      stageRef={stageRef}
    >
      <div className={styles.field}>
        {/* 受け皿。着地に合わせてバンプし、バッジの数字が増える */}
        <div
          ref={cartRef}
          className={bumping ? `${styles.cart} ${styles.cartBump}` : styles.cart}
          style={{ "--bump": 1 + bump } as CSSProperties}
          onAnimationEnd={() => setBumping(false)}
          aria-hidden
        >
          <span className={styles.cartGlyph}>CART</span>
          <span className={styles.badge} key={count}>
            {count}
          </span>
        </div>

        <div className={styles.card}>
          <span ref={thumbRef} className={styles.thumb} aria-hidden />
          <span className={styles.name}>Lime Tote</span>
          <button className={styles.button} onClick={add}>
            カートに入れる
          </button>
        </div>

        {/* 分身。外側=位置(弧)、内側=拡縮とフェード。transformを親子で分ける */}
        {flyers.map((f) => (
          <span
            key={f.id}
            className={styles.flyer}
            style={flyerStyle(f)}
            aria-hidden
            onAnimationEnd={(e) => {
              if (e.target !== e.currentTarget) return;
              setFlyers((fs) => fs.filter((x) => x.id !== f.id));
              land();
            }}
          >
            <span
              className={styles.flyerInner}
              style={
                {
                  animationDuration: `${duration}s`,
                  "--end": endScale,
                } as CSSProperties
              }
            />
          </span>
        ))}
      </div>
    </DemoStage>
  );
}
