import type { MotionEntry } from "@/lib/types";

export const dvdBounce: MotionEntry = {
  slug: "dvd-bounce",
  category: "ui",
  nameJa: "DVDバウンス",
  nameEn: "DVD screensaver bounce / bouncing logo",
  lede: "ロゴが等速で画面内を漂い、端に当たるたび反射して色が変わる、DVDプレーヤーのスクリーンセーバーそのものの動き。無操作時の余白や404で「待ち時間そのものを見世物にする」ための常時ループで、角にピタリと入った瞬間だけ跳ねる仕込みが全体を持たせる。",
  params: [
    {
      key: "speed",
      label: "speed(移動速度 px/s)",
      min: 30,
      max: 400,
      step: 10,
      default: 140,
      desc: "100〜180px/sが「見ていられる」速さ。300を超えると落ち着かず、50を切ると止まって見えて反射の面白さが伝わらない。",
    },
    {
      key: "size",
      label: "size(ロゴの幅 px)",
      min: 40,
      max: 160,
      step: 4,
      default: 96,
      desc: "画面短辺の1/5前後が目安。大きいほど可動域が狭くなり反射が増えるので、speedと逆方向に効く。",
    },
    {
      key: "pop",
      label: "pop(コーナーヒット時の拡大率)",
      min: 1,
      max: 1.6,
      step: 0.05,
      default: 1.35,
      desc: "角に入った1回だけの祝福。1.3〜1.4倍を0.45s前後で戻すと「やった」感が出る。1.0にすると演出なし＝素のスクリーンセーバーになる。",
    },
    {
      key: "hue",
      label: "hue(反射ごとの色相変化 deg)",
      min: 0,
      max: 120,
      step: 5,
      default: 45,
      desc: "1回の反射で回す色相。40〜60degだと数回の反射で一巡せず飽きにくい。0にすると色は固定され、動きだけの静かな版になる。",
    },
  ],
  promptTemplate: `無操作時の画面に DVD screensaver bounce(ロゴが跳ね回るスクリーンセーバー)を実装してください。

- コンテナを position: relative、ロゴを position: absolute; top:0; left:0 に置き、幅は {{size}}px
- 位置は x/y をJSで持ち、毎フレーム transform: translate(Xpx, Ypx) だけで反映する(left/topは触らない)
- 速度は {{speed}}px/s の等速。初期角度はランダムに取り、vx = cos(a)*speed / vy = sin(a)*speed に分解する
- 移動量は必ず delta time で出す: dt = min(0.05, (now - last)/1000) を掛ける
  (フレームレートに速度を依存させない。dtの上限クランプはタブ復帰時の瞬間移動を防ぐため)
- 反射は「はみ出したら端に戻して速度の符号を確定させる」:
  x <= 0 なら x = 0, vx = Math.abs(vx) / x >= maxX なら x = maxX, vx = -Math.abs(vx)(yも同様)
  maxX = コンテナ幅 - ロゴ幅。単純な vx = -vx にすると端に食い込んだとき振動して抜けなくなる
- 反射のたびに色相を {{hue}}deg 進める(filter: hue-rotate() でよい)
- **コーナーヒット**: xとyの反射がほぼ同時(140ms以内)に起きたときだけ、ロゴを {{pop}} 倍に0.45sで膨らませて戻す
  クラス付与で発火させる場合は、付け直す前に一度外して reflow を挟まないと2回目が再生されない
- コンテナのリサイズ時は maxX/maxY を取り直し、位置を範囲内へクランプする
- prefers-reduced-motion 時はループを一切回さず、ロゴを中央に静止表示する(色相も固定)`,
  ngExample: {
    say: "「DVDのスクリーンセーバーみたいにロゴを跳ねさせて」",
    why: "元ネタは伝わるが、速度の単位も反射の作り方も決まらない。setIntervalで1フレームあたり数pxずつ足すだけの実装が返ってきて、画面の性能でスピードが変わる。端の判定を vx = -vx だけで書かれると、はみ出した瞬間に符号が反転し続けて枠に貼り付いたまま震える。",
  },
  okExample: {
    say: "「DVD screensaver bounceを実装。速度140px/sを角度ランダムでvx/vyに分解し、rAF＋dt=min(0.05,経過秒)で translate のみ更新。端は座標をクランプしてから vx=Math.abs(vx) / -Math.abs(vx) で向きを確定、反射ごとに hue-rotate を45deg進める。xとyの反射が140ms以内なら1.35倍を0.45sでポップ。reduced-motionではループを回さず中央に静止」",
    why: "速度を px/s とdtで定義しているので端末に依らず同じ速さになる。反射をクランプ＋符号確定で書かせているので枠に貼り付く定番バグが出ない。コーナーヒットの判定条件（同時性の窓）まで数値で渡しているので、いちばん見せたい一瞬が実装される。",
  },
  vocab: [
    {
      term: "DVD screensaver bounce",
      desc: "ロゴが画面内を等速で漂い端で反射し続ける、DVDプレーヤー由来のアイドル演出。英語圏では単に bouncing DVD logo と呼ばれることも多い。",
    },
    {
      term: "コーナーヒット(corner hit)",
      desc: "縦横の反射が同時に起きて角にぴたりと収まる稀な瞬間。この動きが愛されている理由そのもので、演出を足すならここ以外にない。",
    },
    {
      term: "delta time",
      desc: "前フレームからの経過時間。px/sで持った速度にこれを掛けて移動量にする。掛けないと120Hzの端末で倍速になる。",
    },
    {
      term: "速度ベクトルの反転",
      desc: "反射は vx / vy の符号を変えること。ただし単純な符号反転だと枠外に食い込んだフレームで震えるため、座標を端にクランプしてから符号を確定させる。",
    },
    {
      term: "アイドルタイムアウト",
      desc: "無操作が続いたら起動し、入力があれば止める、というスクリーンセーバーの発火条件。常時再生にすると読ませたい画面の邪魔になる。",
    },
  ],
  related: ["ambient-float", "bounce-in", "motion-path"],
};
