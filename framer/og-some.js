// 指定した項目だけ Poster（＝og:image）を v2 ポスターに差し替える。/tmp/og-slugs.json の slug 一覧
const fs = require("fs");
const want = new Set(JSON.parse(fs.readFileSync("/tmp/og-slugs.json", "utf8")));
const GH = "https://ryota4100221-cmyk.github.io/motion-dict";
const c = (await framer.getCollections()).find((c) => c.id === "UQDoIUPil");
const F = Object.fromEntries((await c.getFields()).map((f) => [f.name, f]));
const batch = []; const ng = [];
for (const it of (await c.getItems()).filter((i) => want.has(i.slug))) {
  try {
    const img = await framer.uploadImage({ image: `${GH}/v2/posters/${it.slug}.jpg?v=${Date.now()}`, name: `${it.slug}-og` });
    batch.push({ id: it.id, fieldData: { [F["Poster"].id]: { type: "image", value: img.url } } });
  } catch (e) { ng.push(it.slug); }
}
for (let i = 0; i < batch.length; i += 25) await c.addItems(batch.slice(i, i + 25));
const pv = await framer.agent.publish({ action: "preview" });
const r = await framer.agent.publish({ action: "confirm_publish", confirmationHash: pv.confirmationHash });
console.log(JSON.stringify({ ok: batch.length, ng, publish: r.status }));
