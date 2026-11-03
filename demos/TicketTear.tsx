"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./TicketTear.module.css";

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

// zarcerog.com の Box Office(.bx-ticket)の定数。
// 本体の持ち上げ＝半券の 0.13s 後に 1.1s、発券＝0.95s
const PRESENT_GAP = 0.13;
const PRESENT_DUR = 1.1;
const HOLD = 900; // もぎり終えてから発券し直すまで(ms)
const AUTO = 3000; // 無操作でもぎるまで(ms)
const FIRST_AUTO = 6000; // 最初の表示からの1回目だけ長く待つ(先に触った人の操作を優先する)

type Phase = "idle" | "torn";

export default function TicketTear({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [ticket, setTicket] = useState<{ id: number; phase: Phase }>({ id: 0, phase: "idle" });
  const paramsRef = useRef(params);
  const phaseRef = useRef<Phase>("idle");
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
      const { tearDelay, tearDuration } = paramsRef.current;
      const elapsed = time - sinceRef.current;
      if (phaseRef.current === "idle") {
        const wait = firstRef.current ? FIRST_AUTO : AUTO;
        const go = pendingRef.current || elapsed >= wait;
        pendingRef.current = false;
        if (go) {
          phaseRef.current = "torn";
          firstRef.current = false;
          sinceRef.current = time;
          setTicket((t) => ({ id: t.id, phase: "torn" }));
        }
      } else {
        pendingRef.current = false; // 再生中のクリックは捨てる
        const total = Math.max(tearDelay + tearDuration, tearDelay + PRESENT_GAP + PRESENT_DUR) * 1000;
        if (elapsed >= total + HOLD) {
          phaseRef.current = "idle";
          sinceRef.current = time;
          setTicket((t) => ({ id: t.id + 1, phase: "idle" }));
        }
      }
    });
  }, [reduce]);

  const onPress = () => {
    if (reduce) {
      setTicket((t) => ({ id: t.id, phase: t.phase === "idle" ? "torn" : "idle" }));
      return;
    }
    pendingRef.current = true;
  };

  const { tearDelay, tearDuration, tearAngle, lift } = params;
  const serial = String(207 + ticket.id).padStart(3, "0");

  return (
    <DemoStage hint="PC: チケットをクリック / スマホ: タップ(無操作でも3秒ごとにもぎる)">
      <div
        className={styles.board}
        style={
          {
            "--tt-delay": `${tearDelay}s`,
            "--tt-dur": `${tearDuration}s`,
            "--tt-angle": `${tearAngle}deg`,
            "--tt-nudge": `${tearAngle / 9}deg`,
            "--tt-present-delay": `${tearDelay + PRESENT_GAP}s`,
            "--tt-lift": lift,
          } as CSSProperties
        }
      >
        <button
          key={`ticket-${ticket.id}`}
          type="button"
          className={styles.ticket}
          data-state={ticket.phase}
          data-reduce={reduce ? "" : undefined}
          aria-label={ticket.phase === "idle" ? "Tear the stub" : "Stub torn"}
          onClick={onPress}
        >
          <span className={styles.float}>
            <span className={styles.paper}>
              <span className={styles.main}>
                <span className={styles.house}>Motion Dictionary</span>
                <span className={styles.presents}>admits the bearer to</span>
                <span className={styles.title}>Ticket tear</span>
                <span className={styles.sub}>半券もぎり · パチン、ビリッ</span>
                <span className={styles.row}>
                  <span>
                    <i>Plate</i> 12
                  </span>
                  <span>
                    <i>Folio</i> 207
                  </span>
                  <span>
                    <i>Seat</i> M7
                  </span>
                </span>
              </span>
              <span className={styles.stub}>
                <span className={styles.admit}>Admit one</span>
                <span className={styles.serial}>Nº 000 {serial}</span>
                <span className={styles.hole} aria-hidden />
              </span>
            </span>
            <span className={styles.chad} aria-hidden />
          </span>
        </button>
      </div>
    </DemoStage>
  );
}
