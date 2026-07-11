import type { MotionEntry } from "@/lib/types";

export const sharedElement: MotionEntry = {
  slug: "shared-element",
  category: "transition",
  nameJa: "モーフ遷移",
  nameEn: "shared element transition / FLIP",
  lede: "サムネイルをクリックすると、その要素自体が拡大・移動して次の画面の主役に変形する遷移。画面をまたいで「同じもの」が動き続けるため文脈が切れない。First/Last/Invert/PlayのFLIPテクニックが核で、View Transitions APIの中身も原理は同じ。",
  params: [
    {
      key: "duration",
      label: "duration(モーフ時間 s)",
      min: 0.3,
      max: 1.2,
      step: 0.05,
      default: 0.6,
      desc: "0.5〜0.7sが目安。移動距離が長いほど気持ち長めにすると目で追いやすい。",
    },
    {
      key: "easing",
      label: "easing(Playのイージング)",
      min: 0,
      max: 2,
      step: 1,
      default: 0,
      options: ["ease-out", "ease-in-out", "overshoot"],
      desc: "ease-outが基本。overshootは少し行き過ぎて戻る遊びで、多用すると軽薄になる。",
    },
  ],
  promptTemplate: `サムネイル→詳細画面の shared element transition をFLIPで実装してください。

- クリック直後、遷移前のサムネイルの位置とサイズを getBoundingClientRect で計測する(First)
- レイアウトを詳細画面に切り替え、移動先のヒーロー要素の位置とサイズを計測する(Last)
- FirstとLastの差分から translate と scale を逆算し、ヒーロー要素に「まだ元の位置にいる」ように見えるtransformを一旦かける(Invert)。ここまでを1フレーム内で終わらせる
- そこから transform: none へ {{duration}}s で再生する(Play)。イージングは {{easing}}(overshootなら cubic-bezier(0.34, 1.56, 0.64, 1) のような行き過ぎ系)
- transform-origin: top left を明示し、アニメーションはtransformのみで行う(width/height/top/leftは動かさない。リフロー禁止)
- サムネイルとヒーローの縦横比が違うとscaleで絵が歪むため、できるだけaspect-ratioを揃える
- prefers-reduced-motion 時はFLIPを行わず、即時切り替えか短いフェードにする`,
  ngExample: {
    say: "「クリックしたら画像が次のページに繋がるように動かして」",
    why: "手順名(FLIP)がないと、ただのフェード遷移や、画像をposition: fixedにしてtop/leftをアニメーションさせるカクつく実装が返ってくる。「切り替えの前後で計測する」というタイミングが伝わらないのが失敗の主因。",
  },
  okExample: {
    say: "「shared element transitionをFLIPで実装。クリック時にFirstを計測→レイアウト切替→Lastを計測→Invertを同一フレームで適用→0.6s ease-outでtransform: noneへPlay。origin top left、transformのみ」",
    why: "First/Last/Invert/Playの4手順を明示すれば実装の骨格が揺れない。「同一フレームで」の一言がInvert前の素のレイアウトが一瞬見えるチラつきを防ぐ。",
  },
  vocab: [
    {
      term: "FLIP",
      desc: "First/Last/Invert/Playの頭文字。先に最終レイアウトへ切り替えてしまい、transformで元の位置に見せかけてから再生する発想の転換。レイアウト計算は最初の1回だけで済む。",
    },
    {
      term: "getBoundingClientRect",
      desc: "要素の画面上の位置とサイズを取る計測API。FLIPのFirstとLastはこれで取る。transform適用中の要素では変形後の見た目の矩形が返る。",
    },
    {
      term: "Invert",
      desc: "Last基準のレイアウトにFirst−Lastの差分transformをかけ、「まだ動いていない」ように見せる工程。切り替えと同じフレーム内で終えないと一瞬先のレイアウトが見えてしまう。",
    },
    {
      term: "View Transitions API",
      desc: "この遷移をブラウザが標準サポートするAPI。view-transition-nameを付けた要素同士が自動でモーフする。中身の原理はFLIPと同じなので、非対応環境のフォールバックにも手順の知識が要る。",
    },
  ],
  related: ["lightbox", "circle-reveal", "modal-pop"],
};
