import type { MotionEntry } from "@/lib/types";

export const orbit: MotionEntry = {
  slug: "orbit",
  category: "ui",
  nameJa: "オービット（楕円軌道の周回）",
  nameEn: "orbit animation / orbiting dots / elliptical orbit",
  lede: "いくつかの点が中心のまわりを楕円の軌道で回り続ける常時ループ。真円を平らに潰して軌道面を少しずつ傾け、手前に来た点だけを大きく濃くするだけで、平面のままでも「奥行きのある小さな天体」に見える。アイコン・ローダー・ボタンの装飾の定番。",
  params: [
    {
      key: "radius",
      label: "radius(軌道の半径 px)",
      min: 40,
      max: 110,
      step: 1,
      default: 84,
      desc: "いちばん外側の軌道の半径。点ごとに0.3〜1倍の半径を割り振り、同心円に揃えない。アイコン内なら6〜10px、ヒーローの装飾なら80〜120pxが目安(デモは枠に収まる110pxまで)。",
    },
    {
      key: "tilt",
      label: "tilt(軌道の縦の潰れ 比率)",
      min: 0.2,
      max: 1,
      step: 0.05,
      default: 0.45,
      desc: "縦方向の半径÷横方向の半径。1で真上から見た真円、0.35〜0.6で斜めから覗いた軌道になり奥行きが出る。0.25を切ると横一線の往復に見える。",
    },
    {
      key: "period",
      label: "period(基準の周期 s)",
      min: 1.5,
      max: 12,
      step: 0.1,
      default: 2.5,
      desc: "いちばん速い点が1周する秒数。ほかの点は0.8〜1.7倍にばらし、半分は逆回りにする。2〜4sで「稼働中」、6s以上で背景の気配になる。",
    },
    {
      key: "depth",
      label: "depth(手前と奥の大きさの差)",
      min: 0,
      max: 0.4,
      step: 0.01,
      default: 0.2,
      desc: "軌道の手前(下半分)で大きく、奥(上半分)で小さくする振れ幅。0.15〜0.25で自然。0だと平面を滑っているだけに見え、0.35を超えると点が膨らんだり縮んだりして見える。",
    },
  ],
  promptTemplate: `アイコン・ボタンの装飾に orbit animation(楕円軌道を周回する点)を実装してください。

- 中心に揃えた5個前後の点を置き、点ごとに軌道半径(最大 {{radius}}px の0.3〜1倍)・軌道面の傾き(--start: 0〜360deg)・初期位相(--phase)を変える
- 角度は @property --orbit(syntax: "<angle>")で登録し、@keyframes で 0deg → 360deg を linear infinite で回す。基準の周期は {{period}}s。点ごとに 0.8〜1.7 倍へばらし、半分は animation-direction: reverse にする
- 位置は translate で出す: x = r·cos(θ)、y = r·{{tilt}}·sin(θ)(θ = --orbit + --phase)。この楕円を --start だけ回転させて軌道面ごとに傾ける。top/left は動かさない
- 奥行きは sin(θ) から作る: 手前(y が正)ほど scale を最大 1+{{depth}} まで大きく・opacity 1 に、奥ほど 1−{{depth}} まで小さく・opacity 0.45 程度まで薄くする
- 静止時は各点を --phase の位置(星座のような配置)に置いておき、ホバー/フォーカスで @property --mix(<number>)を 0 → 1 に 0.5s で補間して周回に入る。離れたら 1.1s かけて元の配置へ戻す(戻りを遅くすると余韻が出る)
- タッチ端末ではタップで周回のオン/オフを切り替える
- prefers-reduced-motion 時は周回アニメーションを止め、--phase の静止配置のまま表示する(ホバーでも回さない)`,
  ngExample: {
    say: "「ロゴのまわりを点がくるくる回るアニメーションにして」",
    why: "「くるくる回る」だと、点を並べた親要素ごと rotate する実装が返ってきやすい。全点が同じ速さ・同じ真円で回るので時計の針のように機械的になり、奥行きも出ない。周期も指定が無く、速すぎるとローディング中に見える。",
  },
  okExample: {
    say: "「orbit animationを実装。点5個をそれぞれ別の楕円軌道(縦横比0.45・軌道面は点ごとに傾ける)で周回。@property --orbitで角度を回し、周期2.5sを基準に0.8〜1.7倍・半分は逆回り。手前ほどscale 1.2・奥ほど0.8で薄く。ホバーで--mixを0.5sで補間して回し始める。reduced-motionは静止配置」",
    why: "親ごと回すのではなく点ごとに角度を持たせる方式と、軌道の潰れ・周期のばらし・奥行きの振れ幅まで数値で指定している。「手前ほど大きく濃く」の一言で、平面の円運動が立体の周回に変わる。",
  },
  vocab: [
    {
      term: "elliptical orbit(楕円軌道)",
      desc: "真円の縦半径だけを縮めた軌道。斜めから覗いた円に見えるので、それだけで回転面に奥行きが生まれる。",
    },
    {
      term: "@property",
      desc: "CSSカスタムプロパティに型(<angle> や <number>)を登録する規則。登録すると角度や混合率を @keyframes や transition で補間でき、cos()/sin() に渡して軌道を描ける。",
    },
    {
      term: "phase(位相)",
      desc: "周回の開始角度。点ごとにずらすと一斉に同じ位置を通らなくなり、静止時もばらけた配置になる。",
    },
    {
      term: "depth cue(奥行きの手がかり)",
      desc: "大きさ・濃さ・重なり順など、平面で奥行きを感じさせる要素。軌道の手前で大きく濃く、奥で小さく薄くするのが最小構成。",
    },
  ],
  related: ["rotating-badge", "ambient-float", "radial-carousel"],
};
