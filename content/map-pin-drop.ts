import type { MotionEntry } from "@/lib/types";

export const mapPinDrop: MotionEntry = {
  slug: "map-pin-drop",
  category: "ui",
  nameJa: "マップピンドロップ（地図にピンがストンと刺さる）",
  nameEn: "map pin drop / marker drop animation / bouncing map marker",
  lede: "地図や図版の上に、ピンが上から落ちてきて少し行き過ぎて刺さり、選んだピンだけがふわっと浮いて上下し続ける位置の目印。ピンの真下の地面に影を置き、ピンが高いほど影を小さく薄くするのが品質のすべてで、影が付いてくるだけで「浮いている・ここに刺さった」が一目で分かる。",
  params: [
    {
      key: "height",
      label: "height(落ちてくる高さ px)",
      min: 60,
      max: 480,
      step: 10,
      default: 260,
      desc: "ピンが刺さる位置の何px上から落とすか。200〜300pxで「上から降ってきた」と分かる。100pxを切るとずれて出てきたようにしか見えず、400pxを超えると落ちる間が長く、地図を読む前に待たされる。",
    },
    {
      key: "duration",
      label: "duration(落ちて刺さるまで s)",
      min: 0.2,
      max: 1.2,
      step: 0.05,
      default: 0.5,
      desc: "1本が落ち始めてから止まるまで。0.4〜0.6sが軽快。0.3sを切ると瞬間移動に、0.9sを超えると風船のように漂って見える。",
    },
    {
      key: "overshoot",
      label: "overshoot(行き過ぎ cubic-bezierの4つ目)",
      min: 1,
      max: 1.8,
      step: 0.05,
      default: 1.35,
      desc: "cubic-bezier(0.33, 0.85, 0.4, x)の x。1.0だと地面でピタッと止まり、1.3〜1.4で刺さった反動に一度沈んで戻る。1.6を超えるとピンが地面に潜って見える。",
    },
    {
      key: "float",
      label: "float(選んだピンの浮き沈み px)",
      min: 0,
      max: 24,
      step: 1,
      default: 9,
      desc: "選んだピンが7px持ち上がった位置から、さらに何px上下に行き来するか。6〜12pxで「選ばれて息をしている」程度。0なら持ち上がって止まるだけ、16pxを超えると跳ねて落ち着かない。",
    },
  ],
  promptTemplate: `図版や地図の上の位置マーカーに map pin drop(ピンが落ちて刺さり、選んだピンが浮く)を実装してください。

- きっかけ: 表示した時点で4本のピンが順に落ちてくる。「Drop pins again」ボタンを押すと全部が上に消えて最初から落ち直す。ピンにポインタが乗る(スマホはタップ)とそのピンが選択になり、別のピンに乗ると選択が移る。誰も触っていない間は、落ち終わってから2.4sごとに選択を左から順に自動で回す(触ったら自動送りは止め、ボタンで落とし直すと再開する)
- ピンの要素は「刺さる先端」の座標に置き、先端(下端中央)を原点にする。中に3枚重ねる: 地面の影 / 落下させる層 / 浮かせる層(この中にピンの絵とラベル)。落下と浮遊を別の要素に掛けて transform を取り合わせない
- 落下: @keyframes を 0% transform: translateY(-{{height}}px)・opacity 0 → 60% opacity 1 → 100% translateY(0)。{{duration}}s・cubic-bezier(0.33, 0.85, 0.4, {{overshoot}})・animation-fill-mode both。4本は 90ms ずつ animation-delay をずらす
- 影: 先端の真下に横長の楕円(30×9px・黒・opacity 0.35)を置き、落下と同じ時間・同じ delay で transform: scale(0.3)・opacity 0 → scale(1)・opacity 0.35 に育てる(ピンが近づくほど影が濃く大きくなる)
- 選択: 浮かせる層を translate: 0 -7px へ 0.4s・cubic-bezier(0.34, 1.56, 0.64, 1)(少し行き過ぎて戻る)で持ち上げ、0.4s 後から 0.8s・ease-in-out・infinite alternate で translate: 0 -7px ⇄ 0 calc(-7px - {{float}}px) を往復させる。影は同じ周期で scale 1 ⇄ 0.8・opacity 0.35 ⇄ 0.18 を往復させ、ピンが高いときほど小さく薄くする。選択中のピンだけ上にラベル(地名)を opacity で出す
- 動かすのは transform / translate / scale / opacity だけ。top や margin を動かさない(地図の再描画やリフローを起こさない)
- prefers-reduced-motion 時は落下も浮遊もせず、ピンを最初から刺さった位置に置く。選択は7px持ち上げた静止とラベル表示だけで示す`,
  ngExample: {
    say: "「地図のピンをポンって落としてアクティブなのはぴょこぴょこさせて」",
    why: "「ポンって」では高さも時間も行き過ぎも決まらず、translateY を ease-out で下ろすだけの、着地の反動が無い動きが返ってきやすい。影の指定が無いのでピンが宙に浮いたまま地面との距離が読めず、ぴょこぴょこは bounce の繰り返しで地図の上がずっと騒がしくなる。",
  },
  okExample: {
    say: "「map pin dropを実装。先端を原点に、translateY(-260px)→0を0.5s cubic-bezier(.33,.85,.4,1.35)、90msずつずらす。真下の影はscale .3→1で一緒に育てる。選択は0.4s cubic-bezier(.34,1.56,.64,1)で7px持ち上げ、0.8s alternateで9px上下、影はscale .8・opacity .18まで縮める。reduced-motionは静止」",
    why: "落ちる距離・時間・行き過ぎの量を数値で、影をピンの高さに連動させることまで指定しているので、「刺さった」「浮いている」が影で読める。落下と浮遊を別の層に分けているので、選択しても落下のアニメーションと取り合わない。",
  },
  vocab: [
    {
      term: "anchor point(先端の原点)",
      desc: "ピンの絵の、地図上の座標を指す一点(しずく形の下端)。要素の原点をここに置くと、どの大きさで描いても先端がずれない。",
    },
    {
      term: "contact shadow(接地影)",
      desc: "物体の真下に落ちる小さく濃い影。物体が高いほど小さく薄く、近いほど大きく濃くすると、高さの手がかりになる。",
    },
    {
      term: "overshoot(行き過ぎ)",
      desc: "cubic-bezier の4つ目(y2)を1より大きくすると、終点を一度越えてから戻る。ピンでは地面に刺さった反動として見える。",
    },
    {
      term: "selected marker(選択中のマーカー)",
      desc: "地図の上で今見ている1本。ほかと区別するため持ち上げて浮かせ、ラベルを出す。Google Maps の API では Animation.BOUNCE として用意されている。",
    },
  ],
  titleAct: { act: "bounce-in", map: { height: "height*0.5", bounces: 1, damping: 0.25, duration: "duration*2" } },
  aliases: ["ストン", "ぴょこぴょこ", "ポンッ", "地図のピン", "マーカーが落ちる"],
  related: ["pulse-ring", "bounce-in", "ambient-float"],
};
