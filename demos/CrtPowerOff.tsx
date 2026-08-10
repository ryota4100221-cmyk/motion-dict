"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./CrtPowerOff.module.css";

// 画面に映しておくダミー出力(潰れる過程が見えるよう、行は少なめ)
const ROWS = ["CH 03 ...... MOTION", "SIGNAL ..... GOOD"];

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

// 電源オフ: flicker(明滅) → collapse(縦に潰れる) → dot(点になって消える)
// 電源オン: lineIn(点から横一本の線へ) → expand(縦に開く)
type Phase = "on" | "flicker" | "collapse" | "dot" | "off" | "lineIn" | "expand";

const OFF_PHASES: Phase[] = ["off", "lineIn"];

export default function CrtPowerOff({ params }: { params: ParamValues }) {
  const [phase, setPhase] = useState<Phase>("on");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const flicker = Math.round(params.flicker);
  const total = params.duration * 1000;
  // 明滅に全体の3割。残りは「縦に潰す:線のまま留める:点にして消す」= 42:22:36。
  // 潰し切ってすぐ消すと肝心の「一本の線」が目に残らない
  const flickMs = flicker > 0 ? total * 0.3 : 0;
  const rest = total - flickMs;
  const collapseMs = rest * 0.42;
  const holdMs = rest * 0.22;
  const dotMs = rest * 0.36;
  const line = params.line / 100; // 潰し切ったときのscale値(元の高さに対する割合)

  const busy = phase !== "on" && phase !== "off";
  const isOff = phase === "off";

  const at = (ms: number, next: Phase) => {
    timersRef.current.push(setTimeout(() => setPhase(next), ms));
  };

  const toggle = () => {
    if (busy) return;
    // reduced-motion: 潰す動きも明滅もさせず、フェードだけで切り替える
    if (reduce) {
      setPhase(isOff ? "on" : "off");
      return;
    }
    if (isOff) {
      setPhase("lineIn");
      at(dotMs + holdMs, "expand");
      at(dotMs + holdMs + collapseMs, "on");
      return;
    }
    if (flicker > 0) {
      setPhase("flicker");
      at(flickMs, "collapse");
    } else {
      setPhase("collapse");
    }
    at(flickMs + collapseMs + holdMs, "dot");
    at(flickMs + collapseMs + holdMs + dotMs, "off");
  };

  // 発光レイヤーの濃さは flash に連動させる(1倍=光らせずに潰すだけ)
  const glowMax = Math.min(1, (params.flash - 1) / 2.5);

  const glowStyle = (): CSSProperties => {
    if (reduce) return { opacity: 0 };
    switch (phase) {
      case "collapse":
      case "dot":
      case "off":
      case "lineIn":
        return {
          opacity: glowMax,
          transition: `opacity ${collapseMs}ms ease-in`,
        };
      case "expand":
        return { opacity: 0, transition: `opacity ${collapseMs}ms ease-out` };
      default:
        return { opacity: 0, transition: "none" };
    }
  };

  // 触るのは transform / filter / opacity だけ。height を縮めるとリフローが走る
  const screenStyle = (): CSSProperties => {
    if (reduce) {
      return { opacity: isOff ? 0 : 1, transition: "opacity 0.2s linear" };
    }
    const lit = `brightness(${params.flash})`;
    switch (phase) {
      case "flicker":
        // 明滅は回数で止めたいので、周期と回数だけCSS変数で渡す
        return {
          "--flick-dur": `${flickMs / flicker}ms`,
          "--flick-count": `${flicker}`,
          transform: "scaleY(1) scaleX(1)",
          opacity: 1,
          transition: "none",
        } as CSSProperties;
      case "collapse":
        // 中央に横一本の輝いた線を残す。最後に加速して潰れる ease-in
        return {
          transform: `scaleY(${line}) scaleX(1)`,
          filter: lit,
          opacity: 1,
          transition: `transform ${collapseMs}ms ease-in, filter ${collapseMs}ms ease-in`,
        };
      case "dot":
      case "off":
        return {
          transform: `scaleY(${line}) scaleX(${line})`,
          filter: lit,
          opacity: 0,
          transition:
            phase === "off"
              ? "none"
              : `transform ${dotMs}ms ease-in, opacity ${dotMs}ms ease-in`,
        };
      case "lineIn":
        // 点 → 横一本の線(縦は潰れたまま)
        return {
          transform: `scaleY(${line}) scaleX(1)`,
          filter: lit,
          opacity: 1,
          transition: `transform ${dotMs}ms ease-out, opacity ${dotMs}ms ease-out`,
        };
      case "expand":
        return {
          transform: "scaleY(1) scaleX(1)",
          filter: "brightness(1)",
          opacity: 1,
          transition: `transform ${collapseMs}ms ease-out, filter ${collapseMs}ms ease-out`,
        };
      default:
        return {
          transform: "scaleY(1) scaleX(1)",
          filter: "brightness(1)",
          opacity: 1,
          transition: "none",
        };
    }
  };

  return (
    <DemoStage hint="Power: 画面の電源をオフ/オンする(タップでも可)">
      <div className={styles.set}>
        <div className={styles.bezel}>
          <div
            className={
              phase === "flicker"
                ? `${styles.screen} ${styles.flickering}`
                : styles.screen
            }
            style={screenStyle()}
          >
            <div className={styles.content}>
              <span className={styles.brand}>MOTION DICT</span>
              {ROWS.map((row) => (
                <span key={row} className={styles.row}>
                  {row}
                </span>
              ))}
            </div>
            <div className={styles.glow} style={glowStyle()} aria-hidden />
          </div>
        </div>
        <button className={styles.powerBtn} onClick={toggle} disabled={busy}>
          {OFF_PHASES.includes(phase) ? "Power on" : "Power off"}
        </button>
      </div>
    </DemoStage>
  );
}
