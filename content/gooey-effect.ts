import type { MotionEntry } from "@/lib/types";

export const gooeyEffect: MotionEntry = {
  slug: "gooey-effect",
  category: "ui",
  nameJa: "グーイエフェクト",
  nameEn: "gooey effect / metaball",
  lede: "近づいた図形同士が表面張力のように融合し、離れるときは糸を引いて切れる液体的な効果。ぼかした上でアルファのコントラストを極端に上げるだけで作れるので、ページネーションやメニューの指標を一段「物質っぽく」できる。",
  params: [
    {
      key: "blur",
      label: "blur(feGaussianBlurのstdDeviation)",
      min: 2,
      max: 14,
      step: 1,
      default: 6,
      desc: "融合の「射程」。5〜8pxが扱いやすい。2pxではほぼ融合せず、12pxを超えると常に溶けていて形が読めない。",
    },
    {
      key: "threshold",
      label: "threshold(アルファのコントラスト)",
      min: 8,
      max: 32,
      step: 1,
      default: 20,
      desc: "ぼけた縁を切り立たせる強さ。18〜24が定番。低いと輪郭がにじみ、高すぎると融合の途中経過が消えてパチッと切り替わる。",
    },
    {
      key: "gap",
      label: "gap(ドット間隔 px)",
      min: 40,
      max: 110,
      step: 5,
      default: 72,
      desc: "blurとの比で融合が決まる。間隔がblurの約10倍を超えると通過時しか繋がらない。常時繋げたいなら間隔を詰めるかblurを上げる。",
    },
    {
      key: "duration",
      label: "duration(移動時間 s)",
      min: 0.3,
      max: 1.6,
      step: 0.05,
      default: 0.8,
      desc: "0.6〜0.9sが液体らしい。速すぎると糸を引く時間が無く、遅いと粘りすぎて重く見える。",
    },
  ],
  promptTemplate: `インジケーターに gooey effect(メタボール融合)を実装してください。

- SVGフィルタを1つ定義する:
  feGaussianBlur(in="SourceGraphic" stdDeviation="{{blur}}") → feColorMatrix(type="matrix")
  feColorMatrixのアルファ行は "0 0 0 {{threshold}} -{{threshold}}/2"(オフセットは倍率の半分の負値)にして、
  ぼけた縁を50%のところで切り立たせる
- filter要素には color-interpolation-filters="sRGB" を付ける(既定のlinearRGBだと色がくすむ)
- フィルタ領域は既定(-10%/120%)だとぼかしが切れるので x="-30%" y="-80%" width="160%" height="260%" に広げる
- 融合させたい図形は**同じ<g>にまとめ**、そのgに filter を掛ける(個別に掛けると融合しない)
- 間隔 {{gap}}px で並べた固定ドットの上を、大きいブロブが {{duration}}s かけて移動する
- ブロブの後ろに一回り小さい追従ブロブを置き、移動時間を約1.4倍にして遅らせる
  → 移動中に2つが離れて液体の首が伸び、到着で1つに戻る(これが無いと「ただ丸が動くだけ」になる)
- 移動は transform: translateX() のみ。cx や left をアニメーションさせない
- フィルタを掛けたgは pointer-events: none にし、クリック判定は別レイヤーの<button>で取る
- prefers-reduced-motion 時は transition を none にして目的位置へ即時に移す(フィルタ自体は残してよい)`,
  ngExample: {
    say: "「ドットが液体みたいにくっつくやつにして」",
    why: "「液体みたい」ではblurの量も閾値も決まらない。CSSのborder-radiusを捏ねただけの実装や、図形を別々の要素に分けたままフィルタを掛けて一切融合しない実装が返ってくる。追従ブロブが無く、糸を引かないただの移動になることも多い。",
  },
  okExample: {
    say: "「gooey effectを実装。feGaussianBlur stdDeviation=6 → feColorMatrixのアルファ行を 0 0 0 20 -10 にして閾値化、color-interpolation-filters=sRGB、フィルタ領域は x=-30% y=-80% w=160% h=260%。融合対象は同一<g>にまとめてgへfilter。間隔72pxのドット上を0.8sで移動する主ブロブ＋1.4倍遅れの追従ブロブ。移動はtranslateXのみ、reduced-motionでは即時移動」",
    why: "融合の正体が「ぼかし＋アルファ閾値」であることと、その2つの数値、そして同一グループに掛けるという成立条件まで指定している。追従ブロブの遅れ倍率まで書いてあるので、液体らしさの肝である「糸を引く」が再現される。",
  },
  vocab: [
    {
      term: "gooey effect / metaball",
      desc: "近接すると融合し離れると分裂する、粘性のある塊の表現。CG由来の呼び名がmetaball、Web実装の通称がgooey effect。",
    },
    {
      term: "feGaussianBlur",
      desc: "SVGフィルタのぼかし。stdDeviationが融合の射程を決める。ここで作った「ぼけた裾野」が次の閾値化で輪郭に変わる。",
    },
    {
      term: "feColorMatrix(アルファ閾値)",
      desc: "色を行列変換するフィルタ。アルファ行の倍率を大きく取り、その半分を負のオフセットで引くと、半透明の裾野が0か1に振り分けられて硬い輪郭になる。",
    },
    {
      term: "color-interpolation-filters",
      desc: "フィルタ演算の色空間。既定はlinearRGBで、指定しないと閾値化の結果が沈んで見える。sRGBを明示するのが定石。",
    },
    {
      term: "フィルタ領域(filter region)",
      desc: "フィルタが描ける矩形。既定は要素の-10%〜120%しかなく、ぼかしの裾が切り落とされて融合が途切れる。広げるのが前提。",
    },
  ],
  related: ["blob-morph", "tab-indicator", "liquid-fill"],
};
