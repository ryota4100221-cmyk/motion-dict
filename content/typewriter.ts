import type { MotionEntry } from "@/lib/types";

export const typewriter: MotionEntry = {
  slug: "typewriter",
  category: "text",
  nameJa: "タイプライター",
  nameEn: "typewriter effect",
  lede: "一文が1文字ずつ打たれていき、末尾でキャレット(カーソル)が点滅する動き。ターミナル・対話UI・自己紹介の一文など「いま語りかけている」空気を作りたい場面で使われる。",
  params: [
    {
      key: "speed",
      label: "speed(1文字の間隔 ms)",
      min: 30,
      max: 200,
      step: 10,
      default: 70,
      desc: "70前後が人の打鍵らしい速さ。120を超えると焦れったくなる。",
    },
    {
      key: "blink",
      label: "blink(キャレット点滅周期 s)",
      min: 0.3,
      max: 1.2,
      step: 0.05,
      default: 0.6,
      desc: "1周期でON/OFFが1回ずつ。0.5〜0.7sが端末の標準的な点滅感。",
    },
  ],
  promptTemplate: `テキストに typewriter effect を実装してください。

- 一文を {{speed}}ms 間隔で1文字ずつ表示する(sliceの長さを進める方式。時間管理はrequestAnimationFrame)
- 文末に▌のキャレットを置き、{{blink}}s 周期で点滅させる
- 打ち終わったら1.5秒静止し、テキストをクリアして最初からループ再生する
- 全文と同じ幅を透明なダミーテキストで先に確保し、タイプ中にレイアウトが動かないようにする
- prefers-reduced-motion 時は全文を即表示し、キャレットの点滅を止める`,
  ngExample: {
    say: "「文字が打たれてる感じで出して」",
    why: "速度・キャレットの有無・打ち終わった後の挙動(静止/ループ/消える)が全部未定義。setIntervalで雑に実装され、タブ切替後に文字が飛ぶ実装が返ってきがち。",
  },
  okExample: {
    say: "「typewriter effectを実装。70ms間隔でslice方式、末尾に▌キャレットを0.6s周期で点滅、打ち終わったら1.5秒静止してループ。幅は先に確保してガタつかせない」",
    why: "間隔・カーソル仕様・終了時の挙動・レイアウト固定まで指定している。特に「幅を先に確保」は言わないと中央寄せがタイプ中ずっと動いてしまう。",
  },
  vocab: [
    {
      term: "キャレット",
      desc: "文字入力位置を示す点滅カーソル。▌や1px縦線で作る。これがあるだけで「打っている」説得力が段違いになる。",
    },
    {
      term: "slice方式",
      desc: "text.slice(0, n)のnを進めて全文の先頭から切り出す実装。1文字ずつDOMを足すよりリセットとループが簡単で壊れにくい。",
    },
    {
      term: "hold",
      desc: "打ち終わってから次の動作(クリア・ループ)までの静止時間。読む時間を与えないと落ち着きのない演出になる。",
    },
    {
      term: "CLS",
      desc: "レイアウトのガタつき(Cumulative Layout Shift)。タイプ中に幅が伸びて周囲が動くのを、透明ダミーで幅を先取りして防ぐ。",
    },
  ],
  related: ["text-scramble", "counter", "split-text-reveal"],
};
