"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./GaugeMeter.module.css";

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

const EASINGS = [
  "cubic-bezier(0.22, 1, 0.36, 1)",
  "cubic-bezier(0.34, 1.56, 0.64, 1)",
  "linear",
];

// 観察元(townhouse.dev の Pressure gauge)と同じ想定ユーザー数のプリセット
const PRESETS = [
  { users: 1e3, label: "1k" },
  { users: 1e4, label: "10k" },
  { users: 1e5, label: "100k" },
  { users: 1e6, label: "1M" },
  { users: 1e8, label: "100M" },
];
const MIN = 1e3;
const MAX = 1e8;
const FAILS_AT = 2e6; // 危険域の始まり(赤い目盛り)

// 目盛りの数字。log は1桁ごと、linear は等分
const LOG_TICKS = ["1k", "10k", "100k", "1M", "10M", "100M"];
const LIN_TICKS = ["0", "20M", "40M", "60M", "80M", "100M"];

const COUNT_MS = 800; // 数値のカウントアップ(観察元 useCountUp(…, 800))
const IDLE_WAIT = 2400; // この時間操作が無ければ自走に戻る
const IDLE_SCRIPT = [1e5, 1e6, 1e8, 1e4, 1e6, 1e3];
const IDLE_HOLD = 1500;

// SVGの座標系。12時を0degとして時計回りに角度を取る
const CX = 120;
const CY = 112;
const R = 84;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

function norm(v: number, log: boolean): number {
  const n = log
    ? (Math.log(Math.max(1, v)) - Math.log(MIN)) / (Math.log(MAX) - Math.log(MIN))
    : v / MAX;
  return Math.min(1, Math.max(0, n));
}

function pt(deg: number, r: number) {
  const a = (deg * Math.PI) / 180;
  return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) };
}

function arc(from: number, to: number, r: number): string {
  const a = pt(from, r);
  const b = pt(to, r);
  const large = to - from > 180 ? 1 : 0;
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

export default function GaugeMeter({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const sweep = params.sweep;
  const log = Math.round(params.scale) === 0;
  const easing = EASINGS[Math.round(params.easing)] ?? EASINGS[0];

  const [users, setUsers] = useState(1e5);
  const [shown, setShown] = useState(1e5);

  const touchedRef = useRef(false);
  // 最後に操作された時刻はrAFのtimeからだけ確定させる(performance.nowはlintで落ちる)
  const lastInputRef = useRef(-Infinity);
  const stepRef = useRef(0);
  const nextStepRef = useRef(0);

  // カウントアップ: 目標が変わったら次のフレームの time を起点に旧表示値から数え直す
  const countRef = useRef({ from: 1e5, to: 1e5, start: -1 });
  const shownRef = useRef(1e5);

  const pick = (v: number) => {
    touchedRef.current = true;
    setUsers(v);
  };

  useEffect(() => {
    const c = countRef.current;
    c.from = shownRef.current;
    c.to = users;
    c.start = -1;
  }, [users]);

  useEffect(() => {
    return addTick((time) => {
      // 数値のカウントアップ(800ms ease-out-cubic)
      const c = countRef.current;
      if (shownRef.current !== c.to) {
        if (reduce) {
          shownRef.current = c.to;
        } else {
          if (c.start < 0) c.start = time;
          const t = Math.min(1, (time - c.start) / COUNT_MS);
          shownRef.current = Math.round(c.from + (c.to - c.from) * easeOutCubic(t));
        }
        setShown(shownRef.current);
      }

      // 無操作のあいだはプリセットを順に指す。録画のループ動画にも針の振れが映る
      if (reduce) return;
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInputRef.current = time;
        nextStepRef.current = time + IDLE_WAIT;
        return;
      }
      if (time - lastInputRef.current < IDLE_WAIT) return;
      if (time < nextStepRef.current) return;
      setUsers(IDLE_SCRIPT[stepRef.current % IDLE_SCRIPT.length]);
      stepRef.current += 1;
      nextStepRef.current = time + IDLE_HOLD;
    });
  }, [reduce]);

  const start = -sweep / 2;
  const end = sweep / 2;
  const n = norm(users, log);
  const angle = start + sweep * n;
  const failing = users >= FAILS_AT;

  const failAngle = start + sweep * norm(FAILS_AT, log);
  const fa = pt(failAngle, R - 11);
  const fb = pt(failAngle, R + 11);

  const ticks = (log ? LOG_TICKS : LIN_TICKS).map((label, i, all) => {
    const deg = start + (sweep * i) / (all.length - 1);
    return { label, deg, a: pt(deg, R - 10), b: pt(deg, R - 4), t: pt(deg, R + 17) };
  });

  const vars = {
    "--gm-dur": `${reduce ? 0 : params.duration}s`,
    "--gm-ease": easing,
  } as CSSProperties;

  return (
    <DemoStage hint="PC: 下のボタンで想定ユーザー数を選ぶと針が振れる / スマホ: ボタンをタップ(数秒触らなければ自走)">
      <div
        className={`${styles.field} ${failing ? styles.failing : ""}`}
        style={vars}
      >
        <div
          className={styles.meter}
          role="meter"
          aria-label="同時ユーザー数"
          aria-valuemin={log ? MIN : 0}
          aria-valuemax={MAX}
          aria-valuenow={users}
          aria-valuetext={`${users.toLocaleString("en-US")} users${failing ? "(上限超過)" : ""}`}
        >
          <svg className={styles.svg} viewBox="0 0 240 200" aria-hidden>
            <path className={styles.track} d={arc(start, end, R)} />
            <path
              className={styles.arc}
              d={arc(start, end, R)}
              pathLength={100}
              style={{ strokeDashoffset: 100 * (1 - n) }}
            />
            {ticks.map((t) => (
              <g key={t.label}>
                <line className={styles.tick} x1={t.a.x} y1={t.a.y} x2={t.b.x} y2={t.b.y} />
                <text className={styles.tickLabel} x={t.t.x} y={t.t.y}>
                  {t.label}
                </text>
              </g>
            ))}
            <line className={styles.limit} x1={fa.x} y1={fa.y} x2={fb.x} y2={fb.y} />
            <g
              className={styles.needle}
              style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${CX}px ${CY}px` }}
            >
              <line x1={CX} y1={CY + 10} x2={CX} y2={CY - R + 14} />
            </g>
            <circle className={styles.hub} cx={CX} cy={CY} r={6} />
          </svg>
          <div className={styles.readout}>
            <span className={styles.value}>{shown.toLocaleString("en-US")}</span>
            <span className={styles.unit}>{failing ? "users — 上限超過" : "users"}</span>
          </div>
        </div>
        <div className={styles.presets}>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className={styles.preset}
              aria-pressed={users === p.users}
              onClick={() => pick(p.users)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </DemoStage>
  );
}
