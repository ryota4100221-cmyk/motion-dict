import type { MotionEntry } from "@/lib/types";

export const motionBlurLap: MotionEntry = {
  slug: "motion-blur-lap",
  category: "hover",
  nameJa: "モーションブラー（文字が残像を引いて一周する）",
  nameEn: "motion blur text / speed blur hover / letter lap hover",
  lede: "ホバーで文字が1字ずつ右へ走り抜け、枠の左から戻ってくる。走っている間だけ後ろに薄い残像（モーションブラー）を引くので、ただの平行移動が「速さ」に見える。残像は text-shadow を進行方向の逆へずらして重ねるだけで作れる。",
  params: [
    {
      key: "duration",
      label: "duration(1字が一周する時間 s)",
      min: 0.3,
      max: 1.2,
      step: 0.02,
      default: 0.64,
      desc: "0.5〜0.7sがボタンとして軽快。抜けまでが全体の42%で、残りで左から減速して戻る。1sを超えると速さの演出なのに遅く見える。",
    },
    {
      key: "stagger",
      label: "stagger(1字ごとの遅れ ms)",
      min: 0,
      max: 40,
      step: 0.5,
      default: 8.5,
      desc: "右端の字から先に走り出す。5〜12msだと1台の車のように列で走り、20ms超はバラけて「1字ずつ」が目立つ。0は全字が一枚で動く。",
    },
    {
      key: "trail",
      label: "trail(残像の長さ em)",
      min: 0,
      max: 1.6,
      step: 0.02,
      default: 0.78,
      desc: "最速の区間でいちばん遠い残像が字の後ろに伸びる距離。0.5〜0.9emで速さが読める。1.2em超は字が潰れて読めなくなる。0で残像なし。",
    },
  ],
  promptTemplate: `ボタンのラベルに motion blur lap(文字が1字ずつ走り抜けて反対側から戻り、走っている間だけ残像を引くホバー)を実装してください。

- きっかけ: ボタンへの pointerenter(focus でも同じ)でラベルの全字を1周させる。再生中にもう一度入っても最初からはやり直さず、その周回を最後まで走らせる。pointerleave では止めない。タッチはタップ(pointerenter)で1周する
- ラベルを1字ずつ span に分け、ボタン自体を overflow: clip の枠にする(空白は動かさない)
- 1字の動きは {{duration}}s の1本のキーフレーム: 0% translateX(0) → 42% で translateX(+D) まで加速して右へ抜ける(区間の緩急 cubic-bezier(0.6, 0.02, 0.82, 0.38))→ 42.01% で translateX(-D) へ瞬間移動 → 100% で translateX(0) へ減速して戻る(区間の緩急 cubic-bezier(0.16, 0.72, 0.32, 1))
- D はボタンの幅(どの字もボタンの外まで出切る距離)。再生のたびに clientWidth を測って px で入れる
- 遅れは右端の字が 0ms、左へ1字ごとに +{{stagger}}ms(先頭の字がいちばん遅く出る＝列が右へ走る)
- 残像は各字の text-shadow を4枚重ねて作る。どれも字と同じ色で、進行方向の逆(左＝負の x)へずらす。最速の区間(30%〜52%)で 不透明度 48% / 32% / 18% / 9%、ずれ {{trail}}em × 0.10 / 0.27 / 0.54 / 1.00、ぼかし 0.008 / 0.012 / 0.018 / 0.024em。12% ではずれ・不透明度ともその約半分、78% で約4割に戻し、0% と 100% は透明(残像なし)
- さらに字の真後ろに同じ字の複製を1枚置き、SVG フィルタ feGaussianBlur(stdDeviation 横 3.2 × {{trail}}/0.78・縦 0.08)で横だけぼかし、translateX(-0.18em) scaleX(1.18)(右端基準)で後ろへ伸ばす。その不透明度を 0 → 0.36(12%) → 0.9(30〜52%) → 0.24(78%) → 0 で残像と同じ拍で動かす
- 動かすのは transform / text-shadow / opacity だけ(left や letter-spacing を動かしてリフローさせない)。キーフレームの緩急は区間ごとに付け、アニメーション全体に1本の easing を掛けない
- prefers-reduced-motion 時は文字を動かさず残像も出さない。ホバーでボタンの枠線の色だけを変える`,
  ngExample: {
    say: "「ホバーで文字がシュッと速く動く感じにして」",
    why: "「速く」は duration を短くするだけで返ってくる。短すぎて何が起きたか見えないか、filter: blur() を全体に掛けて上下にもぼけた汚い文字になる。残像を「進行方向の逆へ、横だけ」引く指定が無いと速さは描けない。",
  },
  okExample: {
    say: "「motion blur lapを実装。1字ずつ0.64sで右へ抜け42%で左端へ瞬間移動して減速で戻る。右端の字から8.5msずつ遅らせる。残像はtext-shadow4枚を左へ最大0.78emずらし、最速区間で不透明度48→9%。transformのみ」",
    why: "周回の形(抜ける位置と瞬間移動)・字ごとの遅れの向き・残像の向きと長さと濃さまで数値で指定。「左へずらしたtext-shadow」の一言で、ぼかしフィルタ全掛けではない軽い残像になる。",
  },
  vocab: [
    {
      term: "motion blur",
      desc: "動く物の後ろに引く残像。写真の流し撮りのブレと同じで、平行移動に「速さ」を足す。必ず進行方向の逆へ、動いている間だけ出す。",
    },
    {
      term: "text-shadow の重ね",
      desc: "text-shadow はカンマ区切りで何枚でも重ねられる。ずれを等比に伸ばし不透明度を下げていくと、尾が薄れていく残像になる。",
    },
    {
      term: "directional blur",
      desc: "一方向だけのぼかし。CSS の blur() は全方向なので、SVG の feGaussianBlur の stdDeviation を「横 縦」の2値で書いて横だけぼかす。",
    },
    {
      term: "lap(周回)",
      desc: "枠の外へ抜けた要素を反対側へ瞬間移動させて戻す動き。overflow: clip の枠で切ると、ワープの瞬間は見えない。",
    },
    {
      term: "逆順 stagger",
      desc: "進行方向の先頭の字(右端)から遅れ 0 にする並べ方。左端から遅らせると字が詰まって重なり、列で走って見えない。",
    },
  ],
  titleAct: { act: "arrow-slide-through", map: { duration: "duration", travel: 120, exit: 42 } },
  aliases: ["シュッ", "ビュン", "残像", "流し撮り", "走り抜ける"],
  related: ["arrow-slide-through", "text-slide-swap", "velocity-skew", "blur-reveal"],
};
