import { writeFileSync } from "node:fs"; import path from "node:path";
const REPO = process.argv[2];
const mod = await import(path.join(REPO, "content/index.ts"));
const paramsMd = (ps: any[]) => !ps?.length ? "" : ps.map((p) => p.options
  ? `- **${p.label}** — 選択: ${p.options.join(" / ")}（初期: ${p.options[p.default] ?? p.default}）  \n  ${p.desc}`
  : `- **${p.label}** — 範囲 ${p.min}〜${p.max} / 初期 ${p.default}  \n  ${p.desc}`).join("\n");
const quote = (t: string) => { const x = t.trim(); return /^[「『]/.test(x) && /[」』]$/.test(x) ? x : `「${x}」`; };
const vocabMd = (v: any[]) => (v || []).map((x) => `- **${x.term}** — ${x.desc}`).join("\n");
const out = (mod.entryList as any[]).map((e) => ({
  slug: e.slug,
  promptTemplate: "```\n" + e.promptTemplate.trim() + "\n```",
  params: paramsMd(e.params), vocab: vocabMd(e.vocab),
  ng: `**言い方:** ${quote(e.ngExample.say)}\n\n**なぜNG:** ${e.ngExample.why}`,
  ok: `**言い方:** ${quote(e.okExample.say)}\n\n**なぜOK:** ${e.okExample.why}`,
  promptRaw: e.promptTemplate.trim(), paramsJson: JSON.stringify(e.params),
}));
writeFileSync("/tmp/md-bulk-payload.json", JSON.stringify(out)); console.log(out.length);
