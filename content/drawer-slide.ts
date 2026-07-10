import type { MotionEntry } from "@/lib/types";

export const drawerSlide: MotionEntry = {
  slug: "drawer-slide",
  category: "ui",
  nameJa: "ドロワースライド",
  nameEn: "drawer / side panel slide",
  lede: "画面の横からナビパネルが滑り込む、モバイルナビの定番UI。パネルはtranslateXのみで動かし、背景のオーバーレイのフェードを同じ時間で連動させる。left/rightプロパティのアニメーションで作ると途端に重くなる。",
  params: [
    {
      key: "duration",
      label: "duration(スライド時間 s)",
      min: 0.2,
      max: 0.8,
      step: 0.05,
      default: 0.35,
      desc: "0.3〜0.4sが目安。モバイルで何度も開閉するUIなので、0.5sを超えると操作のテンポを削ぐ。",
    },
    {
      key: "direction",
      label: "direction(スライド方向)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["left", "right"],
      desc: "滑り込んでくる側。ナビはleft、カート・設定パネルはrightが通例。",
    },
  ],
  promptTemplate: `サイドナビに drawer slide を実装してください。

- パネルは画面の {{direction}} 側に position: fixed で配置し、transform: translateX で画面外(105%ぶん外側)から0へ {{duration}}s で滑り込ませる
- easingは cubic-bezier(0.22, 1, 0.36, 1) のような減速の効いたease-outを使う
- 背景のオーバーレイは同じ {{duration}}s で opacity 0→1 にフェードさせ、クリックで閉じられるようにする
- 閉じるときはパネルを画面外へ戻しつつ、オーバーレイを同時にフェードアウトする
- 動かすのは transform と opacity のみ。left / right プロパティをアニメーションしない(リフローさせない)
- 表示中は背面のスクロールを固定し、Escキーでも閉じられるようにする
- prefers-reduced-motion 時はスライドをやめ、フェードのみ(または即時)で開閉する`,
  ngExample: {
    say: "「横からスライドするメニューを作って」",
    why: "leftプロパティのtransitionで毎フレームレイアウト計算が走る実装や、オーバーレイなしでパネルだけが出てくる実装が返ってきやすい。開いている間に背景がスクロールできてしまう抜けも定番。",
  },
  okExample: {
    say: "「drawer slideを実装。パネルはtranslateX(-105%)→0を0.35s cubic-bezier(0.22,1,0.36,1)、オーバーレイは同durationでフェード連動、クリックで閉じる。transform/opacityのみ、スクロールロックとEsc対応も」",
    why: "パネルとオーバーレイの連動・easing・閉じ操作まで指定できている。「105%」の一言でbox-shadowが画面端に残る細かい事故も防げる。",
  },
  vocab: [
    {
      term: "ドロワー",
      desc: "引き出しのように横から出てくるパネルの総称。オフキャンバスメニューとも呼ぶ。",
    },
    {
      term: "translateX(-105%)",
      desc: "隠すときは100%ではなくわずかに余分に逃がす。box-shadowや境界線が画面端に1pxだけ残るのを防ぐ。",
    },
    {
      term: "オーバーレイ連動",
      desc: "パネルのスライドと黒幕のフェードを同じdurationで揃えること。ここがずれると急に安っぽくなる。",
    },
    {
      term: "スワイプディスミス",
      desc: "パネルを指で押し戻して閉じるモバイルの作法。実装コストは上がるがネイティブアプリの操作感に近づく。",
    },
  ],
  related: ["menu-reveal", "modal-pop", "accordion"],
};
