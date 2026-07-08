"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./CustomCursor.module.css";

// content/custom-cursor.ts の blend options と同順
const BLENDS = ["normal", "difference", "exclusion"] as const;

export default function CustomCursor({ params }: { params: ParamValues }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const stage = stageRef.current;
    const dot = dotRef.current;
    if (!stage || !dot) return;

    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let visible = false;
    let entered = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function pointerMove(clientX: number, clientY: number) {
      if (!stage) return;
      const r = stage.getBoundingClientRect();
      target.x = clientX - r.left;
      target.y = clientY - r.top;
      // 初回はワープさせず、入った位置から追従を始める
      if (!entered) {
        pos.x = target.x;
        pos.y = target.y;
        entered = true;
      }
      visible = true;
    }

    const onMouseMove = (e: MouseEvent) => pointerMove(e.clientX, e.clientY);
    const hide = () => {
      visible = false;
      entered = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      pointerMove(t.clientX, t.clientY);
    };

    stage.addEventListener("mousemove", onMouseMove);
    stage.addEventListener("mouseleave", hide);
    stage.addEventListener("touchmove", onTouchMove, { passive: false });
    stage.addEventListener("touchend", hide);

    const removeTick = addTick(() => {
      const k = paramsRef.current.lerp;
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      if (reduce) {
        pos.x = target.x;
        pos.y = target.y;
      }
      dot.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
      dot.style.opacity = visible ? "1" : "0";
    });

    return () => {
      removeTick();
      stage.removeEventListener("mousemove", onMouseMove);
      stage.removeEventListener("mouseleave", hide);
      stage.removeEventListener("touchmove", onTouchMove);
      stage.removeEventListener("touchend", hide);
    };
  }, []);

  const dotStyle: CSSProperties = {
    width: params.size,
    height: params.size,
    mixBlendMode: BLENDS[Math.round(params.blend)] ?? "difference",
  };

  return (
    <DemoStage
      stageRef={stageRef}
      className={styles.noCursor}
      hint="PC: ステージ内を動かす / スマホ: ドラッグ"
    >
      <p className={styles.text}>MOVE AROUND</p>
      <div className={styles.dot} ref={dotRef} style={dotStyle} />
    </DemoStage>
  );
}
