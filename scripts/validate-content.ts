import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
// コンテンツデータの整合性チェック(npx tsx scripts/validate-content.ts)
// - promptTemplateの{{key}}がparamsに存在するか
// - optionsパラメータの min/max/step/default が規約通りか
// - related のslugが実在するか
// - 必須コピー(ng/ok/vocab)が揃っているか
import { entries, entryList } from "../content";
import { readSpec, isActName, parseRef } from "../lib/titleAct";

const errors: string[] = [];

// ── 見出しの演技（titleAct）と検索の別名（aliases）（2026-10-26〜 全項目で必須）──
// 表に無い新項目は、詳細の見出しが自分の動きを演じず章扉の演技に落ち、擬音の検索にも乗らなかった（speed-dial で確認）。
// 型＝framer/EntryTitle.tsx の SPEC のキーか "C:<章>"。一覧の写し（MotionDictionaryV2 の SPEC）も同じキーを持つこと
const SPEC = readSpec("framer/EntryTitle.tsx");
const SPEC_V2 = readSpec("framer/MotionDictionaryV2.tsx");
for (const k of SPEC.keys()) if (!SPEC_V2.has(k)) errors.push(`framer: SPEC "${k}" が EntryTitle にあって MotionDictionaryV2 に無い（カード名だけ章扉の演技になる）`);
for (const k of SPEC_V2.keys()) if (!SPEC.has(k)) errors.push(`framer: SPEC "${k}" が MotionDictionaryV2 にあって EntryTitle に無い`);
for (const e of entryList) {
  const ta = e.titleAct;
  if (!ta || typeof ta.act !== "string") { errors.push(`${e.slug}: titleAct がない（例 titleAct: { act: "scroll-fade-in", map: { stagger: "stagger*1000" } }）`); }
  else if (!isActName(ta.act, SPEC)) errors.push(`${e.slug}: titleAct.act "${ta.act}" は既存の型にない（framer/EntryTitle.tsx の SPEC のキー か "C:hover|scroll|text|transition|media|ui|loading"）`);
  else if (ta.map) {
    const own = new Set(e.params.map((p) => p.key));
    const src = ta.act.startsWith("C:") ? null : entries[ta.act];
    if (!src) errors.push(`${e.slug}: titleAct.act "${ta.act}" に map は付けられない（章扉の演技は値を使わない）`);
    const srcKeys = new Set((src?.params || []).map((p) => p.key));
    for (const [k, v] of Object.entries(ta.map)) {
      if (src && !srcKeys.has(k)) errors.push(`${e.slug}: titleAct.map の鍵 "${k}" は型 ${ta.act} の値にない（${[...srcKeys].join(", ")}）`);
      if (typeof v === "number") { if (!Number.isFinite(v)) errors.push(`${e.slug}: titleAct.map.${k} が数値でない`); continue; }
      const r = typeof v === "string" ? parseRef(v) : null;
      if (!r) errors.push(`${e.slug}: titleAct.map.${k} "${v}" は "鍵" か "鍵*倍率" か数値で書く`);
      else if (!own.has(r.key)) errors.push(`${e.slug}: titleAct.map.${k} が参照する "${r.key}" はこの項目の params にない`);
    }
  }
  if (ta && ta.act === e.slug && !SPEC.has(e.slug)) errors.push(`${e.slug}: titleAct.act に自分の slug は使えない（SPEC に無い＝演技の関数が無い）。近い既存の型を選ぶ`);
  const al = e.aliases;
  if (!Array.isArray(al) || al.length < 3 || al.length > 5) errors.push(`${e.slug}: aliases は擬音・俗な言い方を3〜5語（いま ${Array.isArray(al) ? al.length : 0}語）`);
  else {
    if (al.some((x) => typeof x !== "string" || !x.trim() || /[,|:]/.test(x))) errors.push(`${e.slug}: aliases に空の語か「, | :」を含む語`);
    if (new Set(al).size !== al.length) errors.push(`${e.slug}: aliases に同じ語が2回`);
  }
}

