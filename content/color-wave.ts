import type { MotionEntry } from "@/lib/types";

export const colorWave: MotionEntry = {
  slug: "color-wave",
  category: "text",
  nameJa: "カラーウェーブ",
  nameEn: "color wave / character color sweep",
  lede: "薄く沈めた見出しの上を、アクセント色の発光が1文字ずつ波のように走り抜け、通過した文字が本来の色で定着していくリビール。文字を動かさずに色だけで読ませる順序を作れるのが強み。",
  params: [
    {
      key: "stagger",
      label: "stagger(文字間の時間差 ms)",
      min: 10,
      max: 120,
      step: 5,
      default: 40,
      desc: "波の進む速さ。30〜50msが定番。80msを超えると1文字ずつ点灯して見え、波として繋がらない。",
    },
    {
      key: "hold",
      label: "hold(発色を保つ時間 ms)",
      min: 0,
      max: 400,
      step: 20,
      default: 120,
      desc: "アクセント色に留まる時間。100〜160msで「光って戻る」。300ms超は残像が長く、波の輪郭がぼやける。",
    },
    {
      key: "batch",
      label: "batch(同時に光る文字数)",
      min: 1,
      max: 5,
      step: 1,
      default: 1,
      desc: "1で1文字ずつの細かい波、2〜3で塊が進むブロック状の波になる。長い見出しほど大きめが読みやすい。",
    },
    {
      key: "dim",
      label: "dim(点灯前の濃さ %)",
      min: 0,
      max: 60,
      step: 5,
      default: 15,
      desc: "波が来る前の文字の不透明度。15〜25%だと「まだ読めないが形は見える」。0%は完全リビールになり別の動きに見える。",
    },
  ],
  promptTemplate: `見出しに color wave(文字色の波によるリビール)を実装してください。

- 見出しを1文字ずつ <span> に分割する(空白は white-space: pre で保持)
- 初期状態は最終色のまま opacity を {{dim}}% まで落として沈めておく
- {{batch}} 文字を1組として、組ごとに {{stagger}}ms ずつ遅らせて先頭から発火させる
- 発火した文字は 120ms でアクセント色 + opacity 1 まで上がり、{{hold}}ms 保持したあと 120ms で最終色へ戻る(opacity は 1 のまま)
- 動かすのは color と opacity だけ。文字送り(letter-spacing / width / margin)は変えずリフローさせない
- 分割で font-kerning が崩れるため、分割した span を含む要素に font-kerning: none を指定する
- prefers-reduced-motion 時は波を再生せず、最初から最終色 + opacity 1 で表示する`,
  ngExample: {
    say: "「見出しの文字を1文字ずつ光らせて」",
    why: "「光らせる」だけでは、通過後に色が戻るのか光ったままなのかが決まらない。text-shadowでぼんやり発光させる実装や、opacity 0→1のただのスタッガーフェードが返ってくることが多い。",
  },
  okExample: {
    say: "「color waveで実装。1文字ずつspan分割し、初期opacity 15%。40ms間隔で先頭から順に120msでアクセント色+opacity 1へ上げ、120ms保持後に最終色へ戻す。colorとopacityのみでリフロー禁止、font-kerning: none」",
    why: "波の向き・間隔・発色の保持時間・戻り先まで数値で固定してあるため、意図した「通過して定着する」波になる。「colorとopacityのみ」がレイアウトを動かす実装を封じる。",
  },
  vocab: [
    {
      term: "stagger",
      desc: "複数要素に一定間隔の遅延を付けて順に発火させること。この間隔が波の進行速度そのものになる。",
    },
    {
      term: "font-kerning",
      desc: "文字ペアごとの字詰め。1文字ずつspanに割るとペアが切れて字間が崩れるため、noneで揃えるのが定石。",
    },
    {
      term: "hold(保持)",
      desc: "アクセント色に留まる時間。0だと三角波のように光がすれ違うだけになり、長いと帯状の塗りに見える。",
    },
    {
      term: "リフロー",
      desc: "レイアウトの再計算。colorとopacityは合成のみで済むが、letter-spacingやwidthを動かすと毎フレーム発生して重くなる。",
    },
  ],
  related: ["gradient-shine", "split-text-reveal", "text-highlight"],
};
