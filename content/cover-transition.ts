import type { MotionEntry } from "@/lib/types";

export const coverTransition: MotionEntry = {
  slug: "cover-transition",
  category: "transition",
  nameJa: "カバートランジション",
  nameEn: "cover transition / push page transition",
  lede: "次のページが下から立ち上がって現在のページに覆いかぶさり、覆われた側は奥へ引きながら暗くなるページ遷移。カーテンのような中間の幕を挟まず「ページが層として積まれる」ので、前の画面がまだそこにある感じ＝戻れる感じが残る。",
  params: [
    {
      key: "duration",
      label: "duration(覆い切るまでの時間 s)",
      min: 0.4,
      max: 1.4,
      step: 0.05,
      default: 0.9,
      desc: "0.8〜1.0sが重厚で品がある。0.5sを切ると層が積まれた実感が出ず、ただの切り替えに見える。",
    },
    {
      key: "rise",
      label: "rise(新ページの立ち上がり距離 %)",
      min: 8,
      max: 40,
      step: 2,
      default: 24,
      desc: "画面高に対する開始位置のオフセット。20〜25%が目安。大きいほど「下から来た」が強調される。",
    },
    {
      key: "scaleFrom",
      label: "scaleFrom(新ページの初期スケール)",
      min: 0.7,
      max: 1,
      step: 0.02,
      default: 0.8,
      desc: "小さく始めて等倍へ寄せると奥から手前に出てくる。1.0にすると平面的なスライドになる。",
    },
    {
      key: "recede",
      label: "recede(旧ページの後退スケール)",
      min: 1,
      max: 1.3,
      step: 0.02,
      default: 1.12,
      desc: "覆われる側を1.1前後まで拡大すると奥へ下がって見える。1.2を超えると画の縁が欠けて気になる。",
    },
  ],
  promptTemplate: `ページ遷移に cover transition を実装してください。

- 旧ページと新ページを同じ枠に重ね、新ページを上のレイヤー(z-index)に置く
- 新ページの開始状態は transform: translateY({{rise}}%) scale({{scaleFrom}}) と clip-path: inset(100% 0 0)
- 遷移中に新ページを transform: none / clip-path: inset(0) へ {{duration}}s で動かす(clip-pathとtransformを同時に動かすことで、下辺から迫り上がりながら等倍に戻る)
- 同時に旧ページを transform: translateY(-6%) scale({{recede}}) / opacity 0.48 へ、同じ duration・同じイージングで動かす
- イージングは出だしが速く終わりが長い cubic-bezier(0.11, 0.82, 0.39, 1) 系を両者で共有する(ズレると2枚が別々の動きに見える)
- 動かすのは transform / clip-path / opacity のみ。top や height のアニメーションでリフローさせない
- 遷移が終わったら新ページをベースに差し替え、レイヤーとwill-changeを片付ける
- 遷移中は二重発火しないようにロックし、終了後に解除する
- prefers-reduced-motion 時は覆う動きを出さず、ページを即座に差し替える`,
  ngExample: {
    say: "「ページ遷移で次のページが下から出てくるようにして」",
    why: "「下から出てくる」だけだと新ページを translateY で滑らせるだけの実装が返り、旧ページが動かないので層が積まれた感じが出ない。覆われる側の後退と減光まで指定しないとこの遷移にはならない。",
  },
  okExample: {
    say: "「cover transitionを実装。新ページは translateY(24%) scale(0.8) + clip-path: inset(100% 0 0) から transform:none / inset(0) へ0.9s。旧ページは同じ0.9s・同じイージングで translateY(-6%) scale(1.12) / opacity 0.48 へ。transformとclip-pathのみでリフロー禁止、reduced-motion時は即差し替え」",
    why: "2枚それぞれの開始・終了状態と、両者が同じ時間・同じイージングを共有することまで指定してある。この遷移の質はほぼ「2枚が揃って動くか」で決まる。",
  },
  vocab: [
    {
      term: "cover / push",
      desc: "次の画面が現在の画面の上に重なって進む遷移の呼び名。前の画面を捨てるcrossfadeと違い、層として残す。",
    },
    {
      term: "clip-path: inset()",
      desc: "要素を上下左右から矩形で切り取る。inset(100% 0 0)は上辺から100%＝完全に隠れた状態で、0へ動かすと下から迫り上がって見える。",
    },
    {
      term: "スタッキングコンテキスト",
      desc: "重なり順が決まる入れ物。transformやopacityを与えた要素は独自の文脈を作るので、z-indexが効かないときはまずここを疑う。",
    },
    {
      term: "イージングの共有",
      desc: "同時に動く複数レイヤーに同じ曲線を使うこと。片方だけeaseにすると、2枚が別々のものとして知覚される。",
    },
    {
      term: "View Transitions API",
      desc: "ブラウザ標準の遷移機構。::view-transition-old / -new に対してこの動きをCSSだけで書けるが、対応外ブラウザ用の即差し替えは自前で用意する。",
    },
  ],
  related: ["curtain-wipe", "crossfade", "zoom-through"],
};
