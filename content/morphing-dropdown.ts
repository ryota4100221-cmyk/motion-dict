import type { MotionEntry } from "@/lib/types";

export const morphingDropdown: MotionEntry = {
  slug: "morphing-dropdown",
  category: "ui",
  nameJa: "モーフィングドロップダウン",
  nameEn: "morphing dropdown / shared-panel nav menu",
  lede: "ナビ項目を移るたび、1枚のパネルがホバー先の真下へ滑りながら幅と高さを中身の実寸に合わせて変形するメニュー。項目ごとに別々のメニューを開閉するdropdown-revealと違い器は最初から最後まで1つで、閉じて開き直す瞬間が無いぶん移動が途切れない。",
  params: [
    {
      key: "duration",
      label: "duration(器が移動・変形する時間 s)",
      min: 0.1,
      max: 0.8,
      step: 0.05,
      default: 0.3,
      desc: "0.25〜0.35sが基準。移動距離は項目の並びで毎回変わるが、距離ではなく時間を固定すると隣の項目も端の項目も同じテンポで着地する。",
    },
    {
      key: "overshoot",
      label: "overshoot(着地の行き過ぎ量)",
      min: 0,
      max: 20,
      step: 1,
      default: 6,
      desc: "easeOutBackのバネ量。5〜8で「重さのある器」に見える。0はきっちり止まる事務的な印象、15を超えると幅と高さも一緒に伸び縮みして安っぽくなる。",
    },
    {
      key: "contentFade",
      label: "contentFade(中身の入れ替え時間 s)",
      min: 0.05,
      max: 0.4,
      step: 0.05,
      default: 0.15,
      desc: "器のdurationの半分以下にする。中身が長く残ると、変形中のパネルから文字がはみ出して見える。",
    },
    {
      key: "contentShift",
      label: "contentShift(中身の横流し px)",
      min: 0,
      max: 40,
      step: 2,
      default: 12,
      desc: "古い中身が去り新しい中身が入ってくる距離。10〜16pxで進行方向が読める。0だと単なるクロスフェードになり、移動していることが伝わらない。",
    },
  ],
  promptTemplate: `グローバルナビに morphing dropdown(1枚のパネルを共有するドロップダウン)を実装してください。

- パネルはナビ項目ごとに作らず、ナビ全体で**1つだけ**をabsolute配置する。開いている項目が変わってもDOMは破棄せず、同じ要素を動かし続ける
- 各項目の中身(リンク群)はパネル内にすべて置き、実寸(offsetWidth / offsetHeight)を計測しておく。ホバー中の項目の実寸をパネルの width / height に反映する
- パネルの横位置は「ホバー中のトリガーの中心 − パネル幅の半分」。left ではなく transform: translate3d() で動かす
- width / height / transform を {{duration}}s、easing は cubic-bezier(0.22, A, 0.36, 1) の A を 1 + {{overshoot}}/50 として算出した easeOutBack 系で動かす
- 中身は絶対配置で重ね、ホバー中のものだけ opacity 1 / translateX(0)。それ以外は opacity 0 で、並び順が右のものは +{{contentShift}}px、左のものは −{{contentShift}}px へ逃がす。切り替えは {{contentFade}}s
- 非表示の中身は pointer-events: none にしてクリックを奪わせない
- タッチデバイスではホバーが無いので、トリガーのタップで開閉をトグルする
- prefers-reduced-motion 時は width / height / transform のトランジションを切り、パネルを新しい位置とサイズに即時表示する(中身の入れ替えも瞬時)`,
  ngExample: {
    say: "「ナビのメニューが項目間でぬるっと動くようにして」",
    why: "「ぬるっと」では器が1つなのか項目ごとに別々なのかが決まらない。項目ごとにドロップダウンを作って前を閉じ次を開くだけの実装になり、切り替えのたびに一瞬メニューが消える。中身の実寸を測らない実装だと、パネルが固定サイズのまま文字だけ差し替わる。",
  },
  okExample: {
    say: "「morphing dropdownを実装。パネルはナビ全体で1枚だけ。中身の実寸を測って width/height をトリガー中心に合わせて 0.3s の easeOutBack で変形、中身は0.15sで±12px流しながらクロスフェード。left禁止・translate3dのみ」",
    why: "「パネルは1枚」「実寸を測る」の2点がこの動きの本体で、ここを言わないと別物が返る。位置指定をtransformに限定し、変形時間と中身の入れ替え時間を別々に与えている点も実装のブレを消している。",
  },
  vocab: [
    {
      term: "shared container",
      desc: "状態が変わっても破棄せず使い回す1枚の器。開き直しが起きないので移動そのものを見せられる。",
    },
    {
      term: "auto-sizing",
      desc: "中身の実寸を計測して器の幅・高さに反映すること。固定サイズだと項目ごとの情報量の差が消える。",
    },
    {
      term: "easeOutBack",
      desc: "終点を少し行き過ぎてから戻る緩急。cubic-bezierの2つ目のy値を1より大きくして作る。",
    },
    {
      term: "hover intent",
      desc: "ホバーが外れてもすぐ閉じない猶予。トリガーからパネルへ斜めに移動する経路を許容する。",
    },
  ],
  related: ["dropdown-reveal", "tab-indicator", "shared-element"],
};
