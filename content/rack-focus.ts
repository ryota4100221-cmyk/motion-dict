import type { MotionEntry } from "@/lib/types";

export const rackFocus: MotionEntry = {
  slug: "rack-focus",
  category: "media",
  nameJa: "ピント送り",
  nameEn: "rack focus / focus pull",
  lede: "手前と奥の2つの被写体の間でピントを送り替え、視線の主役を入れ替えるカメラ的な演出。効くのは合焦の直前に一度ぼけ側へ戻る「フォーカスハント」で、これが無いとただのぼかしの切り替えに見える。",
  params: [
    {
      key: "duration",
      label: "duration(ピント送りの時間 s)",
      min: 0.4,
      max: 2.4,
      step: 0.1,
      default: 1.2,
      desc: "0.8〜1.4sが映画的。0.5s以下だと単なる切り替えに見え、2sを超えると待たされる。",
    },
    {
      key: "blur",
      label: "blur(外れた側のボケ量 px)",
      min: 2,
      max: 20,
      step: 1,
      default: 10,
      desc: "8〜12pxで被写界深度の浅いレンズらしくなる。20pxは奥を完全に溶かす表現向け。",
    },
    {
      key: "hunt",
      label: "hunt(フォーカスハントの戻り量)",
      min: 0,
      max: 0.8,
      step: 0.05,
      default: 0.35,
      desc: "合焦手前で一度ぼけ側へ戻る量。0.3前後で「レンズが探る」感じが出る。0だと機械的。",
    },
  ],
  promptTemplate: `画像・映像セクションに rack focus(ピント送り)を実装してください。

- 手前と奥の2つの被写体を重ねて配置し、常にどちらか一方だけにピントが合っている状態にする
- ピントが外れている側は filter: blur({{blur}}px) とし、コントラストが落ちるので opacity も 0.55 程度まで下げる
- ホバー(スマホはタップ)でピントを相手側へ {{duration}}s かけて送る
- 合焦する側は単調に blur を 0 へ落とさず、フォーカスハントを入れる:
  ほぼ合焦(blur約8%)まで詰めたあと一度 blur({{blur}}px × {{hunt}}) まで戻し、そこから 0 へ収める
  (@keyframes の 45% / 62% / 100% に置き、easing は cubic-bezier(.3,.15,.25,1))
- ピントが外れる側はハント無しで滑らかに blur を上げる(ハントは「到着側」だけに入れる)
- blur は必ず filter で当て、画像の差し替えやopacityのクロスフェードで代用しない
- 親要素に overflow: hidden を置き、blurでにじんだ縁が枠外へ出ないようにする
- prefers-reduced-motion 時はアニメーションを行わず、合焦後の状態へ即時に切り替える`,
  ngExample: {
    say: "「奥の画像がボケて手前にピントが合う感じにして」",
    why: "「ボケる」だけでは送る時間もボケ量も決まらない。両方が同時にぼけたままだったり、blurではなく単なる不透明度のクロスフェードで返ってくることが多い。カメラらしさの肝であるハントはまず入らない。",
  },
  okExample: {
    say: "「rack focusを実装。手前/奥の2被写体で常に片方だけ合焦、外れた側は filter: blur(10px) + opacity 0.55。ホバーで1.2sかけて送り、到着側は45%でほぼ合焦→62%でblur 3.5pxへ戻す→100%で0のフォーカスハント付き。easingは cubic-bezier(.3,.15,.25,1)、reduced-motionでは即時切替」",
    why: "被写体が2つで片方だけ合焦という構造、blurとopacityの具体値、そしてハントをキーフレームの位置と数値で指定している。この3点目があるかどうかで「カメラのピント送り」と「ただのボケ切り替え」が分かれる。",
  },
  vocab: [
    {
      term: "rack focus / focus pull",
      desc: "1カットの中でピント位置を別の被写体へ送る撮影技法。日本語では「ピント送り」「フォーカス送り」。視線誘導と場面転換を同時にやれる。",
    },
    {
      term: "被写界深度(depth of field)",
      desc: "ピントが合って見える奥行きの幅。浅いほど手前と奥のボケ差が大きく、ピント送りが劇的になる。Web上ではblurの量がこれに相当する。",
    },
    {
      term: "フォーカスハント",
      desc: "レンズが合焦点を探して行き過ぎ、少し戻ってから収まる挙動。機械的な補間に人の手つきを足す役で、これが無いと「ぼかしを消しただけ」に見える。",
    },
    {
      term: "filter: blur() と backdrop-filter: blur()",
      desc: "前者は要素自身を、後者は要素の背後にあるものをぼかす。被写体ごとにピントを分けるなら前者、画面全体を一度ぼかしてから合焦させる演出なら後者。",
    },
  ],
  related: ["blur-reveal", "progressive-blur", "focus-dim"],
};
