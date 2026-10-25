import type { MotionEntry } from "@/lib/types";

export const prizeWheel: MotionEntry = {
  slug: "prize-wheel",
  category: "ui",
  nameJa: "抽選ホイール（スピン・トゥ・ウィン）",
  nameEn: "prize wheel / spin to win / wheel of fortune / spin the wheel",
  lede: "押すと円盤が勢いよく回り、だんだん減速して針の下の1枠で止まる抽選演出。当たりは回す前に決めておき、止まる角度を逆算して回すのが要で、「回転数」と「減速の曲線」が期待感の長さを決める。",
  params: [
    {
      key: "turns",
      label: "turns(止まるまでの回転数)",
      min: 1,
      max: 8,
      step: 1,
      default: 2,
      desc: "当たりの枠に着く前に余分に回る周数。2周で軽いおまけ（atomato.co の実装値）、キャンペーンの主役なら5〜8周。1周だと結果が読めてしまい抽選に見えない。",
    },
    {
      key: "duration",
      label: "duration(回り始めから止まるまで s)",
      min: 1,
      max: 6,
      step: 0.1,
      default: 2.2,
      desc: "2〜3sで小気味よく、4〜6sで溜めが効く。回転数を増やすなら時間も伸ばす（同じ時間で周数だけ増やすと序盤が速すぎて残像になる）。",
    },
    {
      key: "segments",
      label: "segments(枠の数)",
      min: 4,
      max: 12,
      step: 1,
      default: 8,
      desc: "8枠が定番。12枠を超えるとラベルが読めず、減速の終盤で隣の枠との区別がつかなくなる。奇数にすると色の交互が1か所崩れるので、その枠だけ第3の色にする。",
    },
  ],
  promptTemplate: `抽選UIに prize wheel(spin to win)を実装してください。

- きっかけ: 「回す」ボタンをクリックするたびに1回抽選して回る。タッチはタップで同じ動作。止まったあとはそのままの角度で待ち、次のクリックでそこから回る
- 円盤は {{segments}} 枠の扇形を SVG の path で描き、針(ポインタ)は円盤の外の真上に固定する。回すのは円盤だけ
- 当たりの枠は回す前に決める(本番はサーバーの抽選結果を受け取る)。止まった角度から結果を読み取る実装にはしない
- 枠 i の中心を針の下へ持ってくる角度は -i × (360 / {{segments}})deg。いまの回転角から、そこへ {{turns}} 周以上回って着く最小の角度を計算して目標にする(毎回 0deg に戻さず、角度は累積させる)
- 円盤の transform: rotate() を {{duration}}s の cubic-bezier(0.12, 0.7, 0.18, 1) で目標角度へ動かす。序盤で一気に回り、終盤を長く引いて止まる強い減速カーブにする(linear や ease は使わない)
- transitionend で結果を確定し、当たり枠を強調して文言を出す。回っている間はボタンを aria-disabled にしてクリックを無視する(二重に回させない)
- 動かすのは円盤の transform だけ(ラベルを個別に回し直さない)
- 結果は aria-live="polite" で「FREE が当たりました」のように読み上げる
- prefers-reduced-motion 時は回転させず、円盤を当たりの角度に即時で置いて結果を表示する(抽選そのものは残す)`,
  ngExample: {
    say: "「ルーレットを回して、止まったところの景品を表示して」",
    why: "止まる場所を決めないまま一定速度で回し、setTimeout で急にピタッと止める実装や、ランダムな角度まで回してから「どの枠で止まったか」を逆算する実装が返りがち。後者は当選率をコントロールできず、枠の境目で止まると針がどちらを指しているかも曖昧になる。毎回 0deg へ巻き戻してから回すので、2回目の頭で円盤が逆回転するのもよくある。",
  },
  okExample: {
    say: "「prize wheel を。8枠、当たりは先に決め、目標角度を『-i×45deg ＋ 2周以上』で逆算。rotate を 2.2s cubic-bezier(0.12,0.7,0.18,1) で、角度は累積。回転中はクリック無視、transitionend で結果、reduced-motion は即時表示」",
    why: "当たりの決め方（先に決めて角度を逆算）と、回転数・時間・減速カーブ・角度の累積まで指定。「先に決めて逆算」の一言で、演出と抽選ロジックが分かれ、当選率をサーバー側で握れる実装が返ってくる。",
  },
  vocab: [
    {
      term: "prize wheel / spin to win",
      desc: "円盤を回して止まった枠の景品が当たる抽選UI。メール登録の見返りに出すポップアップ（spin-to-win popup）としてECで定番。wheel of fortune、spin the wheel とも呼ぶ。",
    },
    {
      term: "目標角度の逆算",
      desc: "結果を先に決め、その枠が針の下に来る角度へ回す設計。演出（回転）と抽選（確率）が分離でき、結果がサーバー側で決まっていても見た目は自然な抽選になる。",
    },
    {
      term: "減速カーブ（deceleration easing）",
      desc: "cubic-bezier の第2制御点を (0.18, 1) のように右上へ寄せ、終盤を長く引く曲線。物理的に摩擦で止まる見え方になり、「どこで止まるか」の溜めがここで生まれる。",
    },
    {
      term: "角度の累積",
      desc: "回転角を 0〜360 に正規化せず足し続けること。正規化して代入すると、transition が近い方向へ動こうとして逆回転したり、ほとんど回らなかったりする。",
    },
    {
      term: "transitionend",
      desc: "CSS の transition が終わったときに発火するイベント。結果表示とボタンの再有効化をここで行い、setTimeout で時間を二重管理しない。",
    },
  ],
  titleAct: { act: "prize-wheel" },
  aliases: ["ルーレット", "ぐるぐる", "ガラガラ", "抽選"],
  related: ["confetti-burst", "number-roll", "stateful-button", "radial-carousel"],
};
