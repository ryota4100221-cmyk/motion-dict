import type { MotionEntry } from "@/lib/types";

export const directionalHover: MotionEntry = {
  slug: "directional-hover",
  category: "hover",
  nameJa: "方向連動ホバー",
  nameEn: "directional-aware hover",
  lede: "カーソルが入った辺から塗り(オーバーレイ)が流れ込み、出た辺へ引いていくホバー。上下左右どの辺から入ったかを判定するのが肝で、固定方向のフィルより「触った感」が段違いに出る。カード・ナビ・CTAで定番。",
  params: [
    {
      key: "duration",
      label: "duration(流れ込む時間 s)",
      min: 0.2,
      max: 0.7,
      step: 0.05,
      default: 0.4,
      desc: "0.35〜0.45sが自然。速いほどキレが出るが、0.25sを切ると方向が読み取れなくなる。",
    },
    {
      key: "leaveMode",
      label: "leaveMode(離脱時の引き方)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["出た辺へ引く", "入った辺へ戻す"],
      desc: "マウスが離れたとき塗りをどこへ逃がすか。「出た辺へ引く」が最も自然で、動きに一貫性が出る。",
    },
  ],
  promptTemplate: `カード/ボタンに directional-aware hover(方向連動ホバー)を実装してください。

- 要素を position: relative + overflow: hidden にし、内側に塗り用オーバーレイ(::before か子要素)を敷く
- mouseenter で getBoundingClientRect からカーソルと上下左右4辺の距離を求め、最も近い辺を「入った辺」とする
- 入った辺の外側にオーバーレイを translate で退避させてから、transform: translate(0,0) へ {{duration}}s の ease-out で流し込む
- mouseleave 時は leaveMode={{leaveMode}} に従う(出た辺へ引く / 入った辺へ戻す)。同じ {{duration}}s で退避方向へ translate する
- 動かすのは transform のみ(top/left や width ではなくtranslateXYで、リフローさせない)
- テキストは z-index でオーバーレイより上に置き、必要なら mix-blend-mode: difference で塗りに対して自動反転させる
- タッチデバイスでは辺判定ができないので、tap で中央からのフェードにフォールバックする
- prefers-reduced-motion 時はスライドを無効化し、色の即時切り替え(または薄い定常オーバーレイ)にする`,
  ngExample: {
    say: "「ホバーでカードに色がスッと入るようにして」",
    why: "「スッと」では方向が決まらない。transform-origin固定のフィルや background-color の単純transitionが返り、どこから触っても同じ動きになって“方向連動”の気持ちよさが消える。",
  },
  okExample: {
    say: "「directional-aware hoverを実装。mouseenterでrectから最も近い辺を判定し、その辺の外へ退避させたオーバーレイをtranslateで0へ0.4s ease-out。leaveは出た辺へ引く。transformのみでリフロー禁止、テキストはdifferenceで反転」",
    why: "辺判定のロジック・退避と流し込みの方式・離脱方向・パフォーマンス制約まで指定。「最も近い辺」の一語で固定方向フィルとの差(=この技法の本体)が確定する。",
  },
  vocab: [
    {
      term: "directional-aware",
      desc: "カーソルの進入方向を検知して動きの向きを変える考え方。Codropsの古典デモで広まった呼び名。",
    },
    {
      term: "getBoundingClientRect",
      desc: "要素の画面上の矩形(位置とサイズ)を返すAPI。カーソル座標との差から4辺のどれに近いかを算出する。",
    },
    {
      term: "オーバーレイ退避",
      desc: "塗りレイヤーを入った辺の外にtranslateで一旦逃がしておくこと。そこから0へ動かすと「その辺から流れ込む」ように見える。",
    },
    {
      term: "mix-blend-mode: difference",
      desc: "塗りの色に応じて前面テキストの色を自動反転させる合成モード。文字色の手動切替を省ける。",
    },
  ],
  related: ["fill-hover", "underline-reveal", "spotlight-hover"],
};
