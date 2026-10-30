"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ScrollUnroll.module.css";

// 紙と芯で共有するイージング(出典 juliamoresco.com.br の diplomaUnroll / diplomaRoll と同じ)
const EASE = "cubic-bezier(0.3, 0.6, 0.3, 1)";
// キャップが外れる時間(出典 0.5s)。遅延は lead×0.4s(出典 0.25s / 0.6s)
const CAP_DUR = 0.5;
const CAP_DELAY_RATIO = 0.4;

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

export default function ScrollUnroll({ params }: { params: ParamValues }) {
  // rolled: 巻いてある / open: ほどけた / closing: 巻き上げ中(キャップは外れたまま)
  const [phase, setPhase] = useState<"rolled" | "open" | "closing">("rolled");
  const busyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const { duration, lead, rollSize } = params;
  const open = phase === "open";

  const toggle = () => {
    if (busyRef.current) return;
    if (reduce) {
      setPhase((p) => (p === "open" ? "rolled" : "open"));
      return;
    }
    busyRef.current = true;
    if (phase === "rolled") {
      setPhase("open");
      // 動いている間の操作は無視する
      timerRef.current = setTimeout(() => {
        busyRef.current = false;
      }, (lead + duration) * 1000);
      return;
    }
    // 巻き上げは遅延なし・同じ時間とイージング。終わったらキャップを戻す
    setPhase("closing");
    timerRef.current = setTimeout(() => {
      setPhase("rolled");
      busyRef.current = false;
    }, duration * 1000);
  };

  // 窓・紙・芯は同じ時間・同じイージング・同じ遅延で走らせる(ずれると芯が縁から離れる)
  const move = reduce ? "none" : `${duration}s ${EASE} ${open ? lead : 0}s`;

  // 切り開きは窓と中の紙を逆向きに同量動かして作る(どちらも transform)。
  // clip-path はメインスレッドで描かれ、コンポジタで動く芯の transform と負荷時にずれるため使わない
  const windowStyle: CSSProperties = {
    transform: open ? "translateY(0)" : "translateY(-100%)",
    transition: move === "none" ? "none" : `transform ${move}`,
  };

  const paperStyle: CSSProperties = {
    transform: open ? "translateY(0)" : "translateY(100%)",
    transition: move === "none" ? "none" : `transform ${move}`,
  };

  const trackStyle: CSSProperties = {
    transform: open ? "translateY(100%)" : "translateY(0)",
    transition: move === "none" ? "none" : `transform ${move}`,
  };

  const capClass =
    phase === "rolled"
      ? `${styles.cap} ${styles.capBack}`
      : reduce
        ? `${styles.cap} ${styles.capGone}`
        : `${styles.cap} ${styles.capOff}`;

  const capStyle = {
    "--su-cap-dur": `${CAP_DUR}s`,
    "--su-cap-delay": `${(lead * CAP_DELAY_RATIO).toFixed(3)}s`,
  } as CSSProperties;

  return (
    <DemoStage hint="Unroll / タップ: 巻物がほどける">
      <div className={styles.center}>
        <div className={styles.scroll}>
          <div className={styles.rod} aria-hidden>
            <span className={styles.band} />
            <span className={styles.band} />
            <span className={capClass} style={capStyle} />
          </div>

          <div className={styles.sheet} onClick={toggle} aria-hidden>
            <div className={styles.clip}>
              <div className={styles.window} style={windowStyle}>
                <div className={styles.paper} style={paperStyle}>
                  <img
                    src="/motion-dict/demo/photo-13.jpg"
                    alt=""
                    draggable={false}
                    className={styles.photo}
                  />
                  <span className={styles.folio}>Plate 13 — くるくる</span>
                </div>
              </div>
            </div>
            <div className={styles.track} style={trackStyle}>
              <span className={styles.roll} style={{ height: `${rollSize}px` }} />
            </div>
          </div>
        </div>
      </div>

      <button className={styles.btn} onClick={toggle}>
        {open ? "Roll up" : "Unroll"}
      </button>
    </DemoStage>
  );
}
