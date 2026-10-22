"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./CopyToClipboard.module.css";

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

type Result = "success" | "error";
type Shown = { row: number; result: Result; run: number } | null;

const ROWS = [
  { label: "install", text: "npm i motion-dict" },
  { label: "share", text: "https://motion-dict.framer.website" },
];

const FADE = 0.8; // ラベルが消える時間(観察元 _aO0 0.8s ease-in)
const IDLE_WAIT = 2400; // この時間押されなければ自走で押す
const IDLE_GAP = 900; // 自走のとき、消えてから次を押すまでの間

// 書き込みに失敗したら対象の文字列を選択状態にする(execCommandの対象＋手動コピーの逃げ道)
function selectText(el: HTMLElement | null) {
  if (!el) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

export default function CopyToClipboard({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const mode = Math.round(params.feedback);
  const showLabel = mode !== 1;
  const swapIcon = mode !== 0;

  const [shown, setShown] = useState<Shown>(null);

  const codeRefs = useRef<(HTMLElement | null)[]>([]);
  // クリック結果は非同期で返るので、ここに置いて次のフレームの time で確定させる
  const pendingRef = useRef<{ row: number; result: Result } | null>(null);
  // 期限はrAFのtimeからだけ確定させる(performance.nowはlintで落ちる)
  const untilRef = useRef(-1);
  const nextAutoRef = useRef(-1);
  const runRef = useRef(0);
  const autoRowRef = useRef(0);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const copy = async (row: number) => {
    const text = ROWS[row].text;
    let result: Result = "success";
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 拒否されたら選択して旧来の execCommand で再挑戦。それも駄目なら選択を残して手動コピーへ
      selectText(codeRefs.current[row]);
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {}
      if (ok) window.getSelection()?.removeAllRanges();
      else result = "error";
    }
    pendingRef.current = { row, result };
  };

  useEffect(() => {
    return addTick((time) => {
      const life = (paramsRef.current.hold + FADE) * 1000;
      if (nextAutoRef.current < 0) nextAutoRef.current = time + IDLE_WAIT;

      // 押すたびに run を増やし、ラベルと光の key を変えて頭から再生し直す
      let next = pendingRef.current;
      pendingRef.current = null;
      if (next) {
        nextAutoRef.current = time + life + IDLE_WAIT;
      } else if (!reduce && time >= nextAutoRef.current) {
        // 無操作のあいだは2行を交互に押す(クリップボードには書き込まない)
        next = { row: autoRowRef.current % ROWS.length, result: "success" };
        autoRowRef.current += 1;
        nextAutoRef.current = time + life + IDLE_GAP;
      }
      if (next) {
        runRef.current += 1;
        untilRef.current = time + life;
        setShown({ ...next, run: runRef.current });
        return;
      }
      if (untilRef.current >= 0 && time >= untilRef.current) {
        untilRef.current = -1;
        setShown(null);
      }
    });
  }, [reduce]);

  const vars = {
    "--cc-flash": `${params.flash}s`,
    "--cc-rise": `${-params.rise}px`,
    "--cc-hold": `${params.hold}s`,
    "--cc-life": `${params.hold + FADE}s`,
  } as CSSProperties;

  const live =
    shown === null
      ? ""
      : shown.result === "success"
        ? `${ROWS[shown.row].label} をコピーしました`
        : "コピーできませんでした。選択済みなので ⌘C / Ctrl+C でコピーしてください";

  return (
    <DemoStage hint="PC: 右のボタンをクリック / スマホ: タップ(押すたびに頭から再生。数秒触らなければ自走)">
      <div className={`${styles.wrap} ${reduce ? styles.reduce : ""}`} style={vars}>
        {ROWS.map((r, i) => {
          const active = shown?.row === i ? shown : null;
          const done = active !== null && swapIcon;
          return (
            <div key={r.label} className={styles.row}>
              <span className={styles.tag}>{r.label}</span>
              <code
                className={styles.code}
                ref={(el) => {
                  codeRefs.current[i] = el;
                }}
              >
                {r.text}
              </code>
              <button
                type="button"
                className={styles.btn}
                aria-label={`${r.label} をコピー`}
                onClick={() => copy(i)}
              >
                {active && params.flash > 0 && !reduce && (
                  <span
                    key={`flash-${active.run}`}
                    className={styles.flash}
                    data-result={active.result}
                    aria-hidden
                  />
                )}
                <span className={styles.icons} data-done={done} aria-hidden>
                  <svg className={styles.clip} viewBox="0 0 24 24">
                    <rect x="8" y="8" width="11" height="12" rx="2" />
                    <path d="M15 8V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h1" />
                  </svg>
                  <svg className={styles.check} viewBox="0 0 24 24" data-result={active?.result}>
                    {active?.result === "error" ? (
                      <path d="M7 7l10 10M17 7L7 17" />
                    ) : (
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    )}
                  </svg>
                </span>
                {active && showLabel && (
                  <span
                    key={`label-${active.run}`}
                    className={styles.label}
                    data-result={active.result}
                    aria-hidden
                  >
                    {active.result === "success" ? "コピーしました" : "コピーできませんでした"}
                  </span>
                )}
              </button>
            </div>
          );
        })}
        <p className={styles.live} aria-live="polite">
          {live}
        </p>
      </div>
    </DemoStage>
  );
}
