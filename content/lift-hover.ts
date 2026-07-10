import type { MotionEntry } from "@/lib/types";

export const liftHover: MotionEntry = {
  slug: "lift-hover",
  category: "hover",
  nameJa: "リフトホバー",
  nameEn: "lift hover / card lift",
  lede: "カードがホバーでふわりと浮き上がる、translateYと影のセット演出。影の質(薄く・大きく・翳りは下方向のみ)で高級にも安っぽくもなる、カードUIの基本語彙。",
  params: [
    {
      key: "lift",
      label: "lift(浮く距離 px)",
      min: 2,
      max: 16,
      step: 1,
      default: 8,
      desc: "6〜10pxが上品。16px近くまで上げると軽薄な印象になりやすい。",
    },
    {
      key: "duration",
      label: "duration(浮く時間 s)",
      min: 0.2,
      max: 0.8,
      step: 0.05,
      default: 0.3,
      desc: "0.25〜0.4sが自然。戻りも同じdurationにすると落ち着いて見える。",
    },
  ],
  promptTemplate: `カードに lift hover(浮き上がり)を実装してください。

- ホバーで transform: translateY(-{{lift}}px) に、{{duration}}s の ease-out で浮かせる
- 影は薄く大きく: alpha 0.1 前後・blur は浮く距離の3〜4倍・オフセットは下方向のみ(翳りは真下に落とす)
- 影は ::after 擬似要素に box-shadow で事前描画し、opacity 0→1 で切り替える(box-shadow自体をtransitionさせない)
- top や margin ではなく transform で動かす(リフローさせない)
- マウスが離れたら同じ duration で元の位置に戻す
- prefers-reduced-motion 時は浮き上がりを無効化し、状態変化は即時切り替えにする`,
  ngExample: {
    say: "「カードをホバーでいい感じに浮かせて」",
    why: "box-shadow: 0 4px 8px rgba(0,0,0,0.5) のような濃く小さい影が返ってきがちで、一気に安っぽくなる。box-shadowを直接transitionする描画コストの高い実装も多い。",
  },
  okExample: {
    say: "「lift hoverを実装。translateY(-8px) 0.3s ease-out、影は::afterに 0 24px 48px rgba(0,0,0,0.1) を事前描画してopacityで切替、transformのみでリフロー禁止」",
    why: "浮く距離・速度に加えて影のレシピ(薄く・大きく・下方向のみ)と切り替え方式まで指定。影の質を数値で渡せるかが仕上がりを分ける。",
  },
  vocab: [
    {
      term: "box-shadow",
      desc: "offset-x / offset-y / blur / spread / 色の順。offset-yだけ正の値にすると翳りが真下に落ち、光源が上に定まる。",
    },
    {
      term: "shadow alpha",
      desc: "影の不透明度。0.1前後が上品な目安。0.3を超えると影が主張して重く安っぽくなる。",
    },
    {
      term: "opacityによる影の切替",
      desc: "box-shadowのtransitionは毎フレーム影を再描画して重い。擬似要素に影を事前描画しopacityだけ動かすのが定石。",
    },
    {
      term: "ease-out",
      desc: "出だしが速く終わりが緩やかなイージング。浮き上がりに使うと「ふわり」と感じられる。",
    },
  ],
  related: ["tilt", "image-zoom-hover", "fill-hover"],
};
