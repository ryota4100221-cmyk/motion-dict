import type { MotionEntry } from "@/lib/types";

export const tabIndicator: MotionEntry = {
  slug: "tab-indicator",
  category: "ui",
  nameJa: "タブインジケーター",
  nameEn: "tab indicator / sliding underline",
  lede: "選択中のタブの下線が、次のタブへスライドして移動するUI。各タブに個別の下線を付けるのではなく、1本のインジケーターをtransformで動かすのが肝。「今どこにいるか」と「どこへ移ったか」を同時に伝えられる。",
  params: [
    {
      key: "duration",
      label: "duration(移動時間 s)",
      min: 0.15,
      max: 0.8,
      step: 0.05,
      default: 0.3,
      desc: "0.25〜0.35sが目安。タブは頻繁に切り替えるUIなので、0.5sを超えるともたつきが操作感に響く。",
    },
    {
      key: "stretch",
      label: "stretch(移動中の伸縮)",
      min: 0,
      max: 1,
      step: 1,
      default: 1,
      options: ["なし", "あり"],
      desc: "移動中にインジケーターが一瞬伸びて着地で戻る演出。移動の距離感が出て視線が追いやすくなる。",
    },
  ],
  promptTemplate: `タブUIに tab indicator(スライドする下線)を実装してください。

- 下線は各タブに個別に付けず、タブ列に対して1本のインジケーター要素として絶対配置する
- 選択タブが変わったら transform: translateX で新しいタブの位置へ {{duration}}s のease-out系で滑らせる
- 位置と幅は left / width のtransitionではなく translateX と scaleX で動かす(リフローさせない)
- 移動中の伸縮エフェクトは「{{stretch}}」(「あり」の場合は移動中に scaleX で1.3〜1.4倍まで伸ばし、着地で1に戻す。transform-originは中央)
- タブ幅が可変の場合は選択タブの offsetLeft / offsetWidth を測って位置とスケールに反映する
- タブ本体の文字色も選択状態に合わせて0.2s程度でtransitionする
- prefers-reduced-motion 時はスライドと伸縮をやめ、新しい位置に即時表示する`,
  ngExample: {
    say: "「タブの下線をアニメーションさせて」",
    why: "「1本が移動する」意図が伝わらず、各タブのborder-bottomを個別にフェードさせるだけの実装になりがち。left/widthをtransitionする実装が返ってくると、移動のたびにリフローが走る。",
  },
  okExample: {
    say: "「tab indicatorを1本の絶対配置要素+translateXで実装。0.3s ease-out、移動中はscaleXで1.35倍に伸ばして着地で戻す。可変幅はoffsetLeft/offsetWidthを測って反映。left/widthのアニメーション禁止」",
    why: "「1本を動かす」「transformのみ」「測って反映」まで指定できている。伸縮の倍率と戻し方まで書くと、移動が単調な平行移動で終わらない。",
  },
  vocab: [
    {
      term: "インジケーター",
      desc: "選択位置を示す1本の下線(またはピル)。タブ本体と分離した要素として持ち、単独で動かす。",
    },
    {
      term: "translateX",
      desc: "横移動。leftのtransitionと違いレイアウト計算(リフロー)が走らず、GPU合成で滑らかに動く。",
    },
    {
      term: "FLIP",
      desc: "移動前後の位置を先に測り、差分をtransformで再生する手法。可変幅タブのインジケーターはこの考え方で作る。",
    },
    {
      term: "ピル型インジケーター",
      desc: "下線ではなく背景の角丸ブロックが移動する変種。iOSのセグメンテッドコントロールが代表例。",
    },
  ],
  related: ["underline-reveal", "accordion", "fill-hover"],
};
