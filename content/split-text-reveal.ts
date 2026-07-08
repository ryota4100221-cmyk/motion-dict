import type { MotionEntry } from "@/lib/types";

export const splitTextReveal: MotionEntry = {
  slug: "split-text-reveal",
  category: "text",
  nameJa: "分割テキストリビール",
  nameEn: "split text reveal / stagger text",
  lede: "見出しを1文字(または1行)ずつに分割し、overflow: hiddenのマスクの中から時間差でせり上がって現れる動き。Awwwards系サイトのFVタイトルで最頻出のテキスト演出。",
  params: [
    {
      key: "stagger",
      label: "stagger(文字間の時間差 ms)",
      min: 10,
      max: 120,
      step: 5,
      default: 30,
      desc: "小さいほど一斉に、大きいほど1文字ずつ丁寧に出る。30前後が定番。",
    },
    {
      key: "yOffset",
      label: "yOffset(移動距離 px)",
      min: 10,
      max: 80,
      step: 5,
      default: 30,
      desc: "隠れている位置の深さ。文字サイズの1/2〜1倍程度が自然。",
    },
    {
      key: "duration",
      label: "duration(1文字の表示時間 s)",
      min: 0.2,
      max: 1.2,
      step: 0.05,
      default: 0.6,
      desc: "短いと軽快、長いとゆったり上品。staggerとのバランスで決める。",
    },
  ],
  promptTemplate: `見出しに split text reveal を実装してください。

- テキストを1文字ずつspanに分割し、各文字を overflow: hidden の行内マスクで包む
- 各文字は translateY({{yOffset}}px)・opacity 0 の状態から {{duration}}s かけて元の位置へせり上がる
- 文字ごとに {{stagger}}ms ずつ transition-delay(またはGSAPのstagger)をずらす
- イージングは cubic-bezier(0.22, 1, 0.36, 1) のような強めのease-out
- 再実行時は transition を切って初期位置へ戻してから再生する(リセット処理を忘れない)
- prefers-reduced-motion 時は分割アニメーションを行わず全文を即表示する`,
  ngExample: {
    say: "「文字がパラパラって順番に出てくるようにして」",
    why: "「パラパラ」だけでは出現の方向・移動距離・時間差が全部未定義。マスク(行内クリップ)の有無も伝わらないため、単純なfade-inのforループが返ってきがち。",
  },
  okExample: {
    say: "「split text revealを実装。1文字ずつ分割してoverflow:hiddenのマスク内から、translateY 30px・duration 0.6s・stagger 30msで下からせり上げる。ease-out強め、reduced-motionは即表示」",
    why: "分割単位・マスク・距離・時間差・イージングまで数値で指定している。特に「マスクの中から出る」の一言で仕上がりの品が大きく変わる。",
  },
  vocab: [
    {
      term: "SplitText",
      desc: "テキストを文字・単語・行単位のspanに分割するGSAPのプラグイン。手書きならsplit(\"\")とmapで同じことができる。",
    },
    {
      term: "stagger",
      desc: "複数要素のアニメーション開始を一定間隔ずつずらすこと。時間差表示の正体で、値ひとつでリズムが決まる。",
    },
    {
      term: "行内マスク",
      desc: "overflow: hiddenの親で文字をクリップし、行の中から生えてくるように見せる手法。fade-inとの品の差はここで生まれる。",
    },
    {
      term: "FOUC対策",
      desc: "JS読込前に生テキストが一瞬見えてしまう問題。初期stateをCSSで隠すか、分割前のテキストを表示したままにするかを決めておく。",
    },
  ],
  related: ["text-scramble", "typewriter", "clip-reveal"],
};
