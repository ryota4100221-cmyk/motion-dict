"use client";

import { useState } from "react";
import type { MotionEntry } from "@/lib/types";
import { defaultValues } from "@/lib/types";
import { categoryLabels } from "@/content";
import { demoRegistry } from "@/demos";
import ParamControls from "./ParamControls";
import PromptBox from "./PromptBox";
import NgOkDiff from "./NgOkDiff";
import VocabList from "./VocabList";
import RelatedChips from "./RelatedChips";
import styles from "./EntryView.module.css";

export default function EntryView({ entry }: { entry: MotionEntry }) {
  const [values, setValues] = useState(() => defaultValues(entry));
  const Demo = demoRegistry[entry.slug];

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.crumb}>
          <span className={styles.cat}>{categoryLabels[entry.category]}</span>
          <span>—</span>
          <span>動きの伝え方辞典</span>
        </div>
        <h1 className={styles.title}>{entry.nameJa}</h1>
        <div className={styles.enName}>{entry.nameEn}</div>
        <p className={styles.lede}>{entry.lede}</p>
      </header>

      <section className={styles.section}>
        <div className={styles.secLabel}>DEMO — 触って確かめる</div>
        {Demo ? <Demo params={values} /> : null}
        <ParamControls
          params={entry.params}
          values={values}
          onChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
        />
      </section>

      <section className={styles.section}>
        <div className={styles.secLabel}>PROMPT — そのまま渡せる指示文</div>
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
        <div className={styles.secLabel}>NG → OK — 伝え方の差分</div>
        <NgOkDiff ng={entry.ngExample} ok={entry.okExample} />
      </section>

      <section className={styles.section}>
        <div className={styles.secLabel}>VOCAB — この動きを構成する語彙</div>
        <VocabList vocab={entry.vocab} />
      </section>

      <section className={styles.section}>
        <div className={styles.secLabel}>RELATED — 近い動き</div>
        <RelatedChips slugs={entry.related} />
      </section>

      <footer className={styles.footer}>動きの伝え方辞典 — monaka design.</footer>
    </div>
  );
}
