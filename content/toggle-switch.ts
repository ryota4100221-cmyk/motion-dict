import type { MotionEntry } from "@/lib/types";

export const toggleSwitch: MotionEntry = {
  slug: "toggle-switch",
  category: "ui",
  nameJa: "トグルスイッチ",
  nameEn: "toggle switch / animated switch",
  lede: "ノブが滑って状態が切り替わるON/OFFスイッチ。ノブの移動とトラックの色遷移を同じdurationで同期させると「1つの動き」に見える。ease-outが基本、好みで軽いオーバーシュートを足すと気持ちよさが出る。",
  params: [
    {
      key: "duration",
      label: "duration(切替時間 s)",
      min: 0.1,
      max: 0.8,
      step: 0.05,
      default: 0.25,
      desc: "切り替えにかける時間。0.2〜0.3sが快適。0.5sを超えると操作への反応が鈍く感じる。",
    },
    {
      key: "overshoot",
      label: "overshoot(行き過ぎ)",
      min: 0,
      max: 1,
      step: 1,
      default: 1,
      options: ["なし(ease-out)", "あり(back ease)"],
      desc: "ノブが目標を一度通り過ぎて戻る味付け。cubic-bezier(0.34, 1.56, 0.64, 1)相当。",
    },
  ],
  promptTemplate: `アニメーション付きの toggle switch を実装してください。

- ノブ(thumb)は transform: translateX() で移動させる。leftやmarginをアニメーションさせない(リフロー禁止)
- 切り替え時間は {{duration}}s。イージングは {{overshoot}} とする。「あり(back ease)」なら cubic-bezier(0.34, 1.56, 0.64, 1) のように1.0を超えて戻る曲線、「なし(ease-out)」なら cubic-bezier(0.22, 1, 0.36, 1)
- トラックの背景色もノブと同じ {{duration}}s で遷移させ、移動と色を1つの動きとして同期させる(色はease-outでよい)
- role="switch" と aria-checked を付け、クリック領域はスイッチ全体に広げてタップでも操作できるようにする
- prefers-reduced-motion 時はアニメーションなしで即時切り替えにする`,
  ngExample: {
    say: "「スイッチをいい感じに動かして」",
    why: "ノブだけ動いて色が瞬時に切り替わる「バラバラな動き」が返ってきがち。leftをアニメーションさせるリフロー実装や、durationが長すぎて操作が鈍く感じる実装も多い。",
  },
  okExample: {
    say: "「トグルのノブをtranslateXで0.25s、cubic-bezier(0.34, 1.56, 0.64, 1)。トラック色も同じ0.25sで遷移させて同期。leftは動かさない」",
    why: "移動方式・時間・イージング関数・色との同期まで指定。「同じdurationで」の一言で移動と色が1つの動きにまとまる。",
  },
  vocab: [
    {
      term: "overshoot / back ease",
      desc: "目標を一度通り過ぎてから戻るイージング。物理的な勢いを感じさせる。CSSでは制御点が1.0を超えるcubic-bezierで作る。",
    },
    {
      term: "knob / thumb",
      desc: "スイッチの丸いつまみ部分。英語圏の実装ではthumbが最も通じる。",
    },
    {
      term: "track",
      desc: "ノブが走る溝(背景)部分。ON色⇄OFF色の遷移を担い、状態を色でも伝える。",
    },
    {
      term: "同期(sync)",
      desc: "複数プロパティを同じduration・タイミングで動かし、1つの動きとして知覚させること。",
    },
  ],
  related: ["ripple-tap", "fill-hover"],
};
