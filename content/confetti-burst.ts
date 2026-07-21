import type { MotionEntry } from "@/lib/types";

export const confettiBurst: MotionEntry = {
  slug: "confetti-burst",
  category: "ui",
  nameJa: "紙吹雪バースト",
  nameEn: "confetti burst / particle celebration",
  lede: "成功・完了・CTAの瞬間に、破片が一点から放射状に弾け飛ぶ祝祭フィードバック。「押したら報われた」という感情を一瞬で返すのが本質。各破片を transform で飛ばし opacity で消すだけで、リフローなしに実装できる。",
  params: [
    {
      key: "count",
      label: "count(破片の数)",
      min: 8,
      max: 48,
      step: 1,
      default: 24,
      desc: "一度に弾ける破片の数。20〜30が華やかで軽い。50近くまで増やすと「爆発」寄りになり、多すぎると安っぽく見える。",
    },
    {
      key: "spread",
      label: "spread(飛散半径 px)",
      min: 60,
      max: 260,
      step: 10,
      default: 150,
      desc: "破片が飛ぶ距離の目安。要素サイズの1〜1.5倍が自然。大きすぎると散漫に、小さすぎると団子状に見える。",
    },
    {
      key: "duration",
      label: "duration(持続 s)",
      min: 0.5,
      max: 2,
      step: 0.1,
      default: 1,
      desc: "弾けてから消え切るまでの時間。0.8〜1.2sが祝祭感と邪魔にならなさの両立点。2sを超えると余韻が長すぎる。",
    },
    {
      key: "gravity",
      label: "gravity(落下の強さ)",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.5,
      desc: "重力で下へ引かれる量。0は真の放射状、上げるほど「打ち上げて舞い落ちる」紙吹雪らしさが出る。0.4〜0.6が自然。",
    },
  ],
  promptTemplate: `ボタンのクリックで confetti burst(紙吹雪バースト)を実装してください。

- クリックで {{count}} 個の破片(小さな矩形)を要素中央から一度に生成する
- 各破片は角度をランダムに散らし、飛距離を {{spread}}px 前後でばらつかせる。飛び先の座標は破片ごとに CSS カスタムプロパティ(--dx / --dy)に入れておく
- 縦方向には gravity({{gravity}}、0〜1)に比例した落下量を --dy に足し込み、「打ち上げて舞い落ちる」弧を作る
- アニメーションは transform: translate(0,0)→translate(var(--dx),var(--dy)) と rotate を {{duration}}s の ease-out で動かし、後半で opacity を 0 へフェードさせる
- 位置は必ず transform で動かす(top/left や width/height を動かさない=リフロー禁止)
- 破片はアニメーション終了(animationend)を拾って DOM から削除する。連打されたら前の破片を消さず重ねて出す
- 色は数色を破片ごとに割り当てる。回転量も破片ごとにランダムにすると紙が舞う質感が出る
- prefers-reduced-motion 時は破片を飛ばさず、動きのない一瞬の opacity フェード(色のパルス)やラベル切替など、位置の動かないフィードバックに置き換える`,
  ngExample: {
    say: "「成功したら紙吹雪を出して」",
    why: "破片の数・飛距離・重力・持続が決まらない。top/left をアニメーションさせるリフロー実装や、生成しっぱなしで DOM が溜まり続ける実装、連打で前の紙吹雪が消える実装が返ってきがち。",
  },
  okExample: {
    say: "「confetti burst を中央から24個。角度ランダム・飛距離150px前後を --dx/--dy に入れ、gravity 0.5で落下量を加算。transformのtranslate+rotateを1s ease-out、後半でopacity 0、animationendでremove。連打は重ねる。reduced-motion時は動かさず色のパルスだけ」",
    why: "破片数・飛距離・重力・変形方式・後始末・多重発火・reduced-motion まで指定。「transformで動かしてanimationendで消す」の一言が、パフォーマンスと DOM リークの両方を防ぐ。",
  },
  vocab: [
    {
      term: "confetti / particle burst",
      desc: "一点から破片が放射状に弾ける祝祭アニメーション。英語圏では confetti(紙吹雪)や particle burst でそのまま通じる。",
    },
    {
      term: "放射状の飛散(radial spread)",
      desc: "破片ごとに角度と距離をばらつかせて全方向へ飛ばすこと。cos/sin で飛び先を出し --dx/--dy に格納するのが定石。",
    },
    {
      term: "gravity(擬似重力)",
      desc: "飛び先の縦成分に落下量を足して、上がって舞い落ちる弧を作るパラメータ。物理演算せずとも紙吹雪らしさが出る。",
    },
    {
      term: "後始末(cleanup)",
      desc: "飛び終えた破片を animationend で DOM から削除すること。連打で大量生成されるため、放置するとノードが溜まり続ける。",
    },
  ],
  related: ["ripple-tap", "press-feedback"],
};
