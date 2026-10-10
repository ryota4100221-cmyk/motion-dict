import type { MotionEntry } from "@/lib/types";

export const aiOrb: MotionEntry = {
  slug: "ai-orb",
  category: "ui",
  nameJa: "AIオーブ（待機・思考・発話の状態表現）",
  nameEn: "AI orb / voice assistant orb / agent state indicator (idle · thinking · speaking)",
  lede: "AIアシスタントのアイコンを、待機・思考中・発話中の3状態で同じ部品のまま演じ分けるアバター演出。周りの色環の回転速度と光の締まり、中の3点の動き（まばたき→波→音量バー）だけで「いま考えている」「いま答えている」が文字なしで伝わる。状態ごとに別の画像やスピナーへ差し替えないのが要点。",
  params: [
    {
      key: "idleSpin",
      label: "idleSpin(待機時に色環が1周する時間 s)",
      min: 3,
      max: 16,
      step: 0.5,
      default: 8,
      desc: "待機は8s前後のゆっくりが「起きているが邪魔しない」速さ。4s以下だと待機なのに急いて見え、思考中との差がつかなくなる。",
    },
    {
      key: "boost",
      label: "boost(発話時の加速倍率 ×)",
      min: 1.5,
      max: 6,
      step: 0.5,
      default: 4,
      desc: "発話中は待機の何倍速で回すか。思考中はその2/3倍に置く（4なら待機8s→思考3s→発話2s）。2倍未満だと状態が変わったことに気付かれない。",
    },
    {
      key: "barMax",
      label: "barMax(発話中の音量バーの最大高 px)",
      min: 8,
      max: 32,
      step: 1,
      default: 20,
      desc: "直径の2割前後が目安（96pxのオーブで20px）。3本は最大高を1 : 0.8 : 0.6に崩し、周期も0.32〜0.42sでずらすと同期せず声らしく揺れる。",
    },
    {
      key: "stateFade",
      label: "stateFade(状態の切り替えにかける時間 s)",
      min: 0,
      max: 1.2,
      step: 0.05,
      default: 0.6,
      desc: "光の濃さ・ぼかし・回転速度を次の状態へ寄せる時間。0.4〜0.6sが自然。0にすると思考→発話の瞬間に色環が跳ね、部品が入れ替わったように見える。",
    },
  ],
  promptTemplate: `AIアシスタントのアイコンを、待機(idle)・思考中(thinking)・発話中(speaking)の3状態で演じ分ける AI orb を実装してください。

- 構造は1つの部品のまま、data-state 属性を idle / thinking / speaking と書き換えて状態を切り替える(状態ごとに別の画像・スピナーへ差し替えない)
- 外周に conic-gradient の色環を置き、filter: blur で滲ませた後光にする。その上に不透明な円(本体)を重ね、中央に3つの点を並べる
- 色環の回転は @property で登録した --angle を回す。1周の時間は待機 {{idleSpin}}s、思考中は {{boost}}×2/3 倍速、発話中は {{boost}} 倍速にする
- 回転速度を状態で変えるとき animation-duration を書き換えない(進捗が比率で再計算されて角度が飛ぶ)。rAF で角速度を毎フレーム積分し、速度そのものを {{stateFade}}s かけて目標へ寄せる
- 後光の濃さとぼかしは 待機 opacity 0.5 / blur 7px、思考 0.75 / 5px、発話 0.85 / 4px(直径48px基準。大きくするならぼかしも比例させる)とし、{{stateFade}}s の transition でつなぐ。わずかな呼吸(scale)と漂い(translate 数px)も状態が上がるほど速くする。inset や width ではなく transform で動かす
- 中央の3点は、待機では2.8s周期で0.4sずつずらしてまばたき(opacity と scale)、思考中は1.4s周期・0.18sずらしで上下に波打たせ、発話中は角丸の縦棒に変形して高さを {{barMax}}px × 1 / 0.8 / 0.6 の範囲で往復させる。3本の周期は0.32〜0.42sでばらし、同期させない
- 状態は実処理に結び付ける: 送信した瞬間に thinking、最初のトークンが届いた瞬間に speaking、応答完了・失敗時は必ず idle に戻す(finally で戻し、思考中のまま固まらせない)
- 部品自体は aria-hidden にし、状態の変化は近くの視覚的に隠したテキスト(aria-live="polite")で「考えています」「回答中」と伝える
- prefers-reduced-motion 時は回転・呼吸・点の動きをすべて止め、後光の濃さと点の形(点 / 3本の棒)の静的な違いだけで状態を示す`,
  ngExample: {
    say: "「AIのアイコンを、考え中と話し中で動きを変えて」",
    why: "思考中はスピナー、発話中は別のGIFへ差し替える実装が返ってきがち。部品が入れ替わるたびに位置と形が跳ね、同じアシスタントに見えない。速度を変える場合も animation-duration を書き換えるだけなので、切り替えの瞬間に色環の角度が飛ぶ。応答失敗時に idle へ戻す処理も抜けやすい。",
  },
  okExample: {
    say: "「AI orbで。1つの部品をdata-stateで切り替え。conic-gradientの後光を待機8s/周、思考は3s、発話は2sで回し、速度はrAFで積分して0.6sで寄せる。後光はopacity 0.5→0.75→0.85・blur 7→5→4px。中の3点は待機でまばたき、思考で波、発話で高さ20pxまでの不揃いな音量バー。送信でthinking、初トークンでspeaking、finallyでidle。reduced-motionでは静止して濃さと形だけで区別」",
    why: "3状態それぞれの回転周期・光の濃さ・点の動きを数値で渡し、切り替えの作法(速度の積分と寄せ時間)と、状態を実処理のどこで変えるかまで指定している。同じ部品のまま「テンポ」だけが上がっていくので、文字を読まなくても状態の変化が追える。",
  },
  vocab: [
    {
      term: "状態駆動アニメーション(state-driven animation)",
      desc: "アプリの状態(idle / thinking / speaking など)を属性1つに持たせ、CSS側でその値ごとに動きを定義するやり方。表示ロジックと演出が分離でき、状態の追加も楽になる。",
    },
    {
      term: "@property",
      desc: "CSSカスタムプロパティに型(<angle> など)を登録する構文。登録すると --angle を keyframes や transition で補間でき、conic-gradient の開始角を滑らかに回せる。",
    },
    {
      term: "角速度の積分",
      desc: "毎フレーム「角度 += 速度 × 経過時間」で角度を進めること。速度だけを目標へ寄せれば、回転を止めずに加速・減速でき、角度が飛ばない。",
    },
    {
      term: "後光(halo)",
      desc: "本体の背後に置いてぼかした色の輪。濃さ・ぼかし・回転速度の3つが、そのまま状態の「熱量」の表現になる。",
    },
  ],
  related: ["chat-sequence", "dots-pulse", "equalizer-bars", "gradient-border", "breathing-glow"],
};
