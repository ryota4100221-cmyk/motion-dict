import { writeFileSync } from "node:fs";
import path from "node:path";
const mod = await import(path.join(process.cwd(), "content/index.ts"));
type P = { key: string; label: string; min: number; max: number; step: number; default: number; desc: string; options?: string[] };
const q = (s: string) => { const t = s.trim(); return /^[「『]/.test(t) && /[」』]$/.test(t) ? t : `「${t}」`; };
const paramsMd = (ps: P[]) => !ps?.length ? "" : ps.map((p) => p.options
  ? `- **${p.label}** — 選択: ${p.options.join(" / ")}（初期: ${p.options[p.default] ?? p.default}）  \n  ${p.desc}`
  : `- **${p.label}** — 範囲 ${p.min}〜${p.max} / 初期 ${p.default}  \n  ${p.desc}`).join("\n");
const rows = mod.entryList.map((e: any) => ({
  slug: e.slug, nameJa: e.nameJa, nameEn: e.nameEn, category: e.category, lede: e.lede,
  promptRaw: e.promptTemplate.trim(),
  paramsJson: JSON.stringify(e.params),
  promptTemplate: "```\n" + e.promptTemplate.trim() + "\n```",
  params: paramsMd(e.params),
  vocab: (e.vocab || []).map((x: any) => `- **${x.term}** — ${x.desc}`).join("\n"),
  ng: `**言い方:** ${q(e.ngExample.say)}\n\n**なぜNG:** ${e.ngExample.why}`,
  ok: `**言い方:** ${q(e.okExample.say)}\n\n**なぜOK:** ${e.okExample.why}`,
}));
writeFileSync("/tmp/md-cms.json", JSON.stringify(rows));
console.log(rows.length, rows.filter((r: any) => r.ng.includes("「「")).length);
