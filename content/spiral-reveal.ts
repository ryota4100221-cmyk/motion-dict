import type { MotionEntry } from "@/lib/types";

export const spiralReveal: MotionEntry = {
  slug: "spiral-reveal",
  category: "loading",
  nameJa: "スパイラルリビール（渦の収束）",
  nameEn: "spiral reveal / spiral-in stagger",
  lede: "各要素が最終位置から角度と距離の両方をずらした場所に置かれ、回りながら距離を詰めて自分の枠に収まる登場演出。直線でも弧でもなく«渦»を描くので、同じ時間でも「吸い込まれて整列した」という一体感が出る。",
  params: [
    {
      key: "radius",
      label: "radius(飛び出す距離 px)",
      min: 40,
      max: 240,
      step: 10,
      default: 140,
      desc: "最終位置からどれだけ外へ離して始めるか。実務では120〜260pxが扱いやすい。小さいと«軽く整列»、大きいほど«遠くから集まった»になるが、画面外まで飛ばすと出だしが見えない。",
    },
    {
      key: "turns",
      label: "turns(巻き数 回転)",
      min: 0.25,
      max: 2.5,
      step: 0.25,
      default: 1,
      desc: "収束するまでに何周させるか。0.75〜1.25回転が上品。0.25回転だと«弧を描いた移動»に見え、2回転を超えると目が追えず散らかって見える。",
    },
    {
      key: "duration",
      label: "duration(1要素の所要時間 s)",
      min: 0.6,
      max: 2.4,
      step: 0.1,
      default: 1.4,
      desc: "1つが渦を描き切る時間。1.2〜1.6sが目安。巻き数を増やすなら同じ比率でここも伸ばさないと、回転が速すぎて«ブレ»に見える。",
    },
    {
      key: "stagger",
      label: "stagger(要素ごとの遅延 s)",
      min: 0,
      max: 0.2,
      step: 0.01,
      default: 0.06,
      desc: "隣の要素との時間差。0.05〜0.08sで渦が一本の«流れ»として読める。0だと全部が重なって渦が潰れ、0.15sを超えると最後の1枚を待たされる。",
    },
  ],
  promptTemplate: `グリッドの各要素に spiral reveal(渦を描いて所定位置へ収束する登場)を実装してください。

- 位置は極座標で考える。各要素の「最終位置からのズレ」を(角度 angle, 距離 dist)で持ち、進行度 t を 0→1 に進めながら dist を {{radius}}px→0 に縮め、同時に angle を {{turns}}回転ぶん戻す(角度と距離を独立にトゥイーンする=軌道が渦になる)
- 各要素の開始角度は「グリッド中心から自分の枠へ向かう方向」にすると、渦が中心から巻き取られるように読める
- 軌道が非線形なので、t を 24〜32点サンプリングして transform: translate(x,y) scale() の keyframes 配列を作り、element.animate() に渡す(イージングはサンプリング時のtに掛け、animation側は linear にする)
- 動かすのは transform と opacity だけ。top/left/margin は使わない(リフローさせない)
- 要素ごとに {{stagger}}s ずつ遅らせて発火し、1要素あたり {{duration}}s で着地させる
- 着地は expo系のイージング(例: cubic-bezier(0.16,1,0.3,1))で、回りながら減速して«吸い付く»ようにする
- prefers-reduced-motion 時は渦をやめ、最終位置に置いた要素を opacity のフェードインだけで登場させる(stagger も 0 にする)`,
  ngExample: {
    say: "「サムネイルをぐるっと回しながら出して」",
    why: "「回しながら」だけだと rotate だけが返ってきて、要素が自分の位置で自転するだけになる。移動しながら回るのと、その場で回るのは別物で、狙いの«渦に吸い込まれる»一体感は出ない。",
  },
  okExample: {
    say: "「spiral revealで登場。最終位置からのズレを極座標(角度・距離)で持ち、距離140px→0、角度は1回転ぶん戻す。tを28点サンプリングしてtranslate+scaleのkeyframesを作りWAAPIで1.4s・expo.outで再生、stagger 0.06s。transformとopacityのみ、リフロー禁止。reduced-motionはフェードのみ」",
    why: "「角度と距離を独立に動かす」という渦の作り方そのものと、非線形軌道をどう実装に落とすか(サンプリング→keyframes)まで渡している。ここを言わないと直線移動＋自転に落ちる。",
  },
  vocab: [
    {
      term: "極座標(polar coordinates)",
      desc: "位置を(x, y)ではなく(角度, 中心からの距離)で表す考え方。角度と距離を別々にアニメーションできるので、円運動や渦のような«まっすぐでない軌道»を数式2本で作れる。",
    },
    {
      term: "スパイラル(渦)",
      desc: "角度が進むあいだに距離が単調に変化する軌道。距離だけ動かせば直線、角度だけ動かせば円、両方動かすと渦になる。",
    },
    {
      term: "サンプリングしたkeyframes",
      desc: "曲線の軌道を等間隔のtで数十点計算し、その座標列をkeyframes配列としてWAAPIに渡す手法。rAFで毎フレーム計算しなくても、非線形な動きをブラウザ側の合成に任せられる。",
    },
    {
      term: "stagger(カスケード)",
      desc: "複数要素の発火を少しずつずらすこと。渦は重なると形が読めなくなるので、ずらして«1本の流れ»に見せるのが効く。",
    },
  ],
  related: ["motion-path", "stagger-grid", "radial-carousel"],
};
