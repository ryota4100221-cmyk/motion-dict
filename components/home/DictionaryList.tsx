"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { sentenceCaseEn } from "@/lib/format";
import styles from "@/app/motion/page.module.css";

export type DictionaryRow = {
  slug: string;
  nameJa: string;
  nameEn: string;
  lede: string;
  category: string;
  num: string; // 辞典全体の通し番号(ゼロ埋め済み)
};

export type DictionarySection = {
  category: string;
  label: string;
  rows: DictionaryRow[];
};

// カタカナ→ひらがな折りたたみ(かな違いでも引けるように)
function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0x60)
    );
}

export default function DictionaryList({
  sections,
}: {
  sections: DictionarySection[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return sections;
    return sections
      .map((sec) => ({
        ...sec,
        rows: sec.rows.filter((r) =>
          fold(`${r.nameJa} ${r.nameEn} ${r.slug} ${r.lede}`).includes(q)
        ),
      }))
      .filter((sec) => sec.rows.length > 0);
  }, [sections, query]);

  const hitCount = filtered.reduce((n, s) => n + s.rows.length, 0);
  const total = sections.reduce((n, s) => n + s.rows.length, 0);

  return (
    <main className={styles.list}>
      <div className={styles.search}>
        <span className={styles.searchMark} aria-hidden>
          ⌕
        </span>
        <input
          className={styles.searchInput}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="動きを検索 — 名前 / 英名 / 説明"
          aria-label="辞典を検索"
        />
        <span className={styles.searchCount}>
          ({String(hitCount).padStart(2, "0")}/{String(total).padStart(2, "0")})
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className={styles.noHit}>
          該当する動きがない。別の言葉で試すか、
          <a
            href="https://monakadesign.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            monaka design.
          </a>
          に直接聞いてほしい。
        </p>
      ) : (
        filtered.map((sec) => (
          <section className={styles.section} key={sec.category}>
            <h2 className={styles.secHead}>
              <span className={styles.secName}>{sec.label}</span>
              <span className={styles.secCount}>
                ({String(sec.rows.length).padStart(2, "0")})
              </span>
            </h2>
            <div className={styles.rows}>
              {sec.rows.map((r) => (
                <Link
                  className={styles.row}
                  href={`/motion/${r.slug}`}
                  key={r.slug}
                >
                  <span className={styles.rowIndex}>({r.num})</span>
                  <span className={styles.rowNames}>
                    <span className={`${styles.rowName} palt`}>{r.nameJa}</span>
                    <span className={styles.rowEn}>
                      {sentenceCaseEn(r.nameEn)}
                    </span>
                  </span>
                  <span className={styles.rowLede}>{r.lede}</span>
                  <span className={styles.rowArrow} aria-hidden>
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
