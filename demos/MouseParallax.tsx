"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./MouseParallax.module.css";

// 層ごとのdepth(奥ほど小さく動く)。この比率が奥行きの正体
const DEPTHS = [0.3, 0.6, 1.0];

export default function MouseParallax({ params }: { params: ParamValues }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const target = { x: 0, y: 0 }; // 正規化済み -1〜1
    const pos = { x: 0, y: 0 };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // マウス位置をコンテナ中心基準で-1〜1に正規化する
    function setTarget(clientX: number, clientY: number) {
      if (!stage) return;
      const r = stage.getBoundingClientRect();
      target.x = ((clientX - r.left) / r.width) * 2 - 1;
      target.y = ((clientY - r.top) / r.height) * 2 - 1;
    }

    const onMouseMove = (e: MouseEvent) => setTarget(e.clientX, e.clientY);
    const reset = () => {
      target.x = 0;
      target.y = 0;
    };
    // touch: ドラッグで疑似体験
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      setTarget(t.clientX, t.clientY);
    };

    stage.addEventListener("mousemove", onMouseMove);
    stage.addEventListener("mouseleave", reset);
    stage.addEventListener("touchmove", onTouchMove, { passive: false });
    stage.addEventListener("touchend", reset);

    const removeTick = addTick(() => {
      const p = paramsRef.current;
      pos.x += (target.x - pos.x) * p.lerp;
      pos.y += (target.y - pos.y) * p.lerp;
      // reduced-motion時はレイヤーを動かさない
      if (reduce) {
        pos.x = 0;
        pos.y = 0;
      }
      const dir = Math.round(p.direction) === 1 ? -1 : 1; // invert=逆方向
      for (let i = 0; i < DEPTHS.length; i++) {
        const el = layerRefs.current[i];
        if (!el) continue;
        const x = pos.x * p.strength * DEPTHS[i] * dir;
        const y = pos.y * p.strength * DEPTHS[i] * dir;
        el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
      }
    });

    return () => {
      removeTick();
      stage.removeEventListener("mousemove", onMouseMove);
      stage.removeEventListener("mouseleave", reset);
      stage.removeEventListener("touchmove", onTouchMove);
      stage.removeEventListener("touchend", reset);
    };
  }, []);

  return (
    <DemoStage stageRef={stageRef} hint="PC: カーソルを動かす / スマホ: ドラッグ">
      <div className={styles.scene}>
        <div
          className={`${styles.layer} ${styles.back}`}
          ref={(el) => {
            layerRefs.current[0] = el;
          }}
          aria-hidden
        />
        <div
          className={`${styles.layer} ${styles.mid}`}
          ref={(el) => {
            layerRefs.current[1] = el;
          }}
          aria-hidden
        />
        <div
          className={`${styles.layer} ${styles.front}`}
          ref={(el) => {
            layerRefs.current[2] = el;
          }}
        >
          Depth
        </div>
      </div>
    </DemoStage>
  );
}
