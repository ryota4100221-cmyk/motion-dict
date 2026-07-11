import type { MotionEntry } from "@/lib/types";

export const bootSequence: MotionEntry = {
  slug: "boot-sequence",
  category: "loading",
  nameJa: "ブートシーケンス",
  nameEn: "boot sequence / terminal loading",
  lede: "ターミナルの起動ログのように、読み込みメッセージが1行ずつ打ち出されていくローディング演出。行ごとのstaggerと行内のタイプ表示の二段構えで「システムが立ち上がっていく」空気を作る。開発系・テック系サイトのプリローダーの定番。1文をタイプするtypewriterと違い、複数行のシーケンスを設計する。",
  params: [
    {
      key: "charSpeed",
      label: "charSpeed(1文字の間隔 ms)",
      min: 5,
      max: 50,
      step: 5,
      default: 20,
      desc: "10〜30msが機械の出力らしい速さ。人の打鍵(70ms前後)より速くするのがログの説得力。",
    },
    {
      key: "lineDelay",
      label: "lineDelay(行間の待ち ms)",
      min: 50,
      max: 700,
      step: 50,
      default: 300,
      desc: "1行打ち終わってから次の行が始まるまでの間。200〜400msで「処理して次へ進む」リズムが出る。",
    },
    {
      key: "hold",
      label: "hold(完了後の静止 s)",
      min: 1,
      max: 5,
      step: 0.5,
      default: 2,
      desc: "全行出し終わってから画面遷移(デモではループ)までの静止。最終行を読ませるのに1.5s前後は置く。",
    },
  ],
  promptTemplate: `ローディング画面に boot sequence(ターミナル風の起動ログ演出)を実装してください。

- 等幅フォントのログを4〜6行用意し、上から順に1行ずつ表示する。各行は {{charSpeed}}ms 間隔で1文字ずつタイプ表示する(sliceの長さを進める方式。時間管理はrequestAnimationFrame)
- 1行打ち終わったら {{lineDelay}}ms 待ってから次の行を始める(行のstagger)
- いまタイプ中の行の末尾にだけキャレット(▌)を置き、点滅させる
- 全行出し終わったら {{hold}}s 静止し、その後ローディングを終了する(実際の読み込み完了と同期させる場合は最終行を「done」等の完了報告にする)
- 行数分の高さをあらかじめ確保し、行が増えてもレイアウトが動かないようにする
- prefers-reduced-motion 時は全行を即時表示し、キャレットの点滅を止める`,
  ngExample: {
    say: "「ターミナルっぽいローディングにして」",
    why: "行数・速度・行間のリズムが全部未定義。全行が同時にフェードインするだけの実装や、setIntervalの多重掛けでタブ切替後にログの順番が壊れる実装が返ってきがち。",
  },
  okExample: {
    say: "「boot sequenceを実装。5行のログを20ms/文字でタイプ、行間300ms、タイプ中の行にだけ▌キャレット。全行後2s静止してループ。rAF+slice方式で、高さは先に確保」",
    why: "文字速度・行間・キャレットの位置・完了後の挙動・実装方式まで指定。「タイプ中の行にだけキャレット」まで言うと、全行にカーソルが残る雑な実装を防げる。",
  },
  vocab: [
    {
      term: "stagger",
      desc: "複数要素を少しずつずらして動かすこと。ここでは行の開始タイミングをlineDelayずつ遅らせる。",
    },
    {
      term: "プロンプト記号",
      desc: "行頭の > や $ などの記号。これがあるだけでテキストが「ターミナルのログ」に見える。",
    },
    {
      term: "slice方式",
      desc: "text.slice(0, n)のnを進めて表示する実装。行ごとの開始時刻さえ決めれば経過時間から全行の状態を計算でき、ループにも強い。",
    },
    {
      term: "キャレット",
      desc: "入力位置を示す点滅カーソル(▌)。タイプ中の行の末尾だけに出すのがログらしさの要。",
    },
  ],
  related: ["typewriter", "preloader-counter", "loading-bar"],
};
