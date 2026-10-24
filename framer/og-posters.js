// CMS「Poster」に録画v2のポスター（見せ場のフレーム）を入れ、詳細ページの共有画像（og:image）に結ぶ。
// 旧 Poster は1フレーム目（暗い箱）で、og:image は全項目同じ既定画像だった。
const GH = "https://ryota4100221-cmyk.github.io/motion-dict";
const c = (await framer.getCollections()).find((c) => c.id === "UQDoIUPil");
const F = Object.fromEntries((await c.getFields()).map((f) => [f.name, f]));
const items = await c.getItems();
let ok = 0, ng = [];
const batch = [];
for (const it of items) {
  try {
    const img = await framer.uploadImage({ image: `${GH}/v2/posters/${it.slug}.jpg`, name: `${it.slug}-og` });
    batch.push({ id: it.id, fieldData: { [F["Poster"].id]: { type: "image", value: img.url } } });
    ok++;
  } catch (e) { ng.push(it.slug); }
  if (batch.length >= 25) { await c.addItems(batch.splice(0)); }
}
if (batch.length) await c.addItems(batch);
const r = await framer.agent.applyChanges(`SET tjAMfYTdv metadata.socialImage="var(--variable-${F["Poster"].id})";`, { pagePath: "/entries/:Entries" });
console.log(JSON.stringify({ ok, ng, meta: r.message }));
