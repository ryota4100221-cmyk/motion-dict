import type { Metadata } from "next";
import Link from "next/link";
import { getDailyDemos } from "@/lib/daily";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: { absolute: "DAILY — 動きの伝え方辞典" },
  description:
    "毎朝7:30、Awwwardsノミネートサイトのアニメーションを単一HTMLで再現する自動アーカイブ。1日1本、増え続ける。",
};

function formatDate(date: string): string {
  const [y, m, d] = date.split("-");
  return `${y}.${m}.${d}`;
}

export default function DailyPage() {
  const demos = getDailyDemos();

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.crumb}>
          <span className={styles.cat}>DAILY</span>
          <span>—</span>
          <Link href="/motion" className={styles.crumbLink}>
            動きの伝え方辞典
          </Link>
        </div>
        <h1 className={styles.title}>毎朝の再現デモ</h1>
        <p className={styles.lede}>
          毎朝7:30、Awwwardsノミネートサイトからひとつ選び、そのアニメーションを
          単一HTMLで再現している自動アーカイブ。1日1本、ここに増え続ける。
        </p>
      </header>

      <section className={styles.section}>
        <div className={styles.secLabel}>
          ARCHIVE
          <span className={styles.count}>{demos.length}</span>
        </div>
        {demos.length === 0 ? (
          <p className={styles.empty}>
            まもなく最初のデモが届く。毎朝7:30に自動で増えていく。
          </p>
        ) : (
          <ul className={styles.list}>
            {demos.map((demo) => (
              <li key={demo.file}>
                <a
                  className={styles.row}
                  href={`/daily/${demo.file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className={styles.date}>{formatDate(demo.date)}</span>
                  <span className={styles.name}>
                    {demo.title ?? demo.slug.replace(/-/g, " ")}
                  </span>
                  {demo.note ? (
                    <span className={styles.note}>{demo.note}</span>
                  ) : null}
                  <span className={styles.arrow}>↗</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className={styles.footer}>動きの伝え方辞典 — monaka design.</footer>
    </div>
  );
}
