import type { MotionEntry } from "@/lib/types";

export const asciiEffect: MotionEntry = {
  slug: "ascii-effect",
  category: "media",
  nameJa: "ASCIIエフェクト",
  nameEn: "ASCII effect / ASCII art filter",
  lede: "映像や図形の明るさを1マスずつ読み取り、濃さの順に並べた文字へ置き換えて描き直す表現。元の動きはそのまま残るのに絵が文字の粒に崩れるので、ターミナル的な硬質さとレトロな体温が同時に出る。",
  params: [
    {
      key: "cell",
      label: "cell(1文字のセル幅 px)",
      min: 4,
      max: 16,
      step: 1,
      default: 8,
      desc: "小さいほど解像度が上がり元絵に近づく。6〜10pxが「文字だと分かるが形も読める」境目。4pxまで下げると文字に見えず、ただのざらついた画像になる。",
    },
    {
      key: "ramp",
      label: "ramp(文字ランプ)",
      min: 0,
      max: 2,
      step: 1,
      default: 0,
      options: ["standard(10段階)", "dense(65段階)", "blocks(░▒▓█)"],
      desc: "暗→明の順に並べた文字列。段階が多いほど階調は滑らかだが字面がうるさくなる。ブロック罫線は文字感が消える代わりに面として読める。",
    },
    {
      key: "contrast",
      label: "contrast(コントラスト)",
      min: 0.6,
      max: 2.4,
      step: 0.1,
      default: 1.3,
      desc: "輝度に掛ける係数。1.2〜1.5で中間調が締まり形が立つ。2を超えると白飛び・黒潰れして文字が2種類しか出なくなる。",
    },
    {
      key: "fps",
      label: "fps(描き換えレート)",
      min: 8,
      max: 60,
      step: 2,
      default: 24,
      desc: "毎フレーム描き換える必要はない。20〜30fpsに落とすと文字の入れ替わりがコマ落ち風になり、むしろ「端末で処理している」質感が出る。",
    },
  ],
  promptTemplate: `映像に ASCII effect(明るさを文字に置き換えて描画するフィルタ)を実装してください。

- 元の映像(<video>や<canvas>)は display:none で持ち、表示するのは出力用の<canvas>だけにする
- 出力canvasの上に cell={{cell}}px 幅のグリッドを敷く。セル高さは等幅フォントの縦横比に合わせて cell×1.8 とする
- 元映像を cols×rows(=グリッドと同じ極小サイズ)のオフスクリーンcanvasへ drawImage で縮小し、getImageData は必ずこの極小canvasに対してだけ呼ぶ(実寸で読むと毎フレームのピクセル読み出しで落ちる)
- 取得したRGBから輝度 L = (0.299R + 0.587G + 0.114B) / 255 を求め、L = clamp((L - 0.5) × {{contrast}} + 0.5, 0, 1) で補正する
- L を暗い順に並べた文字ランプ({{ramp}})の添字に写像し、ctx.fillText でセル中央に1文字ずつ描く
- 描き換えは {{fps}}fps に間引く(前回描画からの経過時間で判定し、満たない frame は早期 return する)
- getImageData を使うコンテキストは getContext("2d", { willReadFrequently: true }) で取る
- フォントは等幅を必ず指定する(プロポーショナルだと桁が揃わず絵が崩れる)
- prefers-reduced-motion 時は元映像を一時停止し、静止した1フレームだけをASCII化して表示する(文字のちらつきを完全に止める)`,
  ngExample: {
    say: "「動画をASCIIアートっぽくして」",
    why: "セルの大きさも文字ランプも決まらないので、絵が読めない極小セルか、逆に文字が数個しか出ない粗さかのどちらかに振れる。実寸canvasに毎フレーム getImageData を掛ける実装が返ってきて、そのままフレーム落ちすることも多い。",
  },
  okExample: {
    say: "「ASCII effectを実装。cell 8px・セル高さ×1.8、元映像はcols×rowsに縮小してからgetImageData(willReadFrequently)、輝度を10段階ランプに写像してfillText。24fpsに間引き、reduced-motion時は静止1フレームのみ」",
    why: "「縮小してから読む」というボトルネックの回避策と、輝度→文字の写像規則・間引きレートまで指定している。ASCII化はアルゴリズムより読み出し設計で品質が決まるので、そこを名指しできると実装が一発で通る。",
  },
  vocab: [
    {
      term: "文字ランプ(character ramp)",
      desc: "暗い順に並べた文字列。ASCII化とは輝度をこの並びの添字に写像することそのもの。",
    },
    {
      term: "輝度(luminance)",
      desc: "RGBを人の感度で重み付けした明るさ。0.299R+0.587G+0.114Bが定番で、単純平均より見た目に合う。",
    },
    {
      term: "ダウンサンプリング",
      desc: "元映像をグリッドと同じ極小サイズへ縮小すること。drawImageの縮小がセル平均の代わりになり、自前の平均計算が要らなくなる。",
    },
    {
      term: "willReadFrequently",
      desc: "getContext(\"2d\") のオプション。毎フレーム getImageData する用途ではこれを立てないとGPU↔CPU往復で重くなる。",
    },
    {
      term: "等幅フォント(monospace)",
      desc: "全文字が同じ送り幅を持つフォント。桁が揃うことがASCII表現の前提で、縦横比はおよそ1:1.8。",
    },
  ],
  related: ["grain-overlay", "scanlines", "sprite-sheet"],
};
