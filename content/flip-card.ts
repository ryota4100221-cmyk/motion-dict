import type { MotionEntry } from "@/lib/types";

export const flipCard: MotionEntry = {
  slug: "flip-card",
  category: "ui",
  nameJa: "フリップカード",
  nameEn: "flip card / card flip",
  lede: "カードがrotateYで裏返り、裏面の情報が現れる3D演出。perspective・transform-style: preserve-3d・backface-visibility: hiddenの3点セットが揃って初めて成立する。プロフィールカードや料金表の詳細表示の定番。",
  params: [
    {
      key: "duration",
      label: "duration(回転時間 s)",
      min: 0.3,
      max: 1.5,
      step: 0.05,
      default: 0.6,
      desc: "0.5〜0.8sが目安。0.4s未満は何が起きたか読めず、1sを超えると待たされる。",
    },
    {
      key: "perspective",
      label: "perspective(視点距離 px)",
      min: 400,
      max: 2000,
      step: 100,
      default: 800,
      desc: "小さいほど遠近が強調される。800〜1200pxが上品で、400pxは歪みが目立つ。2000pxはほぼ平面的。",
    },
    {
      key: "direction",
      label: "direction(回転方向)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["右回転(+180°)", "左回転(−180°)"],
      desc: "rotateYの符号。単体では好みだが、カードが複数並ぶ場合は全カードで統一する。",
    },
  ],
  promptTemplate: `カードに flip card(rotateYの裏返し)を実装してください。

- 外側ラッパーに perspective: {{perspective}}px、回転する内側要素に transform-style: preserve-3d を指定する
- 表裏それぞれの面に backface-visibility: hidden を指定し、裏面はあらかじめ rotateY(180deg) で裏向きに重ねておく
- ホバー(またはクリック)で内側要素を {{direction}} 方向に {{duration}}s の ease で回転させる
- 表裏は position: absolute で完全に重ね、サイズを一致させる
- width / height をアニメーションさせない(transformのみ)
- ホバーが使えないタッチデバイスではタップでトグルできるようにする
- prefers-reduced-motion 時は回転させず、表裏をアニメーションなし(またはフェードのみ)で切り替える`,
  ngExample: {
    say: "「カードをひっくり返して裏面を見せて」",
    why: "perspectiveなしの平板な回転や、backface-visibility未指定で裏面が鏡文字のまま透けて見える実装が返ってきがち。3点セットは明示しないと揃わない。",
  },
  okExample: {
    say: "「flip cardをperspective: 800px + preserve-3d + backface-visibility: hiddenの3点セットで。ホバーでrotateY(180deg)、0.6s ease、タップでもトグル」",
    why: "3点セットと角度・時間・タッチ対応まで指定。特にbackface-visibilityを言わないと裏面の鏡文字事故が起きる。",
  },
  vocab: [
    {
      term: "perspective",
      desc: "3D変形の視点距離。回転する要素の親に指定する。値が小さいほどカメラが近く、遠近の歪みが強くなる。",
    },
    {
      term: "transform-style: preserve-3d",
      desc: "子要素を同じ3D空間に置く指定。これがないと表裏が同一平面に潰れ、裏返しに見えない。",
    },
    {
      term: "backface-visibility",
      desc: "要素の裏面を描画するかどうか。hiddenにしないと回転中に反対面が鏡文字で透けて見える。",
    },
    {
      term: "rotateY",
      desc: "縦軸まわりの回転。左右の裏返しはこれ。上下にめくるならrotateXを使う。",
    },
  ],
  related: ["tilt", "image-swap-hover", "press-feedback"],
};
