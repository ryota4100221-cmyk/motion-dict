// 使い方: npx tsx scripts/framer-bulk-payload.mts $PWD → /tmp/md-bulk-payload.json。echo {} > /tmp/md-bulk-posters.json の後、@framer/agent exec -f scripts/framer-bulk-update.cjs
// 全項目のプロンプト・語彙・NG/OK・Params を content と同じ値に揃える（値が違う項目だけ書く）
const fs = require("fs");
const rows = JSON.parse(fs.readFileSync("/tmp/md-bulk-payload.json", "utf8"));
const posters = JSON.parse(fs.readFileSync("/tmp/md-bulk-posters.json", "utf8")); // {slug:url}
const col = (await framer.getCollections()).find((c) => c.name === "Entries");
const F = {}; for (const f of await col.getFields()) F[f.name] = f;
const items = await col.getItems(); const bySlug = Object.fromEntries(items.map((i) => [i.slug, i]));
const ft = (v) => ({ type: "formattedText", value: v || "", contentType: "markdown" });
const cur = (it, name) => { const v = it.fieldData[F[name].id]; return v ? v.value : undefined; };
let changed = 0, missing = [];
const batch = [];
for (const r of rows) {
  const it = bySlug[r.slug]; if (!it) { missing.push(r.slug); continue; }
  const fd = {};
  if (cur(it, "Prompt Raw") !== r.promptRaw) fd[F["Prompt Raw"].id] = { type: "string", value: r.promptRaw };
  if (cur(it, "Params JSON") !== r.paramsJson) fd[F["Params JSON"].id] = { type: "string", value: r.paramsJson };
  // formattedText はHTMLで返るので比較せず、Raw が変わった項目は全部書く
  if (Object.keys(fd).length || r.forceText) {
    Object.assign(fd, {
      [F["Prompt Template"].id]: ft(r.promptTemplate), [F["Params"].id]: ft(r.params),
      [F["Vocab"].id]: ft(r.vocab), [F["NG Example"].id]: ft(r.ng), [F["OK Example"].id]: ft(r.ok),
    });
  }
  if (posters[r.slug]) { const a = await framer.uploadImage({ image: posters[r.slug], name: r.slug + "-poster" }); fd[F["Poster"].id] = { type: "image", value: a.url }; }
  if (Object.keys(fd).length) { batch.push({ id: it.id, slug: it.slug, fieldData: fd }); changed++; }
}
for (let i = 0; i < batch.length; i += 25) await col.addItems(batch.slice(i, i + 25));
// 読み戻して検証
const after = Object.fromEntries((await col.getItems()).map((i) => [i.slug, i]));
const bad = rows.filter((r) => after[r.slug] && cur(after[r.slug], "Prompt Raw") !== r.promptRaw).map((r) => r.slug);
const noTrigger = rows.filter((r) => after[r.slug] && !/^- きっかけ: /m.test(cur(after[r.slug], "Prompt Raw") || "")).map((r) => r.slug);
console.log(JSON.stringify({ project: (await framer.getProjectInfo()).name, items: items.length, changed, missing, mismatchAfter: bad.length, noTriggerAfter: noTrigger.length }));
