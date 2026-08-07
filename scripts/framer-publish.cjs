// @framer/agent exec -f で実行する。
// ①ヒーローの項目数テキストを現在値に更新 ②Framerサイトをpublish ③ready になるまで待つ。
//
// 🔴 なぜこれが要るか（2026-08-07 障害）:
//    CMSに addItems しただけでは公開サイトには一切出ない。Framerは publish して初めて反映される。
//    この工程が抜けていたため 2026-07-24〜08-07 の15項目が「CMSにはあるが世に出ていない」状態で
//    2週間放置された。毎朝のログは addItems 成功だけを見て「同期 OK」と言い続けていた。
//    → publish はパイプラインの必須工程。外すな。
//
// 入力: /tmp/framer-entry-count.txt … 現在の項目数（sync-to-framer.mts が書く）

const fs = require("fs");

// ── ① ヒーローの件数テキスト（ベタ書き）を更新 ──────────────────────
// ホーム一覧の件数は code component が entries.json から出すので自動だが、
// ヒーローの大きい数字だけは canvas のテキストノード。放っておくと古い数字が出続ける。
// z1RpKW5cz = ベース。残り2つは Tablet / Phone のブレークポイント版。
const COUNT_NODE_IDS = ["z1RpKW5cz", "vwtGgJ1P6z1RpKW5cz", "wJLcvxZcJz1RpKW5cz"];
let countResult = [];
try {
  const n = fs.readFileSync("/tmp/framer-entry-count.txt", "utf8").trim();
  if (/^\d+$/.test(n)) {
    for (const id of COUNT_NODE_IDS) {
      const node = await framer.getNode(id);
      if (!node) continue;
      if ((await node.getText()) === n) continue;
      await node.setText(n);
      countResult.push(`${id}→${n}`);
    }
  }
} catch (e) {
  // 件数表示が古いのは非致命。publish は続行する。
  countResult.push("count update skipped: " + e.message);
}

// ── ② publish ───────────────────────────────────────────────
if (typeof framer.isAllowedTo === "function" && !(await framer.isAllowedTo("publish"))) {
  throw new Error("publish が許可されていません（Framerの権限を確認）");
}
const res = await framer.publish();

// ── ③ ready まで待つ（optimizing のまま返るので待たないと配信前に次へ進む）──
let dep = res.deployment;
for (let i = 0; i < 60 && dep.status !== "ready" && dep.status !== "failed"; i++) {
  await new Promise((r) => setTimeout(r, 5000));
  dep = await framer.getDeployment(dep.id);
}
if (dep.status !== "ready") {
  throw new Error(`publish 失敗: status=${dep.status} stage=${dep.failureStage || "-"}`);
}

console.log(JSON.stringify({
  published: true,
  deploymentId: dep.id,
  status: dep.status,
  hostnames: res.hostnames.filter((h) => h.isPublished).map((h) => h.hostname),
  countNodes: countResult,
}, null, 2));
