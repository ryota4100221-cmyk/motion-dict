import type { MotionEntry } from "@/lib/types";

export const mouseParallax: MotionEntry = {
  slug: "mouse-parallax",
  category: "hover",
  nameJa: "マウスパララックス",
  nameEn: "mouse parallax layers",
  lede: "マウス位置に応じて複数のレイヤーが異なる深度で動き、平面に奥行きが生まれる動き。FVのビジュアルに立体感を足す定番。層ごとのdepth(移動係数)の付け方がすべて。",
  params: [
    {
      key: "strength",
      label: "strength(最前層の移動量 px)",
      min: 8,
      max: 60,
      step: 2,
      default: 24,
      desc: "最前面レイヤーの最大移動量。16〜30pxが上品。大きすぎると酔う。",
    },
    {
      key: "lerp",
      label: "lerp(追従の粘り)",
      min: 0.03,
      max: 0.3,
      step: 0.01,
      default: 0.08,
      desc: "小さいほど「ぬるっと」遅れて動く。0.06〜0.1が滑らか。",
    },
    {
      key: "direction",
      label: "direction(動く向き)",
      min: 0,
      max: 1,
      step: 1,
      default: 1,
      options: ["same", "invert"],
      desc: "same=カーソルと同方向、invert=逆方向。invertの方が「覗き込む」奥行き感が出る。",
    },
  ],
  promptTemplate: `FVビジュアルに mouse parallax layers を実装してください。

- レイヤーを3層重ね、各層に depth 係数を割り当てる(奥 0.3 / 中 0.6 / 手前 1.0)
- マウス位置をコンテナ中心基準で -1〜1 に正規化する
- 各層の移動量は 正規化座標 × {{strength}}px × depth とし、方向は {{direction}}(same=カーソルと同方向 / invert=逆方向)にする
- 位置は毎フレーム lerp(係数 {{lerp}})で補間し、遅れて動く質感にする
- 移動は transform: translate のみで行う(リフローさせない)
- マウスがコンテナを離れたら全層をゆっくり中央へ戻す
- prefers-reduced-motion 時はレイヤーを動かさない`,
  ngExample: {
    say: "「マウスに合わせてパララックスさせて」",
    why: "parallaxという語だけではスクロール連動の実装が返ってくることが多い。マウス連動だと伝わっても、全層が同じ量で動く「ただの追従」になりがち。層ごとのdepth設計こそが奥行きの正体なのに、そこが指定されない。",
  },
  okExample: {
    say: "「mouse parallax layersを実装。3層にdepth 0.3/0.6/1.0を割り当て、正規化したマウス座標×24px×depthをlerp 0.08で補間、方向はinvert」",
    why: "スクロールでなくマウス連動であること・層数とdepth比・移動量・補間まで指定。depthの比率を渡すだけで「平面が立体になる」瞬間を再現できる。",
  },
  vocab: [
    {
      term: "depth",
      desc: "層ごとの移動係数。手前ほど大きく、奥ほど小さく動かすと視差=奥行きに見える。",
    },
    {
      term: "正規化",
      desc: "マウス座標をコンテナ中心基準の-1〜1に変換すること。画面サイズに依存しない移動量計算の土台。",
    },
    {
      term: "lerp",
      desc: "線形補間。毎フレーム目標位置に少しずつ近づける計算。層の動きに慣性の質感を与える。",
    },
    {
      term: "parallaxとの違い",
      desc: "無印のparallaxはスクロール量に連動して縦に動く。mouse parallaxはカーソル位置に連動して全方向に動く。入力源が違う別の動き。",
    },
  ],
  related: ["parallax", "tilt", "image-parallax-hover"],
};
