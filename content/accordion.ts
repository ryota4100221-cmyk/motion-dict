import type { MotionEntry } from "@/lib/types";

export const accordion: MotionEntry = {
  slug: "accordion",
  category: "ui",
  nameJa: "アコーディオン",
  nameEn: "accordion / expand collapse",
  lede: "クリックで回答欄の高さがなめらかに開閉するFAQの定番UI。「height: auto はアニメーションできない」というCSSの古典的な壁を、grid-template-rows: 0fr→1fr で解決するのが現在の正攻法。max-heightのマジックナンバーはもう要らない。",
  params: [
    {
      key: "duration",
      label: "duration(開閉時間 s)",
      min: 0.15,
      max: 0.8,
      step: 0.05,
      default: 0.35,
      desc: "0.25〜0.4sが目安。FAQは連続で開閉されるUIなので、0.5sを超えるとテンポを削ぐ。",
    },
    {
      key: "easing",
      label: "easing(緩急)",
      min: 0,
      max: 2,
      step: 1,
      default: 1,
      options: ["ease", "ease-out", "cubic-bezier(0.22, 1, 0.36, 1)"],
      desc: "ease-outが無難。cubic-bezier(0.22,1,0.36,1)は着地がより柔らかい強めの減速。",
    },
  ],
  promptTemplate: `FAQに accordion(開閉アニメーション)を実装してください。

- 回答部分は display: grid のラッパーで包み、grid-template-rows を 0fr(閉)⇔1fr(開)で切り替えて {{duration}}s {{easing}} でtransitionする
- グリッドの内側の要素に overflow: hidden と min-height: 0 を付ける(これがないと0frでも潰れず閉じない)
- height: auto や max-height の決め打ちでアニメーションしない(内容量が変わると破綻する)
- 見出しは button 要素にして aria-expanded を開閉状態と同期させる
- +アイコンの回転などの装飾は transform で動かす
- prefers-reduced-motion 時はtransitionなしで即時に開閉する`,
  ngExample: {
    say: "「FAQをアコーディオンにして、開閉をアニメーションさせて」",
    why: "height: auto がアニメできないため、max-height: 500px のような決め打ち実装が返ってきがち。回答が長いと途中で切れ、短いと開き終わりだけ異様に速い、という不自然な動きになる。",
  },
  okExample: {
    say: "「accordionをgrid-template-rows: 0fr→1frのtransition(0.35s ease-out)で実装。グリッド内側にoverflow: hiddenとmin-height: 0、見出しはbutton+aria-expanded。max-heightの決め打ち禁止」",
    why: "実装方式(grid rows)を指定することでmax-heightハックを確実に回避できる。min-height: 0 の一言が「なぜか閉じない」事故を防ぐ。",
  },
  vocab: [
    {
      term: "grid-template-rows: 0fr→1fr",
      desc: "frは比率の単位でtransition可能。「中身の高さぶんだけ」を具体的な数値なしでアニメーションできる。",
    },
    {
      term: "min-height: 0",
      desc: "グリッドアイテムはデフォルトで中身より小さくなれない(min-height: auto)。これを外さないと0frにしても閉じない。",
    },
    {
      term: "max-heightハック",
      desc: "旧来の代替手段。「十分大きい値」へのtransitionで擬似的に開閉するが、実際の高さとの差分だけ速度が狂い不自然になる。",
    },
    {
      term: "aria-expanded",
      desc: "開閉状態を支援技術に伝えるbutton属性。CSSのセレクタとしても使え、状態とスタイルの同期点になる。",
    },
  ],
  related: ["tab-indicator", "drawer-slide", "menu-reveal"],
};
