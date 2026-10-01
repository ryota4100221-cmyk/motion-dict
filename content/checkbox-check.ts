import type { MotionEntry } from "@/lib/types";

export const checkboxCheck: MotionEntry = {
  slug: "checkbox-check",
  category: "ui",
  nameJa: "チェックボックスのチェック描画",
  nameEn: "animated checkbox / checkmark draw / check animation",
  lede: "チェックを入れた瞬間、まず箱が塗りで満たされ、少し遅れてその上にチェックの線が左から一筆で引かれる2段の演出。「箱が受け止める→線が書かれる」の時間差が、押した操作に手書きの署名のような確かさを足す。",
  params: [
    {
      key: "fillDuration",
      label: "fillDuration(箱が満ちる時間 s)",
      min: 0.1,
      max: 0.6,
      step: 0.05,
      default: 0.3,
      desc: "箱の塗りが出てくる時間。0.2〜0.3sが指に遅れない範囲。0.5sを超えると押した手応えより待ちが勝つ。",
    },
    {
      key: "drawDuration",
      label: "drawDuration(線を引く時間 s)",
      min: 0.15,
      max: 0.8,
      step: 0.05,
      default: 0.3,
      desc: "チェックの線が端から端まで描かれる時間。0.25〜0.35sが自然。短すぎると描いている過程が見えず、ただの表示切り替えになる。",
    },
    {
      key: "drawDelay",
      label: "drawDelay(線の出遅れ s)",
      min: 0,
      max: 0.4,
      step: 0.05,
      default: 0.15,
      desc: "箱の塗りが始まってから線を引き始めるまでの遅れ。塗りの尺の半分前後（0.3sなら0.15s）が定番。0だと塗りと線が同時に出て2段に見えない。",
    },
    {
      key: "popScale",
      label: "popScale(箱の膨らみ)",
      min: 1,
      max: 1.3,
      step: 0.01,
      default: 1.15,
      desc: "塗りの箱が0から出てくるとき、いったん膨らむ最大スケール。1.1〜1.15が「ポンと置かれた」程度。1で膨らみなし、1.25を超えるとおもちゃっぽくなる。",
    },
  ],
  promptTemplate: `フォームのチェックボックスに animated checkbox(checkmark draw)を実装してください。

- ネイティブの input[type=checkbox] は appearance: none で見た目だけ消し、キーボード操作・label との関連付け・checked 状態はそのまま使う（div で作り直さない）
- 箱の中に「塗りの層」と「SVGのチェック線」を重ねる。チェック線は path に pathLength="1" を付け、stroke-dasharray: 1 / stroke-dashoffset: 1 で隠しておく
- チェックを入れたとき
  1. 塗りの層：{{fillDuration}}s で scale(0)→scale({{popScale}})（尺の70%地点）→scale(1)、同時に opacity 0→1
  2. チェック線：{{drawDelay}}s 遅らせて、{{drawDuration}}s の ease で stroke-dashoffset 1→0。待ち時間中は animation-fill-mode: both で線を隠したままにする
- チェックを外すときは線を逆再生しない。塗りの層ごと opacity を 0.2s で抜くだけにする（外す操作は静かに）
- 動かすのは transform / opacity / stroke-dashoffset だけ（width・height・border-width を動かさない＝リフロー禁止）
- 箱は見た目が小さくても、クリック可能な範囲は label 全体＋44px 以上にする
- prefers-reduced-motion 時はスケール・線の描画を出さず、塗りとチェックを即時に表示／非表示する`,
  ngExample: {
    say: "「チェックボックスにチェックするときアニメーションを付けて」",
    why: "何がどの順で動くかが決まらない。箱ごと scale でバウンドさせるだけか、✓の文字を opacity でフェードさせるだけの実装が返ってきがちで、線が「書かれる」感触が出ない。input を div で作り直してキーボードで操作できなくなる実装や、外すときも同じ演出を逆再生する実装も多い。",
  },
  okExample: {
    say: "「animated checkboxを。input は appearance:none で残し、塗りの層は0.3sで scale 0→1.15→1＋フェード。チェック線は pathLength=1 の stroke-dashoffset 1→0 を0.15s遅らせて0.3s ease・fill both。外すときは0.2sフェードのみ。reduced-motion は即時切り替え」",
    why: "2つの層の尺・膨らみ・出遅れ・待機中の見え方まで数値で指定。「input を残す」「外すときは逆再生しない」の2点で、見た目だけでなくフォーム部品として正しいものが返ってくる。",
  },
  vocab: [
    {
      term: "animated checkbox / checkmark draw",
      desc: "チェックを入れたときに箱の塗りとチェック線を時間差で出すマイクロインタラクション。英語圏では check animation、checkmark stroke animation の名でも通じる。",
    },
    {
      term: "stroke-dashoffset",
      desc: "破線の開始位置をずらすSVGのプロパティ。線全長ぶんの破線を全長ぶんずらして隠し、0へ戻すと端から線が引かれていく。",
    },
    {
      term: "pathLength",
      desc: "パスの全長を任意の値（1など）とみなすSVG属性。getTotalLength() で実測しなくても dasharray / dashoffset を 1 基準で書ける。",
    },
    {
      term: "appearance: none",
      desc: "フォーム部品のOS標準の見た目を消す指定。input 自体は残るので、フォーカス・キーボード操作・送信値をそのまま使える。",
    },
    {
      term: "animation-fill-mode: both",
      desc: "delay の待ち時間中は0%の姿を、終わったあとは100%の姿を保つ指定。出遅れる線を「隠れたまま待たせる」ために使う。",
    },
  ],
  related: ["line-draw", "toggle-switch", "like-burst"],
};
