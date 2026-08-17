"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./DvdBounce.module.css";

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

// 縦横の反射がこの時間(ms)内に揃ったらコーナーヒットとみなす。
// 角へ真っ直ぐ入っても2軸が同一フレームで当たるとは限らないので窓で判定する
const CORNER_WINDOW = 140;
// dtの上限(s)。タブを離れて戻ったときの瞬間移動を防ぐ
const MAX_DT = 0.05;

export default function DvdBounce({ params }: { params: ParamValues }) {
  const fieldRef = useRef<HTMLButtonElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  // 「角を狙う」指示をtick側へ渡すフラグ。イベントから直接速度を書き換えない
  const aimRef = useRef(false);
  const paramsRef = useRef(params);
  const reduce = useReducedMotion();

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const field = fieldRef.current;
    const logo = logoRef.current;
    const inner = innerRef.current;
    const count = countRef.current;
    // reduced-motion時はループを一切回さず、中央に静止したロゴだけを見せる
    if (!field || !logo || !inner || reduce) return;

    let maxX = 0;
    let maxY = 0;
    let x = 0;
    let y = 0;
    // 向きは単位ベクトルで持ち、速度はtickでspeedを掛けて作る
    let vx = Math.cos(-0.62);
    let vy = Math.sin(-0.62);
    let hue = 0;
    let corners = 0;
    let lastHitX = -Infinity;
    let lastHitY = -Infinity;
    let last: number | null = null;

    const measure = () => {
      maxX = Math.max(0, field.clientWidth - logo.offsetWidth);
      maxY = Math.max(0, field.clientHeight - logo.offsetHeight);
      // sizeを大きくしたあと枠外へ取り残されないようクランプし直す
      x = Math.min(x, maxX);
      y = Math.min(y, maxY);
    };

    measure();
    // 初期位置は固定値。毎回同じ絵から始まるほうが辞典として比較しやすい
    x = maxX * 0.18;
    y = maxY * 0.62;

    // ステージの幅だけでなくsize変更(ロゴ自身のリサイズ)でも取り直す
    const observer = new ResizeObserver(measure);
    observer.observe(field);
    observer.observe(logo);

    const removeTick = addTick((time) => {
      const p = paramsRef.current;
      if (last == null) {
        last = time;
        return;
      }
      const dt = Math.min(MAX_DT, (time - last) / 1000);
      last = time;

      if (aimRef.current) {
        aimRef.current = false;
        // いま居る側と反対の角を狙う。必ずコーナーヒットに行き着く
        const tx = x < maxX / 2 ? maxX : 0;
        const ty = y < maxY / 2 ? maxY : 0;
        vx = tx - x;
        vy = ty - y;
      }

      // 向きを単位ベクトルへ正規化してから px/s を掛ける。
      // speedやsizeを動かしても進行方向は変わらない
      const len = Math.hypot(vx, vy) || 1;
      vx = (vx / len) * p.speed;
      vy = (vy / len) * p.speed;

      x += vx * dt;
      y += vy * dt;

      // 端に食い込んだ座標をクランプしてから符号を「確定」させる。
      // vx = -vx にすると枠外に居る間ずっと反転し続けて貼り付く
      let hitX = false;
      let hitY = false;
      if (x <= 0) {
        x = 0;
        vx = Math.abs(vx);
        hitX = true;
      } else if (x >= maxX) {
        x = maxX;
        vx = -Math.abs(vx);
        hitX = true;
      }
      if (y <= 0) {
        y = 0;
        vy = Math.abs(vy);
        hitY = true;
      } else if (y >= maxY) {
        y = maxY;
        vy = -Math.abs(vy);
        hitY = true;
      }

      if (hitX || hitY) {
        if (hitX) lastHitX = time;
        if (hitY) lastHitY = time;
        hue = (hue + p.hue) % 360;
        logo.style.filter = `hue-rotate(${hue}deg)`;

        if (Math.abs(lastHitX - lastHitY) < CORNER_WINDOW) {
          lastHitX = -Infinity;
          lastHitY = -Infinity;
          corners += 1;
          if (count) count.textContent = String(corners);
          inner.style.setProperty("--pop-scale", String(p.pop));
          // 付け直す前に一度外し、reflowを挟まないと2回目が再生されない
          inner.classList.remove(styles.pop);
          inner.getBoundingClientRect();
          inner.classList.add(styles.pop);
        }
      }

      logo.style.transform = `translate(${x}px, ${y}px)`;
    });

    return () => {
      observer.disconnect();
      removeTick();
    };
  }, [reduce]);

  return (
    <DemoStage
      hint="PC: クリック / スマホ: タップ で角を狙う(コーナーヒット)"
      className={styles.bounceStage}
    >
      <button
        type="button"
        ref={fieldRef}
        className={styles.field}
        onClick={() => {
          aimRef.current = true;
        }}
        aria-label="ロゴを角へ向ける"
      >
        <div
          ref={logoRef}
          className={reduce ? `${styles.logo} ${styles.logoStill}` : styles.logo}
          style={{ width: `${params.size}px` }}
          aria-hidden
        >
          <span ref={innerRef} className={styles.inner}>
            DVD
          </span>
        </div>
      </button>
      <p className={styles.readout} aria-hidden>
        CORNER HITS <span ref={countRef}>{0}</span>
      </p>
    </DemoStage>
  );
}
