import type { MotionEntry } from "@/lib/types";

export const imageParallaxHover: MotionEntry = {
  slug: "image-parallax-hover",
  category: "media",
  nameJa: "画像パララックスホバー",
  nameEn: "image parallax hover / inner image shift",
  lede: "カーソルの動きと逆方向に、枠内の画像だけがわずかにずれて奥行きが生まれる演出。画像を枠より大きく敷く「ブリード(はみ出し余白)」の設計がすべてで、余白が移動量より小さいと動いた瞬間に破綻する。",
  params: [
    {
      key: "shift",
      label: "shift(動く量 px)",
      min: 4,
      max: 28,
      step: 2,
      default: 14,
      desc: "10〜16pxが目安。ブリードは常にこの最大値より大きく取る。",
    },
    {
      key: "duration",
      label: "duration(追従の遅れ s)",
      min: 0.1,
      max: 1.2,
      step: 0.05,
      default: 0.45,
      desc: "0.3〜0.6sで一拍遅らせると「重さ」が出る。短いほど機械的な即時追従になる。",
    },
  ],
  promptTemplate: `サムネイル画像に image parallax hover(枠内の画像だけが動く視差)を実装してください。

- 枠に overflow: hidden と固定の aspect-ratio を指定し、枠自体は絶対に動かさない
- 中の画像は position: absolute で枠より大きく敷く(insetをマイナスに)。はみ出し余白は最大移動量 {{shift}}px より大きく取る
- カーソル位置を枠の中心基準で -1〜1 に正規化し、その逆方向へ transform: translate() で最大 {{shift}}px 動かす
- 追従は transition: transform {{duration}}s ease-out で滑らかに遅らせ、マウスが離れたら同じ時間で中央に戻す
- top/left ではなく transform で動かす(リフロー禁止)。画像に will-change: transform を付ける
- prefers-reduced-motion 時は視差を無効化し、画像を静止させたまま表示する`,
  ngExample: {
    say: "「カーソルに合わせて画像をパララックスさせて」",
    why: "画像がカーソルと同方向についてくる実装や、枠ごと動いて隣を押し出す実装が返ってきやすい。「枠は固定・中身だけ・逆方向・ブリード必須」の4点が伝わらないと成立しない動き。",
  },
  okExample: {
    say: "「image parallax hoverを実装。overflow:hiddenの枠内に画像をinset:-20pxで大きく敷き、カーソル位置を-1〜1に正規化して逆方向へ最大14px translate。transition 0.45s ease-out、leaveで中央へ。transformのみ」",
    why: "構造(枠+ブリード)・座標の正規化・方向・数値・戻りまで一文に揃っている。「逆方向」の一語が奥行きの正体で、これが抜けるとただの追従になる。",
  },
  vocab: [
    {
      term: "ブリード(はみ出し余白)",
      desc: "画像を枠より大きく敷いておく余白。最大移動量より小さいと、動いた瞬間に枠の内側(背景)が見えて破綻する。",
    },
    {
      term: "正規化",
      desc: "カーソル座標を-1〜1の比率に変換すること。枠のサイズが変わっても同じパラメータで移動量を扱える。",
    },
    {
      term: "逆方向の視差",
      desc: "手前(カーソル)と逆に奥(画像)が動くと、脳が奥行きとして解釈する。同方向に動かすとただの「ついてくる画像」になる。",
    },
    {
      term: "transitionによる追従",
      desc: "mousemoveのたびに目標値を更新し、補間はtransitionに任せる省コストな滑らか化。rAFでlerpを回すより実装が軽い。",
    },
  ],
  related: ["image-zoom-hover", "tilt", "parallax"],
};
