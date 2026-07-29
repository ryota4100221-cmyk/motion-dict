import type { MotionEntry } from "@/lib/types";

export const scrollScrub: MotionEntry = {
  slug: "scroll-scrub",
  category: "scroll",
  nameJa: "スクロールスクラブ",
  nameEn: "scroll scrub / scroll-driven video scrubbing",
  lede: "スクロール量を映像の再生位置にそのまま結びつけ、指の動きで前にも後ろにも送れるようにする演出。自動再生と違って速度も向きも見る側が握るので、製品のターンテーブルや分解図の説明に強い。",
  params: [
    {
      key: "smoothing",
      label: "smoothing(追従の補間係数)",
      min: 0.04,
      max: 1,
      step: 0.02,
      default: 0.14,
      desc: "1で即時追従。0.1〜0.2にするとホイールの飛びが均され、映像の送りが滑らかになる。",
    },
    {
      key: "length",
      label: "length(スクラブ距離 画面数)",
      min: 1.5,
      max: 5,
      step: 0.5,
      default: 3,
      desc: "全編を送り切るのに要するスクロール量。実務では2〜4画面分。短いと早送り、長いと途中で飽きられる。",
    },
    {
      key: "threshold",
      label: "threshold(描き換えの最小差分 frame)",
      min: 0,
      max: 5,
      step: 0.5,
      default: 1,
      desc: "差がこの値未満ならシークしない。0で毎フレーム、1〜2でデコード負荷をはっきり減らせる。",
    },
  ],
  promptTemplate: `スクロールで映像を送る scroll scrub を実装してください。

- 対象セクションを高さ {{length}} 画面分の wrapper で囲み、中の <video>(または連番画像を描く <canvas>)を position: sticky; top: 0 で固定する
- video には muted / playsinline / preload="auto" を付ける。autoplay も controls も付けない(再生位置はスクロールだけが決める)
- 進捗は progress = -wrapperRect.top / (wrapperHeight - viewportHeight) を 0〜1 にクランプして求める
- 目標値 target = progress * video.duration を current += (target - current) * {{smoothing}} で補間する
- currentTime への代入は rAF の中で1フレームに1回だけ行う。scroll イベントの中で直接代入しない(シークの連打でデコードが詰まる)
- Math.abs(video.currentTime - current) が {{threshold}} フレーム分({{threshold}} / fps 秒)未満なら代入をスキップする
- 動画はキーフレーム間隔を1〜2秒に詰めて再エンコードする。キーフレームが疎な動画は逆方向のシークで固まる
- 音声トラックは削っておく(muted でも転送量を食う)
- prefers-reduced-motion 時は補間を切って即時代入にする。スクロールに追従する表示は残し、映像が独りでに動く要素は作らない`,
  ngExample: {
    say: "「スクロールに合わせて動画を再生して」",
    why: "scrollイベントの中で毎回 video.currentTime に代入する実装が返ってくる。シークが詰まって映像が飛び飛びになり、iOSでは muted/playsinline が無くて再生自体が始まらない。補間もキーフレーム設計も出てこない。",
  },
  okExample: {
    say: "「scroll scrubを実装。sticky videoに対しprogress→currentTimeをlerp 0.14で補間し、代入はrAF内で1回だけ。差が1フレーム未満ならスキップ。muted/playsinline付き、キーフレームは1秒間隔で再エンコード。reduced-motion時は補間なしの即時代入」",
    why: "代入をrAFに集約する・差分でシークを間引く・キーフレーム間隔まで指定する、の3点が揃っている。特に最後の一言が無いと、カクつきの原因がコードではなくエンコード側にあることに気づけない。",
  },
  vocab: [
    {
      term: "currentTime",
      desc: "動画の再生位置(秒)。代入するとシークが起きる。連続で書くとデコードが追いつかず映像が止まって見える。",
    },
    {
      term: "キーフレーム(I-frame)",
      desc: "単体で復号できるフレーム。シーク先の手前のキーフレームから復号し直すため、間隔が疎な動画ほどスクラブが重い。",
    },
    {
      term: "lerp(線形補間)",
      desc: "現在値を目標値へ一定割合ずつ近づける補間。スクロール入力の飛びを均し、送りを滑らかにする。",
    },
    {
      term: "frame sequence",
      desc: "動画の代わりに連番画像をcanvasへ描く方式。シークの重さと再生制約を避けられるが、枚数ぶん転送量が増える。",
    },
    {
      term: "sticky",
      desc: "wrapperの高さを消費する間だけ映像を画面に留める指定。scroll scrubの見た目はこれで作る。",
    },
  ],
  related: ["sticky-pin", "scroll-progress", "ken-burns"],
};
