"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ImageParallaxHover.module.css";

export default function ImageParallaxHover({ params }: { params: ParamValues }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const stage = stageRef.current;
    const frame = frameRef.current;
    const img = imgRef.current;
    if (!stage || !frame || !img) return;

    // reduced-motion時は視差を無効化(画像は静止したまま)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // カーソル位置を枠の中心基準で-1〜1に正規化し、逆方向へshift(px)ぶん動かす。
    // 補間はtransition(transform)に任せるのでrAFは不要。
    function pointerMove(clientX: number, clientY: number) {
      if (!frame || !img || reduce) return;
      const p = paramsRef.current;
      const r = frame.getBoundingClientRect();
      const nx = Math.max(-1, Math.min(1, ((clientX - r.left) / r.width) * 2 - 1));
      const ny = Math.max(-1, Math.min(1, ((clientY - r.top) / r.height) * 2 - 1));
      img.style.transitionDuration = `${p.duration}s`;
      img.style.transform = `translate(${-nx * p.shift}px, ${-ny * p.shift}px)`;
    }

    const onMouseMove = (e: MouseEvent) => pointerMove(e.clientX, e.clientY);
    const reset = () => {
      if (!img) return;
      img.style.transitionDuration = `${paramsRef.current.duration}s`;
      img.style.transform = "translate(0, 0)";
    };
    // touch: ドラッグで疑似体験
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      pointerMove(t.clientX, t.clientY);
    };

    stage.addEventListener("mousemove", onMouseMove);
    stage.addEventListener("mouseleave", reset);
    stage.addEventListener("touchmove", onTouchMove, { passive: false });
    stage.addEventListener("touchend", reset);

    return () => {
      stage.removeEventListener("mousemove", onMouseMove);
      stage.removeEventListener("mouseleave", reset);
      stage.removeEventListener("touchmove", onTouchMove);
      stage.removeEventListener("touchend", reset);
    };
  }, []);

  return (
    <DemoStage
      stageRef={stageRef}
      hint="PC: カーソルを動かす / スマホ: ドラッグ"
    >
      <figure className={styles.card}>
        <div className={styles.frame} ref={frameRef}>
          <div className={styles.img} ref={imgRef} />
        </div>
        <figcaption className={styles.caption}>
          Fig.03 — depth study
        </figcaption>
      </figure>
    </DemoStage>
  );
}
