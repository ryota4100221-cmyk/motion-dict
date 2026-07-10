import type { MotionEntry } from "@/lib/types";

export const zoomThrough: MotionEntry = {
  slug: "zoom-through",
  category: "transition",
  nameJa: "ズームスルー",
  nameEn: "zoom through transition",
  lede: "クリックした要素に向かって画面ごとズームインし、突き抜けた先で次のページに切り替わるトランジション。サムネイルから詳細ページへの遷移で「その要素の中に入っていく」文脈を作れる。鍵はtransform-originをクリック要素の中心に合わせること。",
  params: [
    {
      key: "duration",
      label: "duration(ズームの時間 s)",
      min: 0.3,
      max: 1.5,
      step: 0.05,
      default: 0.7,
      desc: "0.5〜0.8sが目安。ズームは体感速度が速く、1sを超えると酔いやすい。",
    },
    {
      key: "zoom",
      label: "zoom(最終倍率)",
      min: 2,
      max: 10,
      step: 0.5,
      default: 5,
      desc: "3未満だと「突き抜けた」感が出ない。4〜6で十分。上げすぎても後半は速すぎて視認できない。",
    },
  ],
  promptTemplate: `ページ遷移に zoom through(クリックした要素へ突き抜けるズーム)を実装してください。

- 現在のページ全体を1枚のレイヤーとして扱い、次のページをその下に重ねておく
- クリックされた要素の中心座標(getBoundingClientRect)をビューポート内の%に変換し、レイヤーの transform-origin に設定する
- レイヤーを scale(1) から scale({{zoom}}) まで {{duration}}s、ease-in系(cubic-bezier(0.4, 0, 1, 1)など)で拡大する
- 拡大の後半(50%以降)で opacity を 1→0 にフェードし、下の次ページへ抜ける
- 完了したら上のレイヤーを破棄する。動かすのはtransformとopacityのみ(リフロー禁止)
- prefers-reduced-motion 時はズームせず、即時切り替えか短いクロスフェードにする`,
  ngExample: {
    say: "「クリックしたらズームして次のページに行くようにして」",
    why: "どこを起点に・何倍まで・何秒でがすべて未定義。transform-originが既定の中央のままで、クリックした要素と無関係な場所へ吸い込まれる実装や、フェードがなくズームの果てで画面がぶつ切りになる実装が返ってきがち。",
  },
  okExample: {
    say: "「zoom throughを実装。クリック要素の中心をtransform-originに、現在ページをscale 1→5・0.7s・ease-inで拡大、後半でopacity 0。下に次ページを敷いておき、完了後にレイヤー破棄。reduced-motionは即時切替」",
    why: "originの決め方・倍率・時間・フェード開始点・後始末まで指定されている。「クリック要素の中心をoriginに」が、この動きの成否を分ける一文。",
  },
  vocab: [
    {
      term: "transform-origin",
      desc: "拡大の不動点。クリック要素の中心に合わせると「その要素へ飛び込む」動きになる。既定の中央のままだとただの全画面ズーム。",
    },
    {
      term: "ease-in",
      desc: "加速するイージング。ズームスルーは後半ほど速くなると突き抜ける勢いが出る。ease-outにすると失速して見える。",
    },
    {
      term: "レイヤー重ね",
      desc: "遷移中は旧ページを上・新ページを下に重ねる。旧ページのフェードが遅れると2画面が混ざるので、拡大の後半にフェードを重ねる。",
    },
    {
      term: "getBoundingClientRect",
      desc: "クリック要素の画面内座標を取る標準API。originの%換算(要素中心 ÷ ビューポート寸法 × 100)に使う。",
    },
  ],
  related: ["circle-reveal", "image-zoom-hover", "scroll-zoom"],
};
