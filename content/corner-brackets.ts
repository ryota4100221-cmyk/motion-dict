import type { MotionEntry } from "@/lib/types";

export const cornerBrackets: MotionEntry = {
  slug: "corner-brackets",
  category: "media",
  nameJa: "コーナーブラケット（四隅の枠）",
  nameEn: "corner brackets / crop marks / viewfinder frame",
  lede: "四隅にL字の短い線だけを置き、それが外から回り込んで定位置に収まる枠の演出。四辺を閉じないので中身の視認性を落とさずに「ここが主役」と宣言でき、印刷のトンボやカメラのファインダーの記憶を借りて画面が締まる。",
  params: [
    {
      key: "size",
      label: "size(L字の腕の長さ px)",
      min: 8,
      max: 40,
      step: 1,
      default: 16,
      desc: "12〜20pxが「枠の気配」で止まる範囲。30pxを超えると四辺を囲む罫線に近づき、L字である意味が薄れる。",
    },
    {
      key: "spin",
      label: "spin(開始時の回転 deg)",
      min: 0,
      max: 180,
      step: 5,
      default: 90,
      desc: "自分のコーナーを軸に何度ねじれた状態から始めるか。90度が「はまり込む」感じの標準。0にすると回転が消えてただの縮小フェードになる。",
    },
    {
      key: "duration",
      label: "duration(1隅が収まる時間 s)",
      min: 0.2,
      max: 1.2,
      step: 0.05,
      default: 0.55,
      desc: "0.5〜0.6sが装飾として出すぎない。速すぎると4隅が同時に見えて時間差が読めない。",
    },
    {
      key: "stagger",
      label: "stagger(隅ごとの時間差 s)",
      min: 0,
      max: 0.25,
      step: 0.01,
      default: 0.08,
      desc: "0.06〜0.10sで「左上→右上→左下→右下」の順が読める。0にすると4隅が一斉に出て、枠が組み上がる過程が消える。",
    },
  ],
  promptTemplate: `ヒーローやカードの四隅に corner brackets(L字の枠)を実装してください。

- ブラケットは要素を4つ置き、それぞれ {{size}}px 角の空div。border-width は自分の担当2辺だけ1pxにする(左上なら border-top と border-left)。四辺を閉じる枠線にはしない
- 対象の内側に size と同じだけインセットして絶対配置する
- transform-origin は自分のコーナー側に置く(左上なら 0 0、右下なら 100% 100%)。ここを中央にすると回転が滑って収まりが出ない
- 登場は opacity: 0 / rotate({{spin}}deg) / translate(外向きに size の半分) / scale(0.35) から、opacity: 1 / rotate(0) / translate(0) / scale(1) へ
- 回転の向きは左上と右下が反時計回り、右上と左下が時計回り。translate は各隅から外側へ逃がす向きにする(rotate のあとに translate を書くと軌道が弧を描く)
- duration {{duration}}s、easing は cubic-bezier(0.22, 1, 0.36, 1)(easeOutQuint)。終端でぴたっと止まるカーブにする
- delay は左上→右上→左下→右下の順に {{stagger}}s ずつ増やす。animation-fill-mode: both で開始前の状態と終了後の状態を保持する
- 動かすのは transform と opacity だけにする(top/left/width を動かしてリフローさせない)
- prefers-reduced-motion 時は回転・移動・拡縮をすべて外し、ブラケットを最初から定位置に静止表示する(短いフェードインまでは可)`,
  ngExample: {
    say: "「ヒーローの四隅に枠っぽい飾りをつけて、animationで出して」",
    why: "「枠」と言うと四辺を囲む border が返ってくる。L字になっても transform-origin が中央のままで、回転が芯からズレて「はまり込む」感じが出ない。4隅同時に出て時間差もない実装がほとんど。",
  },
  okExample: {
    say: "「corner bracketsを実装。16px角のdiv4つ、担当2辺だけborder 1px、transform-originは各自のコーナー。rotate90deg+外向きtranslate 8px+scale0.35から定位置へ、0.55s cubic-bezier(0.22,1,0.36,1)、左上から0.08sずつdelay、fill-mode both。transformとopacityのみ」",
    why: "「担当2辺だけ」「transform-originは各自のコーナー」の2点で形と芯が確定する。回転量・移動量・イージング・時間差まで数値で渡しているので、収まりの質が実装者依存にならない。",
  },
  vocab: [
    {
      term: "corner brackets",
      desc: "四隅のL字マークを指す英語圏での呼び名。印刷のトンボ(crop marks)やカメラのファインダー枠(viewfinder frame)由来で、この3語はほぼ同じ意味で通じる。",
    },
    {
      term: "transform-origin",
      desc: "回転・拡縮の基準点。各ブラケットを自分のコーナー(0 0 / 100% 100% など)に固定すると、縮んだ状態でも角の位置が動かず定位置に吸い付く。",
    },
    {
      term: "animation-fill-mode: both",
      desc: "開始前は最初のキーフレーム、終了後は最後のキーフレームの見た目を保持する指定。delay 中にブラケットが素の状態でチラつくのを防ぐ。",
    },
    {
      term: "cubic-bezier(0.22, 1, 0.36, 1)",
      desc: "easeOutQuint と呼ばれるカーブ。序盤で一気に距離を詰めて終端でぴたりと止まるので、機構が「はまる」表現に向く。",
    },
  ],
  related: ["border-draw", "gradient-border", "line-draw"],
};
