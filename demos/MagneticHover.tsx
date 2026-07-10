"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./MagneticHover.module.css";

export default function MagneticHover({ params }: { params: ParamValues }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const stage = stageRef.current;
    const btn = btnRef.current;
    const label = labelRef.current;
    if (!stage || !btn || !label) return;

    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let active = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function pointerMove(clientX: number, clientY: number) {
      if (!btn) return;
      const p = paramsRef.current;
      const r = btn.getBoundingClientRect();
      const cx = r.left + r.width / 2 - pos.x; // 元位置の中心
      const cy = r.top + r.height / 2 - pos.y;
      const dx = clientX - cx;
      const dy = clientY - cy;
      if (Math.hypot(dx, dy) < p.radius) {
        active = true;
        target.x = dx * p.strength;
        target.y = dy * p.strength;
      } else {
        active = false;
        target.x = 0;
        target.y = 0;
      }
    }

    const onMouseMove = (e: MouseEvent) => pointerMove(e.clientX, e.clientY);
    const reset = () => {
      active = false;
      target.x = 0;
      target.y = 0;
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

    // 戻りはlerpより弱い係数にして、ばねの余韻を軽く再現
    const removeTick = addTick(() => {
      const lerp = paramsRef.current.lerp;
      const k = active ? lerp : lerp * 0.7;
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      if (reduce) {
        pos.x = target.x;
        pos.y = target.y;
      }
      btn.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      label.style.transform = `translate(${pos.x * 0.35}px, ${pos.y * 0.35}px)`; // inner弱め
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
    <DemoStage stageRef={stageRef} hint="PC: カーソルを近づける / スマホ: ドラッグ">
      <button className={styles.magBtn} ref={btnRef}>
        <span ref={labelRef}>Hover me</span>
      </button>
    </DemoStage>
  );
}
