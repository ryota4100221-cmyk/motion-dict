import type { MotionEntry } from "@/lib/types";

export const tornPaperReveal: MotionEntry = {
  slug: "torn-paper-reveal",
  category: "transition",
  nameJa: "紙が破れて現れる（トーンペーパー）",
  nameEn: "torn paper reveal / paper tear transition / ripped paper effect",
  lede: "画面を覆う紙が不揃いなギザギザの線で上下に裂け、わずかに傾きながら退いて下の画面を見せるリビール。動き自体は2枚の translate だけで、「紙らしさ」は破れ目の折れ線と、縁に残る淡い繊維の帯でほぼ決まる。",
  params: [
    {
      key: "duration",
      label: "duration(裂けて退く時間 s)",
      min: 0.6,
      max: 2,
      step: 0.05,
      default: 1.25,
      desc: "1.0〜1.4sが目安。出典は1.25s。cubic-bezier(0.7,0,0.3,1)は出だしが溜まるので、0.8sを切ると「破れた」より「消えた」に見える。",
    },
    {
      key: "jag",
      label: "jag(破れ目のギザつき px)",
      min: 0,
      max: 24,
      step: 1,
      default: 10,
      desc: "破れ目の上下の振れ幅。8〜14pxで手で裂いた紙に見える。0だと直線＝ただのスプリット遷移になり、20pxを超えると歯車のような作り物に寄る。",
    },
    {
      key: "rim",
      label: "rim(縁の繊維の幅 px)",
      min: 2,
      max: 16,
      step: 1,
      default: 8,
      desc: "破れ目に沿って残す淡い帯の幅。6〜10pxが自然。この帯が無いと切り紙のように見え、紙の厚みが消える。",
    },
    {
      key: "tilt",
      label: "tilt(退くときの傾き deg)",
      min: 0,
      max: 4,
      step: 0.1,
      default: 1,
      desc: "上の紙片は −tilt、下は +tilt×0.8 回す。0.5〜1.5degで「手で引き剥がした」揺らぎが出る。左右非対称にするのがコツ。",
    },
  ],
  promptTemplate: `ページの読み込み後(またはセクションの切り替え時)に torn paper reveal を実装してください。

- きっかけ: 覆っている紙面かボタンをクリック/タップしたら1回だけ裂けて退く(本番ではローディング完了時に1回)。退いている間の操作は無視し、開いた後にもう一度押すと新しい破れ目の紙を0.3sのフェードで差し替えて覆い直す(破れた紙を逆再生で戻さない)
- 下の層に現れる画面を置き、その上に紙片を上下2枚重ねる。各紙片は幅104%(left −2%)・高さ58%で、中央の16%を重ねる
- 破れ目は1本の折れ線を上下で共有する。x は 0.6〜2.0% の不揃いな間隔で約75点、y は「ゆるいうねり(振幅 {{jag}}px×0.6)＋点ごとの乱数(±{{jag}}px×0.55)」。上の紙片は clip-path: polygon で上辺＋破れ目、下の紙片は破れ目＋下辺で切る
- 下の紙片の破れ目は {{rim}}px 上へずらして上の紙片に重ね、閉じているとき隙間を作らない
- 紙片は2層にする: 外側(淡い色 #FBF7EA＝繊維)を破れ目で切り、内側(紙の地 #E9E2D3＋刷り)を破れ目から {{rim}}px 内側(点ごとに0.7〜1.3倍に揺らす)で切る。縁に淡い帯が残って紙の厚みに見える
- 紙面の文字は舞台1枚ぶんの高さで上下の紙片に同じ位置で敷き、破れると文字も裂けるようにする
- 退き方: 上の紙片は translateY(−118%) rotate(−{{tilt}}deg)、下の紙片は translateY(118%) rotate({{tilt}}×0.8 deg)。{{duration}}s の cubic-bezier(0.7, 0, 0.3, 1)、forwards で止める
- 影(drop-shadow(0 ±6px 10px rgba(30,20,10,.22)))は clip-path を持つ要素ではなく、その外枠(transform を付ける要素)に付ける。同じ要素だと影ごと切り取られる
- 動かすのは transform だけ(top/height は触らない)。clip-path は形の定義に使い、アニメーションさせない
- prefers-reduced-motion 時は紙片を動かさず、即座に非表示にして下の画面を見せる`,
  ngExample: {
    say: "「紙がビリッと破れて中身が出てくる感じにして」",
    why: "破れ目の形も、2枚がどちらへ退くかも未定義。破れた紙の画像(PNG)を1枚フェードさせるだけの実装や、直線で上下に割れるだけのスプリット遷移が返ってきがち。縁の繊維の帯が無いので、切り紙のような薄っぺらさになる。",
  },
  okExample: {
    say: "「torn paper revealを実装。幅104%・高さ58%の紙片を上下に重ね、共有する折れ線(約75点・振れ幅10px)でclip-pathを切る。内側の層を8px内側で切って縁に#FBF7EAの繊維を残す。上はtranslateY(−118%) rotate(−1deg)、下は118%・0.8deg、1.25s cubic-bezier(0.7,0,0.3,1)。影は外枠に。reduced-motionは即非表示」",
    why: "破れ目の作り方(共有する折れ線＋点数＋振れ幅)・繊維の帯の幅・退く量と非対称な傾き・イージングまで固定。「影は外枠に」の一言で、clip-pathに影が切られて紙が浮かない事故を防げる。",
  },
  vocab: [
    {
      term: "clip-path: polygon",
      desc: "要素を多角形で切り抜くCSS。破れ目は数十点の折れ線をそのまま並べて作る。点の間隔を不揃いにすると規則的な歯並びに見えない。",
    },
    {
      term: "共有する破れ目",
      desc: "上下の紙片を同じ折れ線で切ること。閉じているときに凹凸がぴったり噛み合い、1枚の紙だったことが伝わる。別々に乱数を振ると噛み合わず、2枚の紙が重なっているだけに見える。",
    },
    {
      term: "繊維の縁(exposed fiber)",
      desc: "紙を裂くと表面の層だけが先に切れ、破れ目に沿って白っぽい繊維が帯状に残る。外側を淡い色で、内側を地の色で少し内側に切る2層構造で再現する。",
    },
    {
      term: "非対称な傾き",
      desc: "上を−1deg、下を+0.8degのように左右で量を変えて回す。同じ角度で対称に回すと機械で開いたように見え、手で裂いた揺らぎが消える。",
    },
    {
      term: "cubic-bezier(0.7, 0, 0.3, 1)",
      desc: "出だしと着地がゆっくりで中盤が速いイーズインアウト。破れ始めの「溜め」と、紙が画面外へ抜けていく勢いを1本で作れる。",
    },
  ],
  titleAct: { act: "split-screen", map: { duration: "duration", axis: 0 } },
  aliases: ["ビリッ", "ビリビリ", "紙が破れる", "破れ目", "ペリッ"],
  related: ["split-screen", "curtain-wipe", "paper-crumple"],
};
