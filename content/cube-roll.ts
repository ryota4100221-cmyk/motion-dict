import type { MotionEntry } from "@/lib/types";

export const cubeRoll: MotionEntry = {
  slug: "cube-roll",
  category: "hover",
  nameJa: "キューブロール",
  nameEn: "cube roll / 3D cube hover button",
  lede: "ボタンやカードを«厚みのある箱»として組み、ホバーで軸回りにころがして裏の面を出すホバー演出。flip-card(紙一枚の裏返し)との違いは回転の途中で側面が見えることで、それだけで «めくれた» ではなく «転がった» という手応えのある物として読まれる。",
  params: [
    {
      key: "duration",
      label: "duration(ころがる時間 s)",
      min: 0.2,
      max: 1.2,
      step: 0.05,
      default: 0.6,
      desc: "0.5〜0.7sが目安。0.3s未満だと側面が見えないまま終わり «厚み» が伝わらず、0.9sを超えるとボタンとしての反応が鈍い。",
    },
    {
      key: "depth",
      label: "depth(箱の奥行き px)",
      min: 8,
      max: 120,
      step: 4,
      default: 56,
      desc: "要素の高さと同じ値にすると正方形の断面になり、いちばん «立方体がころがる» に見える。20px以下は厚紙、100px超はブロック塀のように重くなる。",
    },
    {
      key: "overshoot",
      label: "overshoot(行き過ぎの強さ)",
      min: 0,
      max: 30,
      step: 1,
      default: 14,
      desc: "終端で少し回りすぎてから戻る量。10〜16で «勢いのある物が止まった» になる。0で素直なease-out、25を超えると跳ね返りが目立ってボタンらしさが減る。",
    },
    {
      key: "axis",
      label: "axis(回転軸)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["X(縦にころがす)", "Y(横にころがす)"],
      desc: "Xは上下に転がり上下の側面が見える。横長のボタンでは断面が正方形に近いXが自然で、縦長のカードならYが向く。",
    },
  ],
  promptTemplate: `ボタンに cube roll(3Dキューブのころがし)を実装してください。

- 中身を2枚重ねる «カードの裏返し» ではなく、6面を組んだ厚み {{depth}}px の箱として作る
- 外側に perspective(800〜1000px)、回転する箱に transform-style: preserve-3d を指定する
- 面の配置は幅w・高さh・奥行きd を CSS変数にして、front: translateZ(d/2) / back: rotateY(180deg) translateZ(d/2) / left・right: rotateY(±90deg) translateZ(w/2) / top・bottom: rotateX(±90deg) translateZ(h/2) で組む(left・rightは幅d、top・bottomは高さd)
- 箱自体に translateZ(-d/2) をかけ、回転の中心を箱の中心に合わせる(これが無いと手前の面を軸に振り回されて «ころがり» にならない)
- ホバーで {{axis}} 軸に180度回転させ、裏の面を正面に出す。マウスが離れたら同じ軸で0度へ戻す
- 時間は {{duration}}s、イージングは終端で {{overshoot}}%ぶん回りすぎてから戻る cubic-bezier(y1を1より大きくする)にする
- 各面に backface-visibility: hidden を指定する。X軸で回す場合、背面の中身は rotate(180deg) で立て直さないと上下逆さまになる
- 側面(見えるのは回転中だけ)は文字を置かず、面の «断面» と分かる色だけにする
- 回すのは transform のみ。width / height / top / left をアニメーションさせない
- ホバーできないタッチデバイスではタップで同じ回転をトグルできるようにする
- ポインタが一定時間(2秒前後)乗らない間はゆっくり同じ方向へ回り続け、触らなくても «厚みのある箱が転がる» ことが伝わるようにする。ポインタ操作があればそちらを優先する
- prefers-reduced-motion 時は回転も自走も止め、ホバーで表裏をアニメーションなしに切り替えるだけにする`,
  ngExample: {
    say: "「ボタンをホバーで3Dっぽくクルッと回して」",
    why: "面を2枚重ねただけの flip card が返ってくることがほとんどで、厚みが無いので «紙がめくれた» にしかならない。回転中心を箱の中心へ引く translateZ(-d/2) も、側面の6面も、言わなければ出てこない。",
  },
  okExample: {
    say: "「cube rollで。front/back/left/right/top/bottomの6面を奥行き56pxで組み、箱にtranslateZ(-28px)を掛けて中心を合わせる。ホバーでrotateX(180deg)、0.6sで終端に軽いオーバーシュート。背面の中身はrotate(180deg)で立て直し、タップでもトグル」",
    why: "«6面で組む» «中心を引く» の2点を名指ししているので厚みのある転がりになる。背面の立て直しは指定しないと上下逆さまの文字が本番で見つかる典型的な抜け。",
  },
  vocab: [
    {
      term: "transform-style: preserve-3d",
      desc: "子要素を同じ3D空間に置く指定。これがないと6面が同一平面に潰れ、箱として組み上がらない。",
    },
    {
      term: "translateZ",
      desc: "画面の奥行き方向への移動。各面を箱の表面まで押し出すのも、回転中心を箱の中心へ引き戻すのもこれ。",
    },
    {
      term: "backface-visibility",
      desc: "面の裏側を描画するかどうか。hiddenにしないと、回転中に箱の内側から見た面が透けて重なる。",
    },
    {
      term: "オーバーシュート(overshoot)",
      desc: "終点を一度通り過ぎてから戻る動き。cubic-bezierの制御点のyを1より大きくすると出る。重さのある物が止まる感じが出る。",
    },
  ],
  related: ["flip-card", "tilt", "press-feedback"],
};
