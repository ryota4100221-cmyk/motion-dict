import type { MotionEntry } from "@/lib/types";

export const crtPowerOff: MotionEntry = {
  slug: "crt-power-off",
  category: "transition",
  nameJa: "CRT電源オフ（一本の線につぶれて消える）",
  nameEn: "CRT power-off / TV turn-off effect / screen collapse",
  lede: "ブラウン管の電源を落としたときのように、画面が数回明滅してから横一本の輝いた線につぶれ、最後に点になって消える終わり方。フェードアウトと違って「電源が落ちた」という因果が画に出るので、モーダルやページを閉じる操作に強い意味を持たせられる。",
  params: [
    {
      key: "duration",
      label: "duration(消え切るまでの時間 s)",
      min: 0.3,
      max: 1.4,
      step: 0.02,
      default: 0.62,
      desc: "0.55〜0.75sが実機の感触に近い。0.4s以下だと線につぶれる過程が見えず単なる消滅になり、1sを超えると閉じる操作の待ち時間として長い。",
    },
    {
      key: "flash",
      label: "flash(つぶれる瞬間の輝度)",
      min: 1,
      max: 5,
      step: 0.1,
      default: 3.5,
      desc: "brightness()の倍率。3〜4倍で「残った電子が中央に集まって光る」ブラウン管らしさが出る。1に近いとただの縦つぶれ、5に近いと白飛びして形が読めない。",
    },
    {
      key: "line",
      label: "line(つぶれ切った線の高さ %)",
      min: 0.2,
      max: 6,
      step: 0.2,
      default: 0.6,
      desc: "元の高さに対する割合。0.4〜1%で「線」に見える。3%を超えると帯のままで、線につぶれた印象にならない。",
    },
    {
      key: "flicker",
      label: "flicker(つぶれる前の明滅回数)",
      min: 0,
      max: 4,
      step: 1,
      default: 2,
      desc: "電圧が落ちる前のちらつき。2回が定番。0にすると即座につぶれる素直な動きになり、4回は故障・障害の演出寄りになる。",
    },
  ],
  promptTemplate: `要素の消え方に CRT power-off(ブラウン管の電源オフ)を実装してください。

- 全体を {{duration}}s で消し切る。内訳は「明滅 → 縦につぶれる → 横につぶれて消える」の3段
- 明滅は brightness() を上下させるCSSアニメーションを steps() で刻み、animation-iteration-count を {{flicker}} にして回数で制御する(0回のときは明滅の段を飛ばす)
- 次に transform: scaleY() で高さを {{line}}% まで一気に潰し、同時に filter: brightness({{flash}}) まで持ち上げて、中央に横一本の輝いた線を残す。イージングは ease-in(最後に加速して潰れる)
- 潰れる要素の中に白い発光レイヤーを1枚重ね、潰れるのと同じ時間で opacity を上げる。暗い画面を scaleY で潰すだけでは「光る線」にならない
- 最後にその線を transform: scaleX() で同じ {{line}}% まで縮めて点にし、opacity 0 へ落とす
- transform-origin は center。height や width のアニメーションでは絶対に作らない(リフローが走り、周囲のレイアウトが動く)
- transform と filter と opacity 以外のプロパティは触らない。潰れる要素には will-change: transform を付ける
- 電源オンはこの逆再生(点 → 横一本の線 → 縦に開いて brightness が 1 に戻る)で、明滅は入れない
- prefers-reduced-motion 時は潰す動きと明滅を一切行わず、opacity のフェードだけで消す`,
  ngExample: {
    say: "「閉じるときに昔のテレビみたいに消して」",
    why: "「昔のテレビ」だけでは、走査線を重ねる質感演出と勘違いされたり、単なるフェードアウトに縮小を足しただけのものが返ってくる。つぶれ切る線の細さと輝度の跳ね上げが無いと、この動きは成立しない。",
  },
  okExample: {
    say: "「CRT power-offで閉じる。0.62sで、brightnessを2回明滅→scaleYで高さ0.6%まで潰しつつbrightness 3.5→scaleXで点にしてopacity 0。transform-origin center、transformのみでリフロー禁止、reduced-motionはフェードだけ」",
    why: "3段の順番・各段の手段(scaleY / scaleX / brightness)・潰し切る値まで指定している。「transformのみ」の一言で、heightを縮めて周囲のレイアウトを動かす実装を防げる。",
  },
  vocab: [
    {
      term: "scaleY",
      desc: "縦方向の拡縮。heightのアニメーションと違いレイアウト計算(リフロー)が走らないので、画面が線につぶれても周囲は動かない。",
    },
    {
      term: "filter: brightness()",
      desc: "要素の明るさの倍率。1が等倍で、それより大きくすると発光したように見える。つぶれる瞬間だけ跳ね上げるのがブラウン管らしさの正体。",
    },
    {
      term: "transform-origin",
      desc: "変形の基準点。centerでないと画面が上端や下端に吸い込まれ、中央に線が残るブラウン管の挙動にならない。",
    },
    {
      term: "animation-iteration-count",
      desc: "アニメーションの繰り返し回数。明滅のような「N回だけ」の演出は、keyframesを回数分書かずにこれで制御する。",
    },
    {
      term: "steps()",
      desc: "変化を指定回数のコマに刻むイージング。電源の明滅を滑らかに補間すると、途端に電気の挙動に見えなくなる。",
    },
  ],
  related: ["scanlines", "boot-sequence", "shutter-transition"],
};
