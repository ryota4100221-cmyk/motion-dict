import type { MotionEntry } from "@/lib/types";

export const counter: MotionEntry = {
  slug: "counter",
  category: "text",
  nameJa: "カウントアップ",
  nameEn: "count up / number counter",
  lede: "数字が0から目標値まで駆け上がる動き。実績・導入社数・売上などのKPIセクションで、静的な数字より圧倒的に「積み上げた感」を出せる。スクロールで見えた瞬間に発火させるのが定石。",
  params: [
    {
      key: "duration",
      label: "duration(カウント時間 s)",
      min: 0.5,
      max: 4,
      step: 0.1,
      default: 1.6,
      desc: "1.5〜2sが読みやすい。長すぎると待たされ、短すぎると値が読めない。",
    },
    {
      key: "ease",
      label: "ease(イージング)",
      min: 0,
      max: 2,
      step: 1,
      default: 1,
      options: ["linear", "ease-out", "expo-out"],
      desc: "linearは機械的。expo-outは序盤に一気に増えて最後にゆっくり着地する。",
    },
  ],
  promptTemplate: `数値表示に count up を実装してください。

- 0 から 12,480 まで {{duration}}s かけてカウントアップする
- イージングは{{ease}}(進捗t 0→1に適用してから目標値に掛ける)
- requestAnimationFrame の毎フレーム、経過時間から進捗を計算して Math.round + toLocaleString でカンマ区切り表示
- 終了時は必ず最終値ちょうどで止める(丸め誤差で12,479のまま終わらせない)
- 桁のガタつきを防ぐため font-variant-numeric: tabular-nums を指定する
- prefers-reduced-motion 時はカウントせず最終値を即表示する`,
  ngExample: {
    say: "「数字がグワーッと増えるやつつけて」",
    why: "時間・イージング・カンマ区切り・終了値の扱いが全部未定義。setIntervalで+1し続ける実装が返ってきて、大きい値だと終わらない・端数で止まるなど事故が起きがち。",
  },
  okExample: {
    say: "「count upを実装。0→12,480を1.6s、ease-outで進捗に適用、rAFで経過時間から計算、toLocaleStringでカンマ区切り、終了時は最終値で確定、tabular-nums指定」",
    why: "時間・イージング・表示形式・終了処理・桁揃えまで指定している。「経過時間から計算」の一言でフレームレート非依存の正しい実装になる。",
  },
  vocab: [
    {
      term: "進捗t",
      desc: "経過時間÷全体時間で出す0〜1の正規化時間。イージングはこのtに適用し、値には掛け算で反映する。",
    },
    {
      term: "expo-out",
      desc: "1-2^(-10t)。序盤に一気に進み終盤で減速する指数系イージング。カウンタでは「勢いよく増えて着地」の花形。",
    },
    {
      term: "tabular-nums",
      desc: "数字を等幅で描画するfont-variant-numericの値。1と8の幅が揃い、カウント中に桁がガタつかなくなる。",
    },
    {
      term: "toLocaleString",
      desc: "12480を\"12,480\"にするJSの標準API。桁区切りを自前で正規表現処理する必要はない。",
    },
  ],
  related: ["typewriter", "scroll-fade-in", "scroll-progress"],
};
