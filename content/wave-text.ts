import type { MotionEntry } from "@/lib/types";

export const waveText: MotionEntry = {
  slug: "wave-text",
  category: "text",
  nameJa: "波打ちテキスト",
  nameEn: "wavy text / kinetic wave",
  lede: "文字が1字ずつsin波で上下に揺れ続けるキネティックタイポグラフィ。ロゴやマーキーの装飾に置くだけで画面に鼓動が生まれる。文字ごとの位相ずらしが波に見せる鍵。",
  params: [
    {
      key: "amplitude",
      label: "amplitude(振幅 px)",
      min: 2,
      max: 16,
      step: 1,
      default: 6,
      desc: "4〜8pxが読みやすさを保てる上限。フォントサイズの1割前後が目安。",
    },
    {
      key: "speed",
      label: "speed(1周期 s)",
      min: 0.6,
      max: 4,
      step: 0.1,
      default: 1.6,
      desc: "1.2〜2sがゆったり心地よい。1s未満はせわしなく、キッズ・遊び系の印象になる。",
    },
  ],
  promptTemplate: `テキストに wavy text(sin波で揺れ続けるキネティックタイポ)を実装してください。

- テキストを1文字ずつ span に分割する(spanは display: inline-block)
- CSSキーフレームで translateY を -{{amplitude}}px 〜 {{amplitude}}px の間で往復させる(ease-in-outでsin波を近似)
- animation-duration は {{speed}}s、animation-iteration-count: infinite
- 文字ごとに animation-delay を負の値でずらす(-i × {{speed}}s ÷ 文字数)。波が最初から完成した形で左から右へ流れて見える
- top や margin ではなく transform で動かす(リフローさせない)
- 適用はロゴ・装飾テキストに限定し、本文には使わない
- prefers-reduced-motion 時はアニメーションを止めて静止テキストを表示する`,
  ngExample: {
    say: "「文字を波みたいに揺らして」",
    why: "振幅も周期も決まらないうえ、位相のずらし方を指定しないと全文字が同時に上下するだけで波に見えない。marginやtopをアニメーションさせてガタつく実装が返ってくることもある。",
  },
  okExample: {
    say: "「wavy textをCSSキーフレームで。1文字ずつspan分割、translateYで振幅6px・周期1.6s・infinite、animation-delayを-i×(1.6÷文字数)sずらして波を流す。transformのみでリフロー禁止」",
    why: "分割単位・振幅・周期・位相のずらし方まで数値で指定。「負のdelay」の指定で、再生開始の瞬間から波形が揃った状態になる。",
  },
  vocab: [
    {
      term: "キネティックタイポグラフィ",
      desc: "文字そのものを動かして印象を作る手法の総称。読ませる文字ではなく見せる文字に使う。",
    },
    {
      term: "animation-delay(負の値)",
      desc: "負の値を指定するとアニメーションの途中から始まる。文字ごとの位相ずらしの定石。",
    },
    {
      term: "位相(phase)",
      desc: "波のどの位置にいるか。文字ごとに少しずつずらすと、全体が1本のつながった波として流れる。",
    },
    {
      term: "sin波",
      desc: "滑らかな往復運動。CSSならease-in-outの往復キーフレームで近似、JSならMath.sin(t)で正確に作れる。",
    },
  ],
  related: ["marquee", "typewriter", "blur-reveal"],
};
