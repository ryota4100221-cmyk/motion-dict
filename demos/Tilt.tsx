"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./Tilt.module.css";

export default function Tilt({ params }: { params: ParamValues }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const stage = stageRef.current;
    const card = cardRef.current;
    if (!stage || !card) return;

    const target = { rx: 0, ry: 0, s: 1 };
    const cur = { rx: 0, ry: 0, s: 1 };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function pointerMove(clientX: number, clientY: number) {
      if (!stage) return;
      const p = paramsRef.current;
      const r = stage.getBoundingClientRect();
      // ステージ内の位置を -1〜1 に正規化
      const nx = Math.max(-1, Math.min(1, ((clientX - r.left) / r.width) * 2 - 1));
      const ny = Math.max(-1, Math.min(1, ((clientY - r.top) / r.height) * 2 - 1));
      target.ry = nx * p.maxAngle;
      target.rx = -ny * p.maxAngle;
      target.s = p.scale;
    }

    const onMouseMove = (e: MouseEvent) => pointerMove(e.clientX, e.clientY);
    const reset = () => {
      target.rx = 0;
      target.ry = 0;
      target.s = 1;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      pointerMove(t.clientX, t.clientY);
    };

    stage.addEventListener("mousemove", onMouseMove);
    stage.addEventListener("mouseleave", reset);
    stage.addEventListener("touchmove", onTouchMove, { passive: false });
    stage.addEventListener("touchend", reset);

    const removeTick = addTick(() => {
      if (reduce) {
        card.style.transform = "none";
        return;
      }
      const k = 0.12;
      cur.rx += (target.rx - cur.rx) * k;
      cur.ry += (target.ry - cur.ry) * k;
      cur.s += (target.s - cur.s) * k;
      card.style.transform =
        `perspective(${paramsRef.current.perspective}px) ` +
        `rotateX(${cur.rx.toFixed(2)}deg) rotateY(${cur.ry.toFixed(2)}deg) ` +
        `scale(${cur.s.toFixed(3)})`;
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
    <DemoStage stageRef={stageRef} hint="PC: ステージ内を動かす / スマホ: ドラッグ">
      <div className={styles.card} ref={cardRef}>
        <span className={styles.cardLabel}>Tilt me</span>
        <span className={styles.cardSub}>rotateX / rotateY</span>
      </div>
    </DemoStage>
  );
}
