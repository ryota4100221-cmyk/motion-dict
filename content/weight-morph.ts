import type { MotionEntry } from "@/lib/types";

export const weightMorph: MotionEntry = {
  slug: "weight-morph",
  category: "text",
  nameJa: "ウェイトモーフ",
  nameEn: "variable font weight animation / wght axis animation / font-variation-settings",
  lede: "可変フォントのウェイト軸を連続で動かし、文字の太さ自体をアニメーションさせる見出し演出。1文字ずつ位相をずらすと太さが波のように語を渡っていき、静的ウェイトのフォントでは絶対に出せない「字が呼吸する」質感になる。",
  params: [
    {
      key: "wmin",
      label: "wmin(いちばん細いウェイト)",
      min: 100,
      max: 900,
      step: 10,
      default: 200,
      desc: "波の谷の太さ。200〜300が下限の目安。100まで落とすと黒地では線が飛んで消えるので、暗い背景では300以上が安全。",
    },
    {
      key: "wmax",
      label: "wmax(いちばん太いウェイト)",
      min: 100,
      max: 900,
      step: 10,
      default: 900,
      desc: "波の山の太さ。wminとの差が300以上ないと「動いている」と読めない。差を600以上取ると文字の輪郭が別物に見えて印象が強くなる。",
    },
    {
      key: "duration",
      label: "duration(1往復の時間 s)",
      min: 0.8,
      max: 5,
      step: 0.1,
      default: 2.2,
      desc: "1文字が細→太→細を1周する時間。2〜3sが呼吸に近く自然。1s以下は点滅に見えて文字が読みにくくなる。",
    },
    {
      key: "stagger",
      label: "stagger(隣の文字との位相差 ms)",
      min: 0,
      max: 300,
      step: 5,
      default: 120,
      desc: "隣の字へ波が伝わる遅れ。100〜150msで「左から流れる」と読める。0にすると全文字が同時に太るので波ではなく一括の明滅になる。",
    },
  ],
  promptTemplate: `見出しに weight morph(可変フォントのウェイト軸アニメーション)を実装してください。

- 可変フォント(wght軸を持つもの。例: Inter / Roboto Flex)を weight のレンジ指定で読み込む。静的ウェイトのフォントだと400と700の間を飛ぶだけでアニメーションにならない
- 語を1文字ずつ span に分割し、各 span を display: inline-block にする
- 各文字のウェイトを {{wmin}} 〜 {{wmax}} の間で往復させる。位相は cos を使い w = wmin +(wmax - wmin)×(0.5 - 0.5×cos(2π×phase)) で求める
- 1往復は {{duration}}s。隣の文字とは {{stagger}}ms ずつ位相をずらし、波が語を渡っていくようにする
- 太さの指定は font-variation-settings ではなく font-weight を使う(wghtは登録済み軸なので高レベルプロパティ側が正しい。font-variation-settings は継承と font-matching を素通りする)
- 🔴 ウェイトを変えると字幅(advance width)が変わりリフローする。各文字を最大ウェイトで1度だけ実測し、その幅を width に固定して隣の字が動かないようにする(計測は「全文字に最大ウェイトを当てる→まとめて幅を読む」の順で1回のレイアウトに収める)
- 本文やボタンラベルには使わない。短い見出し1語だけに限定する
- prefers-reduced-motion 時はアニメーションを止め、wmin と wmax の中間の太さで静止させる`,
  ngExample: {
    say: "「見出しの文字の太さをアニメーションさせて」",
    why: "静的ウェイトのフォントのまま実装され、400と700の2段しか出ずカクッと切り替わるだけのものが返ってくる。可変フォントを使うこと自体が前提条件なのに、それを言わないと伝わらない。字幅が変わって隣の文字が揺れる問題も放置されがち。",
  },
  okExample: {
    say: "「Interを weight:'100 900' で読み込み、1文字ずつspanに割って font-weight を200〜900で往復。1周2.2s、隣の字と120msずらして波にする。字幅は最大ウェイトで実測して固定しリフローを止める。reduced-motion時は中間ウェイトで静止」",
    why: "可変フォントであること・軸の範囲・波の作り方(位相差)・リフロー対策まで指定している。「font-variation-settingsではなくfont-weight」「幅を実測して固定」の2点が、動く実装と実務で使える実装を分ける。",
  },
  vocab: [
    {
      term: "可変フォント(variable font)",
      desc: "1つのフォントファイルに太さや幅を連続的な軸として持たせた形式。従来は400・700と別ファイルだったものが、その間の460や881も出せる。",
    },
    {
      term: "ウェイト軸(wght axis)",
      desc: "太さを司る登録済みの可変軸。100〜900の範囲を連続で取れる。CSSからは font-weight でそのまま指定でき、小数も受け付ける。",
    },
    {
      term: "font-variation-settings",
      desc: "可変軸を低レベルに直接叩くプロパティ。wghtのような登録済み軸では font-weight を使うのが正で、これはフォント独自の軸(GRAD・slnt等)を触るときの逃げ道。",
    },
    {
      term: "字送り幅(advance width)",
      desc: "1文字が占める横幅。太くすると字送りも広がるため、ウェイトを動かすと隣の文字が押し出されてリフローする。幅を実測して固定すると止まる。",
    },
    {
      term: "位相差(stagger)",
      desc: "同じ動きを隣の要素へ少しずつ遅らせて渡すこと。ここでは文字ごとに開始時刻をずらすことで、太さの変化が波として読めるようになる。",
    },
  ],
  related: ["tracking-in", "letter-spacing-hover", "wave-text"],
};
