import type { MotionEntry } from "@/lib/types";

export const markerLine: MotionEntry = {
  slug: "marker-line",
  category: "text",
  nameJa: "マーカーライン",
  nameEn: "marker line / marker highlight",
  lede: "文中の強調語に蛍光マーカーが左からスッと引かれる演出。linear-gradientをbackground-sizeで伸ばすだけで実装でき、text-highlight(スクロール連動で長文を塗る)と違いインラインの短い強調に使う。",
  params: [
    {
      key: "duration",
      label: "duration(引く時間 s)",
      min: 0.2,
      max: 1.5,
      step: 0.05,
      default: 0.6,
      desc: "0.4〜0.7sが「手で引いた」感じに近い。1sを超えると強調のキレがなくなる。",
    },
    {
      key: "thickness",
      label: "thickness(マーカーの太さ %)",
      min: 20,
      max: 100,
      step: 5,
      default: 45,
      desc: "行の高さに対する割合。40〜50%で文字の下半分に重なる蛍光ペンらしい太さ。100%は塗りつぶしに近い。",
    },
    {
      key: "delay",
      label: "delay(引き始めの遅れ s)",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.2,
      desc: "画面に入ってから引き始めるまでの間。0.2s前後の「ため」があると視線が強調語に追いつく。",
    },
  ],
  promptTemplate: `文中の強調語に marker line を実装してください。

- 強調語を span で包み、background-image: linear-gradient(半透明のアクセント色) を敷く
- background-repeat: no-repeat、background-position: 0 100% で下寄せにし、background-size を 0% {{thickness}}% → 100% {{thickness}}% に {{duration}}s の ease-out で transition して左から引く
- 発火はIntersectionObserverで画面に入ったとき1回だけ。入ってから {{delay}}s 待ってから引き始める
- マーカー色は不透明度0.4前後の半透明にし、文字の可読性を保つ(文字はマーカーより手前に描画される)
- width や擬似要素のアニメーションでリフローさせない。background-size のみ動かす
- prefers-reduced-motion 時はアニメーションなしでマーカーを引き終わった状態で表示する`,
  ngExample: {
    say: "「大事なところにマーカーを引いた感じにして」",
    why: "静的な塗りだけで「引かれる」動きが入らないか、::afterをwidthで伸ばすリフロー実装が返ってきがち。太さ・色の透明度が未指定だと、文字が読めない不透明ベタ塗りになることも多い。",
  },
  okExample: {
    say: "「marker lineを実装。強調語のbackground-sizeを0%→100%(太さ45%・下寄せ)に0.6s ease-outで、画面に入って0.2s後に1回だけ。色は不透明度0.4のアクセント色、reduced-motion時は引き終わり状態」",
    why: "実装方式(background-size)と太さ・透明度・発火条件まで指定。「下寄せ・半透明」の2点で蛍光ペンらしさが決まり、ベタ塗りとの差になる。",
  },
  vocab: [
    {
      term: "background-size",
      desc: "背景画像の描画サイズ。gradientを0%→100%に伸ばすとマーカーが引かれて見える。transition可能でリフローも走らない。",
    },
    {
      term: "background-position",
      desc: "背景の敷く位置。0 100%で左下基準になり、マーカーが文字の下半分に重なる。",
    },
    {
      term: "linear-gradient",
      desc: "単色でもマーカーはgradientで作る。background-colorはbackground-sizeで部分的に敷けないため。",
    },
    {
      term: "box-decoration-break",
      desc: "強調語が行をまたいだときの背景の扱い。cloneを指定すると折り返した各行にマーカーが正しく付く。",
    },
  ],
  related: ["text-highlight", "underline-reveal", "line-draw"],
};
