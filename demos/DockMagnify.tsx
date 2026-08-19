"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./DockMagnify.module.css";

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

const ICONS = ["◐", "▤", "◇", "☰", "◍", "△", "✳", "●"];

export default function DockMagnify({ params }: { params: ParamValues }) {
  const bandRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);
  const reduce = useReducedMotion();

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const band = bandRef.current;
    const dock = dockRef.current;
    if (!band || !dock) return;

    const items = Array.from(dock.children) as HTMLElement[];

    // clientX=null は「どこも指していない」= 全アイテム等倍
    function apply(clientX: number | null) {
      if (!dock) return;
      const { maxScale, range, lift } = paramsRef.current;
      const dockLeft = dock.getBoundingClientRect().left;
      let nearest = -1;
      let nearestDist = Infinity;

      items.forEach((item, i) => {
        // 中心は必ずレイアウト上の位置(offsetLeft)から出す。
        // 拡大後の矩形で測ると中心が自分の拡大に引きずられて震える
        const center = dockLeft + item.offsetLeft + item.offsetWidth / 2;
        const d = clientX === null ? Infinity : Math.abs(clientX - center);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = i;
        }

        if (reduce) {
          item.style.transform = "";
          return;
        }
        // 二次で落とす。線形だと山の稜線が角張ってドックに見えない
        const t = Math.max(0, 1 - (d / range) ** 2);
        const scale = 1 + (maxScale - 1) * t;
        item.style.transform = `translateY(${-lift * t}px) scale(${scale})`;
      });

      // reduced-motion時は拡大の代わりに、指している1つを背景色で示す
      items.forEach((item, i) => {
        item.dataset.near =
          reduce && clientX !== null && i === nearest ? "1" : "0";
      });
    }

    const onMouseMove = (e: MouseEvent) => apply(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      apply(e.touches[0].clientX);
    };
    const reset = () => apply(null);

    band.addEventListener("mousemove", onMouseMove);
    band.addEventListener("mouseleave", reset);
    band.addEventListener("touchmove", onTouchMove, { passive: false });
    band.addEventListener("touchend", reset);
    reset();

    return () => {
      band.removeEventListener("mousemove", onMouseMove);
      band.removeEventListener("mouseleave", reset);
      band.removeEventListener("touchmove", onTouchMove);
      band.removeEventListener("touchend", reset);
    };
  }, [reduce]);

  // duration はCSSのtransitionへ渡す(値の飛びをここで吸収する)
  const dockStyle = {
    "--dock-dur": `${reduce ? 0 : params.duration}s`,
  } as CSSProperties;

  return (
    <DemoStage hint="PC: ドックの上を左右になぞる / スマホ: ドックを指でなぞる">
      <div className={styles.band} ref={bandRef}>
        <div className={styles.dock} ref={dockRef} style={dockStyle}>
          {ICONS.map((icon) => (
            <span key={icon} className={styles.item} data-near="0">
              {icon}
            </span>
          ))}
        </div>
      </div>
    </DemoStage>
  );
}
