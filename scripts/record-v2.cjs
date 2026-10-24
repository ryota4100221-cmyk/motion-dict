// 録画v2（2026-10-24）: node scripts/record-v2.cjs <slug> [--base URL] [--out DIR]
// 旧 record-one.cjs の問題（独立レビューで実測）:
//  ・1280×720の画面ごと撮り、デモ(1040×320の帯)は画面の約26%。一覧は2.3倍に引き伸ばしてボケる
//  ・25fps / 30〜60kbps でイージングの差が判定できない
//  ・カテゴリ別の汎用操作（円を描く／ボタンを6個押す）で、無動作が39〜95%・ループの継ぎ目が飛ぶ
// v2:
//  ・ビューポート720×405＝ステージ全面（DemoBareが画面いっぱいにステージを広げる）を
//    deviceScaleFactor 2 で撮る → 1440×810
//  ・CDP screencast で実フレームを時刻付きで受け、ffmpeg で 60fps CFR に並べ直す
//  ・操作は rec/<slug>.json の台本（項目ごと）。台本が無ければヒント文から推定した既定動作
//  ・先頭の無動作を切り、ループ長は台本の長さ。ポスターは「動きの見せ場」のフレームを自動選択
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const args = process.argv.slice(2);
const slug = args[0];
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const BASE = opt("--base", "https://ryota4100221-cmyk.github.io/motion-dict");
const REPO = path.resolve(__dirname, "..");
const OUT = opt("--out", path.join(REPO, "public", "v2"));
const W = 720, H = 405, DPR = 2, FPS = 60;
if (!slug) { console.error("usage: record-v2.cjs <slug>"); process.exit(2); }

const recPath = path.join(REPO, "rec", `${slug}.json`);
const spec = fs.existsSync(recPath) ? JSON.parse(fs.readFileSync(recPath, "utf8")) : null;

const CURSOR_CSS = `#__pw_cursor{position:fixed;left:-40px;top:-40px;width:14px;height:14px;border-radius:50%;background:#A5E02E;box-shadow:0 0 0 4px rgba(165,224,46,.22),0 1px 6px rgba(0,0,0,.5);pointer-events:none;z-index:2147483647;transform:translate(-50%,-50%);transition:transform .08s ease-out}`;

const P = (pt) => [Math.round(pt[0] * W), Math.round(pt[1] * H)];

async function center(page, sel) {
  const el = page.locator(sel).first();
  const bb = await el.boundingBox({ timeout: 1500 }).catch(() => null);
  if (!bb) return null;
  return [bb.x + bb.width / 2, bb.y + bb.height / 2];
}
async function target(page, s) {
  if (s.sel) { const c = await center(page, s.sel); if (c) return c; }
  if (s.at) return P(s.at);
  return [W / 2, H / 2];
}
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
let cur = [W * 0.5, H * 1.15]; // カーソルは画面外（下）から入ってくる
async function glide(page, to, dur) {
  const from = cur.slice();
  const n = Math.max(2, Math.round(dur / 16));
  for (let i = 1; i <= n; i++) {
    const t = ease(i / n);
    await page.mouse.move(from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t);
    await page.waitForTimeout(dur / n);
  }
  cur = to.slice();
}

