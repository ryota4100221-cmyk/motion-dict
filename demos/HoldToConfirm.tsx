"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./HoldToConfirm.module.css";

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

type Phase = "idle" | "holding" | "broken";

// levigav.com の封蝋(.seal)と同じ定数
const TAP_MS = 350; // これより短く離したら「もう少し長く」
const REST_MS = 1000; // 確定してから戻り始めるまで
const REFILL_MS = 700; // 確定後に空へ戻す時間(1 − n²)
const IDLE_WAIT = 1600; // 一度も触られていなければ、この間を置いて自走で押す

// 封蝋の縁(波打つ円)を作る
const WAX = (() => {
  const pts: string[] = [];
  const n = 72;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 46 + Math.sin(a * 12) * 2.2 + Math.sin(a * 5 + 1) * 1.2;
    pts.push(`${(60 + Math.cos(a) * r).toFixed(2)},${(60 + Math.sin(a) * r).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
})();

// ひび。1本目は進み具合どおり、残りは45%を過ぎてから描く
const CRACKS = ["M60 22 L56 44 L64 58 L57 76 L61 98", "M64 58 L80 52 L92 60", "M57 76 L42 82 L34 76"];

export default function HoldToConfirm({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const [note, setNote] = useState("Hold to unseal Folio 12");
  // 確定のたびに増やし、光の key に使って burst を頭から再生させる
  const [burstRun, setBurstRun] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);
  const phaseRef = useRef<Phase>("idle");
  const progressRef = useRef(0);
  const holdingRef = useRef(false);
  const touchedRef = useRef(false);
  // 時刻はすべて rAF の time から取る(performance.now は lint で落ちる)
  const nowRef = useRef(0);
  const lastRef = useRef(-1);
  const pressAtRef = useRef(0);
  const brokenAtRef = useRef(-1);
  const autoAtRef = useRef(-1);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const go = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const press = () => {
    if (phaseRef.current === "broken") return;
    touchedRef.current = true;
    holdingRef.current = true;
    pressAtRef.current = nowRef.current;
    go("holding");
    setNote("Keep holding…");
  };

  const release = () => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    if (phaseRef.current !== "holding") return;
    go("idle");
    if (nowRef.current - pressAtRef.current < TAP_MS) setNote("Hold a little longer");
    else setNote("Hold to unseal Folio 12");
  };

  useEffect(() => {
    return addTick((time) => {
      const root = rootRef.current;
      nowRef.current = time;
      if (lastRef.current < 0) {
        lastRef.current = time;
        autoAtRef.current = time + IDLE_WAIT;
      }
      const dt = Math.min(64, time - lastRef.current);
      lastRef.current = time;
      const p = paramsRef.current;
      let s = progressRef.current;

      if (phaseRef.current === "broken") {
        const since = time - brokenAtRef.current;
        const rest = reduce ? 200 : REST_MS;
        if (since >= rest) {
          const n = reduce ? 1 : Math.min(1, (since - rest) / REFILL_MS);
          s = 1 - n * n;
          if (n >= 1) {
            s = 0;
            go("idle");
            setNote("Hold to unseal Folio 12");
            autoAtRef.current = time + IDLE_WAIT;
          }
        }
      } else {
        // 一度も触られていない間だけ、自走で長押しを実演する
        if (!reduce && !touchedRef.current && phaseRef.current === "idle" && s === 0 && time >= autoAtRef.current) {
          holdingRef.current = true;
          pressAtRef.current = time;
          phaseRef.current = "holding";
          setPhase("holding");
          setNote("Keep holding…");
        }
        if (holdingRef.current) s = reduce ? 1 : Math.min(1, s + dt / (p.holdTime * 1000));
        else s = Math.max(0, s - dt / (p.drainTime * 1000));
        if (s >= 1) {
          holdingRef.current = false;
          brokenAtRef.current = time;
          go("broken");
          setBurstRun((n) => n + 1);
          setNote("Folio 12 unsealed");
        }
      }

      progressRef.current = s;
      if (root) {
        root.style.setProperty("--hc-p", s.toFixed(3));
        root.style.setProperty("--hc-p2", Math.max(0, (s - 0.45) / 0.55).toFixed(3));
      }
    });
  }, [reduce]);

  const vars = {
    "--hc-shake": `${params.shake}`,
    "--hc-burst": `${params.burst}`,
  } as CSSProperties;

  return (
    <DemoStage hint="PC: 封蝋を押し続ける(Enter / Space でも可) / スマホ: 指で押したまま。途中で離すと戻る">
      <div ref={rootRef} className={styles.wrap} style={vars} data-phase={phase} data-reduce={reduce ? "" : undefined}>
        <div className={styles.letter} aria-hidden>
          <span className={styles.folio}>Folio 12</span>
          <span className={styles.rule} />
          <span className={styles.rule} />
          <span className={styles.ruleShort} />
        </div>
        <button
          type="button"
          className={styles.seal}
          aria-label="Hold to unseal Folio 12"
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.currentTarget.setPointerCapture?.(e.pointerId);
            press();
          }}
          onPointerUp={() => release()}
          onPointerCancel={() => release()}
          onLostPointerCapture={() => release()}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
              e.preventDefault();
              press();
            }
          }}
          onKeyUp={(e) => {
            if (e.key === "Enter" || e.key === " ") release();
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <span key={`burst-${burstRun}`} className={styles.glow} data-on={burstRun > 0 ? "" : undefined} />
          <svg className={styles.ring} viewBox="0 0 120 120" aria-hidden>
            <circle className={styles.ringTrack} cx="60" cy="60" r="57" />
            <circle className={styles.ringFill} cx="60" cy="60" r="57" pathLength={1} />
          </svg>
          <svg className={styles.wax} viewBox="0 0 120 120" aria-hidden>
            <path className={styles.waxBody} d={WAX} />
            <circle className={styles.waxInner} cx="60" cy="60" r="33" />
            <text className={styles.glyph} x="60" y="72" textAnchor="middle">
              ¶
            </text>
            {CRACKS.map((d, i) => (
              <path key={d} className={styles.crack} d={d} pathLength={1} data-late={i > 0 ? "" : undefined} />
            ))}
          </svg>
        </button>
        <p className={styles.note} aria-live="polite">
          {note}
        </p>
      </div>
    </DemoStage>
  );
}
