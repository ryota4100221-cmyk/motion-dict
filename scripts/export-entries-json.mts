// npx tsx scripts/export-entries-json.mts
// Framerの検索/ホバー再生コードコンポーネント用に、全項目の軽量JSONを public/entries.json へ。
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const REPO = process.cwd();
const GH = "https://ryota4100221-cmyk.github.io/motion-dict";

type Param = { key: string; label: string; min: number; max: number; step: number; default: number; desc: string; options?: string[] };
type Entry = { slug: string; category: string; nameJa: string; nameEn: string; lede: string; params: Param[]; promptTemplate: string; related: string[] };

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

// v2（2026-10-24〜）：録画v2の動画・ポスター（public/v2/）を指す一覧。
// 旧 entries.json は現行本番の一覧が読んでいるので、そのまま残す。
const rowsV2 = rows.map((r) => ({
  ...r,
  poster: `${GH}/v2/posters/${r.slug}.jpg`,
  video: `${GH}/v2/videos/${r.slug}.mp4`,
}));
writeFileSync(path.join(REPO, "public/entries-v2.json"), JSON.stringify(rowsV2));

// 詳細ページの「触って数値を決める」部品(Framer code component EntryLab)用に、
// 1項目ずつのJSONを public/entry/<slug>.json へ。スライダー定義・プロンプト雛形・
// 関連項目・一覧順の前後を持つ。前後は一覧と同じ並び(カテゴリ順)で端はループ。
const bySlug = new Map(list.map((e) => [e.slug, e]));
mkdirSync(path.join(REPO, "public/entry"), { recursive: true });
rows.forEach((r, i) => {
  const e = bySlug.get(r.slug)!;
  const prev = rows[(i - 1 + rows.length) % rows.length];
  const next = rows[(i + 1) % rows.length];
  const pick = (x: (typeof rows)[number]) => ({ slug: x.slug, nameJa: x.nameJa, nameEn: x.nameEn, category: x.category, poster: `${GH}/v2/posters/${x.slug}.jpg` });
  const related = (e.related || []).map((s) => rows.find((x) => x.slug === s)).filter(Boolean).map((x) => pick(x!));
  writeFileSync(
    path.join(REPO, `public/entry/${r.slug}.json`),
    JSON.stringify({
      slug: e.slug,
      category: e.category,
      nameJa: e.nameJa,
      params: e.params,
      promptTemplate: e.promptTemplate.trim(),
      related,
      prev: pick(prev),
      next: pick(next),
    })
  );
});
console.log(`wrote ${rows.length} files -> public/entry/<slug>.json`);
