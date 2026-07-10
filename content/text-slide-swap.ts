import type { MotionEntry } from "@/lib/types";

export const textSlideSwap: MotionEntry = {
  slug: "text-slide-swap",
  category: "hover",
  nameJa: "テキストスライドスワップ",
  nameEn: "text swap hover / button text roll",
  lede: "ボタン内の文字が上へ抜け、同じ文字が下から入ってくる入れ替え演出。overflow: clipの枠に同一テキストを2段重ねて列ごと動かすだけの、コスパ最強のボタンマイクロインタラクション。",
  params: [
    {
      key: "duration",
      label: "duration(入れ替わりの時間 s)",
      min: 0.15,
      max: 0.8,
      step: 0.05,
      default: 0.35,
      desc: "0.25〜0.4sがキビキビして見える。0.6s超はボタンとしてはもたつく。",
    },
    {
      key: "direction",
      label: "direction(抜けていく方向)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["up", "down"],
      desc: "文字が抜けていく方向。upが定番。「戻る」系のナビにはdownも合う。",
    },
  ],
  promptTemplate: `ボタンに text slide swap(文字が抜け、同じ文字が反対側から入る入れ替え演出)を実装してください。

- ボタン内に overflow: clip の枠(高さ1行ぶん)を作り、その中に同じテキストを縦に2段重ねた列を入れる2段構造にする
- ホバーで列全体を transform: translateY で1行ぶん {{direction}} 方向へ動かす(1枚目が抜け、2枚目が入る)
- {{duration}}s、cubic-bezier(0.22, 1, 0.36, 1) のようなease-out系で動かす
- 枠の高さはline-heightで固定し、移動量は px ではなく translateY(±100%) で指定する
- overflow: hidden ではなく clip を使う(スクロールコンテナ化させない)
- マウスが離れたら同じdurationで元に戻す
- prefers-reduced-motion 時はスライドさせず、色の変化のみにする`,
  ngExample: {
    say: "「ホバーでボタンの文字が入れ替わるようにして」",
    why: "opacityのクロスフェードや、文字がその場で差し替わるだけの実装が返ってくる。「同じ文字が2枚あって列ごと平行移動する」構造は言わないと伝わらない。",
  },
  okExample: {
    say: "「text slide swapを実装。overflow: clipの枠＋同一テキスト2段の列をtranslateY(-100%)、0.35s cubic-bezier(0.22,1,0.36,1)、leaveで戻す。移動量は%指定」",
    why: "構造(clip枠＋2段の列)・移動量の単位・数値・イージングまで指定。「%指定」の一言でフォントサイズを変えても崩れない実装になる。",
  },
  vocab: [
    {
      term: "overflow: clip",
      desc: "hiddenと違いスクロールコンテナを作らない切り抜き。position: stickyを殺さないので基本こちらを使う。",
    },
    {
      term: "2段構造",
      desc: "同じテキストを縦に2枚並べ、列ごと1行ぶん動かす構造。入れ替わって見えるが実体はただの平行移動。",
    },
    {
      term: "translateY(-100%)",
      desc: "要素自身の高さを基準に1行ぶん動かす指定。pxで書くとフォントサイズ変更で入れ替わりがズレる。",
    },
    {
      term: "line-height固定",
      desc: "枠の高さと各行の高さを一致させること。ここがズレると入れ替わりの瞬間に文字が欠けたり隙間が出る。",
    },
  ],
  related: ["fill-hover", "underline-reveal", "marquee"],
};
