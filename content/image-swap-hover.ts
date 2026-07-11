import type { MotionEntry } from "@/lib/types";

export const imageSwapHover: MotionEntry = {
  slug: "image-swap-hover",
  category: "hover",
  nameJa: "画像スワップホバー",
  nameEn: "image swap on hover",
  lede: "ワークス一覧のサムネイルにホバーすると2枚目の画像に切り替わる動き。「表はビジュアル、裏は現場写真」のように情報量を倍にできる定番。切替方式はopacityのクロスかクリップのワイプ。",
  params: [
    {
      key: "duration",
      label: "duration(切替時間 s)",
      min: 0.15,
      max: 0.8,
      step: 0.05,
      default: 0.3,
      desc: "0.25〜0.4sが自然。速すぎると点滅に、遅いと2枚が混ざった状態が目立つ。",
    },
    {
      key: "mode",
      label: "mode(切替方式)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["crossfade", "clip-wipe"],
      desc: "crossfadeは溶けるように、clip-wipeは左から拭き取るように切り替わる。",
    },
  ],
  promptTemplate: `ワークス一覧のカードに image swap on hover を実装してください。

- カード内に画像を2枚重ねる。下が通常時、上がホバー時の画像
- 切替方式は {{mode}}
  - crossfade の場合: 上の画像を opacity 0→1 で {{duration}}s かけてフェードインする
  - clip-wipe の場合: 上の画像を clip-path: inset(0 100% 0 0) から inset(0) へ {{duration}}s で開く
- マウスが離れたら同じ duration で元に戻す
- 2枚とも同じ枠に object-fit: cover で敷き、切替中にレイアウトが動かないようにする
- 上の画像は最初から読み込んでおく(ホバー時に src を差し替えるとチラつく)
- prefers-reduced-motion 時はアニメーションなしで即時切り替える`,
  ngExample: {
    say: "「ホバーしたら画像が変わるようにして」",
    why: "ホバー時に img の src を差し替えるだけの実装が返ってきがち。2枚目が未読込だと一瞬白くチラつき、切替アニメーションも付かない。重ねて opacity か clip で切り替えるのが正解と伝わらない。",
  },
  okExample: {
    say: "「image swap on hoverを実装。2枚を重ねて上をopacity 0→1の0.3sでクロス、両方object-fit: cover、2枚目は事前読込、leaveで戻す」",
    why: "重ね方式・切替プロパティ・数値・事前読込まで指定。「srcを差し替えない」ことが品質の分かれ目なので、実装構造から指示する。",
  },
  vocab: [
    {
      term: "crossfade",
      desc: "2枚を重ねてopacityで溶かすように切り替える方式。もっとも汎用的で失敗が少ない。",
    },
    {
      term: "clip-path: inset()",
      desc: "要素を矩形で切り抜くCSS。insetの右辺を100%→0にすると左から拭き取るワイプになる。",
    },
    {
      term: "事前読込",
      desc: "2枚目を最初からDOMに置いて読み込ませておくこと。ホバー時のsrc差し替えはチラつきの元。",
    },
    {
      term: "object-fit: cover",
      desc: "縦横比の違う画像を枠いっぱいに敷き詰める指定。2枚のサイズ差を吸収し切替中のズレを防ぐ。",
    },
  ],
  related: ["image-zoom-hover", "crossfade", "duotone-hover"],
};
