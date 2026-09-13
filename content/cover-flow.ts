import type { MotionEntry } from "@/lib/types";

export const coverFlow: MotionEntry = {
  slug: "cover-flow",
  category: "media",
  nameJa: "カバーフロー（3D回転カルーセル）",
  nameEn: "cover flow / coverflow carousel / 3D perspective carousel",
  lede: "中央の1枚だけが正面を向き、左右のカードはrotateYで内側へ傾いて奥に重なるカルーセル。傾ける角度と重ねる間隔の2つで「棚から1枚抜き出す」奥行きが決まり、平らなスライダーより一覧の量と今の位置が同時に伝わる。",
  params: [
    {
      key: "angle",
      label: "angle(左右カードの傾き deg)",
      min: 20,
      max: 75,
      step: 1,
      default: 48,
      desc: "rotateYの角度。45〜55°が定番で、60°を超えると絵柄がほぼ読めず背表紙の列になる。",
    },
    {
      key: "spacing",
      label: "spacing(奥のカードの間隔 px)",
      min: 16,
      max: 80,
      step: 2,
      default: 34,
      desc: "2枚目以降の重なりピッチ。カード幅の2〜3割(30〜45px)だと枚数感が出て、広げすぎると普通のカルーセルに戻る。",
    },
    {
      key: "depth",
      label: "depth(左右カードの沈み px)",
      min: 0,
      max: 300,
      step: 10,
      default: 140,
      desc: "translateZで奥へ下げる量。0だと傾くだけで平板、100〜180pxで中央の1枚が手前に浮く。",
    },
    {
      key: "duration",
      label: "duration(1枚送る時間 s)",
      min: 0.2,
      max: 1,
      step: 0.05,
      default: 0.5,
      desc: "送りのease-out時間。0.4〜0.6sが自然で、長いとカードが回る途中の姿がもたつく。",
    },
  ],
  promptTemplate: `一覧に cover flow(中央だけ正面を向く3D回転カルーセル)を実装してください。

- 各カードの位置は「現在位置からのズレ o(枚数、小数可)」だけで決める。レイアウトは動かさず transform のみで配置する
- 親に perspective を掛け、中央 (o=0) は rotateY(0) translateZ(0) で正面を向ける
- 左右のカード (|o|≥1) は rotateY(∓{{angle}}deg) で中央側へ傾け、translateZ(-{{depth}}px) で奥へ沈める
- 2枚目以降は {{spacing}}px 間隔で重ねる。0<|o|<1 の間は角度・奥行き・横位置を o に比例して補間し、中央へ回り込む途中も連続させる
- 重なり順は |o| が小さいほど手前(z-index)にする。左右のカードは半透明の黒を重ねて少し暗くし、中央を際立たせる
- 送りは {{duration}}s の ease-out。ドラッグ/スワイプ中は指に1:1で追従させ、離したら最寄りの1枚へスナップ。左右キーとカードのタップでも移動できるようにする
- 反射を付ける場合は box-reflect ではなく、scaleY(-1) の複製にグラデーションの mask-image を掛けて作る(ブラウザ差が出ない)
- prefers-reduced-motion 時は rotateY と translateZ を 0 にして平らな横並びにし、送りのアニメーションも切って即座に切り替える`,
  ngExample: {
    say: "「カルーセルを3Dっぽくして、真ん中のが目立つようにして」",
    why: "「3Dっぽく」だと中央を scale で大きくするだけの平面スライダーか、全カードが円柱に並ぶ回転木馬が返ってきやすい。左右が同じ角度で傾いて重なる、という Cover Flow 固有の形は角度と重なり間隔を言わないと出てこない。",
  },
  okExample: {
    say: "「cover flowを実装。中央はrotateY(0)、左右はrotateY(∓48deg)+translateZ(-140px)で奥へ、2枚目以降は34px間隔で重ねる。0〜1枚のズレは補間、z-indexは中央ほど手前、ドラッグで1:1追従して0.5s ease-outでスナップ、transformのみ」",
    why: "傾き・沈み・重なり間隔・補間区間・重なり順・入力とスナップまで数値で指定している。特に「|o|が0〜1の間は補間」が無いと、送った瞬間に角度がパチッと切り替わる安っぽい動きになる。",
  },
  vocab: [
    {
      term: "perspective",
      desc: "3D変形を見る視点までの距離。親に掛けると子の rotateY / translateZ に遠近が付く。小さいほど歪みが強い。",
    },
    {
      term: "rotateY",
      desc: "縦軸まわりの回転。左右のカードを中央側へ向けて「棚に並んだ背表紙」に見せる、この動きの主役。",
    },
    {
      term: "translateZ",
      desc: "画面の奥行き方向の移動。マイナスで奥へ沈み、perspective と合わせて中央の1枚を手前に浮かせる。",
    },
    {
      term: "z-index(重なり順)",
      desc: "3D変形しても描画順は自動で決まらないことがある。中央からのズレが小さいほど大きい値を与えて重なりを保証する。",
    },
    {
      term: "反射 / reflection",
      desc: "カードの下に上下反転した複製を置き、下へ向かって消えるマスクを掛けた映り込み。元祖 Cover Flow の象徴的な装飾。",
    },
  ],
  related: ["carousel", "radial-carousel", "flip-card"],
};
