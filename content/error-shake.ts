import type { MotionEntry } from "@/lib/types";

export const errorShake: MotionEntry = {
  slug: "error-shake",
  category: "ui",
  nameJa: "エラーシェイク",
  nameEn: "error shake / shake animation",
  lede: "フォーム送信に失敗したとき、入力欄が左右に小さく震えて「首を横に振る」ように拒否を伝える動き。translateXの減衰キーフレームで作り、エラー色の変化と必ずセットで使う。震え幅と回数が少し過ぎるだけで不快になる、匙加減が命の演出。",
  params: [
    {
      key: "amplitude",
      label: "amplitude(震え幅 px)",
      min: 2,
      max: 16,
      step: 1,
      default: 8,
      desc: "初回の振れ幅。6〜10pxが「拒否」の合図として十分。14pxを超えると怒られている感じになる。",
    },
    {
      key: "duration",
      label: "duration(震える時間 s)",
      min: 0.2,
      max: 1.0,
      step: 0.05,
      default: 0.4,
      desc: "0.3〜0.5sで振り切る。0.7sを超えると震えが目的化して、エラー内容を読む邪魔になる。",
    },
    {
      key: "shakes",
      label: "shakes(往復回数)",
      min: 2,
      max: 6,
      step: 1,
      default: 3,
      desc: "左右1往復を1回と数える。3往復が定番。5回以上は同じ時間に詰め込まれて痙攣に見える。",
    },
  ],
  promptTemplate: `フォームの入力欄に error shake(エラー時のシェイク)を実装してください。

- 送信エラー時に入力欄を translateX で左右に振る。キーフレームは ±{{amplitude}}px から始めて 0 へ向かって直線的に減衰させ、{{shakes}}往復で止める
- 全体の長さは {{duration}}s、イージングは ease-out。動かすのは transform のみ(marginやleftでリフローさせない)
- シェイクと同時に入力欄のボーダーをエラー色に変え、下にエラーメッセージを表示する(震えだけでは何が悪いか伝わらないため色とテキストを必ず併用する)
- 再送信のたびにアニメーションを最初から再生し直せるようにする(Web Animations API の element.animate() か、クラスの付け直し)
- 入力を修正し始めたらエラー表示を解除する
- prefers-reduced-motion 時はシェイクせず、ボーダー色の変化とエラーメッセージだけで伝える`,
  ngExample: {
    say: "「エラーのときに入力欄をプルプルさせて」",
    why: "幅・回数・減衰が未定義のまま、一定振幅で延々と揺れる過剰な実装が返ってきがち。色やメッセージの併用にも言及しないと「揺れるだけで理由が分からないフォーム」になり、アクセシビリティ的にも落第する。",
  },
  okExample: {
    say: "「error shakeを実装。translateXを±8pxから3往復で減衰、0.4s ease-out、transformのみ。同時にボーダーをエラー色+メッセージ表示、入力再開で解除。reduced-motion時は色とメッセージのみ」",
    why: "振幅・回数・減衰・時間・色との併用・解除条件まで指定。「減衰させる」の一言で機械的な等幅の揺れを防ぎ、物が首を振るような自然な止まり方になる。",
  },
  vocab: [
    {
      term: "減衰(decay)",
      desc: "振れ幅を回を追うごとに小さくすること。±8→−6→+4→0のように減らすと物理的な揺れに見える。",
    },
    {
      term: "キーフレーム",
      desc: "アニメーションの通過点の列。シェイクは左右の折り返し位置を並べたキーフレームで定義する。",
    },
    {
      term: "element.animate()",
      desc: "Web Animations API。JSからキーフレームを渡して再生でき、同じ要素で何度でも撃ち直せるのでシェイク向き。",
    },
    {
      term: "ネガティブフィードバック",
      desc: "操作の失敗を伝える応答。動きだけに頼らず色・テキストを併用するのが原則(色覚・reduced-motion対応)。",
    },
  ],
  related: ["press-feedback", "floating-label", "toast-slide"],
};
