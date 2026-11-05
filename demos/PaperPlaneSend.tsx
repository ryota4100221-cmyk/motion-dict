"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./PaperPlaneSend.module.css";

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

// georgedo.com の送信(#flight の .folding-sheet → .paper-plane)の後に足す間合い
const HOLD = 900; // 飛び終わってから新しい便箋を戻すまで(ms)
const AUTO = 3000; // 無操作で送るまで(ms)
const FIRST_AUTO = 6000; // 最初の表示からの1回目だけ長く待つ(先に触った人の操作を優先する)

type Phase = "ready" | "sending";

export default function PaperPlaneSend({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [letter, setLetter] = useState<{ id: number; phase: Phase }>({ id: 0, phase: "ready" });
  const paramsRef = useRef(params);
  const phaseRef = useRef<Phase>("ready");
  const pendingRef = useRef(false);
  const sinceRef = useRef(NaN); // 今の phase に入った時刻(rAF の time)
  const firstRef = useRef(true);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    if (reduce) return;
    return addTick((time) => {
      if (Number.isNaN(sinceRef.current)) sinceRef.current = time;
      const { foldDuration, launchDelay, flightDuration } = paramsRef.current;
      const elapsed = time - sinceRef.current;
      if (phaseRef.current === "ready") {
        const wait = firstRef.current ? FIRST_AUTO : AUTO;
        const go = pendingRef.current || elapsed >= wait;
        pendingRef.current = false;
        if (go) {
          phaseRef.current = "sending";
          firstRef.current = false;
          sinceRef.current = time;
          setLetter((l) => ({ id: l.id, phase: "sending" }));
        }
      } else {
        pendingRef.current = false; // 再生中のクリックは捨てる
        const total = Math.max(foldDuration, launchDelay + flightDuration) * 1000;
        if (elapsed >= total + HOLD) {
          phaseRef.current = "ready";
          sinceRef.current = time;
          setLetter((l) => ({ id: l.id + 1, phase: "ready" }));
        }
      }
    });
  }, [reduce]);

  const onSend = () => {
    if (reduce) {
      setLetter((l) => ({ id: l.id, phase: l.phase === "ready" ? "sending" : "ready" }));
      return;
    }
    pendingRef.current = true;
  };

  const { foldDuration, launchDelay, flightDuration, climb } = params;
  const folio = 211 + letter.id;
  const sending = letter.phase === "sending";

  return (
    <DemoStage hint="PC: Send letter をクリック / スマホ: タップ(無操作でも3秒ごとに送る)">
      <div
        className={styles.board}
        data-reduce={reduce ? "" : undefined}
        style={
          {
            "--pp-fold": `${foldDuration}s`,
            "--pp-launch": `${launchDelay}s`,
            "--pp-flight": `${flightDuration}s`,
            "--pp-climb": `${-climb}deg`,
            "--pp-sent-at": `${launchDelay + flightDuration * 0.6}s`,
          } as CSSProperties
        }
      >
        <div key={`letter-${letter.id}`} className={styles.scene} data-state={letter.phase}>
          <div className={styles.sheet} aria-hidden={sending}>
            <span className={styles.folio}>Folio {folio}</span>
            <span className={styles.dear}>To the editor,</span>
            <span className={styles.body}>
              A new entry for the glossary: paper plane send — 紙を折って、スーッと飛ばす。
            </span>
            <span className={styles.rules} aria-hidden />
            <span className={styles.sign}>— Plate 12</span>
          </div>
          <span className={styles.plane} aria-hidden />
          <span className={styles.sent} aria-live="polite">
            {sending ? "Sent" : ""}
          </span>
        </div>
        <button type="button" className={styles.send} onClick={onSend} aria-disabled={sending && !reduce}>
          <span>{reduce && sending ? "Write again" : "Send letter"}</span>
        </button>
      </div>
    </DemoStage>
  );
}
