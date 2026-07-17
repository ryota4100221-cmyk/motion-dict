import type { MotionEntry } from "@/lib/types";

export const splitFlap: MotionEntry = {
  slug: "split-flap",
  category: "text",
  nameJa: "スプリットフラップ",
  nameEn: "split-flap display / solari board",
  lede: "空港や駅の機械式パタパタ表示。各桁のフラップが上半分をパタンと倒しながら目標の文字まで1コマずつめくれていく。number-rollの縦回転とは別物で、前後方向のrotateXと「めくり回数」がこの動きの核。",
  params: [
    {
      key: "flip",
      label: "flip(1枚の反転 s)",
      min: 0.05,
      max: 0.4,
      step: 0.01,
      default: 0.14,
      desc: "1枚をパタンと倒す時間。0.1〜0.2sが本物のパタパタ感。速すぎると読めず、遅いと間延びする。",
    },
    {
      key: "stagger",
      label: "stagger(桁ごとの遅延 ms)",
      min: 0,
      max: 200,
      step: 10,
      default: 60,
      desc: "左端の桁から右へ順に走らせる開始遅延。0で一斉、60ms前後で「サーッ」と流れるカスケードになる。",
    },
    {
      key: "steps",
      label: "steps(1桁のめくり回数)",
      min: 1,
      max: 16,
      step: 1,
      default: 8,
      desc: "各桁が目標の文字に着くまで何枚めくるか。多いほどドラムの助走が長く、機械的な連打感が強まる。",
    },
  ],
  promptTemplate: `スプリットフラップ(パタパタ表示)を実装してください。

- 各桁を1つのセルにし、中央に水平のシーム(継ぎ目)を1本引く
- 文字が変わるとき、旧文字の上半分を transform-origin: bottom で rotateX(0→-90deg)に倒し、その下から新文字を見せる
- 1枚めくる時間は {{flip}}s、ease-inで手前に倒す
- 各桁は目標の文字に着くまで {{steps}} 回めくる(ドラムが1コマずつ進むイメージ)
- 左の桁から順に {{stagger}}ms ずつ開始を遅らせ、左から右へ流れるカスケードにする
- 文字は等幅(monospace)+ tabular-nums で桁幅を固定し、めくり中に幅がガタつかないようにする
- 回すのは transform(rotateX)だけ。height や top のアニメーションでリフローさせない
- prefers-reduced-motion 時はめくりを一切せず、最終文字を即座に差し替える`,
  ngExample: {
    say: "「文字がパタパタ切り替わる空港の掲示板みたいなやつ作って」",
    why: "「パタパタ」だけでは1枚の速度・桁ごとの遅延・めくり回数が決まらない。単なるopacityのクロスフェードや、桁が縦に転がるnumber-roll(オドメーター)が返ってくることも多い。",
  },
  okExample: {
    say: "「split-flap表示。各桁の上半分をrotateX(0→-90deg)で倒して新文字を出す。flip 0.14s、桁ごとに60msのstagger、目標まで8枚めくる。transformのみでリフロー禁止、reduced-motionは即時差し替え」",
    why: "めくりの機構(上半分をrotateX)・1枚の速度・桁の遅延・回数まで指定。number-rollとの違い(縦のtranslateYではなく前後のrotateX)を機構名で示せている。",
  },
  vocab: [
    {
      term: "split-flap / Solari board",
      desc: "空港・駅の機械式パタパタ表示。各セルのフラップが物理的にめくれて文字が変わる方式。イタリアSolari社の名から。",
    },
    {
      term: "rotateX",
      desc: "X軸まわりの3D回転。前後方向にパタンと倒れるのがsplit-flapの核。number-rollのtranslateY(縦スクロール)とは別物。",
    },
    {
      term: "transform-origin",
      desc: "フラップの回転軸。上半分を下端(中央のシーム)を軸に倒すことで「めくれる」動きになる。",
    },
    {
      term: "tabular-nums",
      desc: "数字を等幅で描く指定。桁のめくり中に幅が揺れて全体がガタつくのを防ぐ。",
    },
    {
      term: "cascade(桁ずらし)",
      desc: "桁ごとに開始を遅らせ、左から右へ順に反転させる演出。stagger値で流れの速さが決まる。",
    },
  ],
  related: ["number-roll", "flip-card", "word-rotate"],
};
