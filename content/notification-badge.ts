import type { MotionEntry } from "@/lib/types";

export const notificationBadge: MotionEntry = {
  slug: "notification-badge",
  category: "ui",
  nameJa: "通知バッジ（未読の点がポンと付いて、開くと縮んで消える）",
  nameEn: "notification badge / unread badge / notification dot",
  lede: "ベルやアイコンの角に、未読があることを知らせる小さな点(または件数)が付く演出。点はアイコンの内側からわずかに滑り出しながら 0 から少し大きめまで膨らんで落ち着き、しばらくして静かに明滅を始める。開いて既読にすると一瞬で縮んで消える。肝は「出るときは弾ませて気付かせ、居座るあいだは控えめに、消えるときは速く」の3段を分けること。",
  params: [
    {
      key: "duration",
      label: "duration(点が膨らむ時間 s)",
      min: 0.15,
      max: 1,
      step: 0.01,
      default: 0.5,
      desc: "点が 0 から膨らんで落ち着くまでの時間。0.4〜0.6sが目に留まりつつ待たせない(観察元は0.5s)。0.25s未満だと弾みが見えず、ただ現れたように見える。",
    },
    {
      key: "overshoot",
      label: "overshoot(行き過ぎの強さ)",
      min: 1,
      max: 2.4,
      step: 0.02,
      default: 1.56,
      desc: "ease-out-back の cubic-bezier(.34, ここ, .64, 1) の2つ目のY値。1.56で約1.1倍まで行き過ぎて戻る(観察元)。1で弾みなし、2を超えると1.2倍を超えて「跳ねる」印象になり、通知が多い画面ではうるさい。",
    },
    {
      key: "offset",
      label: "offset(滑り出す距離 px)",
      min: 0,
      max: 24,
      step: 1,
      default: 14,
      desc: "点がアイコンの中心側(左下)から角の定位置まで滑る距離。観察元は (-8px, 12px) ＝約14pxを0.26sで。0なら真上で膨らむだけ。20pxを超えると「どこかから飛んできた」に見えて、アイコンから生えた感じが消える。",
    },
    {
      key: "style",
      label: "style(バッジの中身)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["dot", "count"],
      desc: "dotは直径8pxの点だけ(観察元。件数はパネル側に出す)。countは件数入りの丸で、新着が増えるたびに1→1.2→1倍で小さく弾ませる。件数を見せたいならcount、アイコンが小さい・件数に意味が無いならdot。",
    },
  ],
  promptTemplate: `ヘッダーのベルアイコンに notification badge(未読バッジ)を実装してください。

- きっかけ: 新着通知が届いたとき(未読が0→1)にバッジが出て、以降の着信では件数だけ弾む。ベルのボタンをクリック(タッチはタップ)すると既読になって消える
- 未読が1件以上あるときだけ、ベルの右上の角(上と右に4pxはみ出す位置)にバッジを出す。中身は {{style}}。dot なら直径8pxの点、count なら高さ18px・最小幅18pxの角丸に件数を入れる(99件を超えたら「99+」)
- 点の色はアクセント色、周りに背景色で2pxの輪(box-shadow: 0 0 0 2px 背景色)を付けてアイコンの線と離す
- 出るとき: バッジを hidden から外し、1回リフローさせてから(要素の offsetWidth を読む)開いた状態の属性に切り替えて transition を走らせる
  - 位置はアイコンの中心側(左下)へ {{offset}}px ずらした所(向きは x:y = -0.55:0.83)から translate 0 へ 0.26s cubic-bezier(.22, 1, .36, 1)(アイコンの中心側から角へ滑り出る)
  - 点は transform: scale(0) → scale(1) を {{duration}}s cubic-bezier(.34, {{overshoot}}, .64, 1) で(1を少し超えて戻る)。同時に filter: blur(2px) → blur(0) も同じ時間・同じイージングで。opacity 0 → 1 は同じイージングで {{duration}}s の0.8倍
- 出てから1.2s後に opacity 1 ↔ 0.35 を2s周期(cubic-bezier(.5, 1, .89, 1)・infinite)でゆっくり明滅させ続ける(気付かせたあとは控えめに居座る)
- count のとき、表示中に件数が増えたらバッジを scale 1 → 1.2(45%地点) → 1 を {{duration}}s の0.6倍・出るときと同じ cubic-bezier(.34, {{overshoot}}, .64, 1) で弾ませる(出し直さない)
- 消えるとき: パネルを開いた・既読にした時点で、scale(0)・opacity 0・blur(2px) へ 0.18s cubic-bezier(.45, 0, .55, 1) で縮め、0.2s後に hidden に戻す(出るより速く)
- 動かすのは transform / opacity / filter だけ(width・top・right を動かさない)
- ベルのボタンの aria-label に「通知(未読3件)」のように件数を含め、点そのものは aria-hidden にする
- prefers-reduced-motion 時は滑り出し・行き過ぎ・明滅をすべて無くし、点を即時に表示/非表示する`,
  ngExample: {
    say: "「未読があるときベルに赤い点を出して、アニメーションも付けて」",
    why: "fadeIn で0.3sかけて点が現れるだけ、か、点が無限に scale で脈打ち続ける実装が返ってきやすい。前者は小さすぎて気付かれず、後者は既読にするまで画面の端で動き続けて本文を読む邪魔になる。消えるときの動きは指定しないと付かず、パネルを開いた瞬間に点がパッと消えて「押して消えた」のつながりが切れる。right や width を動かす実装も普通に返ってくる。",
  },
  okExample: {
    say: "「notification badgeを。未読があればベル右上に8pxの点、周りに背景色の2px輪。出るときは中心側から(-8,12)px→0を0.26s ease-out-quint、点はscale 0→1・blur 2px→0を0.5s cubic-bezier(.34,1.56,.64,1)で行き過ぎさせる。1.2s後からopacity 1↔0.35を2s周期。開いたら0.18sで縮めて消す。aria-labelに件数、reduced-motionでは即時表示」",
    why: "出る・居座る・消えるの3段それぞれに時間とイージングを与えている。「行き過ぎ(ease-out-back)」で一瞬だけ目を引き、「1.2s後から控えめに明滅」で居座りの主張を下げ、「消えるのは0.18s」で操作への返事を速くする。輪の指定が無いと点がアイコンの線に溶けて見えない。",
  },
  vocab: [
    {
      term: "通知バッジ(notification badge)",
      desc: "アイコンの角に重ねる、未読や件数を示す小さな印。点だけのものを notification dot、件数入りを count badge と呼び分ける。",
    },
    {
      term: "ease-out-back(オーバーシュート)",
      desc: "目標値を少し行き過ぎてから戻るイージング。cubic-bezier の2つ目のY値が1を超えると行き過ぎる。小さな要素の出現に使うと、短い時間でも「ポン」と目に留まる。",
    },
    {
      term: "アイドル明滅(idle pulse)",
      desc: "出現の演出が終わったあとに、ごく弱く繰り返す動き。注意を引き続けるのではなく「まだ在る」と知らせる程度に、開始を遅らせ・振れ幅を小さく・周期を長くする。",
    },
    {
      term: "強制リフロー(forced reflow)",
      desc: "display:none(hidden)から出した直後に offsetWidth などを読み、ブラウザに一度レイアウトを確定させること。これを挟まないと「消えている状態」が描画されず、transition が走らずにいきなり最終状態が出る。",
    },
    {
      term: "既読化(mark as read)",
      desc: "パネルを開く・一覧を見るなど、ユーザーが通知を見たとみなす操作でバッジを消すこと。どの操作で既読にするかを決めておかないと、点がいつまでも消えないか、見る前に消える。",
    },
  ],
  related: ["pulse-ring", "breathing-glow", "toast-slide", "like-burst"],
};
