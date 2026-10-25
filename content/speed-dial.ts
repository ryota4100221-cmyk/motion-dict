import type { MotionEntry } from "@/lib/types";

export const speedDial: MotionEntry = {
  slug: "speed-dial",
  category: "ui",
  nameJa: "スピードダイヤル（丸いボタンから項目が順に立ち上がる）",
  nameEn: "speed dial / FAB menu / floating action button menu",
  lede: "画面の隅に浮いた丸いボタン(FAB)を押すと、関連する操作がボタンの上に縦一列で立ち上がり、ボタンの「＋」は「×」に替わる演出。項目は FAB の側から少し下がった位置から浮き上がりつつ現れ、閉じると逆順に引っ込む。肝は「FAB に近い項目から順に出して、出どころがボタンだと分からせる」ことと、「×に替えて同じ場所で閉じられると示す」こと。",
  params: [
    {
      key: "duration",
      label: "duration(1項目が出る時間 s)",
      min: 0.15,
      max: 0.8,
      step: 0.01,
      default: 0.3,
      desc: "1つの項目が浮き上がって不透明になるまでの時間。0.25〜0.35sが軽快(観察元は0.3s)。0.5sを超えると、押してから押せるようになるまでを待たされる感覚になる。",
    },
    {
      key: "distance",
      label: "distance(浮き上がる距離 px)",
      min: 0,
      max: 60,
      step: 1,
      default: 20,
      desc: "項目が FAB 側(下)にずれた位置から定位置まで動く距離。観察元は20px。0ならその場でフェードするだけ。40pxを超えると項目同士の間隔(12px＋項目の高さ)に迫り、列が一度崩れて見える。",
    },
    {
      key: "stagger",
      label: "stagger(項目ごとの遅れ s)",
      min: 0,
      max: 0.12,
      step: 0.005,
      default: 0.04,
      desc: "FAB に近い項目から順に足す遅れ。0.03〜0.05sで「下から順に立ち上がる」と読める。観察元は0(列ごと一括で上がる)。0.1sを超えると3項目でも最後が出るまでに0.5s以上かかり、待たされる。",
    },
  ],
  promptTemplate: `画面右下に浮かせる speed dial(FAB メニュー)を実装してください。

- きっかけ: 右下の丸いボタン(FAB・button 要素)をクリック(タッチはタップ)すると開き、もう一度押す・外側を押す・Escape・項目を押す、のどれかで閉じる。開閉は押すたびに切り替える(自動では動かさない)
- FAB は直径52pxの丸。その上に、直径44pxの丸い項目ボタンを3つ、間隔12pxの縦一列で右端を揃えて置く。各項目の左に項目名のラベル(角丸のチップ)を常に添える
- 閉じているとき、各項目は opacity: 0・transform: translateY({{distance}}px)(FAB側へ下げる)・visibility: hidden
- 開くとき: 各項目を opacity 1・translateY(0) へ、{{duration}}s ease の transition で。遅延は FAB に近い項目から 0, {{stagger}}s, {{stagger}}s×2…と足していく(下から順に立ち上がる)
- 閉じるとき: 同じ {{duration}}s ease で元に戻す。遅延は逆順(FAB から遠い項目から 0, {{stagger}}s…)。visibility は transition の終わりで hidden に切り替える(閉じ切るまで消さない)
- FAB の中: 開くと内側の円(::before)を transform: scale(0) → scale(1) へ 0.4s cubic-bezier(.4, 0, .2, 1) で広げてアクセント色に塗り、アイコンの「＋」は opacity 0・scale(0.6) へ、45°傾けた「＋」(×)を opacity 0・rotate(45deg) scale(0.6) → opacity 1・rotate(45deg) scale(1) へ、どちらも 0.3s ease で入れ替える
- 動かすのは transform / opacity だけ(top・height・margin を動かさない)
- FAB に aria-expanded と aria-controls を付け、閉じている間は項目を tabindex="-1"・aria-hidden にする。項目を押して閉じたら、フォーカスを FAB に戻す
- prefers-reduced-motion 時は浮き上がり・遅延・塗りの広がり・アイコンの入れ替えの transition をすべて無くし、開閉を即時に切り替える`,
  ngExample: {
    say: "「右下に丸いボタンを置いて、押したらメニューが出るようにして。アニメーション付きで」",
    why: "ボタンの上にカード型のポップアップ(dropdown)がフェードで出るか、全項目が同時にふわっと出る実装が返ってきやすい。前者は「丸から操作が生えてくる」形にならず、後者はどこから出てきたか分からない。「＋」が「×」に替わらないので、閉じ方を探して画面の外側を押すことになる。閉じるときの逆順は、指定しないとまず付かない。",
  },
  okExample: {
    say: "「speed dialを。右下の52px FABの上に44pxの丸を3つ、間隔12px。開くとき各項目はtranslateY(20px)・opacity 0から0へ0.3s ease、FABに近い順に0.04sずつ遅らせる。閉じるときは遠い順。FABは中から塗りがscale 0→1で0.4s広がり、＋は縮んで消え×が0.6倍から膨らむ。外側・Escでも閉じる。reduced-motionでは即時」",
    why: "「下から順に」「閉じるときは逆順」で、項目の出どころが FAB だと動きで伝わる。浮き上がる距離を20pxに抑えているので、列の並びが崩れずに読める。＋→×の入れ替えを指定しているので、同じ場所で閉じられることが見て分かる。",
  },
  vocab: [
    {
      term: "FAB(floating action button)",
      desc: "画面の隅に浮かせて置く、主な操作のための丸いボタン。Material Design の呼び名。スクロールしても同じ位置に残る。",
    },
    {
      term: "スピードダイヤル(speed dial)",
      desc: "FAB を押すと、関連する2〜6個の操作が FAB から立ち上がるように並ぶ形式。縦一列のほか、扇状(arc)に開く型もある。",
    },
    {
      term: "スタッガー(stagger)",
      desc: "複数の要素の開始を少しずつずらすこと。出どころに近い順にずらすと、要素が「そこから出てきた」と読める。",
    },
    {
      term: "逆順クローズ(reverse stagger)",
      desc: "閉じるときは開いたときと逆の順番で引っ込めること。最後に出た(遠い)項目から先に消すと、出どころへ戻っていくように見える。",
    },
    {
      term: "aria-expanded",
      desc: "開閉する部品を操作するボタンに付ける属性。true/false で、読み上げに「展開」「折りたたみ」の状態を伝える。",
    },
  ],
  titleAct: { act: "scroll-fade-in", map: { distance: "distance", duration: "duration", stagger: "stagger*1000" } },
  aliases: ["ぽこぽこ", "にょきにょき", "ピョコッ", "FAB", "プラスがバツに"],
  related: ["menu-toggle", "dropdown-reveal", "stagger-grid", "pill-expand"],
};
