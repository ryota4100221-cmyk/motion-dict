import type { MotionEntry } from "@/lib/types";

export const pendulumSwing: MotionEntry = {
  slug: "pendulum-swing",
  category: "ui",
  nameJa: "振り子スイング（吊り下げの揺れ）",
  nameEn: "pendulum swing / swing animation / hanging sway",
  lede: "吊り下げたタグやバッジが上の吊り点を軸に振れ、往復ごとに振れ幅を落として止まる動き。肝は回転の中心を要素の中ではなく吊り点に置くことで、中心で回すとその場の首振りにしか見えない。",
  params: [
    {
      key: "angle",
      label: "angle(押された直後の振れ角 deg)",
      min: 2,
      max: 30,
      step: 1,
      default: 14,
      desc: "最初の一振りの最大角。タグや札は8〜15degが自然。常時揺らすなら1〜3degに抑える。25degを超えると吊り具から外れそうに見える。",
    },
    {
      key: "pivot",
      label: "pivot(吊り点までの距離 px)",
      min: 0,
      max: 60,
      step: 2,
      default: 18,
      desc: "要素の上辺から吊り点までの紐の長さ。transform-originのYをこの分だけマイナスにする。16〜24pxが実測の相場。0だと上辺が蝶番になり、吊り下げではなく扉のあおりに見える。",
    },
    {
      key: "period",
      label: "period(1往復の時間 s)",
      min: 0.6,
      max: 3.6,
      step: 0.1,
      default: 1.6,
      desc: "小物は1.2〜2sが自然。実物の振り子は紐が長いほど遅いので、pivotを伸ばしたら周期も伸ばす。1s未満だと揺れではなく震えに見える。",
    },
    {
      key: "damping",
      label: "damping(半往復ごとに残る振れ幅 %)",
      min: 30,
      max: 100,
      step: 5,
      default: 60,
      desc: "折り返すたびに振れ幅が何%残るか。55〜70%で3〜4往復して止まる。40%以下はすぐ止まり重たい物に、100%は減衰せず揺れ続ける常時スイングになる。",
    },
  ],
  promptTemplate: `吊り下げタグに pendulum swing(振り子の揺れ)を実装してください。

- 回転の中心は要素の中心ではなく上の吊り点に置く。transform-origin: 50% -{{pivot}}px(要素の上辺から {{pivot}}px 上)
- 紐と吊り穴は揺れる要素の内側に持たせ、要素と一緒に回す。吊り具(フック・レール)側は動かさない
- クリック・タップ・ホバーで押されたら、角度 θ(t) = {{angle}}deg × r^(t / 半周期) × sin(2πt / {{period}}s) で振らせる。r = {{damping}}%(半往復ごとに残る振れ幅)
- 押された側と反対へ振り出す(左から触れたら右へ)。揺れている最中に押されたら今の揺れに足し合わせ、角度を0に戻さない
- r が100%のときは減衰させず、±{{angle}}deg を animation-direction: alternate + ease-in-out で揺れ続けさせる。複数並べる場合は負の animation-delay で位相をずらす
- 振れ幅が0.05deg を切ったら rotate(0) に置いて止める
- transform: rotate だけで動かす(left/top やレイアウトプロパティは触らない)。requestAnimationFrame は1本にまとめる
- prefers-reduced-motion 時は揺らさず、吊り下がった静止状態のまま置く`,
  ngExample: {
    say: "「タグを吊り下げてる感じでゆらゆら揺らして」",
    why: "回転の中心が指定されないので、transform-origin: center のまま rotate されてタグがその場で首を振るだけになる。振れ幅も一定のまま延々と往復し、触れても何も起きないか、押した瞬間に角度が0へ飛ぶ実装が返ってくる。",
  },
  okExample: {
    say: "「pendulum swingで。transform-origin: 50% -18px(上の吊り点)を軸に rotate。押されたら14degで振り出し、周期1.6s、半往復ごとに振れ幅を60%へ減衰させて止める。紐は要素と一緒に回し、フックは動かさない。reduced-motionでは静止」",
    why: "軸の位置・振れ角・周期・減衰を全部数値で渡している。特に「吊り点を軸に」の一言が首振りと吊り下げを分け、「減衰させて止める」が揺れっぱなしで落ち着かない画面を防ぐ。",
  },
  vocab: [
    {
      term: "transform-origin(要素の外)",
      desc: "変形の基準点は要素の外にも置ける。50% -18px のようにマイナス値にすると、上辺より上の点を軸に弧を描いて振れる。",
    },
    {
      term: "減衰振動(damped oscillation)",
      desc: "往復するたびに振れ幅が一定の比率で小さくなる揺れ。比率を決めておくと「何往復で止まるか」が狙って作れる。",
    },
    {
      term: "振り子の周期",
      desc: "振り子は紐が長いほどゆっくり揺れる(周期は長さの平方根に比例)。吊り点を遠くしたのに周期が同じだと、軽すぎる物に見える。",
    },
    {
      term: "重ね合わせ",
      desc: "揺れている最中に押されたら、新しい揺れを今の揺れに足す。角度をリセットしないので、連続で押しても跳ねずに揺れが大きくなる。",
    },
  ],
  related: ["ambient-float", "error-shake", "spring-easing"],
};
