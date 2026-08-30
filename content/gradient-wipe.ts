import type { MotionEntry } from "@/lib/types";

export const gradientWipe: MotionEntry = {
  slug: "gradient-wipe",
  category: "transition",
  nameJa: "グラデーションワイプ",
  nameEn: "gradient wipe / soft-edge mask sweep",
  lede: "ぼかした境目を持つマスクが斜めに走り抜け、通過したところから絵が現れる(または溶けて消える)切り替え。curtain-wipeやclip-revealの硬いエッジと違い、境目そのものがグラデーションなので「拭った」というより「滲んで入れ替わった」感触になる。",
  params: [
    {
      key: "angle",
      label: "angle(掃く向き deg)",
      min: 0,
      max: 345,
      step: 15,
      default: 45,
      desc: "0=左から右、90=下から上。45前後の斜めが最も自然で、真横だけだとブラインドに見えやすい。",
    },
    {
      key: "softness",
      label: "softness(境目のぼかし幅 %)",
      min: 0,
      max: 80,
      step: 2,
      default: 24,
      desc: "この動きの本体。0だとclip-pathと同じ硬いワイプ。20〜35%が「グラデーションワイプ」らしい厚み。",
    },
    {
      key: "duration",
      label: "duration(掃き切る時間 s)",
      min: 0.4,
      max: 3,
      step: 0.1,
      default: 1.2,
      desc: "0.8〜1.4sが目安。ぼかし幅を広げるほど「動いた距離」が読みにくくなるので、その分だけ長めに取る。",
    },
    {
      key: "easing",
      label: "easing(進み方)",
      min: 0,
      max: 2,
      step: 1,
      default: 2,
      options: ["linear", "ease-out", "ease-in-out"],
      desc: "linearは機械的なスキャン、ease-in-outはカメラのワイプに近い。境目が太いほどイージングの差が出る。",
    },
  ],
  promptTemplate: `画像の切り替えに gradient wipe(ソフトエッジのマスクスイープ)を実装してください。

- mask-image に linear-gradient({{angle}}deg, ...) を敷き、不透明→透明の境目を1本だけ持たせる
- 境目のぼかし幅は {{softness}}% (グラデーションの線上の距離)。0%なら硬いワイプになる
- 進捗pに応じてグラデーションの停止位置を p*(100+softness)-softness から +softness% へずらし、
  マスクの境目が要素を端から端まで走り抜けるようにする
- 所要時間 {{duration}}s、イージングは {{easing}}
- 停止位置は CSS変数(@property で <percentage> 登録)か requestAnimationFrame で更新する。
  mask-image 文字列そのものは transition できない
- opacity や background-position で誤魔化さず、必ず mask(-webkit-mask も併記)で切り抜くこと
- 対象には will-change: mask-position ではなく、マスクを持つラッパー側で合成レイヤーを固定する
- prefers-reduced-motion 時は掃かずに、切り替え後の状態を即座に表示する`,
  ngExample: {
    say: "「画像をワイプで切り替えて」",
    why: "「ワイプ」だけだと、幅100%の板が横切るcurtain-wipeか、clip-path insetの硬い切り抜きが返ってくる。この動きの主役である「境目がぼけていること」が最初から消える。",
  },
  okExample: {
    say: "「gradient wipeで切り替え。mask-imageのlinear-gradient(45deg)を1本の境目にして、ぼかし幅24%、1.2s ease-in-out で端から端まで走らせる。opacityフェードでの代用は不可」",
    why: "実装方式(mask-imageの停止位置を動かす)・境目の太さ・角度・時間まで指定し、さらに「フェードで代用するな」と禁じ手を書いているので、見た目が別物になる置き換えが起きない。",
  },
  vocab: [
    {
      term: "mask-image",
      desc: "要素を別の画像の不透明度で切り抜くCSS。グラデーションを渡すと「だんだん消える境目」が作れる。Safari向けに -webkit-mask-image も併記する。",
    },
    {
      term: "グラデーションの線(gradient line)",
      desc: "linear-gradientの角度が決める仮想の直線。停止位置の%はこの線上の距離で、要素の幅・高さではない。だから角度を変えても0%→100%で必ず全面を覆える。",
    },
    {
      term: "フェザー(feather)",
      desc: "映像編集で言う境目のぼかし幅。ここでは不透明から透明へ移るグラデーションの厚みで、この値だけが硬いワイプとの差になる。",
    },
    {
      term: "@property",
      desc: "CSS変数に型(<percentage>等)を宣言する仕組み。宣言すると変数がtransition/animationで補間できるようになり、rAFなしでマスクを動かせる。",
    },
    {
      term: "gradient wipe",
      desc: "映像編集ソフト(Premiere等)の同名トランジションが語源。英語圏ではsoft wipe / feathered wipeとも呼ぶ。",
    },
  ],
  related: ["curtain-wipe", "clip-reveal", "crossfade", "progressive-blur"],
};
