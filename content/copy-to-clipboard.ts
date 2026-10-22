import type { MotionEntry } from "@/lib/types";

export const copyToClipboard: MotionEntry = {
  slug: "copy-to-clipboard",
  category: "ui",
  nameJa: "コピー完了フィードバック（押した場所に「コピーしました」）",
  nameEn: "copy to clipboard feedback / copy button animation / copied tooltip",
  lede: "コピーボタンを押した瞬間にボタンの背景が成功色で光って引き、ボタンの真上から「コピーしました」が少し浮いて消える演出。クリップボードは目に見えないので、押した場所で返さないと「本当にコピーされたのか」をユーザーが確かめに行く。肝は押すたびに頭から再生し直すことと、失敗も同じ場所で返すこと。",
  params: [
    {
      key: "flash",
      label: "flash(背景の光が引く時間 s)",
      min: 0,
      max: 1.2,
      step: 0.01,
      default: 0.47,
      desc: "成功色を一瞬で乗せ、この時間で ease-out に透明へ戻す。0.4〜0.5sが「押した手応え」として読める(観察元は0.47s)。0で光らせない。0.8sを超えるとボタンが選択状態になったように見える。",
    },
    {
      key: "rise",
      label: "rise(ラベルの浮き上がり px)",
      min: 0,
      max: 24,
      step: 1,
      default: 5,
      desc: "「コピーしました」がボタンの上で浮く距離。4〜8pxで「ボタンから出てきた」と読める。16pxを超えると飛んでいく別の通知に見え、ボタンとの結び付きが切れる。0だとその場でフェードするだけ。",
    },
    {
      key: "hold",
      label: "hold(ラベルが消え始めるまで s)",
      min: 0.2,
      max: 2.5,
      step: 0.05,
      default: 0.7,
      desc: "ラベルを読ませる時間。この後0.8sかけて消える。「コピーしました」程度の短さなら0.6〜1s。0.4s未満は読み切れず、2sを超えると次のコピーの邪魔になる。",
    },
    {
      key: "feedback",
      label: "feedback(返し方)",
      min: 0,
      max: 2,
      step: 1,
      default: 0,
      options: ["float-label", "icon-swap", "both"],
      desc: "float-labelはボタンの上に文字を浮かべる(観察元)。icon-swapはクリップボードのアイコンをチェックに入れ替えて hold+0.8s 後に戻す(GitHubのコードブロック型)。アイコンだけのボタンが密集する場所はicon-swap、意味を言葉で伝えたい場所はfloat-labelかboth。",
    },
  ],
  promptTemplate: `コピーボタンに copy to clipboard feedback を実装してください。

- クリックで navigator.clipboard.writeText(コピーする文字列) を await し、成功なら success、例外なら error の状態にする。状態は1つの変数で持つ
- 押すたびに演出を頭から再生し直す。状態を一度空にしてから次のフレームで success / error を入れ直すか、フィードバック要素の key を毎回変えて作り直す(連打しても2回目以降が無反応にならないように)
- 返し方は {{feedback}}。float-label ならボタンの真上(bottom: 150%・left: 50%・translateX(-50%))に「コピーしました」を出し、icon-swap ならクリップボードのアイコンをチェックに 0.2s で入れ替える(both は両方)
- ボタンの背景は成功色を 0% のキーフレームにだけ置き、{{flash}}s の ease-out で透明に戻す(光って引く)。error のときは同じ動きを赤で行う
- ラベルは {{hold}}s + 0.8s かけて translateY(0 → -{{rise}}px) を ease-out で浮かせ、{{hold}}s 待ってから 0.8s の ease-in で opacity 0 にする。終わったら要素を外す(fill-mode を付けずに終わると一瞬戻って見える)。icon-swap のアイコンも同じ {{hold}}s + 0.8s 後に元へ戻す
- writeText が拒否されたら(http・埋め込みの iframe・権限なし)、コピー対象の文字列を選択して document.execCommand("copy") で1回だけ再挑戦する。それも失敗したら error にし、ラベルを「コピーできませんでした」にして選択状態を残し、手動コピー(⌘C / Ctrl+C)へ逃がす
- 結果は aria-live="polite" のテキストで読み上げる。ボタンはアイコンだけでも aria-label="コピー" を付け、押したあともフォーカスをボタンに残す
- 動かすのは transform / opacity / background-color だけにし、ボタンの幅は変えない
- prefers-reduced-motion 時は光と浮き上がりを出さず、ラベル(またはチェック)を {{hold}}s + 0.8s のあいだ静止表示してから消す`,
  ngExample: {
    say: "「コピーボタンを押したら、コピーできたって分かるようにして」",
    why: "画面の端にトーストを出す実装が返ってきやすく、押した場所から視線が外れて「どれをコピーしたのか」が結び付かない。表示が状態の切り替えだけで作られると、2回目以降のクリックでは何も再生されず壊れて見える。writeText の失敗を拾っていない実装も多く、http 環境ではコピーされていないのに「コピーしました」と出る。",
  },
  okExample: {
    say: "「copy to clipboard feedbackを。writeTextをawaitしてsuccess/error。押すたびに状態を空にしてから入れ直して頭から再生。背景は成功色を0%にだけ置き0.47s ease-outで引く。ボタンの真上に『コピーしました』、1.5sで5px浮かせ0.7s後から0.8sで消して要素を外す。失敗は赤で光らせて文字列を選択状態に。aria-live=polite、reduced-motionでは静止表示」",
    why: "返す場所(ボタンの真上)・光と浮き上がりの数値・消すタイミングに加えて、「押すたびに頭から」と「失敗の逃げ道」が指定されている。この2つが無いと、連打で無反応になる実装と、失敗しても成功と言う実装が普通に返ってくる。",
  },
  vocab: [
    {
      term: "Clipboard API(navigator.clipboard.writeText)",
      desc: "文字列をクリップボードへ書き込む非同期API。Promiseを返し、https などの安全なコンテキストとユーザー操作の中でしか成功しない。拒否されると例外になるので、結果を見てから成功表示を出す。",
    },
    {
      term: "インプレースフィードバック(in-place feedback)",
      desc: "操作の結果を、操作した要素の上や中で返すこと。画面端のトースト(toast)より視線移動が無く、どのボタンの結果かが一目で結び付く。",
    },
    {
      term: "アニメーションの再トリガー(restart)",
      desc: "同じクラスを付けっぱなしにしても CSS アニメーションは2度目を再生しない。クラスを外して次のフレームで付け直す、または key を変えて要素を作り直すと頭から再生される。",
    },
    {
      term: "片側キーフレーム(from だけ指定)",
      desc: "@keyframes に 0% だけ書くと、その値から要素の通常のスタイルへ補間される。「一瞬光って元に戻る」を1行で書ける(観察元の背景フラッシュはこの書き方)。",
    },
    {
      term: "aria-live=\"polite\"",
      desc: "中身が変わったときに、読み上げ中の内容を遮らずに読み上げさせる属性。見た目だけのラベルでは、スクリーンリーダーにコピーの成否が伝わらない。",
    },
  ],
  related: ["stateful-button", "toast-slide", "tooltip-pop", "press-feedback"],
};
