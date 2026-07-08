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

if (errors.length) {
  console.error(errors.map((e) => "✗ " + e).join("\n"));
  process.exit(1);
}
console.log(`✓ ${entryList.length} entries OK`);
