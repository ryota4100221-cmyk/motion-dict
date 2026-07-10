import type { Metadata } from "next";
import Link from "next/link";
import { categoryLabels, entryList } from "@/content";
import type { MotionEntry } from "@/lib/types";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "動きの伝え方辞典 — monaka design.",
  description:
    "実装したい動きをAIに正確に伝えるための対訳辞典。デモを触って数値を決めれば、そのまま渡せるプロンプトが手に入る。",
};

export default function MotionIndex() {
  const byCategory = new Map<MotionEntry["category"], MotionEntry[]>();
  for (const entry of entryList) {
    const list = byCategory.get(entry.category) ?? [];
    list.push(entry);
    byCategory.set(entry.category, list);
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.crumb}>
          <span className={styles.cat}>INDEX</span>
          <span>—</span>
          <span>MOTION DICTIONARY</span>
        </div>
        <h1 className={styles.title}>動きの伝え方辞典</h1>
        <p className={styles.lede}>
          「あの動き」に名前と数値を。デモを触ってパラメータを決めれば、
          そのままAIに渡せるプロンプトが手に入る、デザイナーのための対訳辞典。
        </p>
      </header>

      {[...byCategory.entries()].map(([category, list]) => (
        <section className={styles.section} key={category}>
          <div className={styles.secLabel}>
            {categoryLabels[category]}
            <span className={styles.count}>{list.length}</span>
          </div>
          <div className={styles.grid}>
            {list.map((entry, i) => (
              <Link
                className={styles.card}
                href={`/motion/${entry.slug}`}
                key={entry.slug}
              >
                <span className={styles.cardIndex}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={styles.cardName}>{entry.nameJa}</span>
                <span className={styles.cardEn}>{entry.nameEn}</span>
                <span className={styles.cardLede}>{entry.lede}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <footer className={styles.footer}>動きの伝え方辞典 — monaka design.</footer>
    </div>
  );
}
