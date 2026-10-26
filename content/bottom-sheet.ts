import type { MotionEntry } from "@/lib/types";

export const bottomSheet: MotionEntry = {
  slug: "bottom-sheet",
  category: "ui",
  nameJa: "ボトムシート（下からせり上がり、引き下ろして閉じる）",
  nameEn: "bottom sheet / half modal / swipe-down sheet",
  lede: "画面の下端から紙を一枚せり上げ、上部の取っ手(グラバー)を指で引き下ろすと閉じるパネル。背後の画面を上に残したまま選択肢を出せるので、モバイルのサイズ選択・共有・絞り込みの定番になった。肝は「引いている間は指に1:1で付いてくる」「離した位置が一定の距離を越えていれば閉じ、届かなければ開いた位置へ戻る」の2つで、ここが無いと横から出るドロワーを下向きにしただけに見える。",
  params: [
    {
      key: "duration",
      label: "duration(せり上がる時間 s)",
      min: 0.15,
      max: 0.8,
      step: 0.01,
      default: 0.3,
      desc: "開く・閉じる・引き下ろしが届かず戻る、の3つに共通の時間。観察元は0.3s。0.25〜0.35sが軽快で、0.5sを超えると「選ぶ前に待たされる」部品になる。",
    },
    {
      key: "threshold",
      label: "threshold(閉じる引き下ろし距離 px)",
      min: 30,
      max: 160,
      step: 5,
      default: 80,
      desc: "グラバーを引き下ろして離したとき、この距離を越えていれば閉じる。観察元は80px。40px以下はリストを触ろうとしただけで誤って閉じ、シートの高さの半分を超えると「引いても閉じない」と感じられる。",
    },
    {
      key: "height",
      label: "height(シートの高さ %)",
      min: 40,
      max: 90,
      step: 1,
      default: 70,
      desc: "画面の高さに対するシートの高さ。観察元は min-height 70dvh(上限85dvh)。50%前後なら背後の画面が読めるハーフモーダル、85%を超えると全画面のモーダルと区別が付かなくなる。",
    },
    {
      key: "scrim",
      label: "scrim(背後の暗さ)",
      min: 0,
      max: 0.8,
      step: 0.05,
      default: 0.4,
      desc: "背後に敷く黒幕の不透明度。観察元は rgba(0,0,0,0.4)。0.3〜0.5で「背後はまだ在るが今は触れない」が伝わる。0にすると背後を押して閉じられることが分からない。",
    },
  ],
  promptTemplate: `モバイル向けの bottom sheet(ハーフモーダル)を実装してください。

- きっかけ: 画面上の「Open index」ボタンをクリック(タッチはタップ)すると開く。閉じるのは、シート上部のグラバー(またはヘッダー)を下へドラッグ(タッチは下スワイプ)して離したとき・背後の黒幕を押したとき・ヘッダーの×ボタン・Escape。開閉は操作したときだけ起こす(自動では動かさない)
- シートは画面の下端に position: fixed で置き、幅は画面いっぱい、高さは画面の {{height}}%。上の2つの角だけ角丸にし、上向きの影(0 -4px 24px rgba(0,0,0,0.18))を付ける。最上部に幅40px・高さ4px・角丸の取っ手(グラバー)を置く
- 閉じているとき: transform: translateY(100%)・opacity: 0。開くとき: translateY(0)・opacity: 1 へ、{{duration}}s cubic-bezier(0.12, 0.67, 0.53, 1) の transition で。閉じるときは同じ transition で逆へ戻す
- 背後に黒幕(rgba(0,0,0,{{scrim}}))を敷き、opacity 0→1 をシートと同じ {{duration}}s cubic-bezier(0.12, 0.67, 0.53, 1) で連動させる
- ドラッグ: pointerdown はグラバーとヘッダーの上でだけ受け付け(×ボタンの上は除く)、setPointerCapture する。その瞬間にシートの transition を切り、pointermove のたびに dy = max(0, 現在のclientY − 押したときのclientY) を transform: translateY(dy px) に書く(上へは動かさない)
- 離したとき(pointerup / pointercancel): インラインの transition と transform を外して CSS の transition に戻す。dy が {{threshold}}px を越えていれば閉じる(今いる位置から translateY(100%) へ流れる)。越えていなければ translateY(0) へ同じ transition で戻る
- グラバーとヘッダーには touch-action: none を当て、ドラッグがページのスクロールに奪われないようにする。リスト部分は普通にスクロールできるままにする
- 動かすのは transform / opacity だけ(bottom・height・top を動かさない)
- dialog 要素の showModal() を使うか、role="dialog"・aria-modal="true" を付け、開いたらシート内にフォーカスを移し、閉じたら開いたボタンにフォーカスを戻す
- prefers-reduced-motion 時は開閉と戻りの transition をすべて無くして即時に切り替える(ドラッグ中の指への追従はそのまま残し、離した瞬間に開いた位置か閉じた状態へ即座に移す)`,
  ngExample: {
    say: "「スマホで下から出てくるメニューを作って。スワイプで閉じられるように」",
    why: "下から出るだけのモーダルに、指を離したあとで判定する swipe イベント(上下どちらかへ動いたら即閉じる)が付いた実装が返ってきやすい。引いている間にシートが指に付いてこないので掴んだ手応えが無く、少し触っただけで閉じる誤爆も起きる。高さの指定が無いと全画面で出てきて、背後の画面を残す意味も消える。",
  },
  okExample: {
    say: "「bottom sheetを。高さ70%、translateY(100%)→0を0.3s cubic-bezier(0.12,0.67,0.53,1)で上げ、黒幕0.4を同じ時間で連動。グラバーをpointerdownしたらtransitionを切ってtranslateY(max(0,dy))で指に追従、離して80pxを越えていれば閉じ、越えていなければ0へ戻す。reduced-motionでは即時」",
    why: "「指に付いてくる区間」と「離した瞬間の距離判定」を分けて数値で書いているので、掴んで引き下ろす手応えと、届かなければ戻る返事の両方が出る。dy を max(0, …) で下向きだけに絞っているので、上へ引いて画面から浮く崩れも起きない。",
  },
  vocab: [
    {
      term: "ボトムシート(bottom sheet)",
      desc: "画面の下端からせり上がるパネル。Material Design の呼び名で、iOS では sheet、日本の現場ではハーフモーダルとも呼ぶ。背後の画面を残したまま追加の選択肢を出す。",
    },
    {
      term: "グラバー(grabber / drag handle)",
      desc: "シート上端に置く、幅40px前後の短い横棒。「ここを掴んで引ける」ことを示す取っ手で、ドラッグの受け口もここに絞る。",
    },
    {
      term: "dismiss threshold",
      desc: "引き下ろして離したとき、閉じるか戻るかを分ける距離。px 固定(80px前後)か、シートの高さの割合で決める。",
    },
    {
      term: "スクリム(scrim)",
      desc: "モーダルの背後に敷く半透明の黒幕。背後がまだ在ることを見せつつ、今は操作できないことを伝える。押すと閉じるのが作法。",
    },
    {
      term: "デテント(detent)",
      desc: "シートが止まれる高さの段。iOS の medium / large のように半分と全体の2段を持たせる型もある。この項目は1段(開くか閉じるか)の基本形。",
    },
  ],
  titleAct: { act: "toast-slide", map: { duration: "duration" } },
  aliases: ["ハーフモーダル", "にゅっ", "スッと下がる", "下から出る", "引き下ろす"],
  related: ["drawer-slide", "swipe-dismiss", "modal-pop", "toast-slide"],
};
