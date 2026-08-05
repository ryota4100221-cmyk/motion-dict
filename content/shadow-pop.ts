import type { MotionEntry } from "@/lib/types";

export const shadowPop: MotionEntry = {
  slug: "shadow-pop",
  category: "hover",
  nameJa: "シャドウポップ",
  nameEn: "shadow pop / stacked hard shadow / offset shadow hover",
  lede: "ホバーで本体が影と逆方向へ跳び、背後にぼかしゼロの影が段状に積み上がって厚みが出るホバー。0.1s級の速さと「絶対にぼかさない」判断が効きどころで、ネオブルータリズム系の定番語彙。",
  params: [
    {
      key: "depth",
      label: "depth(押し出し距離 px)",
      min: 2,
      max: 14,
      step: 1,
      default: 6,
      desc: "本体が逃げる距離＝影の厚み。4〜8pxが実用域。12pxを超えると板が浮きすぎて押せる物に見えなくなる。",
    },
    {
      key: "steps",
      label: "steps(影の段数)",
      min: 1,
      max: 10,
      step: 1,
      default: 6,
      desc: "重ねる影の枚数。depthと同数(1pxずつ)にすると隙間なく塊に見える。2〜3枚に減らすと縞が出て版ズレ風になる。",
    },
    {
      key: "duration",
      label: "duration(跳ぶ時間 s)",
      min: 0.05,
      max: 0.5,
      step: 0.01,
      default: 0.12,
      desc: "0.1〜0.15sが正解。0.3sを超えると「ポップ」ではなく「ぬるっ」になり、この動きの旨味が消える。",
    },
    {
      key: "direction",
      label: "direction(影を積む方向)",
      min: 0,
      max: 3,
      step: 1,
      default: 0,
      options: ["bottom-left", "bottom-right", "top-left", "top-right"],
      desc: "影が伸びる方向。本体はその真逆へ逃げる。光源は1つに決めてサイト全体で揃える。",
    },
  ],
  promptTemplate: `ボタンに shadow pop(段積みハードシャドウのホバー)を実装してください。

- ホバーで box-shadow を {{steps}} 枚重ね、{{direction}} 方向へ 1枚ずつオフセットする(最終段のオフセット = {{depth}}px)
- 影は blur も spread も 0 にする(ぼかすと別物になる)。色は単色1つで統一する
- 同時に本体を transform: translate() で影と真逆の方向へ {{depth}}px 動かし、押し出された板に見せる
- 所要時間は {{duration}}s、イージングは cubic-bezier(0.47, 0, 0.745, 0.715) 程度の速い立ち上がりにする
- box-shadow 自体を transition しない。影は inset: 0 / z-index: -1 の擬似要素に全段を事前描画し、opacity 0→1 で出す。動かすのは transform と opacity だけ(リフロー禁止)
- タッチデバイスでは :active(または pointerdown/pointerup)でも同じ状態になるようにする
- prefers-reduced-motion 時は移動量を 0 にし、影の表示は transition なしの即時切り替えにする`,
  ngExample: {
    say: "「ボタンのホバーに影を付けて立体的にして」",
    why: "blurの効いた柔らかいドロップシャドウが1枚返ってくる。段積みでも「ぼかさない」でも「本体を逆方向へ逃がす」でもないので、狙っている版ズレ的な厚みには一切ならない。box-shadowを直接transitionする重い実装になりがちなのも定番。",
  },
  okExample: {
    say: "「shadow popで実装。box-shadowを6枚bottom-leftへ1pxずつ積んで最終段-6px/6px、blur・spreadは0。本体はtranslate(6px, -6px)で逆方向へ。0.12s cubic-bezier(0.47,0,0.745,0.715)。影は擬似要素に事前描画してopacityだけ動かす」",
    why: "段数・方向・オフセット量・blur=0・本体の逃がし方向・速度・描画方式まで確定している。特に「blurは0」と「影はopacityで出す」の2つが、この動きの見た目と滑らかさを同時に守る。",
  },
  vocab: [
    {
      term: "ハードシャドウ(hard shadow)",
      desc: "blur半径0の影。輪郭が完全に立つため「光の翳り」ではなく「もう1枚の板」として読まれる。",
    },
    {
      term: "段積み(layered box-shadow)",
      desc: "box-shadowをカンマ区切りで複数指定し、オフセットを少しずつずらして重ねる書き方。連続した押し出し面に見える。",
    },
    {
      term: "オフセット方向",
      desc: "影を落とす向き。本体を逆向きに動かすと、影が伸びたのではなく本体が浮き上がったように読める。",
    },
    {
      term: "cubic-bezier(0.47, 0, 0.745, 0.715)",
      desc: "ease-in寄りの立ち上がりが速いカーブ。短時間の「跳ねる」表現で、ease-outより硬質な当たりが出る。",
    },
  ],
  related: ["lift-hover", "press-feedback"],
};
