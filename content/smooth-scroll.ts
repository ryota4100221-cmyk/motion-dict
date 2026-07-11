import type { MotionEntry } from "@/lib/types";

export const smoothScroll: MotionEntry = {
  slug: "smooth-scroll",
  category: "scroll",
  nameJa: "慣性スクロール",
  nameEn: "smooth scroll / lerp scroll",
  lede: "スクロール入力に慣性(遅れ)を持たせ、ページ全体をぬるっと滑らせる演出。Lenis等のライブラリの中身はlerpによる補間で、ハイエンドサイトの「上質さ」の多くはここから来ている。",
  params: [
    {
      key: "lerp",
      label: "lerp(補間係数)",
      min: 0.03,
      max: 0.3,
      step: 0.01,
      default: 0.1,
      desc: "毎フレーム、目標との差を詰める割合。0.1前後が定番。小さいほど遅れが大きく「ぬるっ」とし、0.2を超えるとほぼ素のスクロールに近づく。",
    },
    {
      key: "multiplier",
      label: "multiplier(スクロール量の倍率)",
      min: 0.5,
      max: 2,
      step: 0.1,
      default: 1,
      desc: "入力1に対して何倍進めるか。1が基本。上げると軽快に見えるが、手応えと画面のズレは酔いの原因になるので0.8〜1.2に留める。",
    },
  ],
  promptTemplate: `ページ全体に慣性を持たせる smooth scroll (lerp scroll) を実装してください。

- ネイティブスクロールは殺さない。実スクロールはbodyの高さ(スペーサー)で発生させたまま、コンテンツを包んだラッパーを transform: translate3d(0, -y, 0) で追従させる方式にする(Lenisと同じ原理)
- y は毎フレーム y += (scrollY × {{multiplier}} − y) × {{lerp}} で目標に近づける(lerp)。requestAnimationFrameで回し、差が0.1px未満になったらスナップして止める
- lerpはフレームレート依存になるため、デルタタイムで 1 − (1 − {{lerp}})^(dt × 60) のように補正する(120Hz端末で倍速になる事故を防ぐ)
- transformされたラッパーの中では position: sticky / fixed が効かなくなる。固定ヘッダー等はラッパーの外に置く
- wheelイベントのpreventDefaultで自前制御(scroll hijacking)はしない。スクロールバー・キーボード・アンカーリンクが生きていることを確認する
- prefers-reduced-motion 時は慣性を完全に無効化して素のスクロールに戻す(酔い・前庭障害への配慮で必須)`,
  ngExample: {
    say: "「このサイトみたいにスクロールをぬるぬるにして」",
    why: "wheelイベントをpreventDefaultしてスクロールを乗っ取る実装(scroll hijacking)が返ってきがち。スクロールバー・キーボード操作・アクセシビリティが全滅し、iOSで破綻する。遅れの強さも決まらない。",
  },
  okExample: {
    say: "「Lenis方式のsmooth scrollを。実スクロールは残してラッパーをtranslate3dで追従、lerp 0.1(dt補正あり)、reduced-motionで無効化。sticky/fixedな要素はラッパーの外に」",
    why: "「実スクロールを残す」方式の指定が操作性と堅牢性を決める。lerp値・dt補正・reduced-motion無効化・stickyの罠まで押さえており、ライブラリを使う場合の設定指示としてもそのまま通じる。",
  },
  vocab: [
    {
      term: "lerp(線形補間)",
      desc: "current += (target − current) × 係数。毎フレーム差の一定割合を詰めるので、近づくほど減速する自然なイージングになる。",
    },
    {
      term: "transformラッパー方式",
      desc: "実スクロールはスペーサーに任せ、見た目だけラッパーのtransformで遅らせる構造。Lenis・Locomotive Scrollの基本原理。",
    },
    {
      term: "scroll hijacking",
      desc: "ネイティブスクロールを奪って自前制御すること。慣性表現での安易な採用は操作性・アクセシビリティを壊す悪手とされる。",
    },
    {
      term: "デルタタイム補正",
      desc: "lerpをフレーム時間で補正すること。補正なしだと120Hz端末では60Hzの倍の速さで追いつき、機種によって体験が変わってしまう。",
    },
  ],
  related: ["parallax", "velocity-skew", "scroll-progress"],
};
