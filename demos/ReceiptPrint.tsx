"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ReceiptPrint.module.css";

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

// 辞典の「伝票」3枚。行は等幅で右に値を寄せる
const RECEIPTS = [
  {
    title: "Folio",
    no: "No. 217",
    rows: [
      ["Receipt print", "1"],
      ["steps()", "30"],
      ["clip-path", "inset"],
    ],
    total: ["Lines", "30"],
  },
  {
    title: "Glossary",
    no: "No. 218",
    rows: [
      ["ジジジ", "1"],
      ["Zigzag edge", "7px"],
      ["Thermal feed", "1.5s"],
    ],
    total: ["Terms", "3"],
  },
  {
    title: "Colophon",
    no: "No. 219",
    rows: [
      ["Index", "A–Z"],
      ["Plate", "07"],
      ["Entry", "219"],
    ],
    total: ["Folios", "12"],
  },
];

const HOLD_MS = 2600; // 刷り終わってから自動で刷り直すまで

export default function ReceiptPrint({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [run, setRun] = useState(0);

  // 無操作でも刷り終わり→2.6s置いて刷り直す(録画で静止画にしないため)。ボタンで刷り直すと数え直す
  useEffect(() => {
    if (reduce) return;
    const total = params.duration * 1000 + params.stagger * (RECEIPTS.length - 1) + HOLD_MS;
    const t = setTimeout(() => setRun((r) => r + 1), total);
    return () => clearTimeout(t);
  }, [run, reduce, params.duration, params.stagger]);

  const vars = {
    "--rp-duration": `${params.duration}s`,
    "--rp-lines": params.lines,
    "--rp-teeth": `${params.teeth}px`,
  } as CSSProperties;

  return (
    <DemoStage hint="PC/スマホ: 表示で刷り出す／ボタンで刷り直す">
      <div className={styles.desk} style={vars} data-reduce={reduce ? "" : undefined}>
        <div className={styles.slot} aria-hidden />
        <div className={styles.row}>
          {RECEIPTS.map((r, i) => (
            <article
              // 接頭辞付きの key で、刷り直すたびにノードごと作り直してアニメーションを頭から流す
              key={`rc-${run}-${i}`}
              className={styles.paper}
              data-receipt=""
              style={{ "--rp-delay": `${i * params.stagger}ms` } as CSSProperties}
            >
              <header className={styles.head}>
                <span className={styles.mark} aria-hidden>
                  ✳
                </span>
                <span className={styles.title}>{r.title}</span>
                <span className={styles.meta}>{r.no}</span>
              </header>
              <span className={styles.rule} aria-hidden />
              <ul className={styles.items}>
                {r.rows.map(([k, v]) => (
                  <li key={k} className={styles.item}>
                    <span>{k}</span>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
              <span className={styles.double} aria-hidden />
              <p className={styles.total}>
                <span>{r.total[0]}</span>
                <span>{r.total[1]}</span>
              </p>
              <span className={styles.bars} aria-hidden />
              <p className={styles.bye}>Thank you for reading</p>
            </article>
          ))}
        </div>

        <button type="button" className={styles.again} onClick={() => setRun((r) => r + 1)}>
          Print again
        </button>
      </div>
    </DemoStage>
  );
}
