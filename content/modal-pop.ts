import type { MotionEntry } from "@/lib/types";

export const modalPop: MotionEntry = {
  slug: "modal-pop",
  category: "ui",
  nameJa: "モーダルポップ",
  nameEn: "modal pop / dialog animation",
  lede: "背景のオーバーレイがフェードし、パネルがscale(0.96→1)+フェードで「ふわっと」現れるダイアログの定番演出。scaleの開始値はほんの数%引くだけで十分で、小さくしすぎると安っぽく飛び出してくる。閉じは開きより速くが鉄則。",
  params: [
    {
      key: "duration",
      label: "duration(表示時間 s)",
      min: 0.15,
      max: 0.6,
      step: 0.05,
      default: 0.25,
      desc: "0.2〜0.3sが目安。モーダルは操作を中断させるUIなので、0.4sを超えると確実に遅く感じる。",
    },
    {
      key: "scaleFrom",
      label: "scaleFrom(scaleの開始値)",
      min: 0.8,
      max: 1,
      step: 0.01,
      default: 0.96,
      desc: "0.94〜0.97が上品。0.9を下回ると「飛び出してくる」印象になり、1.0だとフェードだけで存在感が弱い。",
    },
  ],
  promptTemplate: `ダイアログに modal pop(表示アニメーション)を実装してください。

- オーバーレイ(背景の黒幕)は opacity 0→1 のフェード、パネルは opacity 0→1 と transform: scale({{scaleFrom}}→1) を同時に {{duration}}s のease-outで再生する
- 閉じるときは同じ動きを逆再生し、時間は開きの6〜7割に短縮する
- 動かすのは transform と opacity のみ(top / margin で位置をアニメーションしない)
- 表示中は背面のスクロールを固定し、オーバーレイのクリックとEscキーで閉じられるようにする
- パネルに role="dialog" と aria-modal="true" を付け、フォーカスをモーダル内へ移す
- prefers-reduced-motion 時はscaleをやめ、短いフェードのみ(または即時)で開閉する`,
  ngExample: {
    say: "「モーダルをふわっと表示して」",
    why: "「ふわっと」の解釈が広く、scale(0.5)から飛び出す過剰な動きや、下から大きくせり上がる別物の演出が返ってくる。閉じるアニメーションが実装されず、CLOSEを押すとパッと消えるだけになりがち。",
  },
  okExample: {
    say: "「modal popを実装。オーバーレイはフェード、パネルはscale(0.96→1)+フェードを0.25s ease-outで同時に。閉じは逆再生で0.15s。transform/opacityのみ、スクロールロックとEsc/オーバーレイクリックで閉じる対応も」",
    why: "scaleの開始値・開閉の時間差・閉じ操作まで指定できている。「0.96」という控えめな数値を渡すことが、過剰演出を防ぐ一番の保険になる。",
  },
  vocab: [
    {
      term: "オーバーレイ(スクリム)",
      desc: "モーダル背面の半透明の黒幕。背景が操作不能であることを視覚的に伝え、クリックで閉じる受け皿にもなる。",
    },
    {
      term: "transform-origin",
      desc: "scaleの基準点。通常は中央のままでよい。クリックした要素から開く演出では、その要素の位置に設定する。",
    },
    {
      term: "逆再生の短縮",
      desc: "閉じは開きの6〜7割の時間で。「閉じたい」という意思には即応するのがUIアニメーションの原則。",
    },
    {
      term: "フォーカストラップ",
      desc: "表示中にTabフォーカスをモーダル内へ閉じ込めること。アニメーションと同じくらい重要な実装作法。",
    },
  ],
  related: ["drawer-slide", "menu-reveal", "crossfade"],
};
