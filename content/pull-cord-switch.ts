import type { MotionEntry } from "@/lib/types";

export const pullCordSwitch: MotionEntry = {
  slug: "pull-cord-switch",
  category: "ui",
  nameJa: "引き紐スイッチ（紐を引いてカチッと切り替える）",
  nameEn: "pull cord switch / pull-chain light switch / pull string toggle",
  lede: "天井から垂れた紐を下へ引くと、決まった深さでカチッと照明（テーマ）が切り替わり、離すと紐が行き過ぎて跳ね戻り、根元から小さく揺れて収まる。トグルを「押す」ではなく「引く」に置き換えた物理メタファーで、切り替わる深さ・戻りの行き過ぎ・揺れの3つが揃うと本物の紐に見える。",
  params: [
    {
      key: "maxPull",
      label: "maxPull(引ける最大の深さ px)",
      min: 20,
      max: 90,
      step: 2,
      default: 46,
      desc: "指を下へ動かしても紐はここで止まる。40〜50pxが実測の相場。小さすぎると引いた手応えが無く、80pxを超えると紐が伸びるゴムに見える。",
    },
    {
      key: "threshold",
      label: "threshold(切り替わる深さ px)",
      min: 8,
      max: 80,
      step: 2,
      default: 26,
      desc: "ここまで引いた瞬間に1回だけ切り替える(離した時ではない)。maxPullの5〜6割が自然。maxPullより深くは引けないので、それ以上にすると切り替わらない(デモでは最大の深さに丸めている)。",
    },
    {
      key: "snapBack",
      label: "snapBack(離した後の戻り s)",
      min: 0.2,
      max: 1.2,
      step: 0.05,
      default: 0.5,
      desc: "離した紐が元の長さへ戻る時間。cubic-bezier(.3,1.9,.5,1)で上へ行き過ぎてから収まる。0.4〜0.6sが紐らしい。0.3s未満だと行き過ぎが見えず、ただ消える。",
    },
    {
      key: "swing",
      label: "swing(切り替えた後の揺れ deg)",
      min: 0,
      max: 12,
      step: 0.5,
      default: 5,
      desc: "切り替えた直後、紐が根元を軸に振れる最初の角度。以後 ×0.7・×0.4・×0.2 と逆向きに減って1.3sで止まる。4〜6degが自然。0で揺れなし、10degを超えると風に煽られて見える。",
    },
  ],
  promptTemplate: `天井から垂れた紐を引いて照明(ライト/ダーク)を切り替える pull cord switch を実装してください。

- きっかけ: 紐(button要素・紐の全長を当たり判定にする)を pointerdown でつかみ、下へドラッグした量で紐を引き下ろす。引いた深さが {{threshold}}px に達した瞬間に1回だけテーマを切り替え、pointerup / pointercancel で離すと戻る。ドラッグせずにクリック・Enter・Space したときは「素早く1回引いた」とみなし、紐を min(18px, {{maxPull}}px) 下げて130ms後に戻しつつ切り替える。何度でも引ける
- 引き下ろし量は max(0, min({{maxPull}}, 現在のclientY − 押した時のclientY)) px。紐の絵を transform: translateY(引き下ろし量) で動かす(top や height は動かさない)。ドラッグ中は transition を切って指に直結させる
- 切り替えの深さ {{threshold}}px が {{maxPull}}px より深い場合は {{maxPull}}px に丸める(引ききれずに切り替わらない、を防ぐ)
- 離したら translateY(0) へ {{snapBack}}s の cubic-bezier(.3, 1.9, .5, 1) で戻す。y2=1.9 の行き過ぎで、紐が一瞬上へ跳ねてから落ち着く
- 切り替えた瞬間、紐全体を上端(天井の根元)を軸に rotate で揺らす: 0 → {{swing}}deg(18%) → −0.7×{{swing}}deg(40%) → 0.4×{{swing}}deg(62%) → −0.2×{{swing}}deg(82%) → 0、全体 1.3s、各区間に cubic-bezier(.3, .6, .4, 1)。WAAPI で書くときは easing を各キーフレームに書く(オプションの easing は反復全体に掛かってしまう)。連続で引いたら最初から再生し直す
- 揺れ(rotate)と引き下ろし(translateY)は別の要素に分ける。同じ transform に書くと揺れの再生中に引けない
- まだ一度も引かれていない間は、すきま風のように紐を 7s 周期で小さく揺らす(55%まで静止 → 1.6deg → −1.1deg → 0.4deg → 0、ease-in-out)。マウスが乗ったら 4 → −3 → 1.6 → −0.8deg の揺れを1.2sで1回。一度引いたら待機の揺れは止める
- 照明の切り替えは画面の暗幕の opacity を 0.7s ease でフェードする(紐の動きとは別に、切り替えの瞬間から始める)
- 紐は touch-action: none にし、スマホの縦スワイプでページがスクロールしないようにする。setPointerCapture で指が紐から外れても追従させる
- role="switch" と aria-checked で現在の状態を伝える
- prefers-reduced-motion 時は戻りの transition・揺れ・待機の揺れをすべて無効にし、紐は引いた深さに直結して離せば即座に元へ。切り替え自体(暗幕)も即時に変える`,
  ngExample: {
    say: "「紐を引っ張ったらダークモードになるスイッチを作って」",
    why: "紐の絵を押すと切り替わるだけのクリックボタンか、離した瞬間に切り替える実装が返ってくる。どこまで引けば切り替わるか・引ける上限・離した後の跳ね返り・揺れが無いので、引いた手応えがなく「紐の形をしたボタン」にしか見えない。",
  },
  okExample: {
    say: "「pull cord switchで。pointerdownでつかみ、下へのドラッグ量を0〜46pxに制限してtranslateYで紐を下げ、26pxに達した瞬間に1回だけテーマを切り替える。離したら0.5sのcubic-bezier(.3,1.9,.5,1)で跳ね戻し、切り替え時は根元を軸に5→−3.5→2→−1degで1.3s揺らす。クリック/Enterは18px引いて戻す扱い。reduced-motionでは揺れと戻りの補間なし」",
    why: "切り替えのタイミング(離した時ではなく閾値に達した瞬間)・引ける上限・行き過ぎる戻りのベジェ・揺れの減衰列という「紐に見える4条件」を数値で渡している。揺れと引き下ろしを別要素に分ける指定があると、揺れの最中にも引ける。",
  },
  vocab: [
    {
      term: "pull cord / pull-chain switch",
      desc: "天井照明や扇風機の引き紐スイッチ。Webでは紐を引くとテーマや照明が切り替わるトグルとして使われる。",
    },
    {
      term: "しきい値(threshold)で発火",
      desc: "指を離した時ではなく、引いた深さが一定値を越えた瞬間に1回だけ切り替える。実物のカチッという手応えに合い、引いたまま暗転を見られる。",
    },
    {
      term: "オーバーシュートするベジェ",
      desc: "cubic-bezier の y を1より大きくすると(例 .3,1.9,.5,1)、終点を行き過ぎてから戻る。紐やバネの跳ね返りを1行で書ける。",
    },
    {
      term: "setPointerCapture",
      desc: "押した要素にその後のポインタイベントを送り続ける指定。細い紐から指が外れても引き続けられる。",
    },
    {
      term: "transform と個別プロパティ(rotate)",
      desc: "CSS の rotate / translate は transform と別々に効く。揺れを rotate、引き下ろしを transform に分けると、片方のアニメーションがもう片方を上書きしない。",
    },
  ],
  titleAct: { act: "pendulum-swing", map: { angle: "swing", period: 1.3, pivot: 40 } },
  aliases: ["カチッ", "ぐいっと引く", "ぷらぷら", "紐スイッチ", "電気の紐"],
  related: ["pendulum-swing", "toggle-switch", "theme-toggle-transition", "rubber-band"],
};
