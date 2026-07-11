"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./HoverPreview.module.css";

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

// リンクと対応するプレビュー画像(用意済みダミー)
const ITEMS = [
  { label: "Mountain", src: "/demo/dummy-01.svg" },
  { label: "Dune", src: "/demo/dummy-02.svg" },
  { label: "City", src: "/demo/dummy-03.svg" },
];

export default function HoverPreview({ params }: { params: ParamValues }) {
  const [active, setActive] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const activeRef = useRef(false);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const stage = stageRef.current;
    const preview = previewRef.current;
    if (!stage || !preview) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function setTarget(clientX: number, clientY: number) {
      if (!stage) return;
      const r = stage.getBoundingClientRect();
      target.current.x = clientX - r.left;
      target.current.y = clientY - r.top;
      // 非表示→表示の瞬間はスナップ(画面の隅から飛んでこないように)
      if (!activeRef.current) {
        pos.current.x = target.current.x;
        pos.current.y = target.current.y;
      }
    }

    const onMouseMove = (e: MouseEvent) => setTarget(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      setTarget(t.clientX, t.clientY);
    };
    stage.addEventListener("mousemove", onMouseMove);
    stage.addEventListener("touchstart", onTouchMove, { passive: false });
    stage.addEventListener("touchmove", onTouchMove, { passive: false });

    const removeTick = addTick(() => {
      const k = paramsRef.current.lerp;
      pos.current.x += (target.current.x - pos.current.x) * k;
      pos.current.y += (target.current.y - pos.current.y) * k;
      if (reduce) {
        pos.current.x = target.current.x;
        pos.current.y = target.current.y;
      }
      preview.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
    });

    return () => {
      removeTick();
      stage.removeEventListener("mousemove", onMouseMove);
      stage.removeEventListener("touchstart", onTouchMove);
      stage.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  useEffect(() => {
    activeRef.current = active !== null;
  }, [active]);

  // 出現はopacity+scale。reduced-motion時はフェード・scaleなしで即表示
  const innerStyle: CSSProperties = {
    opacity: active !== null ? 1 : 0,
    transform:
      reduce || active !== null ? "scale(1)" : `scale(${params.scaleFrom})`,
    transitionDuration: reduce ? "0s" : `${params.duration}s`,
  };

  return (
    <DemoStage stageRef={stageRef} hint="PC: リンクにホバー / スマホ: タップで表示・解除">
      <ul className={styles.list}>
        {ITEMS.map((item, i) => (
          <li key={item.label}>
            <span
              className={styles.link}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onTouchStart={() => setActive((a) => (a === i ? null : i))}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
      <div className={styles.preview} ref={previewRef} aria-hidden>
        <div className={styles.previewInner} style={innerStyle}>
          {/* 3枚とも事前読込し、activeの1枚だけ見せる */}
          {ITEMS.map((item, i) => (
            <img
              key={item.src}
              src={item.src}
              alt=""
              draggable={false}
              className={styles.previewImg}
              style={{ opacity: active === i ? 1 : 0 }}
            />
          ))}
        </div>
      </div>
    </DemoStage>
  );
}
