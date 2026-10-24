import type { MotionEntry } from "@/lib/types";

export const animatedBeam: MotionEntry = {
  slug: "animated-beam",
  category: "media",
  nameJa: "光の伝送線（アニメーテッドビーム）",
  nameEn: "animated beam / comet line / signal pulse along a path",
  lede: "ハブと各ノードをつなぐ線の上を、光の一筋が頭から伸びて尾から消えながら1本ずつ走り抜ける演出。常時流れる破線と違い「いま、ここからあそこへ何かが届いた」という1回ぶんの送信を描けるので、連携図・統合サービスの紹介・ネットワーク図に効く。",
  params: [
    {
      key: "cycle",
      label: "cycle(1本が次に光るまでの周期 s)",
      min: 2,
      max: 12,
      step: 0.5,
      default: 6,
      desc: "1本の線が光ってから再び光るまでの時間。線が多い図ほど長くしてよい（観察元は25本に約9s）。3s以下にすると常に何本も走って破線フローと見分けがつかなくなる。",
    },
    {
      key: "active",
      label: "active(周期のうち光が走っている割合 %)",
      min: 20,
      max: 100,
      step: 5,
      default: 40,
      desc: "残りは線が暗いまま休む時間。30〜50%で「たまに届く」リズムになる。100%にすると休みが消え、送信ではなく常時の流れに見える。",
    },
    {
      key: "tail",
      label: "tail(光の尾の長さ 経路比)",
      min: 0.05,
      max: 0.9,
      step: 0.05,
      default: 0.35,
      desc: "光の一筋が経路全長の何割まで伸びるか。0.1〜0.2で「粒が飛ぶ」、0.3〜0.5で「彗星」、0.8以上で「線が描かれては消える」に寄る（観察元は0.9）。",
    },
  ],
  promptTemplate: `ハブから各ノードへの接続線に animated beam(線を走り抜ける光)を実装してください。

- きっかけ: 操作不要。表示した時点から全線が rAF で自動ループする。加えてノードに pointerenter(タッチは pointerdown)したら、その線だけ周期を今この瞬間から始め直して即座に光を送る
- 各接続線はSVGの path で、同じ d を2本重ねる。下は常に見えている淡いベースライン、上が光(ビーム)
- ビームの path に pathLength="1" を宣言し、経路の長さに関係なく 0〜1 の比率で制御する
- ビームは stroke-dasharray: <見えている長さ> 2 / stroke-dashoffset: -<尾の位置> の2つだけで動かす。gapを2にしておけば線分は常に1本しか出ない
- 1本の周期は {{cycle}}s。そのうち最初の {{active}}% の間だけ光が走り、残りは消えて休む
- 走っている間は進行度 s を 0 → 1+{{tail}} まで linear に進め、頭 = min(1, s)、尾 = max(0, s − {{tail}}) とする。光は始点から伸びて、終点で尾から吸い込まれるように消える
- 線ごとに周期の開始位置(animation-delay 相当)をばらして、全部が同時に光らないようにする(i 本目を (i × 0.618) mod 1 周期ずらす)
- 光が終点に届いた瞬間(s ≥ 1)から尾が吸い込まれ終わるまで、終点のノードを点灯させて「届いた」を見せる。点灯は0.08sで速く入り、消灯は0.5s ease-out でゆっくり抜く
- ビームには drop-shadow で淡い発光を付ける。stroke-linecap は butt(round にすると長さ0のときも点が残る)
- 線の d や transform は動かさない。dasharray / dashoffset 以外は触らない
- prefers-reduced-motion 時はビームを走らせず、接続線をやや明るい静止線で表示し、各ノードを点灯した状態で見せる`,
  ngExample: {
    say: "「線の上を光が流れるアニメーションにして」",
    why: "「流れる」だけでは marching ants(破線が常時流れる)か、グラデーションを background-position で回すだけの実装が返ってくる。1回ずつ届いて休む、尾から消える、線ごとにタイミングをずらす、の3つが抜けて「送信」に見えない。",
  },
  okExample: {
    say: "「animated beamで実装。pathLength=1のビームを接続線に重ね、周期6sのうち40%だけ光を走らせる。頭=min(1,s)、尾=max(0,s−0.35)でdasharray/dashoffsetを更新、線ごとに開始をずらし、終点到達でノードを光らせる。reduced-motionは静止線＋点灯ノード」",
    why: "光の長さ・走る割合・休む時間を数値で決め、「頭と尾の式」まで渡しているので、伸びて縮む彗星の形が一発で再現される。pathLength=1 の指定で経路の長さが違う線でも同じ見えになる。",
  },
  vocab: [
    {
      term: "pathLength",
      desc: "SVGパスに「全長をこの値とみなす」と宣言する属性。1にすると dasharray/dashoffset を経路比で書け、長さの違う線を同じ式で光らせられる。",
    },
    {
      term: "stroke-dasharray",
      desc: "線分と空白の長さ。ここでは「見えている光の長さ」と「十分に長い空白」の2値にして、線分を1本だけ出す道具として使う。",
    },
    {
      term: "stroke-dashoffset",
      desc: "破線パターンの開始位置。マイナスにずらすと線分が経路の奥へ進むので、尾の位置をそのまま入れれば光が走る。",
    },
    {
      term: "animated beam",
      desc: "連携図の線を光が走る表現の英語名。UIライブラリのコンポーネント名として定着しており、comet line / signal pulse とも呼ばれる。",
    },
    {
      term: "duty cycle(デューティ比)",
      desc: "周期のうち「動いている」時間の割合。ここを下げると休みが生まれ、常時の流れが1回ずつの送信に変わる。",
    },
  ],
  related: ["marching-ants", "line-draw", "motion-path"],
};
