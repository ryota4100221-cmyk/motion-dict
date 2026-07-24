import type { MotionEntry } from "@/lib/types";

export const motionPath: MotionEntry = {
  slug: "motion-path",
  category: "ui",
  nameJa: "モーションパス（曲線に沿う移動）",
  nameEn: "motion path / offset-path animation",
  lede: "要素を直線ではなく曲線の軌道に沿って動かす登場・移動演出。同じ距離でも、少し弧を描かせて進行方向へ向きを合わせるだけで「ただの移動」が「流れ」に変わる。カートへ飛ぶアイコンや、束から扇状に開くサムネイルの定番。",
  params: [
    {
      key: "curve",
      label: "curve(パスのふくらみ px)",
      min: 0,
      max: 160,
      step: 10,
      default: 80,
      desc: "直線からどれだけ弧を描くか。0で直線移動になり、60〜100pxで自然な«流れ»が出る。150px近くは大回りして遅く見え、主役級の要素にしか使えない。",
    },
    {
      key: "stagger",
      label: "stagger(要素ごとの遅延 s)",
      min: 0,
      max: 0.15,
      step: 0.01,
      default: 0.04,
      desc: "各要素が動き出す間隔。0.02〜0.05sで束がほどけるように連なる。0だと一斉発火で«流れ»が消え、0.1sを超えると最後の要素を待たされる。",
    },
    {
      key: "duration",
      label: "duration(1要素の移動時間 s)",
      min: 0.4,
      max: 2,
      step: 0.1,
      default: 1,
      desc: "1つが動き切る時間。0.8〜1.2sが上品。expo系イージングと合わせると「勢いよく出て静かに着地」する加速感が出る。",
    },
    {
      key: "rotate",
      label: "rotate(進行方向への向き付け)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["固定", "接線に沿う"],
      desc: "要素をパスの接線（進行方向）へ回すか。矢印・カード・紙飛行機は「接線に沿う」が自然。ロゴや読ませる文字は傾くと読みにくいので「固定」。",
    },
  ],
  promptTemplate: `要素をパスに沿って動かす motion path を実装してください。

- 移動は直線ではなく曲線(2次ベジェ)にする。始点と終点の中点を垂直方向に {{curve}}px ずらした点を制御点にする(curve=0なら直線)
- CSS の offset-path: path("M ...") と offset-distance の 0%→100% アニメーションで動かす(top/left/margin は使わない=リフローさせない)
- 複数要素は {{stagger}}s ずつ遅らせて発火し、束がほどけるような«流れ»(cascade)を作る
- 1要素あたり {{duration}}s、expo系のイージング(例: cubic-bezier(0.16,1,0.3,1))で動かす
- 進行方向への向き付けは「{{rotate}}」。«接線に沿う»なら offset-rotate: auto、«固定»なら offset-rotate: 0deg にする
- offset-distance のアニメーションは Web Animations API の element.animate() で撃つ(再生・撃ち直しが容易)
- prefers-reduced-motion 時はパス移動をやめ、終点に置いた要素を opacity のフェードインだけで登場させる`,
  ngExample: {
    say: "「アイコンをカートまでいい感じに飛ばして」",
    why: "「飛ばして」だけでは、始点と終点を結んだ直線の transform: translate が返ってくることが多い。放物線を描かない移動は«飛んだ»というより«ワープした»ように見え、狙いの生っぽさが出ない。",
  },
  okExample: {
    say: "「motion path で移動。offset-path に2次ベジェを与えて弧を80px描かせ、offset-distance 0%→100%を1.0s・expo.outで。複数はstagger 0.04sでほどく。カードはoffset-rotate: autoで接線に向ける。top/leftは使わずリフロー禁止」",
    why: "曲線の作り方(制御点)・向き付け(接線追従)・カスケード(stagger)という「流れに見せる3条件」を渡している。特に offset-path を使う指定が、直線translateとの分かれ目になる。",
  },
  vocab: [
    {
      term: "offset-path / offset-distance",
      desc: "要素が沿う軌道(path)と、その上の現在位置(0%〜100%)を指定するCSSプロパティ。distanceをアニメーションさせると要素がパス上を進む。top/leftを触らないのでリフローしない。",
    },
    {
      term: "制御点(control point)",
      desc: "ベジェ曲線の«引っぱる»点。始点・終点は変えずに制御点だけ動かすと、通り道の弧の深さと向きが決まる。少ない点で滑らかな曲線を作れるのがベジェの利点。",
    },
    {
      term: "offset-rotate",
      desc: "パスの接線方向へ要素を自動で回す(auto)か、向きを固定する(0deg)かの指定。進行方向を向くと«乗り物»らしく、固定だと«浮遊»らしく見える。",
    },
    {
      term: "stagger(カスケード)",
      desc: "複数要素の発火を少しずつずらすこと。同じパスでも遅延を与えると束が順にほどけ、1本の«流れ»として読める。",
    },
  ],
  related: ["stagger-grid", "card-shuffle", "bounce-in"],
};
