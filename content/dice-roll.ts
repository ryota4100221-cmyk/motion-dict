import type { MotionEntry } from "@/lib/types";

export const diceRoll: MotionEntry = {
  slug: "dice-roll",
  category: "ui",
  nameJa: "サイコロを振る（ランダムに引くボタン）",
  nameEn: "dice roll animation / roll the dice / randomize button",
  lede: "押すと縮んで溜め、離すとサイコロが跳ね上がって1回転し、空中で目が何度か入れ替わってから着地でつぶれて止まる。「おまかせ」「ランダムに選ぶ」ボタンの結果を、ただ差し替えるのではなく「振って出た」と見せる演出で、目の入れ替わりが後ろほど間延びするのが転がりが止まっていく手触りを作る。",
  params: [
    {
      key: "duration",
      label: "duration(回って着地するまで s)",
      min: 0.3,
      max: 1.2,
      step: 0.02,
      default: 0.52,
      desc: "1回転と跳ね上がり→落下に掛ける時間。0.45〜0.6sが「振った」と読める速さ（観察元は0.52s）。0.35s未満だと目の入れ替わりが見えず、0.9sを超えると結果を待たされる。着地の戻り0.5sはこの外に足される。",
    },
    {
      key: "hop",
      label: "hop(跳ね上がる高さ px)",
      min: 0,
      max: 40,
      step: 1,
      default: 14,
      desc: "空中の最高点。サイコロの大きさの15〜25%が目安（観察元は26pxの目に14px＝ボタン内の小さなアイコン）。0にするとその場で回るだけになり、40px近くでは周りの文字を跨いで飛ぶ。",
    },
    {
      key: "squash",
      label: "squash(着地のつぶれ %)",
      min: 0,
      max: 40,
      step: 1,
      default: 24,
      desc: "着地の瞬間に縦を縮め横を広げる量（scaleY 1−値・scaleX 1＋値）。20〜26%でゴムの手応え（観察元は scaleX 1.26 / scaleY 0.76）。10%以下だと硬い樹脂の駒、35%を超えるとサイコロではなくスライムに見える。",
    },
    {
      key: "shuffles",
      label: "shuffles(空中で目が変わる回数)",
      min: 0,
      max: 10,
      step: 1,
      default: 5,
      desc: "着地前に目を入れ替える回数。4〜6回で「転がっている」と読める（観察元は5回）。0だと着地で突然目が変わり、8回を超えると0.5s前後では1回ごとの目が読めず点滅に見える。",
    },
  ],
  promptTemplate: `「ランダムに選ぶ」ボタンに dice roll animation（サイコロを振る演出）を実装してください。

- きっかけ: サイコロのボタンへの pointerdown で押し込み（溜め）、pointerup で振る。押したまま外れた／pointercancel なら振らずに戻す。キーボードは Enter / Space の click（event.detail === 0）で溜め無しに振る。振っている最中の操作は無視し、1回振るごとに1回止まる
- サイコロは角丸の正方形に 3×3 のマスで点を打ち、目（1〜6）ごとに点の位置を切り替える。要素を2重にし、外側は跳ね・潰れ（transform-origin: 下端中央＝接地点）、内側は回転（transform-origin: 中心）を受け持つ。1つの要素で下端を軸に回すと振り子のように外へ振れる
- 押し込み: 0.14s power2.out で translateY(1.5px) scale(1.14, 0.82)。押し込みの途中で離したら、その時点の形から振り始める
- 振る: rotate を 0→360deg、{{duration}}s の power1.out（cubic-bezier(.25,.46,.45,.94) 相当）
- 同時に跳ねる: 前半 {{duration}}s × 0.42 で translateY(-{{hop}}px)・scale(0.9, 1.12) へ power2.out、残り {{duration}}s × 0.58 で translateY(0)・scale(1) へ power2.in
- 空中で目を {{shuffles}} 回入れ替える。k 回目（k = 1〜{{shuffles}}）は振り始めから {{duration}}s × 0.67 × (k / {{shuffles}})^1.2 の時刻（後ろほど間が延びる＝止まっていく手触り）。毎回、直前の目と違う目にする
- 着地（{{duration}}s の時点）で最終の目を確定し、結果（引いた項目）を表示する。最終の目は直前に見えていた目とも前回の結果とも違う目から引く（同じ結果が続くと「振ったのに変わらない」に見える）。同時に scale(1 + {{squash}}%, 1 − {{squash}}%) まで潰し、0.5s の elastic.out(1, 0.42) で scale(1) に戻す
- 変形は transform のみ（width / height を動かさない・リフロー禁止）。rAF 1本で時刻から全値を計算し、押し込み→振る→着地を同じループで繋ぐ
- 結果の文字は aria-live="polite" で読み上げ、振っている間は aria-busy="true" を付ける。ヒット領域は 44px 以上
- タッチは pointer イベントで同じ挙動（touch-action: none でスクロールと奪い合わない）
- prefers-reduced-motion 時は回転・跳ね・潰れ・目の入れ替わりをすべて止め、押したら最終の目と結果だけを即座に切り替える`,
  ngExample: {
    say: "「ランダムボタンにサイコロが転がるアニメーションを付けて」",
    why: "「転がる」が回転だけを指すのか決まらず、rotate を CSS で無限に回してタイマーで止める実装や、目を一定間隔でパラパラ切り替えるだけの実装が返ってきがち。等間隔の入れ替わりはスロットのように機械的に見え、着地のつぶれも無いので「止まった」瞬間が伝わらない。結果を出すタイミング（着地と同時）も抜けやすい。",
  },
  okExample: {
    say: "「dice roll を rAF 1本で。押下で 0.14s scale(1.14,.82) に溜め、離すと 0.52s で 360deg（power1.out）、前半42%で -14px・scale(.9,1.12)、残りで落下。目は 0.67×(k/5)^1.2 の時刻で5回替え、着地で確定して scale(1.24,.76)→1 を elastic 0.5s。reduced-motion は結果の差し替えのみ」",
    why: "溜め→回転→跳ね→入れ替わり→着地の順番と、それぞれの尺・形・イージングを数値で指定。目の入れ替わりを後ろほど延ばす式と「着地で確定」を書くことで、ルーレット的な等間隔の点滅ではなく、転がって止まるサイコロになる。",
  },
  vocab: [
    {
      term: "dice roll animation",
      desc: "サイコロを振って目が決まるまでの演出。英語圏では roll the dice / dice roller で通じ、ランダム選択ボタン（randomize / shuffle / surprise me）のアイコンによく使われる。",
    },
    {
      term: "anticipation（予備動作）",
      desc: "動く前に逆向きに少し縮める溜め。押している間だけ潰しておくと、離した瞬間の跳ねに勢いが乗る。",
    },
    {
      term: "decelerating shuffle",
      desc: "入れ替わりの間隔を後ろほど延ばすこと。等間隔だと機械の点滅、延ばすと転がりが落ち着いていく物理の手触りになる。",
    },
    {
      term: "elastic.out",
      desc: "目標値を行き過ぎて往復しながら収まる GSAP のイージング。2つ目の引数（period）が小さいほど細かく速く震える。",
    },
    {
      term: "aria-live",
      desc: "表示が変わったことを支援技術に知らせる属性。ランダムに引いた結果はここに出さないと、画面を見ていない人には何が出たか伝わらない。",
    },
  ],
  titleAct: {
    act: "squash-stretch",
    map: { squash: "squash", stretch: 12, recover: 0.5, overshoot: 8 },
  },
  aliases: ["コロコロ", "ころん", "サイコロ", "おまかせボタン", "ランダム"],
  related: ["prize-wheel", "squash-stretch", "number-roll"],
};
