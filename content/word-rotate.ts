import type { MotionEntry } from "@/lib/types";

export const wordRotate: MotionEntry = {
  slug: "word-rotate",
  category: "text",
  nameJa: "ワードローテーション",
  nameEn: "word rotate / rotating text",
  lede: "文中の1単語だけが一定間隔で順に入れ替わる見出し演出。「デザイン/コピー/実装 を、伝わる形に」のように提供価値を1行に畳み込める。マスク＋translateYで回すのが定石。",
  params: [
    {
      key: "interval",
      label: "interval(表示間隔 s)",
      min: 0.8,
      max: 4,
      step: 0.1,
      default: 2,
      desc: "2s前後が読みやすい。1s未満は読み終わる前に切り替わって焦らせる。",
    },
    {
      key: "duration",
      label: "duration(切替時間 s)",
      min: 0.2,
      max: 1.2,
      step: 0.05,
      default: 0.5,
      desc: "0.4〜0.6sが自然。切替が速すぎると入れ替わったことに気づけない。",
    },
  ],
  promptTemplate: `見出しに word rotate を実装してください。

- 「◯◯を、伝わる形に」の◯◯部分だけを ["デザイン", "コピー", "実装"] で順に入れ替える
- 回る単語は overflow: hidden のマスク(inline-block)で包み、translateY で回す
- 各単語を {{interval}}s 表示したら、現在の単語を translateY(-100%) へ、次の単語を translateY(100%)→0 へ {{duration}}s の ease-out で同時に動かす
- opacityフェードやdisplay切替ではなく transform で動かす(リフロー禁止)
- 単語ごとの幅の違いはマスクの width を transition で追従させ、後続テキストのガタつきを抑える
- 最後の単語まで行ったら先頭に戻って無限ループ
- prefers-reduced-motion 時は回転を止め、最初の単語を固定表示する`,
  ngExample: {
    say: "「キャッチコピーの単語がパラパラ変わるようにして」",
    why: "間隔・切替時間・動き方が全部未定義。opacityのフェード切替だけの実装や、単語幅の変化で後ろの文章がガタガタ動く実装が返ってきがち。",
  },
  okExample: {
    say: "「word rotateを実装。マスク+translateYで回す。表示2s・切替0.5s ease-out、幅はwidthのtransitionで追従、無限ループ、reduced-motion時は先頭単語で固定」",
    why: "実装方式(マスク+translateY)と間隔・切替時間・幅の扱いまで指定。「幅を追従」の一言がないと文中で使えない実装になる。",
  },
  vocab: [
    {
      term: "マスク",
      desc: "overflow: hidden の親要素。単語はこの窓の中でtranslateYし、窓の外に出た瞬間に見えなくなる。",
    },
    {
      term: "in/outの同時進行",
      desc: "現在の単語が上へ抜けるのと同時に次の単語が下から入る。片方ずつだと空白の瞬間が生まれて間延びする。",
    },
    {
      term: "幅追従",
      desc: "単語の文字数に合わせてマスクのwidthをtransitionさせること。これを怠ると後続テキストが跳ねる。",
    },
    {
      term: "ループ境界",
      desc: "最後の単語→先頭の単語への戻り。ここだけ逆方向に回すと違和感が出るので、常に同方向で回すのが基本。",
    },
  ],
  related: ["typewriter", "split-text-reveal", "number-roll"],
};
