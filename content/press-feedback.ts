import type { MotionEntry } from "@/lib/types";

export const pressFeedback: MotionEntry = {
  slug: "press-feedback",
  category: "ui",
  nameJa: "プレスフィードバック",
  nameEn: "press feedback / button press / active state",
  lede: "ボタンを押した瞬間に沈み込み、離すと戻る触覚的フィードバック。:activeにtranslateY+scaleを当てるだけだが、入りは0.05s級で瞬時に・戻りはやや遅く、という非対称設計にすると「押した感」が段違いになる。",
  params: [
    {
      key: "depth",
      label: "depth(沈み込み px)",
      min: 0,
      max: 6,
      step: 1,
      default: 2,
      desc: "押下時に下がる距離。1〜3pxで十分伝わる。5pxを超えると沈みすぎて安っぽくなる。",
    },
    {
      key: "scale",
      label: "scale(押下時の縮小)",
      min: 0.9,
      max: 1,
      step: 0.01,
      default: 0.97,
      desc: "0.95〜0.98が自然。0.9まで縮めるとモバイルゲーム的な誇張になる。",
    },
    {
      key: "release",
      label: "release(戻り時間 s)",
      min: 0.05,
      max: 0.6,
      step: 0.05,
      default: 0.2,
      desc: "指を離してから戻るまでの時間。0.15〜0.3sで復帰の余韻が出る。入り(0.05s)より必ず遅くする。",
    },
  ],
  promptTemplate: `ボタンに press feedback(押下時の沈み込み)を実装してください。

- :active(タッチも拾うならpointerdown/pointerup)で transform: translateY({{depth}}px) scale({{scale}}) を適用する
- 入りのtransitionは0.05s程度でほぼ瞬時に沈める(指の接触と同時に反応させる)
- 離したら {{release}}s の ease-out で元に戻す。入りより戻りを遅くする非対称設計とする
- box-shadowやmarginではなくtransformのみで動かす(リフロー禁止)
- モバイルでは -webkit-tap-highlight-color: transparent で標準ハイライトを消し、二重のフィードバックを避ける
- prefers-reduced-motion 時はtransformを使わず、背景色の即時変化のみで押下を伝える`,
  ngExample: {
    say: "「ボタンにクリック感を付けて」",
    why: ":hoverの装飾だけで押下の瞬間には何も起きない実装や、入りと戻りが同じdurationで「押した感」が出ない実装が返ってきがち。box-shadowをアニメーションさせる重い実装も多い。",
  },
  okExample: {
    say: "「:activeでtranslateY(2px) scale(0.97)。入り0.05sで瞬時、戻り0.2s ease-outの非対称。transformのみでリフロー禁止」",
    why: "沈む量・縮小率・in/outの時間差まで指定。「入りは瞬時、戻りは遅く」の非対称が触覚の説得力を作る。ここを言わないと対称な動きになる。",
  },
  vocab: [
    {
      term: ":active",
      desc: "マウス押下〜解放の間だけ当たる擬似クラス。押下フィードバックの基本フック。タッチでは反応が不安定な環境があるためpointerdownで補うと確実。",
    },
    {
      term: "非対称トランジション",
      desc: "入りと戻りでdurationを変える設計。押下は瞬時(0.05s級)、復帰はゆっくり(0.2s前後)にすると物理的に自然に感じる。",
    },
    {
      term: "tap highlight",
      desc: "モバイルブラウザ標準のタップ時ハイライト。自前のフィードバックと二重になるので -webkit-tap-highlight-color: transparent で消す。",
    },
    {
      term: "pointerdown / pointerup",
      desc: "マウス・タッチ・ペンを統一して扱えるイベント。押下フィードバックはclickではなくこの2つで駆動すると接触の瞬間に反応できる。",
    },
  ],
  related: ["ripple-tap", "toggle-switch", "lift-hover"],
};
