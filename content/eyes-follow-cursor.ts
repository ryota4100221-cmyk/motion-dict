import type { MotionEntry } from "@/lib/types";

export const eyesFollowCursor: MotionEntry = {
  slug: "eyes-follow-cursor",
  category: "hover",
  nameJa: "目で追う（カーソルを見る瞳）",
  nameEn: "eyes follow cursor / cursor-tracking eyes / googly eyes / look-at pointer",
  lede: "キャラクターや文字の中の瞳が、カーソルのある方向へくるっと向く動き。肝は瞳の移動量を「距離に比例・白目の余白で頭打ち」にすることと、両目を同じ1本の視線で動かすことで、これを外すと瞳が白目からはみ出すか、近づいたとき寄り目になって間の抜けた顔になる。",
  params: [
    {
      key: "travel",
      label: "travel(瞳の可動域 %)",
      min: 20,
      max: 100,
      step: 5,
      default: 88,
      desc: "白目の余白(白目の半径−瞳の半径)のうち何%まで瞳を寄せるか。出典は白目5.4・瞳2.2に対して最大2.8で約88%。80〜90%で「見ている」がはっきりし、100%は縁に貼り付いて白目が欠けて見え、40%未満は向きが読み取れない。",
    },
    {
      key: "reach",
      label: "reach(端まで向く距離 px)",
      min: 40,
      max: 600,
      step: 10,
      default: 200,
      desc: "カーソルが顔からこの距離以上離れると瞳が可動域いっぱいまで寄り、近いほど中央寄りになる。出典は200px。150〜250pxが自然で、40pxにすると少し動かしただけで瞳が端へ飛び、600pxでは画面の端まで行かないと向きが出ない。",
    },
    {
      key: "lag",
      label: "lag(追いつくまでの時間 s)",
      min: 0,
      max: 0.6,
      step: 0.02,
      default: 0.14,
      desc: "瞳が新しい向きへ移るときの transition の長さ(ease-out)。出典は0.14s。0.1〜0.2sで「目で追った」感じになり、0だとカクつき、0.4sを超えると眠そうな、反応の鈍い目になる。",
    },
    {
      key: "gaze",
      label: "gaze(視線の起点)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["顔の中心(両目そろえる)", "目ごと(寄り目になる)"],
      desc: "向きを測る起点。出典は顔の中心から1本の視線を測り、両目に同じ量を足す。目ごとに測ると、カーソルを両目の間へ持ってきたとき左右の瞳が内側へ寄る(寄り目)。キャラの演技として寄り目が欲しいとき以外は「顔の中心」。",
    },
  ],
  promptTemplate: `キャラクター(または文字の中の丸)の目に eyes follow cursor(カーソルを目で追う瞳)を実装してください。

- きっかけ: ページ全体の pointermove(マウス)で、カーソルのある方向へ瞳を向ける。タッチはタップ・なぞった位置を見る。カーソルが動かなくなって1.6sたったら、見えない目標点が顔の周りをゆっくり巡り、瞳がそれを目で追う(実ポインタが動けばすぐそちらに戻す)
- 白目(円)の中に瞳(小さい円)を置き、瞳だけを transform: translate(x, y) で動かす。left/top や cx/cy は書き換えない
- 向きの起点は {{gaze}}(顔の中心=両目のあいだ・目の高さから1本の視線を測って両目に同じ量を足す / 目ごと=それぞれの目の中心から測る)
- 起点からカーソルまでのベクトル(dx, dy)と距離 d を取り、瞳の移動量 u = min(1, d / {{reach}}px) × 余白 × {{travel}}%。余白 = 白目の半径 − 瞳の半径。瞳の位置は (dx/d × u, dy/d × u)
- 計算は pointermove ごとではなく requestAnimationFrame で1フレーム1回にまとめ、結果を CSS 変数(--mx / --my)に書く
- 瞳には transition: transform {{lag}}s ease-out を付け、変数が変わるたびに新しい向きへ滑らせる
- prefers-reduced-motion 時は transition を外して瞬時に向きを変え、無操作時に巡回する自走も止める`,
  ngExample: {
    say: "「キャラの目がマウスを追いかけるようにして」",
    why: "移動量の上限が指定されないので、瞳がカーソル座標へそのまま近づいて白目からはみ出すか、atan2 の角度だけで常に縁へ貼り付いた目が返ってくる。目ごとに向きを計算されることが多く、カーソルを顔に近づけると寄り目になって間の抜けた表情になる。",
  },
  okExample: {
    say: "「eyes follow cursorで。瞳だけ translate、移動量は min(1, 距離/200px)×(白目の半径−瞳の半径)×88%。向きは両目のあいだから1本の視線で測って両目に同じ量。rAFで1回/フレーム計算して --mx/--my に書き、瞳に transition 0.14s ease-out。無操作1.6sで目標点を巡回、reduced-motionでは transition なし・自走なし」",
    why: "瞳の上限を白目の余白からの比率で決め、距離で比例させる式まで渡しているので、はみ出しも縁への貼り付きも起きない。「両目に同じ量」の一言が寄り目を防ぎ、ease-out の短い transition が「目で追った」反応の速さを決める。",
  },
  vocab: [
    {
      term: "ルックアット(look-at)",
      desc: "対象の方向へ向きを合わせる処理。3Dでは頭や目の回転、2Dでは瞳の平行移動で表す。",
    },
    {
      term: "クランプ(clamp)",
      desc: "値を上限・下限の範囲に押し込めること。ここでは瞳の移動量を白目の余白で頭打ちにして、はみ出しを防ぐ。",
    },
    {
      term: "正規化ベクトル(unit vector)",
      desc: "長さを1にそろえた方向だけの矢印。dx/d, dy/d で向きを取り出し、そこへ移動量を掛ける。",
    },
    {
      term: "寄り目(cross-eye / vergence)",
      desc: "左右の目が近くの一点を見るために内側へ寄ること。目ごとに向きを測ると近距離で起きる。",
    },
  ],
  titleAct: { act: "magnetic-hover", map: { radius: "reach", strength: 0.3, lerp: 0.18 } },
  aliases: ["ぎょろっ", "キョロキョロ", "チラッ", "目が追ってくる", "目玉"],
  related: ["eye-blink", "magnetic-hover", "mouse-parallax"],
};
