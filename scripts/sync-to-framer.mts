// 使い方: npx tsx scripts/sync-to-framer.mts <slug>
// 毎朝ルーティンが「1項目をリポに追加→main push」した後に呼ぶ。
// その項目を GH Pages で録画し、動画をpush→GH Pages配信→Framer CMS「Entries」にupsert
// →**Framerサイトをpublish**→**公開URLが200になったことを実測**して初めて成功とする。
//
// 🔴 publish と公開URL検証は必須工程（2026-08-07 障害の再発防止）。
//    CMSに入れただけでは公開サイトに出ない。かつ「addItems 成功」を成功判定にすると、
//    公開されていないのに毎朝「同期 OK」が出続ける（実際に2週間・15項目が埋まった）。
//    成功の定義は「motion-dict.framer.website/entries/<slug> が 200 を返すこと」。
//
// 依存: tsx / ffmpeg / Playwright(環境変数 MONACA_PW_PATH で場所指定・既定 ~/projects/mona-cafe/node_modules) / @framer/agent(認証済み)
import { execSync, execFileSync } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const slug = process.argv[2];
if (!slug) { console.error("usage: sync-to-framer.mts <slug>"); process.exit(2); }

const REPO = process.cwd();
const PROJECT_ID = "PnTJSNS3Yi1gInF6kBFb";
const GH = "https://ryota4100221-cmyk.github.io/motion-dict";
const SITE = "https://motion-dict.framer.website";
const PW_PATH = process.env.MONACA_PW_PATH || path.join(os.homedir(), "projects/mona-cafe/node_modules");

type DemoParam = { key: string; label: string; min: number; max: number; step: number; default: number; desc: string; options?: string[] };
type Entry = { slug: string; category: string; nameJa: string; nameEn: string; lede: string; params: DemoParam[]; promptTemplate: string; ngExample: { say: string; why: string }; okExample: { say: string; why: string }; vocab: { term: string; desc: string }[] };

const paramsMd = (ps: DemoParam[]) => !ps?.length ? "" : ps.map((p) => p.options
  ? `- **${p.label}** — 選択: ${p.options.join(" / ")}（初期: ${p.options[p.default] ?? p.default}）  \n  ${p.desc}`
  : `- **${p.label}** — 範囲 ${p.min}〜${p.max} / 初期 ${p.default}  \n  ${p.desc}`).join("\n");
const vocabMd = (v: Entry["vocab"]) => (v || []).map((x) => `- **${x.term}** — ${x.desc}`).join("\n");

async function waitUrl(url: string, label: string, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url, { method: "HEAD" }); if (r.ok) { console.log(`[ok] ${label} live`); return; } } catch {}
    await new Promise((r) => setTimeout(r, 15000));
  }
  throw new Error(`timeout waiting ${label}: ${url}`);
}

const run = (cmd: string, opts: any = {}) => execSync(cmd, { cwd: REPO, stdio: "inherit", ...opts });

(async () => {
  const mod = await import(path.join(REPO, "content/index.ts"));
  const e: Entry = (mod.entries as Record<string, Entry>)[slug];
  if (!e) throw new Error(`entry not found in content: ${slug}`);

  // 1) デモがGH Pagesに載るのを待つ（skillのpush→Pagesデプロイ）
  await waitUrl(`${GH}/demo/${slug}/`, `demo/${slug}`);

  // 2) 録画 → public/videos/<slug>.mp4 ＋ public/posters/<slug>.jpg（record-oneが両方生成）
  console.log(`[rec] recording ${slug} (${e.category})`);
  execFileSync("node", [path.join(REPO, "scripts/record-one.cjs"), slug, e.category],
    { cwd: REPO, stdio: "inherit", env: { ...process.env, NODE_PATH: PW_PATH } });

  // 2.5) ホーム一覧(コードコンポーネントMotionDictionary)が読む entries.json を再生成
  //      ＝これを忘れると新項目が一覧に出てこない。
  run(`npx --yes tsx ${path.join(REPO, "scripts/export-entries-json.mts")}`);

  // 3) 動画・ポスター・entries.json をpush
  run(`git add public/videos/${slug}.mp4 public/posters/${slug}.jpg public/entries.json`);
  try { run(`git commit -q -m "video: ${slug} ループ動画＋ポスター＋一覧（毎朝同期）"`); run(`git push origin main`); }
  catch { console.log("[git] nothing to commit (unchanged) — skip push"); }

  // 4) 動画・ポスターがGH Pagesに載るのを待つ（uploadFile/uploadImageがGHから取得するため）
  await waitUrl(`${GH}/videos/${slug}.mp4`, `videos/${slug}.mp4`);
  await waitUrl(`${GH}/posters/${slug}.jpg`, `posters/${slug}.jpg`);

  // 5) Framer CMS へ upsert
  const payload = {
    slug, nameJa: e.nameJa, nameEn: e.nameEn, category: e.category, lede: e.lede,
    liveUrl: `${GH}/demo/${slug}`,
    promptTemplate: "```\n" + e.promptTemplate.trim() + "\n```",
    params: paramsMd(e.params), vocab: vocabMd(e.vocab),
    ng: `**言い方:** 「${e.ngExample.say}」\n\n**なぜNG:** ${e.ngExample.why}`,
    ok: `**言い方:** 「${e.okExample.say}」\n\n**なぜOK:** ${e.okExample.why}`,
    videoUrl: `${GH}/videos/${slug}.mp4`,
    posterUrl: `${GH}/posters/${slug}.jpg`,
  };
  writeFileSync("/tmp/framer-sync-payload.json", JSON.stringify(payload));

  const sid = execSync(`npx --yes @framer/agent@latest session new ${PROJECT_ID}`, { cwd: REPO }).toString().trim().split("\n").pop();
  console.log(`[framer] session ${sid}`);
  const out = execSync(`npx --yes @framer/agent@latest exec -s ${sid} -f ${path.join(REPO, "scripts/framer-upsert-one.cjs")}`, { cwd: REPO }).toString();
  console.log(out);

  // 6) Framerサイトをpublish（＝これをやらないと公開サイトに一切出ない）
  //    ヒーローのベタ書き件数も同時に更新するので、現在の項目数を渡す。
  const total = JSON.parse(readFileSync(path.join(REPO, "public/entries.json"), "utf8")).length;
  writeFileSync("/tmp/framer-entry-count.txt", String(total));
  console.log(`[framer] publishing (${total} entries)`);
  const sid2 = execSync(`npx --yes @framer/agent@latest session new ${PROJECT_ID}`, { cwd: REPO }).toString().trim().split("\n").pop();
  console.log(execSync(`npx --yes @framer/agent@latest exec -s ${sid2} -f ${path.join(REPO, "scripts/framer-publish.cjs")}`, { cwd: REPO }).toString());

  // 7) 🔴 公開URLが実際に200を返すまで確認する。ここを通って初めて「同期成功」。
  //    自己申告（addItems成功・publish成功）は証拠にしない。
  await waitUrl(`${SITE}/entries/${slug}`, `公開ページ ${slug}`, 20);

  console.log(`[done] synced & published ${slug} → ${SITE}/entries/${slug}`);
})().catch((err) => { console.error("SYNC FAIL:", err); process.exit(1); });
