import type { MotionEntry } from "@/lib/types";

export const starRating: MotionEntry = {
  slug: "star-rating",
  category: "ui",
  nameJa: "星評価（ホバーで手前まで灯る）",
  nameEn: "star rating / rating stars hover / rating input",
  lede: "星の上にポインタを載せると、1つ目からその星までが一度に灯り、指の下の星だけが少し膨らむ評価入力。押す前に「いくつ付けるか」を見せるプレビューが本体で、離せば確定値に戻り、同じ星をもう一度押せば取り消せる。",
  params: [
    {
      key: "count",
      label: "count(星の数)",
      min: 3,
      max: 10,
      step: 1,
      default: 5,
      desc: "評価の段階数。5段階が定番で、各段に「Poor〜Excellent」のような言葉を添えられる。10段階は数字の評価に近くなり、星1つあたりのヒット領域が細って押し間違いが増える。",
    },
    {
      key: "lift",
      label: "lift(指の下の星の拡大率)",
      min: 1,
      max: 1.4,
      step: 0.01,
      default: 1.15,
      desc: "ポインタが載っている1つだけを拡大する。1.1〜1.2で「ここを押す」が伝わる。1.3を超えると隣の星に被り、並びが揺れて見える。1.0なら色だけで伝える。",
    },
    {
      key: "duration",
      label: "duration(灯る・膨らむ時間 s)",
      min: 0,
      max: 0.5,
      step: 0.01,
      default: 0.15,
      desc: "色と拡大の transition。0.1〜0.2sが指に遅れない範囲。ポインタは星の間を素早く行き来するので、0.3sを超えると灯りが追いつかず、どこまで選んでいるのか読めなくなる。",
    },
    {
      key: "stagger",
      label: "stagger(1つずつ灯る間隔 ms)",
      min: 0,
      max: 80,
      step: 5,
      default: 0,
      desc: "変わった星を手前から順に遅らせる量。0なら一斉に灯る（観察元はこれ）。20〜40msで左から流れて灯る演出になる。大きくすると素早く動かしたときにプレビューが遅れる。",
    },
  ],
  promptTemplate: `評価入力に star rating（hover preview 付き）を実装してください。

- きっかけ: マウスは星への pointerenter でプレビュー（pointerType が mouse のときだけ）、クリックで確定。並びから外れたら確定値の表示に戻る。タッチはタップで即確定
- 星は {{count}} 個。各星は <button type="button"> にし、aria-label="Rate n out of {{count}}"、確定中の星に aria-pressed="true" を付ける。並びには評価の説明ラベル（例:「満足度」）を添える
- 状態は「確定値 value」と「ポインタが載っている星 hover」の2つを持ち、表示に使うのは hover ?? value。1番目から表示値までの星を塗り、それより後ろは輪郭だけにする
- ポインタが載っている星（hover の星）だけを transform: scale({{lift}}) に拡大する。塗られた他の星は大きさを変えない
- 色（color / fill）と transform に {{duration}}s ease の transition を掛ける。width や margin は動かさない（transform のみ・リフロー禁止）
- 表示値が変わったとき、切り替わる星だけに変化の起点側から順に transition-delay を {{stagger}}ms ずつ足す（増えるときは左から右へ、減るときは右から左へ。0 なら一斉に変わる）
- 並び全体から pointerleave したら hover を null に戻し、確定値の表示に戻す
- クリックで value を確定する。確定中の星をもう一度押したら value を null に戻す（取り消せる）
- 表示値に応じて「Poor / Fair / Good / Very Good / Excellent」のような言葉を横に出す（5段階のとき）
- タッチ端末には hover が無いので、タップで即確定して塗りを見せる。ヒット領域は星1つあたり 44px 以上を確保する
- prefers-reduced-motion 時は transition と拡大を無効にし、塗りの切り替えだけで状態を伝える`,
  ngExample: {
    say: "「5段階の星評価をつけて、ホバーでいい感じに光らせて」",
    why: "「光らせる」が何を指すか決まらない。ホバーした1つだけが光る実装（手前の星が灯らないので「いくつ付けるか」が読めない）や、全部の星が一斉に脈打つ実装が返ってきがち。離したら確定値へ戻る・同じ星で取り消す、の2つも抜けやすく、一度付けた評価を消せないフォームになる。",
  },
  okExample: {
    say: "「star rating を5個の button で。表示は hover ?? value、1〜表示値を塗り、hover の星だけ scale 1.15。color と transform に 0.15s の transition。pointerleave で確定値に戻し、同じ星の再クリックで取り消し。タッチはタップ確定・reduced-motionは塗り替えのみ」",
    why: "「手前まで塗る」プレビューの表示ルールと、拡大する星の範囲（1つだけ）・速さ・戻り方・取り消しまで指定。hover と value を分けて持つ一言で、プレビューと確定がぶつからない実装になる。",
  },
  vocab: [
    {
      term: "star rating",
      desc: "星の数で評価を入力・表示する部品。英語圏では rating stars / star rating input の名で通じる。表示専用のものは read-only rating と呼び分ける。",
    },
    {
      term: "hover preview",
      desc: "押す前に、押したらどうなるかを先に見せること。星評価では「1番目からポインタの星まで」を灯すのがそれにあたる。",
    },
    {
      term: "value / hover の二重状態",
      desc: "確定した値と、ポインタが示している仮の値を別々に持ち、表示には仮の値を優先する設計。離れたら確定値に戻るのはこの分離のおかげ。",
    },
    {
      term: "allow clear",
      desc: "確定中の星をもう一度押すと未評価に戻せる仕様。これが無いと一度付けた評価を消せない。",
    },
    {
      term: "aria-pressed",
      desc: "トグルボタンのON/OFFを支援技術に伝える属性。星ボタンでは「いま確定している星」を示す。",
    },
  ],
  titleAct: { act: "star-rating" },
  aliases: ["星", "キラッ", "評価", "ピカッ"],
  related: ["checkbox-check", "like-burst", "toggle-switch"],
};
