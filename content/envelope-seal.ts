import type { MotionEntry } from "@/lib/types";

export const envelopeSeal: MotionEntry = {
  slug: "envelope-seal",
  category: "ui",
  nameJa: "封筒に封をする（手紙をしまってフタを閉じる）",
  nameEn: "envelope animation / letter into envelope / envelope flap close / seal and send",
  lede: "送信を押すと、書いた手紙が縮みながら開いた封筒の中へ沈み、三角のフタが上の辺を蝶番にして手前へ倒れて閉じ、封蝋がぽんと押されてから封筒ごと飛んでいく送信演出。フタが閉じる直前にフタを手紙より手前の層へ入れ替えるのが肝で、ここを外すと手紙の上にフタが透けて「しまった」に見えない。",
  params: [
    {
      key: "tuckDuration",
      label: "tuckDuration(手紙が封筒へ沈む時間 s)",
      min: 0.6,
      max: 2,
      step: 0.05,
      default: 1.25,
      desc: "1〜1.4sで「たたんでしまう」手つきに見える。7割の時点で封筒の口の大きさ(36%)まで縮め、残りで中へ沈めて消す。0.8sを切ると吸い込まれたように見え、1.8sを超えると送信の反応が鈍い。",
    },
    {
      key: "flapDuration",
      label: "flapDuration(フタが倒れて閉じる時間 s)",
      min: 0.25,
      max: 1.2,
      step: 0.05,
      default: 0.55,
      desc: "rotateX(180deg)→0 を ease-in-out で。0.45〜0.7sで紙の重さが出る。0.3sを切るとパタンと跳ね、1sを超えるとフタだけ浮いて見える。",
    },
    {
      key: "sealOvershoot",
      label: "sealOvershoot(封蝋が押されるときの行き過ぎ)",
      min: 1,
      max: 2.4,
      step: 0.02,
      default: 1.56,
      desc: "封蝋の scale 0→1(0.35s)に使う cubic-bezier(0.34, この値, 0.64, 1) の2つ目の y。1.4〜1.7で一度ふくらんで戻る「ぽん」になる。1だと膨らまずに置かれるだけ、2を超えるとゴムのように弾む。",
    },
    {
      key: "flyDuration",
      label: "flyDuration(封筒が飛び去る時間 s)",
      min: 0.5,
      max: 2,
      step: 0.05,
      default: 0.9,
      desc: "出だしが遅く後半で加速する cubic-bezier(0.55, 0, 0.75, 0.2)。0.8〜1.1sで「手を離れて出ていった」になる。0.6sを切ると消えたように見え、1.6sを超えると送信完了までが待ち時間になる。",
    },
  ],
  promptTemplate: `お問い合わせフォームの送信に envelope animation(手紙を封筒にしまい、フタを閉じて封をして送る)を実装してください。

- きっかけ: 「Seal and send」ボタンへの click / タップで1回再生する。再生中のクリックは無視する。封筒が飛び去って 0.9s 後に新しい手紙を 0.4s で下から戻す。戻ってから 3s 何もされなければ自動で送る(無操作でも繰り返す。最初の表示のときだけ 6s 待つ)
- 封筒は3枚の部品で組む: 裏(z-index 0・暗めの紙色)/ 表(z-index 20・clip-path: polygon(0 32%, 50% 66%, 100% 32%, 100% 100%, 0 100%) で上辺をV字に切った前ポケット)/ フタ(上辺を蝶番にした三角形・clip-path: polygon(0 0, 100% 0, 50% 100%)・高さは封筒の66%・transform-origin: 50% 0)。手紙は z-index 10 で裏と表の間に置く
- 押した瞬間: 開いた状態の封筒(フタは rotateX(180deg) で上に起きて手紙の後ろ= z-index 5)を 0.15s 遅れて 0.5s ease-out で translateY(40px)・opacity 0 → 定位置へ出す
- 同時に手紙を {{tuckDuration}}s cubic-bezier(0.65, 0, 0.35, 1) で縮めて沈める: rotate(-0.6deg) → 70% で translateY(18%) scale(0.36)・opacity 1 → 100% で translateY(34%) scale(0.32)・opacity 0(transform-origin: 50% 0)
- 手紙が沈みきった 0.05s 後にフタの層を z-index 30(表より手前)へ入れ替え、さらに 0.05s 後から {{flapDuration}}s ease-in-out でフタを rotateX(180deg) → rotateX(0deg) に倒して閉じる(親に perspective: 900px)
- フタが閉じた 0.05s 後に、フタの先端(上から66%・中央)へ封蝋(丸・直径 3.6rem 程度)を 0.35s cubic-bezier(0.34, {{sealOvershoot}}, 0.64, 1) で scale(0) → scale(1) に押す
- 封蝋が押された 0.15s 後に、封筒全体(裏・表・フタ・封蝋を同じ値で)を {{flyDuration}}s cubic-bezier(0.55, 0, 0.75, 0.2) で translate(70cqw, -55cqh) rotate(-14deg) scale(0.7)・opacity 0 へ飛ばす(舞台を container-type: size にする。fill-mode は forwards)
- 全部 transform・opacity・z-index の切り替えだけで動かす(width / top を動かさない=リフロー禁止)
- 飛び去りに合わせて「Sent」の小さな表示を出し、完了を言葉でも伝える
- prefers-reduced-motion 時は縮める・フタ・封蝋・飛行・自動再生をすべて止め、押したら手紙を 0.2s の opacity だけで消して「Sent」を出す。もう一度押すと元に戻す`,
  ngExample: {
    say: "「送信したら手紙が封筒に入って飛んでいく感じにして」",
    why: "「封筒に入る」の中身が決まらないので、封筒のアイコンが手紙の上にフェードで重なるだけか、手紙が縮んで消えた後に閉じた封筒が出てくる実装が返る。フタが蝶番で倒れる動きと、閉じる直前の層の入れ替えが抜けて、手紙の上にフタが透けるか、そもそも「しまった」瞬間が見えない。",
  },
  okExample: {
    say: "「envelope animationで。手紙を1.25s cubic-bezier(.65,0,.35,1)で scale(0.32) まで縮めて裏と表の間に沈め、フタの層を z-index 30 に上げてから0.55s ease-in-outで rotateX(180→0deg)。封蝋は0.35s cubic-bezier(.34,1.56,.64,1)、最後に0.9sで右上へ飛ばす」",
    why: "手紙をはさむ3枚の層の順番と、フタを手前に入れ替える時刻、各段の時間とイージングを値で指定した。「沈める→閉じる→押す→出す」の4拍が重ならずに並ぶので、1通を封をして出した手応えになる。",
  },
  vocab: [
    {
      term: "rotateX + transform-origin: top",
      desc: "上の辺を軸にX軸回転させる指定。180deg で上に起きたフタが 0deg まで手前に倒れ、蝶番で閉じる動きになる。親に perspective が要る。",
    },
    {
      term: "z-index swap(層の入れ替え)",
      desc: "動きの途中で重なり順を切り替える組み方。開いている間は手紙の後ろ、閉じる直前に手紙と前ポケットより手前へ上げる。",
    },
    {
      term: "clip-path: polygon()",
      desc: "多角形で要素を切り抜く指定。画像なしで三角のフタと、上辺をV字に切った前ポケットを作れる。",
    },
    {
      term: "overshoot(行き過ぎ)",
      desc: "目標の値を一度越えてから戻る動き。cubic-bezier の y を1より大きくすると出る。封蝋が「ぽん」と押された感触になる。",
    },
    {
      term: "ease-in(加速)",
      desc: "出だしが遅く終わりが速いイージング。手を離れた封筒が勢いを付けて出ていく様子。ここでは cubic-bezier(0.55, 0, 0.75, 0.2)。",
    },
  ],
  titleAct: { act: "page-turn", map: { duration: "flapDuration*2", perspective: 900, shade: 35 } },
  aliases: ["封筒", "パタン", "ぽん", "封蝋", "手紙をしまう"],
  related: ["paper-plane-send", "stamp-in", "gift-box-reveal", "page-turn"],
};
