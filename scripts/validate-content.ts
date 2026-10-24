import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
// コンテンツデータの整合性チェック(npx tsx scripts/validate-content.ts)
// - promptTemplateの{{key}}がparamsに存在するか
// - optionsパラメータの min/max/step/default が規約通りか
// - related のslugが実在するか
// - 必須コピー(ng/ok/vocab)が揃っているか
import { entries, entryList } from "../content";

const errors: string[] = [];

for (const e of entryList) {
  const paramKeys = new Set(e.params.map((p) => p.key));

  for (const m of e.promptTemplate.matchAll(/\{\{(\w+)\}\}/g)) {
    if (!paramKeys.has(m[1]))
      errors.push(`${e.slug}: template token {{${m[1]}}} が params にない`);
  }
  for (const p of e.params) {
    if (!e.promptTemplate.includes(`{{${p.key}}}`))
      errors.push(`${e.slug}: param "${p.key}" が template で未使用`);
    if (p.options) {
      if (p.min !== 0 || p.max !== p.options.length - 1 || p.step !== 1)
        errors.push(`${e.slug}: options param "${p.key}" の min/max/step が規約外`);
      if (p.default < 0 || p.default > p.options.length - 1)
        errors.push(`${e.slug}: options param "${p.key}" の default が範囲外`);
    } else if (p.default < p.min || p.default > p.max) {
      errors.push(`${e.slug}: param "${p.key}" の default が min/max の範囲外`);
    }
  }
  for (const r of e.related) {
    if (!entries[r]) errors.push(`${e.slug}: related "${r}" が実在しない`);
  }
  if (e.related.includes(e.slug)) errors.push(`${e.slug}: related に自分自身`);
  if (e.vocab.length < 3) errors.push(`${e.slug}: vocab が ${e.vocab.length} 項目`);
  if (!e.ngExample.say || !e.ngExample.why || !e.okExample.say || !e.okExample.why)
    errors.push(`${e.slug}: NG/OK例が不完全`);
  if (!e.promptTemplate.includes("reduced-motion"))
    errors.push(`${e.slug}: template に reduced-motion 言及なし`);
}

// ── デモのソースの機械点検（2026-10-24 録画v2の撮り直しで見つかった本番の不具合2型）──
// ① public/ の素材を basePath 無しの絶対パス（"/demo/..."）で参照 → GH Pages(/motion-dict)で404。
//    画像の出ないデモが20ファイル以上あった。"/motion-dict/demo/..." と書く。
// ② @property で登録したカスタムプロパティは文書全体に効く（inherits:false 等が他のデモにも及ぶ）。
//    AiOrb の --angle 登録で barber-pole の縞と moire-drift の傾きが消えていた。名前はデモ固有の接頭辞で。
{
  const dir = path.join(process.cwd(), "demos");
  const files = readdirSync(dir).filter((f) => /\.(tsx|css)$/.test(f));
  const src = Object.fromEntries(files.map((f) => [f, readFileSync(path.join(dir, f), "utf8")]));
  const strip = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  for (const [f, t] of Object.entries(src)) {
    if (/["'`(]\/demo\//.test(strip(t))) errors.push(`demos/${f}: 素材を "/demo/..." で参照（basePath が付かず本番で404）→ "/motion-dict/demo/..."`);
  }
  const owners: Record<string, string> = {};
  for (const [f, t] of Object.entries(src)) for (const m of t.matchAll(/@property\s+(--[\w-]+)/g)) owners[m[1]] = f;
  for (const [prop, owner] of Object.entries(owners)) {
    const base = owner.replace(/\.module\.css$/, "");
    for (const [f, t] of Object.entries(src)) {
      if (f.startsWith(base + ".")) continue;
      if (new RegExp(prop.replace(/-/g, "\\-") + "(?![\\w-])").test(strip(t)))
        errors.push(`demos/${f}: ${prop} は demos/${owner} が @property で全体登録している名前（干渉する）`);
    }
  }
}

if (errors.length) {
  console.error(errors.map((e) => "✗ " + e).join("\n"));
  process.exit(1);
}
console.log(`✓ ${entryList.length} entries OK`);
