"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./SpotlightHover.module.css";

export default function SpotlightHover({ params }: { params: ParamValues }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const stage = stageRef.current;
    const light = lightRef.current;
    if (!stage || !light) return;

    const target = { x: 0, y: 0 };
    let visible = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function pointerMove(clientX: number, clientY: number) {
      if (!stage) return;
      const r = stage.getBoundingClientRect();
      target.x = clientX - r.left;
      target.y = clientY - r.top;
      visible = true;
    }

    const onMouseMove = (e: MouseEvent) => pointerMove(e.clientX, e.clientY);
    const hide = () => {
      visible = false;
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

    // mousemove毎ではなくrAFで1フレーム1回だけ描画に反映する
    const removeTick = addTick(() => {
      const p = paramsRef.current;
      // reduced-motion時は追従させず中央に固定表示
      if (reduce && stage) {
        const r = stage.getBoundingClientRect();
        target.x = r.width / 2;
        target.y = r.height / 2;
        visible = true;
      }
      const hardStop = (1 - p.softness) * 100;
      light.style.background =
        `radial-gradient(circle ${p.radius}px at ${target.x}px ${target.y}px, ` +
        `rgba(233, 230, 223, 0.14) 0%, ` +
        `rgba(233, 230, 223, 0.14) ${hardStop.toFixed(0)}%, ` +
        `transparent 100%)`;
      light.style.opacity = visible ? "1" : "0";
    });

    return () => {
      removeTick();
      stage.removeEventListener("mousemove", onMouseMove);
      stage.removeEventListener("mouseleave", hide);
      stage.removeEventListener("touchmove", onTouchMove);
      stage.removeEventListener("touchend", hide);
    };
  }, []);

  return (
    <DemoStage stageRef={stageRef} hint="PC: ステージ内を動かす / スマホ: ドラッグ">
      <div className={styles.content}>
        <span className={styles.big}>Spotlight</span>
        <span className={styles.small}>Move the light to read this line</span>
      </div>
      <div className={styles.light} ref={lightRef} />
    </DemoStage>
  );
}
