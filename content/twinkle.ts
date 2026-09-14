import type { MotionEntry } from "@/lib/types";

export const twinkle: MotionEntry = {
  slug: "twinkle",
  category: "media",
  nameJa: "トゥインクル（星のまたたき）",
  nameEn: "twinkle / twinkling stars / starfield twinkle / shooting star",
  lede: "小さな光点を明滅と拡縮で呼吸させ、夜空や「AIのきらめき」を背景に置く常時ループ。効くのは動きそのものより周期のばらつきで、全点が同じ周期だと一斉に点滅する電飾になり、±20〜30%ずらすだけで本物の星空に変わる。",
  params: [
    {
      key: "count",
      label: "count(星の数)",
      min: 20,
      max: 160,
      step: 10,
      default: 80,
      desc: "ヒーロー1枚分で60〜100個が目安。多すぎると粒子ノイズに見え、20個台だと「星」ではなく「点」になる。",
    },
    {
      key: "duration",
      label: "duration(明滅1周の基準時間 s)",
      min: 0.8,
      max: 4,
      step: 0.1,
      default: 1.9,
      desc: "1.5〜2.5sが星らしい。1sを切るとチカチカして警告灯に近づき、3sを超えると呼吸のような穏やかさになる。",
    },
    {
      key: "jitter",
      label: "jitter(周期のばらつき ±%)",
      min: 0,
      max: 60,
      step: 5,
      default: 25,
      desc: "星ごとに周期を基準から±何%ずらすか。20〜30%で自然に散る。0にすると全点が同期し、電飾の一斉点滅になる。",
    },
    {
      key: "shootEvery",
      label: "shootEvery(流れ星の間隔 s)",
      min: 0,
      max: 20,
      step: 1,
      default: 9,
      desc: "流れ星が1回走る周期。8〜15sに1回なら「たまに気づく」ご褒美になる。0で流れ星なし。5s未満は騒がしい。",
    },
  ],
  promptTemplate: `背景に twinkling stars(星のまたたき)を実装してください。

- 星は 1〜4px の丸い要素(border-radius: 50%)を {{count}} 個、背景レイヤーにランダム配置する。位置と大きさはシード付き乱数で固定し、描画のたびに変えない
- 各星に box-shadow: 0 0 (サイズ×2)px の白い光を付け、大きい星ほど光を広げる
- 明滅は @keyframes 1本で共有する: 0%,100% { opacity: 0.15; transform: scale(0.6) } 50% { opacity: 1; transform: scale(1.4) }、ease-in-out・infinite
- 周期は星ごとに {{duration}}s を基準に ±{{jitter}}% ずらした値を animation-duration へ個別に入れる。さらに animation-delay に負の値(周期×0〜1)を入れて、初回表示から位相をばらす(ここを揃えると全点が同時に点滅する)
- 流れ星は細い線(幅80〜100px・高さ1px、進行方向へ向けた linear-gradient で尾を透明にする)を rotate(-35deg) で傾け、translate で斜め上へ走らせる。{{shootEvery}}s 周期のうち最初の1s前後だけ走らせ、残りは opacity: 0 で待機する(0 のときは流れ星を置かない)
- 動かすのは opacity と transform のみ。box-shadow の値や width/height をアニメーションしない(星の数だけ再描画が重なる)
- 星のレイヤーは pointer-events: none・aria-hidden にし、本文の操作や読み上げを邪魔しない
- prefers-reduced-motion 時は明滅も流れ星も止め、星を opacity 0.3〜0.9 のばらつきで静止表示する`,
  ngExample: {
    say: "「背景に星がキラキラする感じを入れて」",
    why: "全部の星に同じ animation を当てただけの実装が返り、全点が同じ瞬間に明るくなって電飾のように一斉点滅する。box-shadow をアニメーションする重い実装や、canvas で毎フレーム全星を描き直す実装になることも多い。",
  },
  okExample: {
    say: "「twinkling starsを実装。1〜4pxの星80個を固定乱数で配置、opacity 0.15→1とscale 0.6→1.4のkeyframes共有、周期1.9s±25%を星ごとに振って負のdelayで位相をばらす。流れ星は9sに1回。opacity/transformのみ、reduced-motionは静止」",
    why: "keyframes は共有しつつ周期と位相だけを個体ごとにずらす、という「自然に見える理由」を指定している。数・基準周期・ばらつき・流れ星の頻度が数値で揃うので、電飾にも騒がしい背景にもならない。",
  },
  vocab: [
    {
      term: "animation-delay(負の値)",
      desc: "負のdelayは「その秒数だけ再生済みの状態」から始める指定。待ち時間なしで各星の位相を最初からばらせる。",
    },
    {
      term: "周期のばらつき(jitter)",
      desc: "要素ごとに周期を少しずつ変えること。周期がずれ続けるので同期が起きず、ループの継ぎ目も見えなくなる。",
    },
    {
      term: "シード付き乱数",
      desc: "同じ種から毎回同じ乱数列を出す方式。星の配置を再描画やSSRとクライアントでぶらさないために使う。",
    },
    {
      term: "流れ星(shooting star)",
      desc: "長い周期の大半を待機に使い、一瞬だけ走らせる演出。頻度を下げるほど「見つけた」感が出る。",
    },
  ],
  related: ["ambient-float", "god-rays", "grain-overlay"],
};
