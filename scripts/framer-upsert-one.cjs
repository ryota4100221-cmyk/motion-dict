// @framer/agent exec -f で実行する。/tmp/framer-sync-payload.json を読み、
// CMS「Entries」に1項目をupsert（テキスト全フィールド＋GH Pages動画をuploadFile→Demo Video）。
// payload: { slug, nameJa, nameEn, category, lede, liveUrl, promptTemplate, params, vocab, ng, ok, videoUrl }
const fs = require("fs");
const p = JSON.parse(fs.readFileSync("/tmp/framer-sync-payload.json", "utf8"));

const col = (await framer.getCollections()).find((c) => c.id === "UQDoIUPil");
if (!col) throw new Error("Entries collection UQDoIUPil not found");
const fields = await col.getFields();
const F = {}; for (const f of fields) F[f.name] = f;
const caseByName = {}; for (const c of F["Category"].cases) caseByName[c.name] = c.id;

// 動画をFramerに取り込み（GH Pages URL→framerusercontent）
let videoAsset = null;
if (p.videoUrl) videoAsset = await framer.uploadFile({ name: p.slug + ".mp4", file: p.videoUrl });

const ft = (v) => ({ type: "formattedText", value: v || "", contentType: "markdown" });
const existing = (await col.getItems()).find((i) => i.slug === p.slug);
const fd = {
  [F["Name JA"].id]: { type: "string", value: p.nameJa },
  [F["Name EN"].id]: { type: "string", value: p.nameEn },
  [F["Category"].id]: { type: "enum", value: caseByName[p.category] },
  [F["Lede"].id]: { type: "string", value: p.lede },
  [F["Live Demo URL"].id]: { type: "link", value: p.liveUrl },
  [F["Prompt Template"].id]: ft(p.promptTemplate),
  [F["Params"].id]: ft(p.params),
  [F["Vocab"].id]: ft(p.vocab),
  [F["NG Example"].id]: ft(p.ng),
  [F["OK Example"].id]: ft(p.ok),
};
if (videoAsset) fd[F["Demo Video"].id] = { type: "file", value: videoAsset.url };

const item = { slug: p.slug, fieldData: fd };
if (existing) item.id = existing.id;
await col.addItems([item]);

const after = (await col.getItems()).find((i) => i.slug === p.slug);
console.log(JSON.stringify({
  slug: p.slug,
  action: existing ? "updated" : "created",
  hasVideo: !!(after.fieldData[F["Demo Video"].id]),
}, null, 2));
