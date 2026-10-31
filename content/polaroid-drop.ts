import type { MotionEntry } from "@/lib/types";

export const polaroidDrop: MotionEntry = {
  slug: "polaroid-drop",
  category: "media",
  nameJa: "ポラロイドドロップ",
  nameEn: "polaroid drop / scattered photo drop / photo pile reveal",
  lede: "写真が少しだけ上から1枚ずつ置かれ、それぞれ違う角度に傾いたまま机に散らばる演出。肝は「大きめ→原寸」の縮みと着地の小さな行き過ぎで、これが無いと下からのフェードインと区別が付かず「手で置いた」感じが出ない。",
  params: [
    {
      key: "drop",
      label: "drop(置く前に浮かせる高さ %)",
      min: 0,
      max: 40,
      step: 1,
      default: 12,
      desc: "写真1枚の高さに対する割合。10〜15%で「上から置いた」と読める。30%を超えると置くではなく落とすに見え、着地の行き過ぎが跳ね返りになる。",
    },
    {
      key: "tilt",
      label: "tilt(散らす傾きの最大 deg)",
      min: 0,
      max: 12,
      step: 0.5,
      default: 5,
      desc: "各写真の着地角度の上限。±3〜5degが手で並べた癖に見える。0で整列した額装になり、8degを超えると散らかった印象が勝つ。",
    },
    {
      key: "duration",
      label: "duration(1枚が置かれる時間 s)",
      min: 0.2,
      max: 1.2,
      step: 0.05,
      default: 0.55,
      desc: "0.45〜0.6sが自然。0.3sを切ると行き過ぎが見えずに瞬間表示になり、1sを超えると宙に浮いている時間が長く見える。",
    },
    {
      key: "stagger",
      label: "stagger(1枚ごとの遅れ ms)",
      min: 0,
      max: 200,
      step: 5,
      default: 70,
      desc: "前の写真が着地しきる前に次を置き始める間隔。60〜90msで「次々と置かれる」リズムになる。0で全部同時に降り、150msを超えると1枚ずつ待たされる。",
    },
  ],
  promptTemplate: `写真6枚のギャラリーに polaroid drop(散らばった写真が1枚ずつ置かれる演出)を実装してください。

- きっかけ: ボードが表示されたとき(マウント時)に1回だけ再生する。「Lay out again」ボタンを押すと全部を消してから同じ順番で置き直す。写真への mouseenter で傾きを打ち消して持ち上げ、mouseleave で戻す。タッチは写真をタップするたびに持ち上げ/戻しをトグルする
- 写真は白い余白(下を広めにしたポラロイド風の枠)に入れ、3列×2段に少しずつずらして絶対配置する
- 各写真の着地角度は -1, 0.6, -0.4, 0.8, -0.7, 1 の係数 × {{tilt}}deg で固定する(乱数にしない=毎回同じ散らばり方)
- 開始状態は opacity: 0・translateY(-{{drop}}%)(写真自身の高さ基準)・scale(1.08)、そこから着地角度の rotate だけが残る状態へ動かす
- 時間は {{duration}}s、イージングは cubic-bezier(0.25, 1.3, 0.5, 1)(着地でわずかに行き過ぎて戻る)。fill-mode は both
- 遅延は 0.12s + 並び順 × {{stagger}}ms(左上から右下へ)
- ホバーでは rotate を着地角度の逆向きで打ち消し scale(1.07)、影を深くする(0.3s ease)
- top / left ではなく transform と opacity だけで動かす(リフローさせない)
- prefers-reduced-motion 時は置くアニメーションを省略し、着地した状態で最初から表示する(傾きは残す)`,
  ngExample: {
    say: "「写真がパラパラっと机に置かれる感じでギャラリーを出して」",
    why: "「パラパラ」では置く方向も傾きも決まらない。下からのフェードイン＋stagger(＝scroll fade in)か、ランダム角度で毎回散らばり方が変わる実装が返り、着地の行き過ぎと「大きめから縮む」が抜けて手で置いた感じが出ない。",
  },
  okExample: {
    say: "「polaroid dropで。opacity 0・translateY(-12%)・scale(1.08)から着地角度のrotateへ、0.55s cubic-bezier(0.25,1.3,0.5,1)、遅延0.12s+i×70ms。角度は±5degの固定係数。transformのみ」",
    why: "開始状態(上・大きめ)と着地の行き過ぎをイージングの値で指定し、角度を固定係数にして毎回同じ散らばり方にした。「transformのみ」で並べ直しの重さも防げる。",
  },
  vocab: [
    {
      term: "overshoot easing",
      desc: "cubic-bezier の y を1より大きくした曲線(例 0.25, 1.3, 0.5, 1)。終点を少し越えて戻るので、置いた物がわずかに沈んで止まる感触になる。",
    },
    {
      term: "stagger",
      desc: "複数要素の開始を一定間隔でずらすこと。animation-delay に並び順×間隔を入れる。",
    },
    {
      term: "animation-fill-mode: both",
      desc: "遅延中は開始状態(透明・浮いた状態)を、終了後は最終状態を保つ指定。無いと遅延中の写真が先に着地位置で見えてしまう。",
    },
    {
      term: "scatter layout",
      desc: "格子を基準に位置と角度を少しずつ崩した配置。乱数ではなく固定の係数で崩すと、再表示しても同じ机の上に見える。",
    },
  ],
  titleAct: { act: "scroll-fade-in", map: { distance: "drop*3", duration: "duration", stagger: "stagger" } },
  aliases: ["ぱさっ", "パラパラ", "ポラロイド", "写真を散らす", "トスッ"],
  related: ["stamp-in", "stagger-grid", "card-shuffle"],
};
