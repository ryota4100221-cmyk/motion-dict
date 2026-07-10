"use client";

import { useState } from "react";
import Link from "next/link";
import type { MotionEntry } from "@/lib/types";
import { defaultValues } from "@/lib/types";
import { sentenceCaseEn } from "@/lib/format";
import { categoryLabels } from "@/content";
import { demoRegistry } from "@/demos";
import TopBar from "@/components/TopBar";
import ParamControls from "./ParamControls";
import PromptBox from "./PromptBox";
import NgOkDiff from "./NgOkDiff";
import VocabList from "./VocabList";
import RelatedChips from "./RelatedChips";
import styles from "./EntryView.module.css";

type Neighbor = { slug: string; nameJa: string };

export default function EntryView({
  entry,
  prev,
  next,
}: {
  entry: MotionEntry;
  prev: Neighbor;
  next: Neighbor;
}) {
  const [values, setValues] = useState(() => defaultValues(entry));
  const Demo = demoRegistry[entry.slug];

  return (
    <>
      <TopBar />
      <div className={styles.wrap}>

      <header className={styles.header}>
        <div className={styles.crumb}>
          <Link className={styles.crumbBack} href="/motion">
            ← Index
          </Link>
          <span className={styles.crumbSep}>/</span>
          <span className={styles.cat}>{categoryLabels[entry.category]}</span>
        </div>
        <h1 className={`${styles.title} palt`}>{entry.nameJa}</h1>
        <div className={styles.enName}>{sentenceCaseEn(entry.nameEn)}</div>
        <p className={styles.lede}>{entry.lede}</p>
      </header>

      <section className={styles.section}>
        <div className={styles.secLabel}>
          <span className={styles.secNum}>(01)</span>Demo — 触って確かめる
        </div>
        {Demo ? <Demo params={values} /> : null}
        <ParamControls
          params={entry.params}
          values={values}
          onChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
        />
      </section>

      <section className={styles.section}>
        <div className={styles.secLabel}>
          <span className={styles.secNum}>(02)</span>Prompt — そのまま渡せる指示文
        </div>
        <p className={styles.promptNote}>
          上のスライダーを動かすと、<strong>数値が連動して書き換わる</strong>
          。好みの動きを見つけたら、そのままコピーしてClaude Codeに渡す。
        </p>
        <PromptBox
          template={entry.promptTemplate}
          params={entry.params}
          values={values}
        />
      </section>

      <section className={styles.section}>
        <div className={styles.secLabel}>
          <span className={styles.secNum}>(03)</span>NG → OK — 伝え方の差分
        </div>
        <NgOkDiff ng={entry.ngExample} ok={entry.okExample} />
      </section>

      <section className={styles.section}>
        <div className={styles.secLabel}>
          <span className={styles.secNum}>(04)</span>Vocab — この動きを構成する語彙
        </div>
        <VocabList vocab={entry.vocab} />
      </section>

      <section className={styles.section}>
        <div className={styles.secLabel}>
          <span className={styles.secNum}>(05)</span>Related — 近い動き
        </div>
        <RelatedChips slugs={entry.related} />
      </section>

      <nav className={styles.pager}>
        <Link className={styles.pagerLink} href={`/motion/${prev.slug}`}>
          <span className={styles.pagerDir}>← Prev</span>
          <span className={`${styles.pagerName} palt`}>{prev.nameJa}</span>
        </Link>
        <Link
          className={`${styles.pagerLink} ${styles.pagerNext}`}
          href={`/motion/${next.slug}`}
        >
          <span className={styles.pagerDir}>Next →</span>
          <span className={`${styles.pagerName} palt`}>{next.nameJa}</span>
        </Link>
      </nav>

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
