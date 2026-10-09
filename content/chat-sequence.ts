import type { MotionEntry } from "@/lib/types";

export const chatSequence: MotionEntry = {
  slug: "chat-sequence",
  category: "ui",
  nameJa: "チャットの会話再生（入力中→吹き出し）",
  nameEn: "chat sequence / animated chat conversation / chat bubble animation / typing then message",
  lede: "相手側の吹き出しの前に「入力中」の点を出し、文の長さに応じた時間だけ待たせてから吹き出しに差し替え、読む間を置いて次へ進む会話の再生。全文を一度に並べると読み物になるが、入力時間と読む間を挟むだけで「いま話しかけられている」体験に変わる。AIプロダクトのLPやプロフィールの自己紹介で定番になった。",
  params: [
    {
      key: "baseTyping",
      label: "baseTyping(入力中の最低時間 s)",
      min: 0.3,
      max: 2,
      step: 0.1,
      default: 0.9,
      desc: "どんなに短い文でもこれだけは点を見せる。0.8〜1.0sが自然。0.5s未満だと点が一瞬ちらつくだけで「入力中」と読めない。",
    },
    {
      key: "perChar",
      label: "perChar(1文字ごとに足す時間 ms)",
      min: 0,
      max: 60,
      step: 2,
      default: 22,
      desc: "長い文ほど長く打っているように見せる。20〜30msが目安。0にすると長文も短文も同じ間で出て、打っている感じが消える。合計は2.4sで頭打ちにする。",
    },
    {
      key: "readPause",
      label: "readPause(吹き出しの後の読む間 s)",
      min: 0.3,
      max: 3,
      step: 0.1,
      default: 1.2,
      desc: "吹き出しが出てから次の発言を始めるまで。1.2〜1.3sで1行を読み切れる。0.6s未満だと読む前に次が来て、ログが流れるだけになる。",
    },
    {
      key: "enter",
      label: "enter(吹き出しが現れる時間 s)",
      min: 0.1,
      max: 0.8,
      step: 0.05,
      default: 0.4,
      desc: "下から数px浮きながらフェードインする時間。0.25〜0.5sが自然。0.6sを超えると吹き出しがもったりと遅れて見える。",
    },
  ],
  promptTemplate: `会話の吹き出しを順番に再生する chat sequence を実装してください。

- 発言の配列を順に1つずつ追加する。相手側(左)の発言の前には、同じ位置に3点の typing indicator の吹き出しを出す
- typing indicator を見せる時間は min(2.4, {{baseTyping}} + 文字数 × {{perChar}}ms)s とし、経過したら indicator を取り除いて同じ位置に本文の吹き出しを差し込む
- 自分側(右)の発言は indicator を出さず、そのまま差し込む
- 吹き出しが出たら {{readPause}}s 待ってから次の発言を始める
- 吹き出し(と indicator)の出現は opacity 0→1 と translateY(8px→0) を {{enter}}s、cubic-bezier(.22,1,.36,1) で行う。transform と opacity だけで動かす
- 会話欄は高さ固定で、新しい発言が下に足されると古い発言が上へ押し出されるようにする(常に最新が見える)
- タイマーは1か所で管理し、欄が画面外に出た・閉じられたときは予約を全部取り消す
- 会話欄に role="log" と aria-live="polite" を付け、本文の吹き出しだけを読み上げ対象にする(indicator は aria-hidden)
- prefers-reduced-motion 時は indicator もフェードも使わず、全発言を最初から並べて表示する`,
  ngExample: {
    say: "「チャットっぽく、メッセージが順番に出てくるようにして」",
    why: "全メッセージに同じ animation-delay を等間隔で振っただけの実装が返ってくる。入力中の点が無く、長い文も短い文も同じ間で出るので、会話ではなく「箇条書きが順にフェードインしている」ようにしか見えない。読む間も無いまま次が来る。",
  },
  okExample: {
    say: "「chat sequenceで。相手の発言の前にtyping indicatorを min(2.4s, 0.9s+文字数×22ms) だけ出して本文に差し替え、出たら1.2s読む間を置いて次へ。自分の発言はindicatorなし。出現は8px浮きながら0.4sでフェード。欄は高さ固定で古い発言が上へ押し出される。role=log、reduced-motionでは全文を静的表示」",
    why: "入力時間を「最低値＋文字数比例＋上限」の式で、読む間と出現の速さを数値で渡している。式があることで長文は少し長く打つ自然なリズムになり、上限が長文で待たせすぎる事故を防ぐ。",
  },
  vocab: [
    {
      term: "typing indicator",
      desc: "相手が入力中であることを示す3点の吹き出し。本文と同じ位置・同じ形で出し、そのまま本文に差し替えると「打ち終わって送られた」と読める。",
    },
    {
      term: "文字数比例の待ち時間",
      desc: "入力中を見せる時間を文の長さに比例させること。最低値と上限を挟まないと、短文では点がちらつき、長文では待たされる。",
    },
    {
      term: "読む間(read pause)",
      desc: "吹き出しが出てから次の発言を始めるまでの空白。会話のテンポを決める一番大きな値で、短いとログが流れるだけになる。",
    },
    {
      term: "role=\"log\"",
      desc: "新しい内容が末尾に足されていく領域を示すARIAロール。aria-live と組み合わせると、追加された発言だけがスクリーンリーダーで読み上げられる。",
    },
  ],
  related: ["dots-pulse", "typewriter", "list-add-remove", "toast-slide"],
};
