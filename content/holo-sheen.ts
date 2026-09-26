import type { MotionEntry } from "@/lib/types";

export const holoSheen: MotionEntry = {
  slug: "holo-sheen",
  category: "hover",
  nameJa: "ホログラム反射（ホロ箔の光沢）",
  nameEn: "holographic sheen / holo foil card / iridescent glare",
  lede: "カードの上を虹色の薄膜がゆっくり流れ、カーソルの位置には白い照り返しが灯る、トレーディングカードのホロ箔の演出。帯の色を白ではなくシアンとピンクに振り、mix-blend-mode: screen で重ねるだけで「光る紙」から「箔押しの紙」に変わる。",
  params: [
    {
      key: "period",
      label: "period(膜が流れる周期 s)",
      min: 2,
      max: 12,
      step: 0.5,
      default: 5.5,
      desc: "5〜7sが箔らしい。3s以下だと光の帯(シャイン)に見え、10s超は動いていると気づかれない。",
    },
    {
      key: "angle",
      label: "angle(帯の角度 deg)",
      min: 45,
      max: 165,
      step: 5,
      default: 115,
      desc: "105〜125degの斜めが定番。90degの真横は縞模様に見え、箔の「傾けた反射」感が消える。",
    },
    {
      key: "intensity",
      label: "intensity(膜の濃さ opacity)",
      min: 0.1,
      max: 1,
      step: 0.05,
      default: 0.6,
      desc: "0.4〜0.6が絵を殺さない上限。0.8を超えると下の絵柄が虹色に塗りつぶされる。",
    },
    {
      key: "glare",
      label: "glare(照り返しの半径 px)",
      min: 40,
      max: 240,
      step: 10,
      default: 120,
      desc: "カード幅の半分前後(100〜140px)が自然。小さいとレーザーポインタ、大きいと全体が白む。",
    },
  ],
  promptTemplate: `カードに holographic sheen(ホロ箔の光沢)を実装してください。

- カードの上に pointer-events: none のオーバーレイを1枚重ね、mix-blend-mode: screen、opacity: {{intensity}} にする
- オーバーレイの背景は linear-gradient({{angle}}deg, transparent 28%, 白20% 43%, シアン(120,255,230)28% 50%, ピンク(255,150,220)18% 57%, transparent 72%)、background-size: 260% 260%
- @keyframes で background-position を 130% → -130% へ {{period}}s の linear で無限ループさせる(虹色の膜が斜めに流れ続ける)
- オーバーレイの ::after に radial-gradient({{glare}}px {{glare}}px at var(--gx) var(--gy), 白30%, transparent 60%) を置き、opacity は var(--glow) で制御する
- pointermove でカード内の相対位置(%)を --gx / --gy に、--glow を 1 に書き込む。pointerleave で --glow を 0 に戻し、opacity は 0.25s で遷移させる
- 位置は CSS 変数の書き換えだけで反映し、再レンダリングやレイアウト計算を走らせない
- タッチでも同じ pointer イベントで照り返しが指に付いてくるようにする(カードに touch-action: none)
- prefers-reduced-motion 時は膜の流れを止めて background-position: 62% 0 で静止させる。照り返しはユーザー操作への応答なので残してよい`,
  ngExample: {
    say: "「カードをキラキラさせて、ホログラムっぽく」",
    why: "「キラキラ」では膜か粒か光の帯かが決まらない。白い帯が一度走るだけのシャインや、hue-rotate で全体の色相がぐるぐる回る安っぽい実装、パーティクルの星が散る実装が返ってくる。",
  },
  okExample: {
    say: "「holographic sheenを実装。screen合成・opacity 0.6のオーバーレイに115degのシアン/ピンクのグラデーション、background-size 260%で5.5s linearに流す。::afterに半径120pxの照り返しを--gx/--gyで追従、reduced-motionは膜を止めて照り返しだけ残す」",
    why: "色(白ではなく虹色の2色)・合成モード・流れる速度と、カーソル追従の照り返しという2層構造まで指定している。screen の一言で、下の絵柄を残したまま明るい部分だけが虹色に光る。",
  },
  vocab: [
    {
      term: "mix-blend-mode: screen",
      desc: "下の色と重ねて明るくする合成。暗い部分はほぼ変わらず、明るい部分だけが光るので、絵柄を潰さずに箔の反射を足せる。",
    },
    {
      term: "iridescence(玉虫色)",
      desc: "見る角度で色が変わる薄膜の干渉色。白1色の光ではなくシアン→ピンクのように隣り合う色相を並べると再現できる。",
    },
    {
      term: "glare(照り返し)",
      desc: "光源が映り込んだ白い点。カーソル位置に置くと「カードを傾けて光を拾っている」手触りが生まれる。",
    },
    {
      term: "background-size 260%",
      desc: "グラデーションを要素より大きく敷き、background-position の移動で膜を流す指定。帯が端で切れずに画面外から入って画面外へ抜ける。",
    },
    {
      term: "CSS変数でのポインタ受け渡し",
      desc: "JSは --gx / --gy を書き換えるだけ、描画はCSSに任せる分担。React の state を経由しないので毎フレームの再レンダリングが起きない。",
    },
  ],
  related: ["gradient-shine", "spotlight-hover", "tilt", "breathing-glow"],
};
