import type { MotionEntry } from "@/lib/types";

export const counterScale: MotionEntry = {
  slug: "counter-scale",
  category: "media",
  nameJa: "カウンタースケール",
  nameEn: "counter-scale / inverse scale / counter-scaled reveal",
  lede: "枠が開くのと逆向きに中身を縮めるリビール。枠は小さく始めて原寸へ、画像は寄った状態から引いていくため、枠に引きずられずに「カメラが下がった」ように見える。サムネイルやアバターがポンと現れる場面の定番。",
  params: [
    {
      key: "duration",
      label: "duration(開く時間 s)",
      min: 0.15,
      max: 1.2,
      step: 0.05,
      default: 0.35,
      desc: "0.3〜0.45sが自然。枠と中身が同時に動くので、0.6sを超えると2つの動きがバラバラに見えてくる。",
    },
    {
      key: "aperture",
      label: "aperture(開始時の枠の比率)",
      min: 0.2,
      max: 0.8,
      step: 0.05,
      default: 0.5,
      desc: "0.5＝原寸の半分から開く。0.3を下回ると点からの出現になり、カウンターの効果が読めなくなる。",
    },
    {
      key: "zoom",
      label: "zoom(開始時の中身の倍率)",
      min: 1,
      max: 2,
      step: 0.05,
      default: 1.5,
      desc: "1.4〜1.6が目安。1/apertureに近づけるほど被写体が動かなくなり、離すほど引きの移動量が出る。",
    },
    {
      key: "mode",
      label: "mode(中身の扱い)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["counter", "lock"],
      desc: "counterは中身をzoom→1へ逆補正する。lockは中身を原寸に固定した比較用で、枠が開くだけの平坦なマスクになる。",
    },
  ],
  promptTemplate: `サムネイルの出現に counter-scale を実装してください。

- 枠(外側)は transform: scale({{aperture}}) から scale(1) へ {{duration}}s で開く
- 表示窓は clip-path: inset(calc((1 - {{aperture}}) / 2 * 100%) round 50%) から inset(0 round 50%) へ、枠と同じ {{duration}}s・同じeasingで開く
- 中身(画像)は {{mode}} の扱いにする。counter なら scale({{zoom}}) から scale(1) へ逆向きに縮め、lock なら scale(1) に固定する
- easing は枠・窓・中身の3つとも同一にする(ease-out または cubic-bezier(0.16, 1, 0.3, 1))。ここがズレると中身が枠から遅れて見える
- width / height ではなく transform と clip-path で動かす(リフローさせない)
- 中身は object-fit: cover で枠を満たし、縮めきった時点で余白が出ないようにする
- prefers-reduced-motion 時はアニメーションなしで、枠も中身も最終状態(scale 1 / inset 0)で即座に表示する`,
  ngExample: {
    say: "「サムネイルをポンと出して」",
    why: "枠と中身が同じ向きに拡大する実装になり、画像ごと引き伸ばされる安っぽい出方になる。枠だけ開けば今度は平坦なマスク抜きで、カメラが引く感じは出ない。",
  },
  okExample: {
    say: "「counter-scaleで出現。枠はscale(0.5)→1、窓はclip-path inset(25% round 50%)→inset(0 round 50%)、画像はscale(1.5)→1の逆補正。3つとも0.35s ease-outで揃える」",
    why: "枠・窓・中身の3レイヤーそれぞれに開始値と終了値があり、「同じ時間・同じeasingで揃える」という一番外しやすい条件まで書いてある。逆補正の倍率を数値で渡しているので解釈の余地がない。",
  },
  vocab: [
    {
      term: "カウンタースケール",
      desc: "親の拡大を子の縮小で打ち消す手法。親をscale(s)するなら子にscale(1/s)を当てるのが基本形で、角丸やテキストを歪ませずに容器だけ動かしたいときに使う。",
    },
    {
      term: "アパーチャ",
      desc: "絞り。ここでは中身を覗かせる窓そのものを指す。窓が開く速度と中身が引く速度の比が、この動きの性格を決める。",
    },
    {
      term: "clip-path: inset() round",
      desc: "矩形マスクに角丸を足す書き方。round 50%で円形の窓になり、inset値をアニメーションさせると円が同心で開く。",
    },
    {
      term: "ドリーズーム",
      desc: "カメラを寄せながら画角を広げ、被写体の大きさだけ据え置く映画の技法。カウンタースケールは見た目が似ているが、動くのは枠と倍率だけで遠近は変わらない別物。",
    },
  ],
  related: ["clip-reveal", "image-zoom-hover", "circle-reveal"],
};
