import type { Metadata } from "next";
import { categoryLabels, entryList } from "@/content";
import { sentenceCaseEn } from "@/lib/format";
import type { MotionEntry } from "@/lib/types";
import Hero from "@/components/home/Hero";
import DictionaryList from "@/components/home/DictionaryList";
import type { DictionarySection } from "@/components/home/DictionaryList";
import TopBar from "@/components/TopBar";
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

  const marqueeNames = entryList.map((e) =>
    sentenceCaseEn(e.nameEn.split("/")[0])
  );

  // 辞典全体の通し番号(カテゴリをまたいで連番)
  let running = 0;
  const sections: DictionarySection[] = [...byCategory.entries()].map(
    ([category, list]) => ({
      category,
      label: categoryLabels[category],
      rows: list.map((entry) => {
        running += 1;
        return {
          slug: entry.slug,
          nameJa: entry.nameJa,
          nameEn: entry.nameEn,
          lede: entry.lede,
          category: entry.category,
          num: String(running).padStart(2, "0"),
        };
      }),
    })
  );

  return (
    <>
      <TopBar />
      <div className={styles.wrap}>
        <Hero
          total={entryList.length}
          categories={byCategory.size}
          names={marqueeNames}
        />

        <DictionaryList sections={sections} />

        <footer className={styles.footer}>
          <span>動きの伝え方辞典</span>
          <a
            href="https://monakadesign.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            monaka design.
          </a>
        </footer>
      </div>
    </>
  );
}
