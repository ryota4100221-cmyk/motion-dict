import type { MotionEntry } from "@/lib/types";

export const flyToCart: MotionEntry = {
  slug: "fly-to-cart",
  category: "ui",
  nameJa: "フライトゥカート",
  nameEn: "fly to cart / add-to-cart animation",
  lede: "「カートに入れる」を押すと商品画像の分身が弧を描いてカートアイコンへ縮みながら飛び、着地と同時にバッジが跳ねて数字が増える動き。「押した」と「入った」を1本の線でつなぐECの定番で、macOSのウィンドウ最小化と骨格は同じ「目標へ飛ばして縮める」型。",
  params: [
    {
      key: "duration",
      label: "duration(飛行時間 s)",
      min: 0.3,
      max: 1.2,
      step: 0.05,
      default: 0.7,
      desc: "0.6〜0.8sが定番。0.4sを切ると何が飛んだか読めず、1sを超えると操作が待たされる。",
    },
    {
      key: "arc",
      label: "arc(弧の高さ px)",
      min: 0,
      max: 100,
      step: 10,
      default: 70,
      desc: "0だと直線移動で機械的になる。移動距離の3〜4割ぶん持ち上げると「放って受け止めた」と読める。持ち上げすぎると画面外へ抜ける。",
    },
    {
      key: "endScale",
      label: "endScale(着地サイズ %)",
      min: 5,
      max: 50,
      step: 5,
      default: 15,
      desc: "着地した瞬間の分身の大きさ。受け皿のアイコンと同じかやや小さい10〜20%が自然。",
    },
    {
      key: "bump",
      label: "bump(着地の跳ね %)",
      min: 0,
      max: 40,
      step: 5,
      default: 20,
      desc: "着地に合わせてカートを膨らませる量。15〜25%で「受け取った」が伝わる。40%は漫画寄り。",
    },
  ],
  promptTemplate: `商品カードに fly to cart(カートへ飛ぶ)アニメーションを実装してください。

- 「カートに入れる」押下時、商品サムネイルを複製した分身(クローン)を position: fixed で最前面に置く
- 出発点=サムネイルの矩形、到達点=カートアイコンの中心。両方 getBoundingClientRect() で実測し、中心どうしの差分を --dx / --dy として渡す
- 飛行は {{duration}}s。外側の要素で位置(translate)、内側の要素で拡縮(scale)を動かす(1つの要素にtransformを重ねると後勝ちで壊れる)
- 直線ではなく弧を描く。中間フレームで {{arc}}px ぶん上に持ち上げてから落とす
- 着地時のスケールは {{endScale}}%。到達と同時に分身を削除し、カートアイコンを {{bump}}% 膨らませてから戻す。バッジの数字はこのタイミングで増やす
- 連打に耐えること。分身は1発ごとに独立させ、前の分身を消さずに重ねる
- 動かすのは transform と opacity のみ。left/top のアニメーションはリフローを起こすので禁止
- prefers-reduced-motion: reduce のときは飛ばさない。分身を出さず、バッジの数字を即座に増やし、カートを短くハイライトするだけにする`,
  ngExample: {
    say: "「カートに入れたら商品がカートに飛んでいくやつ、つけて」",
    why: "「飛んでいく」だけでは弧も速度も着地サイズも決まらない。left/topを直線でアニメーションさせる重い実装や、飛んだのにバッジが増えない(=一番伝えたい結果が抜けた)実装が返ってくる。",
  },
  okExample: {
    say: "「fly to cart を実装。サムネイルのクローンをfixedで飛ばす。出発点と到達点はgetBoundingClientRectで実測、外側でtranslate・内側でscaleを分けて0.7s、中間で80px持ち上げて弧にする。着地で15%まで縮めて削除し、カートを20%バンプさせてバッジを+1。transformとopacityのみ、連打で重なる」",
    why: "実測方式・要素の入れ子・弧の作り方・着地後の結果(バッジ更新)まで指定している。「transformとopacityのみ」「連打で重なる」の2行が実装品質と破綻しにくさを決める。",
  },
  vocab: [
    {
      term: "getBoundingClientRect()",
      desc: "要素のビューポート基準の矩形を実測するAPI。出発点と到達点の中心差分は、これで測らないと余白やスクロール量のぶんズレる。",
    },
    {
      term: "クローン(分身)",
      desc: "飛ばすために複製した見た目だけの要素。元のサムネイルは動かさないので、レイアウトが崩れず一覧のスクロールも止まらない。",
    },
    {
      term: "アーク(弧)",
      desc: "出発点と到達点を結ぶ放物線状の軌道。直線移動よりも「手で運ばれた」感が出る。中間キーフレームで上方向のオフセットを足して作る。",
    },
    {
      term: "バンプ",
      desc: "受け取り側を一瞬だけ膨らませて戻す反応。飛ばしっぱなしにせず着地を受け止めることで、動きが1つの因果として読める。",
    },
    {
      term: "transform分離",
      desc: "位置と拡縮を親子の別要素に分ける設計。1要素のtransformに両方書くと片方が上書きされ、別々のイージングも当てられない。",
    },
  ],
  related: ["shared-element", "dock-magnify", "confetti-burst"],
};
