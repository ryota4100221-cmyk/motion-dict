"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./EyesFollowCursor.module.css";

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

const IDLE_AFTER = 1600; // 無操作がこれだけ続いたら目標点を巡回させる(ms)
const IDLE_PERIOD = 5200; // 巡回1周(ms)

export default function EyesFollowCursor({ params }: { params: ParamValues }) {
  const faceRef = useRef<HTMLSpanElement>(null);
  const eyeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const pupilRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const paramsRef = useRef(params);
  const reduce = useReducedMotion();

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    // 実ポインタの位置。動いたら touched を立て、時刻は rAF の time で確定する
    const pointer = { x: 0, y: 0, has: false, touched: false };
    let lastInput = -Infinity;

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.has = true;
      pointer.touched = true;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });

    const removeTick = addTick((time) => {
      const face = faceRef.current;
      if (!face) return;
      if (pointer.touched) {
        pointer.touched = false;
        lastInput = time;
      }
      const { travel, reach, gaze } = paramsRef.current;
      const fr = face.getBoundingClientRect();
      // 顔の中心=両目のあいだ・目の高さ
      const cx = fr.left + fr.width / 2;
      const cy = fr.top + fr.height / 2;

      // 見る先。無操作が続いたら、顔の周りを楕円で巡る見えない目標点を目で追う
      let tx = pointer.x;
      let ty = pointer.y;
      const idle = !pointer.has || time - lastInput > IDLE_AFTER;
      if (idle) {
        if (reduce) {
          tx = cx;
          ty = cy;
        } else {
          const a = (time / IDLE_PERIOD) * Math.PI * 2;
          // 半径を reach に合わせ、瞳が可動域の端まで届くようにする(8の字で時々正面も見る)
          tx = cx + Math.cos(a) * reach * 1.2;
          ty = cy + Math.sin(a * 2) * reach * 0.7;
        }
      }

      for (let i = 0; i < 2; i++) {
        // ノードは入れ替わることがあるので毎フレーム引き直す
        const eye = eyeRefs.current[i];
        const pupil = pupilRefs.current[i];
        if (!eye || !pupil) continue;
        const er = eye.getBoundingClientRect();
        const ox = Math.round(gaze) === 1 ? er.left + er.width / 2 : cx;
        const oy = Math.round(gaze) === 1 ? er.top + er.height / 2 : cy;
        const dx = tx - ox;
        const dy = ty - oy;
        const d = Math.hypot(dx, dy) || 1;
        // 余白 = 白目の半径 − 瞳の半径。距離に比例させ、reach で頭打ち
        const room = (er.width - pupil.offsetWidth) / 2;
        const u = Math.min(1, d / reach) * room * (travel / 100);
        pupil.style.setProperty("--mx", ((dx / d) * u).toFixed(2));
        pupil.style.setProperty("--my", ((dy / d) * u).toFixed(2));
      }
    });

    return () => {
      removeTick();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
    };
  }, [reduce]);

  const lag = reduce ? 0 : params.lag;

  return (
    <DemoStage hint="PC: カーソルを動かすと瞳がその方向を見る / スマホ: タップ・なぞった位置を見る">
      <div className={styles.scene}>
        <p className={styles.word} aria-label="Look">
          <span aria-hidden>L</span>
          <span ref={faceRef} className={styles.face} aria-hidden>
            {[0, 1].map((k) => (
              <span
                key={k}
                ref={(el) => {
                  eyeRefs.current[k] = el;
                }}
                className={styles.eye}
              >
                <span
                  ref={(el) => {
                    pupilRefs.current[k] = el;
                  }}
                  className={styles.pupil}
                  style={{ transitionDuration: `${lag}s` }}
                />
              </span>
            ))}
          </span>
          <span aria-hidden>k</span>
        </p>
        <p className={styles.caption}>
          <span className={styles.mark} aria-hidden />
          Entry — eyes follow cursor
        </p>
      </div>
    </DemoStage>
  );
}
