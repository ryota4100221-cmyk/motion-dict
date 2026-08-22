import type { MotionEntry } from "@/lib/types";

export const godRays: MotionEntry = {
  slug: "god-rays",
  category: "media",
  nameJa: "ゴッドレイ",
  nameEn: "god rays / light rays / crepuscular rays",
  lede: "画面の上にある光源から扇状の光条を降ろし、ごくゆっくり回して空気感を出す背景演出。conic-gradient1枚で作れるので画像もWebGLも要らない。opacity 0.06〜0.12の「言われないと気づかない濃さ」で止められるかが品位の分かれ目。",
  params: [
    {
      key: "rays",
      label: "rays(見えている光条の本数)",
      min: 3,
      max: 12,
      step: 1,
      default: 5,
      desc: "画面に入ってくる本数。4〜6本が自然。増やすほど間隔が詰まり、光ではなく放射状の模様に見え始める。",
    },
    {
      key: "spread",
      label: "spread(1本の広がり deg)",
      min: 4,
      max: 40,
      step: 2,
      default: 16,
      desc: "1本が占める角度。本数どうしの間隔(周期)の8割までが上限。それを超えると隣とつながり、光条ではなく「明るい背景」になる。",
    },
    {
      key: "speed",
      label: "speed(回転の速さ deg/秒)",
      min: 1,
      max: 30,
      step: 1,
      default: 8,
      desc: "5〜12が「気づかれずに動く」域。20を超えると回転そのものが目に留まり、背景ではなく主役になる。",
    },
    {
      key: "opacity",
      label: "opacity(光の濃さ)",
      min: 0.02,
      max: 0.24,
      step: 0.01,
      default: 0.1,
      desc: "暗い背景なら0.06〜0.12が適正域。0.18を超えると見出しのコントラストを削り、可読性の問題になる。",
    },
  ],
  promptTemplate: `ヒーロー背景に god rays(光条)を実装してください。

- 光条はDOMで1本ずつ並べず、オーバーレイ1枚の background を repeating-conic-gradient で作る
- オーバーレイは「自分の中心が光源」になる正方形にし、その中心をヒーローの上辺中央に置く(left:50% / top:0 / transform: translate(-50%,-50%))。中心を要素の外に置くと、回したとき光源そのものが公転してしまう
- 大きさはヒーローの隅まで光が届く半径を確保する(幅300%程度)。はみ出しは親の overflow: hidden で切る
- 全周の本数は「見せたい本数 {{rays}} × 360÷140」を四捨五入した整数にする。360がその本数で割り切れないと、conicの開始角に継ぎ目(1本だけ太い箇所)ができ、それが回って画面を横切る
- 1周期(=360÷全周の本数)の中で「透明 → 光の色 → 透明」を {{spread}} 度かけて減衰させ、残りは透明にする(ハードストップにすると光ではなく紙の扇に見える)。{{spread}} は周期の8割を上限にクランプする
- 縁が立たないよう filter: blur(8〜12px) をかける(バンディングも一緒に消える)
- mask-image の radial-gradient で外側へ減衰させ、光が途中で切れて見えないようにする
- 回転は毎秒 {{speed}} 度。transform: rotate() の linear アニメーションで回し、1周ではなく「1周期ぶん」を1ループにする(見た目が同一なので継ぎ目が出ず、ループが短く済む)
- オーバーレイの opacity は {{opacity}}(暗い背景で0.06〜0.12が目安。それ以上は文字の可読性を削る)。pointer-events: none を付け、コンテンツより奥のz-indexに置く
- background-position や width ではなく transform: rotate() だけで動かす(リフローさせない)
- prefers-reduced-motion 時は回転を止め、静止した光条としてだけ敷く`,
  ngExample: {
    say: "「ヒーローの背景に光が差し込んでる感じを足して」",
    why: "光条を1本ずつdivで並べて個別に回す実装や、canvas/WebGLで作る過剰な実装が返ってくる。濃さの指定がないと opacity 0.3 の「白い扇」が乗り、見出しのコントラストを壊す。",
  },
  okExample: {
    say: "「god raysを実装。中心=光源の正方形オーバーレイをヒーロー上辺中央に置き、repeating-conic-gradientで全周13本(見え5本)、1本16degの減衰、blur 9px。rotateで毎秒8deg、1周期ぶんを1ループ。opacity 0.10、maskで外周を減衰、reduced-motionは静止」",
    why: "作り方(1枚のconic-gradient)・光源の置き方・本数・速度・濃さ・ループ単位まで指定している。「中心=光源」と「1周期ぶんを1ループ」の2点が、光源の公転とパターンの継ぎ目という2大バグを最初から潰す。",
  },
  vocab: [
    {
      term: "god rays(crepuscular rays)",
      desc: "雲や隙間から差し込む筋状の光。日本語では光条・薄明光線。Webでは上方の光源から降ろす扇状のグラデーションとして再現する。",
    },
    {
      term: "repeating-conic-gradient",
      desc: "中心から角度方向に一定周期でくり返す円錐グラデーション。放射状に等間隔で並ぶものは、これ1枚でDOMを増やさず作れる。",
    },
    {
      term: "周期ループ",
      desc: "くり返しパターンは1周期ぶん動かせば見た目が元に戻る。360度回さず「360÷本数」度で1ループにすると、継ぎ目なしのまま尺が短くなる。",
    },
    {
      term: "回転中心",
      desc: "rotateは要素自身の中心を軸に回る。光源を要素の外(at 50% -10%等)に置いたまま回すと、光源が固定されず公転する。「中心=光源」に組むのが定石。",
    },
    {
      term: "mask-image",
      desc: "要素の見え方をグラデーションで削る指定。光条の外周を透明に落とし、途中で切れたようなハードエッジを消すのに使う。",
    },
  ],
  related: ["grain-overlay", "scanlines", "spotlight-hover"],
};
