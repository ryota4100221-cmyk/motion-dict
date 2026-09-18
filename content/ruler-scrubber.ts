import type { MotionEntry } from "@/lib/types";

export const rulerScrubber: MotionEntry = {
  slug: "ruler-scrubber",
  category: "ui",
  nameJa: "目盛スクラバー",
  nameEn: "ruler scrubber / tick-mark ruler picker",
  lede: "定規のような目盛の列が、画面中央に据え置かれた針の下を流れていく値の表示器。バーの伸びで割合を示すprogress系と違い「いま何番目か」を刻みの数で数えさせられるので、値選択・ズーム倍率・長尺ページの現在地に効く。針の周りだけ刻みが伸びる一手で、どこを読めばいいかが指示なしで伝わる。",
  params: [
    {
      key: "pitch",
      label: "pitch(目盛の間隔 px)",
      min: 6,
      max: 20,
      step: 1,
      default: 12,
      desc: "刻みの密度。12pxが読みやすさと情報量の折り合いで、出典サイトもこの値。8pxを切ると線の束になって数えられない。",
    },
    {
      key: "majorEvery",
      label: "majorEvery(何本ごとに長い目盛＋ラベル)",
      min: 4,
      max: 12,
      step: 1,
      default: 10,
      desc: "5か10が数えやすい(指の本数と同じ理由)。出典サイトは等間隔ではなく章の境目に置いていて、これは「節目に意味がある」場合の変則版。",
    },
    {
      key: "focusTicks",
      label: "focusTicks(針の周りで伸びる本数)",
      min: 1,
      max: 8,
      step: 1,
      default: 3,
      desc: "片側何本ぶんを持ち上げるか。出典サイトの実測値は3本で、これが「針元だけ」と読める上限。6本を超えると山が広がって針の位置がぼやける。",
    },
    {
      key: "edgeFade",
      label: "edgeFade(左右端のフェード幅 %)",
      min: 0,
      max: 30,
      step: 1,
      default: 8,
      desc: "窓幅に対するmaskのぼかし幅。8%で「まだ先がある」が出る。0にすると目盛がスパッと切れて、有限の目盛表に見えてしまう。",
    },
  ],
  promptTemplate: `値表示器として ruler scrubber を実装してください。

- 固定幅の窓（overflow: hidden）の中に、目盛を {{pitch}}px 間隔で並べた帯（track）を絶対配置で置く
- 針は窓の中央に固定し、動かすのは帯だけ。帯は transform: translateX(中央座標 - 進捗 × 帯の全長) で動かす（leftやscrollLeftではなくtransform。リフローさせない）
- 目盛は {{majorEvery}} 本ごとを長い目盛（18px）＋数値ラベル、それ以外を短い目盛（9px）にする
- 針から片側 {{focusTicks}} 本ぶんの範囲にある短い目盛だけ、長い目盛の高さまで伸ばす。
  伸び量は距離の smoothstep（o*o*(3-2*o)）で補間し、height ではなく transform: scaleY() と transform-origin: center top で描く
- 窓には mask-image: linear-gradient(90deg, transparent 0, #000 {{edgeFade}}%, #000 calc(100% - {{edgeFade}}%), transparent 100%) をかけて左右端を溶かす
- ドラッグ（pointerdown/move）で進捗を指に1:1で追従させ、0〜1にクランプする。タッチでも同じ操作ができるよう touch-action: none を指定する
- 針の直下の値は毎フレーム再レンダーせず、DOMの textContent を直接書き換える（目盛のscaleYも同様に、値が変わった目盛だけ書く）
- prefers-reduced-motion 時は自走スイープを止めて静止状態で表示し、ドラッグ時も補間なしで即座に位置を反映する`,
  ngExample: {
    say: "「スクロール位置がわかる定規みたいなインジケーターを付けて」",
    why: "「定規みたい」だけでは、流れるのが目盛なのか針なのかが決まらない。針が動く実装（＝ただの横棒プログレス）が返ってきて、刻みを数えられるという肝が消える。目盛の間隔・長短の比・針元の強調も全部相手任せになる。",
  },
  okExample: {
    say: "「ruler scrubberを実装。針は中央固定で、目盛の帯だけをtranslateXで動かす。目盛は12px間隔、10本ごとに長い目盛＋ラベル。針から±3本の短い目盛をsmoothstepで18pxまでscaleYで伸ばす。窓は左右8%をmask-imageでフェード。reduced-motion時は自走停止」",
    why: "「動くのは帯、針は固定」という役割分担を最初に決めているので、横棒プログレスに化けない。強調の範囲と補間曲線まで数値で渡しているため、針元の山の形が再現される。",
  },
  vocab: [
    {
      term: "major tick / minor tick",
      desc: "長い目盛と短い目盛。長短の2階層があるだけで数を数える手間が一気に下がる。ラベルは長い目盛にだけ付ける。",
    },
    {
      term: "indicator / needle",
      desc: "読み取り位置を示す針。これを固定して目盛を流すのがスクラバー、目盛を固定して針を動かすのがプログレスバー。同じ情報でも「数えられるか」が変わる。",
    },
    {
      term: "smoothstep",
      desc: "o*o*(3-2*o)。両端の傾きが0になる補間で、針元の強調が「山」ではなく「なだらかな盛り上がり」になる。線形補間だと稜線に折れ目が見える。",
    },
    {
      term: "mask-image のエッジフェード",
      desc: "窓の左右端をlinear-gradientの透明で溶かす手法。overflow: hiddenの直線の切れ目を隠し、目盛が続いていることを示す。",
    },
    {
      term: "transform-origin: center top",
      desc: "目盛をscaleYで伸ばすときの起点。topに置くと上端が揃ったまま下へ伸び、目盛の頭が波打たない。",
    },
  ],
  related: ["story-progress", "scroll-progress", "drag-scroll"],
};
