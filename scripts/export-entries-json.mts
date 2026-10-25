// npx tsx scripts/export-entries-json.mts
// Framerの検索/ホバー再生コードコンポーネント用に、全項目の軽量JSONを public/entries.json へ。
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const REPO = process.cwd();
const GH = "https://ryota4100221-cmyk.github.io/motion-dict";

type Param = { key: string; label: string; min: number; max: number; step: number; default: number; desc: string; options?: string[] };
type TitleAct = { act: string; map?: Record<string, string | number> };
type Entry = { slug: string; category: string; nameJa: string; nameEn: string; lede: string; params: Param[]; promptTemplate: string; related: string[]; titleAct?: TitleAct; aliases?: string[] };

const mod = await import(path.join(REPO, "content/index.ts"));
const list: Entry[] = mod.entryList;
// 見出し・カード名の演技（titleAct）を、型の値の鍵まで埋めた形にする（lib/titleAct.ts）
const ta = await import(path.join(REPO, "lib/titleAct.ts"));
const SPEC = ta.readSpec();
const actOf = (e: Entry): TitleAct => ta.resolveTitleAct(e, mod.entries, SPEC);

// カテゴリの表示順（既存サイト準拠）
const ORDER = ["hover", "scroll", "text", "transition", "media", "ui", "loading", "webgl"];
const bySlugAll = new Map(list.map((e) => [e.slug, e]));
const bySlug = bySlugAll;
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
const metaOf = (slug: string) => { try { return JSON.parse(readFileSync(path.join(REPO, `public/v2/meta/${slug}.json`), "utf8")); } catch { return {}; } };
// 2026-10-26：一覧のコード（MotionDictionaryV2）が slug 別の定数で持っていた値を、項目ごとにここへ載せる。
//   titleAct＝カード名・実演面の演技／aliases＝検索の別名／defaults＝演技の値（params の初期値）
//   dim＝ポスターの明るさ補正（scripts/poster-derive.py が public/v2/derived/<slug>.json に作る）
//   lqip＝ポスターの下地は別ファイル public/v2/lqip.json（{slug: base64}）。下地は197件で gzip 約60KB あり、
//        一覧の表示を待たせる entries-v2.json（gzip 約40KB）に入れると3倍に膨らむ＝一覧は entries-v2.json の後に別に取る
// 一覧はこの値を優先し、無ければ今の定数に戻る（＝ここに無い項目も今と同じに出る）
const derivedOf = (slug: string): { lqip?: string; dim?: number; poster?: string } => { try { return JSON.parse(readFileSync(path.join(REPO, `public/v2/derived/${slug}.json`), "utf8")); } catch { return {}; } };
const posterHash = (slug: string) => { try { return createHash("sha1").update(readFileSync(path.join(REPO, `public/v2/posters/${slug}.jpg`))).digest("hex").slice(0, 12); } catch { return ""; } };
const stale: string[] = [];
const rowsV2 = rows.map((r) => {
  const e = bySlugAll.get(r.slug)!;
  const d = derivedOf(r.slug);
  if (!d.lqip) stale.push(`${r.slug}（下地なし）`);
  else if (d.poster && d.poster !== posterHash(r.slug)) stale.push(`${r.slug}（ポスターが新しい）`);
  return {
    ...r,
    posterAt: metaOf(r.slug).posterAt ?? 0,
    poster: `${GH}/v2/posters/${r.slug}.jpg`,
    video: `${GH}/v2/videos/${r.slug}.mp4`,
    titleAct: actOf(e),
    ...(e.aliases?.length ? { aliases: e.aliases } : {}),
    defaults: Object.fromEntries(e.params.map((p) => [p.key, p.default])),
    ...(typeof d.dim === "number" ? { dim: d.dim } : {}),
  };
});
writeFileSync(path.join(REPO, "public/entries-v2.json"), JSON.stringify(rowsV2));
writeFileSync(path.join(REPO, "public/v2/lqip.json"), JSON.stringify(Object.fromEntries(rows.map((r) => [r.slug, derivedOf(r.slug).lqip]).filter((x) => x[1]))));
if (stale.length) console.warn(`[warn] 下地（public/v2/derived）を作り直す項目 ${stale.length}件: ${stale.join(", ")}\n       → python3 scripts/poster-derive.py <slug>`);

// 詳細ページの「触って数値を決める」部品(Framer code component EntryLab)用に、
// 1項目ずつのJSONを public/entry/<slug>.json へ。スライダー定義・プロンプト雛形・
// 関連項目・一覧順の前後を持つ。前後は一覧と同じ並び(カテゴリ順)で端はループ。
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
      video: `${GH}/v2/videos/${e.slug}.mp4`,
      poster: `${GH}/v2/posters/${e.slug}.jpg`,
      posterAt: metaOf(e.slug).posterAt ?? 0,
      // 詳細の見出し（EntryTitle）が演じる型と値の対応（2026-10-26〜）
      titleAct: actOf(e),
      prev: pick(prev),
      next: pick(next),
    })
  );
});
console.log(`wrote ${rows.length} files -> public/entry/<slug>.json`);

// 録画の台本をライブデモ（/stage/<slug>/）からも読めるように公開する（値を変えた後に同じ操作を流す）
mkdirSync(path.join(REPO, "public/rec"), { recursive: true });
let nrec = 0;
for (const r of rows) {
  try { writeFileSync(path.join(REPO, `public/rec/${r.slug}.json`), readFileSync(path.join(REPO, `rec/${r.slug}.json`), "utf8")); nrec++; } catch {}
}
console.log(`copied ${nrec} rec specs -> public/rec/`);
