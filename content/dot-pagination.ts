import type { MotionEntry } from "@/lib/types";

export const dotPagination: MotionEntry = {
  slug: "dot-pagination",
  category: "ui",
  nameJa: "ドットページネーション（スクロールするドット）",
  nameEn: "dot pagination / dynamic bullets / scrolling dots indicator",
  lede: "スライドの現在位置を小さな点の列で示すインジケーター。枚数が多いときは見せる点を数個に絞り、現在地に合わせて列ごと横へ送り、端の点を縮めて「まだ続きがある」を伝える。点が切り替わる瞬間に一度だけ弾ませると、どこへ移ったかが目で追える。",
  params: [
    {
      key: "visible",
      label: "visible(一度に見せる点の数)",
      min: 3,
      max: 9,
      step: 2,
      default: 5,
      desc: "5個が定番(Instagram・Swiperのdynamic bulletsも5個前後)。奇数にすると現在地が中央に来る。7個を超えると点を絞る意味が薄れる。",
    },
    {
      key: "slide",
      label: "slide(列を送る時間 s)",
      min: 0,
      max: 0.6,
      step: 0.05,
      default: 0.25,
      desc: "0.2〜0.3sが自然(Swiperは0.2s)。0にすると列が瞬間で切り替わり、どちらへ動いたかが分からなくなる。0.5sを超えると連打に追いつかない。",
    },
    {
      key: "edge",
      label: "edge(端の点の縮小率)",
      min: 0.3,
      max: 1,
      step: 0.05,
      default: 0.5,
      desc: "0.4〜0.6で「この先にもある」が伝わる。1にすると縮めない＝窓の外に続きがあるのか、ここで終わりなのかが見分けられない。",
    },
    {
      key: "blip",
      label: "blip(切り替え時の弾み 倍)",
      min: 1,
      max: 2,
      step: 0.05,
      default: 1.5,
      desc: "現在地の点を一瞬だけこの倍率まで膨らませて戻す(0.6→1.5→1が観察元の値)。1.2〜1.5が目安。1なら弾まない。1.8を超えると点がはみ出して隣と重なる。",
    },
  ],
  promptTemplate: `スライダーに dot pagination(dynamic bullets)を実装してください。

- 全スライド数ぶんの点(6〜8px の円)を等間隔の1本のトラックに並べ、外側に overflow: clip のビューポートを被せて、一度に {{visible}}個だけ見せる
- 窓の先頭 start は「現在地が窓の中央に来る位置」を 0〜(総数 − {{visible}}) に clamp して求める。start = clamp(round(現在地 − ({{visible}} − 1) / 2), 0, 総数 − {{visible}})
- トラックは transform: translateX(-start × 点の間隔) で動かし、{{slide}}s の cubic-bezier(0.16, 1, 0.3, 1) でスライドさせる。left や margin では動かさない(リフロー禁止)
- 窓の両端の点は、その外にまだ点があるときだけ scale({{edge}}) に縮める。最初・最後の点が端に来たときは縮めない(=そこで終わりの合図)
- 現在地の点は色を切り替えたうえで、切り替わるたびに 0.3s の cubic-bezier(0.34, 1.56, 0.64, 1) で scale(0.6 → {{blip}} → 1) と一度だけ弾ませる。現在地が変わったら key を付け替えてアニメーションを頭から再生し直す
- 点自体を button にし、クリック/タップでそのスライドへジャンプできるようにする(aria-label に「n枚目」、現在地には aria-current="true")。前後の矢印ボタンも併設する
- スマホではスライド本体の左右スワイプでも送れるようにする(touch-action: pan-y で縦スクロールは殺さない)
- prefers-reduced-motion 時はトラックの送りと弾みを止め、現在地の色の切り替えだけで示す`,
  ngExample: {
    say: "「スライダーの下に、インスタみたいな丸いドットを付けて」",
    why: "全スライド数ぶんの点が1列に並ぶだけの実装が返ってくる。20枚あれば20個の点がスマホの幅からはみ出し、今どこにいるかも読めない。「点を数個に絞って列ごと送る」「端を縮めて続きを示す」という、インスタのドットの本体部分は頼まないとまず入らない。",
  },
  okExample: {
    say: "「dot paginationを実装。点は5個だけ見せる窓にして、現在地が中央に来るようclampしたstartでトラックをtranslateX、0.25sで送る。窓の端の点は外に続きがあるときだけscale(0.5)。現在地はkeyを付け替えて0.6→1.5→1で一度弾ませる。点はbuttonでジャンプ可、reduced-motionでは送りと弾みを止める」",
    why: "見せる個数・窓の位置の式・送り方(transform)・端を縮める条件・弾みの値まで指定している。特に「外に続きがあるときだけ縮める」は、抜けると最初と最後の点まで縮んで終わりが分からなくなる。",
  },
  vocab: [
    {
      term: "dynamic bullets",
      desc: "Swiperの呼び名。現在地の周りだけ点を大きく見せ、離れた点を縮めて数を絞るページネーション。Instagramのカルーセルの点も同じ型。",
    },
    {
      term: "windowing",
      desc: "全要素のうち一部だけを見せる「窓」を作り、現在地に合わせて窓を動かすこと。点の数がスライド数に比例して増えなくなる。",
    },
    {
      term: "clamp",
      desc: "値を下限と上限の間に収める操作。窓の先頭をclampしないと、最初や最後のスライドで窓が端から飛び出して空白が見える。",
    },
    {
      term: "aria-current",
      desc: "「今ここ」を支援技術に伝える属性。色だけで現在地を示すと、色が見分けにくい利用者には伝わらない。",
    },
    {
      term: "overshoot easing",
      desc: "目標値を一度越えてから戻るイージング(cubic-bezierの第2・第4値が1を超える)。点が切り替わった瞬間に一度だけ弾ませるのに使う。",
    },
  ],
  related: ["carousel", "story-progress", "tab-indicator"],
};
