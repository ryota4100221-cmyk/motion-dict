// 写真デモで「写真が舞台のどれだけを占めているか」を機械で測る（2026-10-25 r7）。
// 使い方: NODE_PATH=... node scripts/photo-coverage.cjs [base] [slug ...]
// 舞台＝録画と同じ 720×405。/demo/photo- を描いている要素（img / background-image）の、画面内に見えている外接矩形の和を面積比で出す。
// 録画台本の zoom（rec/<slug>.json）も同じように掛けてから測る。
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const REPO = path.resolve(__dirname, "..");
const BASE = process.argv[2] || "http://localhost:3913/motion-dict";
let slugs = process.argv.slice(3);
if (!slugs.length) {
  const demos = fs.readdirSync(path.join(REPO, "demos"));
  const pas = (s) => s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("");
  slugs = JSON.parse(fs.readFileSync(path.join(REPO, "public/entries.json"), "utf8")).map((e) => e.slug).filter((s) =>
    demos.filter((f) => f.startsWith(pas(s) + ".")).some((f) => fs.readFileSync(path.join(REPO, "demos", f), "utf8").includes("/demo/photo-")));
}
(async () => {
  const b = await chromium.launch({ args: ["--mute-audio"] });
  const ctx = await b.newContext({ viewport: { width: 720, height: 405 }, deviceScaleFactor: 1 });
  const out = [];
  for (const s of slugs) {
    const p = await ctx.newPage();
    await p.goto(`${BASE}/stage/${s}/`, { waitUntil: "networkidle" });
    const rp = path.join(REPO, "rec", `${s}.json`);
    const spec = fs.existsSync(rp) ? JSON.parse(fs.readFileSync(rp, "utf8")) : {};
    if (spec.zoom && spec.zoom !== 1) await p.addStyleTag({ content: `[data-md-stage] > *:not([data-md-hint]):not([data-md-bleed]){zoom:${spec.zoom}}` });
    await p.waitForTimeout(900);
    const r = await p.evaluate(() => {
      const W = innerWidth, H = innerHeight;
      const els = [...document.querySelectorAll("*")].filter((el) => {
        if (el.tagName === "IMG" && /\/demo\/photo-/.test(el.currentSrc || el.src)) return true;
        return /\/demo\/photo-/.test(getComputedStyle(el).backgroundImage);
      });
      // 32px 刻みのグリッドで和集合の面積を数える
      const G = 8, cols = Math.ceil(W / G), rows = Math.ceil(H / G), hit = new Uint8Array(cols * rows);
      let best = 0;
      for (const el of els) {
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") continue;
        const bb = el.getBoundingClientRect();
        const x0 = Math.max(0, bb.left), y0 = Math.max(0, bb.top), x1 = Math.min(W, bb.right), y1 = Math.min(H, bb.bottom);
        if (x1 <= x0 || y1 <= y0) continue;
        best = Math.max(best, ((x1 - x0) * (y1 - y0)) / (W * H));
        for (let y = Math.floor(y0 / G); y < Math.ceil(y1 / G); y++) for (let x = Math.floor(x0 / G); x < Math.ceil(x1 / G); x++) hit[y * cols + x] = 1;
      }
      return { n: els.length, union: hit.reduce((a, v) => a + v, 0) / hit.length, largest: best };
    });
    out.push({ slug: s, ...r });
    console.log(`${s.padEnd(26)} n=${String(r.n).padStart(2)} union=${(r.union * 100).toFixed(0).padStart(3)}% largest=${(r.largest * 100).toFixed(0).padStart(3)}%`);
    await p.close();
  }
  await b.close();
})();
