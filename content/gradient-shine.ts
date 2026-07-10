import type { MotionEntry } from "@/lib/types";

export const gradientShine: MotionEntry = {
  slug: "gradient-shine",
  category: "text",
  nameJa: "グラデーションシャイン",
  nameEn: "text shine / shimmer text",
  lede: "文字の上を光の帯が周期的に走り抜けるテキスト演出。background-clip: text で文字をグラデーションの窓にし、background-position を動かすだけで実装できる。CTAや見出しの「今見てほしい」を静かに主張する。",
  params: [
    {
      key: "period",
      label: "period(周期 s)",
      min: 1,
      max: 6,
      step: 0.1,
      default: 2.5,
      desc: "2〜3sが上品。1s台前半はチカチカして安っぽくなり、5s超は気づかれない。",
    },
    {
      key: "band",
      label: "band(光の幅 %)",
      min: 5,
      max: 60,
      step: 1,
      default: 20,
      desc: "15〜25%が定番。広すぎると帯ではなく全体の点滅に見える。",
    },
  ],
  promptTemplate: `テキストに gradient shine(text shine)を実装してください。

- 文字に linear-gradient(110deg) の背景を敷き、background-clip: text(-webkit-付きも併記)+ color: transparent で文字をグラデーションの窓にする
- グラデーションはベース色の中央に幅 {{band}}% の明るいハイライト帯を置く(ベース {{band}}/2%手前 → ハイライト 50% → ベース {{band}}/2%先)
- background-size: 250% 100% にして、background-position を 100%→0% へ {{period}}s の linear で無限ループさせる(帯が左から右へ走り抜ける)
- グラデーションの大部分をベース色にして、帯が通過したあとに「間」が生まれるようにする
- 要素全体ではなく文字だけが光ること(box-shadowやfilterは使わない)
- prefers-reduced-motion 時はアニメーションを止め、ベース色の静的な文字として表示する`,
  ngExample: {
    say: "「この文字をキラッとさせて」",
    why: "光の速度・幅・色が未定義。CSS filterで要素全体が明滅する実装や、opacityの点滅だけの実装が返ってくることも多い。「文字の上を帯が走る」ことが伝わらない。",
  },
  okExample: {
    say: "「text shineを実装。background-clip: text + 110degのグラデーション、幅20%のハイライト帯、background-size 250%でbackground-positionを2.5s linearの無限ループ、reduced-motionは静的表示」",
    why: "実装方式(background-clip: text)・帯の幅・周期・ループまで指定。「background-positionを動かす」の一言で文字だけが光る正しい実装になる。",
  },
  vocab: [
    {
      term: "background-clip: text",
      desc: "背景を文字の形で切り抜くプロパティ。color: transparent とセットで、文字がグラデーションの窓になる。",
    },
    {
      term: "background-size 250%",
      desc: "背景を要素より横に大きく敷く指定。position 0〜100%の全域で文字が背景に覆われたまま帯だけが移動する。",
    },
    {
      term: "linear(等速)",
      desc: "光の帯はease系だと途中で減速して不自然。走り抜ける光は等速が正解。",
    },
    {
      term: "デューティ比",
      desc: "1周期のうち帯が見えている時間の割合。ベース色の区間を長く取るほど「たまに光る」上品さが出る。",
    },
  ],
  related: ["text-highlight", "outline-fill", "wave-text"],
};
