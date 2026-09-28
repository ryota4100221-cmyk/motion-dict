import type { MotionEntry } from "@/lib/types";

export const arrowSlideThrough: MotionEntry = {
  slug: "arrow-slide-through",
  category: "hover",
  nameJa: "矢印の抜け替え",
  nameEn: "arrow slide-through / arrow loop hover / arrow icon hover",
  lede: "ホバーでボタンの矢印が指す方向へ飛び出し、反対側から戻ってくる演出。「押すとこの先へ進む」をアイコン自身の動きで言い切れる、CTAとページ送りの定番マイクロインタラクション。",
  params: [
    {
      key: "duration",
      label: "duration(抜けて戻るまでの時間 s)",
      min: 0.3,
      max: 1.2,
      step: 0.05,
      default: 0.6,
      desc: "抜けて戻るまでの合計。0.5〜0.7sが自然。0.9sを超えるとカーソルが離れた後もまだ戻ってこない。",
    },
    {
      key: "travel",
      label: "travel(抜ける距離 %)",
      min: 40,
      max: 200,
      step: 10,
      default: 120,
      desc: "矢印自身の大きさに対する移動量。100%超で枠の外まで抜け切る。60%以下だと抜けずに「揺れた」に見える。",
    },
    {
      key: "exit",
      label: "exit(抜ける側の割合 %)",
      min: 20,
      max: 60,
      step: 5,
      default: 35,
      desc: "全体のうち、抜けていく前半に使う割合。30〜40%で「素早く抜けて、ゆっくり戻る」になる。50%超は往復運動に見える。",
    },
    {
      key: "mode",
      label: "mode(抜け方)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["slide", "draw"],
      desc: "slide＝そのまま平行移動で抜けて戻る。draw＝抜けながら線が消え、戻りは軸→矢じりの順に描き直す(SVG stroke)。",
    },
  ],
  promptTemplate: `ボタンの矢印アイコンに arrow slide-through(ホバーで矢印が指す方向へ抜け、反対側から戻ってくる演出)を実装してください。

- 矢印は inline SVG にし、ボタン内の overflow: clip の小さな枠に入れる(抜けた矢印を枠で切る)
- ホバー開始で1回だけ再生する(ホバー中にループさせない)。全体は {{duration}}s
- 前半 {{exit}}% で、矢印が指す向き(→なら右、↗なら右上)へ矢印自身の大きさの {{travel}}% だけ translate しながら opacity 0 へ。ease-in(cubic-bezier(0.55, 0, 0.75, 0.2))で加速して抜ける
- 抜け切った瞬間に反対側の同じ距離(-{{travel}}%)へ瞬間移動し、残りの時間で元の位置へ戻す。戻りはわずかにオーバーシュートする ease-out(cubic-bezier(0.34, 1.56, 0.64, 1))
- 抜け方は {{mode}}。draw の場合は、抜けながら stroke-dashoffset で線を消し、戻りは pathLength="1" の軸→矢じりの順に時間差で描き直す
- 動かすのは transform / opacity / stroke-dashoffset だけにする(left や margin は使わない)
- :focus-visible でも同じ再生をする。タッチ端末ではタップ時に1回再生する
- prefers-reduced-motion 時は矢印を動かさず、色の変化だけにする`,
  ngExample: {
    say: "「ボタンの矢印をホバーでアニメーションさせて」",
    why: "ほぼ確実に「右へ数pxずれて戻る」transitionが返ってくる。それは揺れ(nudge)であって、枠の外へ抜けて反対側から戻る「進む」の表現にはならない。瞬間移動の一手が言わないと入らない。",
  },
  okExample: {
    say: "「矢印を overflow: clip の枠に入れ、ホバーで1回だけ再生。前半35%で矢印の向きへ120%抜けてopacity 0、反対側-120%へ瞬間移動して残りで戻る。0.6s、戻りはオーバーシュート。reduced-motion時は色だけ」",
    why: "枠で切る構造・抜ける割合・移動量・瞬間移動・イージングの非対称まで指定。「ホバー中にループさせない」を添えると、目障りな無限ループも防げる。",
  },
  vocab: [
    {
      term: "slide-through",
      desc: "要素が片側へ抜け、反対側から入って元の位置に戻る動き。移動方向がそのまま「進む」の意味になる。",
    },
    {
      term: "瞬間移動(テレポート)",
      desc: "キーフレームの35%と36%のように隣り合う2点で位置を飛ばし、見えない間に反対側へ回り込ませる手口。要素は1つで済む。",
    },
    {
      term: "overflow: clip",
      desc: "抜けていく矢印を枠で切る。hiddenと違いスクロールコンテナを作らないので、周りのレイアウトに影響しない。",
    },
    {
      term: "pathLength=\"1\"",
      desc: "SVGパスの長さを1と見なす属性。stroke-dasharray: 1 と stroke-dashoffset: 1→0 だけで、実際の長さを測らずに線を描ける。",
    },
    {
      term: "ホバー時1回再生",
      desc: "animation を :hover に付け、iteration は1回。ホバー中ずっとループさせると、押す前から目障りになる。",
    },
  ],
  related: ["text-slide-swap", "hint-nudge", "line-draw", "fill-hover"],
};
