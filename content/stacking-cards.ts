import type { MotionEntry } from "@/lib/types";

export const stackingCards: MotionEntry = {
  slug: "stacking-cards",
  category: "scroll",
  nameJa: "スタッキングカード",
  nameEn: "stacking cards / card pile on scroll",
  lede: "スクロールするとカードが1枚ずつ画面上部に重なって積み上がっていく定番演出。実績・プラン・特徴の列挙を「めくる」体験に変え、骨格は position: sticky だけで組める。",
  params: [
    {
      key: "top",
      label: "top(積み上がる位置 px)",
      min: 0,
      max: 64,
      step: 8,
      default: 24,
      desc: "カードが固定される画面上端からの距離。固定ヘッダーがあるならその高さ分を確保する。",
    },
    {
      key: "peek",
      label: "peek(頭出しのずらし px)",
      min: 0,
      max: 24,
      step: 4,
      default: 12,
      desc: "後のカードほど下にずらし、前のカードの頭を覗かせる幅。8〜12pxで「積まれている」ことが伝わる。0だと完全に重なり枚数がわからない。",
    },
    {
      key: "scale",
      label: "scale(奥のカードの縮小幅)",
      min: 0,
      max: 0.12,
      step: 0.01,
      default: 0.05,
      desc: "1枚覆われるごとに縮む幅。0.03〜0.06が上品。0.1を超えると奥のカードが「捨てられた」ように見える。",
    },
  ],
  promptTemplate: `スクロールでカードが1枚ずつ重なって積み上がる stacking cards を実装してください。

- カードは全て同じ親リストの直下に置き、各カードを position: sticky にする。sticky が効く範囲は親の中なので、1枚ずつ包むとすぐ剥がれて積み上がらない
- top は calc({{top}}px + 順番 × {{peek}}px) とし、後のカードほど {{peek}}px ずつ下げる。積まれたカードの頭が覗いて枚数が伝わる
- カード間には十分な余白(カード高の0.5〜1倍)を取り、1枚あたりのスクロール量=体験のテンポを確保する
- 奥に沈んだカードは後続カードの進入に合わせて transform: scale を 1 → 1 − 覆われた枚数 × {{scale}} へ縮める。進捗はスクロール量を0〜1にclampして求め、書き込みはrequestAnimationFrameでtransformのみ(リフロー禁止)
- transform-origin は center top(上端で積まれるので上基準が自然)
- 祖先に overflow: hidden があると sticky が無効になる。必要なら overflow: clip を使う
- prefers-reduced-motion 時はscaleの縮小を止める(stickyの積層はアニメーションではないので残してよい)`,
  ngExample: {
    say: "「スクロールしたらカードがどんどん重なっていくやつを作って」",
    why: "scrollイベントでposition: fixedを付け外しする壊れやすい実装や、ScrollTrigger前提の重い雛形が返ってきがち。ずらし幅・縮小率も決まらないので、全カードが同じ位置に完全に重なって「1枚しかない」ように見える結果も多い。",
  },
  okExample: {
    say: "「stacking cardsをposition: stickyで。カードは同一リスト直下、top: 24px+順番×12px、カード間余白はカード高の0.7倍。奥のカードは覆われるごとにscaleを0.05ずつ縮小(rAF+transformのみ、origin: center top)」",
    why: "積層の方式(同一親のsticky+ずらし)と沈み方(scaleの幅・基準点)まで数値で指定。「カード間余白」を言えると1枚あたりのスクロール量、つまり見せるテンポまで制御できる。",
  },
  vocab: [
    {
      term: "position: sticky積層",
      desc: "同じ親の中で各カードをstickyにして同じtop付近に留めると、後から来たカードが自然に上へ重なる。JS不要の積層構造。",
    },
    {
      term: "頭出し(peek)",
      desc: "後のカードのtopをずらして前のカードの上端を覗かせること。積まれた枚数と「まだ続く」ことの手掛かりになる。",
    },
    {
      term: "transform-origin: center top",
      desc: "縮小の基準点。上端基準で縮めると、積まれた上端が揃ったまま奥へ沈んで見える。",
    },
    {
      term: "カード間余白",
      desc: "カード1枚が画面を占有するスクロール量を決める距離。広げるほど1枚をじっくり見せるテンポになる。",
    },
  ],
  related: ["sticky-pin", "scroll-snap", "parallax"],
};
