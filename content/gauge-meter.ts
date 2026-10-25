import type { MotionEntry } from "@/lib/types";

export const gaugeMeter: MotionEntry = {
  slug: "gauge-meter",
  category: "ui",
  nameJa: "ゲージメーター（針が振れて値を指す）",
  nameEn: "gauge meter / speedometer gauge / needle gauge",
  lede: "下が開いた円弧の目盛りに、中心軸で回る針と色の付いた弧を重ね、値が変わるたびに針が振れて止まる計器表示。数字より先に「目盛りのどのあたりか」「危険域に入ったか」が一目で伝わる。肝は針と弧を同じ時間・同じイージングで動かすことと、桁が大きく開く値を対数で目盛ること。",
  params: [
    {
      key: "sweep",
      label: "sweep(目盛りの開き角 deg)",
      min: 180,
      max: 300,
      step: 10,
      default: 220,
      desc: "0から最大までの針の振れ幅。180は半円で、横長の枠に収まるが針先が水平に寝る。220〜270がスピードメーターらしい形で、下の開いた部分に数値を置ける。300を超えると最小と最大の端が近づき、どちらの端か読み違える。",
    },
    {
      key: "duration",
      label: "duration(針が止まるまで s)",
      min: 0.2,
      max: 1.6,
      step: 0.02,
      default: 0.64,
      desc: "0.5〜0.8sが目安。0.3s未満だと振れる過程が見えず値が差し替わっただけに見える。1.2sを超えると次の操作のたびに針が追いつかず、表示が常に遅れて見える。",
    },
    {
      key: "easing",
      label: "easing(針の止まり方)",
      min: 0,
      max: 2,
      step: 1,
      default: 0,
      options: ["ease-out-quint", "back-out", "linear"],
      desc: "ease-out-quint(0.22,1,0.36,1)は素早く振れて目盛りの手前で静かに止まる。back-outは値を一度通り過ぎて戻るアナログ計器の手触りが出るが、一瞬だけ実際より大きな値を指す(危険域の境目では誤報に見える)。linearは機械的。",
    },
    {
      key: "scale",
      label: "scale(目盛りの付け方)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["log", "linear"],
      desc: "1,000〜1億のように桁が開く値は対数(log)にすると、1桁ごとに同じ角度だけ振れる。linearにすると1億以外の値がすべて左端に固まり、針がほとんど動かない。0〜100%のように範囲が狭い値はlinearでよい。",
    },
  ],
  promptTemplate: `値を針で指す gauge meter(ゲージメーター)を SVG で実装してください。

- きっかけ: 値が変わるたび(デモでは値の選択ボタンをクリック/タップするたび)に、針・弧・数値が今の表示位置から新しい値へ動く。途中で値が変わっても今の位置から追いかけ直す
- 目盛りは下が開いた円弧で、開き角は {{sweep}}deg。12時を0degとして -{{sweep}}/2 〜 +{{sweep}}/2 の範囲を使い、弧のパスは中心・半径・開始角・終了角から A コマンドで生成する
- 値は 0〜1 に正規化してから角度に直す。目盛りは {{scale}} で、log の場合は (log(値) - log(最小)) / (log(最大) - log(最小))、linear の場合は (値 - 最小) / (最大 - 最小)(linear の最小は0)。どちらも 0〜1 に clamp する
- 背面に薄い色のトラック(全域の弧)、前面に値までの弧を重ねる。前面の弧は pathLength="100" を付け、stroke-dasharray: 100、stroke-dashoffset = 100 × (1 - 正規化値) で描く(値のたびにパスの d を作り直さない)
- 針は中心軸に transform-origin を合わせた g 要素を rotate(角度) で回す。width や d 属性ではなく transform で動かす
- 針の transform と弧の stroke-dashoffset は同じ {{duration}}s・同じイージング({{easing}}。ease-out-quint なら cubic-bezier(0.22, 1, 0.36, 1)、back-out なら cubic-bezier(0.34, 1.56, 0.64, 1))で transition させ、針先と弧の先端がずれないようにする
- 中央下の数値は 800ms の ease-out-cubic で旧値から新値へカウントアップし、桁区切りと tabular-nums で幅が揺れないようにする
- 危険域の境目には赤い短い目盛りを1本置き、値が境目を超えたら弧と針を赤に切り替えて、弧だけを 1.4s 周期で opacity 1→0.55→1 に ease-in-out で脈打たせる(色だけでなく数値の横に「超過」などの文字も添える)
- SVG 全体は aria-hidden にし、値は role="meter" と aria-valuenow / aria-valuemin / aria-valuemax で読み上げさせる
- prefers-reduced-motion 時は transition とカウントアップと脈動を止め、針・弧・数値を最終値で即時に表示する`,
  ngExample: {
    say: "「数値をメーターっぽく表示して、動きもつけて」",
    why: "conic-gradient を回しただけの円グラフや、針だけが回って弧は一瞬で差し替わる実装が返ってきやすい。transform-origin を指定しないと針が SVG の左上を軸に回って画面外へ飛ぶ。桁の開いた値を linear で目盛ると、ほとんどの値で針が左端から動かず、メーターにした意味が消える。",
  },
  okExample: {
    say: "「gauge meterをSVGで。開き角220deg、値はlogで0〜1に正規化。前面の弧はpathLength=100のdashoffset、針はgのrotate(transform-originは中心軸)。針と弧は同じ0.64s cubic-bezier(0.22,1,0.36,1)。数値は800ms ease-out-cubicでカウントアップ、危険域超過で赤＋弧だけ1.4sで脈打つ。reduced-motionでは即時表示」",
    why: "形(開き角)・値から角度への変換・弧と針それぞれの描き方・同期させる時間とイージング・危険域の見せ方まで確定している。特に「針と弧を同じ時間・同じイージング」の一言が無いと、針先が弧の先端を追い越したり置いていかれたりする。",
  },
  vocab: [
    {
      term: "gauge / dial",
      desc: "円弧の目盛りと針で値を指す計器表示。スピードメーターや圧力計が原型。円を一周するcircular progress(進捗率)と違い、両端が開いていて「どの範囲のどこか」を読ませる。",
    },
    {
      term: "対数目盛り(log scale)",
      desc: "値の対数を等間隔に並べる目盛り。1,000→1万→10万が同じ角度ずつ進むので、桁の開いた値(ユーザー数・ファイルサイズ・周波数)を1本の針で読める。",
    },
    {
      term: "transform-origin(SVG)",
      desc: "回転の軸。SVGの要素は既定で原点(左上)を軸に回るので、針は中心軸の座標をpx指定するか transform-box: view-box と組み合わせて合わせる。",
    },
    {
      term: "閾値マーカー(threshold)",
      desc: "危険域・上限の始まりを示す短い目盛り。針が越えたら色を変えるが、色覚に頼らないよう文字や形の変化も添える。",
    },
    {
      term: "role=\"meter\"",
      desc: "範囲の中の現在値を表すARIAロール。進み続ける作業の割合を表すprogressbarとは区別する。",
    },
  ],
  titleAct: { act: "C:ui" },
  aliases: ["針", "メーター", "グイッ", "ぶるん"],
  related: ["circular-progress", "counter", "bar-chart-grow", "spring-easing"],
};
