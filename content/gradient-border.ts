import type { MotionEntry } from "@/lib/types";

export const gradientBorder: MotionEntry = {
  slug: "gradient-border",
  category: "media",
  nameJa: "グラデーションボーダー",
  nameEn: "animated gradient border / conic border glow",
  lede: "枠線をグラデーションの光が絶え間なく周回する演出。conic-gradientの開始角を回すだけで、カードやCTAに「通電しているような」生命感を与える。SaaSやAI系プロダクトのカードで一気に定番化した。",
  params: [
    {
      key: "speed",
      label: "speed(1周の時間 s)",
      min: 1,
      max: 12,
      step: 0.5,
      default: 5,
      desc: "4〜6sが上品。2s以下はせわしなく安っぽい。10s超は動いていることに気づかれない。",
    },
    {
      key: "thickness",
      label: "thickness(枠の太さ px)",
      min: 1,
      max: 6,
      step: 1,
      default: 2,
      desc: "1〜2pxが繊細で今風。4px以上はネオンサイン寄りになるのでトンマナと相談。",
    },
    {
      key: "glow",
      label: "glow(にじみの半径 px)",
      min: 0,
      max: 24,
      step: 2,
      default: 10,
      desc: "縁の外へにじむ発光の量。0でシャープな枠、8〜12pxで柔らかいグロー。大きいほど暗い背景でないと締まらない。",
    },
  ],
  promptTemplate: `カードやボタンに animated gradient border(枠を光のグラデーションが周回する演出)を実装してください。

- 回転角を @property --angle { syntax: "<angle>"; initial-value: 0deg; inherits: false } で登録する(これが無いと角度が数値補間されずアニメーションが一切効かない)
- 枠は border ではなく、要素の背景を conic-gradient(from var(--angle), ...) にし、内側に本来の地色を敷いた層を {{thickness}}px 内側へ重ねてリング状に見せる
- グラデーションは大部分を暗いベース色にし、一箇所だけ明るい帯を置く(ベース → 明色 → ベース)。この帯が周回する光の正体
- 同じ conic-gradient を filter: blur({{glow}}px) で複製して要素の背後に敷く。ブラーが縁の外へにじみ出て発光になる。{{glow}}=0 なら発光なしのシャープな枠
- @keyframes で --angle を 0deg→360deg へ {{speed}}s の linear で無限回転させる(等速。ease系だと周回が脈打って見える)
- 動かすのは角度変数だけにする。width/height や position ではなく色の角度を回すのでリフローは走らない
- prefers-reduced-motion 時は回転を止め、光の帯を1箇所に固定した静的な枠として表示する`,
  ngExample: {
    say: "「枠をキラキラ光らせて回して」",
    why: "回転速度・帯の幅・発光の有無が未定義。要素全体が塗りつぶされたり、border-imageのアニメーションが効かず静止したものが返りがち。@propertyの登録が抜けると--angleは一切動かない。",
  },
  okExample: {
    say: "「animated gradient borderを@property --angle + conic-gradientで実装。内側に地色を重ねてthickness 2pxのリングにし、同じ図形をblur 10pxで背後に敷いて発光。5sのlinearで無限回転、reduced-motionは静止」",
    why: "角度変数の登録・リング化・グロー・速度まで指定している。「@propertyで角度を登録する」の一言が“変数を書き換えても回らない”という頻出の失敗を防ぐ。",
  },
  vocab: [
    {
      term: "@property",
      desc: "CSSカスタムプロパティを型付きで登録する仕組み。<angle>として登録すると--angleがtransition/keyframesで数値補間できる。この回転演出の前提。",
    },
    {
      term: "conic-gradient",
      desc: "中心角に沿って色が回るグラデーション。fromで開始角を指定でき、その角を動かすと明るい帯が枠を周回して見える。",
    },
    {
      term: "リングマスク(内側塗り)",
      desc: "背景をグラデにした要素の内側に地色を重ね、枠の太さぶんだけグラデを覗かせる手法。border-imageより角丸(border-radius)に強い。",
    },
    {
      term: "グロー(にじみ)",
      desc: "同じ図形をblurして背後に敷くと縁の外へ色が滲み、発光に見える。box-shadowの単色と違い、グラデーションの色みのまま光らせられる。",
    },
  ],
  related: ["border-draw", "gradient-shine", "frosted-glass"],
};
