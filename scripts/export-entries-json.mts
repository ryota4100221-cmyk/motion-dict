// npx tsx scripts/export-entries-json.mts
// Framerの検索/ホバー再生コードコンポーネント用に、全項目の軽量JSONを public/entries.json へ。
import { writeFileSync } from "node:fs";
import path from "node:path";

const REPO = process.cwd();
const GH = "https://ryota4100221-cmyk.github.io/motion-dict";

type Entry = { slug: string; category: string; nameJa: string; nameEn: string; lede: string };

const mod = await import(path.join(REPO, "content/index.ts"));
const list: Entry[] = mod.entryList;

// カテゴリの表示順（既存サイト準拠）
const ORDER = ["hover", "scroll", "text", "transition", "media", "ui", "loading", "webgl"];
const rows = list
  .map((e) => ({
    slug: e.slug,
    category: e.category,
    nameJa: e.nameJa,
    nameEn: e.nameEn,
    lede: e.lede,
    poster: `${GH}/posters/${e.slug}.jpg`,
    video: `${GH}/videos/${e.slug}.mp4`,
  }))
  .sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category));

writeFileSync(path.join(REPO, "public/entries.json"), JSON.stringify(rows));
console.log(`wrote ${rows.length} entries -> public/entries.json`);
