import type { MotionEntry } from "@/lib/types";

export const progressiveBlur: MotionEntry = {
  slug: "progressive-blur",
  category: "scroll",
  nameJa: "プログレッシブブラー（端のぼかしフェード）",
  nameEn: "progressive blur / gradient blur",
  lede: "スクロール領域の端へ向かってぼかしが段々強くなる帯を敷き、内容をそこへ溶かして消す処理。ぼかし量の違う層をグラデーションマスクで重ねるのが要点で、不透明グラデーションで覆うだけの処理より奥行きが出る。",
  params: [
    {
      key: "layers",
      label: "layers(重ねる層の数)",
      min: 2,
      max: 6,
      step: 1,
      default: 4,
      desc: "3〜4層で段差はほぼ見えなくなる。backdrop-filterのコストは層数に比例するので増やしすぎない。",
    },
    {
      key: "maxBlur",
      label: "maxBlur(端のぼかし量 px)",
      min: 4,
      max: 40,
      step: 1,
      default: 20,
      desc: "最も端の層のぼかし量。16〜24pxが目安。40px近くまで上げると帯そのものが主張し始める。",
    },
    {
      key: "height",
      label: "height(帯の高さ %)",
      min: 12,
      max: 60,
      step: 1,
      default: 34,
      desc: "領域の高さに対する帯の割合。30%前後が自然。広げすぎると素で読める範囲が減る。",
    },
    {
      key: "edge",
      label: "edge(ぼかす端)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["bottom", "top"],
      desc: "下端は「まだ続きがある」の合図、上端は固定ヘッダーの下敷きに使う。",
    },
  ],
  promptTemplate: `スクロール領域に progressive blur（端のぼかしフェード）を実装してください。

- スクロール領域の {{edge}} 側に、高さ {{height}}% の帯を position: absolute で重ねる（pointer-events: none）
- 帯の中に {{layers}} 枚の層を並べ、各層に backdrop-filter: blur() を掛ける
- ぼかし量は内側の層から端の層へ向かって増やし、最も端の層を {{maxBlur}}px にする
- 各層に mask-image: linear-gradient() を掛け、内側を transparent・端側を不透明にする。開始位置は層ごとに 1/層数 ずつ端へ寄せる（層が重なることでぼかしが端に向かって累積する）
- 単色のグラデーションで覆うだけにしない（ぼかしが無いと奥行きが出ない）。可読性のために背景色へのグラデーション（scrim）を併用してよい
- backdrop-filter は -webkit- 付きも併記し、@supports not (backdrop-filter: blur(1px)) では背景色グラデーションのみにフォールバックする
- 帯は「その方向にまだスクロールできるとき」だけ表示し、端まで来たら opacity で消す。切り替えは transform / opacity のみで行い、レイアウトを触らない
- prefers-reduced-motion: reduce のときは帯の出し入れのトランジションを 0s にして即時切り替えにする（段階ぼかし自体は静的な表現なので残す）`,
  ngExample: {
    say: "「リストの下を自然にフェードアウトさせて」",
    why: "背景色のlinear-gradientを1枚重ねただけの実装が返ってくる。文字が「ベタ塗りに隠れた」ようになり、ぼかし特有の奥行きが出ない。層数・ぼかし量・帯の高さも決まらない。",
  },
  okExample: {
    say: "「progressive blurで下端をぼかす。backdrop-filter: blurの層を4枚重ね、mask-image: linear-gradientで内側transparent→端側不透明、開始位置を層ごとに25%ずつ下へ。端の層は20px、帯の高さは34%。下にスクロールできる間だけ表示し、prefers-reduced-motion時はトランジションなし」",
    why: "「層を重ねてマスクをずらす」という実装方式そのものを指定しているので、1枚グラデーションに落ちない。層数・ぼかし量・帯の高さ・表示条件・reduced-motionまで数値と条件で確定している。",
  },
  vocab: [
    {
      term: "backdrop-filter",
      desc: "要素の「背後にあるもの」に掛けるフィルター。filterと違い自分自身は加工しないので、上に乗せた文字は鮮明なまま背景だけぼかせる。",
    },
    {
      term: "mask-image",
      desc: "要素の見える範囲を画像やグラデーションの不透明度で決めるプロパティ。linear-gradientを渡すと「どこから効かせるか」を連続的に指定できる。",
    },
    {
      term: "段階ぼかし（layered blur）",
      desc: "ぼかし量の違う層をマスクをずらして重ね、端に向かってぼかしを累積させる手法。1枚では作れない滑らかなぼかしの勾配が出る。",
    },
    {
      term: "scrim",
      desc: "可読性を確保するために敷く半透明の覆い。ぼかしだけでは輝度が残るため、背景色へのグラデーションを添えて完全に溶かす。",
    },
    {
      term: "スクロールアフォーダンス",
      desc: "「まだ続きがある」ことを見せる手掛かり。端がぼけて切れていると続きの存在が伝わり、端まで来て消えると終端が伝わる。",
    },
  ],
  related: ["frosted-glass", "scroll-fade-in", "blur-reveal"],
};
