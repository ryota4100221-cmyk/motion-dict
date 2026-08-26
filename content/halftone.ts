import type { MotionEntry } from "@/lib/types";

export const halftone: MotionEntry = {
  slug: "halftone",
  category: "media",
  nameJa: "ハーフトーン",
  nameEn: "halftone / halftone dots / print screen",
  lede: "絵や文字の濃さを網点(大小の丸)の粒に置き換えて刷り直す表現。カーソルが近づくと網点が太り、色版が左右にズレて印刷の版ズレのように見えるのが動きの核で、静止画のままでは出せない「刷り物の生々しさ」が出る。",
  params: [
    {
      key: "gap",
      label: "gap(網点の間隔 px)",
      min: 4,
      max: 16,
      step: 1,
      default: 8,
      desc: "網点1個あたりのマス目。6〜10pxが「粒だと分かるが元の形も読める」境目。4pxまで詰めると粒に見えず、ただの元絵に戻る。",
    },
    {
      key: "angle",
      label: "angle(スクリーン角度 deg)",
      min: 0,
      max: 90,
      step: 5,
      default: 45,
      desc: "網点を並べる格子の傾き。印刷では45°が最も粒を意識させない定番。0°や90°にすると縦横の列が揃って見え、元絵の直線と干渉してモアレが出やすい。",
    },
    {
      key: "separation",
      label: "separation(色版のズレ量 px)",
      min: 0,
      max: 8,
      step: 0.5,
      default: 3,
      desc: "カーソル直下で2色の版を左右にどれだけズラすか。2〜4pxで「刷りがズレた」と読める。8pxまで開くと版ズレではなく別々の絵が3枚並んでいるように見える。",
    },
    {
      key: "reach",
      label: "reach(カーソルの効く半径 px)",
      min: 40,
      max: 320,
      step: 10,
      default: 150,
      desc: "カーソルからこの距離までが反応する。120〜180pxが「手元だけが濡れて滲む」感じになる。300pxに広げると画面全体が常時ズレて、変化が読めなくなる。",
    },
  ],
  promptTemplate: `画像またはテキストに halftone(網点化)を実装してください。

- 元の絵は display:none のオフスクリーンcanvasに描き、表示するのは出力用の<canvas>だけにする
- オフスクリーンは getContext("2d", { willReadFrequently: true }) で取り、getImageData はリサイズ時に1回だけ呼ぶ(毎フレーム読むとGPU↔CPU往復で落ちる)
- 網点の格子は {{gap}}px 間隔で、{{angle}}度だけ回転させて敷く。格子点(i, j)の座標は中心からの (i×gap, j×gap) を回転行列で回して求め、その位置の画素を読む
- 各点の輝度 L =(0.299R + 0.587G + 0.114B) / 255 から半径 r =(1 - L) × gap × 0.46 を求め、arc で塗る。係数を 0.5 未満に抑えて隣の網点と接触させない(潰れて面になると粒も版ズレも読めない)。r が 0.3px 未満の点は描かない(薄い側が汚れる)
- カーソルからの距離 d が {{reach}}px 以内の点は近接度 k = 1 - d / {{reach}} を求め、r に k を上乗せして太らせる
- k > 0 の点にはさらに2色の版を重ねる。同じ半径の円を x 方向に ±({{separation}} × k)px ズラして2色で先に塗り、その上から本来の色の円を塗る(印刷の版ズレ=misregistration)
- 描画は requestAnimationFrame の中だけで行い、pointermove ではカーソル座標の保存しかしない
- devicePixelRatio は Math.min(dpr, 2) で頭打ちにする(網点は点数が多く、3倍解像度では描画コストが跳ねる)
- タッチでは pointermove が拾えるとは限らないので、touchstart / touchmove でも同じ座標更新を行う
- prefers-reduced-motion 時はカーソル追従と版ズレを完全に止め、網点化しただけの静止画を1枚描いて終わりにする`,
  ngExample: {
    say: "「画像をハーフトーンっぽく、印刷みたいな質感にして」",
    why: "「印刷みたい」だけでは網点の間隔も角度も決まらず、粒が細かすぎて元画像と区別がつかないものか、粗すぎて何の絵か読めないものに振れる。CSSのradial-gradientを敷いただけの「点の模様が上に乗った画像」で済まされることも多い。",
  },
  okExample: {
    say: "「halftoneをcanvasで実装。格子は8px間隔・45度回転、輝度から半径 r=(1-L)×gap×0.46 で網点を描く。カーソル半径150px以内は近接度で粒を太らせ、2色の版を±3pxズラして版ズレを出す。getImageDataはリサイズ時のみ、reduced-motion時は静止1枚」",
    why: "網点の間隔・角度・半径の決め方という「絵の質を決める式」と、getImageDataを毎フレーム呼ばせないという性能上の禁止事項を両方名指ししている。ハーフトーンはアルゴリズムより格子の設計と読み出し回数で仕上がりが決まるので、そこを指定できると一発で通る。",
  },
  vocab: [
    {
      term: "網点(halftone dot)",
      desc: "濃淡を点の大小に置き換えた粒。印刷は濃いインクと紙の白しか持てないため、面積比で中間調を作る。",
    },
    {
      term: "スクリーン角度(screen angle)",
      desc: "網点を並べる格子の傾き。単色なら45°が定番で、CMYKでは版ごとに15/75/0/45°とズラしてモアレを避ける。",
    },
    {
      term: "版ズレ(misregistration)",
      desc: "多色刷りで色版の位置が合わず、輪郭から別の色がはみ出す刷り事故。意図して出すとレトロな印刷らしさになる。",
    },
    {
      term: "輝度(luminance)",
      desc: "RGBを人の感度で重み付けした明るさ。0.299R+0.587G+0.114Bが定番で、網点の半径はこの値から引く。",
    },
    {
      term: "willReadFrequently",
      desc: "getContext(\"2d\") のオプション。画素を読む用途のcanvasに立てる。網点化では読み出しは1回で済むので、読む側のcanvasにだけ付ける。",
    },
  ],
  related: ["ascii-effect", "moire-drift", "duotone-hover"],
};
