import type { MotionEntry } from "@/lib/types";

export const vinylSlideOut: MotionEntry = {
  slug: "vinyl-slide-out",
  category: "hover",
  nameJa: "レコードが袖から出る",
  nameEn: "vinyl record hover / record sleeve slide-out / vinyl reveal",
  lede: "ホバーでジャケットの裏から盤が横へスッと半分ほど滑り出て、中央のラベルだけがゆっくり回り出す。音源・作品一覧の「再生できる」を、再生ボタンより先に形で伝える定番の見せ方。",
  params: [
    {
      key: "slide",
      label: "slide(引き出す量 %)",
      min: 20,
      max: 70,
      step: 1,
      default: 56,
      desc: "盤の直径に対する横移動の割合。45〜60%で「半分出ている」と読める。回るラベルまで見せるなら55%以上(46%ではラベルがほぼ袖に隠れる)。70%を超えるとジャケットから外れて別物に見える。",
    },
    {
      key: "duration",
      label: "duration(滑り出る時間 s)",
      min: 0.3,
      max: 1.6,
      step: 0.05,
      default: 0.8,
      desc: "ease-out-expo なので体感は数値の半分ほど。0.6〜0.9sが自然。0.4s以下は弾かれたように見える。",
    },
    {
      key: "spin",
      label: "spin(1回転の秒数 s)",
      min: 0.8,
      max: 6,
      step: 0.1,
      default: 2.4,
      desc: "ラベルが1周する時間。実機の33⅓回転は1.8s。2〜3sにすると落ち着いた「試聴」の速さになる。",
    },
  ],
  promptTemplate: `音源のジャケット一覧に vinyl record hover(レコードが袖から出る)を実装してください。

- きっかけ: ジャケット(盤を含む箱)への mouseenter で盤を引き出してラベルを回し、mouseleave で盤を戻してラベルの回転を止める。キーボードは focus / blur で同じ。タッチはタップするたびに出す/戻すをトグルする(別のジャケットをタップしたらそちらに切り替える)
- 箱は正方形のジャケット。盤(円・ジャケットの88%・上と左に6%の余白)はジャケットの裏(z-index が下)に重ねて隠しておく
- ホバーで盤を transform: translateX({{slide}}%)(盤自身の直径に対する%)へ、{{duration}}s の cubic-bezier(.16, 1, .3, 1) で右へ滑り出させる。離れたら同じ duration・同じイージングで translateX(0) に戻す
- 盤の中央36%のラベル(ジャケットと同じ画像を丸く抜く)だけを rotate(0→360deg)・1周 {{spin}}s・linear・infinite で回す。アニメーションは常に付けておき、ホバー外は animation-play-state: paused で止める(外したときに0°へ飛ばさない)
- 盤には repeating-radial-gradient の細い同心円で溝を描き、1px の淡い縁取りで暗い背景から浮かせる
- 盤の右に出る分(ジャケット幅の約4割)は隣の要素と重ならないよう隙間を空けておく。タイトルはホバー中に translateX(12px) を 0.6s 同じイージングで添える
- left や width ではなく transform で動かす(リフローさせない)
- prefers-reduced-motion 時は transition を外して盤を即時に出し入れし、ラベルは回さない`,
  ngExample: {
    say: "「アルバムのジャケットにホバーしたらレコードが出てくるようにして」",
    why: "出る向き・量・速さが決まらず、盤が上に飛び出してジャケットを覆う、盤ごと回して溝が回って見えない、外した瞬間に回転が0°へ戻ってカクッとする、といった実装が返ってくる。",
  },
  okExample: {
    say: "「ジャケット裏の盤(88%)を hover で translateX(56%)、0.8s cubic-bezier(.16,1,.3,1)。中央ラベルだけ 2.4s/周 linear で回し、外では paused。transform のみ・reduced-motion は即時で回転なし」",
    why: "引き出す向きと量を盤の直径基準の%で、回すのはラベルだけ・止め方は paused、と部品ごとに指定している。ここが抜けると「出てくる」の解釈がばらける。",
  },
  vocab: [
    {
      term: "sleeve(ジャケット)",
      desc: "レコードを収める正方形の袋。盤は袖(sleeve)の口から横に引き出すもの、という実物の動きがこの演出の根拠になる。",
    },
    {
      term: "translateX(%)",
      desc: "% は親ではなく要素自身の幅に対する割合。盤の直径基準で「半分出す」と書けるので、ジャケットの大きさが変わっても見え方が揃う。",
    },
    {
      term: "animation-play-state",
      desc: "running / paused でアニメーションをその場で止める・再開する。アニメーション自体を外すと 0° に戻ってしまうので、回転の一時停止はこちらで行う。",
    },
    {
      term: "ease-out-expo",
      desc: "cubic-bezier(.16, 1, .3, 1)。出だしで一気に進み、終わりを長く減速する。盤がスッと出て、静かに止まる手触りになる。",
    },
  ],
  titleAct: { act: "arrow-slide-through", map: { duration: "duration", travel: 30 } },
  aliases: ["スッと出る", "くるくる", "レコード", "ジャケットから盤", "試聴"],
  related: ["rotating-badge", "image-swap-hover", "row-expand"],
};
