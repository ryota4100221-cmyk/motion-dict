import type { MotionEntry } from "@/lib/types";

export const customCursor: MotionEntry = {
  slug: "custom-cursor",
  category: "hover",
  nameJa: "カスタムカーソル追従",
  nameEn: "custom cursor / cursor follower",
  lede: "ネイティブカーソルを消し、円などの図形が遅れて付いてくる演出。mix-blend-modeを併用すると、重なった文字や画像の色が反転する。サイトの没入感を一段上げる定番。",
  params: [
    {
      key: "size",
      label: "size(カーソル径 px)",
      min: 8,
      max: 80,
      step: 2,
      default: 24,
      desc: "カーソル円の直径。大きいほど存在感が出るが、邪魔にもなる。",
    },
    {
      key: "lerp",
      label: "lerp(追従の粘り)",
      min: 0.03,
      max: 0.5,
      step: 0.01,
      default: 0.15,
      desc: "小さいほど遅れて付いてくる。0.5に近いとネイティブカーソル同然。",
    },
    {
      key: "blend",
      label: "blend(mix-blend-mode)",
      min: 0,
      max: 2,
      step: 1,
      default: 1,
      options: ["normal", "difference", "exclusion"],
      desc: "differenceは重なった要素の色を反転。文字の上を通ると白黒が入れ替わる。",
    },
  ],
  promptTemplate: `カスタムカーソルを実装してください。

- ネイティブカーソルは cursor: none で非表示にする
- 直径 {{size}}px の円が、毎フレーム lerp(係数 {{lerp}})でカーソル位置を追従する
- 円には mix-blend-mode: {{blend}} を適用し、重なった要素と色が干渉するようにする
- 円自体には pointer-events: none を指定してクリックを奪わない
- ウィンドウからカーソルが出たら円をフェードアウトする
- prefers-reduced-motion 時は遅延追従をやめ、カーソル位置に即時追従させる`,
  ngExample: {
    say: "「マウスに丸がついてくるやつやって」",
    why: "「ついてくる」の質感(遅延・粘り)も、ネイティブカーソルを消すのかも、重なったときにどう見えるのかも未指定。ただのdivが等速で動くだけの実装が返ってくる。",
  },
  okExample: {
    say: "「custom cursorを実装。cursor:noneで本体を消し、円をlerpで遅延追従、mix-blend-mode: differenceで色反転、pointer-events: noneを忘れずに」",
    why: "消す・追従方式・ブレンド・クリック透過の4点が揃っている。特にmix-blend-modeは名前を出さないとまず提案されない。",
  },
  vocab: [
    {
      term: "cursor: none",
      desc: "ネイティブカーソルを消すCSS。カスタムカーソルの前提。消し忘れると二重カーソルになる。",
    },
    {
      term: "mix-blend-mode",
      desc: "重なった要素同士の色の混ぜ方。differenceは色を反転させ、白の上では黒く、黒の上では白く見える。",
    },
    {
      term: "pointer-events: none",
      desc: "カスタムカーソル自身がクリックやホバーを奪わないための必須指定。忘れるとリンクが押せなくなる。",
    },
    {
      term: "cursor state",
      desc: "リンクホバーで拡大、ドラッグ中で縮小など、状態に応じて形を変えると「生きている」感が出る。",
    },
  ],
  related: ["magnetic-hover", "spotlight-hover", "text-scramble"],
};
