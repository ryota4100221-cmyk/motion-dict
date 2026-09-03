import type { MotionEntry } from "@/lib/types";

export const conicSweep: MotionEntry = {
  slug: "conic-sweep",
  category: "ui",
  nameJa: "円弧スイープ",
  nameEn: "conic sweep / conic-gradient arc sweep",
  lede: "円周に沿った弧を、始点と終点の角度を別々に送って描いたり消したりする演出。SVGのstroke-dashoffsetを使わずconic-gradientだけで組めるのが要で、「輪が一度ほどけて描き直される」という所作まで角度2つで表現できる。",
  params: [
    {
      key: "duration",
      label: "duration(1周の時間 s)",
      min: 0.6,
      max: 4,
      step: 0.1,
      default: 1.6,
      desc: "1周にかける時間。ホバーの返事なら0.6〜1.2s、待たせる表示なら1.4〜2sが目安。3sを超えると止まって見える。",
    },
    {
      key: "arc",
      label: "arc(弧の長さ deg)",
      min: 30,
      max: 350,
      step: 10,
      default: 300,
      desc: "弧が伸びきったときの長さ。300deg前後だと「輪が閉じかける」緊張が出て、60〜120degだと軽い待機インジケータになる。",
    },
    {
      key: "thickness",
      label: "thickness(線の太さ px)",
      min: 1,
      max: 16,
      step: 1,
      default: 3,
      desc: "輪の太さ。マスクの内径をこの値だけ内側に取って作る。2〜4pxが線らしく、8pxを超えるとドーナツの印象に寄る。",
    },
    {
      key: "mode",
      label: "mode(動き方)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["chase", "spin"],
      desc: "chaseは弧が伸びたあと尻尾が頭に追いついて消える(描き直しの所作)。spinは一定長の弧が回り続ける(待機の表示)。",
    },
  ],
  promptTemplate: `円形ボタンに conic sweep(円弧スイープ)を実装してください。

- 弧はSVGではなくconic-gradientで描く。始点角 --start と終点角 --end の2変数を用意し、
  background: conic-gradient(from 0deg, transparent 0deg var(--start), currentColor var(--start) var(--end), transparent var(--end) 360deg)
- --start / --end は @property で syntax: "<angle>" として登録する(登録しないと角度が補間されず、弧が伸びずにパッと切り替わる)
- 中央をくり抜いて輪にするのは mask: radial-gradient(farthest-side, transparent calc(100% - {{thickness}}px), #000 calc(100% - {{thickness}}px))
- 動きは {{mode}} 型にする。chase は --end を0→{{arc}}degへ伸ばしたあと、--start と --end を360degへ揃えて送り、尻尾が頭に追いつく形で消す。spin は弧の長さを {{arc}}deg で固定し、要素ごと transform: rotate(360deg) で回す
- 1周は {{duration}}s の linear。ループの継ぎ目が出ないよう、終端の角度は開始とちょうど360deg差に揃える
- 回すのは transform、描くのは角度。width や border-width をアニメーションさせない(リフローさせない)
- prefers-reduced-motion: reduce のときはアニメーションを止め、{{arc}}deg の弧を静止表示する`,
  ngExample: {
    say: "「丸いボタンの周りをくるくる回して」",
    why: "「くるくる」だとborderを1本回すだけのローディングスピナーが返ってくる。弧の長さも、描いてから消えるという所作も指定されていないので、ホバーの返事ではなく「読み込み中」に見えてしまう。",
  },
  okExample: {
    say: "「conic-gradientと@propertyの角度2つで円弧を作り、--endを0→300degに伸ばしてから--startを追いつかせて消すchaseを1.6s linearで。輪はmaskで内側3pxをくり抜き、reduced-motionでは静止」",
    why: "描画方式(conic-gradient + @property)・角度の送り方・太さの作り方まで決まっているのでSVGを持ち出されずに済む。「尻尾が追いつく」まで書くと、消える向きが描いた向きに揃う。",
  },
  vocab: [
    {
      term: "conic-gradient",
      desc: "中心のまわりを角度方向に回りながら色が変わるグラデーション。角度で色を切れば、その区間がそのまま円弧になる。",
    },
    {
      term: "@property",
      desc: "カスタムプロパティに型(syntax)を与えるCSSの登録機構。<angle>として登録して初めて角度が補間され、弧が伸び縮みする。",
    },
    {
      term: "radial-gradientのmask",
      desc: "中心側を透明にした円形マスクで塗りをくり抜き、円盤を輪にする手法。borderと違い線の太さを変数1つで動かせる。",
    },
    {
      term: "from 0deg",
      desc: "conic-gradientの開始角。既定の0degは12時方向で、そこから時計回りに進む。起点をずらしたいときだけfromを書く。",
    },
    {
      term: "chase",
      desc: "頭が先に進み、あとから尻尾が追いつく動き。両端を別々に送ることで、描く→消すが一方向に揃う。",
    },
  ],
  related: ["circular-progress", "spinner-ring", "gradient-morph"],
};
