import type { MotionEntry } from "@/lib/types";

export const numberRoll: MotionEntry = {
  slug: "number-roll",
  category: "text",
  nameJa: "ナンバーロール",
  nameEn: "number roll / slot machine counter",
  lede: "数字が桁ごとにスロットのように縦回転して確定するカウンター演出。値を書き換えるカウントアップ(counter)と違い、0〜9の縦リストを桁単位でtranslateYする物理的な回転。桁ごとのstaggerで「順に揃っていく」気持ちよさが出る。",
  params: [
    {
      key: "duration",
      label: "duration(回転時間 s)",
      min: 0.5,
      max: 3,
      step: 0.1,
      default: 1.2,
      desc: "1〜1.5sが目安。ease-outで最後にゆっくり止まる余韻まで含めた長さ。",
    },
    {
      key: "stagger",
      label: "stagger(桁ごとの遅延 ms)",
      min: 0,
      max: 300,
      step: 10,
      default: 80,
      desc: "60〜100msが心地よい。0だと全桁一斉でスロット感が消える。",
    },
  ],
  promptTemplate: `数値表示に number roll(slot machine counter)を実装してください。

- 各桁を overflow: hidden のマスク(高さ1em)にし、中に 0〜9 を縦に2周並べたリストを入れる
- 各桁のリストを translateY で目標の数字の位置まで回す。2周目の数字を目標にすると、小さい数字でも全桁が必ず1回転して見える
- {{duration}}s の cubic-bezier(0.22, 1, 0.36, 1) で回し、桁ごとに {{stagger}}ms ずつ遅らせて左の桁から順に確定させる
- カウントアップのように textContent を書き換えるのではなく、transform だけで動かす(リフロー禁止)
- 桁幅のガタつきを防ぐため等幅フォントまたは font-variant-numeric: tabular-nums を指定する
- カンマなどの記号は回さず静的に置く
- prefers-reduced-motion 時は回転させず最終値を即表示する`,
  ngExample: {
    say: "「数字をスロットみたいにカラカラ回して」",
    why: "counterとの区別が伝わらず、値を書き換えるだけのカウントアップが返ってくることが多い。回転系でも、setIntervalで無限に回して最終値で止まらない事故が起きがち。",
  },
  okExample: {
    say: "「number rollを実装。桁ごとに0〜9×2周の縦リストをtranslateY、1.2s cubic-bezier(0.22,1,0.36,1)、stagger 80msで左から確定、tabular-nums、reduced-motionは最終値を即表示」",
    why: "実装方式(縦リスト+transform)を明示してカウントアップとの取り違えを防ぎ、確定順・桁揃え・止め方まで指定している。",
  },
  vocab: [
    {
      term: "縦リスト(digit column)",
      desc: "0〜9を縦に積んだ桁の実体。translateYの移動量=数字×1行分で、目標の数字だけがマスクの窓に残る。",
    },
    {
      term: "2周リスト",
      desc: "リストを0〜9の2周にして2周目側を目標にするテクニック。目標が0や1でも必ず1回転してスロット感が出る。",
    },
    {
      term: "stagger",
      desc: "桁ごとの開始遅延。左から順に確定させると「数字が揃っていく」快感が生まれる。",
    },
    {
      term: "tabular-nums",
      desc: "数字を等幅で描画するfont-variant-numericの値。回転中に桁幅がガタつかなくなる。",
    },
  ],
  related: ["counter", "word-rotate", "typewriter"],
};
