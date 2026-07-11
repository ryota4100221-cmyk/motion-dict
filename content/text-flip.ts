import type { MotionEntry } from "@/lib/types";

export const textFlip: MotionEntry = {
  slug: "text-flip",
  category: "text",
  nameJa: "テキストフリップ",
  nameEn: "text flip / 3d text rotate",
  lede: "行が3D回転(rotateX)して次のテキストに入れ替わる見出し演出。word-rotate(マスクスライド)との違いは奥行きで、perspectiveとtransform-originの設計が仕上がりを決める。",
  params: [
    {
      key: "interval",
      label: "interval(表示間隔 s)",
      min: 1,
      max: 4,
      step: 0.1,
      default: 2.2,
      desc: "2s前後が読みやすい。回転が3Dで目を引くぶん、word-rotateより気持ち長めにとる。",
    },
    {
      key: "duration",
      label: "duration(回転時間 s)",
      min: 0.3,
      max: 1.2,
      step: 0.05,
      default: 0.6,
      desc: "0.5〜0.7sが自然。0.4s以下は回転していることが伝わらず、ただの切替に見える。",
    },
    {
      key: "perspective",
      label: "perspective(奥行き px)",
      min: 200,
      max: 1200,
      step: 50,
      default: 600,
      desc: "小さいほど遠近が強くパースが誇張される。600px前後が上品。200pxは魚眼のように歪む。",
    },
  ],
  promptTemplate: `見出しに text flip を実装してください。

- ["Design", "Develop", "Deliver"] のテキストを一定間隔で3D回転しながら入れ替える
- 親要素に perspective: {{perspective}}px を設定し、単語は同じ位置に絶対配置で重ねる
- 各単語を {{interval}}s 表示したら、現在の単語を rotateX(0)→rotateX(-90deg)(transform-origin: 50% 0)で上へ倒し、次の単語を rotateX(90deg)(transform-origin: 50% 100%)→rotateX(0) で下から起こす。両方 {{duration}}s の ease で同時に動かす
- 倒れる側は回転の後半で opacity を落とし、裏面が見える不自然さを消す(backface-visibility: hidden も併用)
- display切替やopacityフェードだけの実装にせず、transform(rotateX)で動かす。リフローさせない
- 最後の単語まで行ったら先頭に戻って無限ループ
- prefers-reduced-motion 時は回転を止め、最初の単語を固定表示する`,
  ngExample: {
    say: "「テキストがくるっと回って切り替わるようにして」",
    why: "「くるっと」が2Dのマスクスライドと解釈されてword-rotateもどきが返ってくるか、perspectiveなしのrotateXでただ潰れて消えるだけの平面的な実装になりがち。transform-origin未指定だと回転の軸もバラバラになる。",
  },
  okExample: {
    say: "「text flipを実装。perspective 600pxの親に単語を重ね、outはrotateX(-90deg)/origin 50% 0、inはrotateX(90deg)→0/origin 50% 100%を0.6s easeで同時に。表示2.2s・無限ループ、reduced-motion時は先頭固定」",
    why: "perspectiveの値と、in/outそれぞれの回転方向・transform-originまで指定している。originを上端・下端で使い分ける指示が、蓋がパタンと開閉するような立体感の正体。",
  },
  vocab: [
    {
      term: "perspective",
      desc: "3D変形の視点距離。親要素に設定する。値が小さいほど近くから見ることになり、遠近感が誇張される。",
    },
    {
      term: "transform-origin",
      desc: "回転の軸の位置。50% 0なら上端、50% 100%なら下端を軸に回る。in/outで使い分けると蝶番のような動きになる。",
    },
    {
      term: "backface-visibility",
      desc: "要素の裏面を見せるかどうか。hiddenにすると90度を超えて回った瞬間に消え、鏡文字がチラつかない。",
    },
    {
      term: "rotateX",
      desc: "横軸(X軸)まわりの回転。見出しの入れ替えではこの軸が定番。rotateYだと縦軸で観音開きのような動きになる。",
    },
  ],
  related: ["word-rotate", "text-slide-swap", "flip-card"],
};
