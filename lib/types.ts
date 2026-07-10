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
};

export type ParamValues = Record<string, number>;

export function defaultValues(entry: MotionEntry): ParamValues {
  return Object.fromEntries(entry.params.map((p) => [p.key, p.default]));
}
