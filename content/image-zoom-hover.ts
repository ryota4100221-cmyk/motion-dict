import type { MotionEntry } from "@/lib/types";

export const imageZoomHover: MotionEntry = {
  slug: "image-zoom-hover",
  category: "media",
  nameJa: "画像ズームホバー",
  nameEn: "image zoom on hover",
  lede: "サムネイルにホバーすると、枠は固定のまま中の画像だけがゆっくり拡大する定番演出。「押せる」「この先がある」を言葉なしで伝える。overflow: hiddenの枠と、リンクホバーより遅めのdurationが品質の分かれ目。",
  params: [
    {
      key: "scale",
      label: "scale(拡大率)",
      min: 1.02,
      max: 1.4,
      step: 0.02,
      default: 1.08,
      desc: "1.05〜1.1が上品。1.2を超えると画像が粗く見え、圧が強くなる。",
    },
    {
      key: "duration",
      label: "duration(ズーム時間 s)",
      min: 0.2,
      max: 1.5,
      step: 0.05,
      default: 0.6,
      desc: "0.5s前後の遅めにすると「じわっ」とした高級感が出る。",
    },
  ],
  promptTemplate: `サムネイル画像に image zoom on hover を実装してください。

- 枠に overflow: hidden を指定し、枠自体のサイズは絶対に動かさない
- ホバーで中の img だけを transform: scale({{scale}}) に {{duration}}s のease-outで拡大する
- マウスが離れたら同じ時間をかけて scale(1) に戻す
- width/heightではなくtransformで動かす(リフロー禁止)。imgに will-change: transform を付ける
- :hoverの判定はカード全体に付け、画像・テキストどこに乗っても同時に反応させる
- prefers-reduced-motion 時はズームを無効化し、静止したまま表示する`,
  ngExample: {
    say: "「サムネにホバーしたら画像を拡大して」",
    why: "枠ごと大きくなって隣のカードを押し出す実装が返ってきやすい。「枠は固定・中身だけ拡大」という二重構造が伝わっていないのが原因。",
  },
  okExample: {
    say: "「image zoom on hoverを実装。overflow:hiddenの枠内でimgをscale(1.08)、0.6s ease-out、leaveで戻す。ホバー判定はカード全体、transformのみでリフロー禁止」",
    why: "構造(枠+中身)・数値・判定範囲・パフォーマンス制約が一文に揃っている。scaleの数値を書けば「どのくらい寄るか」の解釈違いが起きない。",
  },
  vocab: [
    {
      term: "overflow: hidden",
      desc: "枠からはみ出た部分を切り落とす指定。この演出の骨格で、これがないと画像がただ膨らんでレイアウトを壊す。",
    },
    {
      term: "リフロー",
      desc: "レイアウトの再計算。width/heightのアニメーションで発生し、周囲の要素まで巻き込んでカクつく。transformなら起きない。",
    },
    {
      term: "ホバー判定の親子",
      desc: ":hoverは親(カード全体)に付け、動かすのは子(画像)。タイトル部分に乗っても画像が反応し、一体感が出る。",
    },
    {
      term: "微差の演出",
      desc: "scale 1.05〜1.1のような、気づくか気づかないかの変化量。大きく動かすより「触れた」感触が残り、写真の粗も出ない。",
    },
  ],
  related: ["clip-reveal", "tilt", "spotlight-hover"],
};
