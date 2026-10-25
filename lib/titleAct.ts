// 見出しの演技（titleAct）の「型」の一覧と、項目データへの展開（2026-10-26）。
// 詳細の見出し（framer/EntryTitle.tsx）と一覧のカード名（framer/MotionDictionaryV2.tsx の写し）は、
// 演技を slug → 関数の対応表 SPEC で持つ。型＝SPEC のキー（既存項目の slug）か "C:<章>"（章扉と同じ演技）。
// 新項目は content の titleAct で「どの型を・どの値で」演じるかを指定する（表に無い項目が章扉の演技に落ちないように）。
// Node 側（export-entries-json / validate-content）だけが使う。Framer のコードファイルは import できないので、
// 同じ規則（remap）を各コンポーネントに小さく書いてある。
import { readFileSync } from "node:fs";
import path from "node:path";
import type { MotionEntry, TitleAct } from "./types";

export const CHAPTER_KEYS = ["hover", "scroll", "text", "transition", "media", "ui", "loading"] as const;

export type ActSpec = { grade: "A" | "B" | "C"; chapter?: string; keys?: string[] };

/** framer/<file> の `const SPEC: Record<string, Spec> = { … }` から 型名 → 段階・章・表示する値の鍵 を読む */
export function readSpec(file = "framer/EntryTitle.tsx", root = process.cwd()): Map<string, ActSpec> {
  const t = readFileSync(path.join(root, file), "utf8");
  const i = t.indexOf("const SPEC: Record<string, Spec> = {");
  if (i < 0) throw new Error(`${file}: SPEC が見つからない`);
  const body = t.slice(i, t.indexOf("\n}\n", i));
  const out = new Map<string, ActSpec>();
  // 各行は `    "slug": ["A", …` で始まる（関数が複数行に渡る行もある）。行頭の slug と段階、行の中の C の章、末尾の表示キーを拾う
  const starts = [...body.matchAll(/^ {4}"([a-z0-9-]+)": \["([ABC])"/gm)];
  starts.forEach((m, n) => {
    const seg = body.slice(m.index!, n + 1 < starts.length ? starts[n + 1].index : body.length);
    const grade = m[2] as ActSpec["grade"];
    if (grade === "C") {
      const ch = seg.match(/\["C", "(\w+)"\]/);
      out.set(m[1], { grade, chapter: ch ? ch[1] : "text" });
      return;
    }
    // 末尾の `, "flags", "a,b"],` の2つ目
    const tail = seg.trimEnd().match(/, "([a-z]*)", "([\w,]+)"\],?\s*$/);
    out.set(m[1], { grade, keys: tail ? tail[2].split(",") : undefined });
  });
  return out;
}

/** 型名として正しいか（SPEC のキー か "C:<章>"） */
export function isActName(act: string, spec: Map<string, ActSpec>): boolean {
  if (act.startsWith("C:")) return (CHAPTER_KEYS as readonly string[]).includes(act.slice(2));
  return spec.has(act);
}

/** map の値 "key" / "key*倍率" を分ける */
export function parseRef(s: string): { key: string; factor: number } | null {
  const m = s.match(/^(\w+)(?:\*(-?\d+(?:\.\d+)?))?$/);
  return m ? { key: m[1], factor: m[2] ? parseFloat(m[2]) : 1 } : null;
}

/**
 * 公開用に展開した titleAct。コンポーネントはこれをそのまま使う。
 *  ・型が C の項目（SPEC で章扉と同じ演技）は "C:<章>" にそろえる（map なし）
 *  ・型が自分自身なら map なし（＝今の対応表と同じ）
 *  ・型が他の項目なら、型の値の鍵をすべて埋める：map の指定 ＞ 同じ名前の自分の値 ＞ 型の項目の初期値（固定）
 */
export function resolveTitleAct(e: MotionEntry, entries: Record<string, MotionEntry>, spec: Map<string, ActSpec>): TitleAct {
  const ta = e.titleAct;
  if (!ta) {
    const s = spec.get(e.slug);
    if (!s) return { act: "C:" + e.category };
    return s.grade === "C" ? { act: "C:" + s.chapter } : { act: e.slug };
  }
  if (ta.act.startsWith("C:")) return { act: ta.act };
  const s = spec.get(ta.act);
  if (s && s.grade === "C") return { act: "C:" + s.chapter };
  if (ta.act === e.slug && !ta.map) return { act: e.slug };
  const src = entries[ta.act];
  const own = new Set(e.params.map((p) => p.key));
  const map: Record<string, string | number> = {};
  for (const p of src?.params || []) {
    const m = ta.map?.[p.key];
    if (m !== undefined) map[p.key] = m;
    else if (own.has(p.key)) map[p.key] = p.key;
    else map[p.key] = p.default;
  }
  // 型の項目に無い鍵の指定も残す（型の関数が読む鍵を content で足したい場合）
  for (const [k, v] of Object.entries(ta.map || {})) if (!(k in map)) map[k] = v;
  return { act: ta.act, map };
}