async function runSteps(page, steps) {
  for (const s of steps) {
    const d = s.do;
    if (d === "wait") await page.waitForTimeout(s.ms || 500);
    else if (d === "move") await glide(page, await target(page, s), s.dur || 600);
    else if (d === "orbit") {
      const c = await target(page, s); const r = (s.r || 0.12) * W; const dur = s.dur || 1600; const n = Math.round(dur / 16);
      await glide(page, [c[0] + r, c[1]], 250);
      for (let i = 0; i <= n; i++) { const t = (i / n) * Math.PI * 2 * (s.turns || 1); const p = [c[0] + Math.cos(t) * r, c[1] + Math.sin(t) * r * (s.ry || 0.7)]; await page.mouse.move(p[0], p[1]); cur = p; await page.waitForTimeout(16); }
    }
    else if (d === "click") { const c = await target(page, s); await glide(page, c, s.dur || 450); await page.mouse.down(); await page.waitForTimeout(90); await page.mouse.up(); }
    else if (d === "drag") {
      const a = s.fromSel ? await center(page, s.fromSel) : P(s.from); const b = s.toSel ? await center(page, s.toSel) : P(s.to);
      await glide(page, a, 400); await page.mouse.down(); await glide(page, b, s.dur || 900); await page.mouse.up();
    }
    else if (d === "wheel") {
      if (s.at || s.sel) await glide(page, await target(page, s), 300);
      for (let i = 0; i < (s.times || 10); i++) { await page.mouse.wheel(s.dx || 0, s.dy || 60); await page.waitForTimeout(s.gap || 40); }
    }
    else if (d === "type") { if (s.sel) await page.locator(s.sel).first().click({ timeout: 1500 }).catch(() => {}); await page.keyboard.type(s.text || "", { delay: s.delay || 90 }); }
    else if (d === "clear") { if (s.sel) { await page.locator(s.sel).first().fill("").catch(() => {}); } }
    else if (d === "key") await page.keyboard.press(s.key);
    else if (d === "leave") await glide(page, s.at ? P(s.at) : [W * 0.5, H * 1.15], s.dur || 500);
  }
}

// 台本が無いときの既定（ヒント文から推定）
function defaultSteps(hint) {
  const h = hint || "";
  if (/スクロール|スワイプ/.test(h) && !/自動/.test(h)) return [{ do: "move", at: [0.5, 0.5], dur: 500 }, { do: "wheel", dy: 50, times: 30, gap: 40 }, { do: "wait", ms: 400 }, { do: "wheel", dy: -50, times: 30, gap: 40 }, { do: "wait", ms: 300 }];
  if (/自動|操作不要|自走/.test(h)) return [{ do: "wait", ms: 4000 }];
  if (/ドラッグ/.test(h) && !/ホバー|動かす|近づけ/.test(h)) return [{ do: "drag", from: [0.3, 0.5], to: [0.7, 0.5], dur: 1100 }, { do: "wait", ms: 400 }, { do: "drag", from: [0.7, 0.5], to: [0.3, 0.5], dur: 1100 }];
  if (/クリック|タップ|Play|Replay|Switch|Menu|Power/.test(h) && !/ホバー/.test(h)) return [{ do: "click", sel: "button, [role=button]", dur: 600 }, { do: "wait", ms: 2000 }, { do: "leave" }];
  return [{ do: "move", at: [0.5, 0.5], dur: 700 }, { do: "orbit", at: [0.5, 0.5], r: 0.1, dur: 1800 }, { do: "wait", ms: 500 }, { do: "leave", dur: 600 }, { do: "wait", ms: 600 }];
}

