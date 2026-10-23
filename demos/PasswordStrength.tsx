"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./PasswordStrength.module.css";

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

type Level = "blank" | "short" | "bad" | "good" | "strong";

// 観察元(Gravity Forms)の段階ごとの長さ 22/37/46/65px(トラック65px)を比率にしたもの
const LEVELS: Record<Level, { ratio: number; step: number; text: string }> = {
  blank: { ratio: 0, step: 0, text: "" },
  short: { ratio: 22 / 65, step: 1, text: "短すぎる" },
  bad: { ratio: 37 / 65, step: 2, text: "弱い" },
  good: { ratio: 46 / 65, step: 3, text: "ふつう" },
  strong: { ratio: 1, step: 4, text: "強い" },
};

// デモ用の簡易採点(実案件では zxcvbn 等の推定ライブラリで 0〜4 を出す)
function judge(pw: string): Level {
  if (pw.length === 0) return "blank";
  const kinds = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(pw)).length;
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (kinds >= 2) score += 1;
  if (kinds >= 3 && pw.length >= 8) score += 1;
  if (score <= 1) return "short";
  if (score === 2) return "bad";
  if (score === 3) return "good";
  return "strong";
}

// 無操作のあいだはこれを1文字ずつ打って、消して、を繰り返す(短すぎる→弱い→ふつう→強い の順に上がる)
const AUTO_TEXT = "Sunfl0wer#24x";
const TYPE_MS = [150, 110, 170, 130, 120, 190, 140, 110, 160, 210, 130, 150, 120];
const HOLD_MS = 1500;
const ERASE_MS = 45;
const PAUSE_MS = 700;
const IDLE_WAIT = 3500; // 触られてからこの時間、欄が空でフォーカスも無ければ自走に戻る

type Auto = { phase: "type" | "hold" | "erase" | "pause"; at: number };

export default function PasswordStrength({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const segments = Math.round(params.style) === 1;

  const [value, setValue] = useState("");
  const [level, setLevel] = useState<Level>("blank");
  const [show, setShow] = useState(false);

  const valueRef = useRef("");
  const paramsRef = useRef(params);
  // 時刻は rAF の time からだけ確定させる(performance.now は lint で落ちる)
  const typedRef = useRef(false); // 入力があった印。次のフレームで判定時刻を決める
  const evalAtRef = useRef(-1);
  const touchedRef = useRef(false); // ユーザーが触った印。次のフレームで lastInput を決める
  const lastInputRef = useRef(-1);
  const focusedRef = useRef(false);
  const autoRef = useRef<Auto | null>(null);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const write = (next: string) => {
    valueRef.current = next;
    setValue(next);
    typedRef.current = true;
  };

  useEffect(() => {
    return addTick((time) => {
      // 入力(自走の打鍵も含む): 最後の入力から debounce 後に判定
      if (typedRef.current) {
        typedRef.current = false;
        evalAtRef.current = time + paramsRef.current.debounce;
      }
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInputRef.current = time;
      }
      if (evalAtRef.current >= 0 && time >= evalAtRef.current) {
        evalAtRef.current = -1;
        setLevel(judge(valueRef.current));
      }

      if (reduce) return;
      const auto = autoRef.current;
      if (!auto) {
        const idle =
          !focusedRef.current &&
          valueRef.current.length === 0 &&
          (lastInputRef.current < 0 || time - lastInputRef.current >= IDLE_WAIT);
        if (idle) autoRef.current = { phase: "pause", at: time + PAUSE_MS };
        return;
      }
      if (time < auto.at) return;

      const cur = valueRef.current;
      if (auto.phase === "pause") {
        auto.phase = "type";
        auto.at = time;
      } else if (auto.phase === "type") {
        write(AUTO_TEXT.slice(0, cur.length + 1));
        const done = cur.length + 1 >= AUTO_TEXT.length;
        auto.phase = done ? "hold" : "type";
        auto.at = time + (done ? HOLD_MS : TYPE_MS[cur.length % TYPE_MS.length]);
      } else if (auto.phase === "hold") {
        auto.phase = "erase";
        auto.at = time;
      } else {
        write(cur.slice(0, -1));
        const done = cur.length <= 1;
        auto.phase = done ? "pause" : "erase";
        auto.at = time + (done ? PAUSE_MS : ERASE_MS);
      }
    });
  }, [reduce]);

  // ユーザーが触ったら自走を止めて、欄を本人の入力に明け渡す
  const takeOver = () => {
    if (autoRef.current) {
      autoRef.current = null;
      write("");
    }
  };

  const onInput = (next: string) => {
    takeOver();
    write(next);
    touchedRef.current = true;
  };

  const info = LEVELS[level];
  const vars = {
    "--ps-dur": reduce ? "0s" : `${params.duration}s`,
    "--ps-ratio": info.ratio,
  } as CSSProperties;

  return (
    <DemoStage hint="PC / スマホ: 入力欄にパスワードを打つ(数秒触らなければ自動で打って消す)">
      <div className={styles.wrap} style={vars} data-level={level}>
        <label className={styles.caption} htmlFor="password-strength-demo">
          Password
        </label>
        <input
          id="password-strength-demo"
          className={styles.input}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onInput(e.target.value)}
          onFocus={() => {
            focusedRef.current = true;
            touchedRef.current = true;
            takeOver();
          }}
          onBlur={() => {
            // 空のまま離れたら、そこから IDLE_WAIT 後に自走へ戻す
            focusedRef.current = false;
            touchedRef.current = true;
          }}
          aria-describedby="password-strength-demo-level"
          autoComplete="new-password"
          spellCheck={false}
        />
        <div className={styles.meterRow}>
          {segments ? (
            <div className={styles.segments} aria-hidden>
              {[1, 2, 3, 4].map((n) => (
                <span key={n} className={styles.cell} data-on={n <= info.step} />
              ))}
            </div>
          ) : (
            <div className={styles.track} aria-hidden>
              <span className={styles.fill} />
            </div>
          )}
          <p id="password-strength-demo-level" className={styles.levelText} aria-live="polite">
            {info.text}
          </p>
        </div>
        <label className={styles.toggle}>
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
          パスワードを表示
        </label>
      </div>
    </DemoStage>
  );
}
