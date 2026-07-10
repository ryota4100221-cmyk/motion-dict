import type { MotionEntry } from "@/lib/types";

export const fillHover: MotionEntry = {
  slug: "fill-hover",
  category: "hover",
  nameJa: "ボタン背景フィル",
  nameEn: "fill hover / slide fill button",
  lede: "ホバーでボタンの背景色が一方向からスッと満ち、文字色が反転する定番演出。擬似要素をtransformで伸ばすだけの軽い実装で、CTAボタンが一段リッチに見える。",
  params: [
    {
      key: "duration",
      label: "duration(満ちる時間 s)",
      min: 0.2,
      max: 0.8,
      step: 0.05,
      default: 0.35,
      desc: "0.25〜0.4sが定番。0.5sを超えるとクリック前の待ち時間として意識され始める。",
    },
    {
      key: "direction",
      label: "direction(満ちる起点)",
      min: 0,
      max: 2,
      step: 1,
      default: 0,
      options: ["left", "bottom", "center"],
      desc: "満ち始める起点。leftが最も定番。bottomは重厚、centerはスピード感が出る。",
    },
  ],
  promptTemplate: `ボタンに fill hover(背景フィル)を実装してください。

- 塗りは ::before 擬似要素で作り、ボタンの塗り色で満たして transform: scaleX(0) で隠しておく
- ホバーで scaleX(1) に、{{duration}}s の ease-out で満たす
- 満ちる起点は {{direction}}(transform-origin で制御。bottom の場合は scaleY で縦に伸ばす)
- テキストは擬似要素より上のレイヤーに置き、文字色を同じ duration で反転させる
- background-position や width ではなく transform で動かす(リフローさせない)
- マウスが離れたら同じ duration で元に戻す
- prefers-reduced-motion 時はアニメーションなしで即座に色を切り替える`,
  ngExample: {
    say: "「ホバーしたらボタンの色が変わるようにして」",
    why: "background-colorを単純にtransitionするだけの実装が返ってくる。「一方向から満ちる」という方向性が伝わらず、background-positionやwidthを動かす重い実装になることも多い。",
  },
  okExample: {
    say: "「fill hoverを::before + scaleXで実装。transform-origin: left、0.35s ease-out、文字色も同durationで反転、transformのみでリフロー禁止」",
    why: "実装方式(擬似要素+scaleX)・起点・数値・文字色の同期まで指定。「transformのみ」の一言でbackground-positionを動かす劣化実装を防げる。",
  },
  vocab: [
    {
      term: "::before",
      desc: "要素の先頭に生成される擬似要素。塗りレイヤーをここに持たせるとHTMLを増やさず背面に敷ける。",
    },
    {
      term: "transform-origin",
      desc: "変形の基準点。scaleX(0→1)がどこから満ち始めるかはここで決まる。leftなら左から右へ満ちる。",
    },
    {
      term: "z-index / stacking",
      desc: "テキストを塗りより上に保つ重ね順の制御。テキスト側にposition: relativeを与えて塗りの上に出すのが定石。",
    },
    {
      term: "文字色の反転",
      desc: "塗りの到達と同時に文字色を切り替える。durationを塗りと揃えると一体に見える。mix-blend-mode: differenceで自動反転させる手もある。",
    },
  ],
  related: ["underline-reveal", "magnetic-hover", "lift-hover"],
};
