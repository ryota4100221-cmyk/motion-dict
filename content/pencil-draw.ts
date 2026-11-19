import type { MotionEntry } from "@/lib/types";

export const pencilDraw: MotionEntry = {
  slug: "pencil-draw",
  category: "media",
  nameJa: "鉛筆で描く（ペン先が線を引いていく）",
  nameEn: "pencil drawing animation / drawing hand / whiteboard animation / pen follows path",
  lede: "線画が描かれていく先端に鉛筆を乗せ、線の伸びと一緒に芯を走らせる演出。線と線のあいだは鉛筆を少し持ち上げて次の書き出しへ移し、描き終えたら横に寝かせて置く。ただのライン描画に「誰かがいま描いている」手の気配が乗り、設計・制作のサービス紹介やスケッチ風のイラストに効く。",
  params: [
    {
      key: "speed",
      label: "speed(芯が線の上を進む速さ px/s)",
      min: 200,
      max: 1600,
      step: 50,
      default: 700,
      desc: "1本の線を描く時間＝線の長さ÷speed(viewBox 320×230 を等倍で表示したときの px)。500〜900px/s が手で描く速さ。300px/s を切るとなぞり書きの練習、1200px/s を超えるとプロッタに見える。",
    },
    {
      key: "lift",
      label: "lift(持ち上げて次の線へ移る時間 s)",
      min: 0.05,
      max: 0.6,
      step: 0.01,
      default: 0.18,
      desc: "描き終えた点から次の書き出しへ鉛筆を運ぶ時間。最初の書き出しまでと、描き終えて置きに戻るのにも同じ時間を使う。0.12〜0.25s が手の運び。0.4s を超えると線と線の間で待たされる。",
    },
    {
      key: "tilt",
      label: "tilt(描いているあいだの鉛筆の傾き deg)",
      min: 0,
      max: 70,
      step: 1,
      default: 35,
      desc: "芯を軸に時計回りに倒す角度。0で真上に立ち、30〜45°が紙に向かって持った手の角度。60°を超えると寝すぎて芯の位置が読みにくい。",
    },
    {
      key: "hold",
      label: "hold(描き上がりを見せる時間 s)",
      min: 0.5,
      max: 5,
      step: 0.1,
      default: 1.6,
      desc: "鉛筆を置いてから絵を消して描き直すまで。1.2〜2s で「完成した」と読める。0.8s を切ると完成形が目に残らない。",
    },
  ],
  promptTemplate: `線画の先端に鉛筆が乗って描いていく pencil drawing(drawing hand)を実装してください。

- きっかけ: 表示した時点から操作なしで「描く → 置く → {{hold}}s 見せる → 0.4s で消す → 頭から描き直す」を繰り返す。図版の箱に pointerenter(PC のホバー)・pointerdown(スマホのタップ)したとき、と「Redraw plate」ボタンを押したときは、その瞬間に頭から描き直す
- 絵は viewBox 0 0 320 230 の SVG。枠・丸・横線2本・下の箱の5本の path(fill: none・stroke-width 4・stroke-linecap: round)を、この順に1本ずつ描く
- 各 path の全長 L を getTotalLength() で実測し、stroke-dasharray: L (L+8)・stroke-dashoffset: L+8 で隠す(間隔を8px長くして、描く前に丸い線端が点で残らないようにする)。1本を描く時間は「全長 ÷ {{speed}}px/s」(viewBox 座標＝等倍表示の px)。描き始めたら stroke-dashoffset を L×(1−進み具合) とし、進み具合を 0→1 へ cubic-bezier(0.4, 0, 0.2, 1) で送る
- 鉛筆は同じ SVG の中の <g>。芯の先を原点(0,0)に描き、本体は上(−y)へ伸ばす。毎フレーム(requestAnimationFrame)、描いている path の getPointAtLength(全長 × 進み具合) を取り、transform="translate(x y) rotate({{tilt}})" で芯の先をその点に置く(線の伸びと同じ進み具合・同じイージングを使い、線と芯がずれないようにする)
- 線と線のあいだは {{lift}}s かけて、前の線の終点から次の線の始点へ鉛筆を運ぶ(cubic-bezier(0.4, 0, 0.2, 1))。運ぶあいだは y を sin(π × 進み具合) × 10px だけ上へずらし、紙から持ち上げて見せる
- 待機と描き終わりは、枠の下の余白(236, 214)に rotate(90deg)＝横に寝かせて置く。最初の書き出しへ向かうときと、最後の線から置きに戻るときに、角度を 90deg ↔ {{tilt}}deg で同じ {{lift}}s のあいだに補間する
- 鉛筆の中は背景色で塗り、下を通る線を隠す(鉛筆が紙の上に乗って見える)。芯の先だけアクセント色
- 消すときは線を包む <g> の opacity を 0.4s で 1→0。消し終えたら dashoffset を L+8 に戻し opacity 1 にしてから次の周へ
- 線は dashoffset・鉛筆は transform だけを毎フレーム書く(path の d は変えない)
- prefers-reduced-motion 時はループしない。全線を描き上がり(dashoffset 0)で表示し、鉛筆は置いた位置・角度で静止させる`,
  ngExample: {
    say: "「線画が描かれていくアニメーションに、鉛筆も付けて」",
    why: "線は stroke-dashoffset で描かれても、鉛筆は別の @keyframes で絵の上を左右にジグザグ往復させるだけの実装が返りやすい。線の先端と芯の位置が合わないので「鉛筆が飾りで浮いている」ように見え、線と線のあいだの移動も紙の上を滑ったままになる。",
  },
  okExample: {
    say: "「pencil drawingを実装。5本のpathを順に、全長÷700px/sの時間でdashoffsetを全長→0(cubic-bezier(.4,0,.2,1))。鉛筆は毎フレーム getPointAtLength で芯を線の先端に置き、rotate(35deg)。線の間は0.18sで持ち上げて運び、描き終えたら90degに寝かせて置く。1.6s見せて0.4sで消して繰り返す。reduced-motionは描き上がりで静止」",
    why: "線と芯が同じ進み具合で動くこと(getPointAtLength)・線の間の持ち上げ・置く角度まで指定しているので、芯がいつも線の伸びる先にあり、手で描いている順番がそのまま見える。",
  },
  vocab: [
    {
      term: "getPointAtLength()",
      desc: "path の始点から指定した長さだけ進んだ位置の座標を返す SVG のメソッド。dashoffset で描いた長さと同じ値を渡すと、線の先端の座標がそのまま取れる。",
    },
    {
      term: "pen lift(ペンアップ)",
      desc: "プロッタや手描きで、線を描かずにペン先を紙から離して次の書き出しへ移る動作。わずかに上へ浮かせて運ぶだけで「描く/移る」の区別が付く。",
    },
    {
      term: "drawing hand / whiteboard animation",
      desc: "手や鉛筆が線を描いていく様子を見せる解説動画の様式。Web では SVG の線描画に描画具の位置を同期させて作る。",
    },
    {
      term: "stroke-dashoffset",
      desc: "破線の開始位置をずらす指定。dasharray を全長にして offset を全長→0 へ送ると、線が始点から描かれていく。",
    },
  ],
  titleAct: { act: "line-draw", map: { duration: 2, stagger: "lift*2" } },
  aliases: ["カリカリ", "さらさら", "スラスラ", "手描き", "鉛筆が描く"],
  related: ["line-draw", "motion-path", "marker-line", "line-boil", "typewriter"],
};
