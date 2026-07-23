// 使い方: NODE_PATH=<playwrightのある node_modules> node scripts/record-one.cjs <slug> <category>
// GH Pages本番URL(/motion-dict/demo/<slug>/)のデモを操作しながら録画→ffmpegで public/videos/<slug>.mp4。
// 毎朝ルーティン(sync-to-framer)から呼ばれる。Playwrightは NODE_PATH 経由で解決。
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const slug = process.argv[2];
const category = process.argv[3] || "ui";
if (!slug) { console.error("usage: record-one.cjs <slug> <category>"); process.exit(2); }

const BASE = "https://ryota4100221-cmyk.github.io/motion-dict/demo";
const VIDEODIR = path.resolve(__dirname, "..", "public", "videos");
const TMP = `/tmp/rec-${slug}`;
fs.mkdirSync(VIDEODIR, { recursive: true });
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });

const sleep = (p, ms) => p.waitForTimeout(ms);
async function moveAround(page, cx, cy, r, steps, loops) {
  for (let l = 0; l < loops; l++)
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      await page.mouse.move(cx + Math.cos(t) * r, cy + Math.sin(t) * r);
      await sleep(page, 55);
    }
}
const CURSOR = `#__pw_cursor{position:fixed;left:640px;top:360px;width:16px;height:16px;border-radius:50%;background:#A5E02E;box-shadow:0 0 0 4px rgba(165,224,46,.25);pointer-events:none;z-index:2147483647;transform:translate(-50%,-50%);transition:transform .05s linear}`;

async function interact(page, category) {
  const cx = 640, cy = 360;
  await page.mouse.move(cx, cy); await sleep(page, 300);
  if (["hover", "media", "text", "transition"].includes(category)) {
    await moveAround(page, cx, cy, 160, 22, 2);
    await moveAround(page, cx, cy, 250, 18, 1);
  } else if (category === "scroll") {
    for (let i = 0; i < 18; i++) { await page.mouse.wheel(0, 70); await sleep(page, 85); }
    await sleep(page, 300);
    for (let i = 0; i < 18; i++) { await page.mouse.wheel(0, -70); await sleep(page, 85); }
  } else if (["ui", "loading"].includes(category)) {
    const cl = page.locator("button, [role=button], a, [tabindex]");
    const n = Math.min(await cl.count(), 6);
    for (let r = 0; r < 2; r++)
      for (let i = 0; i < n; i++) { try { await cl.nth(i).click({ timeout: 1200 }); } catch (e) {} await sleep(page, 750); }
    if (n === 0) await moveAround(page, cx, cy, 160, 20, 2);
  } else { await moveAround(page, cx, cy, 160, 22, 2); }
  await sleep(page, 400);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: TMP, size: { width: 1280, height: 720 } },
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/${slug}/`, { waitUntil: "networkidle", timeout: 30000 });
  await sleep(page, 800);
  await page.addStyleTag({ content: CURSOR });
  await page.evaluate(() => {
    const c = document.createElement("div"); c.id = "__pw_cursor"; document.body.appendChild(c);
    addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
    addEventListener("mousedown", () => { c.style.transform = "translate(-50%,-50%) scale(.7)"; }, true);
    addEventListener("mouseup", () => { c.style.transform = "translate(-50%,-50%) scale(1)"; }, true);
  });
  await interact(page, category);
  await ctx.close();
  await browser.close();

  const webm = fs.readdirSync(TMP).filter((f) => f.endsWith(".webm")).map((f) => path.join(TMP, f)).pop();
  const out = path.join(VIDEODIR, `${slug}.mp4`);
  const raw = path.join(TMP, "raw.mp4");
  execSync(`ffmpeg -y -i "${webm}" -movflags +faststart -pix_fmt yuv420p -c:v libx264 -crf 26 -an "${raw}"`, { stdio: "ignore" });

  // 録画先頭には「①ブラウザ読込中の純白フレーム ②デモ箱が描画される前の薄グレー
  // (#F4F4F1)の空フレーム」が焼き込まれ、Framerのホバー再生時に一瞬白く光る。
  // DemoBareは暗色箱なので、箱が出た瞬間=平均輝度YAVGが下がる点がコンテンツ開始。
  // YAVG<200 になる最初のフレームまで切り落とす（YMIN=暗い画素1個だと隅の文字で
  // 薄グレー空フレームに引っかかり1フレーム早く止まる＝これが白フラッシュの真因だった）。
  // 既に先頭から暗いデモはSTART≈0で実質そのまま。上限を超える異常時も無トリム。
  let start = 0;
  try {
    const stats = execSync(
      `ffmpeg -i "${raw}" -vf "signalstats,metadata=print:key=lavfi.signalstats.YAVG" -an -f null - 2>&1`,
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
    );
    const lines = stats.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const mt = lines[i].match(/pts_time:([0-9.]+)/);
      if (!mt) continue;
      const my = (lines[i + 1] || "").match(/YAVG=([0-9.]+)/);
      if (my && Number(my[1]) < 200) { start = Number(mt[1]); break; }
    }
  } catch (e) { start = 0; }
  if (start > 0 && start <= 2.5) {
    execSync(`ffmpeg -y -ss ${start} -i "${raw}" -movflags +faststart -pix_fmt yuv420p -c:v libx264 -crf 26 -an "${out}"`, { stdio: "ignore" });
    console.log(`[trim] leading light lead ${start}s dropped (YAVG<200)`);
  } else {
    fs.copyFileSync(raw, out);
  }
  // ポスター＝トリム済み動画の先頭フレーム（＝暗いデモ箱。YAVGトリムでコンテンツ開始点に
  // なっているので、ポスターと動画の頭が一致しホバー再生時のジャンプ/白フラッシュが出ない）。
  const POSTERDIR = path.resolve(__dirname, "..", "public", "posters");
  fs.mkdirSync(POSTERDIR, { recursive: true });
  const poster = path.join(POSTERDIR, `${slug}.jpg`);
  execSync(`ffmpeg -y -loglevel error -i "${out}" -frames:v 1 -q:v 3 "${poster}"`, { stdio: "ignore" });

  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(out);
  console.log(poster);
})().catch((e) => { console.error("RECORD FAIL:", e); process.exit(1); });
