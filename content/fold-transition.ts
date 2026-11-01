import type { MotionEntry } from "@/lib/types";

export const foldTransition: MotionEntry = {
  slug: "fold-transition",
  category: "transition",
  nameJa: "折りたたみ遷移",
  nameEn: "fold transition / gatefold page transition / paper fold",
  lede: "画面を中央の折り目で左右2枚に分け、両方を折り目を軸に90°まで畳んで閉じ、次のページを同じ折り目から開いて見せるページ遷移。効くのは折り目へ向かって濃くなる陰りで、これが無いと2枚の板が回っているだけに見え、「紙を畳んだ」と読まれない。",
  params: [
    {
      key: "fold",
      label: "fold(畳んで閉じる時間 s)",
      min: 0.3,
      max: 2,
      step: 0.05,
      default: 0.95,
      desc: "0.8〜1sが自然(出典 0.97s)。0.5sを切ると折れる途中の陰りが見えず、パネルが消えただけに見える。",
    },
    {
      key: "unfold",
      label: "unfold(次のページを開く時間 s)",
      min: 0.3,
      max: 2.4,
      step: 0.05,
      default: 1.25,
      desc: "閉じる時間より2〜3割長くすると、次のページを「広げて読ませる」余韻が出る(出典 1.25s)。同じ長さだと往復運動に見える。",
    },
    {
      key: "shade",
      label: "shade(折り目の陰りの濃さ %)",
      min: 0,
      max: 50,
      step: 1,
      default: 14,
      desc: "畳み切ったときの折り目側の暗さ。10〜20%で紙の厚みが出る。0で板が回るだけになり、35%を超えると汚れた紙に見える。",
    },
    {
      key: "perspective",
      label: "perspective(視点までの距離 px)",
      min: 600,
      max: 4000,
      step: 100,
      default: 2400,
      desc: "画面幅の1.5〜2倍が目安。小さいほど外側の端が手前へ大きく迫り、立体が強く出る。1000pxを切ると端が画面からはみ出して歪んで見える。",
    },
  ],
  promptTemplate: `ページ(紙面)の切り替えに fold transition(中央の折り目で畳んで閉じ、次のページを開く遷移)を実装してください。

- きっかけ: 「Turn to next folio」ボタンのクリック、または紙面のどこかをクリックしたとき(タッチはタップで同じ)に1回再生する。再生中のクリックは無視する。2枚のページを交互に表示する
- 紙面を左右半分ずつの2枚の葉(leaf)に分ける。各葉は width 50%・overflow: hidden で、中に紙面全体(幅は親の100%)を入れ、右の葉は中身を -50% ずらして右半分だけ見せる
- 左の葉は transform-origin: 100% 50%(折り目)、右の葉は 0% 50%(折り目)。親に perspective: {{perspective}}px を指定する
- 閉じる: 左の葉を rotateY(0→90deg)、右の葉を rotateY(0→-90deg) へ {{fold}}s、cubic-bezier(0.4, 0, 0.2, 1) で動かす(外側の端が手前へ起き上がり、折り目に向かって畳まれる)
- 陰り: 各葉に ::after を重ね、折り目側が濃い linear-gradient(左の葉は 90deg で 60% から rgba(55,53,45,{{shade}}%) へ、右の葉は逆向きで 40% まで)を置き、opacity を閉じる間に 0→1(ease)、開く間に 1→0 にする
- 畳み切ったら中身を次のページに差し替え、0.12s 置いてから開く: 両方の葉を ±90deg→0 へ {{unfold}}s、cubic-bezier(0.22, 0.61, 0.36, 1) で戻す
- backface-visibility: hidden を付け、width や left ではなく transform と opacity だけで動かす(リフローさせない)
- prefers-reduced-motion 時は畳む動きを省略し、0.2s のクロスフェードで次のページへ切り替える`,
  ngExample: {
    say: "「ページが紙みたいに折れて次のページに変わる遷移にして」",
    why: "「紙みたいに折れて」では折り目の位置も枚数も決まらない。1枚の page flip(端を軸にめくる)や、左右に割れてスライドするだけの split transition が返り、折り目へ向かう陰りが抜けて「紙を畳んだ」感じが出ない。",
  },
  okExample: {
    say: "「fold transitionで。中央で2枚の葉に割り、折り目を transform-origin にして rotateY ±90deg まで0.95s cubic-bezier(0.4,0,0.2,1) で閉じ、折り目側に14%の陰りを足す。差し替えて0.12s後に1.25s cubic-bezier(0.22,0.61,0.36,1) で開く。perspective 2400px、transformのみ」",
    why: "折り目の位置(origin)・角度・閉じと開きで違う時間とイージング・陰りの濃さまで指定した。開きを長くすることで「閉じて、広げて読ませる」順番が伝わる。",
  },
  vocab: [
    {
      term: "transform-origin(折り目)",
      desc: "回転の軸。左の葉は右端(100% 50%)、右の葉は左端(0% 50%)に置くと、2枚が中央の折り目を軸に畳まれる。",
    },
    {
      term: "rotateY",
      desc: "縦軸まわりの回転。±90degで葉が真横を向いて厚みゼロに見え、そこで中身を差し替えれば継ぎ目が見えない。",
    },
    {
      term: "perspective",
      desc: "視点までの距離。親に指定すると葉の外側の端が手前へ迫って大きく見え、平面の縮みではなく立体の折れとして読まれる。",
    },
    {
      term: "backface-visibility: hidden",
      desc: "裏面を描かない指定。90degを越えたときに裏返った中身(鏡文字)が一瞬見える事故を防ぐ。",
    },
    {
      term: "gatefold",
      desc: "観音開きの印刷物。左右の扉が中央へ折り込まれる構造で、この遷移の呼び名の由来。",
    },
  ],
  titleAct: { act: "page-turn", map: { duration: "fold", shade: "shade", perspective: "perspective" } },
  aliases: ["パタン", "パタパタ", "観音開き", "折りたたむ", "ぱたっ"],
  related: ["page-turn", "split-screen", "flip-card"],
};
