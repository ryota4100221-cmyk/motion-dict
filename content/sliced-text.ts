import type { MotionEntry } from "@/lib/types";

export const slicedText: MotionEntry = {
  slug: "sliced-text",
  category: "text",
  nameJa: "スライステキスト（斜め断ち）",
  nameEn: "sliced text / text slice / diagonal cut text",
  lede: "見出しを浅い斜め線で断ち切り、断片を切り口と直角にずらして見せる演出。ずらすのは数pxで足りる。文字を読ませたまま「切れた」印象だけを足せるのが強み。",
  params: [
    {
      key: "slices",
      label: "slices(断片の数)",
      min: 2,
      max: 6,
      step: 1,
      default: 2,
      desc: "2枚が最も上品で読みやすい。4枚以上はシュレッダー寄りの荒い表情になる。",
    },
    {
      key: "tilt",
      label: "tilt(切り口の傾き %)",
      min: 0,
      max: 60,
      step: 1,
      default: 20,
      desc: "文字高に対する左右の高低差。15〜25%が「わずかに斜め」で品よく決まる。",
    },
    {
      key: "offset",
      label: "offset(ずらし量 px)",
      min: 0,
      max: 40,
      step: 1,
      default: 10,
      desc: "6〜14pxが目安。文字高の1/5を超えると断片が別物に見えて読めなくなる。",
    },
    {
      key: "duration",
      label: "duration(断ち切りの時間 s)",
      min: 0.3,
      max: 1.6,
      step: 0.05,
      default: 0.7,
      desc: "0.6〜0.8sが自然。ずれきるのは前半3割で、残りは戻りの余韻に使う。",
    },
  ],
  promptTemplate: `見出しに sliced text(斜め断ち)を実装してください。

- 同じテキストを {{slices}} 枚重ね、それぞれ clip-path: polygon() で横帯に切り分ける
- 帯の境界は水平ではなく傾ける。左右の高低差は文字高の {{tilt}}% とする
- 再生時、隣り合う断片を互いに逆向きへ {{offset}}px ずらす。向きは切り口と直角(上下)を主とし、
  切り口に沿った横滑りを 0.8 倍だけ混ぜる
- ずれは {{duration}}s のうち前半30%で最大に達し、残りで 0 に戻す。イージングは cubic-bezier(0.22, 1, 0.36, 1)
- 動かすのは transform のみ。top/left や margin は使わない(リフローさせない)
- 断片は aria-hidden にし、読み上げ用のテキストを1つだけ別に持たせる
- prefers-reduced-motion 時はずらしも走査線も出さず、断片を合わせた静止状態で表示する`,
  ngExample: {
    say: "「見出しをスライスしたみたいに切って動かして」",
    why: "「スライス」だけでは切る向き・枚数・ずらし量が決まらない。文字が真っ二つに分かれたまま戻らない実装や、単なるグリッチのRGBずれが返ってくることが多い。",
  },
  okExample: {
    say: "「見出しを clip-path: polygon() で2枚の斜め帯に分け、上下を逆向きに10pxずらして0.7sで戻す。傾きは文字高の20%、transformのみ」",
    why: "切り分け方(polygon)・枚数・傾き・ずらし量・戻す時間まで数値で指定している。「戻す」を明示しないと、ずれっぱなしの静止デザインとして実装されがち。",
  },
  vocab: [
    {
      term: "clip-path: polygon()",
      desc: "任意の多角形で要素を切り抜く指定。斜めの帯はこれで作る。border や mask 画像は不要。",
    },
    {
      term: "切り口の傾き(tilt)",
      desc: "断ち切り線の角度。度数ではなく「左右の高低差が文字高の何%か」で持つと、文字幅が変わっても見た目が崩れない。",
    },
    {
      term: "直角ずらし",
      desc: "断片を切り口と垂直方向へ動かすこと。切れ目が開いて見えるので「切った」と読ませられる。平行にずらすと段差にしか見えない。",
    },
    {
      term: "走査線(sweep line)",
      desc: "切り口に沿って一度だけ走る細い光の線。刃が通った瞬間を示す補助演出で、scaleX(0→1)で伸ばす。",
    },
  ],
  related: ["split-text-reveal", "block-reveal", "glitch-hover"],
};
