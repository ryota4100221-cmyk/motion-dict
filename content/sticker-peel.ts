import type { MotionEntry } from "@/lib/types";

export const stickerPeel: MotionEntry = {
  slug: "sticker-peel",
  category: "ui",
  nameJa: "ステッカーピール（シールめくれ）",
  nameEn: "sticker peel / peel-off effect / tape peel / peeling sticker",
  lede: "シールやテープの端が1本の折り目でめくれ上がり、裏紙の色をのぞかせてからまた貼り付く動き。実体は「折り目より上を切り取り、同じ形を折り目で鏡写しにして重ねる」だけの2D作図で、3D回転を使わないので軽く、どんな形のシールにもそのまま効く。",
  params: [
    {
      key: "depth",
      label: "depth(めくれる深さ %)",
      min: 10,
      max: 60,
      step: 1,
      default: 32,
      desc: "折り目が最大でどこまで下りるか(シールの高さに対する%)。実測は32%。25〜35%で「端がはがれかけている」に見え、50%を超えると半分はがれて剥がし終わる途中に見える。",
    },
    {
      key: "duration",
      label: "duration(めくれる時間 s)",
      min: 0.2,
      max: 1.5,
      step: 0.05,
      default: 0.5,
      desc: "めくれ上がる側の時間。実測は0.5s power2.out。戻りはこの1.6倍(実測0.8s)をかけてゆっくり貼り付ける。0.3s未満はパチッと弾けて見え、1sを超えると粘着が強すぎる重いテープになる。",
    },
    {
      key: "hold",
      label: "hold(めくれたまま止める時間 s)",
      min: 0,
      max: 3,
      step: 0.1,
      default: 0.9,
      desc: "めくれきってから戻り始めるまでの間。実測は0.9s。裏紙の色を読ませる時間で、0だとはね返っただけに見え、2sを超えると「はがれたまま」の状態表示に読める。",
    },
    {
      key: "angle",
      label: "angle(めくる向き deg)",
      min: -60,
      max: 60,
      step: 1,
      default: -30,
      desc: "折り目の傾き。0で上辺がまっすぐ折れ(テープ向き)、±30〜45で角からめくれる(シール向き)。60に近づくと折り目が縦に立ち、側面からはがすように見える。",
    },
  ],
  promptTemplate: `ステッカー(シール/テープ)に sticker peel(端がめくれて戻る動き)を実装してください。

- きっかけ: ページ表示の0.6s後から操作不要で自動ループする。加えて各シールへの pointerenter / focus / クリック(タップ)でその1枚を1回再生する（再生中の1周が終わるまでは受け付けない）
- 進み具合は 0〜1 の CSS 変数 --peel ひとつで表し、見た目はすべて CSS の calc で --peel から導く
- シール全体の外枠(.peel)を rotate({{angle}}deg) で回し、中身はさらに逆向きに -({{angle}})deg 回して正立させる。こうすると折り目は外枠の水平線のまま、画面上では {{angle}}deg 傾いた線になる
- 折り目の位置 cut は「上端より少し外(=何も折れていない)」から上端から {{depth}}% までを --peel で補間する
- 表面(face)は clip-path: polygon で折り目より下だけを残す
- めくれた部分(flap)は表面と同じ形の複製を top: calc(-100% + 2 * cut) に置いて transform: scaleY(-1) で裏返し、clip-path で折り目より上だけを残す。これで切り取った上側が折り目を軸に鏡写しで重なる
- flap の中身は表の絵柄ではなく裏紙の単色にし(SVG filter の feFlood + feComposite in=SourceAlpha でも可)、filter: brightness(calc(1 + var(--peel) * 0.22)) で反るほど明るくする。flap の外側の要素に drop-shadow を付けて浮きを出す
- 再生は --peel を 0→1 に {{duration}}s(power2.out = 1−(1−t)²)、{{hold}}s 止めて、1→0 に duration の1.6倍(power3.inOut)。--peel の値は rAF で毎フレーム計算して書き込む。複数枚あるときは1.3sずつずらし、1周後に3.4s 休んで繰り返す
- 動かすのは clip-path と transform だけにし、width・height・top を毎フレーム書き換えない(cut は CSS 変数経由で一度に反映する)
- prefers-reduced-motion 時はループもホバー再生もせず、--peel を 0.3 前後に固定した「少しはがれた」静止状態で見せる`,
  ngExample: {
    say: "「シールがペロッとはがれるアニメーションを付けて」",
    why: "「ペロッと」には折り目の位置も向きも無いので、rotateX で板ごと手前に倒す・角を scale で縮めるなどの実装が返りやすい。シールの形が崩れたり、裏面が表の絵柄のまま見えて「紙が折れた」と読めなかったりする。",
  },
  okExample: {
    say: "「sticker peelで。--peel(0〜1)だけで制御。外枠を-30deg回して中身を逆回転、折り目は上端外→上から32%を補間。表は折り目より下を clip、flap は複製を top: -100% + 2*cut に置き scaleY(-1)、折り目より上を clip して裏紙色に。0.5s ease-outでめくり0.9s止めて0.8sで戻す。reduced-motionでは0.3で静止」",
    why: "折り目の作図(下を切り取り、上を鏡写しで重ねる)・向き・深さ・裏面の色・めくり/停止/戻りの時間まで指定している。「同じ形を折り目で反転して重ねる」の一言が、3Dで板を倒す実装との分かれ目になる。",
  },
  vocab: [
    {
      term: "折り目(fold line)",
      desc: "めくれた部分と貼り付いた部分の境目。この1本の線の位置を動かすだけで、めくれの深さ全体が決まる。",
    },
    {
      term: "鏡写し(reflection)",
      desc: "折り目を軸に上下を反転して重ねること。scaleY(-1) と「折り目の2倍の位置へ動かす」の組み合わせで、2Dのまま紙を折った形が作れる。",
    },
    {
      term: "clip-path: polygon()",
      desc: "要素を多角形で切り抜くプロパティ。表は折り目より下、flap は折り目より上、と同じ折り目の値で2回切ることで継ぎ目がぴったり合う。",
    },
    {
      term: "裏紙(backing)",
      desc: "シールの裏側の色。表の絵柄を反転して見せるのではなく単色で塗ると、はがれた紙の裏だと一目で分かる。",
    },
    {
      term: "回転の打ち消し(counter-rotation)",
      desc: "外枠を回して中身を同じ角度だけ逆に回す手法。中身は正立のまま、外枠の座標系(ここでは折り目の向き)だけを傾けられる。",
    },
  ],
  related: ["page-turn", "flip-card", "scratch-card", "holo-sheen"],
};
