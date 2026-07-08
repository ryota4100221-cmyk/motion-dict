import type { MotionEntry } from "@/lib/types";

export const magneticHover: MotionEntry = {
  slug: "magnetic-hover",
  category: "hover",
  nameJa: "マグネティックホバー",
  nameEn: "magnetic hover / magnetic button",
  lede: "カーソルが近づくと、要素が磁石のように吸い寄せられて追従する動き。離れると元の位置に弾性で戻る。Awwwards系サイトのボタンで最頻出のマイクロインタラクション。",
  params: [
    {
      key: "strength",
      label: "strength(吸い付きの強さ)",
      min: 0.05,
      max: 1,
      step: 0.05,
      default: 0.35,
      desc: "1に近いほどカーソルにベッタリ付いてくる。0.3前後が上品。",
    },
    {
      key: "lerp",
      label: "lerp(追従の粘り)",
      min: 0.03,
      max: 0.5,
      step: 0.01,
      default: 0.12,
      desc: "小さいほど「ぬるっと」遅れて付いてくる。大きいと機敏。",
    },
    {
      key: "radius",
      label: "radius(反応距離 px)",
      min: 60,
      max: 300,
      step: 10,
      default: 140,
      desc: "この距離に入った瞬間から吸い付き始める。",
    },
  ],
  promptTemplate: `ボタンに magnetic hover を実装してください。

- カーソルが要素の中心から {{radius}}px 以内に入ったら反応
- 要素はカーソル方向に strength {{strength}} で吸い付く
- 追従は毎フレーム lerp(係数 {{lerp}})で補間し、遅れて付いてくる質感にする
- 内側のテキストは外枠の 0.35 倍の強さで動かす(視差)
- mouseleave 時は elastic 系イージングで元の位置に戻す
- prefers-reduced-motion 時はアニメーションを無効化`,
  ngExample: {
    say: "「ボタンをぬるっと磁石っぽくして」",
    why: "「ぬるっと」は速度・粘り・距離のどれを指すのか曖昧。AIはtransitionを付けただけの平凡なhoverを返しがち。何が「磁石」なのかも未定義。",
  },
  okExample: {
    say: "「magnetic hoverを実装。lerpで追従、strengthとradiusは数値指定、mouseleaveでelastic系イージングで戻す」",
    why: "動きの正式名称 + 実装方式(lerp) + パラメータ数値 + 終了時の挙動。この4点が揃うと一発で意図通りになる。",
  },
  vocab: [
    {
      term: "lerp",
      desc: "線形補間。「毎フレーム、目標位置に少しずつ近づける」計算。遅れて付いてくる質感の正体。",
    },
    {
      term: "strength",
      desc: "カーソル位置をどれだけ反映するかの係数。吸い付きの強さ。",
    },
    {
      term: "elastic ease",
      desc: "行き過ぎてから戻る、ばねのようなイージング。GSAPなら elastic.out(1, 0.4)。",
    },
    {
      term: "inner / outer",
      desc: "枠と中のテキストを別の強さで動かすと高級感が出る(テキストは弱め)。",
    },
  ],
  related: ["custom-cursor", "tilt", "spotlight-hover"],
};