(async () => {
  const TMP = fs.mkdtempSync(path.join(require("os").tmpdir(), `rec2-${slug}-`));
  const browser = await chromium.launch({ args: ["--mute-audio", "--force-color-profile=srgb"] });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/stage/${slug}/`, { waitUntil: "networkidle", timeout: 45000 });
  // 操作ヒントの文字は動画に焼き込まない（一覧・詳細ではHTML側に出す）
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}[data-md-hint]{opacity:0!important}" });
  // 台本の zoom：ステージの中身が枠に対して小さいデモを拡大して撮る（ヒントは除く）
  if (spec?.zoom && spec.zoom !== 1) await page.addStyleTag({ content: `[data-md-stage] > *:not([data-md-hint]){zoom:${spec.zoom}}` });
  await page.waitForTimeout(spec?.settle ?? 900);
  const hint = await page.evaluate(() => document.querySelector("[data-md-hint]")?.textContent || "");
  const useCursor = spec?.cursor ?? true;
  if (useCursor) {
    await page.addStyleTag({ content: CURSOR_CSS });
    await page.evaluate(() => {
      const c = document.createElement("div"); c.id = "__pw_cursor"; document.body.appendChild(c);
      addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
      addEventListener("mousedown", () => { c.style.transform = "translate(-50%,-50%) scale(.65)"; }, true);
      addEventListener("mouseup", () => { c.style.transform = "translate(-50%,-50%) scale(1)"; }, true);
    });
  }
  if (spec?.before) await runSteps(page, spec.before);

  // CDP screencast（実フレーム＋時刻）
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", async (f) => {
    frames.push({ t: f.metadata.timestamp, data: f.data });
    cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "png", maxWidth: W * DPR, maxHeight: H * DPR, everyNthFrame: 1 });
  const t0 = Date.now();
  await page.waitForTimeout(120);
  await runSteps(page, spec?.steps || defaultSteps(hint));
  await page.waitForTimeout(spec?.tail ?? 200);
  await cdp.send("Page.stopScreencast");
  await page.waitForTimeout(150);
  await browser.close();

  // 時刻付きフレーム → concat 用リスト（各フレームの表示時間）→ 60fps CFR
  frames.sort((a, b) => a.t - b.t);
  const list = [];
  frames.forEach((f, i) => {
    const p = path.join(TMP, `f${String(i).padStart(5, "0")}.png`);
    fs.writeFileSync(p, Buffer.from(f.data, "base64"));
    const next = frames[i + 1] ? frames[i + 1].t : f.t + 1 / FPS;
    list.push(`file '${p}'\nduration ${Math.max(1 / FPS, next - f.t).toFixed(4)}`);
  });
  list.push(`file '${path.join(TMP, `f${String(frames.length - 1).padStart(5, "0")}.png`)}'`);
  fs.writeFileSync(path.join(TMP, "list.txt"), list.join("\n"));
  const span = frames.length ? frames[frames.length - 1].t - frames[0].t : 0;
  const raw = path.join(TMP, "raw.mp4");
  execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i "${path.join(TMP, "list.txt")}" -vf "fps=${FPS},scale=${W * DPR}:${H * DPR}:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -crf 20 -movflags +faststart -an "${raw}"`);

  // 先頭の無動作を切る（最初に画が変わる点の0.15s手前から）
  let start = 0;
  try {
    const s = execSync(`ffmpeg -i "${raw}" -vf "scale=360:-1,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG" -an -f null - 2>&1`, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
    const ts = [...s.matchAll(/pts_time:([0-9.]+)[\s\S]*?YAVG=([0-9.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    const first = ts.find(([, y]) => y > 0.15);
    if (first && first[0] > 0.3 && !spec?.keepHead) start = Math.max(0, first[0] - 0.15);
  } catch (e) {}
  fs.mkdirSync(path.join(OUT, "videos"), { recursive: true });
  fs.mkdirSync(path.join(OUT, "posters"), { recursive: true });
  const out = path.join(OUT, "videos", `${slug}.mp4`);
  execSync(`ffmpeg -y -loglevel error -ss ${start} -i "${raw}" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart -an "${out}"`);

  // ポスター：見せ場のフレーム（台本の posterAt が優先。無ければ poster-pick.py が
  // 「暗くない・情報量が多い・ライムが出ている」時刻を選ぶ）。旧版は1フレーム目＝
  // まだ何も起きていない暗い画で、一覧の3分の1が黒い四角になっていた。
  let at = spec?.posterAt;
  if (at == null) {
    try { at = Number(execSync(`python3 "${path.join(__dirname, "poster-pick.py")}" "${out}"`).toString().trim()) || 0; } catch (e) { at = 0; }
  }
  const poster = path.join(OUT, "posters", `${slug}.jpg`);
  execSync(`ffmpeg -y -loglevel error -ss ${at} -i "${out}" -frames:v 1 -vf "scale=960:-1:flags=lanczos" -q:v 3 "${poster}"`);
  fs.rmSync(TMP, { recursive: true, force: true });
  const dur = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${out}"`).toString().trim();
  console.log(JSON.stringify({ slug, frames: frames.length, span: +span.toFixed(2), fpsReal: +(frames.length / span).toFixed(1), trimmed: +start.toFixed(2), dur: +dur, posterAt: at, spec: !!spec, hint }));
})().catch((e) => { console.error("RECORD FAIL:", slug, e.message); process.exit(1); });
