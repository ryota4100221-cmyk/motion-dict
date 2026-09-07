import type { MotionEntry } from "@/lib/types";

export const notchedCorner: MotionEntry = {
  slug: "notched-corner",
  category: "ui",
  nameJa: "ノッチコーナー（角欠け）",
  nameEn: "notched corner / clipped corner / corner cut / bitten corner",
  lede: "パネルやボタンの角を四角く噛み切り、その欠けを状態に合わせて開閉させるUI。clip-pathのpolygonを補間するだけなので枠もレイアウトも動かさずに済み、角が噛み合うかどうかだけで選択・非選択が読めるようになる。",
  params: [
    {
      key: "notch",
      label: "notch(欠けの一辺 px)",
      min: 4,
      max: 28,
      step: 1,
      default: 12,
      desc: "角から削る正方形の一辺。10〜16pxが「意図した造形」に見える範囲。4pxまで浅いと欠けに気付かれず、24pxを超えると要素の外形そのものが変わって文字の余白を食い始める。",
    },
    {
      key: "duration",
      label: "duration(開閉の時間 s)",
      min: 0.15,
      max: 1,
      step: 0.05,
      default: 0.5,
      desc: "0.4〜0.6sが「機構が噛み合う」速さ。0.2s以下だと形が切り替わっただけに見え、0.8sを超えると選択の返事としては遅い。",
    },
    {
      key: "corners",
      label: "corners(欠けを入れる角)",
      min: 0,
      max: 2,
      step: 1,
      default: 0,
      options: ["対角（左上＋右下）", "左上だけ", "四隅すべて"],
      desc: "対角は回転対称になるので並べても崩れず、いちばん潰しが効く。左上だけは「タグの向き」が出て一覧の視線誘導に使える。四隅すべては強い記号になるが、隣接して並べると欠けが連なって見える。",
    },
    {
      key: "swap",
      label: "swap(選択時の挙動)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["閉じる", "反転する"],
      desc: "閉じるは欠けが0まで詰まって直角に戻る、素直な「確定」の合図。反転するは欠けていた角と直角だった角が入れ替わり、形が同じ面積のまま回るので、選択が移動したことが遠目にも分かる。",
    },
  ],
  promptTemplate: `ボタン(またはカード)に notched corner(角欠け)を実装してください。

- 角の欠けは clip-path: polygon() 1本で作る。border-radius や、背景色の三角形を重ねる擬似要素で切り欠きを偽装しない
- 欠けの深さは CSS変数 --notch: {{notch}}px として要素に持たせ、polygon の各頂点は calc(100% - var(--notch)) のように --notch を参照して書く
- 欠けを入れるのは {{corners}}。残りの角は直角のまま残す
- **頂点は常に12個で固定する。** 欠けが0の角も「角の座標に重なった3点」として必ず書く。頂点数が状態で変わると clip-path は補間できず、アニメーションせずに瞬間的に切り替わる
- ホバー時と選択時は {{swap}}。transition は clip-path のみ、{{duration}}s、イージングは cubic-bezier(0.7, 0, 0.3, 1)
- 動かすのは clip-path だけにする。width / height / padding / border-radius は一切触らない(リフローさせない)
- 枠線が要る場合、border は clip-path で切り落とされて欠け部分に線が残らないことを前提に設計する。線を回り込ませたいなら background に線幅ぶんのグラデーションを敷いて同じ polygon で抜く
- prefers-reduced-motion: reduce では transition を切り、選択状態の形を最初から静的に出す`,
  ngExample: {
    say: "「ボタンの角をちょっと切り落として、ホバーで戻る感じにして」",
    why: "「切り落とす」だけでは45度の面取り(chamfer)なのか、正方形に噛み切るノッチなのかが決まらない。border-radiusで丸めただけの実装や、状態ごとに頂点数の違うpolygonを書いて補間が効かない実装が返ってくる。",
  },
  okExample: {
    say: "「notched cornerを実装。--notch: 12px を clip-path: polygon() で参照し、左上と右下だけ正方形に欠けさせる。頂点は12個固定（欠けない角も3点重ねて書く）。ホバー/選択で--notchを0に閉じ、clip-pathだけを0.5s cubic-bezier(0.7,0,0.3,1)で遷移。width/paddingは触らない」",
    why: "欠けの形(正方形)・深さ・対象の角・遷移対象を数値と単語で確定させている。とくに「頂点12個固定」の一言が、この動きで唯一壊れやすい補間の失敗を先に潰す。",
  },
  vocab: [
    {
      term: "clip-path: polygon()",
      desc: "頂点座標の並びで要素を切り抜く指定。角欠けはこれ1本で作れて、はみ出しも影も出ない。",
    },
    {
      term: "頂点数の一致",
      desc: "clip-pathが補間できるのは前後のpolygonの頂点数が同じときだけ。数が変われば補間を諦めて瞬時に切り替わる。",
    },
    {
      term: "ノッチとチャンファー",
      desc: "ノッチ(notch)は角を正方形に噛み切る形、チャンファー(chamfer)は45度に落とす面取り。同じ「角を削る」でも受ける印象が別物。",
    },
    {
      term: "--notch(CSS変数)",
      desc: "欠けの深さを1変数に集約しておくと、12個の頂点をcalc()で一斉に動かせる。JS側はこの1つを書き換えるだけで済む。",
    },
  ],
  related: ["corner-brackets", "pill-expand", "tab-indicator"],
};
