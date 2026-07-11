import type { MotionEntry } from "@/lib/types";

export const hoverWave: MotionEntry = {
  slug: "hover-wave",
  category: "hover",
  nameJa: "ホバーウェーブ",
  nameEn: "hover wave / char bounce",
  lede: "ナビリンクにホバーすると、文字が1字ずつ順に跳ねて波が左から右へ走る動き。animation-delayを1字ずつずらすだけの仕組みで、ヘッダーナビに遊び心を足す定番。",
  params: [
    {
      key: "delay",
      label: "delay(1字ごとの遅延 s)",
      min: 0.02,
      max: 0.12,
      step: 0.01,
      default: 0.04,
      desc: "波の伝わる速さ。0.03〜0.05sが軽快。0.1s超は波というより順番待ちに見える。",
    },
    {
      key: "height",
      label: "height(跳ねる高さ px)",
      min: 3,
      max: 20,
      step: 1,
      default: 8,
      desc: "文字が持ち上がる量。ナビサイズなら6〜10pxで十分。大きいほどコミカル。",
    },
    {
      key: "duration",
      label: "duration(1字の跳ね時間 s)",
      min: 0.2,
      max: 0.8,
      step: 0.05,
      default: 0.4,
      desc: "1文字が上がって戻るまでの時間。0.3〜0.5sが自然。",
    },
  ],
  promptTemplate: `ナビリンクに hover wave を実装してください。

- リンクのテキストを1文字ずつ span に分割する(inline-blockにしないとtransformが効かない)
- ホバーで各文字に translateY(-{{height}}px) して戻るキーフレームアニメーションを1回だけ再生する
- 1文字の再生時間は {{duration}}s、i文字目の animation-delay は i × {{delay}}s にして波を左から右へ伝播させる
- アニメーションは transform のみで行う(top や margin を動かさない)
- 再ホバーで波がもう一度先頭から走るように、アニメーションをリスタートできる作りにする
- prefers-reduced-motion 時は跳ねを無効化し、色の変化などで代替する`,
  ngExample: {
    say: "「ナビの文字をホバーで波打たせて」",
    why: "常時ゆらゆら動き続けるwave-text系の実装が返ってきがち。ホバーで1回だけ波が走る動きとは別物。delayの伝播設計とリスタート処理が伝わらず、2回目のホバーで動かない実装も多い。",
  },
  okExample: {
    say: "「hover waveを実装。1文字ずつspan分割し、translateY(-8px)のkeyframesを1回再生、delayはi×0.04sで伝播、再ホバーでリスタート可能に」",
    why: "分割方法・動かすプロパティ・伝播の計算式・再生回数まで指定。「1回だけ」と「リスタート」を明示するのが常時アニメーションとの分岐点。",
  },
  vocab: [
    {
      term: "animation-delay",
      desc: "アニメーションの開始を遅らせる指定。i文字目にi×一定値を与えると波の伝播になる。",
    },
    {
      term: "stagger",
      desc: "複数要素を少しずつ時間をずらして動かす手法の総称。GSAPなら stagger: 0.04 の1行で済む。",
    },
    {
      term: "inline-block",
      desc: "インライン要素のspanはtransformが効かない。文字分割したspanには必ずこれを指定する。",
    },
    {
      term: "wave-textとの違い",
      desc: "wave-textは常時揺れ続ける環境的な動き。hover waveはホバー発火で1回だけ走る応答的な動き。",
    },
  ],
  related: ["wave-text", "split-text-reveal", "underline-reveal"],
};
