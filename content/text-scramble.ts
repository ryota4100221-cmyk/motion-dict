import type { MotionEntry } from "@/lib/types";

export const textScramble: MotionEntry = {
  slug: "text-scramble",
  category: "hover",
  nameJa: "テキストスクランブル",
  nameEn: "text scramble / text shuffle",
  lede: "ホバーすると文字がランダムに入れ替わり、左から順に元のテキストへ確定していく動き。サイバー・技術系の世界観と相性がよく、ナビゲーションやボタンのラベルで使われる。",
  params: [
    {
      key: "speed",
      label: "speed(1文字の確定間隔 ms)",
      min: 15,
      max: 120,
      step: 5,
      default: 45,
      desc: "小さいほど一瞬で確定する。60を超えるとじっくり解読される印象。",
    },
    {
      key: "charset",
      label: "charset(シャッフルに使う文字)",
      min: 0,
      max: 3,
      step: 1,
      default: 0,
      options: ["英大文字", "数字", "カタカナ", "記号"],
      desc: "英大文字は技術系、カタカナは和風サイバー。世界観で選ぶ。",
    },
  ],
  promptTemplate: `テキストに text scramble を実装してください。

- ホバー開始で全文字をランダム文字に置き換え、左から1文字ずつ {{speed}}ms 間隔で元の文字に確定させる
- シャッフルに使う文字セットは{{charset}}
- 未確定の文字は2〜3フレームごとにランダムに入れ替え続ける(requestAnimationFrame使用)
- 実行中に再ホバーされたら前のアニメーションをキャンセルして最初からやり直す
- prefers-reduced-motion 時はシャッフルせず即座に元のテキストを表示する`,
  ngExample: {
    say: "「文字がバラバラってなるやつやって」",
    why: "「バラバラ」が入れ替わりなのか分解して飛ぶのか不明。確定の方向(左から/ランダム順)、速度、使う文字も未定義で、意図と違う派手な演出が返ってきがち。",
  },
  okExample: {
    say: "「text scrambleを実装。左から順に45ms間隔で確定、未確定文字はランダムに入れ替え続ける、文字セットは英大文字、実行中の再ホバーはキャンセル」",
    why: "確定順・間隔・文字セット・多重起動の扱いまで指定している。特にキャンセル処理は言わないと壊れやすい。",
  },
  vocab: [
    {
      term: "charset",
      desc: "シャッフル中に表示するランダム文字の集合。英大文字なら技術系、カタカナなら和風サイバーの空気になる。",
    },
    {
      term: "resolve",
      desc: "ランダム文字が元の文字に確定すること。左から順に確定すると「解読されていく」物語が生まれる。",
    },
    {
      term: "rAF",
      desc: "requestAnimationFrame。描画フレームごとに処理を回すAPI。setIntervalよりカクつかない。",
    },
    {
      term: "等幅フォント",
      desc: "文字が入れ替わっても幅が揺れない。スクランブルはmonospaceのフォントと組むのが基本。",
    },
  ],
  related: ["underline-reveal", "custom-cursor"],
};
