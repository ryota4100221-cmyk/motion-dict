import type { MotionEntry } from "@/lib/types";

export const equalizerBars: MotionEntry = {
  slug: "equalizer-bars",
  category: "ui",
  nameJa: "イコライザーバー",
  nameEn: "equalizer bars / audio visualizer bars",
  lede: "上下する数本の縦バーだけで「いま音が鳴っている」を伝える状態インジケーター。実際の音量を解析しなくても、動いていること自体が再生中の合図になるのでCSSアニメーションだけで成立する。dots-pulse(入力中の3点)と違い、止まった状態が「停止中」という意味を持つ。",
  params: [
    {
      key: "bars",
      label: "bars(バーの本数)",
      min: 3,
      max: 12,
      step: 1,
      default: 5,
      desc: "5〜7本が定番。3本だと記号的になり、10本を超えると隣のラベルより主張してしまう。",
    },
    {
      key: "speed",
      label: "speed(基準の周期 ms)",
      min: 100,
      max: 600,
      step: 20,
      default: 220,
      desc: "1本が下端から上端まで動く時間。180〜260msで音楽のノリに見える。400msを超えると呼吸のような落ち着いた印象。",
    },
    {
      key: "spread",
      label: "spread(本ごとの周期差 %)",
      min: 0,
      max: 60,
      step: 5,
      default: 25,
      desc: "0にすると全本が揃って上下し「音」ではなく「点滅」に見える。20〜35%でほどよくバラける。",
    },
    {
      key: "floor",
      label: "floor(最低の高さ %)",
      min: 0,
      max: 60,
      step: 5,
      default: 15,
      desc: "下端でも残す高さ。0だとバーが消えて本数が読めなくなる。10〜20%が下限の目安。",
    },
  ],
  promptTemplate: `再生中インジケーターに equalizer bars(音量バー)を実装してください。

- 同じ高さの縦バーを {{bars}} 本、flexの下端揃え(align-items: flex-end)で並べる
- 各バーの中身は transform: scaleY() で伸縮させる。transform-origin: bottom を指定し、heightのアニメーションは使わない(毎フレームのレイアウト再計算を避ける)
- アニメーションは \`animation: eq <周期> linear infinite alternate\` の1本だけにする。基準の周期は {{speed}}ms
- 本ごとに周期を基準から最大 {{spread}}% ずらす。全本が同じ周期だと揃って点滅して見えるので必ずずらす
- 下端でも高さを {{floor}}% 残し、0にはしない
- 停止時は animation を外し、全バーを {{floor}}% の高さで静止させる
- バーは装飾なので aria-hidden にし、再生状態は再生ボタン側の aria-pressed / ラベルで伝える
- prefers-reduced-motion 時はアニメーションを止め、各バーを高さ違いのまま静止表示する(再生中であることは文字やアイコンで示す)`,
  ngExample: {
    say: "「音楽が鳴ってる感じのバーのアニメーション付けて」",
    why: "本数も速さも決まらないうえ、全本を同じ周期で動かす実装が返ってきやすい。揃って上下すると音ではなく点滅に見える。heightを直接アニメーションさせてカクつく実装や、停止時の見た目が未定義のままになるのもよくある。",
  },
  okExample: {
    say: "「equalizer barsを5本、scaleY + transform-origin: bottomで実装。基準220ms・linear・infinite alternate、本ごとに周期を最大25%ずらす。下限は15%残し、停止時はanimationを外して15%で静止。バーはaria-hidden」",
    why: "本数・周期・ばらつき・下限・停止時の状態まで数値で決まっている。「heightではなくscaleY」の一言がカクつきを防ぎ、aria-hiddenの指定でスクリーンリーダーに無意味な読み上げが流れるのも防げる。",
  },
  vocab: [
    {
      term: "animation-direction: alternate",
      desc: "往路の次に復路を再生する指定。上がって下がるだけの動きならkeyframesはfrom/toの2つで足りる。",
    },
    {
      term: "scaleY",
      desc: "縦方向の拡縮。heightのアニメーションと違いレイアウト計算が走らないので、細いバーを何本も同時に動かしても軽い。",
    },
    {
      term: "transform-origin: bottom",
      desc: "変形の基準点。バーは下端を固定して伸ばすのでbottomを指定する。既定のcenterのままだと上下に同時に伸びて棒グラフに見えない。",
    },
    {
      term: "周期の非同期化(desync)",
      desc: "本ごとに周期をずらして全体が同じ瞬間に揃わないようにすること。揃うと「音」ではなく「点滅」に見える。",
    },
  ],
  related: ["dots-pulse", "pulse-ring", "toggle-switch"],
};
