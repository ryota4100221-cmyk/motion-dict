import type { MotionEntry } from "@/lib/types";

export const rotatingBadge: MotionEntry = {
  slug: "rotating-badge",
  category: "text",
  nameJa: "回転バッジ",
  nameEn: "rotating badge / rotating circular text",
  lede: "円形に組んだテキストがゆっくり回転し続けるバッジ。CTAやスクロールサインの定番で、SVGのtextPathで組んでlinearで回すだけ。速度と回転中心の固定が品質のすべて。",
  params: [
    {
      key: "duration",
      label: "duration(1周の秒数 s)",
      min: 4,
      max: 30,
      step: 1,
      default: 12,
      desc: "10〜15sが「気配」として心地いい。6s以下は回転が主張しすぎて本文から視線を奪う。",
    },
    {
      key: "direction",
      label: "direction(回転方向)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["clockwise", "counter-clockwise"],
      desc: "時計回りが基本。矢印など中央の要素が示す向きと喧嘩しない方を選ぶ。",
    },
  ],
  promptTemplate: `CTAまわりに rotating badge を実装してください。

- SVG(viewBox 0 0 100 100)に半径36の円形パスをdefsに定義し、textPath で「Scroll down · 」の繰り返しを円周に沿って組む
- textLength を円周(2πr ≒ 226)に合わせ、lengthAdjust="spacing" で文字を等間隔に分配する(繰り返し文の切れ目を作らない)
- テキストを包む g を CSS keyframes の rotate(0→360deg)、{{duration}}s の linear 無限ループで回す。回転方向は {{direction}}
- 回転中心はSVG中央に固定する(transform-box: view-box と transform-origin: center を指定する)
- 中央には矢印・ロゴなど静止した要素を置き、回転はテキストのリング側だけに与える
- イージングは必ずlinear。easeを入れると1周ごとに加減速して安っぽく見える
- prefers-reduced-motion 時は回転を止め、円形テキストを静止した状態で表示する`,
  ngExample: {
    say: "「ぐるぐる回る丸い文字のバッジを付けて」",
    why: "円形組版の方式が未指定だと、文字を1個ずつCSSでrotate配置する崩れやすい実装や、テキストを画像化した保守不能な実装が返ってくる。回転中心の指定がないと偏心してガタガタ回る。",
  },
  okExample: {
    say: "「rotating badgeをSVG textPathで実装。r=36の円にtextLength226で等間隔に組み、12s linear infiniteで時計回り。transform-box: view-boxで中心固定、中央の矢印は静止、reduced-motion時は回転停止」",
    why: "組版方式(textPath)・等間隔の作り方・速度・回転中心の固定まで指定している。「linearで」「中心固定」の2点が、ヌルッと上質に回るかガタつくかの分かれ目。",
  },
  vocab: [
    {
      term: "textPath",
      desc: "SVGでテキストをパスに沿わせる要素。円形組版はCSSで文字を1個ずつ回して並べるよりこれが確実で崩れない。",
    },
    {
      term: "textLength / lengthAdjust",
      desc: "テキストの描画幅を強制する属性。円周の長さに一致させてspacingで分配すると、繰り返し文の切れ目が消える。",
    },
    {
      term: "transform-box: view-box",
      desc: "SVG要素へのCSS変形の基準をviewBoxにする指定。これがないとtransform-originが効かず、回転中心がズレて偏心する。",
    },
    {
      term: "linear",
      desc: "一定速度のイージング。無限回転は必ずlinear。デフォルトのeaseのままだと1周ごとに呼吸するような加減速がつく。",
    },
  ],
  related: ["marquee", "circular-progress", "scroll-marquee"],
};
