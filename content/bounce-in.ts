import type { MotionEntry } from "@/lib/types";

export const bounceIn: MotionEntry = {
  slug: "bounce-in",
  category: "ui",
  nameJa: "バウンドイン",
  nameEn: "bounce in / decaying bounce",
  lede: "上から落ちてきた要素が接地して跳ね、跳ねるたびに小さくなって止まる登場演出。品質を決めるのは減衰率と、上り(ease-out)／下り(ease-in)でイージングを反転させること。この2つを外すと重力の嘘が一目で分かる。",
  params: [
    {
      key: "height",
      label: "height(落下距離 px)",
      min: 40,
      max: 200,
      step: 10,
      default: 120,
      desc: "最初に落ちてくる高さ。バッジやステッカーなら80〜140pxが目安。200px近くは「遠くから飛んできた」印象になり主役級の要素にしか使えない。",
    },
    {
      key: "bounces",
      label: "bounces(跳ねる回数)",
      min: 1,
      max: 5,
      step: 1,
      default: 3,
      desc: "接地後に跳ね返る回数。2〜3回が実物らしい。4回以上は落ち着くまで待たされ、UIでは「まだ動いてる」と邪魔になる。",
    },
    {
      key: "damping",
      label: "damping(減衰率)",
      min: 0.2,
      max: 0.7,
      step: 0.05,
      default: 0.45,
      desc: "次の跳ねの高さが前回の何倍になるか。0.4〜0.5がゴムやボールの感触。0.7に近づくとなかなか止まらず、0.2では1回で死んだように止まる。",
    },
    {
      key: "duration",
      label: "duration(着地までの合計時間 s)",
      min: 0.5,
      max: 2.5,
      step: 0.1,
      default: 1.2,
      desc: "落下開始から静止までの総時間。1.0〜1.4sが軽快。2sを超えると弾みが間延びして、コミカルというより鈍重に見える。",
    },
  ],
  promptTemplate: `要素の登場に bounce in(減衰バウンド)を実装してください。

- 上 {{height}}px から落下し、接地後 {{bounces}} 回跳ね返って静止する
- 跳ねの高さは毎回 {{damping}} 倍に減衰させる(等間隔で跳ねさせない)
- **上りは ease-out・下りは ease-in** とイージングを区間ごとに反転する(全体に1つのeasingを掛けない)
- 各区間の長さは跳ねの高さの平方根に比例させる(自由落下の時間。跳ねが小さいほど区間も短くなる)
- 合計 {{duration}}s で静止させる
- translateY のみで動かし、top/margin は使わない(リフローさせない)
- 実装は Web Animations API の element.animate() でキーフレームを生成する(何度でも撃ち直せるため)
- prefers-reduced-motion 時は跳ねを完全に止め、opacityのフェードインだけで登場させる`,
  ngExample: {
    say: "「ロゴをバウンドさせながら出して」",
    why: "跳ねる回数も減衰も決まらないため、CSSの `ease-in-out` を1つ掛けただけの「上下に往復するだけ」の動きが返ってくる。重力に見えない最大の原因は、上りと下りに同じイージングが当たっていること。",
  },
  okExample: {
    say: "「bounce inで登場。上120pxから落として3回跳ね、跳ねの高さは毎回0.45倍に減衰。上りはease-out・下りはease-inで区間ごとに反転し、区間長は高さの平方根比。合計1.2sで静止。translateYのみ」",
    why: "減衰率・回数・イージングの反転・区間長の比率という「重力に見せる4条件」を全部渡している。特に「区間ごとに反転」の一言があるかどうかで、跳ねが物理に見えるかゴム紐に見えるかが決まる。",
  },
  vocab: [
    {
      term: "減衰(damping)",
      desc: "振幅が1回ごとに一定の比率で小さくなること。バウンドが「跳ね」に見えるか「往復」に見えるかの分かれ目。",
    },
    {
      term: "イージングの反転",
      desc: "上昇は減速(ease-out)、下降は加速(ease-in)。重力下の物体はこうなる。キーフレームごとに timing-function を指定して切り替える。",
    },
    {
      term: "自由落下の時間",
      desc: "高さhから落ちるのにかかる時間は√hに比例する。跳ねが小さくなるほど間隔も詰まるのはこのため。等間隔で刻むと機械的に見える。",
    },
    {
      term: "Web Animations API",
      desc: "element.animate(keyframes, options)。回数や減衰から動的にキーフレームを組み立てられ、同じ要素に何度でも撃ち直せる。CSSの@keyframesでは可変長の減衰は書けない。",
    },
    {
      term: "スカッシュ&ストレッチ",
      desc: "接地の瞬間に潰し、跳ね上がりで伸ばす作画の原則。scaleを数%足すだけで生っぽさが跳ね上がるが、ロゴなど形が正である要素には使わない。",
    },
  ],
  related: ["modal-pop", "error-shake", "rubber-band"],
};
