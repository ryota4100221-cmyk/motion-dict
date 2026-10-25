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
const quote = (t: string) => { const x = t.trim(); return /^[「『]/.test(x) && /[」』]$/.test(x) ? x : `「${x}」`; };
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

  // 2.2) 録画v2（2026-10-24〜）：ステージ全面・60fps・台本 rec/<slug>.json（無ければヒント文から推定）。
  //      新しい一覧/詳細（entries-v2.json・public/v2/）が使う。旧録画(上)は現行本番の一覧のために並行で残す。
  //      v2 の失敗は非致命（旧の公開は止めない）。
  await waitUrl(`${GH}/stage/${slug}/`, `stage/${slug}`).catch(() => {});
  let v2ok = false;
  try {
    execFileSync("node", [path.join(REPO, "scripts/record-v2.cjs"), slug, "--base", GH],
      { cwd: REPO, stdio: "inherit", env: { ...process.env, NODE_PATH: PW_PATH } });
    // 見せ場から始まるようにループを回し、ポスターをその1コマ目で作り直す（一覧の切り替えで巻き戻って見えないように）
    execFileSync("python3", [path.join(REPO, "scripts/rotate-loops.py"), slug], { cwd: REPO, stdio: "inherit" });
    v2ok = true;
  } catch (err) { console.error("[rec-v2] failed (non-fatal):", (err as Error).message); }

  // 2.3) ポスターから一覧の下地（96×54 WebP）と明るさ補正を作る（2026-10-26〜。旧：一覧のコードの定数＝新項目は下地なし）
  //      ポスターが出来た後・entries-v2.json を書き出す前に。失敗は非致命（一覧は下地なしで出る）
  let derived = false;
  if (v2ok) {
    try { execFileSync("python3", [path.join(REPO, "scripts/poster-derive.py"), slug], { cwd: REPO, stdio: "inherit" }); derived = true; }
    catch (err) { console.error("[derive] failed (non-fatal):", (err as Error).message); }
  }

  // 2.5) ホーム一覧(コードコンポーネントMotionDictionary)が読む entries.json を再生成
  //      ＝これを忘れると新項目が一覧に出てこない。
  //      2026-10-26〜：各項目に titleAct（見出し・カード名の演技）・aliases（検索の別名）・defaults・dim が載り、
  //      下地は public/v2/lqip.json に出る（content の titleAct・aliases は validate-content が必須にしている）
  run(`npx --yes tsx ${path.join(REPO, "scripts/export-entries-json.mts")}`);

  // 3) 動画・ポスター・entries.json をpush
  run(`git add public/videos/${slug}.mp4 public/posters/${slug}.jpg public/entries.json public/entries-v2.json public/entry public/v2/lqip.json`);
  if (v2ok) run(`git add public/v2/videos/${slug}.mp4 public/v2/posters/${slug}.jpg`);
  if (derived) run(`git add public/v2/derived/${slug}.json`);
  run(`git add -A rec`);
  try { run(`git commit -q -m "video: ${slug} ループ動画＋ポスター＋一覧（毎朝同期）"`); run(`git push origin main`); }
  catch { console.log("[git] nothing to commit (unchanged) — skip push"); }

  // 4) 動画・ポスターがGH Pagesに載るのを待つ（uploadFile/uploadImageがGHから取得するため）
  await waitUrl(`${GH}/videos/${slug}.mp4`, `videos/${slug}.mp4`);
  await waitUrl(`${GH}/posters/${slug}.jpg`, `posters/${slug}.jpg`);
  if (v2ok) await waitUrl(`${GH}/v2/posters/${slug}.jpg`, `v2/posters/${slug}.jpg`);

  // 5) Framer CMS へ upsert
  const payload = {
    slug, nameJa: e.nameJa, nameEn: e.nameEn, category: e.category, lede: e.lede,
    liveUrl: `${GH}/demo/${slug}`,
    promptTemplate: "```\n" + e.promptTemplate.trim() + "\n```",
    params: paramsMd(e.params), vocab: vocabMd(e.vocab),
    // say が既に「」で括られていると「「…」」になっていた（2026-10-24 修正）
    ng: `**言い方:** ${quote(e.ngExample.say)}\n\n**なぜNG:** ${e.ngExample.why}`,
    ok: `**言い方:** ${quote(e.okExample.say)}\n\n**なぜOK:** ${e.okExample.why}`,
    // EntryLab（詳細ページの触れるデモ＋連動プロンプト）がバインドする生の雛形とスライダー定義
    promptRaw: e.promptTemplate.trim(),
    paramsJson: JSON.stringify(e.params),
    videoUrl: `${GH}/videos/${slug}.mp4`,
    // Poster は詳細ページの og:image にも結んである＝v2（見せ場のコマ）があればそちらを使う
    posterUrl: v2ok ? `${GH}/v2/posters/${slug}.jpg` : `${GH}/posters/${slug}.jpg`,
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
