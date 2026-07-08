import fs from "node:fs";
import path from "node:path";

// 毎朝のアニメデモルーティンが public/daily/ に積んでいくアーカイブ。
// ファイル名 `YYYY-MM-DD-[site-slug]-demo.html` が契約。
// manifest.json はファイル名キーの任意メタ(title/source/note)で、無くても動く。
export type DailyDemo = {
  file: string; // "2026-07-08-depo-luxe-demo.html"
  date: string; // "2026-07-08"
  slug: string; // "depo-luxe"
  title?: string;
  source?: string; // 元サイトURL
  note?: string;
};

type ManifestMeta = Pick<DailyDemo, "title" | "source" | "note">;

const DAILY_DIR = path.join(process.cwd(), "public", "daily");
const FILE_RE = /^(\d{4}-\d{2}-\d{2})-(.+?)(?:-demo)?\.html$/;

export function getDailyDemos(): DailyDemo[] {
  if (!fs.existsSync(DAILY_DIR)) return [];

  let manifest: Record<string, ManifestMeta> = {};
  try {
    manifest = JSON.parse(
      fs.readFileSync(path.join(DAILY_DIR, "manifest.json"), "utf8")
    );
  } catch {
    // manifestは任意。壊れていてもアーカイブ自体は落とさない
  }

  return fs
    .readdirSync(DAILY_DIR)
    .map((f) => ({ f, m: f.match(FILE_RE) }))
    .filter((x): x is { f: string; m: RegExpMatchArray } => x.m !== null)
    .map(({ f, m }) => ({
      file: f,
      date: m[1],
      slug: m[2],
      ...manifest[f],
    }))
    .sort((a, b) => (a.file < b.file ? 1 : -1)); // 新しい順
}
