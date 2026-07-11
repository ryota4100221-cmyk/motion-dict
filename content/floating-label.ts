import type { MotionEntry } from "@/lib/types";

export const floatingLabel: MotionEntry = {
  slug: "floating-label",
  category: "ui",
  nameJa: "フローティングラベル",
  nameEn: "floating label",
  lede: "入力欄にフォーカスすると、プレースホルダー位置のラベルが上に浮き上がって縮む定番フォーム演出。ラベルが常に残るためプレースホルダー消失問題が起きない。フォーカスだけでなく「記入済み」判定まで入れて初めて完成する。",
  params: [
    {
      key: "duration",
      label: "duration(浮き上がり時間 s)",
      min: 0.1,
      max: 0.5,
      step: 0.05,
      default: 0.2,
      desc: "0.15〜0.25sが目安。入力操作への応答なので、0.3sを超えるとワンテンポ遅れて感じる。",
    },
    {
      key: "rise",
      label: "rise(浮き上がり量 px)",
      min: 12,
      max: 32,
      step: 2,
      default: 22,
      desc: "上に移動する距離。ラベルの中心が入力枠の上辺に乗るあたりが収まりがよい。",
    },
    {
      key: "scale",
      label: "scale(縮小率)",
      min: 0.6,
      max: 0.9,
      step: 0.05,
      default: 0.75,
      desc: "浮いた後のラベルの縮小率。0.7〜0.8で「見出しからラベルへ」の階層感が出る。",
    },
  ],
  promptTemplate: `フォーム入力に floating label を実装してください。

- ラベルは<label>要素で実装し、初期状態ではプレースホルダー位置(入力テキストと同じ位置)に重ねる
- フォーカス時に transform: translateY(-{{rise}}px) scale({{scale}}) で浮き上がらせ、{{duration}}s の ease-out で動かす
- transform-origin: left を指定し、左端を固定したまま縮める(中央縮みは横ズレして見える)
- :focus-within(またはfocus/blurイベント)で発火させ、値が入っている間は :placeholder-shown の否定かJSの記入済み判定で、フォーカスが外れても浮かせたままにする
- font-sizeではなくscaleで縮める(リフロー禁止)
- ラベルには入力枠の線を隠す背景色を敷く
- prefers-reduced-motion 時はアニメーションなしで即座に位置を切り替える`,
  ngExample: {
    say: "「プレースホルダーをおしゃれに動かして」",
    why: "フォーカスで浮くだけの実装が高確率で返ってきて、文字を入れたままフォーカスを外すとラベルが入力値に重なって戻る「記入済み判定漏れ」が起きる。font-sizeを直接アニメーションさせるガタつく実装も多い。",
  },
  okExample: {
    say: "「floating labelを:focus-withinで。translateY(-22px) scale(0.75)、0.2s ease-out、transform-origin: left。値が入っていれば浮かせたまま」",
    why: "移動量・縮小率・origin・記入済み判定まで指定。「値が入っていれば浮かせたまま」の一言が実用品質を分ける。",
  },
  vocab: [
    {
      term: ":focus-within",
      desc: "子孫要素がフォーカスされている間、親に当たる擬似クラス。ラッパー側のCSSだけでラベルを動かせる。",
    },
    {
      term: ":placeholder-shown",
      desc: "プレースホルダーが表示中(=未入力)の間だけ当たる擬似クラス。:not()と組み合わせると「記入済み」をCSSだけで判定できる。",
    },
    {
      term: "transform-origin: left",
      desc: "縮小の基準点を左端に固定する指定。ラベルが左揃えのまま小さくなり、横ズレしない。",
    },
    {
      term: "記入済み判定",
      desc: "フォーカスが外れても値があればラベルを浮かせたままにする判定。これが漏れるとラベルと入力値が重なる事故になる。",
    },
  ],
  related: ["error-shake", "underline-reveal", "toggle-switch"],
};
