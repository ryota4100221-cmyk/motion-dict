import type { MotionEntry } from "@/lib/types";

export const parallax: MotionEntry = {
  slug: "parallax",
  category: "scroll",
  nameJa: "パララックス",
  nameEn: "parallax scrolling",
  lede: "スクロール量に応じて背景と前景を異なる速度で動かし、画面に奥行きを生む動き。背景が少し遅れて動くだけで、平面のレイアウトに空間の層が生まれる。",
  params: [
    {
      key: "strength",
      label: "strength(視差の強さ)",
      min: 0.05,
      max: 0.6,
      step: 0.05,
      default: 0.2,
      desc: "前景に対する背景の速度差。0.2前後が上品。0.5を超えると酔いやすい。",
    },
    {
      key: "lerp",
      label: "lerp(追従の粘り)",
      min: 0.03,
      max: 0.3,
      step: 0.01,
      default: 0.1,
      desc: "小さいほど背景がぬるっと遅れて追従する。大きいと即時に近い。",
    },
  ],
  promptTemplate: `背景レイヤーに parallax scrolling を実装してください。

- スクロール量(scrollY)を毎フレーム読み、背景を translateY(-scrollY × {{strength}}) で前景よりゆっくり動かす
- transform の反映は requestAnimationFrame + lerp(係数 {{lerp}})で補間し、scrollイベント直付けのカクつきを消す
- scroll イベント内では値の更新のみ行い、style の書き込みは rAF 側に寄せる
- 背景レイヤーは移動域のぶん大きめに作り、端の見切れを防ぐ
- prefers-reduced-motion 時は視差を無効化してレイヤーを固定する`,
  ngExample: {
    say: "「背景に奥行き出して、パララックスっぽくして」",
    why: "「っぽく」は実装方式の丸投げ。background-attachment: fixedだけの古い実装や、動きすぎて酔う実装が返ってきやすい。強さ・方向・補間の有無がすべて未定義。",
  },
  okExample: {
    say: "「背景レイヤーにparallaxを実装。translateYでscrollYの0.2倍逆方向、rAF+lerp 0.1で補間、背景は移動域ぶん大きく作る」",
    why: "速度差の数値・transform方式・補間・見切れ対策まで指定している。特に「大きく作る」は言わないと端に隙間が出る。",
  },
  vocab: [
    {
      term: "視差(parallax)",
      desc: "近くのものは速く、遠くのものは遅く動いて見える現象。この速度差そのものが奥行きの正体。",
    },
    {
      term: "strength / speed",
      desc: "前景に対する背景の移動量の比率。0なら完全固定、1なら前景と同速で視差ゼロ。",
    },
    {
      term: "lerp",
      desc: "毎フレーム目標へ少しずつ近づける線形補間。scrollイベントで直接動かすカクつきを消す。",
    },
    {
      term: "見切れ",
      desc: "レイヤーが動いた分だけ端に隙間が出ること。背景は移動域のぶん大きく作るのが鉄則。",
    },
  ],
  related: ["scroll-fade-in", "velocity-skew", "tilt"],
};
