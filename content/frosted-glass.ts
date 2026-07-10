import type { MotionEntry } from "@/lib/types";

export const frostedGlass: MotionEntry = {
  slug: "frosted-glass",
  category: "media",
  nameJa: "フロスティッドガラス",
  nameEn: "frosted glass / glassmorphism panel",
  lede: "背景をぼかして透かす半透明パネルが、画像の上にふわっと現れるカード演出。UIを「画像の上に乗せる」のではなく「環境の中に溶け込ませる」ための定番手法で、素材感のある背景ほど効く。",
  params: [
    {
      key: "blur",
      label: "blur(背景のぼかし px)",
      min: 4,
      max: 30,
      step: 1,
      default: 16,
      desc: "12〜18pxが上品。4px以下だとただの半透明、24px超だと背景がほぼ判別できなくなる。",
    },
    {
      key: "opacity",
      label: "opacity(パネル地の不透明度)",
      min: 0.03,
      max: 0.25,
      step: 0.01,
      default: 0.08,
      desc: "0.06〜0.1が「浮いて見えない」目安。0.2を超えると普通の半透明カードに寄る。",
    },
    {
      key: "duration",
      label: "duration(出現時間 s)",
      min: 0.2,
      max: 1.0,
      step: 0.05,
      default: 0.45,
      desc: "0.35〜0.55sがふわっと感の目安。0.2s未満は硬く出て素材感が伝わらない。",
    },
  ],
  promptTemplate: `画像の上に frosted glass panel(半透明+背景ぼかしのガラス風カード)を実装してください。

- パネルは backdrop-filter: blur({{blur}}px) saturate(160%) を適用する(-webkit-backdrop-filterも併記)
- パネル背景は rgba(255,255,255,{{opacity}}) 程度の薄い白、境界線は rgba(255,255,255,0.14) の1px
- 初期状態は opacity: 0, transform: translateY(16px) scale(0.96)
- ホバー(またはスクロールで領域侵入)時に opacity: 1, transform: translateY(0) scale(1) へ {{duration}}s ease-outで遷移させる
- backdrop-filter未対応ブラウザ向けに @supports not (backdrop-filter: blur(1px)) でフォールバック背景色(不透明度高め)を用意する
- prefers-reduced-motion 時は transform を使わずopacityの遷移のみにする`,
  ngExample: {
    say: "「ガラスっぽい半透明のカードにして」",
    why: "「ガラスっぽい」だけでは単なる半透明白カードが返りやすく、backdrop-filterでの背景ぼかしが抜け落ちる。ぼかし量・地の不透明度・出現の起点を数値で指定しないと「環境に溶け込む」質感にならない。",
  },
  okExample: {
    say: "「frosted glass panelをbackdrop-filter: blur(16px) saturate(160%)+背景rgba(255,255,255,0.08)で。初期はopacity 0・translateY(16px) scale(0.96)、ホバーで0.45s ease-outで出現。backdrop-filter未対応時はフォールバック背景を用意」",
    why: "ぼかしの実装方法(backdrop-filter)・数値・出現前後の状態・フォールバックまで指定。「ガラス風」の一言では抜けがちな未対応ブラウザ考慮も明示している。",
  },
  vocab: [
    {
      term: "backdrop-filter",
      desc: "要素の背後にある内容にフィルタ(ぼかし等)をかけるCSSプロパティ。glassmorphismの中核。",
    },
    {
      term: "glassmorphism",
      desc: "半透明+背景ぼかし+薄い境界線でガラス板のような質感を作るUIスタイルの通称。",
    },
    {
      term: "saturate()",
      desc: "backdrop-filterに併用する彩度補正。blurだけだと色が濁って見えるため、saturateで彩度を持ち上げて「すりガラス」らしい鮮やかさを保つ。",
    },
    {
      term: "@supports",
      desc: "特定のCSS機能への対応を条件分岐するアットルール。backdrop-filter非対応環境へのフォールバックに使う。",
    },
  ],
  related: ["blur-load", "duotone-hover", "modal-pop"],
};
