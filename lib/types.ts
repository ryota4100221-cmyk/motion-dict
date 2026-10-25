export type MotionCategory =
  | "hover"
  | "scroll"
  | "text"
  | "transition"
  | "media"
  | "ui"
  | "loading"
  | "webgl";

export type DemoParam = {
  key: string; // "strength"
  label: string; // "strength(吸い付きの強さ)"
  min: number;
  max: number;
  step: number;
  default: number;
  desc: string; // スライダー下の1行説明
  // 離散選択(charset切替・mix-blend-mode等)。指定時はvalueを0始まりのindexとして
  // 扱い、min=0 / max=options.length-1 / step=1 で定義する
  options?: string[];
};

export type MotionEntry = {
  slug: string; // "magnetic-hover"
  category: MotionCategory;
  nameJa: string; // "マグネティックホバー"
  nameEn: string; // "magnetic hover / magnetic button"
  lede: string; // 1〜2文の説明
  params: DemoParam[]; // スライダー定義
  promptTemplate: string; // {{paramKey}} 埋め込み可のプロンプト雛形
  ngExample: { say: string; why: string };
  okExample: { say: string; why: string };
  vocab: { term: string; desc: string }[];
  related: string[]; // slug配列
  // 詳細の見出し・一覧のカード名が演じる動き（2026-10-26〜。新項目は必須＝validate-content が検査）。
  // 型＝framer/EntryTitle.tsx の SPEC のキー（既存項目の slug）か "C:<章>"。書き方は docs/DAILY_ENTRY_GUIDE.md
  titleAct?: TitleAct;
  // 検索の別名（擬音・俗な言い方 3〜5語。2026-10-26〜 新項目は必須）。一覧の検索が名前・説明文に加えて引く
  aliases?: string[];
};

export type TitleAct = {
  act: string; // "scroll-fade-in" / "C:ui" など
  // 型の値の鍵 → この項目の値の鍵（"stagger" / 単位を変えるとき "stagger*1000"）か固定の数値。
  // 書かない鍵は、同じ名前の自分の値 → 無ければ型の項目の初期値（export が埋める）
  map?: Record<string, string | number>;
};

export type ParamValues = Record<string, number>;

export function defaultValues(entry: MotionEntry): ParamValues {
  return Object.fromEntries(entry.params.map((p) => [p.key, p.default]));
}
