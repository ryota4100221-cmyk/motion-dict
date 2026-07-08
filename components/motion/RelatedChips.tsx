import Link from "next/link";
import { entries, plannedNames } from "@/content";
import styles from "./RelatedChips.module.css";

export default function RelatedChips({ slugs }: { slugs: string[] }) {
  return (
    <div className={styles.related}>
      {slugs.map((slug) => {
        const entry = entries[slug];
        const name = entry?.nameJa ?? plannedNames[slug] ?? slug;
        return entry ? (
          <Link key={slug} href={`/motion/${slug}`}>
            {name}
          </Link>
        ) : (
          // 未実装の項目はリファレンス同様プレースホルダリンク
          <a key={slug} href="#">
            {name}
          </a>
        );
      })}
    </div>
  );
}
