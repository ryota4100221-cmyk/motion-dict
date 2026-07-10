import type { MotionEntry } from "@/lib/types";

export const loadingBar: MotionEntry = {
  slug: "loading-bar",
  category: "loading",
  nameJa: "ローディングバー",
  nameEn: "loading bar / progress bar",
  lede: "画面上端の細いバーで読み込みの進捗を示すYouTube式のUI。本当の進捗が取れない場面では、始めは速く進み90%手前で減速して待つ「進んでいるふり」のイージング設計が本体になる。",
  params: [
    {
      key: "duration",
      label: "duration(90%到達までの時間 s)",
      min: 0.5,
      max: 5,
      step: 0.1,
      default: 2,
      desc: "擬似進捗が90%付近へ達するまでの時間。2s前後が目安。実処理が先に終われば即100%へ飛ばす。",
    },
    {
      key: "height",
      label: "height(バーの高さ px)",
      min: 1,
      max: 8,
      step: 1,
      default: 3,
      desc: "2〜4pxが定番。太いと画面を圧迫し、1pxは高解像度ディスプレイ以外で見落とされる。",
    },
  ],
  promptTemplate: `ページ遷移・非同期処理中の loading bar を実装してください。

- 画面上端に固定した高さ {{height}}px のバー(アクセントカラー)を置く
- 実進捗が取れない前提で、transform: scaleX を 0→0.9 まで {{duration}}s の expo-out で進め、90%付近で待機する(進んでいるふり)
- 処理完了の通知を受けたら残りを 0.2s で scaleX(1) まで一気に進め、その後 opacity を 0.3s でフェードアウトして取り除く
- transform-origin: left を指定し、width ではなく transform で動かす(リフロー禁止)
- 100%到達前に処理が完了した場合も、値の逆走やジャンプバックはさせない(単調増加のみ)
- prefers-reduced-motion 時はバーのアニメーションを行わず、aria-busy とテキストで読み込み中を伝える`,
  ngExample: {
    say: "「上にYouTubeみたいなロードバーをつけて」",
    why: "進捗の元データが存在しないことに実装側が気づかず、0%のまま止まるバーや、完了と同時に100%へ瞬間移動して見えないバーが返ってくる。待機・完了・消え方の3状態の設計が丸ごと抜ける。",
  },
  okExample: {
    say: "「loading barを実装。高さ3px、scaleXで0→0.9を2s expo-out、完了通知で0.2sかけて1.0→0.3sフェードアウトで除去、transform-origin: left、リフロー禁止、reduced-motion時は非表示でaria-busy」",
    why: "擬似進捗の到達点・完了時の畳み方・実装方式まで指定している。「90%で待機」の一言が『進んでいるふり』設計の核心。",
  },
  vocab: [
    {
      term: "不確定プログレス(indeterminate)",
      desc: "本当の進捗率が取得できない状態。完了時刻を約束できないまま「動いている」ことだけを伝える設計対象。",
    },
    {
      term: "進んでいるふり(fake progress)",
      desc: "序盤に速く進めて90%手前で減速・待機するイージング設計。体感待ち時間を下げるための意図的な嘘。",
    },
    {
      term: "scaleX + transform-origin",
      desc: "バーの伸びはwidthではなくscaleXで動かす。transform-originをleftにしないと中央から伸びてしまう。",
    },
    {
      term: "ジャンプバック禁止",
      desc: "進捗が一瞬でも戻る動きはユーザーの信頼を壊す。表示する値は常に単調増加のみに保つ。",
    },
  ],
  related: ["scroll-progress", "preloader-counter", "skeleton-shimmer"],
};
