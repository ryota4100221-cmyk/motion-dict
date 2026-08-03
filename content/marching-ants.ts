import type { MotionEntry } from "@/lib/types";

export const marchingAnts: MotionEntry = {
  slug: "marching-ants",
  category: "media",
  nameJa: "破線フロー",
  nameEn: "marching ants / animated dashed line / flow line",
  lede: "経路の上を破線が途切れず流れ続け、「どちらへ」「いま動いている」を線1本で伝える演出。実体は stroke-dashoffset を1周期ぶん動かすだけで、フロー図・配送ルート・選択範囲の枠に古くから効く。",
  params: [
    {
      key: "cycle",
      label: "cycle(破線1周期の時間 s)",
      min: 0.3,
      max: 4,
      step: 0.1,
      default: 1.2,
      desc: "dash+gap 1つぶんが流れきる時間。0.8〜1.5sが「動いている」と読めて煩くない。0.5s以下は視線を奪いすぎる。",
    },
    {
      key: "dash",
      label: "dash(線分の長さ)",
      min: 2,
      max: 24,
      step: 1,
      default: 6,
      desc: "gapより短いと「粒が流れる」、長いと「線が送られる」印象になる。データの粒度感に合わせる。",
    },
    {
      key: "gap",
      label: "gap(空白の長さ)",
      min: 2,
      max: 30,
      step: 1,
      default: 10,
      desc: "dashの1.5〜2倍が流れの向きを一番読み取りやすい。詰めすぎると実線に見えて動きが消える。",
    },
    {
      key: "direction",
      label: "direction(流れる向き)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["forward", "reverse"],
      desc: "dashoffsetを減らすと始点→終点、増やすと逆流。矢印の向きと必ず揃える。",
    },
  ],
  promptTemplate: `SVGの経路に marching ants(流れる破線)を実装してください。

- 経路は同じ d のパスを2本重ねる。下は薄い実線のベースライン、上が破線で、動かすのは上の破線だけ
- 破線は stroke-dasharray: {{dash}} {{gap}} で作る(単位はSVGのユーザー座標)
- stroke-dashoffset を dash+gap の合計値から 0 へ {{cycle}}s / linear / infinite で動かす。1周期がちょうど1パターンぶんなので、ループの継ぎ目が出ない
- 流れる向きは {{direction}}。reverse のときは dashoffset を 0 → 合計値 の向きに動かす
- 動かすのは stroke-dashoffset だけにする(path の d や transform は触らない)
- stroke-linecap は butt にする(round にすると線分が伸びて gap が潰れ、流れが読めなくなる)
- 経路を差し替えても見えを保ちたい場合は path に pathLength="100" を宣言し、dasharray を全長の百分率で書く
- prefers-reduced-motion 時はアニメーションを止めて破線を静止表示し、向きは経路の終端に置いた矢印で示す`,
  ngExample: {
    say: "「線が流れてる感じのアニメーションにして」",
    why: "「流れる」だけでは経路そのものを動かす実装(パスをtranslateさせる・SVGごと動かす)が返ってくる。dasharrayを使った実装でも、1周期と合わない距離をdashoffsetに与えるため、ループのたびに破線がガタッと飛ぶものが多い。",
  },
  okExample: {
    say: "「marching antsで実装。ベースの実線に破線を重ね、stroke-dasharray: 6 10、stroke-dashoffsetを16→0へ1.2s linear infinite。dashoffset以外は動かさない。linecapはbutt、reduced-motionは静止破線＋矢印」",
    why: "1周期＝dash+gap という「継ぎ目が出ない条件」を数値で示している。「dashoffset以外は動かさない」の一言が、パスごと動かす実装を封じる。",
  },
  vocab: [
    {
      term: "stroke-dasharray",
      desc: "破線の「線分の長さ / 空白の長さ」。この2値の合計が破線1周期になる。",
    },
    {
      term: "stroke-dashoffset",
      desc: "破線パターンの開始位置。1周期ぶん動かすと元と同じ絵に戻るので、継ぎ目なく無限ループできる。",
    },
    {
      term: "marching ants",
      desc: "選択範囲の枠が蟻の行列のように流れる表現の英語名。画像編集ソフト由来で、Webのフロー図や経路表示にもそのまま通じる。",
    },
    {
      term: "pathLength",
      desc: "SVGパスに「全長をこの値とみなす」と宣言できる属性。100を入れるとdasharrayを全長の百分率で書けるので、経路を差し替えても破線の粒が崩れない。",
    },
  ],
  related: ["line-draw", "border-draw", "motion-path"],
};
