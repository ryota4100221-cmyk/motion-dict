import type { MotionEntry } from "@/lib/types";

export const squashStretch: MotionEntry = {
  slug: "squash-stretch",
  category: "ui",
  nameJa: "スクワッシュ＆ストレッチ",
  nameEn: "squash and stretch / volume-preserving deformation",
  lede: "速く動く瞬間に進行方向へ伸び、ぶつかった瞬間に潰れる非一様スケール。品質を決めるのは体積保存(scaleYを縮めた分scaleXを広げる)と、接地点にtransform-originを置くこと。この2つを外すと「ただ拡大縮小しているだけ」に見える。",
  params: [
    {
      key: "squash",
      label: "squash(接地時の潰れ量 %)",
      min: 0,
      max: 30,
      step: 1,
      default: 16,
      desc: "着地の瞬間に縦方向を何%縮めるか。12〜20%が生き物らしい弾力。25%を超えると潰れが強すぎてコミカル寄りになり、実務のUIでは玩具っぽく見える。",
    },
    {
      key: "stretch",
      label: "stretch(飛行中の伸び量 %)",
      min: 0,
      max: 30,
      step: 1,
      default: 14,
      desc: "速度が最大の区間で縦に何%伸ばすか。squashよりやや小さめ(0.7〜0.9倍)にすると自然。潰れと同量にすると伸びだけが目立って「引き伸ばした画像」に見える。",
    },
    {
      key: "recover",
      label: "recover(復元時間 s)",
      min: 0.12,
      max: 0.6,
      step: 0.02,
      default: 0.28,
      desc: "潰れてから元の形に戻るまでの時間。0.2〜0.35sが弾力の目安。0.5sを超えると変形が残って見え、素材がゴムではなく粘土に見える。",
    },
    {
      key: "overshoot",
      label: "overshoot(戻りの行き過ぎ %)",
      min: 0,
      max: 18,
      step: 1,
      default: 7,
      desc: "復元時に逆向きへ何%行き過ぎるか。5〜10%で「弾んで収まった」感じが出る。0だと硬い樹脂、15%超だとゼリーのように何度も揺れて見える。",
    },
  ],
  promptTemplate: `要素のジャンプに squash and stretch(潰れと伸び)を実装してください。

- 変形は非一様スケールで表現する。**体積保存**を守り、scaleY を s 倍にしたら scaleX は 1/s 倍にする(片方だけ動かさない)
- 接地・跳び出しの瞬間: scaleY を {{squash}}% 縮め、scaleX をその逆数分だけ広げる
- 上昇/落下の速度が最大の区間: scaleY を {{stretch}}% 伸ばし、scaleX をその逆数分だけ狭める
- 頂点(速度ゼロ)では変形を 1.0 に戻す。**速度と変形量を連動させる**のが肝で、常時変形させてはいけない
- 潰れから元の形に戻すのは {{recover}}s、戻る途中で {{overshoot}}% だけ逆向きに行き過ぎてから収める
- transform-origin は接地面側(下端 = center bottom)に置く。中心のままだと足元が床にめり込む
- width/height ではなく transform のみで動かす(リフローさせない)
- 実装は Web Animations API の element.animate() でキーフレームを組む(押すたびに撃ち直せるため)
- prefers-reduced-motion 時は変形とジャンプを完全に止め、opacity の短いフェードだけで反応を返す`,
  ngExample: {
    say: "「ボタンをぷにっと弾ませて」",
    why: "「ぷにっと」では潰れ量も戻り方も決まらないため、scale(0.9) を一様に掛けて戻すだけの「小さくなって戻る」動きが返ってくる。弾力に見えない最大の原因は、scaleX と scaleY が同じ値で動いていること(体積が保存されていないこと)。",
  },
  okExample: {
    say: "「squash and stretchで実装。着地でscaleY 0.84 / scaleXはその逆数、飛行中はscaleY 1.14で逆数、頂点は1.0。transform-originはcenter bottom、復元0.28sで7%オーバーシュート。transformのみ」",
    why: "変形の方式(非一様スケール＋体積保存)・変形量・基準点・復元の質まで数値で指定している。「scaleXは逆数」と「originは下端」の2行が、玩具っぽさと弾力の差を作る。",
  },
  vocab: [
    {
      term: "squash and stretch",
      desc: "ディズニーのアニメーション12原則の第1。速い動きで伸ばし、衝突で潰すことで、質量と柔らかさを表現する。",
    },
    {
      term: "体積保存(volume conservation)",
      desc: "潰した分だけ横に広げ、見かけの面積を一定に保つ考え方。scaleY を s 倍にしたら scaleX は 1/s 倍。これを守らないと「拡大縮小」にしか見えない。",
    },
    {
      term: "非一様スケール",
      desc: "scaleX と scaleY に別々の値を与える変形。scale(0.9) のような一様スケールでは弾力は出せない。",
    },
    {
      term: "transform-origin",
      desc: "変形の基準点。接地する側(下端)に置くと足元が床に張り付いたまま潰れる。center のままだと床にめり込む。",
    },
    {
      term: "アンティシペーション",
      desc: "動き出す直前に逆方向へ溜める予備動作。跳ぶ前に一度潰しておくと、同じ跳躍でも力の入り方が伝わる。",
    },
  ],
  related: ["bounce-in", "press-feedback", "spring-easing"],
};
