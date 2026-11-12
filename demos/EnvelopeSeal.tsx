"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./EnvelopeSeal.module.css";

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

// davidcata.com /musica/cine/ の手紙フォーム(.ensobrando)の段取り。
// 封筒が出る 0.15s+0.5s、フタの層を上げる=手紙が沈みきって+0.05s、フタ=+0.1s、
// 封蝋=フタが閉じて+0.05s(0.35s)、飛行=封蝋の開始+0.5s
const ENVELOPE_IN = 0.15;
const SEAL = 0.35;
const HOLD = 900; // 飛び去ってから新しい手紙を戻すまで(ms)
const AUTO = 3000; // 無操作で送るまで(ms)
const FIRST_AUTO = 6000; // 最初の表示からの1回目だけ長く待つ

type Phase = "ready" | "sending";

function timeline(p: ParamValues) {
  const layerAt = p.tuckDuration + 0.05;
  const flapAt = p.tuckDuration + 0.1;
  const sealAt = flapAt + p.flapDuration + 0.05;
  const flyAt = sealAt + SEAL + 0.15;
  return { layerAt, flapAt, sealAt, flyAt, total: flyAt + p.flyDuration };
}

export default function EnvelopeSeal({ params }: { params: ParamValues }) {
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
        if (elapsed >= timeline(paramsRef.current).total * 1000 + HOLD) {
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

  const { tuckDuration, flapDuration, sealOvershoot, flyDuration } = params;
  const t = timeline(params);
  const folio = 318 + letter.id;
  const sending = letter.phase === "sending";

  return (
    <DemoStage hint="PC: Seal and send をクリック / スマホ: タップ(無操作でも3秒ごとに送る)">
      <div
        className={styles.board}
        data-reduce={reduce ? "" : undefined}
        style={
          {
            "--es-in": `${ENVELOPE_IN}s`,
            "--es-tuck": `${tuckDuration}s`,
            "--es-layer-at": `${t.layerAt}s`,
            "--es-flap": `${flapDuration}s`,
            "--es-flap-at": `${t.flapAt}s`,
            "--es-seal-ease": `cubic-bezier(0.34, ${sealOvershoot}, 0.64, 1)`,
            "--es-seal-at": `${t.sealAt}s`,
            "--es-fly": `${flyDuration}s`,
            "--es-fly-at": `${t.flyAt}s`,
            "--es-sent-at": `${t.flyAt + flyDuration * 0.5}s`,
          } as CSSProperties
        }
      >
        <div key={`letter-${letter.id}`} className={styles.scene} data-state={letter.phase}>
          {/* 封筒の3枚は手紙と同じ階層に並べる(包むと重なり順の中に手紙を挟めない) */}
          <span className={`${styles.piece} ${styles.back}`} aria-hidden />
          <span className={`${styles.piece} ${styles.flapBox}`} aria-hidden>
            <span className={styles.flap} />
            <span className={styles.seal}>§</span>
          </span>
          <span className={`${styles.piece} ${styles.front}`} aria-hidden />
          <div className={styles.sheet} aria-hidden={sending}>
            <span className={styles.folio}>Folio {folio}</span>
            <span className={styles.dear}>To the editor,</span>
            <span className={styles.body}>
              A new entry for the glossary: envelope seal — 手紙をしまって、パタンと閉じて、ぽんと封。
            </span>
            <span className={styles.rules} aria-hidden />
            <span className={styles.sign}>— Plate 14</span>
          </div>
          <span className={styles.sent} aria-live="polite">
            {sending ? "Sent" : ""}
          </span>
        </div>
        <button type="button" className={styles.send} onClick={onSend} aria-disabled={sending && !reduce}>
          <span>{reduce && sending ? "Write again" : "Seal and send"}</span>
        </button>
      </div>
    </DemoStage>
  );
}