for (const e of entryList) {
  const paramKeys = new Set(e.params.map((p) => p.key));

  for (const m of e.promptTemplate.matchAll(/\{\{(\w+)\}\}/g)) {
    if (!paramKeys.has(m[1]))
      errors.push(`${e.slug}: template token {{${m[1]}}} が params にない`);
  }
  for (const p of e.params) {
    if (!e.promptTemplate.includes(`{{${p.key}}}`))
      errors.push(`${e.slug}: param "${p.key}" が template で未使用`);
    if (p.options) {
      if (p.min !== 0 || p.max !== p.options.length - 1 || p.step !== 1)
        errors.push(`${e.slug}: options param "${p.key}" の min/max/step が規約外`);
      if (p.default < 0 || p.default > p.options.length - 1)
        errors.push(`${e.slug}: options param "${p.key}" の default が範囲外`);
    } else if (p.default < p.min || p.default > p.max) {
      errors.push(`${e.slug}: param "${p.key}" の default が min/max の範囲外`);
    }
  }
  for (const r of e.related) {
    if (!entries[r]) errors.push(`${e.slug}: related "${r}" が実在しない`);
  }
  if (e.related.includes(e.slug)) errors.push(`${e.slug}: related に自分自身`);
  if (e.vocab.length < 3) errors.push(`${e.slug}: vocab が ${e.vocab.length} 項目`);
  if (!e.ngExample.say || !e.ngExample.why || !e.okExample.say || !e.okExample.why)
    errors.push(`${e.slug}: NG/OK例が不完全`);
  // 盲検（2026-10-25）：きっかけ（何の操作で再生するか）が無いと、別のAIはクリック再生やボタンだけの遷移で作り、動きが出なかった
  if (!/^- きっかけ: /m.test(e.promptTemplate))
    errors.push(`${e.slug}: template の先頭に「- きっかけ: 」の行がない`);
  if (!e.promptTemplate.includes("reduced-motion"))
    errors.push(`${e.slug}: template に reduced-motion 言及なし`);
}

// ── デモのソースの機械点検（2026-10-24 録画v2の撮り直しで見つかった本番の不具合2型）──
// ① public/ の素材を basePath 無しの絶対パス（"/demo/..."）で参照 → GH Pages(/motion-dict)で404。
//    画像の出ないデモが20ファイル以上あった。"/motion-dict/demo/..." と書く。
// ② @property で登録したカスタムプロパティは文書全体に効く（inherits:false 等が他のデモにも及ぶ）。
//    AiOrb の --angle 登録で barber-pole の縞と moire-drift の傾きが消えていた。名前はデモ固有の接頭辞で。
{
  const dir = path.join(process.cwd(), "demos");
  const files = readdirSync(dir).filter((f) => /\.(tsx|css)$/.test(f));
  const src = Object.fromEntries(files.map((f) => [f, readFileSync(path.join(dir, f), "utf8")]));
  const strip = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  for (const [f, t] of Object.entries(src)) {
    if (/["'`(]\/demo\//.test(strip(t))) errors.push(`demos/${f}: 素材を "/demo/..." で参照（basePath が付かず本番で404）→ "/motion-dict/demo/..."`);
  }
  const owners: Record<string, string> = {};
  for (const [f, t] of Object.entries(src)) for (const m of t.matchAll(/@property\s+(--[\w-]+)/g)) owners[m[1]] = f;
  for (const [prop, owner] of Object.entries(owners)) {
    const base = owner.replace(/\.module\.css$/, "");
    for (const [f, t] of Object.entries(src)) {
      if (f.startsWith(base + ".")) continue;
      if (new RegExp(prop.replace(/-/g, "\\-") + "(?![\\w-])").test(strip(t)))
        errors.push(`demos/${f}: ${prop} は demos/${owner} が @property で全体登録している名前（干渉する）`);
    }
  }
}

if (errors.length) {
  console.error(errors.map((e) => "✗ " + e).join("\n"));
  process.exit(1);
}
console.log(`✓ ${entryList.length} entries OK`);
