import {
    useEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
    type ReactNode,
} from "react"
import * as FramerNS from "framer"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
// useRouter は型定義に無いがランタイムには在る（Framer の公開サイトで確認）。無ければ null を返す
const useRouter: () => any = (FramerNS as any).useRouter || (() => null)

// 一覧 v2（2026-10-24）
// 旧版からの変更（独立レビュー3本の指摘を反映）:
//  ・動画は録画v2（ステージ全面・16:9・60fps）。旧版の scale(2.3) 切り抜きは廃止（ボケ・見切れの原因）
//  ・ポスターは「見せ場」のフレーム。<img loading=lazy> で出し、<video> は再生する1枚にだけ載せる
//  ・検索とカテゴリのバーは画面上部に貼り付く（195件・PC 23,000px の中で絞り込みが消えていた）
//  ・絞り込みは URL（?q= / ?cat=）に持つ＝共有でき、詳細から戻っても状態が残る
//  ・SPは2列（1列だと 57,000px）。チップは横スクロール・高さ40px、検索欄は16px（iOSのズーム防止）
//  ・件数のベタ書き（102）を撤去

interface Entry {
    slug: string
    category: string
    nameJa: string
    nameEn: string
    lede: string
    poster: string
    video: string
    posterAt?: number
}

interface Props {
    dataUrl: string
    accent: string
    ink: string
    paper: string
    muted: string
    stickyTop: number
    style?: CSSProperties
}

const CATS: { key: string; label: string; ja: string }[] = [
    { key: "hover", label: "Hover", ja: "ホバー" },
    { key: "scroll", label: "Scroll", ja: "スクロール" },
    { key: "text", label: "Text", ja: "文字" },
    { key: "transition", label: "Transition", ja: "画面遷移" },
    { key: "media", label: "Media", ja: "画像・映像" },
    { key: "ui", label: "UI", ja: "部品" },
    { key: "loading", label: "Loading", ja: "読み込み" },
]

const MONO =
    '"Geist Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
const JP = '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif'

function sentence(s: string) {
    return s
        .split("/")
        .map((x) => {
            const t = x.trim()
            return t.charAt(0).toUpperCase() + t.slice(1)
        })
        .join(" / ")
}

// ─── 章立て（2026-10-25 Awwwards 1周目）──────────────────────────────
// 196枚が同じ黒箱・同じリズムで 28,800px 続いていた（独立レビュー2人の共通指摘）。
// 対策は2つ：
//  ① 章扉：章名そのものが「その章の動き」で振る舞う。動きは辞典の実在項目で、値もその項目の既定値
//     （扉の隅に項目名とリンク＝この扉の動き自体が辞典の1項目、という自己言及）
//  ② 景色：章ごとに列数・大判の位置・カードの大きさを変える
// 地色は生成り／近黒の反転だけ。並びは 暗・明・明・暗・暗・明・暗（規則的な交替にしない）。
// 絞り込み（1カテゴリ）では章扉を出さず、景色（並び）だけその章のものを使う。検索中は均一の並び。

type Kind = "magnetic" | "skew" | "split" | "wipe" | "clip" | "press" | "count"

interface Chapter {
    tone: "dark" | "light"
    kind: Kind
    line: string // 和文の一言（この章が何を扱うか）
    demo: { slug: string; ja: string; params: string }
    align: "left" | "right" | "center"
    fs: number // 章名の最大サイズ（PC）
    fsSp: number
    minH: number // 扉の高さ（PC）
    minHSp: number
    // 並び：pc=列数（≥1100）、sp=列数（<640）、bigs=大判の位置（R=右寄せ）、row=横長カード、size=カードの格
    // bigs の i は「強い1枚」を除いた並びでの位置
    grid: { pc: number; sp: number; bigs?: { i: number; side: "L" | "R" }[]; row?: "sp" | "all"; size: "s" | "m" | "l" }
    // 6周目：格子に残すのは pick 枚（SP は pickSp）だけ。残りは文字中心の索引（ix.cols 列・サムネ幅 ix.tw）に畳む
    pick: number
    pickSp: number
    ix: { cols: number; tw: number; wide?: boolean }
    after: number // 章の末尾の余白（PC）
    // 強い1枚（2026-10-25 Awwwards 2周目）：扉の直後に全幅に近い大判で置く章の代表。
    // at = 録画の位置（full＝全幅・L/R＝版面の2/3を左右どちらに）。扉の動きの項目とは別のものを選ぶ（同じ動きを2度見せない）
    // 3周目：at = 実演面の構図（L/R＝全面の録画に名前を左下/右下、C＝名前が上・録画が中央、S＝録画が上・名前と一言が下）
    feat: { slug: string; at: StageAt }
}

const CHAPTERS: Record<string, Chapter> = {
    hover: {
        tone: "dark", kind: "magnetic", align: "left", fs: 260, fsSp: 76, minH: 620, minHSp: 300, after: 120,
        line: "カーソルを乗せたときの返事。押す前に「押せる」と伝える動き。",
        demo: { slug: "magnetic-hover", ja: "マグネティックホバー", params: "strength 0.35 · lerp 0.12" },
        grid: { pc: 3, sp: 2, bigs: [{ i: 0, side: "L" }], size: "m" },
        pick: 6, pickSp: 5, ix: { cols: 2, tw: 128 },
        // 写真がカーソルの跡に次々と湧く＝画面いっぱいに絵が動く。ホバー章で唯一「面」で見せられる項目
        feat: { slug: "image-trail", at: "R" },
    },
    scroll: {
        tone: "light", kind: "skew", align: "left", fs: 230, fsSp: 72, minH: 440, minHSp: 240, after: 96,
        line: "読み進める指の速さと位置に、画面が付いてくる動き。",
        demo: { slug: "velocity-skew", ja: "速度スキュー", params: "factor 0.5 · max 8°" },
        // 3周目：格子を2サイズに（大判2枚）
        // 6周目：大判なしの4枚1段（フィルムの帯）＋索引2列
        grid: { pc: 4, sp: 2, size: "m" },
        pick: 4, pickSp: 4, ix: { cols: 2, tw: 128 },
        // 写真のカードが積み上がる＝枠の全面が動く。この章は暗いUIの枠が多いので、写真が主役の1本を頭に
        feat: { slug: "stacking-cards", at: "S" },
    },
    text: {
        tone: "light", kind: "split", align: "center", fs: 300, fsSp: 96, minH: 560, minHSp: 280, after: 136,
        line: "文字そのものが出方で語る。読ませる順番をつくる動き。",
        demo: { slug: "split-text-reveal", ja: "分割テキストリビール", params: "stagger 30ms · 0.6s" },
        grid: { pc: 2, sp: 1, row: "all", size: "l" },
        pick: 4, pickSp: 2, ix: { cols: 1, tw: 176, wide: true },
        // 文字盤が横一杯にパタパタ返る＝大判にしたとき一番「文字が動く」が遠目で読める
        feat: { slug: "split-flap", at: "C" },
    },
    transition: {
        tone: "dark", kind: "wipe", align: "right", fs: 190, fsSp: 54, minH: 500, minHSp: 260, after: 104,
        line: "ページとページの継ぎ目。どこからどこへ移ったかを見せる動き。",
        demo: { slug: "curtain-wipe", ja: "カーテンワイプ", params: "0.8s × 2 · in-out" },
        // 6周目：2枚を大きく（版面の半分ずつ）＋索引1列
        grid: { pc: 2, sp: 2, size: "m" },
        pick: 2, pickSp: 2, ix: { cols: 1, tw: 176, wide: true },
        // 写真の上を円が広がって次の画面が出る＝「継ぎ目」が1コマで分かる
        feat: { slug: "circle-reveal", at: "L" },
    },
    media: {
        tone: "dark", kind: "clip", align: "left", fs: 340, fsSp: 96, minH: 660, minHSp: 320, after: 128,
        line: "写真と映像の見せ方。額縁と現れ方で、同じ1枚の温度を変える動き。",
        demo: { slug: "clip-reveal", ja: "クリップリビール", params: "0.9s · expo-out" },
        grid: { pc: 4, sp: 2, bigs: [{ i: 0, side: "L" }], size: "m" },
        pick: 9, pickSp: 5, ix: { cols: 3, tw: 144 },
        // 風景写真が1bitの粒に溶けて戻る＝写真の「温度を変える」をいちばん大きな差で見せる
        feat: { slug: "dither-dissolve", at: "S" },
    },
    ui: {
        tone: "light", kind: "press", align: "right", fs: 200, fsSp: 64, minH: 460, minHSp: 240, after: 96,
        line: "押す・開く・閉じる。部品が操作に答える動き。",
        demo: { slug: "press-feedback", ja: "プレスフィードバック", params: "scale 0.97 · 0.05s / 0.2s" },
        // 5列（1枚 256px）では中身が読めなかった（独立レビュー2人）→ 4列（1440で約320px）
        grid: { pc: 4, sp: 2, bigs: [{ i: 0, side: "R" }], size: "s" },
        pick: 5, pickSp: 5, ix: { cols: 3, tw: 112 },
        // ライムの面が枠の大半を占め、擦った跡が残る＝暗い部品の章の中で最も遠くから効く
        feat: { slug: "scratch-card", at: "R" },
    },
    loading: {
        tone: "dark", kind: "count", align: "left", fs: 150, fsSp: 52, minH: 300, minHSp: 200, after: 72,
        line: "待ち時間を「進んでいる」に変える動き。",
        demo: { slug: "preloader-counter", ja: "プリローダーカウンター", params: "1.8s · expo-out" },
        grid: { pc: 3, sp: 2, size: "m" },
        pick: 3, pickSp: 2, ix: { cols: 2, tw: 128 },
        // 写真のタイルが時間差で点く＝「読み込み」の章で唯一、絵が枠いっぱいに出る
        feat: { slug: "stagger-grid", at: "C" },
    },
}

// ─── 格子を崩す（2026-10-25 Awwwards 6周目・指摘1）───────────────────────────
// 6周続けて「中盤 約30,000px が黒い16:9の箱の均一な格子」と言われた（2人とも第1位）。
// 章の中身を3つの質感に分けた：①実演面（フル幅・既存）②格子＝その章で「絵が面を埋める」数枚だけ ③索引＝残り全部を文字中心の一覧（小さなサムネ＋和名＋英名＋番号）。
// 格子に残す項目は、ポスターのうち黒以外が占める割合（明度48超の画素率＋彩度40超の画素率×0.5）の高い順（r6/home/scores.json で実測）。
// 黒地に小さな白文字のポスターは索引の小さなサムネに回る＝「黒い箱」が大きく並ばない。新しく増えた項目は索引に入る。
// 章の地も分ける：暗い章（Hover / Transition / Media / Loading）は格子も索引も近黒の上（黒いポスターの地が溶けて「箱」が消える）、明るい章は生成り＋罫線。
const PICK: Record<string, string[]> = {
    hover: ["xray-lens", "shadow-pop", "lift-hover", "directional-hover", "holo-sheen", "row-expand", "fill-hover", "image-swap-hover"],
    scroll: ["footer-reveal", "header-invert", "horizontal-scroll", "parallax", "scroll-zoom", "scroll-marquee"],
    text: ["block-reveal", "outline-fill", "sliced-text", "text-flip", "split-text-reveal", "weight-morph"],
    transition: ["split-screen", "menu-reveal", "gradient-morph", "cover-transition", "curtain-wipe", "zoom-through"],
    media: ["grain-overlay", "ascii-effect", "quadtree-reveal", "image-parallax-hover", "carousel", "image-zoom-hover", "frosted-glass", "drag-scroll", "before-after"],
    ui: ["theme-toggle-transition", "flip-card", "drawer-slide", "modal-pop", "prize-wheel", "bar-chart-grow", "stateful-button"],
    loading: ["spiral-reveal", "liquid-fill", "circular-progress", "dots-pulse"],
}
/** 章の項目を「格子に残す pick 枚」と「索引」に分ける。索引は元の並び順のまま */
function pickOut(key: string, items: Entry[], n: number): { pick: Entry[]; rest: Entry[] } {
    const order = PICK[key] || []
    const rank = (e: Entry) => { const i = order.indexOf(e.slug); return i < 0 ? 1e3 : i }
    const pick = items.filter((e) => rank(e) < 1e3).sort((a, b) => rank(a) - rank(b)).slice(0, n)
    return { pick, rest: items.filter((e) => !pick.includes(e)) }
}

const SR: CSSProperties = { position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 }

interface DoorProps {
    c: (typeof CATS)[number]
    n: number
    idx: number
    ink: string
    paper: string
    muted: string
    accent: string
    w: number
    sp: boolean
    gutter: number
    reduced: boolean
    hoverable: boolean
    isStatic: boolean
}

// ─── スクロールの速さ（8周目・指摘9）──────────────────────────────────
// 速く流している間は、章の題・索引・格子を「出る前」に戻さない（戻すと、出る途中の空の画面や薄い索引が写った）。
// 速さは直近のスクロールイベント間の px/秒 を 0.5 で均したもの。止まって 140ms たてば 0
const SV = { y: 0, t: 0, v: 0, on: false }
function scrollFast(): boolean {
    if (typeof window === "undefined") return false
    if (!SV.on) {
        SV.on = true
        SV.y = window.scrollY
        SV.t = performance.now()
        window.addEventListener("scroll", () => {
            const now = performance.now(), y = window.scrollY
            const dt = Math.max(8, now - SV.t)
            SV.v = SV.v * 0.5 + (Math.abs(y - SV.y) / dt) * 1000 * 0.5
            SV.y = y
            SV.t = now
        }, { passive: true })
    }
    if (performance.now() - SV.t > 140) SV.v = 0
    return SV.v > 2400
}

/** 演技が走った瞬間の合図：下線が左から走って消える（0.9s）。連打で途切れないよう、走っている間は撃ち直さない */
function fireSig(el: HTMLElement | null) {
    if (!el || typeof window === "undefined") return
    const now = performance.now()
    if (now - (Number(el.dataset.t) || 0) < 700) return
    el.dataset.t = String(now)
    el.classList.remove("on")
    void el.offsetWidth
    el.classList.add("on")
}

function Door({ c, n, idx, ink, paper, muted, accent, w, sp, gutter, reduced, hoverable, isStatic }: DoorProps) {
    const ch = CHAPTERS[c.key]
    const dark = ch.tone === "dark"
    const fg = dark ? paper : ink
    // ミュートの #6B6B66 は近黒の上でコントラストが足りないので、暗い扉では生成りの透過で代用（色は増やさない）
    const sub = dark ? "rgba(244,244,241,.62)" : muted
    const rootRef = useRef<HTMLElement>(null)
    const tRef = useRef<HTMLSpanElement>(null)
    const fxRef = useRef<HTMLSpanElement>(null) // wipe の幕／count の数字
    const barRef = useRef<HTMLSpanElement>(null) // count の進捗線／skew の読み値
    const sigRef = useRef<HTMLSpanElement>(null) // 演技が走った合図（「この扉の動き」の項目名の下線）
    // press：押している間だけ章名の地と文字を反転（ボタンの押下状態。色は増やさない）
    const accentRef = useRef(accent)
    const inkRef = useRef(ink)
    accentRef.current = accent
    inkRef.current = ink

    const avail = Math.min(w, 1680) - gutter * 2
    // 章名は欧文なので Geist Mono（2026-10-25 2周目。Noto Sans JP の欧文＝既定書体の顔だった）。
    // 等幅の送りは 0.6em／字。字間 -0.06em で 0.54em。はみ出さないよう 0.6 で割る
    const per = ch.kind === "press" ? 0.62 + 0.9 / c.label.length : 0.6
    const fs = Math.max(36, Math.round(Math.min(sp ? ch.fsSp : ch.fs, avail / (c.label.length * per))))
    const letters = ch.kind === "magnetic" || ch.kind === "split"

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const root = rootRef.current
        const t = tRef.current
        if (!root || !t || reduced || !("IntersectionObserver" in window)) return
        const ls = Array.from(t.querySelectorAll<HTMLElement>(".mdx-l"))
        const timers: number[] = []
        const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms))
        let raf = 0
        let inView = false
        let armed = false
        let cleanup = () => {}

        // ── 入るたびに1回再生する系（画面外に出たら次の入場に備えて戻す＝見えている間は何も起きない）
        const arm = () => {
            armed = true
            if (ch.kind === "split") {
                ls.forEach((l) => { l.style.transition = "none"; l.style.transform = "translateY(115%)"; l.style.opacity = "0" })
            } else if (ch.kind === "wipe") {
                const p = fxRef.current!
                t.style.opacity = "0"
                p.style.transition = "none"; p.style.transformOrigin = "left center"; p.style.transform = "scaleX(0)"
            } else if (ch.kind === "clip") {
                t.style.transition = "none"; t.style.clipPath = "inset(0 100% 0 0)"
            } else if (ch.kind === "count") {
                fxRef.current!.textContent = "00"
                barRef.current!.style.transform = "scaleX(0)"
            }
        }
        const sig = () => fireSig(sigRef.current)
        const play = () => {
            armed = false
            sig()
            if (ch.kind === "split") {
                // split-text-reveal の既定値：stagger 30ms・0.6s・cubic-bezier(0.22,1,0.36,1)。移動量 30px は本文サイズの値なので、章名では 115%（マスクの外から）に読み替え
                // 8周目：着地を 0.6 秒以内に（0.4s ＋ 字ごと 25ms。章名は最長 10 字＝0.625s → 字数で詰める）
                const st = Math.min(25, Math.floor(200 / Math.max(1, ls.length)))
                ls.forEach((l, i) => {
                    l.style.transition = `transform .4s cubic-bezier(.22,1,.36,1) ${i * st}ms, opacity .4s ease ${i * st}ms`
                    l.style.transform = "none"; l.style.opacity = "1"
                })
            } else if (ch.kind === "wipe") {
                // curtain-wipe：覆う → 覆いきった直後に中身を差し替え → 反対の辺へ引く。
                // 8周目：辞典の値（0.8s × 2）は扉では 0.26s × 2 に縮める＝0.6 秒以内に章名が着地する（ライムの面で覆われたコマが写っていた）
                const p = fxRef.current!
                requestAnimationFrame(() => {
                    p.style.transition = "transform .26s cubic-bezier(.76,0,.24,1)"; p.style.transform = "scaleX(1)"
                })
                later(() => {
                    t.style.opacity = "1"
                    p.style.transformOrigin = "right center"; p.style.transform = "scaleX(0)"
                }, 300)
            } else if (ch.kind === "clip") {
                // clip-reveal：inset で左から開く 0.9s・easeOutExpo
                requestAnimationFrame(() => {
                    t.style.transition = "clip-path .5s cubic-bezier(.16,1,.3,1)"; t.style.clipPath = "inset(0 0% 0 0)"
                })
            } else if (ch.kind === "press") {
                // press-feedback：入り0.05s で沈む → 戻り0.2s ease-out（非対称）。沈み 2px は16pxのボタン基準なので 0.125em に読み替え
                // 5周目：色は補間しない（地と文字を 0.05s/0.2s で補間すると途中が灰色のカプセルになり「沈んで」見えた＝独立レビュー B）。
                // 形（沈み）だけを補間し、色は押している間だけライムに即座に切り替える
                later(() => {
                    t.style.transition = "transform .05s ease-out"; t.style.transform = "translateY(.125em) scale(.97)"; t.style.background = accentRef.current; t.style.color = inkRef.current
                    later(() => { t.style.transition = "transform .2s ease-out"; t.style.transform = "none"; t.style.background = ""; t.style.color = "" }, 160)
                }, 120)
            } else if (ch.kind === "count") {
                // preloader-counter：1.8s・表示値 = round(N × (1 − 2^(−10t)))
                const num = fxRef.current!
                const bar = barRef.current!
                const t0 = performance.now()
                const step = (now: number) => {
                    const k = Math.min(1, (now - t0) / 600)
                    const e = k === 1 ? 1 : 1 - Math.pow(2, -10 * k)
                    num.textContent = String(Math.round(n * e)).padStart(2, "0")
                    bar.style.transform = `scaleX(${e})`
                    if (k < 1 && inView) raf = requestAnimationFrame(step)
                    else { num.textContent = String(n).padStart(2, "0"); bar.style.transform = "scaleX(1)" }
                }
                raf = requestAnimationFrame(step)
            }
        }

        // ── 常時反応する系（画面内のときだけループを回す）
        if (ch.kind === "skew") {
            // velocity-skew：速度(px/フレーム)×0.5 → ±8deg でクランプ → lerp 0.1 で追従。止まったら0へ
            let last = window.scrollY
            let cur = 0
            const read = barRef.current
            const loop = () => {
                const y = window.scrollY
                const target = Math.max(-8, Math.min(8, (y - last) * 0.5))
                last = y
                const was = Math.abs(cur)
                cur += (target - cur) * 0.1
                if (Math.abs(cur) < 0.01) cur = 0
                if (was < 1 && Math.abs(cur) >= 1) sig()
                t.style.transform = `skewY(${cur.toFixed(2)}deg)`
                if (read) read.textContent = (cur < 0 ? "−" : "+") + Math.abs(cur).toFixed(1) + "°"
                if (inView) raf = requestAnimationFrame(loop)
            }
            ;(root as any)._start = () => { last = window.scrollY; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop) }
        }
        if (ch.kind === "magnetic") {
            // magnetic-hover：半径内でカーソルへ (差分×0.35) ずらす。追従 lerp 0.12、戻り 0.12×0.7
            // 半径 140px はボタン基準。章名の1文字は200px級なので、文字の大きさ×0.9 を下限にする
            const radius = Math.max(140, fs * 0.9)
            // タッチの自動の横切りでは、横の移動を字間（0.06em）の半分未満に抑える。
            // 抑えないと左右の字がカーソルへ寄り合って重なり「Hbver」と読めるコマが出た（独立レビュー）。縦の浮きで磁力を見せる
            const maxX = hoverable ? Infinity : fs * 0.02
            const maxY = hoverable ? Infinity : fs * 0.14
            const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v))
            const pos = ls.map(() => ({ x: 0, y: 0 }))
            let px = 0, py = 0, has = false, running = false
            const loop = () => {
                let moving = false
                ls.forEach((l, i) => {
                    const r = l.getBoundingClientRect()
                    const cx = r.left + r.width / 2 - pos[i].x
                    const cy = r.top + r.height / 2 - pos[i].y
                    const dx = px - cx, dy = py - cy
                    const inR = has && Math.hypot(dx, dy) < radius
                    const tx = inR ? clamp(dx * 0.35, maxX) : 0, ty = inR ? clamp(dy * 0.35, maxY) : 0
                    const k = inR ? 0.12 : 0.084
                    pos[i].x += (tx - pos[i].x) * k
                    pos[i].y += (ty - pos[i].y) * k
                    if (Math.abs(tx - pos[i].x) > 0.1 || Math.abs(ty - pos[i].y) > 0.1) moving = true
                    l.style.transform = `translate3d(${pos[i].x.toFixed(2)}px,${pos[i].y.toFixed(2)}px,0)`
                })
                if ((moving || has) && inView) raf = requestAnimationFrame(loop)
                else running = false
            }
            const kick = () => { if (!running) { running = true; raf = requestAnimationFrame(loop) } }
            if (hoverable) {
                const mv = (e: PointerEvent) => { if (!has) sig(); px = e.clientX; py = e.clientY; has = true; kick() }
                const lv = () => { has = false; kick() }
                root.addEventListener("pointermove", mv)
                root.addEventListener("pointerleave", lv)
                cleanup = () => { root.removeEventListener("pointermove", mv); root.removeEventListener("pointerleave", lv) }
            } else {
                // タッチ：入場時に1回だけ、見えないカーソルが章名の上を左から右へ横切る
                let done = false
                ;(root as any)._start = () => {
                    if (done) return
                    done = true
                    sig()
                    const r = t.getBoundingClientRect()
                    const t0 = performance.now()
                    const sweep = (now: number) => {
                        const k = Math.min(1, (now - t0) / 600)
                        const rr = t.getBoundingClientRect()
                        px = rr.left - 40 + (r.width + 80) * k
                        // 字の上端すれすれを通す＝字が順に上へ吸われる（横は字間を割らない量に抑えてある）
                        py = rr.top + rr.height * 0.02
                        has = k < 1
                        kick()
                        if (k < 1 && inView) requestAnimationFrame(sweep)
                        else has = false
                    }
                    requestAnimationFrame(sweep)
                }
            }
        }

        const replay = ch.kind === "split" || ch.kind === "wipe" || ch.kind === "clip" || ch.kind === "press" || ch.kind === "count"
        // 初期表示は「完成形」（SSR・JSなしでも空にならない）。画面外にある間にだけ「出る前」の状態へ戻す
        // 見えているか（ループの開始停止・「出る前」へ戻すのは完全に画面外のときだけ）
        // 8周目（指摘9）：速く流して入ってきたときは演じずに完成形へ戻す（章の題を先に確定）
        const settle = () => {
            if (!armed) return
            armed = false
            t.style.transition = "none"; t.style.opacity = ""; t.style.clipPath = ""; t.style.transform = ""
            ls.forEach((l) => { l.style.transition = "none"; l.style.transform = ""; l.style.opacity = "" })
            if (fxRef.current && ch.kind === "wipe") { fxRef.current.style.transition = "none"; fxRef.current.style.transform = "scaleX(0)" }
            if (ch.kind === "count") { fxRef.current!.textContent = String(n).padStart(2, "0"); barRef.current!.style.transform = "scaleX(1)" }
        }
        const vis = new IntersectionObserver(
            (es) => {
                for (const en of es) {
                    inView = en.isIntersecting
                    if (inView) {
                        if (ch.kind === "skew") (root as any)._start?.()
                        if (replay && armed && scrollFast()) settle()
                    } else {
                        cancelAnimationFrame(raf)
                        if (replay) arm()
                    }
                }
            },
            { threshold: 0 }
        )
        // 止まったとき、章名が画面に入っているのに出る前のまま（下の 10% にいる等）なら、その場で演じる
        let idle = 0
        const onScroll = () => {
            window.clearTimeout(idle)
            idle = window.setTimeout(() => {
                if (!armed || !inView) return
                const r = t.getBoundingClientRect()
                if (r.bottom > 0 && r.top < window.innerHeight) play()
            }, 160)
        }
        if (replay) window.addEventListener("scroll", onScroll, { passive: true })
        // 再生の合図（画面の下18%を除いた帯に入ったら＝ちゃんと目に入る位置で再生する）
        const go = new IntersectionObserver(
            (es) => {
                for (const en of es) {
                    if (!en.isIntersecting) continue
                    inView = true
                    if (replay && armed) { if (scrollFast()) settle(); else play() }
                    if (ch.kind === "magnetic") (root as any)._start?.()
                }
            },
            { threshold: 0, rootMargin: "0px 0px -10% 0px" }
        )
        vis.observe(root)
        go.observe(t)
        return () => {
            vis.disconnect()
            go.disconnect()
            window.removeEventListener("scroll", onScroll)
            window.clearTimeout(idle)
            cancelAnimationFrame(raf)
            timers.forEach((x) => clearTimeout(x))
            cleanup()
            delete (root as any)._start
            // 状態を完成形へ戻す（props 変化で再実行されたときに隠れたまま残らないように）
            t.style.transform = ""; t.style.opacity = ""; t.style.clipPath = ""; t.style.transition = ""; t.style.background = ""; t.style.color = ""
            ls.forEach((l) => { l.style.transform = ""; l.style.opacity = ""; l.style.transition = "" })
        }
        // fs は magnetic の半径に使う
    }, [ch.kind, reduced, hoverable, isStatic, n, fs])

    // UI の扉は章名が押せる（押している間だけ沈む）。説明のための飾りなので、フォーカス対象にはしない
    const press = ch.kind === "press" && !isStatic && !reduced
        ? {
              onPointerDown: () => { const t = tRef.current; if (t) { t.style.transition = "transform .05s ease-out"; t.style.transform = "translateY(.125em) scale(.97)"; t.style.background = accentRef.current; t.style.color = inkRef.current } },
              onPointerUp: () => { const t = tRef.current; if (t) { t.style.transition = "transform .2s ease-out"; t.style.transform = "none"; t.style.background = ""; t.style.color = "" } },
              onPointerLeave: () => { const t = tRef.current; if (t) { t.style.transition = "transform .2s ease-out"; t.style.transform = "none"; t.style.background = ""; t.style.color = "" } },
          }
        : {}

    const meta: CSSProperties = { fontFamily: MONO, fontSize: sp ? 11 : 12, letterSpacing: "0.04em", color: sub, fontVariantNumeric: "tabular-nums" }
    const justify = ch.align === "right" ? "flex-end" : ch.align === "center" ? "center" : "flex-start"
    const pad = sp ? 20 : 40

    const title = (
        <h2
            id={"cat-" + c.key}
            style={{
                margin: 0,
                display: "flex",
                // UI の扉（PC）：左に押下の3コマ（rest → press → release）、右に押せる章名。左の空きを「この扉の動き」の図解で埋める（5周目）
                justifyContent: ch.kind === "press" && !sp ? "space-between" : justify,
                alignItems: ch.kind === "press" && !sp ? "flex-end" : undefined,
                gap: ch.kind === "press" && !sp ? 40 : undefined,
                fontFamily: MONO,
                fontWeight: 500,
                fontSize: fs,
                lineHeight: 0.92,
                // 等幅は字の両脇の余白が広く、大きいサイズでは字間が開いて見える＝-0.06em で詰める
                letterSpacing: "-0.06em",
                color: fg,
                scrollMarginTop: sp ? 112 : 72,
                // split のマスク（章名 Text に descender は無いので余白は取らない＝下に待機中の字の頭が覗かない）
                overflow: ch.kind === "split" ? "hidden" : undefined,
            }}
        >
            <span style={SR}>{c.label} — {c.ja}</span>
            {ch.kind === "press" && !sp ? (
                <span aria-hidden style={{ display: "flex", gap: 36, alignItems: "flex-end", paddingBottom: "0.08em" }}>
                    {([["rest", "1.00", "0 ms"], ["press", "0.97", "+50 ms"], ["release", "1.00", "+250 ms"]] as const).map(([k, sc, tm], i) => (
                        <span key={k} style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
                            <span style={{ display: "inline-block", fontSize: Math.round(fs * 0.24), lineHeight: 0.92, letterSpacing: "-0.06em", whiteSpace: "nowrap", border: `1px solid ${ink}`, borderRadius: 999, padding: "0.06em 0.42em 0.14em", background: i === 1 ? accent : ink, color: i === 1 ? ink : paper, transform: i === 1 ? "translateY(.125em) scale(.97)" : undefined }}>
                                {c.label}
                            </span>
                            <span style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.5, letterSpacing: "0.04em", color: sub, whiteSpace: "nowrap" }}>
                                <span style={{ color: fg }}>{k}</span> · scale {sc}<br />{tm}
                            </span>
                        </span>
                    ))}
                </span>
            ) : null}
            <span aria-hidden style={{ position: "relative", display: "inline-block" }}>
            <span
                ref={tRef}
                aria-hidden
                className={ch.kind === "press" ? "mdx-pill" : undefined}
                {...press}
                style={{
                    display: "inline-block",
                    position: "relative",
                    whiteSpace: "nowrap",
                    willChange: ch.kind === "skew" || ch.kind === "press" ? "transform" : undefined,
                    transformOrigin: ch.kind === "skew" ? "left center" : "center",
                    ...(ch.kind === "press"
                        ? { border: `1px solid ${fg}`, borderRadius: 999, padding: "0.06em 0.42em 0.14em", cursor: "pointer", touchAction: "manipulation", userSelect: "none" }
                        : {}),
                }}
            >
                {letters ? c.label.split("").map((s, i) => <span key={i} className="mdx-l" style={{ display: "inline-block", willChange: "transform" }}>{s}</span>) : c.label}
            </span>
            {ch.kind === "wipe" ? (
                // 幕は章名の外側（章名を opacity 0 にしても幕は見える）。暗い扉の上の面なのでライム可
                <span ref={fxRef} style={{ position: "absolute", inset: "-0.04em -0.1em", background: accent, transform: "scaleX(0)", transformOrigin: "left center", pointerEvents: "none" }} />
            ) : null}
            </span>
        </h2>
    )

    const credit = (
        <a
            className="mdx-credit"
            href={"/entries/" + ch.demo.slug}
            style={{ ...meta, color: dark ? accent : ink, textDecoration: "none", display: "inline-flex", gap: 10, alignItems: "baseline", flexWrap: "wrap", justifyContent: ch.align === "right" && !sp ? "flex-end" : "flex-start" }}
        >
            {/* 6周目（指摘3）：12px の灰色では初見が気づかなかった → 14〜16px。演技が走る瞬間に下線が走る（.mdx-sig） */}
            <span style={{ color: sub, fontSize: sp ? 13 : 14 }}>この扉の動き</span>
            <span style={{ position: "relative", fontFamily: JP, fontWeight: 700, fontSize: sp ? 15 : 16, letterSpacing: "0.02em" }}>
                {ch.demo.ja}
                <span ref={sigRef} aria-hidden className="mdx-sig" style={{ background: dark ? accent : ink }} />
            </span>
            {/* 矢印は直前の語と離さない（SP で「↗」だけが次の行に落ちていた） */}
            {sp ? <span style={{ whiteSpace: "nowrap", fontSize: 13 }}>{ch.demo.slug}<span aria-hidden> ↗</span></span> : <span style={{ fontSize: 14 }}>{ch.demo.slug}</span>}
            {!sp ? <span style={{ color: sub, whiteSpace: "nowrap", fontSize: 14 }}>{ch.demo.params}<span aria-hidden style={{ color: dark ? accent : ink }}> ↗</span></span> : null}
        </a>
    )

    return (
        <header
            ref={rootRef}
            className={"mdx-door " + ch.tone}
            style={{
                background: dark ? ink : paper,
                color: fg,
                // 暗い章が続く（Transition → Media）と境目が消えるので、暗い扉の頭にも細い罫
                borderTop: dark ? "1px solid rgba(244,244,241,.16)" : `1px solid ${ink}`,
                borderBottom: dark ? undefined : "1px solid rgba(10,10,10,.12)",
            }}
        >
            <div
                style={{
                    maxWidth: 1680,
                    margin: "0 auto",
                    boxSizing: "border-box",
                    padding: `${pad}px ${gutter}px ${pad}px`,
                    minHeight: sp ? ch.minHSp : ch.minH,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: sp ? 28 : 40,
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, ...meta }}>
                    <span>
                        {String(idx + 1).padStart(2, "0")} / {String(CATS.length).padStart(2, "0")}
                        <span style={{ fontFamily: JP, fontSize: sp ? 12 : 13, marginLeft: 14, color: fg, letterSpacing: "0.04em" }}>{c.ja}</span>
                    </span>
                    {ch.kind === "skew" ? (
                        <span aria-hidden>
                            skewY <span ref={barRef} style={{ display: "inline-block", minWidth: "5ch", textAlign: "right", color: fg }}>+0.0°</span>
                        </span>
                    ) : null}
                    <span style={{ color: fg }}>
                        {String(n).padStart(2, "0")} {n === 1 ? "motion" : "motions"}
                    </span>
                </div>

                {ch.kind === "count" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: sp ? 14 : 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
                            {title}
                            <span aria-hidden ref={fxRef} style={{ fontFamily: MONO, fontSize: Math.round(fs * 0.9), lineHeight: 0.8, color: accent, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.04em" }}>
                                {String(n).padStart(2, "0")}
                            </span>
                        </div>
                        <span aria-hidden style={{ display: "block", height: 2, background: "rgba(244,244,241,.14)", position: "relative", overflow: "hidden" }}>
                            <span ref={barRef} style={{ position: "absolute", inset: 0, background: accent, transformOrigin: "left center" }} />
                        </span>
                    </div>
                ) : (
                    title
                )}


                <div
                    style={{
                        display: "flex",
                        flexDirection: sp ? "column" : ch.align === "right" ? "row-reverse" : "row",
                        justifyContent: "space-between",
                        alignItems: sp ? "flex-start" : "flex-end",
                        gap: sp ? 14 : 32,
                    }}
                >
                    <p style={{ margin: 0, fontFamily: JP, fontSize: sp ? 14 : 16, lineHeight: 1.7, letterSpacing: "0.03em", color: fg, maxWidth: 420, textAlign: ch.align === "right" && !sp ? "right" : "left", ...WRAP }}>{phrases(ch.line)}</p>
                    {credit}
                </div>
            </div>
        </header>
    )
}

/**
 * Motion Dictionary v2
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 900
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function MotionDictionaryV2(props: Props) {
    const {
        dataUrl = "https://ryota4100221-cmyk.github.io/motion-dict/entries-v2.json",
        accent = "#A5E02E",
        ink = "#0A0A0A",
        paper = "#F4F4F1",
        muted = "#6B6B66",
        stickyTop = 0,
    } = props

    const isStatic = useIsStaticRenderer()
    // カード→詳細を Framer のルーターで移るため、ルーターを遷移の関数（morphAndGo）へ渡しておく
    const router = useRouter()
    useEffect(() => {
        ROUTER = router
        return () => { if (ROUTER === router) ROUTER = null }
    }, [router])
    const [entries, setEntries] = useState<Entry[]>([])
    const [query, setQuery] = useState("")
    const [activeCat, setActiveCat] = useState<string>("all")
    const [cols, setCols] = useState(3)
    const [w, setW] = useState(1200)
    const [hoverable, setHoverable] = useState(true)
    const [reduced, setReduced] = useState(false)
    // 貼り付く検索バーの高さ（章の一覧の帯をその直下に貼る）。SSR とクライアント初回は 66
    const [barH, setBarH] = useState(66)
    const rootRef = useRef<HTMLDivElement>(null)
    const barRef = useRef<HTMLDivElement>(null)
    const inited = useRef(false)

    useEffect(() => {
        if (isStatic) return
        let alive = true
        fetch(dataUrl)
            .then((r) => r.json())
            .then((d: Entry[]) => {
                if (alive) startTransition(() => setEntries(Array.isArray(d) ? d : []))
            })
            .catch(() => {})
        return () => {
            alive = false
        }
    }, [dataUrl, isStatic])

    // 詳細から戻ったとき、開いたカードの位置へ戻してフォーカスも返す。
    // scrollY を覚えて戻すだけだと、絞り込み状態の再構成や画像の読み込みで730pxずれた（独立レビュー3）。
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const onClick = (ev: MouseEvent) => {
            const a = (ev.target as HTMLElement)?.closest?.("a.mdx-card") as HTMLAnchorElement | null
            if (!a) return
            try {
                sessionStorage.setItem("mdx-back", JSON.stringify({ slug: a.dataset.slug, url: window.location.pathname + window.location.search, top: a.getBoundingClientRect().top }))
            } catch {}
            morphAndGo(a, ev)
        }
        // window の capture に置く：Framer のリンク処理は document の capture で先に遷移してしまう（実測）。window はそれより先に走る
        window.addEventListener("click", onClick, true)
        return () => window.removeEventListener("click", onClick, true)
    }, [isStatic])
    useEffect(() => {
        if (isStatic || !entries.length || typeof window === "undefined") return
        let rec: { slug: string; url: string; top: number } | null = null
        try { rec = JSON.parse(sessionStorage.getItem("mdx-back") || "null") } catch {}
        if (!rec || rec.url !== window.location.pathname + window.location.search) return
        let n = 0
        const tryRestore = () => {
            const el = document.querySelector(`a.mdx-card[data-slug="${rec!.slug}"]`) as HTMLAnchorElement | null
            if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - rec!.top
                window.scrollTo(0, y)
                el.focus({ preventScroll: true })
                try { sessionStorage.removeItem("mdx-back") } catch {}
            } else if (n++ < 20) requestAnimationFrame(tryRestore)
        }
        requestAnimationFrame(() => requestAnimationFrame(tryRestore))
    }, [isStatic, entries.length, activeCat, query])

    // URL → 状態（初回のみ）
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const sp = new URLSearchParams(window.location.search)
        const q = sp.get("q")
        const c = sp.get("cat")
        if (q) setQuery(q)
        if (c && CATS.some((x) => x.key === c)) setActiveCat(c)
        inited.current = true
    }, [isStatic])

    // 状態 → URL（履歴は積まない）
    useEffect(() => {
        if (isStatic || typeof window === "undefined" || !inited.current) return
        const u = new URL(window.location.href)
        query.trim() ? u.searchParams.set("q", query.trim()) : u.searchParams.delete("q")
        activeCat !== "all" ? u.searchParams.set("cat", activeCat) : u.searchParams.delete("cat")
        window.history.replaceState(window.history.state, "", u.toString())
    }, [query, activeCat, isStatic])

    useEffect(() => {
        if (typeof window === "undefined" || !rootRef.current) return
        const el = rootRef.current
        const compute = () => {
            const ww = el.clientWidth
            startTransition(() => {
                setW(ww)
                setCols(ww >= 900 ? 3 : 2)
            })
        }
        compute()
        const ro = new ResizeObserver(compute)
        ro.observe(el)
        const bar = barRef.current
        const ro2 = new ResizeObserver(() => { if (bar) setBarH(bar.offsetHeight) })
        if (bar) ro2.observe(bar)
        return () => { ro.disconnect(); ro2.disconnect() }
    }, [])

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        setHoverable(window.matchMedia("(hover: hover) and (pointer: fine)").matches)
        setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    }, [])

    // カテゴリの件数は検索語に連動（検索中も「All 195」のままだった）
    // 検索は名前・英名・説明に加えて擬音・俗な言い方の別名でも当てる（searchEntries）。件数チップも同じ照合で数える
    const q = query.trim()
    const nq = normalize(q)
    const found = useMemo(() => searchEntries(entries, q), [entries, q])
    const counts = useMemo(() => {
        const c: Record<string, number> = {}
        if (!nq) return c
        for (const e of found.items) {
            c[e.category] = (c[e.category] || 0) + 1
            c.all = (c.all || 0) + 1
        }
        return c
    }, [found, nq])
    const filtered = useMemo(() => found.items.filter((e) => activeCat === "all" || e.category === activeCat), [found, activeCat])

    const total = entries.length
    const searching = nq.length > 0
    const grouped = !searching && activeCat === "all"
    const sp = w < 640
    const oneRow = w >= 1100
    const gutter = sp ? 16 : w < 1100 ? 32 : 40

    // 検索・絞り込みをしたら、バーが画面の上端に来るまでスクロール＝結果がすぐ下に見える
    // （PCは結果の1件目が画面外、SPは入力中に結果がキーボードの下に隠れていた）
    const toTop = () => {
        const bar = barRef.current
        if (!bar || typeof window === "undefined") return
        const top = bar.getBoundingClientRect().top + window.scrollY - stickyTop
        if (Math.abs(window.scrollY - top) > 2 && window.scrollY < top) window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" })
    }
    const pick = (k: string) => {
        setActiveCat(k)
        // 絞り込んだら一覧の頭へ（バーが画面の上端に来る位置まで）。
        // 8周目（指摘10）：FV（バーより上）で押しても、旧版は下へは送らなかった＝押しても画面の中で何も変わらなかった。上からでも下からでも送る
        const bar = barRef.current
        if (bar && typeof window !== "undefined") {
            const top = bar.getBoundingClientRect().top + window.scrollY - stickyTop
            if (Math.abs(window.scrollY - top) > 2) window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" })
        }
    }

    const chip = (active: boolean): CSSProperties => ({
        fontFamily: MONO,
        fontSize: 13,
        letterSpacing: "0.03em",
        height: 40,
        padding: "0 14px",
        borderRadius: 100,
        cursor: "pointer",
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        flex: "0 0 auto",
        border: active ? `1px solid ${ink}` : "1px solid rgba(10,10,10,0.16)",
        background: active ? ink : "transparent",
        color: active ? paper : ink,
        transition: "background .2s, color .2s, border-color .2s",
    })

    // 章ごとの並び。chapter を渡さない（検索結果）ときは従来どおり均一の3列／2列
    // 4列は 1240 未満で3列に落とす（1100〜1240 で4列だと1枚が260pxを割り、録画の中身が読めない）
    const layoutFor = (key?: string) => {
        const g = key ? CHAPTERS[key]?.grid : undefined
        if (!g) return { n: cols, bigs: [] as { i: number; side: "L" | "R" }[], row: false, size: "m" as const, wide: false }
        const n = sp ? g.sp : w < 900 ? Math.min(g.pc, 2) : w < 1240 ? Math.min(g.pc, 3) : g.pc
        return { n, bigs: g.bigs || [], row: g.row === "all" || (g.row === "sp" && n === 1), size: g.size, wide: g.row === "all" }
    }

    const Grid = ({ items, chapter, rest = [], dark = false }: { items: Entry[]; chapter?: string; rest?: Entry[]; dark?: boolean }) => {
        const L = layoutFor(chapter)
        const n = L.n
        // 大判：3列以上は2列×2行、2列では全幅1行、1列・横長カードの章では無し
        const bigAt = new Map<number, "L" | "R">()
        if (n >= 2 && !L.row) for (const b of L.bigs) if (b.i < items.length) bigAt.set(b.i, b.side)
        // 位置は全部こちらで決める（grid の dense 任せだと、大判の右寄せで段の途中に穴が残り、章末の1枚が段に孤立した）
        const P = pack(items.length, n, bigAt)
        const small = L.size === "s"
        const colGap = sp ? 12 : small ? 20 : n === 2 ? 40 : 28
        const rowGap = sp ? (L.row ? 20 : 28) : small ? 32 : n === 2 ? 64 : 44
        const one = (e: Entry, o: { big?: boolean; row?: boolean; wide?: boolean }) => (
            <Card e={e} ink={ink} muted={muted} accent={accent} hoverable={hoverable} reduced={reduced} isStatic={isStatic} sp={sp} big={o.big} row={o.row} wide={o.wide} size={L.size} dark={dark} />
        )
        // 索引（6周目）：格子に残さなかった項目を、文字中心の一覧に畳む。列数とサムネ幅は章ごと
        const ch0 = chapter ? CHAPTERS[chapter] : undefined
        const ix = ch0?.ix
        const ixCols = !ix ? 1 : sp ? 1 : w < 900 ? 1 : w < 1240 ? Math.min(ix.cols, 2) : ix.cols
        const ixWide = !!ix?.wide && !sp
        const tw = sp ? 104 : ix ? (ixCols >= 3 && w < 1360 ? Math.min(ix.tw, 112) : ix.tw) : 128
        const base = items.length + (chapter ? 1 : 0) // 番号は実演面（01）と格子の続きから
        const index = rest.length ? (
            <div className={"mdx-ixl" + (dark ? " dk" : "")} style={{ marginTop: items.length ? (sp ? 36 : 64) : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, paddingBottom: sp ? 10 : 14, fontFamily: MONO, fontSize: sp ? 12 : 13, letterSpacing: "0.04em", color: dark ? "rgba(244,244,241,.62)" : muted }}>
                    <span>索引 <span style={{ color: dark ? paper : ink }}>Index</span></span>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>{String(base + 1).padStart(2, "0")}–{String(base + rest.length).padStart(2, "0")}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${ixCols}, minmax(0, 1fr))`, columnGap: sp ? 0 : 40 }}>
                    {rest.map((e, k) => (
                        <div key={e.slug} className="mdx-gi" data-c={k % ixCols} style={{ minWidth: 0 }}>
                            <IndexRow e={e} no={base + k + 1} ink={ink} paper={paper} muted={muted} accent={accent} hoverable={hoverable} reduced={reduced} isStatic={isStatic} sp={sp} dark={dark} tw={tw} wide={ixWide} />
                        </div>
                    ))}
                </div>
            </div>
        ) : null
        const body = (
            <>
                {P.places.length ? (
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, columnGap: colGap, rowGap, alignItems: "start" }}>
                        {P.places.map((p) => (
                            <div key={items[p.k].slug} className="mdx-gi" data-c={p.c} style={{ gridColumn: `${p.c + 1} / span ${p.w}`, gridRow: `${p.r + 1} / span ${p.h}`, minWidth: 0 }}>
                                {one(items[p.k], { big: p.big && n >= 3, row: L.row, wide: L.wide })}
                            </div>
                        ))}
                    </div>
                ) : null}
                {/* 最後の段に残った分：残りの枚数で幅を割り直す。1枚だけなら横長カード（録画＋説明）で段を埋める */}
                {P.tail.length ? (
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${P.tail.length}, minmax(0, 1fr))`, columnGap: colGap, marginTop: P.places.length ? rowGap : 0, alignItems: "start" }}>
                        {P.tail.map((k) => (
                            <div key={items[k].slug} className="mdx-gi" data-c={P.tail.indexOf(k)} style={{ minWidth: 0 }}>
                                {/* 横長カードの章（Text）で1枚だけ残ったときは、録画を大きく取った横長（1.3:1）で段を埋める。
                                    5周目：従来の 1:2 では録画が版面の1/3に縮み、右下に大きな空きが残った（独立レビュー B） */}
                                {one(items[k], { row: P.tail.length === 1 || L.row, wide: L.wide, big: L.wide && P.tail.length === 1 && !sp })}
                            </div>
                        ))}
                    </div>
                ) : null}
                {index}
            </>
        )
        const frame: CSSProperties = { padding: `${sp ? 20 : 40}px ${gutter}px 8px`, maxWidth: 1680, margin: "0 auto", boxSizing: "border-box", width: "100%" }
        const ch = chapter ? CHAPTERS[chapter] : undefined
        // 検索結果（章なし）は素の一覧。章の一覧は、その章の扉と同じ動きの言語で一覧全体が振る舞う
        if (!ch) return <div style={frame}>{body}</div>
        return (
            <GridFx key={"gx-" + chapter} kind={ch.kind} demo={ch.demo} n={items.length + rest.length} frame={frame} ink={ink} paper={paper} muted={muted} accent={accent} sp={sp} hoverable={hoverable} reduced={reduced} isStatic={isStatic} dark={dark} top={stickyTop + barH} gutter={gutter}>
                {body}
            </GridFx>
        )
    }
    // 章の中身（実演面＋格子＋索引）。地は章の調子（暗い章は近黒・明るい章は生成り）で、版面の外まで塗る
    const Body = (key: string, items: Entry[]) => {
        const S = split(key, items)
        const ch = CHAPTERS[key]
        const dark = ch?.tone === "dark"
        const O = pickOut(key, S.rest, ch ? (sp ? ch.pickSp : ch.pick) : S.rest.length)
        return (
            <div className={dark ? "mdx-dk" : undefined} style={{ background: dark ? ink : paper }}>
                {S.feat ? Lead({ e: S.feat, at: S.at, n: items.length, chapter: key }) : null}
                {Grid({ items: O.pick, rest: O.rest, chapter: key, dark })}
            </div>
        )
    }

    // 章の強い1枚（扉の直後・全幅に近い大判）。絞り込み（1カテゴリ）でも出す。検索中は出さない
    const split = (key: string, items: Entry[]) => {
        const f = CHAPTERS[key]?.feat
        const feat = (f && items.find((e) => e.slug === f.slug)) || null
        return { feat, at: (f?.at || "S") as StageAt, rest: feat ? items.filter((e) => e !== feat) : items }
    }
    // 関数として呼ぶ（要素にすると親の再描画のたびに作り直され、再生中の録画が頭に戻る）
    // 実演面は版面の外まで（フル幅）。key を slug にして、並びが変わっても作り直さない
    const Lead = ({ e, at, n, chapter }: { e: Entry; at: StageAt; n: number; chapter: string }) => (
        <Stage key={e.slug} e={e} at={at} n={n} chapter={chapter} ink={ink} paper={paper} muted={muted} accent={accent} hoverable={hoverable} reduced={reduced} isStatic={isStatic} sp={sp} w={w} gutter={gutter} />
    )

    return (
        <div ref={rootRef} style={{ position: "relative", width: "100%", background: paper, color: ink, fontFamily: JP, ...props.style }}>
            <style dangerouslySetInnerHTML={{ __html: `
.mdx-chips{scrollbar-width:none}
.mdx-chips::-webkit-scrollbar{display:none}
.mdx-chip:focus-visible,.mdx-card:focus-visible,.mdx-x:focus-visible{outline:2px solid ${accent};outline-offset:3px}
.mdx-search::placeholder{color:${muted};opacity:1}
.mdx-search:focus{outline:none}
.mdx-search::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none;display:none}
.mdx-searchwrap:focus-within{box-shadow:inset 0 0 0 2px ${accent}}
.mdx-card{display:flex;flex-direction:column;gap:12px;min-width:0;text-decoration:none;color:${ink}}
.mdx-card.row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:28px;align-items:center}
@media (min-width: 900px){.mdx-card.row{grid-template-columns:minmax(0,1fr) minmax(0,2fr)}}
.mdx-card.row.wide{grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:24px}
@media (max-width: 639px){.mdx-card.row.wide{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:14px}}
.mdx-card .ph{position:relative;display:block;width:100%;aspect-ratio:16/9;border-radius:8px;overflow:hidden;background:#0B0B0A;isolation:isolate}
.mdx-card .ph img,.mdx-card .ph video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.mdx-card .ph video{opacity:0;transition:opacity .18s}
.mdx-door .mdx-pill{background:${ink};color:${paper};border-color:${ink}!important}
.mdx-door.dark .mdx-pill{background:${paper};color:${ink};border-color:${paper}!important}
.mdx-card .ph img.pl:not([src]){visibility:hidden}
.mdx-card .ph img.pl{opacity:0;transition:opacity .25s}
.mdx-card .ph img.pl.in{opacity:1}
.mdx-card .ph video.on{opacity:1}
/* ホバーの合図は名前の演技に移した（ライムの下敷きは reduced-motion のときだけ残す） */
.mdx-card .ph::after{content:"";position:absolute;inset:0;border-radius:8px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06);pointer-events:none}
/* カードのホバー＝辞典の lift-hover の既定値（8px・0.3s ease-out・影は::afterに事前描画してopacityで切替） */
.mdx-card .lf{position:relative;display:block;isolation:isolate;transition:transform .3s ease-out}
.mdx-card .lf::after{content:"";position:absolute;inset:0;border-radius:8px;box-shadow:0 24px 48px rgba(0,0,0,.1);opacity:0;transition:opacity .3s ease-out;pointer-events:none;z-index:-1}
.mdx-card .tx{transition:transform .3s ease-out}
@media (hover:hover) and (pointer:fine){
.mdx-card:hover .lf{transform:translateY(-8px)}
.mdx-card:hover .lf::after,.mdx-card:focus-visible .lf::after{opacity:1}
.mdx-card:hover .tx{transform:translateY(-4px)}
}
/* 名前の演技（pfPlay）。素の名前は inline のまま（仮名のカーニングを保つ）、舞台は1文字ずつ絶対配置 */
.mdx-pf{position:relative;display:inline-block;vertical-align:top;max-width:100%;white-space:nowrap;overflow-x:clip;overflow-y:visible;text-overflow:ellipsis}
.mdx-pf .mdt-t{display:inline}
.nm.w .mdx-pf{white-space:normal;text-overflow:clip}
.mdx-pf .mdt-stage .mdt-p,.mdx-pf .mdt-stage .mdt-c{position:absolute;display:block;white-space:pre}
.mdx-pf .mdt-fx{position:absolute;pointer-events:none;display:block}
.mdx-pf .mdt-ghost{font:inherit;letter-spacing:inherit;line-height:inherit}
/* 実演面 */
.mdx-card.mdx-stage{position:relative;display:grid;box-sizing:border-box;width:100%;height:clamp(620px,100vh,980px);padding:40px var(--g) 48px;overflow:hidden;isolation:isolate;gap:0;row-gap:24px;column-gap:48px;text-decoration:none}
.mdx-stage .lf{transform:none!important;transition:none}
.mdx-stage .lf::after{display:none}
.mdx-stage .ph{border-radius:0;aspect-ratio:auto;height:100%}
.mdx-stage .ph::after{border-radius:0;box-shadow:none}
.mdx-stage .sm,.mdx-stage .sn,.mdx-stage .sb{position:relative;z-index:2;min-width:0}
.mdx-stage .sb{display:flex;flex-direction:column;gap:14px;max-width:440px}
.mdx-stage .sc{position:absolute;inset:0;z-index:1;pointer-events:none}
.mdx-stage .so{transition:transform .3s ease-out}
.mdx-stage:hover .so{transform:translateX(6px)}
.st-L,.st-R{grid-template-rows:auto minmax(0,1fr) auto auto}
.st-L .lf,.st-R .lf{position:absolute;inset:0;z-index:0}
.st-L .sm,.st-R .sm{grid-row:1}.st-L .sn,.st-R .sn{grid-row:3}.st-L .sb,.st-R .sb{grid-row:4}
.st-L .sc{background:linear-gradient(90deg,rgba(10,10,10,.88) 0%,rgba(10,10,10,.55) 36%,rgba(10,10,10,0) 64%),linear-gradient(0deg,rgba(10,10,10,.72) 0%,rgba(10,10,10,0) 46%),linear-gradient(180deg,rgba(10,10,10,.5) 0%,rgba(10,10,10,0) 18%)}
.st-R .sc{background:linear-gradient(270deg,rgba(10,10,10,.88) 0%,rgba(10,10,10,.55) 36%,rgba(10,10,10,0) 64%),linear-gradient(0deg,rgba(10,10,10,.72) 0%,rgba(10,10,10,0) 46%),linear-gradient(180deg,rgba(10,10,10,.5) 0%,rgba(10,10,10,0) 18%)}
.st-R .sm,.st-R .sn,.st-R .sb{justify-self:end;text-align:right}
.st-R .sb{align-items:flex-end}
/* S＝上に録画（版面いっぱい・黒地に収める）、下に名前と一言 */
.st-S{grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);grid-template-rows:auto minmax(0,1fr) auto}
.st-S .sm{grid-column:1/-1;grid-row:1}.st-S .lf{grid-row:2}.st-S .sn,.st-S .sb{grid-row:3}
.st-C .sm{grid-row:1}.st-C .sn{grid-row:2}.st-C .lf{grid-row:3}.st-C .sb{grid-row:4}
.st-S .lf,.st-C .lf{min-height:0;height:100%}
.st-S .lf{grid-column:1/-1}
.st-S .ph img,.st-S .ph video,.st-C .ph img,.st-C .ph video{object-fit:contain}
.st-S .ph,.st-C .ph{background-color:${ink};background-size:contain!important;background-repeat:no-repeat}
.st-S .sn{grid-column:1;align-self:end}
.st-S .sb{grid-column:2;align-self:end;justify-self:end}
/* C＝上に名前（中央）、中央に録画、下に一言 */
.st-C{grid-template-rows:auto auto minmax(0,1fr) auto;justify-items:center;text-align:center}
.st-C .lf{width:100%}
.st-C .sb{align-items:center;max-width:560px}
/* SP：高さ 80vh。録画は16:9で横いっぱい、並び順と揃えを構図ごとに変える */
.mdx-card.mdx-stage.sp{display:flex;flex-direction:column;justify-content:space-between;gap:16px;height:80vh;height:80svh;min-height:540px;max-height:760px;padding:20px var(--g) 24px}
.mdx-stage.sp .lf{position:relative;inset:auto;margin:0 calc(var(--g) * -1);height:auto;flex:0 0 auto}
.mdx-stage.sp .ph{aspect-ratio:16/9;height:auto}
.mdx-stage.sp .ph img,.mdx-stage.sp .ph video{object-fit:cover}
.mdx-stage.sp .sc{display:none}
.mdx-stage.sp .sm{order:0}.mdx-stage.sp .lf{order:1}.mdx-stage.sp .sn{order:2}.mdx-stage.sp .sb{order:3}
.st-R.sp .lf,.st-C.sp .lf{order:4}
.st-R.sp .sn,.st-R.sp .sb,.st-R.sp .sm{align-self:flex-end;text-align:right}
.st-C.sp .sn,.st-C.sp .sb,.st-C.sp .sm{align-self:center;text-align:center}
@media (prefers-reduced-motion: reduce){.mdx-card:hover .nm{box-shadow:inset 0 -0.42em 0 ${accent}}}
/* フッター（SiteFooterCTA）の「monaka design. / X」は Made in Framer バッジ（約150×40・右下12px）の上に逃がす＝下にだけ余白。
   8周目（指摘8）：右の 184px の余白で右端が 1255 に止まり版面の右端 1400 に揃っていなかった → 右の余白は取らない */
.mdf-base{padding-bottom:72px!important}
/* 一覧の振る舞い（GridFx）。transform / opacity / clip-path だけ */
.mdx-gi{position:relative}
.gx-split .mdx-gi.gx-sa,.gx-split .mdx-gi.gx-sg{clip-path:inset(-24px -24px 0 -24px)}
.gx-split .mdx-gi.gx-sa>*{transform:translateY(100%)}
.gx-split .mdx-gi.gx-sg>*{transition:transform var(--gt,.4s) cubic-bezier(.22,1,.36,1) var(--gd,0ms),opacity var(--gt,.4s) ease var(--gd,0ms)}
.gx-clip .mdx-gi .ph>img,.gx-clip .mdx-gi .ph>video{clip-path:inset(0 0 0 0)}
.gx-clip .mdx-gi.gx-ca .ph>img,.gx-clip .mdx-gi.gx-ca .ph>video{clip-path:inset(0 100% 0 0)}
.gx-clip .mdx-gi.gx-cg .ph>img,.gx-clip .mdx-gi.gx-cg .ph>video{transition:clip-path var(--gt,.5s) cubic-bezier(.16,1,.3,1) var(--gd,0ms)}
.gx-wipe .mdx-gi .lf::before{content:"";position:absolute;inset:0;z-index:3;background:${paper};border-radius:8px;transform:scaleX(0);transform-origin:left center;pointer-events:none}
.gx-wipe .mdx-gi.gx-cw .lf::before{animation:gx-cw var(--gt,.56s) var(--gd,0ms) both}
@keyframes gx-cw{0%{transform:scaleX(0);transform-origin:left center;animation-timing-function:cubic-bezier(.76,0,.24,1)}48.2%{transform:scaleX(1);transform-origin:left center}51.8%{transform:scaleX(1);transform-origin:right center;animation-timing-function:cubic-bezier(.76,0,.24,1)}100%{transform:scaleX(0);transform-origin:right center}}
.gx-press .mdx-gi{transition:transform .2s ease-out}
.gx-press .mdx-gi.gx-pd{transform:translateY(6px) scale(var(--gs,.94));transition:transform .05s ease-out}
.gx-press .mdx-gi.gx-pw{animation:gx-pw .42s var(--gd,0ms) both}
@keyframes gx-pw{0%{transform:none;animation-timing-function:ease-out}12%{transform:translateY(6px) scale(var(--gs,.94))}52%{transform:translateY(6px) scale(var(--gs,.94));animation-timing-function:ease-out}100%{transform:none}}
/* 8周目（指摘3）：幕は地と同じ色（暗い章は近黒・明るい章は生成り）。旧：暗い章で生成りの幕が途中で止まり「空の生成りの箱」に写った */
.gx-wipe.dk .mdx-gi .lf::before{background:${ink}}
/* 演技が走った合図（扉と一覧の帯の項目名の下線） */
.mdx-sig{position:absolute;left:0;right:0;bottom:-5px;height:2px;transform:scaleX(0);transform-origin:left center;pointer-events:none;opacity:0}
.mdx-sig.on{animation:mdx-sig .9s cubic-bezier(.22,1,.36,1) both}
@keyframes mdx-sig{0%{transform:scaleX(0);opacity:1}45%{transform:scaleX(1);opacity:1}100%{transform:scaleX(1);opacity:0}}
/* 暗い章の地：黒いポスターの地が溶ける＝「箱」が消えて中身だけが浮く。枠は細い生成りの線で残す */
.mdx-dk .mdx-card .ph{background:#121211}
.mdx-dk .mdx-card .ph::after{box-shadow:inset 0 0 0 1px rgba(244,244,241,.12)}
.mdx-dk .mdx-card .lf::after{box-shadow:0 24px 48px rgba(0,0,0,.5)}
/* 索引（6周目）：文字中心の一覧。サムネ＋番号＋和名＋英名（広い章は説明1行）。罫線1px */
.mdx-card.mdx-ix{display:grid;grid-template-columns:var(--tw) minmax(0,1fr) auto;align-items:center;column-gap:18px;padding:14px 0;border-top:1px solid rgba(10,10,10,.14)}
.mdx-ixl.dk .mdx-card.mdx-ix{border-top-color:rgba(244,244,241,.14)}
.mdx-ix .ph{border-radius:4px}
.mdx-ix .ph::after{border-radius:4px}
.mdx-ix .lf::after{display:none}
.mdx-ix .no{font-family:${MONO};font-size:12px;letter-spacing:.04em;font-variant-numeric:tabular-nums;align-self:start;padding-top:2px}
@media (hover:hover) and (pointer:fine){
.mdx-card.mdx-ix:hover .lf{transform:scale(1.06)}
.mdx-card.mdx-ix:hover .tx{transform:translateX(6px)}
}
@media (max-width: 639px){.mdx-card.mdx-ix{column-gap:14px;padding:12px 0}}
/* 索引の行のホバー（8周目 A2）：見出しが下端を軸に大きくなり、デモの絵が行の右から上へ立ち上がる。どちらも重ねる層＝行の高さは変えない */
.mdx-card.mdx-ix{position:relative}
.mdx-ix.on{z-index:3}
/* 横は列の幅で切る（clip-path は見た目だけで、はみ出した分が横スクロールを生む＝overflow-x:clip も併せる） */
.mdx-card .tx{overflow-x:clip}
.mdx-ix .tx{clip-path:inset(-30px 0 -6px -6px)}
.mdx-ix .nm{transform-origin:0 100%;transition:transform .32s cubic-bezier(.22,1,.36,1)}
.mdx-ix.on .nm{transform:scale(var(--nz,1.45))}
.mdx-ix .pv{position:absolute;right:40px;bottom:calc(100% - 1px);width:min(500px,48%);aspect-ratio:16/9;border-radius:6px;overflow:hidden;background:#121211;pointer-events:none;clip-path:inset(100% 0 0 0 round 6px);transform:translateY(18px);transition:clip-path .36s cubic-bezier(.22,1,.36,1),transform .36s cubic-bezier(.22,1,.36,1)}
.mdx-ix.on .pv{clip-path:inset(0 0 0 0 round 6px);transform:none}
.mdx-ix .pv img,.mdx-ix .pv video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.mdx-ix .pv::after{content:"";position:absolute;inset:0;border-radius:6px;box-shadow:inset 0 0 0 1px rgba(10,10,10,.22);pointer-events:none}
.mdx-ixl.dk .mdx-ix .pv::after{box-shadow:inset 0 0 0 1px rgba(244,244,241,.24)}
@media (max-width: 639px){.mdx-ix .pv{right:30px;width:58%}}
@media (prefers-reduced-motion: reduce){.mdx-ix .nm,.mdx-ix .pv{transition:none}}
.gx-count .mdx-gi{transition:opacity .18s ease-out}
.gx-count .mdx-gi.gx-dim{opacity:.28}
@media (prefers-reduced-motion: reduce){.gx-wipe .mdx-gi .lf::before{display:none}.mdx-gi{transition:none!important;animation:none!important;opacity:1!important;transform:none!important}}
.mdx-credit{transition:opacity .2s}
.mdx-credit:hover{opacity:.72}
.mdx-credit:focus-visible{outline:2px solid ${accent};outline-offset:4px}
.mdx-door.light .mdx-credit:focus-visible{outline-color:${ink}}
@media (prefers-reduced-motion: reduce){.mdx-card .ph video{transition:none}.mdx-card .lf,.mdx-card .tx{transition:none;transform:none!important}}
` }} />

            {/* 検索＋カテゴリ（貼り付く） */}
            <div
                ref={barRef}
                style={{
                    position: "sticky",
                    top: stickyTop,
                    zIndex: 5,
                    background: paper,
                    borderTop: `1px solid ${ink}`,
                    borderBottom: `1px solid ${ink}`,
                }}
            >
                <div style={{ display: "flex", flexDirection: oneRow ? "row" : "column", alignItems: oneRow ? "center" : "stretch" }}>
                <div
                    className="mdx-searchwrap"
                    style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: oneRow ? `0 20px 0 ${gutter}px` : `0 ${gutter}px`,
                        height: sp ? 52 : 64,
                        flex: oneRow ? "0 0 380px" : undefined,
                        borderRight: oneRow ? "1px solid rgba(10,10,10,.12)" : undefined,
                        borderBottom: oneRow ? undefined : "1px solid rgba(10,10,10,.12)",
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flex: "0 0 auto" }}>
                        <circle cx="11" cy="11" r="7" stroke={ink} strokeWidth="1.8" />
                        <path d="M20 20L16.5 16.5" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <input
                        className="mdx-search"
                        type="search"
                        value={query}
                        onChange={(ev) => { setQuery(ev.target.value); toTop() }}
                        onFocus={toTop}
                        placeholder={oneRow ? "動きを検索 — 例：ふわっと / magnetic" : "動きを検索（名前・英名・説明）"}
                        aria-label="動きを検索（名前・英名・説明から）"
                        style={{ flex: 1, minWidth: 0, height: "100%", border: "none", background: "transparent", fontFamily: JP, fontSize: 16, color: ink, padding: 0 }}
                    />
                    {query ? (
                        <button className="mdx-x" onClick={() => setQuery("")} aria-label="検索をクリア" style={{ border: 0, background: "transparent", cursor: "pointer", fontFamily: MONO, fontSize: 12, color: muted, height: 40, padding: "0 4px" }}>
                            Clear ✕
                        </button>
                    ) : null}
                    {!oneRow ? (
                        <span aria-live="polite" style={{ fontFamily: MONO, fontSize: 12, color: muted, letterSpacing: "0.04em", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                            {total ? `${filtered.length} / ${total}` : ""}
                        </span>
                    ) : null}
                </div>
                <div
                    className="mdx-chips"
                    role="tablist"
                    aria-label="カテゴリ"
                    style={{ display: "flex", gap: 8, padding: oneRow ? "0 20px" : `10px ${gutter}px`, overflowX: "auto", flexWrap: "nowrap", flex: oneRow ? 1 : undefined, alignItems: "center", minWidth: 0 }}
                >
                    {[{ key: "all", label: "All", ja: "すべて" }, ...CATS].map((c) => {
                        const n = c.key === "all" ? (query.trim() ? counts.all || 0 : total) : counts[c.key] || 0
                        const on = activeCat === c.key
                        return (
                            <button key={c.key} className="mdx-chip" role="tab" aria-selected={on} onClick={() => pick(c.key)} style={chip(on)}>
                                {c.label}
                                <span style={{ opacity: 0.55, fontVariantNumeric: "tabular-nums" }}>{n || ""}</span>
                            </button>
                        )
                    })}
                </div>
                {oneRow ? (
                    <span aria-live="polite" style={{ fontFamily: MONO, fontSize: 12, color: muted, letterSpacing: "0.04em", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", padding: `0 ${gutter}px 0 12px` }}>
                        {total ? `${filtered.length} / ${total}` : ""}
                    </span>
                ) : null}
                </div>
            </div>

            {searching || !grouped ? (
                <div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: muted, letterSpacing: "0.04em", padding: `20px ${gutter}px 0`, maxWidth: 1680, margin: "0 auto", boxSizing: "border-box" }}>
                        {searching ? `“${q}”` : ""}
                        {searching && activeCat !== "all" ? ` in ${CATS.find((c) => c.key === activeCat)?.label}` : ""}
                        {!searching ? `${CATS.find((c) => c.key === activeCat)?.label} — ${CATS.find((c) => c.key === activeCat)?.ja}` : ""}
                        {` · ${filtered.length} ${filtered.length === 1 ? "motion" : "motions"}`}
                    </div>
                    {searching && filtered.length && found.mode !== "all" ? (
                        // 全文では当たらず、語に分けて当てたとき＝どう探したかを言う
                        <p style={{ margin: 0, padding: `8px ${gutter}px 0`, maxWidth: 1680, marginInline: "auto", boxSizing: "border-box", fontSize: 13, lineHeight: 1.7, color: muted }}>
                            「{q}」そのものは見つからなかったので、{found.mode === "words-all" ? "次の語をすべて含む動き" : "次の語のどれかを含む動き"}を出しています：{found.tokens.join(" / ")}
                        </p>
                    ) : null}
                    {searching && filtered.length && found.syn ? (
                        <p style={{ margin: 0, padding: `8px ${gutter}px 0`, maxWidth: 1680, marginInline: "auto", boxSizing: "border-box", fontSize: 13, lineHeight: 1.7, color: muted }}>
                            「{q}」に近い言い方（{synLabels(nq).slice(0, 5).join(" / ")} など）で当たった {found.syn} 件も、後ろに並べています。
                        </p>
                    ) : null}
                    {/* 当たりが少ないとき（1〜5件）は、近い言い方を候補に出す（0件のときは下の候補） */}
                    {searching && filtered.length > 0 && filtered.length < 6 ? (
                        <div style={{ padding: `12px ${gutter}px 0`, maxWidth: 1680, marginInline: "auto", boxSizing: "border-box", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontFamily: MONO, fontSize: 12, color: muted, letterSpacing: "0.04em", marginRight: 4 }}>近い言い方</span>
                            {(synLabels(nq).length ? synLabels(nq) : PIN_RAW.map(([wd]) => wd)).filter((wd) => normalize(wd) !== nq).slice(0, 8).map((wd) => (
                                <button key={wd} className="mdx-chip" onClick={() => { setQuery(wd); setActiveCat("all") }} style={chip(false)}>
                                    {wd}
                                </button>
                            ))}
                        </div>
                    ) : null}
                    {filtered.length ? (
                        // 1カテゴリの絞り込み（検索なし）はその章の並びを使う。検索中は均一の並び
                        !searching && activeCat !== "all" ? (
                            (() => {
                                return Body(activeCat, filtered)
                            })()
                        ) : (
                            Grid({ items: filtered })
                        )
                    ) : (
                        <div style={{ padding: `48px ${gutter}px 80px`, display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
                            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.8 }}>
                                {activeCat !== "all" && found.items.length
                                    ? `「${q}」は ${CATS.find((c) => c.key === activeCat)?.label} の中にはありません（ほかの章に ${found.items.length} 件あります）。`
                                    : "該当する動きが見つかりません。"}
                                名前・英名（magnetic）・擬音（ふわっと／シュッ／グニャ）・「ホバーすると浮く」のような言い方でも探せます。
                            </p>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {PIN_RAW.map(([wd]) => (
                                    <button key={wd} className="mdx-chip" onClick={() => { setQuery(wd); setActiveCat("all") }} style={chip(false)}>
                                        {wd}
                                    </button>
                                ))}
                                <button className="mdx-chip" onClick={() => { setQuery(""); setActiveCat("all") }} style={chip(true)}>
                                    すべて表示
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                CATS.map((c, i) => {
                    const items = entries.filter((e) => e.category === c.key)
                    if (!items.length) return null
                    const ch = CHAPTERS[c.key]
                    return (
                        <section key={c.key} aria-labelledby={"cat-" + c.key} style={{ paddingBottom: sp ? Math.round(ch.after * 0.5) : ch.after, background: ch.tone === "dark" ? ink : paper }}>
                            {/* 扉はフックを持つので要素として描く（関数呼び出しにすると件数0→196でフックの数が変わる） */}
                            <Door
                                c={c} n={items.length} idx={i} ink={ink} paper={paper} muted={muted} accent={accent} w={w} sp={sp} gutter={gutter}
                                reduced={reduced} hoverable={hoverable} isStatic={isStatic}
                            />
                            {Body(c.key, items)}
                        </section>
                    )
                })
            )}
            {/* 8周目（指摘7）：最後の章（暗い）とフッター（暗い）の間に生成りの帯 80px が残っていた＝意味のない帯。置かない */}
        </div>
    )
}

// ─── 一覧そのものが章の動きで振る舞う（2026-10-25 Awwwards 4周目・指摘2 A案）──────────────
// 3周続けて「中盤が均質な黒い箱の壁」と言われた。扉だけが動いて、扉を過ぎるとどの章も同じ並びに戻っていた。
// そこで、扉の動き（辞典の実在項目）と同じ言語で、カード群（グリッド全体）が振る舞う：
//   hover=カーソルにカード群が寄る（タッチは画面の中央へ寄る）／scroll=スクロール速度で傾く／text=字のように下から分割リビール
//   transition=幕が1枚ずつ横切る／media=絵がクリップで開く／ui=入ると押されて沈む・押すと沈む／loading=カウンターで順に点く
// 守っていること：transform / opacity / clip-path だけ（レイアウトを揺らさない）。reduced-motion・静的描画では何もしない。
// 「出る前」に隠すのは画面のすぐ下（1.5画面ぶん）に来たセルだけ＝全ページ撮影や遠い位置で空のカードを見せない。
// 幕（transition）と押下（ui）は「見えている状態から1回崩して戻す」ので、隠す状態を持たない。
// 毎フレーム回るのは hover と scroll の2つだけで、どちらも一覧が画面にある間・動いている間だけ。
// 6周目（指摘2）：pull 0.06・最大12px、skew 最大2.5° では撮影で一度も見えなかった（独立レビュー B）。
// 体感できる大きさへ引き上げ、章の一覧の頭に貼り付く帯に「いまの一覧の動き＝◯◯ 値」をライブで出す（値が動くと数字も動く）。
// 読みやすさの線：skew は止まれば 0°（読むのは止まってから）、磁石は最大 28px（カードの余白 28〜40px を越えない）。
// 8周目（指摘 B1）：帯は「実況が小声」だった → 実況の数値を大きく、その章の代表パラメータのスライダーを1本置く。
// 動かすと、画面に見えている章の一覧全体が新しい値で1回演じ直す。値は辞典の項目そのもののキー（strength / maxSkew …）で持ち、
// 帯のリンクは ?キー=値 付き（詳細ページ EntryLab が URL の値を読む＝その値の入ったプロンプトが出る）。
// 一覧で使う値は、辞典の値から一覧の大きさに読み替える（gxv）。既定値は 7周目までの一覧の値と同じになるように比を取った。
// 8周目（演技全般）：入る型は 0.6 秒以内に着地。速く流している間は「出る前」へ戻さない（指摘9）。タッチの磁石はスクロールで常に動いていた→止めた
const GRID_FX: Record<Kind, { idle: string }> = {
    magnetic: { idle: "offset 0.0px" },
    skew: { idle: "skewY +0.0°" },
    split: { idle: "translateY 0%" },
    wipe: { idle: "scaleX 0.00" },
    clip: { idle: "inset(0 0% 0 0)" },
    press: { idle: "scale 1.000" },
    count: { idle: "" },
}
interface GxParam { key: string; min: number; max: number; step: number; def: number; unit: string; dp: number }
const GX_PARAM: Record<Kind, GxParam> = {
    magnetic: { key: "strength", min: 0.05, max: 1, step: 0.05, def: 0.35, unit: "", dp: 2 },
    skew: { key: "maxSkew", min: 2, max: 20, step: 1, def: 8, unit: "°", dp: 0 },
    split: { key: "stagger", min: 10, max: 120, step: 5, def: 30, unit: "ms", dp: 0 },
    wipe: { key: "duration", min: 0.3, max: 1.5, step: 0.05, def: 0.8, unit: "s", dp: 2 },
    clip: { key: "duration", min: 0.3, max: 2, step: 0.05, def: 0.9, unit: "s", dp: 2 },
    press: { key: "scale", min: 0.9, max: 1, step: 0.01, def: 0.97, unit: "", dp: 2 },
    count: { key: "duration", min: 0.5, max: 4, step: 0.1, def: 1.8, unit: "s", dp: 1 },
}
/** 辞典の値 → 一覧での値（既定値で 7周目までの一覧と同じ、かつ入る型は 0.6 秒以内） */
function gxv(kind: Kind, v: number) {
    return {
        // magnetic：0.35 → pull 0.18・最大 28px（実際に寄る量は段・列の間の半分で止める＝下の loop）
        pull: v * 0.5, max: Math.round(Math.min(32, v * 80)),
        skew: (v * 7) / 8, // skew：8° → 7°
        col: v * 2, // split：列ごとの遅れ 30 → 60ms（1枚 0.36s）
        wipe: v * 700, // wipe：片道 0.8s → 往復 0.56s
        clip: v * 555, // clip：0.9s → 0.5s
        scale: 1 - (1 - v) * 2, // press：0.97 → 0.94
        count: (v * 1000) / 3, // count：1.8s → 0.6s
    }
}
function gxLabel(kind: Kind, v: number): string {
    const g = gxv(kind, v)
    switch (kind) {
        case "magnetic": return `pull ${g.pull.toFixed(2)} · max ${g.max}px`
        case "skew": return `factor 0.35 · max ${g.skew.toFixed(1)}°`
        case "split": return `stagger ${Math.round(g.col)}ms · 0.36s · rise 100%`
        case "wipe": return `${(g.wipe / 1000).toFixed(2)}s · in-out`
        case "clip": return `${(g.clip / 1000).toFixed(2)}s · expo-out`
        case "press": return `scale ${g.scale.toFixed(2)} · 6px · 0.05s / 0.2s`
        case "count": return `${(g.count / 1000).toFixed(2)}s · expo-out`
    }
}

interface GridFxProps {
    kind: Kind
    demo: { slug: string; ja: string }
    n: number
    frame: CSSProperties
    ink: string
    paper: string
    muted: string
    accent: string
    sp: boolean
    hoverable: boolean
    reduced: boolean
    isStatic: boolean
    dark: boolean
    top: number // 帯を貼る位置（検索バーの下端）
    gutter: number
    children: ReactNode
}

function GridFx({ kind, demo, n, frame, ink, paper, muted, accent, sp, hoverable, reduced, isStatic, dark, top, gutter, children }: GridFxProps) {
    const rootRef = useRef<HTMLDivElement>(null)
    const wrapRef = useRef<HTMLDivElement>(null)
    const cntRef = useRef<HTMLSpanElement>(null)
    const readRef = useRef<HTMLSpanElement>(null) // いまの値（ライブ）
    const sigRef = useRef<HTMLSpanElement>(null) // 演技が走った合図
    const PRM = GX_PARAM[kind]
    const [val, setVal] = useState(PRM.def)
    const valRef = useRef(val)
    valRef.current = val
    const replayRef = useRef<(() => void) | null>(null)
    const rpT = useRef(0)

    useEffect(() => {
        if (isStatic || reduced || typeof window === "undefined" || !("IntersectionObserver" in window)) return
        const root = rootRef.current
        const wrap = wrapRef.current
        if (!root || !wrap) return
        const G = () => gxv(kind, valRef.current)
        const cells = () => Array.from(wrap.querySelectorAll<HTMLElement>(".mdx-gi"))
        const inScreen = () => cells().filter((el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight })
        const col = (el: HTMLElement) => parseInt(el.dataset.c || "0", 10) || 0
        const timers: number[] = []
        const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms))
        let raf = 0
        let inView = false
        const offs: (() => void)[] = []
        const on = (t: EventTarget, ev: string, fn: (e: any) => void, o?: AddEventListenerOptions) => {
            t.addEventListener(ev, fn, o)
            offs.push(() => t.removeEventListener(ev, fn, o))
        }
        const vis = new IntersectionObserver((es) => { for (const en of es) inView = en.isIntersecting }, { threshold: 0 })
        vis.observe(root)
        offs.push(() => vis.disconnect())
        const say = (s: string) => { const r = readRef.current; if (r && r.textContent !== s) r.textContent = s }
        const sig = () => fireSig(sigRef.current)
        scrollFast()

        // ── 入る型（split / clip / wipe / press）の読み値：最後に動き出したセルの今の値を、動いている間だけ毎フレーム読む
        let mEl: HTMLElement | null = null
        let mEnd = 0
        let mRaf = 0
        const num = (m: string, i: number) => { const v = (m.match(/-?[\d.]+/g) || [])[i]; return v ? parseFloat(v) : NaN }
        const readNow = (el: HTMLElement): string => {
            if (kind === "split") {
                const c = el.firstElementChild as HTMLElement | null
                if (!c) return ""
                const ty = num(getComputedStyle(c).transform, 5)
                return `translateY ${Math.round(((ty || 0) / Math.max(1, c.offsetHeight)) * 100)}%`
            }
            if (kind === "clip") {
                const im = el.querySelector(".ph>img") as HTMLElement | null
                const cp = im ? getComputedStyle(im).clipPath : ""
                const r = num(cp, 1)
                return `inset(0 ${Math.round(r || 0)}% 0 0)`
            }
            if (kind === "wipe") {
                const lf = el.querySelector(".lf") as HTMLElement | null
                const tf = lf ? getComputedStyle(lf, "::before").transform : ""
                const a = tf && tf !== "none" ? num(tf, 0) : 0
                return `scaleX ${(a || 0).toFixed(2)}`
            }
            if (kind === "press") {
                const tf = getComputedStyle(el).transform
                const a = tf && tf !== "none" ? num(tf, 0) : 1
                return `scale ${(a || 1).toFixed(3)}`
            }
            return ""
        }
        const meter = (el: HTMLElement, ms: number) => {
            mEl = el
            mEnd = performance.now() + ms
            sig()
            if (mRaf) return
            const step = () => {
                if (!mEl || performance.now() > mEnd) { mRaf = 0; say(GRID_FX[kind].idle); return }
                say(readNow(mEl))
                mRaf = requestAnimationFrame(step)
            }
            mRaf = requestAnimationFrame(step)
        }
        offs.push(() => { cancelAnimationFrame(mRaf); mRaf = 0 })

        // ── 入る直前に「出る前」へ、目に入る帯で「出る」。完全に画面外へ出たら完成形に戻す（次の入場で再び）
        // 速く流しているときは「出る前」にしない／出る帯に来たときも速ければ完成形のまま（指摘9）。止まったときに出る前のまま画面にあれば、その場で出す
        const entry = (arm: ((el: HTMLElement) => void) | null, play: (el: HTMLElement) => void, reset: (el: HTMLElement) => void) => {
            const st = new Map<HTMLElement, "armed" | "played">()
            const near = new IntersectionObserver((es) => {
                for (const en of es) {
                    const el = en.target as HTMLElement
                    if (en.isIntersecting) {
                        if (!st.get(el) && en.boundingClientRect.top > window.innerHeight && !scrollFast()) {
                            if (arm) arm(el)
                            st.set(el, "armed")
                        }
                    } else {
                        reset(el)
                        st.delete(el)
                    }
                }
            }, { threshold: 0, rootMargin: "0px 0px 150% 0px" })
            const go = new IntersectionObserver((es) => {
                for (const en of es) {
                    const el = en.target as HTMLElement
                    if (en.isIntersecting && st.get(el) === "armed") {
                        st.set(el, "played")
                        if (scrollFast()) reset(el)
                        else play(el)
                    }
                }
            }, { threshold: 0, rootMargin: "0px 0px -12% 0px" })
            let idle = 0
            on(window, "scroll", () => {
                window.clearTimeout(idle)
                idle = window.setTimeout(() => {
                    st.forEach((v, el) => {
                        if (v !== "armed") return
                        const r = el.getBoundingClientRect()
                        if (r.bottom > 0 && r.top < window.innerHeight) { st.set(el, "played"); play(el) }
                    })
                }, 160)
            }, { passive: true })
            offs.push(() => window.clearTimeout(idle))
            cells().forEach((el) => { near.observe(el); go.observe(el) })
            offs.push(() => { near.disconnect(); go.disconnect(); cells().forEach(reset) })
        }
        const restart = (el: HTMLElement, ...cls: string[]) => { el.classList.remove(...cls); void el.offsetWidth }

        if (kind === "skew") {
            // velocity-skew：速度(px/フレーム)×0.35 → ±max → lerp 0.1。扉（×0.5・±8°）と同じ式。スクロールしている間だけ（本人の操作に付いてくる）
            let last = window.scrollY, cur = 0, running = false, kick = 0
            const loop = () => {
                const y = window.scrollY
                const M = G().skew
                const target = Math.max(-M, Math.min(M, (y - last) * 0.35))
                last = y
                const was = Math.abs(cur)
                if (kick) { cur = kick; kick = 0 } else cur += (target - cur) * 0.1
                if (was < 1 && Math.abs(cur) >= 1) sig()
                if (Math.abs(cur) < 0.01 && Math.abs(target) < 0.01) {
                    cur = 0
                    wrap.style.transform = ""
                    wrap.style.willChange = ""
                    say(GRID_FX.skew.idle)
                    running = false
                    return
                }
                // 画面の中央を軸に傾ける（見ているところが動かない）
                const r = root.getBoundingClientRect()
                wrap.style.transformOrigin = `50% ${Math.round(window.innerHeight / 2 - r.top)}px`
                wrap.style.transform = `skewY(${cur.toFixed(2)}deg)`
                say(`skewY ${cur < 0 ? "−" : "+"}${Math.abs(cur).toFixed(1)}°`)
                raf = requestAnimationFrame(loop)
            }
            const start = () => { if (running) return; running = true; wrap.style.willChange = "transform"; raf = requestAnimationFrame(loop) }
            on(window, "scroll", () => {
                if (!inView) { last = window.scrollY; return }
                start()
            }, { passive: true })
            // 演じ直し：いまの最大角まで一度振って、lerp で戻す
            replayRef.current = () => { last = window.scrollY; kick = G().skew; sig(); start() }
            offs.push(() => { wrap.style.transform = ""; wrap.style.willChange = ""; wrap.style.transformOrigin = "" })
        }

        if (kind === "magnetic") {
            // magnetic-hover：半径480内でカーソルへ寄る（差分×pull×近さ・最大 max px）。追従 lerp 0.12、戻り 0.084
            // 8周目（指摘2）：寄るのは版面（一覧の箱）の内側まで。右端の列は内へだけ、左端の列も内へだけ寄る（旧：右列が版面の外 1427px まで出た）
            let list: { el: HTMLElement; x: number; y: number; ox: number; oy: number; lo: number; hi: number }[] = []
            let px = 0, py = 0, has = false, running = false
            const R = 480
            const measure = () => {
                const wr = wrap.getBoundingClientRect()
                list = cells().map((el) => {
                    const prev = list.find((q) => q.el === el)
                    const r = el.getBoundingClientRect()
                    const ox = prev ? prev.ox : 0, oy = prev ? prev.oy : 0
                    const left = r.left - ox, right = r.right - ox
                    return { el, x: left + r.width / 2 + window.scrollX, y: r.top + r.height / 2 - oy + window.scrollY, ox, oy, lo: Math.min(0, wr.left - left), hi: Math.max(0, wr.right - right) }
                })
            }
            const loop = () => {
                let moving = false
                let peak = 0
                const sy = window.scrollY, sx = window.scrollX, vh = window.innerHeight
                const g = G()
                for (const q of list) {
                    const cx = q.x - sx, cy = q.y - sy
                    if (cy < -400 || cy > vh + 400) { if (q.ox || q.oy) { q.ox = 0; q.oy = 0; q.el.style.transform = "" } continue }
                    let tx = 0, ty = 0
                    const dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy)
                    if (has && d < R) {
                        const k = g.pull * (1 - d / R) * 2
                        // 隣のカードと寄り合っても重ならないよう、段の間・列の間の半分で止める（列の間 SP 12・PC 28〜40／段の間 SP 28・PC 44〜64）
                        const mx = Math.min(g.max, sp ? 5 : 14), my = Math.min(g.max, sp ? 12 : 22)
                        tx = Math.max(q.lo, Math.min(q.hi, Math.max(-mx, Math.min(mx, dx * k))))
                        ty = Math.max(-my, Math.min(my, dy * k))
                    }
                    const kk = tx || ty ? 0.12 : 0.084
                    q.ox += (tx - q.ox) * kk
                    q.oy += (ty - q.oy) * kk
                    if (Math.abs(tx - q.ox) > 0.05 || Math.abs(ty - q.oy) > 0.05) moving = true
                    peak = Math.max(peak, Math.abs(q.ox), Math.abs(q.oy))
                    q.el.style.transform = Math.abs(q.ox) < 0.05 && Math.abs(q.oy) < 0.05 && !tx && !ty ? "" : `translate3d(${q.ox.toFixed(2)}px,${q.oy.toFixed(2)}px,0)`
                }
                say(`offset ${peak.toFixed(1)}px`)
                if ((moving || has) && inView) raf = requestAnimationFrame(loop)
                else { running = false; if (!has) say(GRID_FX.magnetic.idle) }
            }
            const kick = () => { if (!running) { running = true; raf = requestAnimationFrame(loop) } }
            if (hoverable) {
                on(root, "pointerenter", (e: PointerEvent) => { if (e.pointerType === "mouse") { measure(); has = true; px = e.clientX; py = e.clientY; sig(); kick() } })
                on(root, "pointermove", (e: PointerEvent) => { if (e.pointerType !== "mouse") return; if (!list.length) measure(); px = e.clientX; py = e.clientY; has = true; kick() })
                on(root, "pointerleave", () => { has = false; kick() })
                on(window, "scroll", () => { if (has) kick() }, { passive: true })
            }
            // 演じ直し：見えない手が、画面の中ほどを左から右へ 0.45 秒で横切る（タッチでも同じ）
            replayRef.current = () => {
                measure()
                const wr = wrap.getBoundingClientRect()
                const t0 = performance.now()
                sig()
                const sweep = (now: number) => {
                    const k = Math.min(1, (now - t0) / 450)
                    px = wr.left - 60 + (wr.width + 120) * k
                    py = window.innerHeight * 0.55
                    has = k < 1
                    kick()
                    if (k < 1) requestAnimationFrame(sweep)
                }
                requestAnimationFrame(sweep)
            }
            on(window, "resize", () => { list.forEach((q) => { q.ox = 0; q.oy = 0; q.el.style.transform = "" }); list = [] })
            offs.push(() => cells().forEach((el) => (el.style.transform = "")))
        }

        if (kind === "split") {
            // split-text-reveal：字がマスクの下から昇るのと同じ形で、カードがセルの下端から昇る（0.36s・(0.22,1,0.36,1)）。列ごとに stagger×2 ずらす
            const play = (el: HTMLElement) => {
                const d = Math.round(col(el) * G().col)
                el.style.setProperty("--gd", d + "ms")
                el.style.setProperty("--gt", ".36s")
                el.classList.add("gx-sg")
                requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove("gx-sa")))
                meter(el, 420 + d)
                later(() => el.classList.remove("gx-sg"), 400 + d)
            }
            entry((el) => el.classList.add("gx-sa"), play, (el) => el.classList.remove("gx-sa", "gx-sg"))
            replayRef.current = () => inScreen().forEach((el) => { restart(el, "gx-sg"); el.classList.add("gx-sa"); void el.offsetWidth; play(el) })
        }

        if (kind === "clip") {
            // clip-reveal：絵（ポスター／録画）が左から開く・expo-out。額（黒い枠）と名前は最初から見えている
            const play = (el: HTMLElement) => {
                const D = G().clip, d = col(el) * 40
                el.style.setProperty("--gd", d + "ms")
                el.style.setProperty("--gt", Math.round(D) + "ms")
                el.classList.add("gx-cg")
                requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove("gx-ca")))
                meter(el, D + d + 60)
                later(() => el.classList.remove("gx-cg"), D + d + 40)
            }
            entry((el) => el.classList.add("gx-ca"), play, (el) => el.classList.remove("gx-ca", "gx-cg"))
            replayRef.current = () => inScreen().forEach((el) => { restart(el, "gx-cg"); el.classList.add("gx-ca"); void el.offsetWidth; play(el) })
        }

        if (kind === "wipe") {
            // curtain-wipe：覆う → 反対の辺へ引く。見えているカードの絵の上を1回横切る（隠す状態を持たない・名前は覆わない）。幕は地の色
            const play = (el: HTMLElement) => {
                const D = G().wipe, d = col(el) * 40
                restart(el, "gx-cw")
                el.style.setProperty("--gd", d + "ms")
                el.style.setProperty("--gt", Math.round(D) + "ms")
                el.classList.add("gx-cw")
                meter(el, D + d + 60)
                later(() => el.classList.remove("gx-cw"), D + d + 40)
            }
            entry(null, play, (el) => el.classList.remove("gx-cw"))
            replayRef.current = () => inScreen().forEach(play)
        }

        if (kind === "press") {
            // press-feedback：入ると1回押されて沈む（0.05s で沈む → 0.2s で戻す・合計 0.42s）。列ごとに 40ms＝鍵盤を順に叩く
            const play = (el: HTMLElement) => {
                const d = col(el) * 40
                restart(el, "gx-pw")
                el.style.setProperty("--gd", d + "ms")
                el.style.setProperty("--gs", G().scale.toFixed(3))
                el.classList.add("gx-pw")
                meter(el, 480 + d)
                later(() => el.classList.remove("gx-pw"), 460 + d)
            }
            entry(null, play, (el) => el.classList.remove("gx-pw"))
            replayRef.current = () => inScreen().forEach(play)
            // 押している間は沈む（タッチもマウスも）
            const up = (e: Event) => { const g = (e.target as HTMLElement)?.closest?.(".mdx-gi"); wrap.querySelectorAll(".gx-pd").forEach((x) => { if (x !== g || e.type !== "pointerdown") x.classList.remove("gx-pd") }) }
            on(wrap, "pointerdown", (e: PointerEvent) => { const g = (e.target as HTMLElement)?.closest?.(".mdx-gi") as HTMLElement | null; if (g) { g.style.setProperty("--gs", G().scale.toFixed(3)); g.classList.remove("gx-pw"); g.classList.add("gx-pd"); meter(g, 400) } })
            on(window, "pointerup", up)
            on(window, "pointercancel", up)
            on(wrap, "pointerleave", up)
        }

        if (kind === "count") {
            // preloader-counter：点いた数 = round(N × (1 − 2^(−10t)))。0.6 秒。まだ見ていない一覧だけ、暗くしてから順に点ける（消しはしない＝28%）
            // 8周目：1.8s → 0.6s（薄い索引が写っていた）。速く流しているときは暗くしない
            let armed = false
            let sequencing = false
            const cnt = cntRef.current
            const total = () => cells().length
            const label = (k: number) => { if (cnt) cnt.textContent = `lit ${String(k).padStart(2, "0")} / ${String(total()).padStart(2, "0")}` }
            const arm = () => { armed = true; cells().forEach((el) => el.classList.add("gx-dim")); label(0) }
            const reset = () => { armed = false; sequencing = false; cancelAnimationFrame(raf); cells().forEach((el) => el.classList.remove("gx-dim")); label(total()) }
            let lit = 0
            const inBand = new Set<HTMLElement>()
            const lightLater = (el: HTMLElement) => {
                if (el.dataset.gq || !el.classList.contains("gx-dim")) return
                el.dataset.gq = "1"
                later(() => { delete el.dataset.gq; if (el.classList.contains("gx-dim")) { el.classList.remove("gx-dim"); label(++lit) } }, col(el) * 60)
            }
            const cellGo = new IntersectionObserver((es) => {
                for (const en of es) {
                    const el = en.target as HTMLElement
                    if (en.isIntersecting) inBand.add(el)
                    else inBand.delete(el)
                    if (en.isIntersecting && !armed && !sequencing) { if (scrollFast()) { el.classList.remove("gx-dim") } else lightLater(el) }
                }
            }, { threshold: 0, rootMargin: "0px 0px -12% 0px" })
            const play = (only?: HTMLElement[]) => {
                armed = false
                lit = only ? total() - only.length : 0
                sig()
                const vh = window.innerHeight
                const list = only || cells().filter((el) => { const r = el.getBoundingClientRect(); return r.top < vh * 0.88 && r.bottom > 0 })
                const N = list.length
                const D = G().count
                const t0 = performance.now()
                let k0 = 0
                sequencing = true
                cancelAnimationFrame(raf)
                const step = (now: number) => {
                    const k = Math.min(1, (now - t0) / D)
                    const e = k === 1 ? 1 : 1 - Math.pow(2, -10 * k)
                    const want = Math.round(N * e)
                    while (k0 < want) { const el = list[k0++]; if (el.classList.contains("gx-dim")) { el.classList.remove("gx-dim"); lit++ } }
                    label(lit)
                    if (k < 1 && k0 < N) raf = requestAnimationFrame(step)
                    else {
                        list.forEach((el) => el.classList.remove("gx-dim"))
                        sequencing = false
                        inBand.forEach(lightLater)
                    }
                }
                raf = requestAnimationFrame(step)
            }
            const near = new IntersectionObserver((es) => {
                for (const en of es) {
                    if (en.isIntersecting) { if (!armed && en.boundingClientRect.top > window.innerHeight && !scrollFast()) arm() }
                    else if (en.boundingClientRect.top > 0) reset()
                }
            }, { threshold: 0, rootMargin: "0px 0px 150% 0px" })
            const go = new IntersectionObserver((es) => { for (const en of es) if (en.isIntersecting && armed) { if (scrollFast()) reset(); else play() } }, { threshold: 0, rootMargin: "0px 0px -10% 0px" })
            let idle = 0
            on(window, "scroll", () => {
                window.clearTimeout(idle)
                idle = window.setTimeout(() => {
                    // 止まったときに暗いまま画面にあるセルは、その場で点ける
                    const dimIn = cells().filter((el) => { if (!el.classList.contains("gx-dim")) return false; const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight })
                    if (dimIn.length && !sequencing) play(dimIn)
                }, 160)
            }, { passive: true })
            offs.push(() => window.clearTimeout(idle))
            replayRef.current = () => { const v = inScreen(); v.forEach((el) => el.classList.add("gx-dim")); play(v) }
            cells().forEach((el) => cellGo.observe(el))
            offs.push(() => cellGo.disconnect())
            near.observe(root)
            go.observe(root)
            offs.push(() => { near.disconnect(); go.disconnect(); reset() })
        }

        return () => {
            cancelAnimationFrame(raf)
            timers.forEach((t) => clearTimeout(t))
            offs.forEach((f) => f())
            replayRef.current = null
            say(GRID_FX[kind].idle)
        }
    }, [kind, hoverable, reduced, isStatic, sp])

    // スライダー：動かしている間は値だけ替え、止まって 140ms で一覧を演じ直す
    const onSlide = (v: number) => {
        setVal(v)
        valRef.current = v
        if (typeof window === "undefined") return
        window.clearTimeout(rpT.current)
        rpT.current = window.setTimeout(() => replayRef.current?.(), 140)
    }

    const fg = dark ? paper : ink
    const sub = dark ? "rgba(244,244,241,.62)" : muted
    const bg = dark ? ink : PAPER
    const meta: CSSProperties = { fontFamily: MONO, fontSize: sp ? 13 : 14, letterSpacing: "0.03em", color: sub, fontVariantNumeric: "tabular-nums" }
    // 値の札：FV の「↑ いまの見出し＝」と同じ見え方（明るい地＝ライムの薄い下敷きに近黒の字／暗い地＝ライムの字）
    const chipCss: CSSProperties = dark
        ? { color: accent, background: "rgba(165,224,46,.14)" }
        : { color: ink, background: "rgba(165,224,46,.38)" }
    const live = kind === "count" ? `lit ${String(n).padStart(2, "0")} / ${String(n).padStart(2, "0")}` : GRID_FX[kind].idle
    const vs = val.toFixed(PRM.dp)
    const href = "/entries/" + demo.slug + (Math.abs(val - PRM.def) > 1e-9 ? `?${PRM.key}=${vs}` : "")
    const slider = (
        <label className="mdx-gxs" style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0, ...meta, color: fg, flex: sp ? "1 1 auto" : "none" }}>
            <span style={{ color: sub, whiteSpace: "nowrap" }}>{PRM.key}</span>
            <input
                type="range"
                min={PRM.min}
                max={PRM.max}
                step={PRM.step}
                value={val}
                disabled={isStatic}
                onChange={(ev) => onSlide(parseFloat(ev.target.value))}
                aria-label={`${demo.ja} の ${PRM.key}（動かすと、この章の一覧がその値で演じ直す）`}
                style={{ width: sp ? "100%" : 150, minWidth: 0, flex: sp ? "1 1 auto" : "none", accentColor: dark ? accent : ink, margin: 0, height: 24, cursor: "pointer" }}
            />
            <span style={{ minWidth: "5ch", textAlign: "right", whiteSpace: "nowrap", fontWeight: 600 }}>{vs}{PRM.unit}</span>
        </label>
    )
    const reading = (
        <span aria-hidden style={{ ...meta, color: fg, display: "inline-flex", alignItems: "center", gap: 10, flex: "none" }}>
            {!sp ? <span style={{ color: sub }}>いま</span> : null}
            <span ref={kind === "count" ? cntRef : readRef} style={{ ...chipCss, fontFamily: MONO, fontWeight: 600, fontSize: sp ? 17 : 24, lineHeight: 1.25, letterSpacing: "-0.01em", borderRadius: 4, padding: sp ? "1px 8px" : "2px 12px", whiteSpace: "nowrap", display: "inline-block", minWidth: sp ? "11ch" : "13ch", textAlign: "center" }}>{live}</span>
        </span>
    )
    return (
        <div ref={rootRef} className={"mdx-gx gx-" + kind + (dark ? " dk" : "")} style={frame}>
            {/* 扉と同じ自己言及：この一覧の振る舞い自体が辞典の1項目。帯は検索バーの直下に貼り付き、章の一覧を読んでいる間ずっと値が見える */}
            <div className="mdx-gxbar" style={{ position: "sticky", top, zIndex: 4, background: bg, margin: `0 -${gutter}px ${sp ? 14 : 22}px`, padding: `${sp ? 8 : 10}px ${gutter}px`, borderBottom: `1px solid ${dark ? "rgba(244,244,241,.14)" : "rgba(10,10,10,.12)"}`, display: "flex", flexWrap: sp ? "wrap" : "nowrap", justifyContent: "space-between", alignItems: "center", columnGap: sp ? 12 : 28, rowGap: 6, minHeight: sp ? 36 : 52, boxSizing: "border-box" }}>
                <a className="mdx-credit" href={href} style={{ ...meta, color: fg, textDecoration: "none", display: "inline-flex", gap: sp ? 8 : 12, alignItems: "baseline", minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", flex: "0 1 auto" }}>
                    <span style={{ color: sub }}>{sp ? "一覧の動き" : "この一覧の動き"}</span>
                    <span style={{ position: "relative", fontFamily: JP, fontWeight: 700, fontSize: sp ? 15 : 16, letterSpacing: "0.02em" }}>
                        {demo.ja}{sp ? <span aria-hidden> ↗</span> : null}
                        <span ref={sigRef} aria-hidden className="mdx-sig" style={{ background: dark ? accent : ink }} />
                    </span>
                    {!sp ? <span style={{ color: sub, overflow: "hidden", textOverflow: "ellipsis" }}>{gxLabel(kind, val)}<span aria-hidden style={{ color: fg }}> ↗</span></span> : null}
                </a>
                {sp ? reading : null}
                {sp ? <div style={{ flex: "1 0 100%", display: "flex", minWidth: 0 }}>{slider}</div> : <span style={{ display: "inline-flex", alignItems: "center", gap: 28, flex: "none", marginLeft: "auto" }}>{slider}{reading}</span>}
            </div>
            <div ref={wrapRef} className="mdx-gw">{children}</div>
        </div>
    )
}

// ─── 並びの割り付け（2026-10-25 Awwwards 2周目）────────────────────────
// 全カードの位置をここで決める。grid の dense 任せでは、右寄せの大判が段を飛ばして穴を残し、
// 章の最後の1枚が段に孤立していた（独立レビュー：炎のゆらめき・グラデーションボーダーの右に大きな穴）。
// 最後の段が埋まらないときは、その段の分を places から外して tail に回す（呼び出し側で幅を割り直す）。
// 大判が最後の段にかかって穴が残る場合は、いちばん後ろの大判を普通のカードに戻して組み直す。
type Place = { k: number; r: number; c: number; w: number; h: number; big: boolean }
function pack(count: number, n: number, bigs: Map<number, "L" | "R">): { places: Place[]; tail: number[] } {
    const B = new Map(bigs)
    for (;;) {
        const occ: boolean[][] = []
        const row = (r: number) => (occ[r] ||= new Array(n).fill(false))
        const fits = (r: number, c: number, w: number, h: number) => {
            for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) if (row(y)[x]) return false
            return true
        }
        const mark = (r: number, c: number, w: number, h: number) => {
            for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) row(y)[x] = true
        }
        const places: Place[] = []
        let first = 0
        for (let k = 0; k < count; k++) {
            while (row(first).every(Boolean)) first++
            const side = B.get(k)
            if (side !== undefined && n >= 2) {
                const w = n >= 3 ? 2 : n
                const h = n >= 3 ? 2 : 1
                const c = side === "R" ? n - w : 0
                let r = first
                while (!fits(r, c, w, h)) r++
                mark(r, c, w, h)
                places.push({ k, r, c, w, h, big: true })
            } else {
                let r = first
                let c = row(r).indexOf(false)
                while (c < 0) c = row(++r).indexOf(false)
                mark(r, c, 1, 1)
                places.push({ k, r, c, w: 1, h: 1, big: false })
            }
        }
        if (!places.length || n <= 1) return { places, tail: [] }
        const R = Math.max(...places.map((p) => p.r + p.h - 1))
        let holeAbove = false
        for (let y = 0; y < R; y++) if (row(y).some((x) => !x)) holeAbove = true
        const last = row(R)
        if (!holeAbove && last.every(Boolean)) return { places, tail: [] }
        const bigInLast = places.some((p) => p.big && p.r + p.h - 1 === R && p.r !== R)
        if (!holeAbove && !bigInLast && !places.some((p) => p.big && p.r === R)) {
            const tail = places.filter((p) => p.r === R).map((p) => p.k)
            return { places: places.filter((p) => p.r !== R), tail }
        }
        if (!B.size) return { places, tail: [] }
        B.delete(Math.max(...B.keys()))
    }
}

// ─── 自動再生の割り当て（2026-10-25 Awwwards 2周目）────────────────────
// 旧：ホバーした1本だけが動き、196枚は「黒い箱の中央に小さな白文字」の静止画の壁だった（独立レビュー2人）。
// 新：画面に入っているカードのうち、画面の中央に近い数枚だけ録画を回す（PC 最大6・SP 最大2）。
//  ・ホバー／フォーカス中の1本は最優先（上限に含める）。reduced-motion では自動再生しない（ホバーは本人の操作なので回す）
//  ・判定は スクロールが止まって120ms後＋スクロール中でも600msごと。速く流している間に録画を取りに行かない
//  ・選ばれたカードにだけ <video>（preload="none"）を載せ、外れたら src を外して要素ごと消す＝帯域とデコードを使わない
//  ・枠の6割以上が画面に入っているものだけを候補にする（端で切れている枠は回しても見えない）
//  ・強い1枚は中央からの距離を 1/3 に見る＝画面に入っていればほぼ必ず回る
interface APSlot { el: HTMLElement; prio: number; set: (on: boolean) => void; on: boolean; seen: boolean }
const AP: { slots: Map<string, APSlot>; byEl: Map<Element, string>; hover: string; io: IntersectionObserver | null; idle: number; last: number; off: null | (() => void) } = {
    slots: new Map(),
    byEl: new Map(),
    hover: "",
    io: null,
    idle: 0,
    last: 0,
    off: null,
}
function apPick() {
    if (typeof window === "undefined") return
    AP.last = performance.now()
    const vh = window.innerHeight
    const cap = window.innerWidth < 640 ? 2 : 6
    const auto = !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    const hov = AP.slots.has(AP.hover) ? AP.hover : ""
    const cand: [number, string][] = []
    if (auto)
        AP.slots.forEach((s, k) => {
            if (k === hov || !s.seen) return
            const r = s.el.getBoundingClientRect()
            if (r.height < 1) return
            const vis = Math.min(r.bottom, vh) - Math.max(r.top, 0)
            if (vis < Math.min(r.height, vh) * 0.6) return
            cand.push([Math.abs(r.top + r.height / 2 - vh / 2) / s.prio, k])
        })
    cand.sort((a, b) => a[0] - b[0])
    const keep = new Set(cand.slice(0, cap - (hov ? 1 : 0)).map((x) => x[1]))
    if (hov) keep.add(hov)
    AP.slots.forEach((s, k) => {
        const on = keep.has(k)
        if (on !== s.on) {
            s.on = on
            s.set(on)
        }
    })
}
function apKick() {
    if (typeof window === "undefined") return
    window.clearTimeout(AP.idle)
    if (performance.now() - AP.last > 600) apPick()
    AP.idle = window.setTimeout(apPick, 120)
}
function apRegister(key: string, el: HTMLElement, prio: number, set: (on: boolean) => void): () => void {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return () => {}
    if (!AP.io) {
        AP.io = new IntersectionObserver(
            (es) => {
                for (const en of es) {
                    const k = AP.byEl.get(en.target)
                    const s = k ? AP.slots.get(k) : undefined
                    if (s && s.el === en.target) s.seen = en.isIntersecting
                }
                apKick()
            },
            { threshold: [0, 0.6] }
        )
        const on = () => apKick()
        window.addEventListener("scroll", on, { passive: true })
        window.addEventListener("resize", on)
        AP.off = () => {
            window.removeEventListener("scroll", on)
            window.removeEventListener("resize", on)
            window.clearTimeout(AP.idle)
            AP.io?.disconnect()
            AP.io = null
            AP.off = null
        }
    }
    const s: APSlot = { el, prio, set, on: false, seen: false }
    AP.slots.set(key, s)
    AP.byEl.set(el, key)
    AP.io.observe(el)
    apKick()
    return () => {
        AP.io?.unobserve(el)
        AP.byEl.delete(el)
        if (AP.slots.get(key) === s) AP.slots.delete(key)
        if (AP.hover === key) AP.hover = ""
        if (!AP.slots.size) AP.off?.()
        else apKick()
    }
}
function apHover(key: string, on: boolean) {
    if (on) AP.hover = key
    else if (AP.hover === key) AP.hover = ""
    apPick()
}

/** カード1枚の録画の出し入れ（一覧のカード・強い1枚で共通） */
function usePlay(slug: string, prio: number, hoverable: boolean, isStatic: boolean) {
    const [active, setActive] = useState(false)
    const [ready, setReady] = useState(false)
    const vRef = useRef<HTMLVideoElement>(null)
    const phRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const el = phRef.current
        if (!el) return
        const off = apRegister(slug, el, prio, (on) => setActive(on))
        return () => {
            off()
            setActive(false)
        }
    }, [slug, prio, isStatic])

    useEffect(() => {
        const v = vRef.current
        if (!active || !v) {
            setReady(false)
            return
        }
        const p = v.play()
        if (p && p.catch) p.catch(() => {})
        // 外れたら取得も止める（要素を消すだけでは読み込みが続くことがある）
        return () => {
            try {
                v.pause()
                v.removeAttribute("src")
                v.load()
            } catch {}
        }
    }, [active])

    const hov = !isStatic && hoverable
        ? { onMouseEnter: () => apHover(slug, true), onMouseLeave: () => apHover(slug, false), onFocus: () => apHover(slug, true), onBlur: () => apHover(slug, false) }
        : {}
    return { active, ready, setReady, vRef, phRef, hov }
}

// ポスターの先回り読み込み（5周目）：loading="lazy" の既定の距離（Chrome で約1250px）では高速スクロールに追いつかなかった。
// 自前の IntersectionObserver で、下へ画面2.5枚ぶん・上へ1枚ぶん先から src を入れる。下塗り（PF_LQIP）と併用
const PL: { io: IntersectionObserver | null; src: Map<Element, string> } = { io: null, src: new Map() }
function plWatch(img: HTMLImageElement, src: string): () => void {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) { img.src = src; return () => {} }
    if (!PL.io)
        PL.io = new IntersectionObserver(
            (es) => {
                for (const en of es) {
                    if (!en.isIntersecting) continue
                    const el = en.target as HTMLImageElement
                    const u = PL.src.get(el)
                    if (u && !el.getAttribute("src")) el.src = u
                    PL.src.delete(el)
                    PL.io?.unobserve(el)
                }
            },
            { rootMargin: "100% 0px 250% 0px" }
        )
    PL.src.set(img, src)
    PL.io.observe(img)
    return () => { PL.io?.unobserve(img); PL.src.delete(img) }
}
function Media({ e, isStatic, P, eager }: { e: Entry; isStatic: boolean; P: ReturnType<typeof usePlay>; eager?: boolean }) {
    const imgRef = useRef<HTMLImageElement>(null)
    const direct = isStatic || !!eager
    useEffect(() => {
        const img = imgRef.current
        if (direct || !img) return
        return plWatch(img, e.poster)
    }, [e.poster, direct])
    const lq = lqipOf(e.slug)
    return (
        <span className="ph" ref={P.phRef} style={lq ? { backgroundImage: lq, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
            {/* 止まっている時に黒地に暗灰でほぼ読めないポスター（PF_DIM・70/196枚）は明るさを補正する。録画が回り始めたら録画が上に重なる */}
            {/* src は先回り読み込み（plWatch）が入れる。読み込み前は img を透明にして下塗りを見せる（壊れた画像の枠を出さない） */}
            <img ref={imgRef} src={direct ? e.poster : undefined} alt="" decoding="async" className={direct ? undefined : "pl"}
                onLoad={(ev) => ev.currentTarget.classList.add("in")}
                style={dimOf(e.slug) ? { filter: `brightness(${dimOf(e.slug)})` } : undefined} />
            {!isStatic && P.active ? (
                <video
                    ref={P.vRef}
                    className={P.ready ? "on" : ""}
                    src={e.video}
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload="none"
                    // 再生は動きの頭から（ポスター＝見せ場の時刻から始めると途中から見せることになる）。
                    // ポスターからの切り替えは 0.18s のフェードで繋ぐ
                    onPlaying={() => P.setReady(true)}
                    aria-hidden
                />
            ) : null}
        </span>
    )
}

interface CardProps {
    e: Entry
    ink: string
    muted: string
    accent: string
    hoverable: boolean
    reduced: boolean
    isStatic: boolean
    sp: boolean
    big?: boolean
    row?: boolean
    wide?: boolean // 横長カード（文字の章：見本が読める大きさのポスター＋説明）
    size?: "s" | "m" | "l"
    dark?: boolean // 暗い章の地（6周目）
}

// 6周目（指摘6）：一覧の名前の演技は 600ms 以内（1.2s だと撮った瞬間に「メニ_」「グラデーシ」と途中で止まって見えた）
const CARD_CAP = 600
const DIM_ON_INK = "rgba(244,244,241,.62)"

function Card({ e, ink, muted, accent, hoverable, reduced, isStatic, sp, big, row, wide, size = "m", dark = false }: CardProps) {
    const P = usePlay(e.slug, big ? 1.5 : 1, hoverable, isStatic)
    const nameRef = useRef<HTMLSpanElement>(null)
    const fg = dark ? PAPER : ink
    const sub = dark ? DIM_ON_INK : muted
    // 暗い地では演技の「地」と「字」を入れ替える（実演面と同じ）
    const pf = useCardPerform(nameRef, e, { hoverable, reduced, isStatic, cap: CARD_CAP, colors: dark ? { ink: PAPER, paper: ink, muted: DIM_ON_INK, accent } : { ink, paper: PAPER, muted, accent } })
    const [main, alt] = splitName(e.nameJa)

    return (
        <a className={"mdx-card" + (row ? " row" : "") + (wide ? " wide" : "")} data-slug={e.slug} href={"/entries/" + e.slug} title={`${e.nameJa} — ${sentence(e.nameEn)}`} {...P.hov} {...pf}>
            <span className="lf">
                <Media e={e} isStatic={isStatic} P={P} />
            </span>
            <span className="tx" style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                <span
                    className={sp ? "nm w" : "nm"}
                    style={{
                        alignSelf: "flex-start",
                        maxWidth: "100%",
                        fontFamily: JP,
                        fontSize: big ? 24 : sp ? 13.5 : size === "l" ? 20 : size === "s" ? 14 : 16,
                        fontWeight: 700,
                        lineHeight: 1.45,
                        letterSpacing: "-0.005em",
                        color: fg,
                        // PC：横は切って省略記号、縦は演技のはみ出し（跳ねる・浮く）を見せる。
                        // SP：2列で1枚 170px 前後しかなく「…」で切れていた（5周目・独立レビュー A/B）→ 折り返して全部見せる。言い換えの括弧は小さく薄く
                        ...(sp
                            ? { whiteSpace: "normal", overflow: "visible", lineBreak: "strict" }
                            : { overflowX: "clip", overflowY: "visible", textOverflow: "ellipsis", whiteSpace: "nowrap" }),
                    } as CSSProperties}
                >
                    {/* 見出し語だけが演じる（言い換えの括弧は素のまま） */}
                    <span ref={nameRef} className="mdx-pf">
                        <span className="mdt-t">{charPhrases(main)}</span>
                    </span>
                    {alt ? (sp ? <span style={{ fontSize: "0.86em", fontWeight: 400, color: sub }}>（{alt}）</span> : `（${alt}）`) : null}
                </span>
                <span style={{ fontFamily: MONO, fontSize: sp ? 11 : 12, letterSpacing: "0.01em", color: sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {sentence(e.nameEn)}
                </span>
                {(big || row || size === "l") && !(sp && row) ? (
                    <span style={{ marginTop: 8, fontSize: 14, lineHeight: 1.8, color: dark ? "rgba(244,244,241,.78)" : "#45453F", maxWidth: 640, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {e.lede}
                    </span>
                ) : null}
            </span>
        </a>
    )
}

// ─── 索引の1行（2026-10-25 Awwwards 6周目・指摘1）───────────────────────────
// 構造はカードと同じ（a.mdx-card > .lf > .ph > img/video）＝カード→詳細の伸びる遷移・戻りの位置復元・録画の自動再生（優先度は低め）・名前の演技がそのまま効く。
// 見た目は辞典の索引：小さなサムネ（16:9）＋和名＋英名（広い章は説明1行）＋通し番号。罫線1px で区切る
interface IndexRowProps {
    e: Entry
    no: number
    ink: string
    paper: string
    muted: string
    accent: string
    hoverable: boolean
    reduced: boolean
    isStatic: boolean
    sp: boolean
    dark: boolean
    tw: number
    wide: boolean
}
// ─── 索引の行のホバー（8周目 A2・Signal-A 型）──────────────────────────────
// 中盤の索引に「絵」が無かった（独立レビュー A）。行にホバー（SP は画面の中央に来た行）すると、
//  ・見出しが 1.45 倍（SP 1.3 倍）に大きくなって、その項目の動きで演じる（下端を軸に上へ伸びる＝英名に重ならない）
//  ・デモの絵（ポスター → 録画）が、行の右から上へ大きく立ち上がる（行の上の罫線に立つ。版面の内側・行の右端の番号の手前）
// どちらも重ねる層（transform / position:absolute）＝総高さは増えない。絵は初めて開いたときに読む（帯域を使わない）
const IXC: { rows: Map<HTMLElement, (on: boolean) => void>; cur: HTMLElement | null; raf: number; t: number; on: boolean } = { rows: new Map(), cur: null, raf: 0, t: 0, on: false }
function ixPick() {
    IXC.raf = 0
    const vh = window.innerHeight
    let best: HTMLElement | null = null, bd = vh * 0.16
    IXC.rows.forEach((_, el) => {
        const r = el.getBoundingClientRect()
        if (r.height < 1 || r.bottom < 0 || r.top > vh) return
        const d = Math.abs(r.top + r.height / 2 - vh * 0.52)
        if (d < bd) { bd = d; best = el }
    })
    if (best === IXC.cur) return
    if (IXC.cur) IXC.rows.get(IXC.cur)?.(false)
    IXC.cur = null
    window.clearTimeout(IXC.t)
    // 中央に 0.15 秒とどまった行だけ開く（流し読みで次々に開かない）
    const b = best as HTMLElement | null
    if (b) IXC.t = window.setTimeout(() => { if (scrollFast()) return; IXC.cur = b; IXC.rows.get(b)?.(true) }, 150)
}
function ixRegister(el: HTMLElement, set: (on: boolean) => void): () => void {
    if (typeof window === "undefined") return () => {}
    IXC.rows.set(el, set)
    if (!IXC.on) {
        IXC.on = true
        const kick = () => { if (!IXC.raf) IXC.raf = requestAnimationFrame(ixPick) }
        window.addEventListener("scroll", kick, { passive: true })
        window.addEventListener("resize", kick)
    }
    return () => { IXC.rows.delete(el); if (IXC.cur === el) IXC.cur = null }
}

function IndexRow({ e, no, ink, paper, muted, accent, hoverable, reduced, isStatic, sp, dark, tw, wide }: IndexRowProps) {
    const P = usePlay(e.slug, 0.5, hoverable, isStatic)
    const nameRef = useRef<HTMLSpanElement>(null)
    const aRef = useRef<HTMLAnchorElement>(null)
    const playRef = useRef<(() => void) | null>(null)
    const fg = dark ? paper : ink
    const sub = dark ? DIM_ON_INK : muted
    const pf = useCardPerform(nameRef, e, { hoverable, reduced, isStatic, cap: CARD_CAP, colors: dark ? { ink: paper, paper: ink, muted: DIM_ON_INK, accent } : { ink, paper, muted, accent } }, playRef)
    const [main, alt] = splitName(e.nameJa)
    const fs = wide ? 22 : sp ? 15 : 16
    // 開いているか（ホバー／SP の中央）と、絵を一度でも開いたか（開いたら以後は要素を残す＝閉じるときも絵が沈んで見える）
    const [pv, setPv] = useState(false)
    const [seen, setSeen] = useState(false)
    useEffect(() => {
        if (isStatic || hoverable || typeof window === "undefined") return
        const el = aRef.current
        if (!el) return
        return ixRegister(el, (on) => {
            setPv(on)
            if (on) { setSeen(true); playRef.current?.() }
        })
    }, [isStatic, hoverable])
    const open = !isStatic && hoverable
        ? {
              onMouseEnter: () => { (P.hov as any).onMouseEnter?.(); setSeen(true); setPv(true) },
              onMouseLeave: () => { (P.hov as any).onMouseLeave?.(); setPv(false) },
          }
        : {}
    // 開いている間は録画を右の大きな絵で回す（小さなサムネでは回さない＝同じ録画を2本取らない）
    const Pt = pv ? { ...P, active: false } : P
    return (
        <a ref={aRef} className={"mdx-card mdx-ix" + (pv ? " on" : "")} data-slug={e.slug} href={"/entries/" + e.slug} title={`${e.nameJa} — ${sentence(e.nameEn)}`} style={{ ["--tw" as string]: tw + "px", ["--nz" as string]: sp ? "1.3" : wide ? "1.4" : "1.45", color: fg } as CSSProperties} {...P.hov} {...pf} {...open}>
            <span className="lf">
                <Media e={e} isStatic={isStatic} P={Pt} />
            </span>
            <span className="tx" style={{ display: "flex", flexDirection: "column", gap: wide ? 4 : 2, minWidth: 0 }}>
                {/* SP は省略記号で切らずに折り返す（5周目のカードと同じ） */}
                <span className={sp ? "nm w" : "nm"} style={{ alignSelf: "flex-start", maxWidth: "100%", fontFamily: JP, fontSize: fs, fontWeight: 700, lineHeight: 1.45, letterSpacing: wide ? "-0.01em" : "0", color: fg, ...(sp ? { whiteSpace: "normal", overflow: "visible", lineBreak: "strict" } : { overflowX: "clip", overflowY: "visible", textOverflow: "ellipsis", whiteSpace: "nowrap" }) } as CSSProperties}>
                    <span ref={nameRef} className="mdx-pf">
                        <span className="mdt-t">{charPhrases(main)}</span>
                    </span>
                    {alt ? <span style={{ fontSize: "0.8em", fontWeight: 400, color: sub }}>（{alt}）</span> : null}
                </span>
                <span style={{ fontFamily: MONO, fontSize: sp ? 11 : 12, letterSpacing: "0.01em", color: sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {sentence(e.nameEn)}
                </span>
                {wide ? (
                    <span style={{ marginTop: 4, fontSize: 14, lineHeight: 1.7, color: dark ? "rgba(244,244,241,.78)" : "#45453F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 760 }}>
                        {e.lede}
                    </span>
                ) : null}
            </span>
            <span className="no" aria-hidden style={{ color: sub }}>{String(no).padStart(2, "0")}</span>
            {seen && !isStatic ? (
                <span className="pv" aria-hidden>
                    <img src={e.poster} alt="" decoding="async" style={dimOf(e.slug) ? { filter: `brightness(${dimOf(e.slug)})` } : undefined} />
                    {pv && !reduced ? <video src={e.video} muted loop playsInline autoPlay preload="auto" /> : null}
                </span>
            ) : null}
        </a>
    )
}

// ─── 章の実演面（2026-10-25 Awwwards 3周目）────────────────────────────
// 2周目の「強い1枚」（版面の2/3〜全幅の大判カード）でも、30,000px の8割が同じ密度の黒タイルだった（独立レビュー2人）。
// 各章に1回だけ「溜めと解放」を置く：章の代表1本を、高さ約100vh（SP 80vh）の面に昇格させ、録画を大きく流し、
// 和名を大判で置いて、その和名がその項目の動きで演じる（一覧のカードと同じ演技。8周目：実演面も 0.6s で着地＝旧 2.0s は途中の姿が写った）。
// 構図は章ごとに変える：L＝全面の録画・左下に名前／R＝全面の録画・右下に名前／C＝上に名前・中央に録画／S＝上に録画・下に名前と一言
// 構造は一覧のカードと同じ（a.mdx-card > .lf > .ph > img/video）＝カード→詳細の遷移と戻りの位置復元がそのまま効く。
// 録画は usePlay（画面に6割入ったものだけ回す）＝画面に入ったときだけ再生
type StageAt = "L" | "R" | "C" | "S"
interface StageProps {
    e: Entry
    at: StageAt
    n: number
    chapter: string
    ink: string
    paper: string
    muted: string
    accent: string
    hoverable: boolean
    reduced: boolean
    isStatic: boolean
    sp: boolean
    w: number
    gutter: number
}

function Stage({ e, at, n, chapter, ink, paper, accent, hoverable, reduced, isStatic, sp, w, gutter }: StageProps) {
    const P = usePlay(e.slug, 3, hoverable, isStatic)
    const [main, alt] = splitName(e.nameJa)
    const head = (e.lede.split("。")[0] || e.lede).trim() + "。"
    const cat = CATS.find((c) => c.key === chapter)
    const nameRef = useRef<HTMLSpanElement>(null)
    const live = useRef<PfHandle | null>(null)
    const dim = "rgba(244,244,241,.62)"
    // 名前の大きさ：見出し語の字数と、名前が使える幅から（1行に収める）
    const len = Math.max(4, Array.from(main).length)
    const avail = sp ? w - gutter * 2 : at === "C" ? Math.min(w, 1680) - gutter * 2 : Math.min(w, 1680) * (at === "S" ? 0.62 : 0.58)
    const fs = Math.max(30, Math.floor(Math.min(sp ? 64 : at === "C" ? 200 : 168, avail / (len * 0.97))))

    const play = () => {
        const el = nameRef.current
        if (!el || live.current) return
        live.current = pfPlay(el, {
            slug: e.slug, cat: e.category, en: sentence(e.nameEn).split(" / ")[0] || e.nameEn, cap: CARD_CAP, hold: false, card: false,
            // 暗い面の上なので、演技の「地」と「字」を入れ替える
            colors: { ink: paper, paper: ink, muted: dim, accent },
            onEnd: () => { live.current = null },
        })
    }
    // 面が半分以上見えたら1回（画面から完全に出たら、次に入ったときにまた1回）
    useEffect(() => {
        if (isStatic || reduced || typeof window === "undefined" || !("IntersectionObserver" in window)) return
        const el = nameRef.current?.closest("a") as HTMLElement | null
        if (!el) return
        let armed = true
        let t = 0
        const io = new IntersectionObserver(
            (es) => {
                for (const en of es) {
                    if (en.intersectionRatio >= 0.5 && armed) {
                        armed = false
                        window.clearTimeout(t)
                        t = window.setTimeout(play, 260)
                    } else if (!en.isIntersecting) {
                        armed = true
                        window.clearTimeout(t)
                        live.current?.stop()
                    }
                }
            },
            { threshold: [0, 0.5] }
        )
        io.observe(el)
        return () => {
            io.disconnect()
            window.clearTimeout(t)
            live.current?.stop()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [e.slug, isStatic, reduced])

    const meta = (
        <span className="sm" style={{ fontFamily: MONO, fontSize: sp ? 11 : 12, letterSpacing: "0.04em", color: dim, fontVariantNumeric: "tabular-nums" }}>
            {cat ? cat.label : ""} · 01 / {String(n).padStart(2, "0")} · この章の1本
        </span>
    )
    const name = (
        <span className="sn" onPointerEnter={hoverable && !reduced ? (ev) => { if (ev.pointerType === "mouse") play() } : undefined}>
            <span
                className="nm"
                style={{ display: "block", fontFamily: JP, fontWeight: 700, fontSize: fs, lineHeight: 1.12, letterSpacing: "-0.05em", fontFeatureSettings: '"palt"', color: paper, whiteSpace: "nowrap" }}
            >
                <span ref={nameRef} className="mdx-pf">
                    <span className="mdt-t">{charPhrases(main)}</span>
                </span>
            </span>
            {alt ? <span style={{ display: "block", marginTop: sp ? 6 : 10, fontFamily: JP, fontSize: sp ? 14 : 18, lineHeight: 1.6, letterSpacing: "0.02em", color: paper, ...WRAP }}>{phrases(alt)}</span> : null}
            <span style={{ display: "block", marginTop: sp ? 6 : 10, fontFamily: MONO, fontSize: sp ? 11 : 13, letterSpacing: "0.01em", color: dim }}>{sentence(e.nameEn)}</span>
        </span>
    )
    const body = (
        <span className="sb">
            <span style={{ fontFamily: JP, fontWeight: 400, fontSize: sp ? 14 : 18, lineHeight: 1.7, letterSpacing: "0.02em", color: paper, ...WRAP }}>{phrases(head)}</span>
            <span className="so" style={{ fontFamily: MONO, fontSize: sp ? 11 : 12, letterSpacing: "0.04em", color: accent }}>
                Open {e.slug} <span aria-hidden>→</span>
            </span>
        </span>
    )
    return (
        <a
            className={"mdx-card mdx-stage st-" + at + (sp ? " sp" : "")}
            data-slug={e.slug}
            href={"/entries/" + e.slug}
            title={`${e.nameJa} — ${sentence(e.nameEn)}`}
            style={{ ["--g" as string]: gutter + "px", background: ink, color: paper } as CSSProperties}
            {...P.hov}
        >
            <span className="lf">
                {/* 実演面のポスターは先に読む（7枚・各25〜85KB）。面に入った瞬間に黒い面を見せない */}
                <Media e={e} isStatic={isStatic} P={P} eager />
            </span>
            <span className="sc" aria-hidden />
            {meta}
            {name}
            {body}
        </a>
    )
}

addPropertyControls(MotionDictionaryV2, {
    dataUrl: { type: ControlType.String, title: "Data URL", defaultValue: "https://ryota4100221-cmyk.github.io/motion-dict/entries-v2.json" },
    stickyTop: { type: ControlType.Number, title: "Sticky top", defaultValue: 0, min: 0, max: 200 },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#A5E02E" },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#0A0A0A" },
    paper: { type: ControlType.Color, title: "Paper", defaultValue: "#F4F4F1" },
    muted: { type: ControlType.Color, title: "Muted", defaultValue: "#6B6B66" },
})

// ── カード→詳細のつながる遷移（旧 CardMorph.tsx。Framer のコードファイル間 import が型チェックで解決できなかったので同じファイルに置く）──
// 一覧カード → 詳細ページの「つながる遷移」（2026-10-25）
//
// 旧版の問題：カードは素の <a> で、クリックするとフルのページ読み込み。白い画面が約250ms出て、
// 着地後にデモ枠が組み替わるのが見えた（レビュー指摘）＝一覧と詳細が別のサイトに見える。
//
// やること：カードの絵（ポスター／再生中なら今のコマ）を fixed の板に載せ、
// 「詳細ページのデモ枠が出る位置」まで伸ばす。同時に背景を生成りで覆う。
//
// 2026-10-25（Awwwards 3周目）：location.assign（文書ごと読み直し）をやめ、Framer のルーターで移る。
//   実測（公開中の複製・ken-burns）：location.assign だと、地が満ちてから新しい文書が描かれるまで約450ms、
//   生成りの地に板だけが浮いた「何もない画面」が続いていた（レビューの「白画面約0.5秒」）。
//   コードコンポーネントの素の <a> は Framer のルーターを通らない（click() し直しても文書ごと読み直す・実測）。
//   useRouter().navigate(routeId, hash, pathVariables) なら文書が切り替わらず、板も body に残る。
//   板は詳細側（EntryLab）が「デモ枠のポスターが描けた」ところで外す（CMS のポスターは一覧と別URL＝未キャッシュで、
//   旧版は着地後しばらくデモ枠が真っ黒だった）。ルーターが無い（取れない）ときは従来どおり location.assign。
// ブラウザの paint holding で最後のコマ（＝デモ枠の位置にあるポスター）が残り、
// 詳細ページは SSR でデモ枠にポスターを描く（EntryLab の posterImage）ので、絵が途切れずにつながる。
//
// 詳細ページのデモ枠の位置は、本番相当のプレビューを Playwright で実測して式にした（2026-10-25）：
//   ・PC（≥1200）：版面 = min(vw-80, 1360) を中央寄せ。版面 ≥ 980 なら2列（デモ:右 = 1.3:1、間40）
//   ・タブレット（810〜1199）：左右32。版面 ≥ 980 なら2列、未満なら全幅
//   ・SP（<810）：左右16・全幅
//   ・高さはどれも 16:9
//   ・縦位置だけは見出しと説明文の行数で動く（PC 195件で 468〜624px／SP 390幅で 467〜668px）。そこで
//     ①その項目をこの幅で開いたことがあれば、EntryLab が記録した実測値（localStorage）を使う
//     ②無ければ下の実測表、③表に無い新項目は、見出しに言い換え（括弧）があるかで分けた中央値
//
// 呼び出し：一覧のクリック（capture）で morphAndGo(a, ev)。修飾キー・中クリック・reduced-motion は何もしない。

const PAPER = "#F4F4F1"
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"
const DUR = 520 // ms。0.45〜0.6s の中。長いと「待たされる」、短いと伸びたのが見えない

const MORPH_KEY = "md-morph" // { slug, t } … 詳細側が2秒以内なら「カードから来た」と判断する
const DEMO_Y_KEY = "md-demo-y" // { [slug]: { bp, vw, y } } … 詳細側が書く実測の縦位置

type Rect = { x: number; y: number; w: number; h: number }

// Framer のルーター（MotionDictionaryV2 が useRouter() で取って置く）
let ROUTER: any = null
// ルーターを使うときは、板が伸びている途中で移り始める（詳細ページを地の下で先に描かせ、ポスターの読み込みを前に出す）
const NAV_AT = 180 // ms

/** "/entries/ken-burns" → { id: 詳細ページの routeId, vars: { <変数名>: "ken-burns" } }（routes の path は "/entries/:xxxx"） */
function matchRoute(routes: any, pathname: string): { id: string; vars: Record<string, string> } | null {
    if (!routes || typeof routes !== "object") return null
    const segs = pathname.replace(/\/+$/, "").split("/")
    for (const id of Object.keys(routes)) {
        const path = routes[id] && routes[id].path
        if (typeof path !== "string") continue
        const ps = path.replace(/\/+$/, "").split("/")
        if (ps.length !== segs.length) continue
        const vars: Record<string, string> = {}
        let ok = true
        for (let i = 0; i < ps.length; i++) {
            if (ps[i].startsWith(":")) vars[ps[i].slice(1)] = decodeURIComponent(segs[i])
            else if (ps[i] !== segs[i]) { ok = false; break }
        }
        if (ok && Object.keys(vars).length) return { id, vars }
    }
    return null
}
// 板と地を外す（受け側が外さなかったときの保険）
function clearLayers() {
    document.querySelectorAll<HTMLElement>(".md-morph-layer").forEach((n) => {
        const a = n.animate([{ opacity: getComputedStyle(n).opacity }, { opacity: 0 }], { duration: 200, fill: "forwards" })
        a.finished.then(() => n.remove(), () => n.remove())
    })
}

function breakpoint(vw: number): "d" | "t" | "p" {
    return vw >= 1200 ? "d" : vw >= 810 ? "t" : "p"
}

// 縦位置の表（2026-10-25 3周目で更新）。"slug:PC.SP" で、値は y-400（整数px）。
//   PC＝公開中の複製（1440幅・195件）の実測から、説明文を2行（14px・行間170%）にした分を引いた予測値。
//     説明文の組みを Framer で変えて公開した後、measure_all で取り直して差し替える（受け側 EntryLab が着地時に数pxのずれは寄せる）
//   SP＝公開中の複製（390幅）の実測。
//   ※タブレット（810〜1199）は説明文の組みが PC と別になったので、下の「PC から -8」は数十pxずれうる（受け側が寄せる）
//   PC = 1440幅（1200以上はどの幅でも同じ値になる＝見出しの欄が固定幅）／SP = 390幅
//   タブレット（810〜1199）は PC から -8（12件で実測：-8が10件、-4.6/-2.7が各1件）
// 作り直し：/Users/shitoryota/projects/motion-dict-v2-blind/aww/r1/morph/measure_all.cjs → ytable.txt
const Y_TABLE =
    "underline-reveal:61.75 text-scramble:61.70 spotlight-hover:61.70 fill-hover:61.80 lift-hover:61.96 " +
    "directional-hover:60.117 focus-dim:61.70 custom-cursor:61.70 border-draw:61.87 magnetic-hover:61.70 " +
    "image-trail:60.80 text-slide-swap:57.67 glitch-hover:60.87 hover-wave:61.87 hover-preview:60.110 tilt:111.162 " +
    "image-swap-hover:60.104 mouse-parallax:61.75 row-expand:60.126 shadow-pop:60.138 letter-spacing-hover:60.131 " +
    "arrow-slide-through:60.108 holo-sheen:111.202 line-boil:111.213 xray-lens:111.238 flame-flicker:111.217 " +
    "perspective-reveal:57.67 scroll-fade-in:57.97 parallax:61.96 dock-magnify:60.104 scroll-progress:61.75 " +
    "text-highlight:61.70 velocity-skew:61.96 scroll-scrub:60.104 text-on-path:60.117 sticky-pin:61.80 " +
    "horizontal-scroll:57.88 section-color-swap:60.121 scroll-snap:60.104 stacking-cards:61.75 cube-roll:60.146 " +
    "header-shrink:61.75 smooth-scroll:60.87 scroll-zoom:61.80 header-hide-on-scroll:61.101 header-invert:60.117 " +
    "scroll-spy:61.80 footer-reveal:60.80 rubber-band:60.117 split-text-reveal:61.70 progressive-blur:111.133 " +
    "block-reveal:60.110 typewriter:61.87 blur-reveal:61.87 scroll-marquee:57.117 word-rotate:61.70 " +
    "outline-fill:60.75 gradient-shine:57.97 number-roll:60.117 wave-text:61.87 tracking-in:60.96 marquee:61.96 " +
    "color-wave:60.87 text-flip:61.80 counter:60.87 split-flap:60.104 opening-crawl:60.91 rotating-badge:61.110 " +
    "marker-line:60.117 sliced-text:111.114 crossfade:60.117 curtain-wipe:60.146 cover-transition:60.100 " +
    "gradient-wipe:60.130 gradient-morph:60.150 circle-reveal:60.110 crt-power-off:111.202 menu-reveal:60.110 " +
    "weight-morph:60.138 shutter-transition:57.97 zoom-through:60.155 split-screen:61.87 shared-element:60.169 " +
    "image-zoom-hover:60.110 counter-scale:60.125 ken-burns:60.126 duotone-hover:60.104 blur-load:60.126 " +
    "rack-focus:60.139 mosaic-reveal:60.110 quadtree-reveal:57.147 before-after:60.110 clip-reveal:60.110 " +
    "lightbox:60.117 carousel:60.139 cover-flow:111.187 drag-scroll:57.117 card-shuffle:60.110 " +
    "image-parallax-hover:57.97 logo-marquee:60.126 marching-ants:60.160 barber-pole:111.173 grain-overlay:60.110 " +
    "blob-morph:60.126 corner-brackets:111.158 scanlines:60.146 god-rays:60.139 fog-drift:60.176 moire-drift:60.146 " +
    "line-draw:60.140 twinkle:111.187 snowfall:111.173 liquid-distortion:111.183 ascii-effect:60.100 halftone:60.126 " +
    "frosted-glass:60.70 gradient-border:57.97 animated-beam:111.238 sprite-sheet:60.147 notched-corner:111.173 " +
    "tab-indicator:60.104 stepper:60.110 gooey-effect:60.110 story-progress:60.121 dot-pagination:106.180 " +
    "radial-carousel:61.96 dither-dissolve:111.164 bounce-in:60.126 modal-pop:60.117 squash-stretch:57.117 " +
    "spring-easing:61.91 drawer-slide:60.110 accordion:60.146 pill-expand:61.112 ruler-scrubber:61.176 " +
    "toggle-switch:60.117 checkbox-check:134.153 star-rating:111.213 bar-chart-grow:60.167 equalizer-bars:61.140 " +
    "ripple-tap:60.141 theme-toggle-transition:57.147 tooltip-pop:60.75 gauge-meter:111.202 press-feedback:60.100 " +
    "toast-slide:60.126 stamp-in:60.126 stateful-button:111.183 copy-to-clipboard:106.210 like-burst:111.188 " +
    "prize-wheel:111.187 scratch-card:111.194 floating-reactions:106.151 gift-box-reveal:111.183 fly-to-cart:60.140 " +
    "drop-zone:60.117 paper-crumple:111.194 swipe-dismiss:111.158 chat-sequence:111.218 list-add-remove:106.180 " +
    "confetti-burst:60.117 sticker-peel:111.194 flip-card:60.117 floating-label:60.100 password-strength:106.210 " +
    "dropdown-reveal:57.100 expanding-search:60.160 morphing-dropdown:134.136 ai-orb:111.268 menu-toggle:61.141 " +
    "error-shake:60.120 gesture-hint:111.158 page-turn:60.176 scroll-cue:111.194 breathing-glow:111.217 " +
    "hint-nudge:61.96 pulse-ring:61.96 ambient-float:61.91 eye-blink:111.192 orbit:111.238 pendulum-swing:111.173 " +
    "flicker-on:60.167 dvd-bounce:60.146 conic-sweep:60.126 motion-path:111.152 preloader-counter:57.97 " +
    "loading-bar:60.80 spinner-ring:61.87 dots-pulse:61.96 circular-progress:60.104 skeleton-shimmer:60.110 " +
    "spiral-reveal:111.138 liquid-fill:60.117 boot-sequence:61.169 stagger-grid:60.126"
let yMap: Record<string, [number, number]> | null = null
function measuredY(slug: string): [number, number] | null {
    if (!yMap) {
        yMap = {}
        for (const t of Y_TABLE.split(" ")) {
            const m = t.match(/^(.+):(\d+)\.(\d+)$/)
            if (m) yMap[m[1]] = [400 + +m[2], 400 + +m[3]]
        }
    }
    return yMap[slug] || null
}

// 表に無い項目（新しく足した項目）の縦位置＝中央値。[言い換えなし, 言い換えあり]
const Y_MEDIAN: Record<"d" | "t" | "p", [number, number]> = {
    d: [460, 511],
    t: [493, 544],
    p: [510, 588],
}

/** 詳細ページのデモ枠の位置（ページ最上部・スクロール0のとき）。式＋前回の実測 */
function demoRect(slug: string, vw: number, hasSub: boolean): Rect {
    const bp = breakpoint(vw)
    const side = bp === "d" ? 40 : bp === "t" ? 32 : 16
    const L = bp === "d" ? Math.min(vw - side * 2, 1360) : vw - side * 2
    const x0 = (vw - L) / 2
    const w = L >= 980 ? ((L - 40) * 1.3) / 2.3 : L
    const h = (w * 9) / 16
    const tb = measuredY(slug)
    let y = tb ? (bp === "p" ? tb[1] : tb[0] - (bp === "t" ? 8 : 0)) : Y_MEDIAN[bp][hasSub ? 1 : 0]
    try {
        const rec = JSON.parse(localStorage.getItem(DEMO_Y_KEY) || "{}")[slug]
        // SPは幅で説明文の折り返しが変わるので、幅が近いときだけ使う
        if (rec && rec.bp === bp && (bp !== "p" || Math.abs(rec.vw - vw) <= 24)) y = rec.y
    } catch {}
    return { x: x0, y, w, h }
}

let cleanupBound = false
function bindCleanup() {
    if (cleanupBound || typeof window === "undefined") return
    cleanupBound = true
    // 戻るで bfcache から復元されたとき、板が残ったままになるのを防ぐ
    window.addEventListener("pageshow", (e) => {
        if ((e as PageTransitionEvent).persisted) document.querySelectorAll(".md-morph-layer").forEach((n) => n.remove())
    })
}

function morphAndGo(a: HTMLAnchorElement, ev: MouseEvent): void {
    if (typeof window === "undefined" || !a) return
    // 新しいタブで開く操作は邪魔しない
    if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return
    if (a.target && a.target !== "_self") return
    let url: URL
    try {
        url = new URL(a.href, window.location.href)
    } catch {
        return
    }
    if (url.origin !== window.location.origin) return
    const slug = a.dataset.slug || decodeURIComponent((url.pathname.match(/\/entries\/([^/?#]+)/) || [])[1] || "")
    if (!slug) return

    try {
        sessionStorage.setItem(MORPH_KEY, JSON.stringify({ slug, t: Date.now() }))
    } catch {}
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return // 通常の遷移

    const img = a.querySelector("img") as HTMLImageElement | null
    const media = (img?.parentElement || a.querySelector("video")?.parentElement) as HTMLElement | null
    if (!media) return
    const from = media.getBoundingClientRect()
    if (from.width < 4 || from.height < 4) return

    ev.preventDefault()
    // Framer 側のリンク処理まで届かせない（defaultPrevented を見て止まるが、念のため）
    ev.stopPropagation()
    bindCleanup()
    // 6周目（指摘6）：飛ぶ前に、一覧の名前の演技を全部止めて素の名前（正しい文字）に確定させる。
    // 止めないと、地が満ちるまでの約0.3秒「PXSUTUYRUM」のような途中の字が残って見えた（独立レビュー B sheet_click）。
    // 飛んでいる間は新しい演技も始めない（1.5秒で自動で解ける＝戻ってきたときに止まったままにならない）
    pfFreeze(1500)

    const vw = document.documentElement.clientWidth
    const nameJa = (a.title || a.textContent || "").split(" — ")[0]
    const to = demoRect(slug, vw, /[（(]/.test(nameJa))

    // 背景：生成りで覆う（白いフラッシュの代わりに、詳細ページの地の色で待つ）
    const veil = document.createElement("div")
    veil.className = "md-morph-layer"
    veil.setAttribute("aria-hidden", "true")
    Object.assign(veil.style, { position: "fixed", inset: "0", zIndex: "2147483600", background: PAPER, opacity: "0", pointerEvents: "none" })

    // 板：最終の大きさで置き、transform でカードの矩形から伸ばす（width/height を動かすとレイアウトが毎フレーム走る）
    const plate = document.createElement("div")
    plate.className = "md-morph-layer"
    plate.setAttribute("aria-hidden", "true")
    Object.assign(plate.style, {
        position: "fixed", left: to.x + "px", top: to.y + "px", width: to.w + "px", height: to.h + "px",
        zIndex: "2147483601", overflow: "hidden", borderRadius: "10px", background: "#0A0A0A",
        transformOrigin: "0 0", willChange: "transform", pointerEvents: "none",
    })
    const poster = document.createElement("img")
    poster.alt = ""
    poster.decoding = "sync"
    poster.src = img?.currentSrc || img?.src || ""
    Object.assign(poster.style, { position: "absolute", inset: "0", width: "100%", height: "100%", objectFit: "cover", display: "block" })
    plate.appendChild(poster)

    // 再生中のカードなら今のコマから伸ばし、伸びる前半でポスターに戻す（着地＝ポスターなので、終わりはポスターで揃える）
    const v = a.querySelector("video") as HTMLVideoElement | null
    if (v && v.readyState >= 2 && !v.paused && getComputedStyle(v).opacity !== "0") {
        try {
            const c = document.createElement("canvas")
            c.width = v.videoWidth
            c.height = v.videoHeight
            c.getContext("2d")!.drawImage(v, 0, 0)
            Object.assign(c.style, { position: "absolute", inset: "0", width: "100%", height: "100%", objectFit: "cover", display: "block" })
            plate.appendChild(c)
            // 6周目：ポスターへ戻さない。ポスターは「見せ場」のコマで、文字の項目では崩れた字（text-scramble＝「CIY.DCSZM」）のことがある。
            // 押した瞬間に見ていたコマ（録画の今のコマ）のまま伸ばす
        } catch {}
    }

    document.body.appendChild(veil)
    document.body.appendChild(plate)

    const s = from.width / to.w
    plate.animate(
        [
            { transform: `translate(${from.x - to.x}px, ${from.y - to.y}px) scale(${s})`, borderRadius: `${8 / s}px` },
            { transform: "translate(0px, 0px) scale(1)", borderRadius: "10px" },
        ],
        { duration: DUR, easing: EASE, fill: "forwards" }
    )
    // 地は板より先に満ちる（伸びている途中で一覧が透けると、どこへ向かうのか分からない）
    const fade = veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DUR * 0.6, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" })

    let gone = false
    const R = ROUTER
    const hit = R && typeof R.navigate === "function" ? matchRoute(R.routes, url.pathname) : null
    const go = () => {
        if (gone) return
        gone = true
        if (hit) {
            try {
                const p = R.navigate(hit.id, url.hash ? url.hash.slice(1) : undefined, hit.vars)
                // 板は EntryLab が外す（ポスターが描けた時）。4秒たっても残っていたら外す
                setTimeout(clearLayers, 4000)
                Promise.resolve(p).catch(() => window.location.assign(url.href))
                return
            } catch {}
        }
        window.location.assign(url.href)
    }
    // 着地の読み込みを少しでも前に出す：伸び始めと同時に次のページの HTML を取りに行く（ルーターで移るときは不要）
    if (!hit) try {
        const l = document.createElement("link")
        l.rel = "prefetch"
        l.href = url.href
        document.head.appendChild(l)
    } catch {}
    void fade
    // ルーター：伸びている途中で移る（板は残る）／location.assign：伸び切ってから（paint holding で最後のコマを残す）
    setTimeout(go, hit ? NAV_AT : DUR + 16)
}


// ─── 一覧の和名が、その項目の動きで動く（2026-10-25 Awwwards 3周目）────────────
// 詳細ページの見出し（EntryTitle.tsx）で宿っていた「辞典の見出しが、見出しの名指す動きで動く」を、
// 一覧のカード196枚・検索結果・各章の実演面に広げる。演技の対応表（A/B/C）と部品は EntryTitle.tsx の写し（下の「演技の部品」以降）。
//  ・いつ：PC＝カードにホバーした時／SP＝カードの名前が画面に入った時に1回／実演面＝面が半分以上見えた時（出たらまた1回）
//  ・長さ：一覧では実演用に縮める（cap 既定 1.2s。実演面は 2.0s）。演技の全 Animation の playbackRate と、
//    c.later / c.loop の時間を同じ倍率で縮める＝動きの形（イージング・順番・比）は既定値のまま、時間だけ詰まる
//  ・同時に動くのはカード最大2枚（3枚目が始まると一番古いものを戻す）。SP は順番待ちにして、空いたら画面内のものから
//  ・終わったら必ず素の名前に戻る：舞台（1文字ずつ絶対配置した複製）を重ねて動かし、素の名前は visibility だけ隠す＝レイアウトは1pxも動かない
//  ・reduced-motion では演じない

// 名前を「見出し語（括弧の前）」と「言い換え（括弧の中）」に分ける
function splitName(name: string): [string, string] {
    const m = (name || "").match(/^(.+?)[（(](.+)[）)]\s*$/)
    return m ? [m[1].trim(), m[2].trim()] : [name || "", ""]
}
// 文字種の切れ目で語に分ける（EntryTitle.tsx と同じ規則。SSRとクライアントで同じHTMLを出すため正規表現だけで切る）
function words(s: string): string[] {
    const segs = s.match(/[一-鿿々]+|[ぁ-ゟ]+|[゠-ヿー]+|[A-Za-z0-9]+|\s+|./gu) || [s]
    const out: string[] = []
    for (const g of segs) {
        const prev = out[out.length - 1]
        if (out.length && (/^([ぁ-ゖ]{1,2}|[、。・）」』！？ー〜ァィゥェォッャュョヮ]+|\s+)$/.test(g) || (/^[ぁ-ゖ]+$/.test(g) && /[一-鿿々]$/.test(prev)))) out[out.length - 1] += g
        else out.push(g)
    }
    return out
}
function charPhrases(s: string): ReactNode[] {
    return words(s).map((t, i) => (
        <span key={"p" + i} className="mdt-p">
            {Array.from(t).map((ch, j) => (
                <span key={j} className="mdt-c">{ch}</span>
            ))}
        </span>
    ))
}

// 説明文の改行は文節の切れ目だけで（2026-10-25 Awwwards 4周目・指摘4）。
// 素の和文は字のどこでも折れるので「演／出。」「伝／える動き」のように語が割れ、行頭に1〜2字だけ落ちていた。
// 文字種の切れ目（words）を1つの塊（inline-block＝中では折れない）にし、開き括弧は次の塊へ、
// 最後の塊が2字以下なら前の塊とつなぐ（行頭に1〜2字を残さない）。text-wrap: pretty は効く環境での上乗せ。
// SSR とクライアントで同じ HTML（正規表現だけで切る）
const WRAP: CSSProperties = { textWrap: "pretty" } as CSSProperties
function phrases(s: string): ReactNode[] {
    const seg: string[] = []
    for (const t of words(s)) {
        const prev = seg[seg.length - 1]
        if (prev !== undefined && /[「『（(\[“]$/.test(prev)) seg[seg.length - 1] = prev + t
        else seg.push(t)
    }
    while (seg.length > 1 && Array.from(seg[seg.length - 1].replace(/[、。・）」』！？.,!?]/g, "")).length <= 2) {
        const last = seg.pop()!
        seg[seg.length - 1] += last
    }
    return seg.map((t, i) => (
        <span key={i} style={{ display: "inline-block" }}>{t}</span>
    ))
}

let pfDefaults: Record<string, V> | null = null
function defaultsOf(slug: string): V {
    if (!pfDefaults) {
        pfDefaults = {}
        for (const t of PF_DEFAULTS.split(" ")) {
            const i = t.indexOf(":")
            if (i < 0) continue
            const v: V = {}
            for (const kv of t.slice(i + 1).split(",")) {
                const [k, x] = kv.split("=")
                if (k && x !== undefined) v[k] = parseFloat(x)
            }
            pfDefaults[t.slice(0, i)] = v
        }
    }
    return pfDefaults[slug] || {}
}
let lqipMap: Record<string, string> | null = null
function lqipOf(slug: string): string {
    if (!lqipMap) {
        lqipMap = {}
        for (const t of PF_LQIP.split(" ")) {
            const i = t.indexOf(":")
            if (i > 0) lqipMap[t.slice(0, i)] = t.slice(i + 1)
        }
    }
    const b = lqipMap[slug]
    return b ? `url(data:image/webp;base64,${b})` : ""
}
let dimMap: Record<string, number> | null = null
function dimOf(slug: string): number {
    if (!dimMap) {
        dimMap = {}
        for (const t of PF_DIM.split(" ")) {
            const [k, x] = t.split(":")
            if (k) dimMap[k] = parseFloat(x)
        }
    }
    return dimMap[slug] || 0
}

interface PfColors { ink: string; paper: string; muted: string; accent: string }
interface PfOpts { slug: string; cat: string; en: string; cap: number; hold: boolean; card: boolean; colors: PfColors; onEnd?: () => void }
interface PfHandle { root: HTMLElement; card: boolean; held: boolean; stop: () => void; release: () => void }

const PF_LIVE: PfHandle[] = []
// 遷移の間は演技を始めない（pfFreeze）
let pfHoldUntil = 0
function pfFreeze(ms: number) {
    if (typeof window === "undefined") return
    pfHoldUntil = performance.now() + ms
    for (const h of PF_LIVE.slice()) h.stop()
    PF_QUEUE.length = 0
}
// 同時に演じるカードの名前は3枚まで（5周目：PC でも画面に入ったら演じるようにしたので、2→3。多いと目が散る）
const PF_MAX = 3

function pfReduced() {
    return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/** root（.mdx-pf）の名前を、slug の動きで1回演じる。終わると素の名前に戻る */
function pfPlay(root: HTMLElement, o: PfOpts): PfHandle | null {
    if (typeof window === "undefined" || typeof root.animate !== "function" || pfReduced()) return null
    if (performance.now() < pfHoldUntil) return null
    const txt = root.querySelector(".mdt-t") as HTMLElement | null
    if (!txt || root.clientWidth < 2) return null
    // 同じ名前で演技中なら、それを戻してから
    for (const h of PF_LIVE.slice()) if (h.root === root) h.stop()
    if (o.card) {
        const cards = PF_LIVE.filter((h) => h.card)
        while (cards.length >= PF_MAX) cards.shift()!.stop()
    }

    const spec: Spec = SPEC[o.slug] || ["C", o.cat in CH ? o.cat : "text"]
    const chap = spec[0] === "C" ? CH[spec[1] as string] || CH.text : null
    const { ink, paper, muted, accent } = o.colors

    let anims: Animation[] = []
    let fxs: HTMLElement[] = []
    let timers: number[] = []
    let rafs: number[] = []
    const texts = new Map<HTMLElement, string>()
    let k = 1 // 時間の縮め率（1 = 既定値どおり）
    let pending: [() => void, number][] | null = [] // 演技の組み立て中に予約された c.later（倍率が決まってから流す）
    let dead = false
    let follow: Follow | null = null
    let scroller: Scroll | null = null
    let held = false

    const h: PfHandle = {
        root,
        card: o.card,
        held: false,
        stop: () => {
            if (dead) return
            dead = true
            anims.forEach((a) => { try { a.cancel() } catch {} })
            anims = []
            fxs.forEach((f) => f.remove())
            fxs = []
            timers.forEach((t) => clearTimeout(t))
            timers = []
            rafs.forEach((r) => cancelAnimationFrame(r))
            rafs = []
            texts.forEach((s, el) => (el.textContent = s))
            txt.removeAttribute("style")
            root.removeAttribute("style")
            clipHosts.forEach(([el, v]) => (el.style.overflowX = v))
            const i = PF_LIVE.indexOf(h)
            if (i >= 0) PF_LIVE.splice(i, 1)
            o.onEnd?.()
            pfPump()
        },
        release: () => {
            if (dead) return
            const live = anims.filter((a) => a.playState !== "idle")
            if (!live.length) { h.stop(); return }
            let left = live.length
            live.forEach((a) => {
                try {
                    a.onfinish = () => { if (--left === 0) h.stop() }
                    a.reverse()
                } catch { left-- }
            })
            timers.push(window.setTimeout(() => h.stop(), 2000))
        },
    }

    // ── 舞台を組む（EntryTitle.tsx の build と同じ。素の名前を実測し、同じ位置に1文字ずつ絶対配置した複製を重ねる）
    const bx = new Map<HTMLElement, Box>()
    const rr = root.getBoundingClientRect()
    // 祖先に拡大がかかっていても（索引の行のホバーで名前を大きくする＝8周目 A2）、舞台は名前の箱の中の座標で組む
    const sc = root.offsetWidth > 0 ? rr.width / root.offsetWidth || 1 : 1
    const LH = parseFloat(getComputedStyle(root).lineHeight) || parseFloat(getComputedStyle(root).fontSize) * 1.3
    const stage = document.createElement("span")
    stage.className = "mdt-t mdt-fx mdt-stage"
    stage.setAttribute("aria-hidden", "true")
    stage.style.cssText = `left:0;top:0;width:${root.clientWidth}px;height:${root.clientHeight}px;`
    const chars: HTMLElement[] = []
    const wordsEl: HTMLElement[] = []
    txt.querySelectorAll<HTMLElement>(".mdt-p").forEach((rp) => {
        const cs = Array.from(rp.querySelectorAll<HTMLElement>(".mdt-c")).map((rc) => {
            const r = rc.getBoundingClientRect()
            const rw = r.width / sc, rh = r.height / sc, rx = (r.left - rr.left) / sc, ry = (r.top - rr.top) / sc
            return { t: rc.textContent || "", x: rx, y: ry - (LH - rh) / 2, w: rw, h: LH, cy: ry, ch: rh }
        })
        if (!cs.length) return
        const wx = Math.min(...cs.map((q) => q.x)), wy = Math.min(...cs.map((q) => q.y))
        const wr = Math.max(...cs.map((q) => q.x + q.w)), wb = Math.max(...cs.map((q) => q.y + q.h))
        const wp = document.createElement("span")
        wp.className = "mdt-p"
        wp.style.cssText = `left:${wx}px;top:${wy}px;width:${wr - wx}px;height:${wb - wy}px;`
        bx.set(wp, { x: wx, y: wy, w: wr - wx, h: wb - wy })
        cs.forEach((q) => {
            const sp = document.createElement("span")
            sp.className = "mdt-c"
            sp.textContent = q.t
            sp.style.cssText = `left:${q.x - wx}px;top:${q.cy - wy}px;width:${q.w}px;height:${q.ch}px;line-height:${q.ch}px;`
            bx.set(sp, { x: q.x, y: q.y, w: q.w, h: q.h })
            wp.appendChild(sp)
            chars.push(sp)
        })
        stage.appendChild(wp)
        wordsEl.push(wp)
    })
    root.appendChild(stage)
    fxs.push(stage)
    // 名前が箱に収まっている（省略記号の出番がない）ときだけ、演技の間は横の切り抜きを外す。
    // 1.04 の拡大や揺れでも字の端が切れない余白を持たせる（3周目：ken-burns で頭の「ケ」が切れた）。止めるときに元へ戻す
    const clipHosts: [HTMLElement, string][] = []
    if (txt.scrollWidth <= root.clientWidth + 1) {
        for (let el: HTMLElement | null = root, k = 0; el && k < 2; el = el.parentElement, k++) {
            // 外す箱そのものに収まっていない中身（言い換えの括弧など）があるときは外さない。
            // 5周目：見出し語は収まっていても「（入力中→吹き出し）」が隣のカードの名前に重なっていた（独立レビュー B・SP）
            if (el.scrollWidth > el.clientWidth + 1) break
            if (getComputedStyle(el).overflowX === "clip" || getComputedStyle(el).overflowX === "hidden") {
                clipHosts.push([el, el.style.overflowX])
                el.style.overflowX = "visible"
            }
        }
    }
    bx.set(stage, { x: 0, y: 0, w: root.clientWidth, h: root.clientHeight })
    txt.style.visibility = "hidden"
    // 8周目（指摘1・2・5）：演技の間も、字と飾りは名前の箱の外へ出さない。
    // 上だけ 0.45em の逃げ（跳ねる・浮く）を残し、横と下は箱で切る＝英名・隣のカード・版面の端に重ならない。
    // 演技の側が自分で切り抜き（rootStyle の clipPath）を持つときはそちらが勝つ（どれも箱の内側を切る）
    root.style.clipPath = "inset(-0.45em 0px 0px 0px)"
    const box = (el: HTMLElement): Box => {
        let b = bx.get(el)
        if (!b) {
            b = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }
            bx.set(el, b)
        }
        return b
    }
    const tops: number[] = []
    const lineOf = new Map<HTMLElement, number>()
    chars.forEach((ch) => {
        const y = box(ch).y
        let i = tops.findIndex((t) => Math.abs(t - y) < 4)
        if (i < 0) { tops.push(y); i = tops.length - 1 }
        lineOf.set(ch, i)
    })
    wordsEl.forEach((w) => lineOf.set(w, Math.max(0, tops.findIndex((t) => Math.abs(t - box(w).y) < 4))))
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9
    chars.forEach((ch) => { const b = box(ch); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h) })
    if (!chars.length) { x0 = 0; y0 = 0; x1 = root.clientWidth; y1 = root.clientHeight }
    const sched = (fn: () => void, ms: number) => timers.push(window.setTimeout(() => { if (!dead) fn() }, ms / k))
    const c: Ctx = {
        root, txt: stage, chars, words: wordsEl.length >= 3 ? wordsEl : chars, lineOf, nLines: Math.max(1, tops.length),
        // 振れ幅の基準。演技の値は見出し（30〜72px）向けで、カードの名前（13〜24px）では揺れ・跳ねが2〜3pxになり見えなかった。28px を下限にする
        fs: Math.max(28, parseFloat(getComputedStyle(root).fontSize) || 16),
        em: parseFloat(getComputedStyle(root).fontSize) || 16,
        W: root.clientWidth, H: root.clientHeight,
        tb: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 },
        ink, paper, muted, accent, en: o.en,
        box,
        a: (el, kf, op) => {
            if (isText(el)) kf = kf.map(capScale)
            else if (isPlate(el) && kf.some((q) => q.opacity !== undefined) && kf.some((q) => q.transform !== undefined || q.clipPath !== undefined)) {
                // 形も動く塗り（下から昇る面など）は、溶かさずに出したまま動かす（名前の箱で切れるので、入り・出は形の動きで見える）
                kf = kf.map((q) => (q.opacity !== undefined ? { ...q, opacity: 1 } : q))
            } else if (isPlate(el) && kf.some((q) => q.opacity !== undefined)) {
                // 8周目（指摘6）：塗りのある飾り（押した札・面・幕）を opacity で溶かすと、途中が「灰色の板」に写る。
                // 塗りの出入りは段で切り替える（形の動きは補間のまま）。章扉の press と同じ考え方
                // 半透明の塗り（影・暗幕の 0.4 など）も灰色の板に写るので、塗りは「全部見える／見えない」の2値にする
                kf = kf.map((q) => (q.opacity !== undefined ? { ...q, opacity: Number(q.opacity) >= 0.999 ? 1 : 0, easing: "steps(1, jump-end)" } : q))
            }
            const an = el.animate(kf, { fill: "backwards", ...op })
            if (k !== 1) an.playbackRate = k
            anims.push(an)
            return an
        },
        fx: (css, tag = "div") => {
            const el = document.createElement(tag)
            el.className = "mdt-fx"
            el.setAttribute("aria-hidden", "true")
            el.style.cssText += css
            root.appendChild(el)
            fxs.push(el)
            return el
        },
        ghost: (color) => {
            const g = stage.cloneNode(true) as HTMLElement
            g.querySelectorAll<HTMLElement>(".mdt-c, .mdt-p").forEach((e) => { e.style.removeProperty("transform"); e.style.removeProperty("opacity"); e.style.removeProperty("transform-origin") })
            g.className = "mdt-t mdt-fx mdt-stage"
            g.setAttribute("aria-hidden", "true")
            g.style.cssText = `left:0;top:0;width:${root.clientWidth}px;height:${root.clientHeight}px;${color ? "color:" + color + ";" : ""}`
            root.appendChild(g)
            fxs.push(g)
            return g
        },
        textGhost: (s, css = "") => {
            const g = document.createElement("span")
            g.className = "mdt-fx mdt-ghost"
            g.setAttribute("aria-hidden", "true")
            g.textContent = s
            g.style.cssText = `left:${x0}px;top:${y0}px;white-space:nowrap;${css}`
            root.appendChild(g)
            fxs.push(g)
            const maxW = Math.max(x1 - x0, root.clientWidth - x0)
            if (g.offsetWidth > maxW) g.style.fontSize = `${(parseFloat(getComputedStyle(root).fontSize) * maxW) / g.offsetWidth}px`
            return g
        },
        later: (fn, ms) => { if (pending) pending.push([fn, ms]); else sched(fn, ms) },
        loop: (fn) => {
            let t0 = -1
            const step = (now: number) => {
                if (dead) return
                if (t0 < 0) t0 = now
                if (fn((now - t0) * k)) rafs.push(requestAnimationFrame(step))
            }
            rafs.push(requestAnimationFrame(step))
        },
        setText: (el, s) => {
            if (!texts.has(el)) texts.set(el, el.textContent || "")
            el.textContent = s
        },
        lock: (els) => {
            els.forEach((el) => {
                el.style.width = el.offsetWidth + "px"
                el.style.textAlign = "center"
                el.style.overflow = "visible"
            })
        },
        rootStyle: (css) => {
            for (const key in css) (root.style as any)[key] = css[key]
        },
    }

    let res: R
    try {
        if (chap) res = chap.fn(c)
        else if (typeof spec[1] === "function") res = (spec[1] as (c: Ctx, v: V) => R)(c, defaultsOf(o.slug))
        else res = CH.text.fn(c)
    } catch {
        res = undefined
    }
    if (!res) { pending = null; h.stop(); return null }
    PF_LIVE.push(h)

    const flush = () => {
        anims.forEach((a) => { a.playbackRate = k })
        const p = pending || []
        pending = null
        p.forEach(([fn, ms]) => sched(fn, ms))
    }
    // 追う系／スクロール系の tick を回す
    let ticking = false
    const tickLoop = () => {
        if (ticking || dead) return
        ticking = true
        const step = () => {
            if (dead) { ticking = false; return }
            const ob = follow || scroller
            if (!ob) { ticking = false; return }
            const more = ob.tick()
            if (more || held) rafs.push(requestAnimationFrame(step))
            else { ticking = false; h.stop() }
        }
        rafs.push(requestAnimationFrame(step))
    }

    // 読める規則：隠れた状態から始まる演技は、読める状態に着くまでを 0.64 秒以内に縮める（0.8 秒に余裕を持たせる。PF_READ＝既定の速さで初めて読めるまでの ms・実測）
    const readK = (PF_READ[o.slug] || 0) / 640
    if (typeof res === "number") {
        k = Math.max(1, res / o.cap, readK)
        flush()
        timers.push(window.setTimeout(() => h.stop(), res / k + 80))
    } else if ((res as Hold).hold) {
        const ms = (res as Hold).ms
        // ホバー中は保つ（離れたら release）。
        // 8周目：画面に入ったときの1回は「出て・戻る」までを cap（0.6秒）に収める（旧：保って 450ms 待ってから戻す＝撮ると途中の姿が写った）
        k = o.hold ? Math.max(1, ms / o.cap, readK) : Math.max(1, (ms * 2) / o.cap, readK)
        flush()
        h.held = true
        if (!o.hold) timers.push(window.setTimeout(() => h.release(), ms / k))
    } else if ((res as Follow).kind === "f") {
        // ポインタの代わりに、名前の上を左から右へ cap の時間で横切る
        k = 1
        flush()
        follow = res as Follow
        const f = follow
        const t0 = performance.now()
        held = true
        // 8周目：横切りは cap の 0.7、離れてからの戻りを含めて cap で止める（旧：最大 1.4s ＋ 1.6s 残った＝レンズが名前の上に残って写った）
        const D = Math.min(o.cap, 1400) * 0.7
        const step = (now: number) => {
            if (dead) return
            const q = Math.min(1, (now - t0) / D)
            const e = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2
            f.move(c.tb.x - c.fs * 0.4 + (c.tb.w + c.fs * 0.8) * e, c.tb.y + c.tb.h * (0.5 + 0.18 * Math.sin(q * Math.PI * 2)))
            if (q < 1) rafs.push(requestAnimationFrame(step))
            else { f.leave(); held = false }
        }
        rafs.push(requestAnimationFrame(step))
        tickLoop()
        timers.push(window.setTimeout(() => h.stop(), Math.min(o.cap, 1400)))
    } else if ((res as Scroll).kind === "s") {
        k = 1
        flush()
        scroller = res as Scroll
        const s = scroller
        const t0 = performance.now()
        held = true
        const D = Math.min(o.cap, 1400) * 0.7
        let last = 0
        const step = (now: number) => {
            if (dead) return
            const q = Math.min(1, (now - t0) / D)
            const off = Math.sin(Math.PI * q) * 600
            s.push((off - last) * 0.9 * (1400 / D), off)
            last = off
            if (q < 1) rafs.push(requestAnimationFrame(step))
            else { s.push(0, 0); held = false }
        }
        rafs.push(requestAnimationFrame(step))
        tickLoop()
        timers.push(window.setTimeout(() => h.stop(), Math.min(o.cap, 1400)))
    } else {
        pending = null
        h.stop()
        return null
    }
    return h
}

// 既定の速さで「初めて読める」までの時間（ms）。実演面の大きさで項目ごとに撮り、素の名前との輪郭の再現率 0.8 以上を「読める」として測った
// （/motion-dict-v2-blind/aww/r4/home/pf/ の shoot.cjs → score.py）。ここに載っている項目だけ、その時間が 0.64 秒に収まるよう速める
const PF_READ: Record<string, number> = {
    "block-reveal": 803, "counter": 1000, "sprite-sheet": 1004, "mosaic-reveal": 1005, "stepper": 1238, "bounce-in": 1300,
    "stamp-in": 1102, "scroll-fade-in": 1105, "ascii-effect": 1200, "quadtree-reveal": 1321, "chat-sequence": 1252,
    "spiral-reveal": 1300, "gradient-morph": 1304, "motion-path": 1308, "curtain-wipe": 1400, "skeleton-shimmer": 1900,
}

// 「画面に入ったら1回」の順番待ち（5周目：SP だけ → PC も）。画面に入った順に、前の1枚から 180ms 空けて1枚ずつ出す＝時間差。
// 同時は PF_MAX（3）まで。空きが出たら（演技が終わったら pfPlay の stop が pfPump を呼ぶ）次へ
const PF_QUEUE: { el: HTMLElement; go: () => void }[] = []
const PF_GAP = 180
let pfLast = 0
let pfT = 0
function pfPump() {
    if (typeof window === "undefined") return
    window.clearTimeout(pfT)
    while (PF_QUEUE.length && PF_LIVE.filter((h) => h.card).length < PF_MAX) {
        const wait = pfLast + PF_GAP - performance.now()
        if (wait > 0) { pfT = window.setTimeout(pfPump, wait); return }
        const it = PF_QUEUE.shift()!
        const r = it.el.getBoundingClientRect()
        // まだ画面の中にあるものだけ（流し読みで通り過ぎたものは演じない）
        if (r.bottom > 0 && r.top < window.innerHeight && r.height > 0) { pfLast = performance.now(); it.go() }
    }
}

/** カードの名前の演技。名前が画面に入ったら1回（PC・SP とも。5周目に PC も）＋ PC はホバーでも（enter/leave をカードに付ける） */
function useCardPerform(ref: { current: HTMLElement | null }, e: Entry, o: { hoverable: boolean; reduced: boolean; isStatic: boolean; colors: PfColors; cap: number }, ext?: { current: (() => void) | null }) {
    const live = useRef<PfHandle | null>(null)
    const flags = (SPEC[e.slug] ? (SPEC[e.slug][2] as string) : "") || ""
    const isH = flags.includes("h")
    const opts = (hold: boolean): PfOpts => ({
        slug: e.slug, cat: e.category, en: sentence(e.nameEn).split(" / ")[0] || e.nameEn, cap: o.cap, hold, card: true, colors: o.colors,
        onEnd: () => { live.current = null },
    })

    useEffect(() => {
        if (o.isStatic || o.reduced || typeof window === "undefined" || !("IntersectionObserver" in window)) return
        const el = ref.current
        if (!el) return
        let done = false
        const io = new IntersectionObserver(
            (es) => {
                for (const en of es) {
                    if (!en.isIntersecting || done) continue
                    done = true
                    io.disconnect()
                    // ホバーで既に演じていれば、重ねて撃たない
                    PF_QUEUE.push({ el, go: () => { if (!live.current) live.current = pfPlay(el, opts(false)) } })
                    pfPump()
                }
            },
            // 画面の下20%を除いた帯に入ったら（入り際の端では見えない）
            { threshold: 1, rootMargin: "0px 0px -20% 0px" }
        )
        io.observe(el)
        return () => {
            io.disconnect()
            const i = PF_QUEUE.findIndex((q) => q.el === el)
            if (i >= 0) PF_QUEUE.splice(i, 1)
            live.current?.stop()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [e.slug, o.isStatic, o.reduced, o.hoverable])

    useEffect(() => () => live.current?.stop(), [])
    // 外から1回演じさせる口（SP の索引：画面の中央に来た行＝8周目 A2）
    if (ext) ext.current = o.isStatic || o.reduced ? null : () => { if (ref.current && !live.current) live.current = pfPlay(ref.current, opts(false)) }

    if (o.isStatic || o.reduced || !o.hoverable) return {}
    return {
        onPointerEnter: (ev: { pointerType: string }) => {
            if (ev.pointerType !== "mouse" || !ref.current) return
            // 演技中に入り直しても頭から撃ち直さない（ホバーの出入りで連打になる）
            if (live.current) return
            live.current = pfPlay(ref.current, opts(isH))
        },
        onPointerLeave: (ev: { pointerType: string }) => {
            if (ev.pointerType !== "mouse") return
            const hd = live.current
            if (hd && isH && hd.held) hd.release()
        },
    }
}

/* ================================================================== */
/* 検索：擬音・俗な言い方の別名（2026-10-25 Awwwards 3周目）            */
/* ================================================================== */
// FVの擬音8語のうち6語と「グニャ」が0件だった（独立レビュー）。FV と同じ語は FV と同じ項目を先頭に返し、
// 各項目に擬音・俗な言い方を3〜5語持たせる。語は content/*.ts の ngExample（「グニャってなるやつ」等）と vocab から拾った。
// 照合はひらがな／カタカナ・小書き・長音・促音のゆれを畳んでから（シュッ＝しゅっ＝シュー → しゆ）。
// 別名は「別名が検索語を含む」に加えて「検索語が別名を含む」でも当てる＝「ホバーすると浮く」「グニャってなるやつ」でも出る。

// FV（HeroLive）の擬音 → その語が演じる項目。検索でも必ず先頭に出す
const PIN_RAW: [string, string][] = [
    ["ふわっと", "blur-reveal"], ["パタン", "text-flip"], ["ぷるん", "squash-stretch"], ["シュッ", "tracking-in"],
    ["ガタガタ", "error-shake"], ["じわっと", "outline-fill"], ["ポンッ", "bounce-in"], ["カタカタ", "typewriter"],
]
const SMALL: Record<string, string> = { ぁ: "あ", ぃ: "い", ぅ: "う", ぇ: "え", ぉ: "お", ゃ: "や", ゅ: "ゆ", ょ: "よ", ゎ: "わ", ゕ: "か", ゖ: "け" }
function normalize(s: string): string {
    return (s || "")
        .normalize("NFKC")
        .toLowerCase()
        .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
        .replace(/[ぁぃぅぇぉゃゅょゎゕゖ]/g, (c) => SMALL[c] || c)
        .replace(/[\sっー〜~・\-_/!！?？。、,.「」『』…]/g, "")
}
const ALIAS_RAW =
    "arrow-slide-through:矢印,シュッ,抜ける,スッと抜ける|border-draw:枠線,枠が描かれる,なぞる,スーッと線|cube-roll:クルッ,くるっと回る,3D回転,サイコロ|" +
    "custom-cursor:丸がついてくる,マウスストーカー,カーソル追従,ついてくる|directional-hover:スッと,入ってきた方向,色が入る,方向|dock-magnify:Dock,にゅっと大きく,大きくなる,ぷくっ|" +
    "fill-hover:塗り,色が変わる,じわっと,ボタンの色|flame-flicker:メラメラ,ゆらゆら,炎,燃える|focus-dim:他を薄く,暗くする,ぼかす,注目|" +
    "glitch-hover:グリッチ,バグ,ガガッ,ノイズ,サイバー|holo-sheen:キラキラ,ホロ,虹色,ギラッ|hover-preview:画像がついてくる,プレビュー,チラ見せ|" +
    "hover-wave:波打つ,ウェーブ,ぴょこぴょこ,うねうね|image-swap-hover:画像が変わる,切り替え,パッと|image-trail:画像がついてくる,軌跡,ぞろぞろ,残像|" +
    "letter-spacing-hover:字間,広がる,ふわっと開く,間隔|lift-hover:浮く,ふわっと浮く,持ち上がる,ひょいっ|line-boil:ぷるぷる,手描き,ぶるぶる,震え,ガタガタ|" +
    "magnetic-hover:ぬるっと,磁石,吸い付く,吸い寄せ,マグネット|mouse-parallax:奥行き,マウスで動く,ぐりぐり,視差|row-expand:行が広がる,ぐいっ,大きくなる,一覧|" +
    "shadow-pop:影,ポコッ,飛び出す,立体|spotlight-hover:光る,懐中電灯,照らす,ピカッ|text-scramble:バラバラ,ガチャガチャ,ランダム,暗号,ハッカー|" +
    "text-slide-swap:入れ替わる,スルッ,文字が抜ける,スライド|tilt:ぐりぐり,傾く,3D,ゆらっ|underline-reveal:下線,アンダーライン,スーッと線,シュッ|" +
    "xray-lens:透ける,覗く,レンズ,スケスケ|footer-reveal:めくれる,下から出てくる,ぬっ,フッター|header-hide-on-scroll:隠れる,ヘッダーが消える,ひょこっ,引っ込む|" +
    "header-invert:色反転,白黒,パッと変わる,ヘッダーの色|header-shrink:縮む,小さくなる,キュッ,ヘッダー|horizontal-scroll:横スクロール,横に流れる,ヨコ移動,スライド|" +
    "parallax:奥行き,視差,ズレ,パララ|perspective-reveal:パタッ,起き上がる,パタン,立ち上がる,3D|progressive-blur:ぼかし,フェードアウト,だんだんぼける,端|" +
    "rubber-band:びよーん,ゴム,バウンド,引っぱる,ぐにっ|scroll-fade-in:ふわっと,フェードイン,じわっと出る,スーッ|scroll-marquee:流れる,テロップ,加速,ぐいぐい|" +
    "scroll-progress:読了,進捗,バー,今どこ|scroll-scrub:動画,コマ送り,ぐりぐり,連動|scroll-snap:ピタッ,止まる,カチッ,1画面ずつ|" +
    "scroll-spy:現在地,目次,光る,追従|scroll-zoom:ズーム,グーッと,拡大,寄る|section-color-swap:色が変わる,背景色,じわっと変わる,切り替わる|" +
    "smooth-scroll:ぬるぬる,ヌルヌル,なめらか,慣性,ぬるっと|stacking-cards:重なる,積み重ね,どんどん,カード|sticky-pin:固定,ピタッ,張り付く,止まる|" +
    "text-highlight:だんだん読める,浮かび上がる,じわじわ,色がつく|text-on-path:カーブ,曲がる,うねる,円に沿う|velocity-skew:グニャ,ぐにゃっ,歪む,ゆがむ,傾く|" +
    "block-reveal:帯,ジャッ,ブロック,シュッ,かっこよく出す|blur-reveal:ふわっと,ぼかし,ピント,ぼわっ,じんわり|color-wave:光る,1文字ずつ,キラキラ,色が流れる|" +
    "counter:グワーッと,カウントアップ,数字が増える,ぐんぐん|gradient-shine:キラッ,ピカッ,光沢,シャイン|marker-line:マーカー,蛍光ペン,線を引く,シャッ|" +
    "marquee:流れる,テロップ,電光掲示板,ずっと流れる|number-roll:カラカラ,スロット,数字が回る,クルクル|opening-crawl:スターウォーズ,奥へ流れる,エンドロール,宇宙|" +
    "outline-fill:じわっと,縁取り,塗りつぶす,満ちる|rotating-badge:ぐるぐる,回る,バッジ,くるくる|sliced-text:スライス,斜め,切れる,ズバッ|" +
    "split-flap:パタパタ,パタン,空港,掲示板,めくれる|split-text-reveal:パラパラ,1文字ずつ,下から,ぬっ|text-flip:パタン,くるっと,めくれる,回転|" +
    "tracking-in:シュッ,集まる,キュッ,字間|typewriter:カタカタ,打たれる,タイプ,カチャカチャ|wave-text:波,ゆらゆら,うねうね,ウェーブ|" +
    "weight-morph:太くなる,太さ,むくっ,ぐぐっ|word-rotate:単語が変わる,パラパラ,入れ替わる,クルッ|circle-reveal:丸く広がる,ぱあっ,円,じわーっ|" +
    "cover-transition:下から出てくる,覆う,ぬっ,ガバッ|crossfade:ふわっと切り替え,フェード,じわっと,溶ける|crt-power-off:テレビ,プツン,ブツッ,線になって消える|" +
    "curtain-wipe:幕,カーテン,シャーッ,ワイプ|gradient-morph:グラデ,ふわっと変わる,色が溶ける,ぼやーっ|gradient-wipe:ワイプ,スーッと,拭う,じわっと切り替え|" +
    "menu-reveal:メニュー,ハンバーガー,パラパラ,開く|shared-element:つながる,繋がる,画像が伸びる,ぬるっと|shutter-transition:ブラインド,シャッター,パタパタ,ザザッ|" +
    "split-screen:真っ二つ,割れる,パカッ,左右に|zoom-through:吸い込まれる,ズーム,グワッ,突き抜ける|animated-beam:光が流れる,ビーム,ピュー,線|" +
    "ascii-effect:アスキー,文字で描く,コード,テキストアート|barber-pole:斜めストライプ,工事,床屋,流れる縞|before-after:比較,ビフォーアフター,ずらす,見比べ|" +
    "blob-morph:うにょうにょ,ぐにゃぐにゃ,ぷにぷに,液体|blur-load:ぼかし,じわっと,ピントが合う,ぼんやり|card-shuffle:シャッフル,トランプ,バサッ,混ぜる|" +
    "carousel:スライダー,スライド,横に送る,くるくる|clip-reveal:シュッ,切り抜き,スッと出る,マスク|corner-brackets:四隅,枠,カギ括弧,スコープ|" +
    "counter-scale:ポン,ポンッ,ぎゅっ,逆スケール|cover-flow:3D,カルーセル,ぐるっと,真ん中|dither-dissolve:ドット絵,ザラザラ,溶ける,レトロ,粒|" +
    "drag-scroll:ドラッグ,ぐいっ,慣性,ひっぱる|duotone-hover:白黒,モノクロ,色がつく,カラーになる|fog-drift:霧,もやもや,もや,ふわふわ|" +
    "frosted-glass:すりガラス,ガラス,半透明,ぼかし|god-rays:光が差す,後光,キラーン,木漏れ日|gradient-border:キラキラ,枠が光る,回る枠,グラデ|" +
    "grain-overlay:ノイズ,ザラザラ,フィルム,粒子|halftone:網点,印刷,ドット,ポチポチ|image-parallax-hover:奥行き,視差,ぐりぐり,ゆらっ|" +
    "image-zoom-hover:ズーム,拡大,グーッ,寄る|ken-burns:ゆっくり,じわじわ,映画,ズーム,ドキュメンタリー|lightbox:拡大表示,ポップアップ,パッと,クリックで大きく|" +
    "line-draw:線を描く,スーッ,手書き,なぞる|liquid-distortion:ゆらゆら,水,ゆがむ,ぐにゃ,もやもや|logo-marquee:ロゴが流れる,横に流れる,スルスル,無限|" +
    "marching-ants:破線,流れる線,チカチカ,点線|moire-drift:モアレ,しましま,チラチラ,干渉|mosaic-reveal:モザイク,パラパラ,タイル,ブロック|" +
    "quadtree-reveal:パッと,モザイク,解像度,ドット|rack-focus:ピント,ぼけ,ふわっ,ピンボケ|scanlines:ブラウン管,走査線,レトロ,ザザッ|" +
    "snowfall:雪,しんしん,ちらちら,降る|sprite-sheet:パラパラ漫画,コマ送り,カクカク,アニメ|twinkle:キラキラ,星,ピカピカ,またたく|" +
    "accordion:開閉,パカッ,にゅっと開く,FAQ|ai-orb:AI,もやもや,脈打つ,考え中|ambient-float:ふわふわ,浮遊,ぷかぷか,ゆらゆら|" +
    "bar-chart-grow:グラフ,にょきにょき,伸びる,グーン|bounce-in:ポンッ,ぽよん,バウンド,ぴょん,跳ねる|breathing-glow:ふわっと光る,呼吸,じわーっ,ぼんやり光る|" +
    "chat-sequence:チャット,吹き出し,ポコポコ,入力中|checkbox-check:チェック,シュッ,レ点,カチッ|confetti-burst:紙吹雪,パーン,パッ,クラッカー,お祝い|" +
    "conic-sweep:くるくる,ぐるっと,円弧,回る|copy-to-clipboard:コピー,コピーしました,ポン,完了|dot-pagination:ドット,インスタ,点々,ページ送り|" +
    "drawer-slide:スライド,横から出る,シュッ,引き出し|drop-zone:ドラッグ＆ドロップ,ポイッ,落とす,アップロード|dropdown-reveal:ドロップダウン,ストン,にゅっ,プルダウン|" +
    "dvd-bounce:DVD,跳ね返る,カクッ,スクリーンセーバー|equalizer-bars:音楽,ズンズン,ピコピコ,イコライザー|error-shake:ガタガタ,プルプル,ぶるぶる,ブルッ,首を振る|" +
    "expanding-search:にゅっ,検索,伸びる,ビヨーン|eye-blink:まばたき,パチッ,パチパチ,目|flicker-on:チカチカ,ネオン,パチパチ,点灯|" +
    "flip-card:ひっくり返す,くるっ,裏返し,パタン|floating-label:ラベル,スッと上がる,ふわっ,入力欄|floating-reactions:ふわふわ,ハート,湧き上がる,ポコポコ|" +
    "fly-to-cart:ピューッ,飛んでいく,カート,ひゅっ|gauge-meter:針,メーター,グイッ,ぶるん|gesture-hint:手,指,スワイプして,ここ触って|" +
    "gift-box-reveal:プレゼント,ワクワク,ぴょこぴょこ,カタカタ|gooey-effect:くっつく,ぬちょっ,ぷにゅ,液体,とろっ|hint-nudge:ちょいちょい,チラッ,ぴくっ,つつく|" +
    "like-burst:ポンッ,パッ,ハート,弾ける,いいね|list-add-remove:削除,すっと消える,詰まる,シュッ|menu-toggle:ハンバーガー,×になる,くるっ,三本線|" +
    "modal-pop:ふわっと,ポップ,ぽわん,ポンッ|morphing-dropdown:ぬるっと,にゅるん,伸び縮み,追従|motion-path:ひゅーん,飛ぶ,曲線,弧を描く|" +
    "notched-corner:角欠け,カット,カクッ,サイバー|notification-badge:赤い点,未読,ポンッ,ぷくっ|orbit:くるくる,周回,ぐるぐる,衛星|" +
    "page-turn:めくる,ペラッ,パラッ,本|paper-crumple:クシャッ,くしゃくしゃ,ポイッ,丸める|password-strength:パスワード,強度,にょきっ,メーター|" +
    "pendulum-swing:ゆらゆら,ぶらぶら,ぶらーん,振り子|pill-expand:にゅっ,伸びる,ぐいーん,ピル|press-feedback:ポチッ,カチッ,ぎゅっ,押した感,クリック感|" +
    "prize-wheel:ルーレット,ぐるぐる,ガラガラ,抽選|pulse-ring:波紋,ドクドク,ピコン,LIVE|radial-carousel:くるくる,円形,ぐるっと,回転|" +
    "ripple-tap:波紋,ぽわん,じわっと広がる,タップ|ruler-scrubber:目盛り,定規,カリカリ,スクラブ|scratch-card:こする,削る,ゴシゴシ,ガリガリ,スクラッチ|" +
    "scroll-cue:スクロールしてね,マウス,ぴょこぴょこ,下へ|spring-easing:ぽよん,ばね,びよん,ぷるん|squash-stretch:ぷるん,ぷにっ,ぷにぷに,むにっ,ぽよん|" +
    "stamp-in:ドンッ,バン,ハンコ,ポン|star-rating:星,キラッ,評価,ピカッ|stateful-button:送信,ぐるぐる,完了,チェックマーク|" +
    "stepper:ステップ,進捗,ポチポチ,段階|sticker-peel:ペロッ,ぺりっ,はがれる,シール|story-progress:インスタ,ストーリー,バーが伸びる,ジワジワ|" +
    "swipe-dismiss:シュッ,払う,スワイプ,ポイッ|tab-indicator:下線が動く,スッ,ぬるっと,タブ|theme-toggle-transition:ダークモード,パッと,じわっと,切り替え|" +
    "toast-slide:通知,ピョコッ,スッと出る,トースト|toggle-switch:カチッ,スイッチ,パチッ,オンオフ|tooltip-pop:ポップ,ぴょこっ,吹き出し,ヒント|" +
    "boot-sequence:ターミナル,カタカタ,ピピピ,起動|circular-progress:丸いゲージ,ぐるっと,円,じわじわ|dots-pulse:点々,ポコポコ,ぴょこぴょこ,ローディングの点|" +
    "liquid-fill:水が溜まる,ちゃぷちゃぷ,満ちる,たぷたぷ|loading-bar:バー,シューッ,YouTube,ジワジワ|preloader-counter:カウント,数字,ぐんぐん,ローディング画面|" +
    "skeleton-shimmer:スケルトン,キラッ,ぴかー,灰色|spinner-ring:くるくる,ぐるぐる,ローディング,回る|spiral-reveal:ぐるっと,渦,うずまき,くるくる|" +
    "stagger-grid:パラパラ,順番に,ぽつぽつ,タイル"

let aliasMap: Record<string, string[]> | null = null
let pinMap: Record<string, string> | null = null
function aliasesOf(slug: string): string[] {
    if (!aliasMap) {
        aliasMap = {}
        for (const row of ALIAS_RAW.split("|")) {
            const i = row.indexOf(":")
            aliasMap[row.slice(0, i)] = row.slice(i + 1).split(",").map(normalize).filter(Boolean)
        }
    }
    return aliasMap[slug] || []
}
function pinOf(nq: string): string {
    if (!pinMap) {
        pinMap = {}
        for (const [w, s] of PIN_RAW) pinMap[normalize(w)] = s
    }
    return pinMap[nq] || ""
}

interface Hay { name: string; lede: string; al: string[] }
const HAY = new WeakMap<Entry, Hay>()
function hayOf(e: Entry): Hay {
    let h = HAY.get(e)
    if (!h) {
        h = { name: normalize(e.nameJa) + "|" + normalize(e.nameEn) + "|" + normalize(e.slug), lede: normalize(e.lede), al: aliasesOf(e.slug) }
        HAY.set(e, h)
    }
    return h
}
/** 1語の当たりの強さ（0＝当たらない） */
function scoreOf(e: Entry, nq: string): number {
    if (!nq) return 1
    const h = hayOf(e)
    // 「シュッと」「ふわっと」のように語尾の「と」が付いても FV の語として扱う
    if (pinOf(nq) === e.slug || pinOf(nq.replace(/と$/, "")) === e.slug) return 1000
    if (h.name.includes(nq)) return 500
    let s = 0
    for (const a of h.al) {
        if (a === nq) s = Math.max(s, 400)
        else if (a.includes(nq)) s = Math.max(s, 300)
        else if (a.length >= 2 && nq.includes(a)) s = Math.max(s, 200 + a.length)
    }
    if (s) return s
    if (h.lede.includes(nq)) return 100
    return 0
}
// 「〜すると〜する」等の言い方を語に分ける（全文で1件も当たらないときだけ使う）
function tokensOf(q: string): string[] {
    return q
        .split(/[\s、。,]+|すると|したら|させて|して|っぽく|みたいに|みたいな|ように|ような|ってなる|なる|やつ|感じ|を|が|で|に|は/)
        .map(normalize)
        .filter((t) => t.length >= 2)
}
// ─── 言い方の束（5周目）────────────────────────────────────────────
// 「揺れる」で1件（振り子・炎・線の震えが出ない）だった（独立レビュー）。別名は擬音（ゆらゆら・ぶるぶる）で持っているが、
// 動詞・形容詞（揺れる・震える・跳ねる）からは届かなかった。束の「入口」に当たったら、束の語をすべて別名として引き、
// 元の語で当たった項目の後ろに並べる（元の語の当たりが先）。入口は活用のゆれ（揺れ・揺らす・揺れて）を含めて前方一致で見る
const SYN_RAW: [string, string][] = [
    ["揺れる,揺れ,揺ら,ゆれ,ゆら,ぐらぐら,グラグラ,ゆさゆさ,スウィング,スイング,sway,swing", "ゆらゆら,ぶらぶら,ぶらーん,振り子,ゆらっ,メラメラ,炎,波打つ,うねうね,ぷるぷる,ぶるぶる,震え,ふわふわ,ぷかぷか"],
    ["震える,震え,ふるえ,振動,ぶるぶる,ブルブル,ぷるぷる,わなわな,shake,jitter,vibrat", "ガタガタ,プルプル,ぶるぶる,ブルッ,首を振る,ぷるぷる,震え,手描き,チカチカ,ゆらゆら,ガガッ,ノイズ"],
    ["跳ねる,跳ね,弾む,弾ん,はずむ,はね,ジャンプ,バウンス,bounce,jump", "ポンッ,ぽよん,バウンド,ぴょん,跳ねる,ばね,びよん,ぷるん,跳ね返る,ぴょこぴょこ"],
    ["回る,回転,まわる,まわす,回す,スピン,spin,rotate", "くるくる,ぐるぐる,回転,回る,クルッ,ぐるっと,くるっと,周回"],
    ["光る,光,輝く,かがやく,ひかる,きらめ,煌め,glow,shine", "キラキラ,ピカッ,光る,光沢,キラッ,光が流れる,ネオン,ふわっと光る,ぼんやり光る,ギラッ"],
    ["消える,消え,消す,きえる,けす,なくなる,disappear,fade out", "消える,すっと消える,プツン,フェードアウト,溶ける,線になって消える,払う"],
    ["現れる,現れ,あらわれ,出る,出て,出現,登場,appear,reveal", "ふわっと,フェードイン,下から出てくる,浮かび上がる,スッと出る,じわっと出る,ぬっ,ピョコッ"],
    ["浮く,浮か,浮い,うく,うか,浮遊,float", "浮く,ふわふわ,ぷかぷか,浮遊,持ち上がる,ふわっと浮く"],
    ["伸びる,伸び,のびる,広がる,ひろがる,伸縮,stretch,expand", "伸びる,にゅっ,ぐいーん,ビヨーン,広がる,丸く広がる,にょきにょき,びよーん"],
    ["ぼやける,ぼやけ,ぼける,ぼけ,ぼかす,ぼかし,にじむ,滲む,blur", "ぼかし,ピント,ぼけ,ぼんやり,じんわり,だんだんぼける,ピンボケ,ぼわっ"],
    ["落ちる,落ち,おちる,落下,降る,drop,fall", "ストン,ポンッ,落とす,降る,しんしん,ポイッ"],
    ["縮む,縮ん,ちぢむ,小さくなる,shrink", "縮む,小さくなる,キュッ,ぎゅっ,クシャッ"],
    ["大きくなる,大きく,拡大,膨らむ,ふくらむ,zoom", "ズーム,拡大,大きくなる,ぷくっ,グーッと,寄る"],
    ["流れる,流れ,ながれる,流す,scroll text,ticker", "流れる,テロップ,電光掲示板,ずっと流れる,横に流れる"],
    ["めくる,めくれ,捲る,flip", "めくる,ペラッ,パタン,めくれる,パタパタ,ひっくり返す"],
]
let synList: { keys: string[]; terms: string[] }[] | null = null
function synOf(nq: string): string[] {
    if (!synList) synList = SYN_RAW.map(([k, t]) => ({ keys: k.split(",").map(normalize).filter(Boolean), terms: t.split(",").map(normalize).filter(Boolean) }))
    const out: string[] = []
    for (const g of synList) if (g.keys.some((k) => nq.startsWith(k) || (k.length >= 3 && nq.includes(k)))) for (const t of g.terms) if (!out.includes(t)) out.push(t)
    return out
}
// 表示用（正規化前の語）。「近い言い方」の候補に出す
function synLabels(nq: string): string[] {
    const out: string[] = []
    for (const [k, t] of SYN_RAW) if (k.split(",").map(normalize).some((x) => x && (nq.startsWith(x) || (x.length >= 3 && nq.includes(x))))) for (const w of t.split(",")) if (!out.includes(w)) out.push(w)
    return out
}

type SearchMode = "all" | "words-all" | "words-any" | "none"
function searchEntries(list: Entry[], q: string): { items: Entry[]; mode: SearchMode; tokens: string[]; syn: number } {
    const nq = normalize(q)
    if (!nq) return { items: list, mode: "all", tokens: [], syn: 0 }
    const rank = (sc: (e: Entry) => number) =>
        list.map((e, i) => [sc(e), i, e] as [number, number, Entry]).filter((x) => x[0] > 0).sort((a, b) => b[0] - a[0] || a[1] - b[1]).map((x) => x[2])
    const whole = rank((e) => scoreOf(e, nq))
    // 言い方の束：元の語の当たりの後ろに、束の語（擬音の別名）で当たった項目を足す
    const terms = synOf(nq)
    if (terms.length) {
        const near = rank((e) => {
            const h = hayOf(e)
            let sc = 0
            for (const t of terms) if (h.al.some((a) => a === t || a.includes(t)) || h.name.includes(t)) sc++
            return sc
        }).filter((e) => !whole.includes(e))
        if (near.length) return { items: [...whole, ...near], mode: "all", tokens: [], syn: near.length }
    }
    if (whole.length) return { items: whole, mode: "all", tokens: [], syn: 0 }
    const tk = tokensOf(q)
    if (tk.length >= 2) {
        const both = rank((e) => (tk.every((t) => scoreOf(e, t) > 0) ? tk.reduce((s, t) => s + scoreOf(e, t), 0) : 0))
        if (both.length) return { items: both, mode: "words-all", tokens: tk, syn: 0 }
        const any = rank((e) => tk.reduce((s, t) => s + scoreOf(e, t), 0))
        if (any.length) return { items: any, mode: "words-any", tokens: tk, syn: 0 }
    }
    return { items: [], mode: "none", tokens: tk, syn: 0 }
}

// 演技の既定値（entry/<slug>.json の params[].default・2026-10-25 生成）。slug:key=値,key=値
const PF_DEFAULTS =
    "accordion:duration=0.35,easing=1 ai-orb:idleSpin=8,boost=4,barMax=20,stateFade=0.6 ambient-float:distance=18,duration=6,spread=35,rotate=2 animated-be" +
    "am:cycle=6,active=40,tail=0.35 arrow-slide-through:duration=0.6,travel=120,exit=35,mode=0 ascii-effect:cell=8,ramp=0,contrast=1.3,fps=24 bar-chart-gro" +
    "w:duration=0.46,stagger=70,easing=0,method=0 barber-pole:cycle=3,pitch=48,ratio=0.54,lean=17 before-after:initial=50,follow=0.15 blob-morph:duration=9" +
    ",amp=12,spin=32 block-reveal:duration=0.8,stagger=120,pivot=50,barHeight=100 blur-load:blur=20,duration=0.8 blur-reveal:blur=10,duration=0.8,stagger=6" +
    "0 boot-sequence:charSpeed=20,lineDelay=300,hold=2 border-draw:duration=0.8,thickness=1 bounce-in:height=120,bounces=3,damping=0.45,duration=1.2 breath" +
    "ing-glow:period=3.2,glow=22,scale=6 card-shuffle:interval=3.2,duration=0.8,fan=9,scaleStep=0.05 carousel:duration=0.5,interval=0 chat-sequence:baseTyp" +
    "ing=0.9,perChar=22,readPause=1.2,enter=0.4 checkbox-check:fillDuration=0.3,drawDuration=0.3,drawDelay=0.15,popScale=1.15 circle-reveal:duration=0.6,or" +
    "igin=0 circular-progress:duration=1.5,progress=72 clip-reveal:duration=0.9,direction=0 color-wave:stagger=40,hold=120,batch=1,dim=15 confetti-burst:co" +
    "unt=24,spread=150,duration=1,gravity=0.5 conic-sweep:duration=1.6,arc=300,thickness=3,mode=0 copy-to-clipboard:flash=0.47,rise=5,hold=0.7,feedback=0 c" +
    "orner-brackets:size=16,spin=90,duration=0.55,stagger=0.08 counter-scale:duration=0.35,aperture=0.5,zoom=1.5,mode=0 counter:duration=1.6,ease=1 cover-f" +
    "low:angle=48,spacing=34,depth=140,duration=0.5 cover-transition:duration=0.9,rise=24,scaleFrom=0.8,recede=1.12 crossfade:duration=0.8,zoomIn=1.05 crt-" +
    "power-off:duration=0.62,flash=3.5,line=0.6,flicker=2 cube-roll:duration=0.6,depth=56,overshoot=14,axis=0 curtain-wipe:duration=0.8,panels=1,direction=" +
    "0 custom-cursor:size=24,lerp=0.15,blend=1 directional-hover:duration=0.4,leaveMode=0 dither-dissolve:pixel=3,matrix=2,cycle=4,edge=25 dock-magnify:max" +
    "Scale=1.6,range=160,lift=10,duration=0.12 dot-pagination:visible=5,slide=0.25,edge=0.5,blip=1.5 dots-pulse:speed=1.2,stagger=0.15 drag-scroll:friction" +
    "=0.94,throw=2 drawer-slide:duration=0.35,direction=0 drop-zone:ring=7,respond=0.2,shrink=0.56,settle=12 dropdown-reveal:duration=0.2,offset=8,closeDel" +
    "ay=0.3 duotone-hover:strength=0.75,duration=0.45 dvd-bounce:speed=140,size=96,pop=1.35,hue=45 equalizer-bars:bars=5,speed=220,spread=25,floor=15 error" +
    "-shake:amplitude=8,duration=0.4,shakes=3 expanding-search:duration=0.2,startWidth=44,anchor=0 eye-blink:interval=4,duration=200,jitter=35,double=25 fi" +
    "ll-hover:duration=0.35,direction=0 flame-flicker:duration=1.5,lean=6,stretch=5,sparks=2 flicker-on:duration=1,flickers=5,dim=0.15,glow=18 flip-card:du" +
    "ration=0.6,perspective=800,direction=0 floating-label:duration=0.2,rise=22,scale=0.75 floating-reactions:rise=170,duration=3,sway=14,interval=0.5 fly-" +
    "to-cart:duration=0.7,arc=70,endScale=15,bump=20 focus-dim:dimOpacity=0.3,dimBlur=1,duration=0.3 fog-drift:duration=14,travel=10,layers=3,density=0.55 " +
    "footer-reveal:height=120,lift=16,dim=0.45 frosted-glass:blur=16,opacity=0.08,duration=0.45 gauge-meter:sweep=220,duration=0.64,easing=0,scale=0 gestur" +
    "e-hint:gesture=0,duration=3,distance=180,press=0.86 gift-box-reveal:lift=14,tilt=9,peeks=2,duration=1.3 glitch-hover:strength=4,period=0.7 god-rays:ra" +
    "ys=5,spread=16,speed=8,opacity=0.1 gooey-effect:blur=6,threshold=20,gap=72,duration=0.8 gradient-border:speed=5,thickness=2,glow=10 gradient-morph:dur" +
    "ation=1.8,spread=100,easing=2 gradient-shine:period=2.5,band=20 gradient-wipe:angle=45,softness=24,duration=1.2,easing=2 grain-overlay:opacity=0.05,gr" +
    "ain=0.8,fps=12 halftone:gap=8,angle=45,separation=3,reach=150 header-hide-on-scroll:offset=100,tolerance=120,duration=0.35 header-invert:probe=28,dura" +
    "tion=0.6,mode=0 header-shrink:threshold=80,ratio=0.6,duration=0.3 hint-nudge:distance=7,duration=1.5,rest=1.2 holo-sheen:period=5.5,angle=115,intensit" +
    "y=0.6,glare=120 horizontal-scroll:distance=2,smooth=0.12 hover-preview:lerp=0.12,duration=0.3,scaleFrom=0.8 hover-wave:delay=0.04,height=8,duration=0." +
    "4 image-parallax-hover:shift=14,duration=0.45 image-swap-hover:duration=0.3,mode=0 image-trail:spacing=70,life=1 image-zoom-hover:scale=1.08,duration=" +
    "0.6 ken-burns:zoom=1.15,pan=3,duration=12 letter-spacing-hover:spacing=0.2,duration=1.4,ease=1,compensate=2 lift-hover:lift=8,duration=0.3 lightbox:du" +
    "ration=0.45,dim=0.75 like-burst:count=8,spread=32,duration=0.5,startScale=0.2 line-boil:fps=10,amplitude=1.4,rotation=1 line-draw:duration=2,stagger=0" +
    ".4,easing=0 liquid-distortion:scale=22,frequency=0.012,duration=9,octaves=2 liquid-fill:progress=65,duration=1.5,amplitude=6,speed=2.5 list-add-remove" +
    ":duration=0.25,delay=0.125,slide=0,fade=100 loading-bar:duration=2,height=3 logo-marquee:speed=60,gap=64,fade=80,hoverPause=1 magnetic-hover:strength=" +
    "0.35,lerp=0.12,radius=140 marching-ants:cycle=1.2,dash=6,gap=10,direction=0 marker-line:duration=0.6,thickness=45,delay=0.2 marquee:speed=80,gap=48,di" +
    "rection=0 menu-reveal:duration=0.6,stagger=0.06 menu-toggle:duration=0.4,thickness=3,spin=90 modal-pop:duration=0.25,scaleFrom=0.96 moire-drift:pitch=" +
    "11,beat=0.9,angle=1.2,cycle=24 morphing-dropdown:duration=0.3,overshoot=6,contentFade=0.15,contentShift=12 mosaic-reveal:tiles=1,stagger=25,order=0 mo" +
    "tion-path:curve=80,stagger=0.04,duration=1,rotate=0 mouse-parallax:strength=24,lerp=0.08,direction=1 notched-corner:notch=12,duration=0.5,corners=0,sw" +
    "ap=0 notification-badge:duration=0.5,overshoot=1.56,offset=14,style=0 number-roll:duration=1.2,stagger=80 opening-crawl:perspective=420,tilt=58,durati" +
    "on=18,fade=34 orbit:radius=84,tilt=0.45,period=2.5,depth=0.2 outline-fill:duration=0.6,direction=0 page-turn:duration=1.1,perspective=1200,shade=35 pa" +
    "per-crumple:duration=0.65,ball=0.12,wrinkle=6,toss=180 parallax:strength=0.2,lerp=0.1 password-strength:duration=0.15,style=0,debounce=0 pendulum-swin" +
    "g:angle=14,pivot=18,period=1.6,damping=60 perspective-reveal:perspective=900,rotateX=50,duration=0.7,stagger=80 pill-expand:duration=0.24,labelDelay=0" +
    ".26,width=140,origin=0 preloader-counter:duration=1.8,curtain=0.8 press-feedback:depth=2,scale=0.97,release=0.2 prize-wheel:turns=2,duration=2.2,segme" +
    "nts=8 progressive-blur:layers=4,maxBlur=20,height=34,edge=0 pulse-ring:count=3,duration=2.4,spread=4 quadtree-reveal:depth=5,threshold=45,duration=0.9" +
    ",hold=0.35 rack-focus:duration=1.2,blur=10,hunt=0.35 radial-carousel:radius=320,count=10,duration=0.7,upright=0 ripple-tap:duration=0.6,size=220 rotat" +
    "ing-badge:duration=12,direction=0 row-expand:grow=1.2,duration=0.4,swallow=0 rubber-band:pull=0.25,maxOverscroll=80,snapBack=0.4 ruler-scrubber:pitch=" +
    "12,majorEvery=10,focusTicks=3,edgeFade=8 scanlines:spacing=4,opacity=0.22,sweep=8,flicker=0.35 scratch-card:brush=32,threshold=55,fade=0.4 scroll-cue:" +
    "travel=12,duration=2.4,share=45,nudge=4 scroll-fade-in:distance=40,duration=0.6,stagger=80 scroll-marquee:speed=60,factor=4,lerp=0.08 scroll-progress:" +
    "height=2,smoothing=0.15 scroll-scrub:smoothing=0.14,length=3,threshold=1 scroll-snap:strictness=0,align=0 scroll-spy:line=35,duration=0.25 scroll-zoom" +
    ":zoom=1.15,direction=0 section-color-swap:duration=0.8,trigger=0.4 shadow-pop:depth=6,steps=6,duration=0.12,direction=0 shared-element:duration=0.6,ea" +
    "sing=0 shutter-transition:panels=6,stagger=50,orientation=0 skeleton-shimmer:speed=1.4,width=30 sliced-text:slices=2,tilt=20,offset=10,duration=0.7 sm" +
    "ooth-scroll:lerp=0.1,multiplier=1 snowfall:count=64,duration=10,sway=9,depth=80 spinner-ring:speed=1.2,thickness=3 spiral-reveal:radius=140,turns=1,du" +
    "ration=1.4,stagger=0.06 split-flap:flip=0.14,stagger=60,steps=8 split-screen:duration=0.7,axis=0 split-text-reveal:stagger=30,yOffset=30,duration=0.6 " +
    "spotlight-hover:radius=140,softness=0.6 spring-easing:stiffness=180,damping=12,duration=0.85 sprite-sheet:frames=6,duration=0.6,loop=1,timing=0 squash" +
    "-stretch:squash=16,stretch=14,recover=0.28,overshoot=7 stacking-cards:top=24,peek=12,scale=0.05 stagger-grid:stagger=0.06,duration=0.45,direction=0 st" +
    "amp-in:scale=1.9,angle=26,rest=-8,duration=0.46 star-rating:count=5,lift=1.15,duration=0.15,stagger=0 stateful-button:loadingTime=1.2,checkDuration=0." +
    "5,rise=30,holdTime=2 stepper:duration=0.45,nodeScale=1.2,easing=0 sticker-peel:depth=32,duration=0.5,hold=0.9,angle=-30 sticky-pin:length=2,top=16 sto" +
    "ry-progress:duration=4,segments=4,height=3 swipe-dismiss:threshold=45,fling=110,flyout=0.2,snapBack=0.4 tab-indicator:duration=0.3,stretch=1 text-flip" +
    ":interval=2.2,duration=0.6,perspective=600 text-highlight:offset=15,span=40,stagger=6 text-on-path:curve=90,travel=110,length=4 text-scramble:speed=45" +
    ",charset=0 text-slide-swap:duration=0.35,direction=0 theme-toggle-transition:duration=1.2,shape=0,direction=0 tilt:maxAngle=12,perspective=800,scale=1" +
    ".04 toast-slide:duration=0.35,hold=3 toggle-switch:duration=0.25,overshoot=1 tooltip-pop:delay=0.3,duration=0.2 tracking-in:duration=1.2,spread=0.5,ea" +
    "se=1 twinkle:count=80,duration=1.9,jitter=25,shootEvery=9 typewriter:speed=70,blink=0.6 underline-reveal:duration=0.4,origin=0 velocity-skew:factor=0." +
    "5,maxSkew=8,lerp=0.1 wave-text:amplitude=6,speed=1.6 weight-morph:wmin=200,wmax=900,duration=2.2,stagger=120 word-rotate:interval=2,duration=0.5 xray-" +
    "lens:radius=110,follow=0.6,open=0.16,hold=170 zoom-through:duration=0.7,zoom=5"
// ポスターが暗すぎる項目（上位1%の明るさ p99 ≤ 100/255）と、止まっている時の明るさ補正 = min(1.9, 150/p99)
// 計測：v2/posters/*.jpg 196枚のうち 70 枚
const PF_DIM =
    "accordion:1.90 ambient-float:1.90 animated-beam:1.90 arrow-slide-through:1.90 boot-sequence:1.90 border-draw:1.90 bounce-in:1.10 breathing-glow:1.67 checkbox-ch" +
    "eck:1.10 circular-progress:1.28 confetti-burst:1.10 conic-sweep:1.90 corner-brackets:1.90 counter-scale:1.90 custom-cursor:1.90 directional-hover:1.90 dock-magn" +
    "ify:1.90 dot-pagination:1.90 dots-pulse:1.90 drop-zone:1.90 dropdown-reveal:1.90 dvd-bounce:1.90 equalizer-bars:1.90 error-shake:1.90 flame-flicker:1.25 flicker" +
    "-on:1.77 floating-label:1.90 floating-reactions:1.10 fly-to-cart:1.10 focus-dim:1.86 gauge-meter:1.67 gesture-hint:1.90 god-rays:1.90 gooey-effect:1.11 gradient" +
    "-border:1.90 gradient-shine:1.90 header-hide-on-scroll:1.90 header-shrink:1.90 hint-nudge:1.90 hover-preview:1.90 hover-wave:1.90 image-trail:1.03 letter-spacin" +
    "g-hover:1.90 like-burst:1.90 line-draw:1.90 liquid-distortion:1.83 liquid-fill:1.59 list-add-remove:1.38 loading-bar:1.90 logo-marquee:1.90 magnetic-hover:1.90 " +
    "marching-ants:1.90 marquee:1.01 menu-toggle:1.90 moire-drift:1.90 morphing-dropdown:1.10 motion-path:1.10 mouse-parallax:1.10 notification-badge:1.90 opening-cr" +
    "awl:1.52 orbit:1.90 page-turn:1.90 password-strength:1.10 pendulum-swing:1.10 perspective-reveal:1.90 pill-expand:1.90 press-feedback:1.90 progressive-blur:1.54" +
    " pulse-ring:1.90 radial-carousel:1.10 ripple-tap:1.90 rotating-badge:1.90 rubber-band:1.90 ruler-scrubber:1.90 scanlines:1.90 scroll-cue:1.90 scroll-fade-in:1.9" +
    "0 scroll-marquee:1.08 scroll-progress:1.90 scroll-scrub:1.90 scroll-snap:1.90 scroll-spy:1.90 skeleton-shimmer:1.90 smooth-scroll:1.90 snowfall:1.90 spinner-rin" +
    "g:1.90 spotlight-hover:1.90 spring-easing:1.90 sprite-sheet:1.90 squash-stretch:1.10 stamp-in:1.90 star-rating:1.12 stepper:1.10 sticky-pin:1.90 story-progress:" +
    "1.90 swipe-dismiss:1.90 tab-indicator:1.90 text-highlight:1.90 text-on-path:1.90 text-slide-swap:1.15 tilt:1.90 toast-slide:1.90 toggle-switch:1.10 tooltip-pop:" +
    "1.90 twinkle:1.90 typewriter:1.27 velocity-skew:1.12"
// ポスターの下塗り（5周目）：遅延読み込みが追いつかない間、黒い枠が並んでいた（高速スクロールで 192件中47件だけ読み込み済み・独立レビュー2人）。
// 各ポスターを 32×18 に縮めた WebP（暗いものは PF_DIM と同じ明るさ補正を焼き込み済み）を .ph の背景に敷く＝本画像が来るまで「ぼけた同じ絵」が見える。
// 計測：v2/posters/*.jpg 196枚 → 29,661 文字（平均151字/枚）。生成＝/motion-dict-v2-blind/aww/r5/posters/ の PIL（LANCZOS・quality 35）
// 6周目（指摘1）：32×18 では黒地の細い白文字が潰れ、下塗りが「ほぼ黒い箱」に見えた → 96×54（quality 35）に。70833 文字（平均361字/枚）。
// 1440幅の格子の1枚（約320px）でも字や図形の形が読める＝本画像が来る前から「同じ絵の少し甘い版」が見える
const PF_LQIP =
    "magnetic-hover:UklGRnYAAABXRUJQVlA4IGoAAADQBQCdASpgADYAPtFoqVGoJqOipBqowQAaCWkAACvbD2yJOScqep0WaO0C7LTKT7f0iyZI2RQAAP7xCea/vdozkUAmWoqXuwK4/xwhXw1SoObl0l/KgmLug" +
    "Ikv4Sf8+OIwQ+1rW1bgAAAA custom-cursor:UklGRt4AAABXRUJQVlA4INIAAABwBQCdASpgADYAPtFirFCoJSQiqBVYAQAaCWkAA+KJp2UqBYK8cMB48xI7IcwaVnREWxgAAP7xjIHj0fXgpn2zOYkOUEdYiI" +
    "WG/sfa+fwr8/yo+K6YcgdB6aKR2Wxq7jNr+WuaYL5L0+z3eug6CcAXBhEN0d9lt0xX5tbUK7JS14yhhUZd2R23k2PleSKSK1H1hERLV57qtYuYPVVBk1b8fEmh8klCSggWjcOo7xWwyDjhHuOPwygGhJGgI/dJ7l" +
    "5SPxBnc80W7R+mSNskAAAAAAA= tilt:UklGRsYAAABXRUJQVlA4ILoAAADwBgCdASpgADYAPtFmrlEoJaQipBqowQAaCWkAA+TJkrkJxrDF5IpwRIPis6YMtG0kH2V9XfMvKgW1VYeaHDAAAP7y47IoRqSpKMyQ" +
    "N4hgbMlOsBRtE1ueeWbL7+ZDQwQlFw/2V3GZz47X1sh0OP51IO1G58rafe8z3AzFabTI3A0fIVJhXEE+kUYLhmXTWUZ971oQYG1hBY7mc1S6Jth8LBhiMq3xNP2k3u3MP9TBC02CA+YIJ5swAAA= text-scramb" +
    "le:UklGRiwBAABXRUJQVlA4ICABAABQBwCdASpgADYAPtFor1CoJiSipWhpABoJaQAIEFUQtQUyrxm6gfR2Fyy8bNaQoIISwezFFl6Sc5LPqHeGidEhl3oAAP7z2AcWTI+W56FYGcbIX+utwEMzfLHdCnxyWVXCJ" +
    "fR2UNkzCV7XTHkCtFWC6gkJ0+/wWGrvFu2sjMfMtcFWXomUEDJro39a/RyjEbaaFwmvpsd9MGFUm0ibjU4xyDVQw4edqF4O9u/KU5RRcgE8zOZ6z+6aVxoUK8h5TNQTBSa6RW+HOwN9tvgcjfKgjbom7J88yyBUD" +
    "ldxShaOkZrJ571/Y/yQmYhUjHkP0MCKXa5rDDc9Vvzv86vxPr6biE99yTydjHZSpYeCXrUJdhFDb/iworrEjtCYFwAAAAA= underline-reveal:UklGRhgBAABXRUJQVlA4IAwBAABQCACdASpgADYAPtFoqVA" +
    "oJiQipXgKAQAaCWkADnxWAygYc1nMeYtXSM8VHHNokGB0oMgppM5xL51Vktp2tbK7LfGOIgHnQiKu2AAA/vY6Q+zs+BYm6gJez8SKvIg+6ghMax/D3Lqcesn8UC3tHwwGEwaaYsisuWxiP0xfIUtGFyPvSWmUdFb" +
    "X3nOUynilL4v3c2ZmZCUniHX5rpcuTqr2CVPpyZpULxKX+9JUJXHhjnF5o69ds1ZnNN6IJppMITPiTH+UBzGEMyIifmAzKKvhIiwWT3Pp+4vPFXoqpCMdZb5JN+y9++NkjpratEtwbeSw7R3zWeoCfmxwR2v6OMt" +
    "rTYuNZjMogwAAAAAA spotlight-hover:UklGRr4AAABXRUJQVlA4ILIAAAAwBwCdASpgADYAPtFgrVAoJTKipXgJmlAaCWkACwBHAhAARJfrm3oCx2xC/8DsJUsWhc84v9olrn6LCqIj2fHKEQAA/vEJ5sXNkh" +
    "9YDuFOXzyO9o8l9yg5XuKJfBaF7/XrJ7hPjGF3OWoaKeWoJL/hFJdEUAi/FbhAMjnRpWpgjnheWFYBWybTk8TE12rQ6NV5bbmjUbeYRgLvoccUhI44OH+U+Abszg9E1begCz/mAAAA fill-hover:UklGRqQAAA" +
    "BXRUJQVlA4IJgAAACwBQCdASpgADYAPtFeq04oJSQiKqiBABoJQBrClTiRbcMM+nFLZbscn6CsgUPDskx2gSESEMAA/vVVgsPXnyxzNfhsmrjobx7Ypi1N7lkZqe1F8PXKqq94po+YHhUAJ3H4N/n56zlnD4L6De" +
    "WnLBJQfPnblvtdW46/3wgdIO6zbhJl4uhNo07DRmvAU/yOJRuOdl3hAAAAAA== directional-hover:UklGRugAAABXRUJQVlA4INwAAADQBwCdASpgADYAPtFcq08oJKQiKVto8QAaCWls/9AAAage4oDpfiZ" +
    "uC0Bp+BF/19Wu+yGD3cSOIvXiD47rBw86UwRGrMEdAAD+8QnJXkHVRK/PjVVmGe0gtk1qJFGanU6ynNBwJhIgXvrP716a2NDi0aMT/6/+K54z6AvjqED2x/n1y2oAN+oLmeuj6K5u1p0DszW4HqwiO4eGrr27GCh" +
    "kKmgiuJT2U6Yb4EtPmt3iz6ifbbgReGmQQZ3KJNbAT/d57DSBM2zXCX48xxB4BFZKteVVvMXKWfAAAAAA lift-hover:UklGRpQAAABXRUJQVlA4IIgAAACQBgCdASpgADYAPtFWoUuoJKMhsAipABoJaQAAccC" +
    "TdqS3pUlG4Oox+qgOA6yq2wRozsxDrHpjE4tlZ6UAAP7yGcdqxD1Dg9eBlkdbF6pPjOyMshgwhezQ3H9WeY51y1i+c9neiO41OBONFPGcFCnR6n/P1oTEA+FpDkb6mf/kbIuXPR0wAAAA focus-dim:UklGRoQB" +
    "AABXRUJQVlA4IHgBAACQCQCdASpgADYAPtFmq1AoJaQjIqrpABoJaQAL9MyBHNzgJVO20oe1l12rotJoa/yua/dUW6Qe7CNGFverhYSq6eeFaqONh2WOEUZ+l0buPCIvlUQAAP74Rwn091UNg+nw0nQGX/L3Vz07" +
    "HZ8xx5gvR7gfIXESTFNnxda/IzOjlxUDrdBzr+sWt/PSUN3D9Jp34Kf3TMcWxdvooBeNbwEkWmdXnFVo9zOr20z+sNrvka+/PA8S2RXzx1DFPc4GGOkTs9eelrqoCGG2wmtTVV1GcARP88L8RA1KbGqxaFL+cysb" +
    "xWMkaM8URc+HhvQubDDQv6VoiTnwba7puWwAfZ4HHvam7yVXHpFc9Lhuu6ntRe47nKOGUlpVjtNlQc0oz1VCi/BJ2XLkZwZZwaEc9IvZw4GNoa+r5BJetxVhkeNdXA1DGkUiF1PxKWqtCYNomq46nVriyOl1jXEE" +
    "Rdij27vHNEgufZXUQLTttOqKZv63ADGz3ZBgAAAA border-draw:UklGRr4AAABXRUJQVlA4ILIAAADQBgCdASpgADYAPtFiqU8oJaQiLBOYAQAaCWkAAGkg9/0OG5HrbfXjzawlCcZdXSw6sl7RGEjB9RzIfmK" +
    "uqAAA/vGMhwEz16BJeVN0pyx26HkrQsKNclAuIhXsTJIdIc+M24t8upoBQggGq+7cuio+lm6IxjVk0/jdoX0PKSBxKnW6ycl2gXXEtEEn+U0nYyAqhPAV8nmAo8cNiOYpYzqZOU+mv1eAUsEhLHYb+vxIAAAA im" +
    "age-trail:UklGRvoAAABXRUJQVlA4IO4AAACwBwCdASpgADYAPtForFEoJiQioqnRABoJaQAOfNuCL2FcB6IvrMidwJv5eE9sJHyg6BuxExBhE03A4qN34wb8XqAlRxzAAP708gmEm8C/OWu1RrM/OIaDYMZfT/" +
    "SDrQQ+5oFNY0p7abxZUz+dRiCR7ICN9EFDsC+lfmGKw+tl1TpZRPOdU/tJZ/gp+3t1ZxaAH9vrSR9NBD/Fa+1KNEIz1jhfnxudDxyoepYnjzByGBoP00stfv38WubvY+2jY6Yvcgaur41cH4empaMpMsw+sPQNRy" +
    "Gl/AjBFOfKPYB8qDHhWdnd0Dv7oEAAAAAA glitch-hover:UklGRg4BAABXRUJQVlA4IAIBAAAQBwCdASpgADYAPtFor1EoJiSioqkZABoJaQBUfxhL/VbgByUS4T/P/4FFRSgbDOpGk7qDolYrnrdWyt8w/b/L" +
    "AAD+89gDbkedGf2NczIFVYt5Oc8D64DuxE/w8ThYXY2K24HxFh3NJmSAzcOO4uui/halAER1P8DkvXh0uK2c1vu4Xb8xI/84vGu5FwjiGe4aSOJrcD+9qk9VRGF5oB+WVZiv0bq5y/N/Mc25ekWC67FB1DB+oWE5" +
    "p2m8piyAlh75r7c6pczA4kwc3wb//t8KCfoyPJ/0fLvLkjug6q+nbRUvWyrZaE7PG8xXBZmAneIW8iYx7CxAw8usjVb8iAAAAAA= text-slide-swap:UklGRuQAAABXRUJQVlA4INgAAABQCACdASpgADYAPtF" +
    "iqk6oJaQiJrZrWQAaCWkABRAe6stsX2q9s+yD+8Z3e4sUEWDPE0Uu9N42Z/HUB6IbMHmK6CB+3oo2/RI4uAAA/vLjKOfNjJxrVBX2GtJ2rEBa/yUvXxKprvICsYjCFEWyauNOKbA65/Y15DIloH5k3LJTrnyPYtO" +
    "DD36gFPrelg+9aqgLvGNgegHmgr/H8+2C8qc5a8u6AoNYbtsS4tIZUr1SyUpZL7RHBkTKr12pX+x26CugLJlDPAM+ZJwiQg8WR1KABFo6ts9AAAA= hover-preview:UklGRhgBAABXRUJQVlA4IAwBAABQBwCd" +
    "ASpgADYAPtForlGoJiQiorgJGQAaCWkABszbFaWxvABN+3+f8URWmTo5IipwoUxvZxU9CzFQ3lcxFlv+OlxAAP7y4wrfNPHb8O4FttCxxOeLqCMpBnou4uqix8iVokLUD3k0vrNt9xfXPNayJigiIIn9N1rXbWLZ" +
    "oMpHjvId99YCpxmf5v2aea4shWetFBuR2qQH/TdA0HBoKGT86oVZGtFADnb+dQOgD26rbfJHExqSkgK61amnWSwFMw3U5VAqdDu0oNdMV85/wrv4mxd0HUjl3A1pqRt8B2qrRkPf/KPLlAkvMb3p17SgXyOWldyl" +
    "z7+shI3dU7zr6UzgHQ5+f12mhOgAAAAA hover-wave:UklGRggBAABXRUJQVlA4IPwAAAAQBwCdASpgADYAPtFmr1EoJaSipXgIaQAaCWkAE8hVvXmY1AOi5+xwuWXjZ2saIme7ICa1Yb/37vSSaGmTABztAAD+" +
    "8mPfKgMbxH1frv8rNNFbV2kVOFuqPjuvA+XoP2sx3Re5VPCWKD39D1/NNJgoLIFINWbwqfr1mzXZ6unWI8Edrbs2fTkypd3DlsJoY1GLn30AwsASBRLUsk0gsHKnum82W6A0jlY/XHu+tEDkHN/0O7Kfw2+xWF3z" +
    "SxLwKMO+xicGysYQCmnTSOWRg8LzSuuwYTCN9fdiQDfLwmeYoZCiOC3Wgd9t8ta6I4zGnFXmVR8+vNhg9AAAAAA= image-swap-hover:UklGRmICAABXRUJQVlA4IFYCAAAQDgCdASpgADYAPtFgp04oJiOiKB" +
    "gMAQAaCWkAEgqadi7zIq2qNoWFt/MJiBm/Q1HkCcY3/weIaI+4lHjNCRkR/tTEAecNRZ+ZqvgjXB5yp1UUI6eTUdHSAssoEQM1jD+pTBpm3UW2LFTbVjHCU7zWOF/5OUfd/2AAAP72un5frJKAs72H1DBZ0XaMgU" +
    "Rh5JtqfO3WJfzYaP82Jb5o1IPq3aFtoAqq6Uc4YEXywgqEJRVbZ5vapzg6vL8HFJq6DiZSsOykW9c/IrNtHcAInDDcRf5wmFLWmJjJWbNRGXJMSQCVPb2Abup72XdvKiO/nviF9hFsVPUmOUuaavgm7xyJlxd7BC" +
    "Jn4A19QAy0iVA1CD0bkke7qnfiGnMjMQzO1ml/G8k2YSuOCBZoHWtJw8o4D8AWQ12v05lL2nIytluPFRjdSZmS65fUc6P8EiNPKqtFNrnEftjBGqOMM9Yo/vHqu9z41+njW54HubFUsuU11RoHNWx/Cwj2ul9kck" +
    "Px3m6yAo8B7Z26lT14xFzz8zcXYaPT/w/j4Vkp6jbqFLNXDH6CYi7OE11C/SaL90DfeMe+o7IqJ+62u5+q831a+IqwEXl3KYXNvhN8dypad2qFfwcqhMQG91BTcxLg38tkvIzdluvIrIt5wCRAf8n63yW2siH7rM" +
    "FAH1Wk+eqwFkVQPIVyRy70uDI02NmJomRAtnFzifj3UUBJ3IbYVDj9LeWDwe7QEaJ3+0u3sItxssTUPhJDTdRXT5YyKyhBWfpVXj+IH1TAZIhM/atLmHxTWJuxHEAAAAAA mouse-parallax:UklGRpQAAABXRU" +
    "JQVlA4IIgAAAAwBQCdASpgADYAPtForlEoJiQjpXgIaQAaCWUAAE1UQDmmtYJM2GEYbKbU3NJR7i3+AAD+9BalKihE/9n8X9L88Q0DkDg3VEssLmE3ChVcI8Nxd73ygKXPP/+jDzdvL86udMpCT9AEGXElJKbCsJ" +
    "pc0FBChw/9+Zf7N48QyqrjLN3qiZgAAAAA shadow-pop:UklGRuwAAABXRUJQVlA4IOAAAADwBwCdASpgADYAPtFiqE4oJiOiKrgJgQAaCWcADnwXAW+HhQ3zxkBe35B5vfza6S+K3eGCsnaSp5XON5ROZxLT2+" +
    "EF55lvrgAA/vY6TbrXOjJh3Txlyjf196uXuWb75SXeSflb4/xjpURZg144poffO+VWs5GAif1v+T3j/AoNXP1aZAWVgXzRczl/0OYmsen2BeJWaN97du9KYradz7ZwoQloc3DgNf0pjkDpuHfhR6DGz/qdEljO4y" +
    "zlKadRd1k4i4DpBxJQK2xMqjQmv7wy+NJbXfYJFru4ae5ZhQAAAA== row-expand:UklGRgIBAABXRUJQVlA4IPYAAADwCACdASpgADYAPtFgqE4oJaQiLrLoAQAaCWkAAHbTnKYKkRX1mDsLmaVss0/50louiA" +
    "inR7t8lUe9MJqS6/LSxCewE/WeKeljgv7jv2z/QAD+82MDk2c689F4Xp+G8CGOeVd3Dcj9x/pk0PT/17DwPzqUzgc0D1Q4jHiUYqJHve4tf/3zJABJkv3ojLjf25rkGYj+z0kZ2VEQ11rGcE5x7km2uxCwWqPiia" +
    "2NS8IRdsiodEfY9n+Eew9VEsUNMSrm4diuKsP8fvppqlOn+3MPY29gNWPUdYXS/inCUfyVWtAndf7JdiYrvwAyBXHK1xDIMmEAAAA= dock-magnify:UklGRvQAAABXRUJQVlA4IOgAAADwCACdASpgADYAPtFc" +
    "pUuoJaOhsViYAQAaCWkAFts8FeAW+Ql6p5/fqBSGwvhDSsV2AExzi6SPkgLA3oJ6upiBx5IE/7/NLyBUgW5Ojz8cAAD+8uMwXMRnNbm/3qsR7rEfeo50aq7Sl+rtkxGhTX6qpB+zoyaJwKWvkRu/UzxYV4NxJQDM" +
    "aBhnuM823bkQeFl5+6k/B0gAjseOzEkB6S+I03WzOJPkATwba+RJAzY+Q+o8qD3NsTDJoEMCgp/kcq66dL8U9nRsvJwGImCnT842fFzYhuBsgVGWdKfThfqbs2J2tbmHgAAA cube-roll:UklGRogAAABXRUJQV" +
    "lA4IHwAAABQBgCdASpgADYAPtFoqU4oJyQiLBVYAQAaCWkAAG74ASDPbXuEtwJsG5ZYAJzrOQIUKvaRtEGs8zBtgAD+8hmGFrjYmFzJDvTQlY3IgzhTRqI+LP5T2YxInm4SWwezTGJ/Mfgm1mtE1GVAL/IQ2/RHR" +
    "YewSVIDiJBJAAAA letter-spacing-hover:UklGRroAAABXRUJQVlA4IK4AAAAwBgCdASpgADYAPtFkpU8oJaMiKB1ZWQAaCWkABRAet4L9M4Z/aDS7EumEPQgeqfoeaLtqSAAkfRoAAP7xRJMX3nKTQMB8Xb6" +
    "XqOuF6w8ZVNgpFKOYEBgmAjs6a0Y5klY01BxwaFqv2lPpQ/XRQbNS0+aLu09/326JXp6ACgPisJGHHH6QALmj+wR/YUkAMq2ayQAERgi5q6VvRVYqBs4EJgzOfngUoZV1wAAAAAA= line-boil:UklGRuAAAABX" +
    "RUJQVlA4INQAAAAwBwCdASpgADYAPtFep02oJSOiLrXYAQAaCWkcNABG7kX1rkRUZ26+qoPY4ba13ahdEsvO4/T5fpBhdZEi4rfPGAAA/vPYJ2CSXRqXjOw1GZHFVcrH1W71HWTO9Co1eg7KyiZ5Met1QeZh+ZQd" +
    "VeTv+SH+rl903FZkNg6R4IOtre8eMNkG4Ct9SQ/g5WE4t4SkPV+h+YgTJYqejymm1xRYcNcqV9xUrL9QwUzIXvuh7b4c8tmQdVnWRRWrXjX1tIuLqzu4fvT5u8NYtV2MGV0CtgAAAA== holo-sheen:UklGRsAA" +
    "AABXRUJQVlA4ILQAAABwBwCdASpgADYAPtFmrVAoJaSiqBVYcQAaCWcA1jAnzCHFCC5xyEnwRqMD9g0TWq6sxCHWW+MzOsSQpAJaDxWMHFrUAAD+9IUbB2TrvhY/PoKkckkBSd0poXeojWqrsOYl0YTOjmSpxf+l" +
    "PnuCfIS0Emqe87yeMzp5qRml4BqmY5Wy9WoY4/aHftY82GUzWXyEYfJ0+tG4XTzQNrrd3qXk27nKJlMIPmgw5t81o0ekUYAAAAA= arrow-slide-through:UklGRvgAAABXRUJQVlA4IOwAAADQCACdASpgADY" +
    "APtFeqk2oJSQiLBqpEQAaCWkAAH6tGYayZmbPzB5g+SKtodRjl/M09R0g6QvqklqAve/sFt9Dv3rSVGQPyOPquK8DG1kAAP7yXo9J3q9NZeiNIypzO/TpzQ6hNaAwyYnIcoR8+PnwPA6xkwMVsk8OnjjnDGzKyds" +
    "dmwTnAf8vewAG/J48hYJmepPhNAsEUjvspWaVqm0e04NywsE46NAL2t7ntnqCMdWOPVScVVIvMzlOvK08qbxEaC1c7Dw09h+M4vsvRVdMjkJmqxnUstEVi6FHqyRbW+uP6i/PxnfinAgAAA== xray-lens:UklG" +
    "RkoBAABXRUJQVlA4ID4BAABQCQCdASpgADYAPtFeq00oJSQiLrLpOQAaCWkAA+gsXMbidNdRHGCiKhuKKcWoztulxJtjTMC3o2PboVsC95umfnxaVZSpgEY/yCme4B1x4zaLAAD+9VMh9kUyxlGBzM3wY6YrzCdc" +
    "9WNpdXKwfb+Oc8IvQnSKTiRzW8N1SDfU3pTXc9XN3ZEos9TXUMrT1qkZeeHJeMlJFmMZfH+AZ4jT0Jr32YSMFjmcq4N/eu4kEaXaO9vdbLydkHGfr3gaeuKAsshhLBy+K+EhQSnA/o+cFpXwnJqN1GuyHQaBIrLA" +
    "Y0YHSLIbEdvUcTXS3IQn+59HuULU8+Uj8FAOC8CFM/m0Bo7fB/uiqZ1Nf+d3GKvBodCYc3+YpyXxXIllQbjCxFuOY0Yb9TAH77zkG0VA7E3BXBgzri6n6C9W64gAAAA= flame-flicker:UklGRlABAABXRUJQV" +
    "lA4IEQBAADwCQCdASpgADYAPtFeqVAoJKOipXgKyQAaCWkcAABG/ENxe6t1svUlc1MtB4EsnfpWiBcmxns2H0r9SZXs2J+olkrUpQlcGvtRxhn3aMszcSRr1V0s1ZYAAP72DkG8Hmo2QoTR6Nvj3upXOiWGhjPv/" +
    "hhufFqZxuZ743UKoyxGPeDSUHKgHbdoy8GhAWvik3XLBDBxhrfk7AU8n8uJ7qOLopmOTodm8+WCxLMyGwK4sAhys0x/b8VIcu7FrP/wujnWAlmGdHqSoDF9OhnJxsWzhYSWrFCmEqcQq1SIua2oBIvpl/XMgwsBp" +
    "GCp8J78I0/7Un0JEHwkzoS//iMEXxnkqQ2S6omk94Dv5+l4629t+Iv0mOOJ9QbxxGjZPgum6lypEvMNL8zY00gyFXoIdWSJwS5H75VToQCx7V/Cg8GEB7HAAAA= scroll-fade-in:UklGRsoAAABXRUJQVlA4I" +
    "L4AAABQCACdASpgADYAPtFmp0+oJiMiIrgNcQAaCWkA1FAC3bGHvKVoyUEKINJL4gDnLFCLAfGQkCmQMUmy7Yz3rdMvjqAsPjaaQDqvCAAA/vMmszz5rLpr1+MxVh5xZc4r5pUBU45XVt3XRhE7ndlE6tChFMb+7" +
    "p18bFqeTpC+bIH3b88k0PYrKwUwWIAJ/cRLDbLhQga0FB7JnP/wGpJKsUvadOUMSHZOn8KYwQSS8MRlwWsVeynbyOYGFrAAAAAA perspective-reveal:UklGRuYAAABXRUJQVlA4INoAAABQCgCdASpgADYAP" +
    "tFkq1EoJSOjpXgI0QAaCWkA1IwFvxXm8N1iLGB3Ks8aC4tWCPxQQyLsWPbSohI5uF7EFYDQxNboH65qw7k876KaFeltv7/E9bie7qx+EQcAAP70JgDSkCrNIsc8LUYitt4rZ4hkrTv9dH2vIsJdaNRLFl0JvpejU" +
    "R2Awpakwy9jnZtyvbcgR1dUgWHJQseU5a8kAomZWRmGUKyMZn9iHz1WiEFp7tmoLm0I5CWTvWgm3ACv4ofGJN6OO6kW+LgUt8X9nq729QnFsUQDQNQAAA== parallax:UklGRtgBAABXRUJQVlA4IMwBAACQDQC" +
    "dASpgADYAPtFYpE2oJKMiLBjrMQAaCWllbgbF06trqyWsQRFYIEp7rl9RuZDlI4ce2pPoyfM5wstC1OMWoodCDVyIPoWAaWTfU84LzWrt7jMrCk8Pe5M5XYc8040mxk9WK+kWQ2Q96kY3q9iy60rPCwAA/vtnGJT" +
    "YWOUVAFfe/BH5ZbrZevHVm4S4AJ3gjA0XqcugBTQdDHik43LMVOk1jT60UHWWO8M61VOJl4wSXPZZUdtxrV2gXqmHNiK/eH2LZwYb4ArEvMWgBa7eu6//ZBdxYu7iej7iLw/3a7+HqRESWbBpOW6pUIbQRefciwd" +
    "gNzj4WhoZqPQwO+i0ekVFqlpGzzeyPIPyNeJjpurV0WYu8pSo7wvDMrSGFYM6r15cYm1ZvijooCDEBzYAXLZ+pFeXksxPAb3EoKegUEvjJ7IqvIiK1speUHit2MSzslJEfyJjJzslYLFvRiehSdnIEHxBSr0RVsq" +
    "ysLMPavQ+SQQArHE6RUVXjAUnNon+RSztfjJqQjv5wkh3QGikBntiHlZMr4UCUCivKrA9rLmOz68LhgB2n0asuRHRCD0zDW4cOK2w2VBxw4QFFZ3g9M58jM6Y+nGYisAA scroll-progress:UklGRiYBAABXRU" +
    "JQVlA4IBoBAAAwCACdASpgADYAPtFkrVGoJSQjpBVYwQAaCWkAA+T4LfWQQc//p4bo/eHh56WeQvNT7WnsZRDn5Xzb0KzXN/vec5et0yyo0OsiQAD+9BwGelS4QmW6ZuUwP516XH8VztlR9vJbKTDT//nFRvzywO" +
    "j53C5mj1GCgOvQGvKuhZbhKIxTU9hTtUsbvnSbthXZhk/xnHcstGmGhTVa3ThHIDxPB/3PTUeINX9qIeIn9ywsZobuH1mACyarxBvpoLCfPiI0hORUpIH1EhMbAoYIcJeb9BlAnecHUj54qK80R20uyqZxMdTOYn" +
    "BnVGmLAmsYvRA+keZE3QPU99RRWQMbRxpKifd/N2xLuqPu7iqAwgZNaogsjzK/4GAAAAA= velocity-skew:UklGRugBAABXRUJQVlA4INwBAADQCgCdASpgADYAPtFoqU8oJqQiKrQIgQAaCWcADo+2QytmCXA" +
    "geJnF5/seXwb75T7mBvlEIhmzcK9lttvLFsH3s4aUBHQ0iwtIlbhGc0p3NBq2X5AVeUwq8PN8WVIGAAD+9WlO9s7w8ZTD+lEqZNOOKI2hePs3Znzx4rU5RcUn1X5DUNCAVMeeHnwccWtxpK6bTkA5sJMMxGiMG1e" +
    "h5UX8TfwEMz4KeNFX+Z86bugM9A4tQgD+tFnNeBB3orhmqMfZWTlH1+tnH/L9jnuUDooKJVOZpTadARnMPZwshlmcgusJISH3uAh/FjUcgvio5SlGaSk74/BOVm+ktX108zBSDSQdvkbGkWDukS1B2LMWHbAygcz" +
    "97pFaP8W3/HLbWU7dfjeEWPsnLBiCxuqBV8hP/nnPbpoIBaTBpuFE1/CTB5haIAEilc1enWO+d1XrzBZcWsPpnyOzLMjvIjPopZrRLViFGE/jN24uHJJDdOcwaa2jSek4GdjjtBJlt3HA1MpcBmYrenHdPZUOn8+" +
    "ZyHpXho/ApDbL9QXzR9v5gCYpM8dmhwy9WVD0VU3BobuMjrXwOLynRt7LyK39G1fqCfclmr9vWxhdmm6cjfGpPxxqO3l4FfwVv5z3+AAAAA== text-highlight:UklGRlgAAABXRUJQVlA4IEwAAADQBACdASp" +
    "gADYAPtFeo06oJSKiKUjxABoJaQAAQtCfESEWrTBt1RDVfwXF9qgA8AD+8QyQ5w6l5xxq+B9/gFt6/38/6/D6Wd2IAAAA scroll-zoom:UklGRhICAABXRUJQVlA4IAYCAADQDQCdASpgADYAPtFcqEyoJSQiMB" +
    "gIqQAaCWkADqV75n2OKnuLdk7H31sGbJPM7CU05fUJB7ID3vR90BVlBNomLafMrX6xiRX1SBWDwo9A4J4zRcrYy7Q9aMaoXesWub0lOcuWUK1StFxy026/OtTHUp7xh2Z9MAD++b2ngO7dvtOjI+r3tt8acxv1qs" +
    "CmgyOREeUp8/uU6oMMSA7f9gl1B8dAADROfvnG/E64W/Fpi++AuIwoQnHhiPJIXpFTjStsj1iscSxnRy54OuCkMduczFW1zUu/G74shyFWzYFl8o4aHGQRh+UtZ50GOtzwyA1qvQbMiwQjXKcbKzbAb4Q0UoTRZ2" +
    "OV7KuXfzqEVPFYIwoWSaaPl90+JdFE+8YMSfIfpmLah1To1mIwWTLHBpk7PdW/E0vq2916rGN6l8ka46aKmQzaDrVr4qSzgV2LPxM/PA62iwDZzTlP2J+gyYIFRgPNb5TvRDkgynkSVGzaczTZkf7M/exM5XuGAG" +
    "Lz56BqxT4ZGAriDeBszn0Hai9/OS9a5ch7JF42DhMBLjkrkti6T4wpBwYbVD5kz9fBQVEeWS5jcPJob8rrkdmx8v5SK0SkPKmS3xFcNQVsnLv/RU2eaY7EBQAz2Rnm9ArP6Zb9AzciF4aG7oXz2FNasm1YroekXP" +
    "+9/XVmTm9uvZwaRdMrD+gAAA== sticky-pin:UklGRvgAAABXRUJQVlA4IOwAAAAQCQCdASpgADYAPtFepk6oJSQiKVJMOQAaCWcA0JACvbjeI6p5GvPxuG6E0a8fQzaG+hQCIQ0J8b1d3CgHqFrMSSag0/ZDhm" +
    "frb+Q82AuVc4gA/vM09JXPnDwEBD3mLfo7zwK2p4tpQGcRti2ehDLwKFNvnDUgH9KWrLQExLCfb5zO/bxF5A3y9kt7qsUAqn3gdDXjm507vIv1u02+HaSdK031doKFVaUWoUq6XzdCZ9MrcnM50GLz27z4Ho5yWh" +
    "qja7FqCmTEPAyacwBiALE/gfLBosaIMYAUZmVRrr6w05XDG35RtJg6cAAAAA== scroll-scrub:UklGRgQBAABXRUJQVlA4IPgAAAAQCACdASpgADYAPtFcpU2oJSMiKr36AQAaCWkACwAsAPd0TsLP2eVALuTD" +
    "V67gSiTz+NvBynZ24W1n7Ls7I50dbAitE0brzFQAAP7xgnid3ebtxSJWswOwcvE8O4meb/WjIyitFpjQMCzRxRv18le8nUgBpDrKxZk4Dl/+GYRjYq7dcSmFDzShuGNdkZySvBxrIaUy5OGUI8Sd/iKr+dyCoPmZ" +
    "UXHpWm5lfN8FP7nh8TOx4HLgyaXlW7vxU77InYzy0n6wBspZWBoEjDRhAeGBNjG/dqQI9eZ0MK/vXEEb3U1bhp/9I5QRXZKEEw57BG+QDDgfXoAAAA== text-on-path:UklGRowAAABXRUJQVlA4IIAAAACwBA" +
    "CdASpgADYAPtFor1KoJaQiorgIAQAaCWkAABn7U07RZDi/1boVEQfWPNlgAP7xCeeW1L/QOf0s2LZkAkjWoYEXl/XX7QJSz/rpyxv0ycON7/KhCyYt7W/zpd6EeYqcror7y/D4Ohn+mGiJ2XKxpIhMT1x/GiycNM" +
    "ScVAAAAA== horizontal-scroll:UklGRsoCAABXRUJQVlA4IL4CAABwEACdASpgADYAPtFmqFAoJaOipXv6aQAaCWkAFtSdptwSvR6O5Bk2c2vfDgk3/BhpXgXXYWCXL2wW5kjRf9B1PncyqjZ+pPRapzb/CwU" +
    "Zep6m+jH03VKmgS+QFDDqDhhdwjkGfda+RGM1d/zjHdJIxnxQHMfcnLpfthIr2tP0FZdA01fN9oDQUmq2yAD+/wKCWGETxExvS9A7Ss8goSMftHXKiVypnH5qOphoExVZpdFNhUxeCD9lFKOeYCNHEQKtuuplOfw" +
    "PUMIbrHGqoonJv3TqLlMF+eundT43WzJozNBVSaBSKWTM4inJl0FUdvPXHDLQzJ0uE0v+b+tonOSB2mdxtRDgwgmz9+3HM5wUwFeWoKXRxNaxZpSc4rQg0qdbbhjOzG5neqaLa0Fk+jtcTF3J1hbULWhosJKNmJA" +
    "IR/C6VN4RbR/5eDzRdzpJ7ltgENdb957eyxa38ZwVMXyvhM1lXRk8hu+PEUvAZIkjxCk/M3Jleq/OtVmintB8vMs7aZZ9n6XEoQGw9Xk7vQmOc07u8jmUg7718Y+amMBh7V87xd3jgScHrTcTypsGQd3RXCB8Y2H" +
    "SjC+vqZjckaNNVgsqKJ+weCpI6X1Aq6ZRpksM0ognVOVFsA81fBL3c3LUuCA60OWxzxIfoCEQKrbbGsC6v4KmtNpfvDgxBl6KjjTFYM7/uqn/WKq3XAydoaRVuKnM1759WDTn9CA2gD7EHe0c+WxW7a7pjpawyNl" +
    "LROctzzi/orI4b7P/t4sYcDeV+jdYefE4xJo+IlNO8KC+kR1T4ZPfsRIvAQZ/fM2JDIUOv6mbTPyZhXYrt95cxPGxkivRDPP90rEEvVWTSZfIVvGLrN/oWHkXq1YeG0RCRSrc/qXyDxU7cjuE43RTQQmf1xbPpYl" +
    "2RZ5pnGqHyQeqnhZ7hvNebasx6hgAAAA= scroll-snap:UklGRrIAAABXRUJQVlA4IKYAAABQBwCdASpgADYAPtFoqFCoJiOiorgMAQAaCWkNsAW5sBMGMQgugW4lGFVPAVFhiKUUxhIo2ZMFKIR7ufuJ1BdXzb" +
    "nYAP7zJpRjDo/u1+izHuRpFUvE3W6n39nKhT83tVbxQJwppR6p5lsHj5A8MovClWwkHY/jKoMWXMIMPafgd8qO5/k9U5nWIGW6BAR9vFj47bhBlKYx07/7Gf0nQ6+d256DQAAA section-color-swap:UklGRn" +
    "4AAABXRUJQVlA4IHIAAAAwBgCdASpgADYAPtFoq1KoJaOnoWixABoJaQAACI5jR1dp+9F08B8NhUAEo5RRRnU5mDCfJEBKeZsAAP70G3r245CCBGwKTX9BFNHkG8M/nmVecE/iiIdH9LNTdwHAv0clSynR1FqSBk" +
    "WUHVwEDwAAAAA= scroll-spy:UklGRqgAAABXRUJQVlA4IJwAAADQBgCdASpgADYAPtFaqFAoJKQipXQMAQAaCWkAAAfnxdiCPphpMjNkLXWgrg0mf249XuRWeoWE2CAMHm0/mgAA/vMmqbfHDBKu7EEHJgWPxj" +
    "1aYtfEj+VXQkSprO9mp6DhtyeDTy9J8qEgxU+6mWTUDdFnQspCyd3OGMJp2dy3f23EV9PUmXuAraGsfwq2nS6OpXfKdbZCQFAAAAA= stacking-cards:UklGRjoCAABXRUJQVlA4IC4CAAAQDwCdASpgADYAPt" +
    "FapU2oJSOiLBVbuQAaCWkAEgxd7mMVyIbWsS8KUPgTliyFETEMogFwVix315snTT/ZvQ5/xO+2Rf2093fczfSS/NBZhDPuOBJ2tERunbCR8xhByIQHKxjP/oPu+iMcFo4IrgzvA6FNJxYD+fMDD4SeEIQgsAAA/v" +
    "hNs/WbtlVTUu2PatU3nw6dbtmN6GOyvAkzAG1kkrIKL9Gv1JWiDaKvB0mRC2mliUjZIjyhv+KWeuL7gDM6Zyf6R0bS8Lk5L7pjcRENg8xTJCPR8QRAq2yo+n34YBDUKJh4QdLoGBxykwEd8UrvG8ihGKPbRr26Zd" +
    "0OKtKOyeN7ocvGtiognfpBAs8NwOP7p0IB2CT1SVdZuFERiOgJHBpjdKrDEhougnVohQ3SCc+W691WqBnAzvkCMMh2ppz9WQZ+R9y9wZ3pApUZb1oeeayk8k4pNsr8qLeI6OOMS2ayL8q7Gd3gqIxfr2HM0P79Ni" +
    "JOIUCAiphwumYELgICVAC/q5Ui2S8JX7fE/HrOuj8RDbbSN+aXkJBSAUs5H9FTXYW/ez2VXooWhGuUp2odbb289ZD6BGPu2M3IFlBhcPk5Qo2R7jAWOQhlStT4ASTArwW77ViV1PQjKf6+EaXPifHkDOEFNODiLv" +
    "FHoa8VaQcJjdnGvQRI2CeHh/qma8KKCXjQDi4NwEmbybpsj5k7akkia46wDL8qEJuy4AAw9twYZEsNGCOaWRnAAAA= smooth-scroll:UklGRj4BAABXRUJQVlA4IDIBAACQCgCdASpgADYAPtFip1AoJSMipXg" +
    "LMQAaCWkYnyfWcDiSMN7y6MBkoyrBneIJnjW0N345FT2dtgpUryHOytB93DsSoomrySQzW8dHxGVri+E4lZP0RzuCQLlvyfQA/vMoix53DhY/BGbYU6m7wqaeHLIf59XSGCdJ9RmmqWswMQu5PpNqwih9xoU7xVp" +
    "FzTwLpPWAsvA2NHKsW+AQkHlDh501E+kHzs+8iuNSLnfndoVtKyIhcQTMd9ZIBARNATBemY03SmqwzynamPeBMawhQxcu7abSlDshvgA/jHh2nalrSJYCy3Qv0b+yQ6fuIt83Ws6UceCyE6ynjww15hdCTCbh8gJ" +
    "SxodwebeoH6TdRmoiVQsE98KH1f3Smji+VA9Rx/RSwWbQmV1OdoZj90AAAAA= header-shrink:UklGRkgBAABXRUJQVlA4IDwBAACwCwCdASpgADYAPtFepk8oJSMiLBOYiQAaCWkA1jZVwA6MVudu8wvbLXMQ" +
    "zPXfGb4S5bNLK+s9oATjju8KdU+NtpwC7VLxESj4+p/9Ubji/1klbVUebHCyZbypWJ2BqztcoSOhpwAA/vQ6N4K2ry62xUngzO/p6b+OzLQNCTM15z/wnTXtMmXTPvgBPS4oCPCEbdAkcJTXWIPQIWikqG1F/v2y" +
    "HjT0ITcKckMvCBejN5/GhPsBUQQM8KnJUBola5RXOT9XHeHRIJ1VIEJO399zo54pOpx3ANR1qhaJj7ck+CCnCI52I9IX0XostLDiqC2CF2CVSGhiscPcaINiyJJT+LYagfIgr/wkYjluYzQRXaSL/0/wzkeOTYW+" +
    "BqSSrFLru8ARZLrg9VGV6/QNb9YZBWcnwpjAAMQBAAAA header-hide-on-scroll:UklGRjoBAABXRUJQVlA4IC4BAAAQCwCdASpgADYAPtFgpFCoJSOiqVJKWQAaCWkAAAer7ayeUE+TE/U8tV5eu1uuP6Xau" +
    "dVvkCqnXGTV+7l4nfTHSV/zGQYIDu4+Go55o9lUKW+E7dVD2MU9Q4DeyUq9pAwAAP7xppo3aIP2nkVesRD1szHa8gXzV1YKsiDVt2mu/gniVUc4t2ikxyAKT+9fxNpmLS0KgsyC1toPg5GywZ+6k+Evt7ikMLunw" +
    "FLK2388NqLUCEuPyXOytp8TTxfQpMgxiNoIYOIIjtFRSLb2G/YKFS+FTkwlAFVHLKqhxpxNYnEDXUUemFOgjvNEfzGMjqeDINSECgVTHj8qJvSpU7gAz7Zr4970WztODHJvZLU+Er2yqk+mpsukTQDGRFrXKK1Dw" +
    "TNU8SGnZFsqczAAAA== header-invert:UklGRswAAABXRUJQVlA4IMAAAACQCACdASpgADYAPtFYqU8oJKQiIrgNEQAaCWkA05wC34D674u66Mw+SlAXrm3QxUJ5ZYihQ8iU3F4O33V8mX+iqgaBOios7LG56y" +
    "J2AAD+8IwFRYiiv67RiV08b31TnKK44tpAhA6MiZxYAQS0MSHJmw5R1+X+f/a/iBHHQr6KF2heZyvx3pSFStZWaIrHqfT/3aywwRt+P1gUeWufyVM7qmDmQtegeV/7dNetMdv7VMSioHxvW+Wgsr/H59AAAAA= f" +
    "ooter-reveal:UklGRhABAABXRUJQVlA4IAQBAAAQBwCdASpgADYAPtFeqE+oJKOiKrQIgQAaCWMALvgFsHVGe/Kq9Gl8+QIOGoIClFz0rMKW6RA+cq3nnqIjN9rnAAD+9IY8cvmWrNuVH/2gdbXs3zR8kPsvxP8" +
    "DFFrhHlsMsmEqTF3neuLzohyfsTmeq4qwan5yP4qs7TG4XylmGPSKnISrRy2h3usr8PjcPGrKRn2QgU8nusv3Se0lsSb3RCJ6GbKEvuZ6pD1km+qWHbqE4Gz/8zbsZFVm4cPR2yjPL646dzTNNjfPuOTOehGyLp9" +
    "FLdGYMhn1aOwmSzFM1O2Rx9cKUPxO1aqC9LNUd7T0RoGovtwDZqGUOfS8/EKOAAAAAA== scroll-marquee:UklGRrgBAABXRUJQVlA4IKwBAAAwCQCdASpgADYAPtFgp06oJaOiKAnJABoJZwDVRAgdpgebwJL" +
    "682IkxftrsbRRglwnKg8m5dcieY1XLu5X0G7C1dTXQeLEvTSIZufEHW+mtZJAAP74b/WEGAKZDSjpdfh8X7hs97fWlm9MpUtY+SiTTQskGK4IHyjMAblbccpv7fJOMgJJMKRDAGHkupb7yJL1MPPc16mE10Z/FxU" +
    "V58c6XbKz0bHHgQzimjlrMYltMlbpfmXrSIVOS+9DcAfmASt5gKzvEQgiPb07jAJjQgPtoMUyEbr7rd0fnBwaejW2FDdxSNvhQtYl56DlXFsUwJhmQINVkH2Xyxs9MB+2+MTTMWrysfYOLLq+jhfGwxMxSEEAdEB" +
    "lCnfYgeddESIaURHIm5UYcQi3IS7wfzW0jVq2G6MHt9fqok5zODe6nCEfrxiY8iPkfGu62yxh1t7X9Btpz6VVYefjKQD3yLrqPcCwsKij/JBQwZQn835Rp56YaHoXGIuaPK7mPly7+SjvSPk5ElO4l1rPG+noZyf" +
    "e1VRSPj8qZr+TOUJic8/mRym403PFLJMnQPjAAAAAAA== progressive-blur:UklGRnABAABXRUJQVlA4IGQBAADwCgCdASpgADYAPtFirE8oJaSiJrzJsQAaCWkAFEAwVYwK1OWhpAmhggIAF1kfQRmNHQU+7" +
    "v9j5yEyX+f1VDMOMC7H5TrNh5B3sUdoPXH9UsYXX8LCa4+ZRD03edy+jQAA/vVnmC3ckO+nIkpTG0e7lBdKIFlmxq4+596Y99VXc6ehVZGcqoVO00G5bv0NnLVRen4CpyPmqMzk4qvO0fI8BCNFusYRAab0ElAat" +
    "NKAsCir++i3uVKXODuQA34TbWi30xrPjn2Dcr2g7pzGwl6fGwJje2+AfPqMe/4gQCZzQoMBcvGMHPPe2cBnCDYAEsXT1Nky7Ck+kve4FE2pn/JBMiRS7WbA7gm5x8vwxpIuA/CCQxTwgPr0eJRXc90uLBsRlClYg" +
    "enEmR2qc/UYtR/W5NhZKUVqX7XsLFzM4CPinkSAhSuOZUjovpM4vgs4esn9O+yxem2a965Ax4M9gPAcAAAAAA== rubber-band:UklGRqYAAABXRUJQVlA4IJoAAAAQCACdASpgADYAPtFap02oJSOiKrgKgQAa" +
    "CWkAACn27R0cman7RcVMYYvPC7tUdN35JfnrQAycGipV1RpWiSs7WMqEtUjLUKscAP7xCeX9yknknHDSQY+fb8D8lINBkXgnOoUyZH5uvYQ7aW8L3qLqUBQ/XclbK9aMqUjQw3z2xpQi/o1JaCwVaOVss4+VAhIf" +
    "6cEA6A2AAAAA split-text-reveal:UklGRngBAABXRUJQVlA4IGwBAACwBwCdASpgADYAPtFkrE8oJiSiKrYIgQAaCWkACwAlm3jvY6vgJBHVaMAnU+bk+g0gbhJ/gLFlhC4s3ohmdIzCT58wjBBAAP708goK4" +
    "54HG7gxI9XOd96Is62cEZgxmIZ/Uq1Y7fSx2Aqf0eJ6RzcXb3pUCAf3OD7GboTnNNBDRdON40blCL67olWtd2XPfqQ4lpQNxb2p86HoF3/AAe9oZSdFms6nh28LsCvsJfl5X8FonESR838ZWIbwmQfYRyoapN9KL" +
    "oXDkypE4+8+D5uFZWRGttMEWBHyS7aK3mNceqPqctBSkWbkO6oT9/j+i+DeXnq26cO3qMpv5c0Be4Yue00zl9DKbhc+6GN8ZU2INSWz/Ht28bwp1EucIys3t9KqccgnvVIbb9i6kkypYh7LaiMi2w/tZbVwaNM09" +
    "Cdu/2tLowSyvNUwKSDb8ce1ZngdStcP6/Z4n4b1hFQQRPStFDUc/n9+ujygAAAA block-reveal:UklGRqYBAABXRUJQVlA4IJoBAADQCgCdASpgADYAPtFeqk6oJSQiKrgJAQAaCWkAE8w5xtwBkF/zjurSwPy" +
    "T+gHWef0Hjc+nvYC/Vzq5FrYZgeO541pGWPRUZSp/jy8NY6Fwd98vEbO0Q4QNLdoA8WIcYAD+9eDD5+EYAry/BxYxiMLW/7VP8Y9GdAOZfT1PqEg+Q597kOmkzVtXEu5+MC7JrCC+4a/n/VHK49P8LEvUs7CGq3b" +
    "1H6b35Rp40Mt/px38XJnP5TvljlwSklXwOccxj6/CbvuaxzDaizLNtR3Z0YISRxV99rd07OE/FItH5ZGVpfYBKMnVknYLlz1kmt3V30QTY8pFP7kApZw91Vu6dnCfikny+CGM21ERRdHL7baP93QxHs+YGziMGAt" +
    "vEHSOzP0GfX2Vhm4hS9wcR9mIEcmQRlJC+k8dhWVmfPqmblq/sMemgonHiL86X5lYxTwFhqUjR7CdbFDfgsUqTU5eccrABKqhdG8jeQLXdIfRuOjyd17NneGO2vIdmUnyKiHIL17645zfjZGRNdXyf321pmJtxAA" +
    "C1gAAAAAAAA== typewriter:UklGRiABAABXRUJQVlA4IBQBAADwBgCdASpgADYAPtFkq0+oJaQiKVkoAQAaCWkADnB2AygYbVl8YbqZHpis67KQNQMEgPQeL7sbREKbjrrQQ7IQAP7yXgTvKxm0b/pb5WJGHXC" +
    "U9uTf9OKWt5J9VWTbFas/V3LjpttrRW9s3l4vHbaerz82UcODnHWcfmY6dVDIFepIRxgHYjAxVza5p1Oy4UundwDYs/efJ5Fdc/Jq5EzPSiYif8Zer1HZ0jt26QSY9Xk6Z78y9BnlZsnXzUdqXBVwRRGrVIZfjvn" +
    "J1i+REqfhor3txdRArdrDdTcsC8XdRR2QGQMPZskVd/bcWYSN3g1Fk/irEyTSym8icMvhamTd4EjoJpXNPp0cDfj/82zsAAAAAAA= counter:UklGRlgBAABXRUJQVlA4IEwBAABwCACdASpgADYAPtFmrFAoJa" +
    "QipXQKAQAaCWkADOvDQVLPxxagn6r9WYjpCLUye51sSsa95ztSjCpIz4f/K+0AOGmq3lqTeTqFMWEAAP708goA9NtgmnurehRbO9To7U7lO7++/jxWfpz1WV4o9EkOrBq6BrNIJPxxN5mfpLgKpsSOyaKiK4lMM4" +
    "Tr3Z0wItNgxQ06WVV58lRflmvvXinqZgogxRsntonHHoSa4kxJZJGEsKSiP3RrKW4wtKsjcaJAF4+LH50u/xTXj77UF49u76QAhSLgw9cNnvb+i1VJc4JfEYxhYM4elGRyrdeO9HzdsaBx94BqS4tCdXGzcmnyPG" +
    "G3GdQF+g+fLy1+8Tk//Kyk53+7s4a1nBi3hqu5D7tCgP6T7DQT/LCzNl1uETlCIybS662SjX8SIS959A+e1XA2OsM1RlFwAAAAAA== marquee:UklGRjIBAABXRUJQVlA4ICYBAADQBwCdASpgADYAPtFep08oJ" +
    "SMiKVtoeQAaCWkADnBbg3wNIEyoM+7u3qeFCAA0l8j/rsxw6kGS4PgiqcpBwEWpcgg8u7usAAD+89gIZMK+xl5nel0SHAUNcCk7hxAw8TwBu/UnbpTYkRrPyVbiAfep+6zr9DbJ8PLVN3TNdn3/K1HN9i3ILuvj/" +
    "CdZCQkghN4BCVL/AZ3rGo5Q/3Kg9ouVfvFXCVUxyHnU+gnpsSvwq7sUs8o33yGME2X+YzMBhwIYxfI7KaGo7UPbNqN9mVGihPh7llab9DWVskM5R7YRGjnt7ZQu8BJQPXfXHW5BKVEwEmp6hgh5g5XWzGiszJ09z" +
    "/MlRWcgHbiR+xIt6Dq1hb4DA88Zyxb+2iH3IlbvQjyobAAAAAA= blur-reveal:UklGRlIBAABXRUJQVlA4IEYBAADwBwCdASpgADYAPtForFGoJiQioqkZABoJaQALAEcDJJzbTx9lwn+gAqGu+7OI/WgD4TAl" +
    "xaYUa1GUYOQPNAlTr5zg88cJ6eAA/vTyCibShAOp4YCdu6O+HwDwBEicy2m3iThhn4KGzwjXWTsNfzuv/sxGTRmOEw7rT+pFcKH/1f3yKYBLNmq/2BfTOOkKv5tu7dDGL+GoGuXnsWFYV25LZbPH9WPld0j5s2ik" +
    "eP4GvDsb1cJM+mMfY6xAMzpVx7KDXR827FOlZgexDZTFF+f38BifWjKq44cJ7banM9polMWzyNSvc2n2dT4NPxwoltD2spCHOvaF4X2MluP/X2XrLGRQXKtEOW6uYcvt6NM7DskgoaqdIRtaGiE/8dFi0hrezMDf" +
    "PBheVVvWxkTedAB3Mmv3w1PimP9GrjjjApcX8vVvTaAAAA== wave-text:UklGRnYBAABXRUJQVlA4IGoBAABQCQCdASpgADYAPtFirE6oJaSiKBqpyQAaCWkAFtqqm4oKcGuxFgeB30Cc1T0MSMTAQHSI7eTtI" +
    "xwsc2/q40jAkSP6V8r4zMhpIojVg1CVddaSAAD+9PIKJdgYTIEYPet0r8zh/8So4w0bqxekc1wnDuNuiQ5KW1UWgWWfg5/CMjR+wYYzXuGaCi357uVmqI6eNFSvc0BrNikgcw+F9okBaUIFHV45ArhuhXuUi549s" +
    "yg3Np+/cvs3n5aKsIG9gdPXTdyy382in/laELnfuRyUIvGHlxap79czr239zLezPOk9SKhfvhP0n516+S7ocLtdMVLXNwWf6/DPrMXwKxW8QPwc78iBer5SKEd0v5pHY2nUT3v+Hh786++XksaE7J0vxetvOs9Fx" +
    "XYqbjyRDUgmxsMGn6R3Fia+2QBZPiLNyxEjOcLdEADcKbYqNG9ajEztWkPl16oO/cs1kCLIUskQBC18cd+AAAAAAA== word-rotate:UklGRh4BAABXRUJQVlA4IBIBAACQBgCdASpgADYAPtForlCoJiSipXv4" +
    "aQAaCWkADOYKwNmdfkPQlGH1ATxaqhvtMyANoUAVlZXOMMkMvGzQAP70FmZD/reZosNKjS3bVLq6SntHG+c9NlgFxGssz93zVdARDQvQDHF8dT8e2WGU8lB5LP+8SRGNKWmzlSOV9ZzeqNO8/mGNv1auQ5+QkHrH" +
    "3vREaOFHyR4y3BxwQI95y1W+P6D7u9onVtei3ZoiivL0W8eWwyk+duu3PAroK5nTfF3rKd+38NvdfVjScGFnI6JnU1Z6T5dUKlWsZlPjQMbFwgXSY3Vnir18NFmJ8pg2xlD6SBMU8Bf+fTf3nzSzR3WyLV8vrlau" +
    "UADpWSRYYAAAAAAA outline-fill:UklGRuIBAABXRUJQVlA4INYBAADQCgCdASpgADYAPtFop08oJqMiKrQIgQAaCUAK4D8BtgLsl9AD9AOtMcCGaDwAqeulpEmOCQSBmD9126UigfU1IuVSfk5ljhHb1vYojf" +
    "F7pMJ1SY48atNJJwF+1fMGcAD++loASypaBvgJh3w/wWXKPXHMIQIYm+MxfuOjcNqYIeFZjJkX90yHFVGtdQo/Lh51WVIS4DZ65+P3fKdvympru8jWnbCGyjWHGrI+mv0lHjORjc3Rk3LZL/IDz4cLY5LcwUCJI9" +
    "uXLr+edhmWT0Ag3aj/xsvIE7iLDYfkVU0sbai1SxqHxopnr6bOGlcDu64JSWEC1F2+P5m3qEIRyaVg0nTxBJKarL9PUF8teS/GMXpKDwHkMYFiGEMCPycdVLE9fMJu8B9dQgQM+hIhTiHqFAWrE7NnQ0B19v/WLV" +
    "1vAZF7nfzIfsF7GfB98N6t3Jduh4VkSvcL1bLwemZ7W3vvI2d6Dyupftq3utBX2+QlLI17l4dj+6BxyvdvUxs63192tQeU1g9ZMRRrzbJ2hx6YsnhiLzoime+uTGUyRrUobQpRNi1ARudwBWSfzDHQrjuuSmnx1X" +
    "JeiM92xKtBo7asvmHU/iVo9MeumfjmIAff1ixUAQAAAA== gradient-shine:UklGRiwBAABXRUJQVlA4ICABAAAQBwCdASpgADYAPtFeqU4oJSQiLBqoAQAaCWcABRAe5BbTMHQLk05ZJHy51GWFJ/KM4ULMm1" +
    "0EEkl8WHyBxtahAAD+8mPfPDfS+m1HCytmVZ526lzghEcnBTXZBXIkeuG7GNvTAMkBFulWQ/gX1u3RYTT/QHdevFWTQ6mphZlnNRqOtBcLl7suceBC9RqSgruaHPQUXahv4eDJ/O1WxOSK0dvE/aCfQtSvCnJt6a" +
    "J1B5AF+r6IR9ETk5SrQmasBfscR3WOgodapaD7FR8osaqt/A1dm/wZAurt9WTfv9LY0cQ1OuvGYN9x7fDYjOCGAVDT8nasUd6EVwQDxmaBfxBj8fZEIGejhbEGqopmA/AOw6lCtzu8FNW2dOr0qAAAAAA= numbe" +
    "r-roll:UklGRmQBAABXRUJQVlA4IFgBAABwCQCdASpgADYAPtFgq1AoJSQiqrIIgQAaCWkADnBbg6wH2o883OQ9Keil1YCoz35gFJVhWb8MqXnvjkUCN4vYH4wJ2iMIUKMl1q/uiplblI2rZAAA/vVWq0ir6rFq6" +
    "YFnUtMVx7vCOvONw5+T0PPh18WqbGI5dCXZ/95Bz7Wsgaop+EoOUNi5fKL5TaaKhKusSXmE2zPZQFHGUQtmmphbtE/sFi3GOs+8gNi79FVsh2IyWHOq+gCat07u+pbAwtHs035p/8lREkwh5YYdT5nvOTSWVeE4V" +
    "c9OdBQ1XVbqd5Zu/EJ5//1Fz/ljUhhnSc73zcJ71zTg0x7wv6/EnAM6Ntg/dznYkhH5fW/LGQ3XZqzTAyxE0c890/u8nLoySrn1cZyjuQKMZYphWUbJHAzAOpT8KV4JMN0n4tEPh0O7IIYcc+MlZeQNya4E4ouZ8" +
    "UyY8JnE2AAAAA== split-flap:UklGRowBAABXRUJQVlA4IIABAADQCACdASpgADYAPtFoq0+oJqQiJBVbCQAaCWkAEVJi6zQCNlIbfAswM8iwkPXBxFgMgQjP1VE1IeeD+49cgJcq0FSe39rP7DajhxRM76qQA" +
    "P71VqdJt0cS5gSuEQxTm/vP6CL5xAvOsa3ihLS3nAf1RfbOGMl4Op1Wfev95cW2R+zbV49etvQ7vvvMX9mmF0TDH4uuKWf1Gis3GSuFCQt2XXez1Ci2XV8al4Ph2LH4U31S80+c/jNBP6sB6LntJKvt62DFCgVvM" +
    "GHdOtruG0bfJXg4kZDp/xelu5Bl1gGZTVoABPkBs/vd/6uX7wAO7Jc43bhT2V87oZvWd+X2QqcZFXZ9CEC2vIZvU+YZ+YJMwXZad3ikQzR2soUAC5fIlYpq+CTitd3rjFu1SIHuhbX8oNCxx4p7aCelISuu+nmQi" +
    "I7983BvI6n36fWRRBaJJ9EDqlgSbDaQX4t+2tmpuCxgMpOFhZ8kguiQibPlo9FJZZKmECelLC/DDAT3JQAAAAA= tracking-in:UklGRmgBAABXRUJQVlA4IFwBAADQBwCdASpgADYAPtForFGoJiQiorgJGQAa" +
    "CWkADoQ3AW+t6f9gARg7c4q69PA3Xd5fGNPZlPmz1I8W3eVaxLt9kbphO9PCAAD+9PIKKDrKnSm3/DmVJJ8L+ERepeD1fr3vmURJq2E6waRr5GQRuBs75AmiNVjFeLfQMAtlzlIGjZj/onjhGP4iIl0hg/3Q0emM" +
    "fv0B/U08bOQm1jz+jys/ToTXk2TYfn/ekpobK5mtQxFZggZfAGcB9aUBl9yUqjpmtyRCbrDV4C/fHdr7gmNXcuL2HTrulH5EbRdh0BOULyqJuWnzSL691RgIq8K/rrchWu8e20fLNvgB7J3It7u9lHt5q0Kyi/m0" +
    "zum+EPCevXTv1gwH/ASNjJHVnOoRatLIn73l9Gu/PMW1sXfyIfimW5+jCv9JH9OuOcrCPgBfT07yZxCW1A+GcQQxL36hFSNAn42VevqBWjQAAAA= text-flip:UklGRjQBAABXRUJQVlA4ICgBAACQBwCdASpgA" +
    "DYAPtFirk8oJaSiKrYIgQAaCWkAFtikznkPeulRnvzAO+kAsjVtzjQg3mGveQWGGBDns6B7BaDwnJiDbIAA/vQWZqPxOeLDbgzd72iKlNIpD2LefP+z3k7uXHyzwAWxQUqSTimT+Oww3D8bB5UB4zEQvltABEHLS" +
    "m0BqofoiEF9UqXueEbpUmDz2mEdJd9uuEC4mLrW/1Cgel4QgP2In3mnmu9eEFlc3okOc50etMh/8oypdZNMwwIM9Xd70hFcMH8EzNI3pSnwjTyaUcrPCNmLPvprfYFVoqFrExFn7p4Vmvz9nuObt2JXjWcnuhBbu" +
    "0Sgmugmg4n8QUpznmEyvNNif7T1+VQfdDplxCs9TGJ/GlH3PL5+RWAcJRrAAAAAAA== color-wave:UklGRmIBAABXRUJQVlA4IFYBAABQBwCdASpgADYAPtFgrE8oJaSiKVbY8QAaCWkADOdd182j8ab4AoZ78" +
    "v/IVOWYZFlm9P97ba45Z0lvwDp0+a7dVXSAAP708goFP22HobPWC3PsFE2iNnfV5UZR7tHjBE7PTjomNv9rQ1d9fJ3k6P2561Ehxe7Fuw4cMXK79d4AKZh7qGWxZelgGO5Oh+xYaxEc/MKdQAn1Uotv5p8D04kkm" +
    "b9sQFxxgPoqRyN3y5aPG1N1MsSKap47+ifU6s+A11jzqiMVPyp5Bl31+arYO7AELzrXmL/iWB+c7DH7tNM4YVFO/vu/nNffCz+0L6pypj2ZgoqUsz10XTrrwOSuUdVOXc/9qv8P+FR7kWUF5zXJF3UfBV4yzX3Mt" +
    "/12ye6xjXdQnd3ESfc+SHJt64TCBVzfEv3inaZBvfzGPKPxo85HvH7FVtRR3003+8UrjgQ9j12AAAAAAAA= marker-line:UklGRnIBAABXRUJQVlA4IGYBAADQCACdASpgADYAPtFgpk8oJaMiKVkp4QAaCWkA" +
    "E9Kd+h0CVBDOfGbqBjOVaLAf7+9K4xboycEPMTaAop4bQd4lz6C8so66scFf7M7jLrrAAP7zYg/xKUC+pip0tM0xdoTHq3m33ZaA/5x954GoxhOQJFbXqC4Ei8/VEDPKSeY5iH+izwToGJCV0VK2zj2Z+MTbtHiD" +
    "WggR/+sGkF3fqpoe6NmsgAz3sCIJJViD/bCH83aeCsMu1LuThkPiDG4429Lo0hi1cSICfqwBvi28vZbzKvCYjxLOoZ24HzBvofGsU11cIMyOtc+M5yAdbJckJ5Nh0IECtjJ/ciS8HGbzZS8ZmyZSnjPwDglwQAl1" +
    "9fg+Dx+YPHFGjy7TedWdBxKtkfc4GBJswRXekerKnoNH2Nt5yg6TnKuO5v+ZrFNxA08Bjlf4PzSPeVDevmKaLkwjx7FtSgERAKPd4JVQU/62Ek26mteDAAAA rotating-badge:UklGRlwBAABXRUJQVlA4IFAB" +
    "AAAQCQCdASpgADYAPtFgqk4oJaQiKVkp4QAaCWkACwBHArgJUD2wNqZlE3QB3bAnM1gus7i7dMjjw5yHk8dk48ssWnNaRx29fcXLymkrxyQIIAAA/vS4QQKLHvnyr13RSS33Rfe7ZK2fhRxEI+0SZvUkdqoLleeb" +
    "Y85414n+1W3IkGinz99KH78gOUH1NfjxxOnks2gZ653VQO3BstahmsT9npZe2RaY9Cee4aajRUvSSoeH3oYGqTHIaX4mcM0jL+XzwKXKCCZBCiOMluT87UW1V0DkAgbtHXH6bRLOU1C1I8L0CQYMz7I1immvKpEA" +
    "rTEdwod1ir0h/CjGZ46Fc+hoPS0Bjw6vdrj54J/cIz6rpmZn5WAYvirTmTuCXIexxKrTWmpWlyJc/Wg2uqrAoLcuFibUZNCZwPEVkoiLlZ8CywKqpB1/7Vdht3S81/AAAAA= opening-crawl:UklGRkwBAABXR" +
    "UJQVlA4IEABAADQBwCdASpgADYAPtFoqk+oJqiiJXv6aRAaCWcACBA4gXBPN29peNSEmJveBYZpMSpqV//i/BWw33rkGcNfn0BWKabQjcgcAAD+9SMvjXDqvGLVhx8lU/NmgH9Rcc5Z8I5NXk8OnpNjeBvWxmggd" +
    "LFBY0ZigOj0f7gjR0Y1XRs6pdkZfgnnYZ9Wrd2V0MzQAAiAIHMpoTylgn96Cnixa4JEo0YDERxMa434wNlE3kiJ7dOpOKvIaKJa4yF7+uzSb9sveCkEwZYASWPIXnKemiYtJxEMXwUM9TWvvKJejcL8chdMmSROj" +
    "dnzH/sJXY5HzfXaCBwny9mz6yvM8zCpDcC/Z5ZIZ0YwbfTjNDEPsNnGJRARBDYZLXHbBNqDvcEnv2SD4Eo9AJAYRVTrVCjAllCjClTaGyRIgtWfER3yJQAAAA== sliced-text:UklGRrABAABXRUJQVlA4IKQB" +
    "AADwCACdASpgADYAPtFirE8oJaSiKVbY8QAaCWkADO2jQTlv7QkXaYNrqYAyRst+415nJ+VD0syF+PMkZwnfmBhVtFUVJ5JKRMhBf0115UDzgAD+9PIKF2ghMmeXkrWyvF8gEOyElskrHwU/Kt2we2yGyAgCZZTj" +
    "5WA2M+dwL5svoXJw9IZezWvQp7o4GziC8wVstxbte5e0hYIGDAX0WbIdviDd8F03lNbYHc9P17nOWvTnwP6aYwv/BIaiMfTOOMzFydgj4qqvTWhCMlZsfq3NsODZ4xaVDEf12DwJvruNVUeU/1TevkB/f8g/ez96" +
    "RKciTx5R6aGP9fb6aWH6IVYrXy/gJZMdzB/zU51m9O/Rt6NuzwUwDXPASpAltxwYfuXfnGgVgDFbBsHJqgZIkJ9q7M6/fQzasd/YHKWmQbL4XFV8VqINsJHiz83Q3yDuOsNlEmNgq7rzUe3ix9bphwD7aiioVxXE" +
    "xnZjkKYiVtpU57qEPJAalX/FCsQogbgvpxKkG7XeS4eo+/buzdMblpOdf4+UR3BAdLbffhkd3g6TuAAAAAA= weight-morph:UklGRooBAABXRUJQVlA4IH4BAADQCACdASpgADYAPtFirFAoJaSiprzI2QAaCW" +
    "kACwBHAyQHa3arNxgHIiSJKjnTDeWXw8RKDQV1BNBTeUIi1WFu9tmiXrhPpWe83oe60qIAAP708gdK48EV51Z7f0vCIqR8y9AQvod5pYjxfgDN/Ly3JvpTz5FahAYfOujtz40JG/6uyZPGvdsJ6vbfdNxW4OXyLh" +
    "ma5WqmhHI6iKKA5Ka8YHqi1YOVNVeCsj8Wv8WCmS1UmVURW/2555di/KfrNvbOM5JxJTI39xDyt52nqKaHqo/Ycx6fww08JwNtVlwUaLyJ25SIWISeZ+b5+zwRB64cvpwn3Y7dI9EsNvU1MLVl4oj6+IyUsYwxXx" +
    "Pxlk43GfG8bFK8GUgA0breS7aXoffveG53lo3yHHd2oe/OxpbpkVzsrgU/EfDvCI9feJfEMdenLK2NZm9ebBxW3Wg3DQFzrw3Jl7EPO2eD1Q6ZefGR+6cEq8GS4IucmdXCOI1uvMV5DA7WYB+sVYAAAAAA curta" +
    "in-wipe:UklGRmIDAABXRUJQVlA4IFYDAACQEQCdASpgADYAPtFeqE+oJKOiJrM7yQAaCWkAEhDYVVNNAu9P4Yf4ut6asTmruhqzTL0deVebkado2bnz/L5iDU68UKSm+BOmUG+R4gDMfSPgc3VljGXIXBNTgpXk" +
    "pI+hNdeFiJvfsctW4nkRISFXt9X6r0xGfuirrQkm5iV5UIJG622MvG5PiCX7HvyDNfPQZeuEAAD+7tQ+IYG97AKX5ysiwKmR646eQ8M32qNRpOjnSyF17S8yuBycfTQxUcCKtRggVKCRoMPBgMmRVcuMKkGRL8X5" +
    "A/FH+MxnpiXcsxPqSrmxs4vv9es9wUyT/Rz9bofwZZfs5+vRK/6b68f9hcp3wHXiJu5rh79yKmVlHuJZ5N8X2sM9VAadu+LIScuxwmjVP5KCFAqZeO8QM+2iWrJwoE9uHSR+hu8fswYbNhrCzlOlgZSa6ciOUhfh" +
    "yGk8Gf5hSK8vq1BS78T6FB/86dnzZz1OvVrQMHqaOWD73ofS3gj/RwC8fcuD/ENeP/+2spQf45dSst1qPKG3YWFugff+dx+/GjTRpibz/0FioNLDQ6utEO6EDJNC+K/+6PeRXgv/3gK9YEW7MYRVfuSLH/TzuleG" +
    "aY9Yev4WqMYYjBoB0zxkKtJOR5JpYON+OtB8C5GRK0v8O5dPO0/8ug2n6xjZ31uLruoROsvyil30RnBIxmVr2gqVEy3VXBN9HDHRzUU8hQFYVzx+GfUTqd/qWMI0Rm9fIp19QlrCl4INpK0vA67VDCcbU8XxRQ7a" +
    "DVeWcoflIDHEFJUA39dAn3YspgnqL/JjeR3e47qMUBeH6uFd6y4v8vjUJWEgBgd7n0Gox69tmVOkNBBkiW50oz+pVBGvubpkzxuGri11273qW6YJzv0XhXoN5fqs8/JLRRTrDuIDQSsq8G/3IgzKxcX0fZiy+r9z" +
    "qnIYAi7PQDgsgF2NyWpXXKyR/2IxP8hrGDRsS9wZ+pt/9bQj8PiPbDt+/Sd3HO73np7WZzHsi1owPsTnCYnHkV6Fs/PNf/3K2lwQ47zr0aGTG0IZlbrDPzodRStEsUQgTPVFEnGngMYomRmTErv2tg4eqIG4eDe/" +
    "YcmYQ4iy+XV2AAflAo3zbYZxqt2MMVnrX75yE4s2ZzKwAzL5XkwAAA== crossfade:UklGRkoCAABXRUJQVlA4ID4CAADwDQCdASpgADYAPtFcp08oJKMiJXgNMQAaCWkACwTHzbiBYb3wfv5kLnbh7QetKw98M" +
    "PcC34LbqYwwBsBsx2MiwiVI/sKbL8kgXPqQnWF9bKQcqM32S6yR1fRMpN8jqQ26+WZVXejmXwgPo4AD7za35i3xaOh6OAAA/vO8HR5osc4ZDdzhjC4rh3gjklX9W3MuB6oCm8Fyy/r3Tf+0ckppeRrIq/pqnkP2T" +
    "b0xwcsroePvigN0r3iq0FLS0IZL/paHkc3uzJiY6fwtU97pafhyV5e9hgbz3lyW/SQ4pC4iEefS2ZEaGH3ZBNFYR1SDItus7Crzb/UwPDhCdHuBJHLWYxlxJ6W2soWkXOK+2ig8BRaGBqvFpBqPwMyMN7EENfdZu" +
    "z5gHtxrLuGLgTsfi8PqeNfXWZoA66ZJo9tJLS/Y1zgUIP9xknynPRrKZDNoEvl0u03IShupZugFUjndAoYDC/9GlhDPrtkLN33btJ2sbNGS5rVwInO8H+GouLhrtvBJoMT1qAHHWcw69pLVFk2nePK1Z6KS/BUIJ" +
    "LUjJ5u+UV3W6UIbSM924xgJMaCCipR3wz7jp/WpLpjYj4FKznXv+R+WOGTuAAcOhGfnPytRyFwvMBoe8LdPA9dufQyaoLudzU9UKbvXM5yRM5KtnVKAoxF/P0A3Lt+rg6OLvsMn/C2gZgQ+0oF6POb5KBo/e6D6/" +
    "BDub/dMg21VSqtnAaDF6AyLZfXoh1SyHXDnJNdmGOu6Fo08fRYA7tVIynAA cover-transition:UklGRpIDAABXRUJQVlA4IIYDAABQFQCdASpgADYAPtFkp08oJaMiJXgMYQAaCWkAFIfg9x1V1t3im3fsbFm" +
    "eZ7+e9ApXu9X15WoG7mTsUJXwSeZ+od7hVLhysPMkC8Gh8/OG2ORKbdk676CpCgzwKZ1+F5Mz6G7pkZzzk6o5dmaoqvNsptcwuQs6Cry5DnaBoEmGouyz19Y+p/QQFMHeWyjCERtF1a/3nNvqEMG72h/m4jCaDZc" +
    "evXCXz6MPs6I3N/0QCd1AAAD+8dVWNBFpO1juAIlDqL3FxOOrLXgycShA10PIqMCF7rRPCj0NnN9rKgOd+jKsU+D21zJ4R+tnaG+pw/hDcqPOK6ScBXgMeZUzd/OS2XY5Hw1pAIL+u0xVLKJp0AABqV40aFM6C8o" +
    "GumPC+hn+4MqbOXUAjcj0bm15zDBD714uxIvXeYBgz5vSmQZ8FWkJuSkgZImdJfT8iDchZHcC1KcuR81WdOu4VNi0waS6RuY+VlwAtjekxostLcFi1YI86MRfpN/4w/N/ECRPcdrRmhBeFwXslC43iHuz+bLXx/Y" +
    "LLAVCXCIeNf4IpHB4n2zhKZruiQRPBb3VMglhkGDg42qEO/ZIi2je5WTetmPa2+EaFwM33thm8HB5QK0gJYBf0nlPRKCRAKVNLcj21zNeKv1bUoMcHTihSYfz5cfEMnxceBtDD70KdI2fIHRDcY1VxKS+Cqge8sa" +
    "9HzccxOCTNM5PDCtZv8GnZ4Cj2w/4HyZxDasXLwiyYi9ovErWcQB18cNioOBeAiPD3ibsEJyzlVkU4amNhuDXhtFEqBrmo/DTLhYtoQI2vz7akDKtiRfIEC10a9G2qT8+U95YXfcmeE5ZMsfkxqEI0SMQkjp8CBi" +
    "S9NKN8NsYJ7wW85URPn829MSNg673BjU8bC1C5d7Zf+Ax/rxc0NsmQQC5r1RmLiYE+RF11gBxyOctWuGQKQTo35KZwmh2r7OpPR7w93XjrAXRFosu6ea5/E3En6DDzlJ6ld6bh0uLwX1bZjWzBqYLOSFz4i8qoPp" +
    "AqbXkXLdD2s096521PrxMeCT5U8NyuelpSVQdC1CmCXe2TsVLZNSvjoEME+SMLPX830SEl3nWMRKHrhKK3MK6shtHjh2JTfUC0XRcRIshvKnPPr9DXJPFUcsD04ApocKxM1kgxhjjnPscHcH+n61I/blYr2rA996" +
    "jBdz7BXERUvqIoJOmiwdS7wAAAA== gradient-wipe:UklGRtIDAABXRUJQVlA4IMYDAAAQFACdASpgADYAPtFiplCoJSMipXgLMQAaCWkAE+vVxzrnf7L/B5cptX0NU8tV7WSpp6MQbD8h2xWFQsY57BYudF8m" +
    "VVZGujnjKaVEOt3iYRrSU5Ye4aV2fCO/rEl1+pjDlnR6fk4N38Tl/+fAvk6hkw+poClDZ4nCzAGC732qYPSvBz90VAPhrMUoZbwPwBo/O3x8CD/DckRwJmB9RMq9PMPZhrfBJMLAAP7LzdYMet3tJQguyjKlk3xV" +
    "NGt5y7e+ADGoV/eqhVVKw+8+bGtMpqDnw3yF1Ry56NOrhWficLBVkPWeGvThA1ufge2AUkglreBD/A/c9NRPy5fX9+XLsvV0nTtD8RHiag7NKGG7BiIC9lSSzz3syH85dbltESSorfFHE/5DOZ2UG7h0PWcftd8h" +
    "g5Jh3wSpN6HVaQ9yD7/RO5TGjAZlDNDPaFSzxavm4QZ2FrZTQwstnrZKRp3jydFRqaNrENX66N2lq6/szVWOeEALE4gOO23H98toZ96UWAngMcmW7TLIvVZaueGSsdfxoKU1MHDj7olwJcEdB1u+aGwLl2oWxXM2" +
    "404XAMoqr0p0Z5oBzxoAIN3QK1jQPj9VLVth7WAmghxFaNLGYNBB/bQEsCHb2yHJs/EpKsQH/ls+BSwSmWue/smxXdG2USEVF3ZMn27neB3ng+Fwjoxh8v4dKyVF6SMssSTeyMf4PBUFdpmHQkPqvLmwFxFFe8m4" +
    "Zzx1nD54NCNuBrFaYcuwufvXtWuUC6AxyLYC3ZCqD9NVAPSDjl/XauyIM3tg3EF2Gv2V4i3LmxPszc1PP7+4TFP23p0N8pmdQxrh5cAVvOz0nrIc0thSaOxGjwD/dwkrbNjOjBGDACEsyOxRvsVA1m0f3Bd6h/33" +
    "cIHNcMmbOOvYXji1Q5vzmQUtSC1TP4EboYQziwlcn3ZofpiB4t5u8uy2qlv4a06ajMQlow9MUG/SeuIRPJczVS+qkXgGfcOgeGUI1Z/aoU98vkGQ6G+bsdFjdyh8T9MpMGo02wwZYey3FsYLmPn7M8LVXuZRtIkw" +
    "u3sYU0KfH3iy8OHfg5rOG0gWNfRcx0KE0FS/HLPNSU3dsegFKuikEziLF9dRzHxxjX9D6GW6yVApjp3yuuzSASlsHWLBZ9Tlm7bF05vrrJwOYdNYAryN8rbzRFNVZVzGyLtXeYh4cGzw75gSOmJPgG7e5u5s6hIp" +
    "JoSUwnfw44TdQ+X5Tx0PAvs/62Q/Sn88iTGRckf4jPZZOJ0gACPVqa7aT3KtVf87TSrrnPZW6lwAAAA= gradient-morph:UklGRuIAAABXRUJQVlA4INYAAADQCQCdASpgADYAPs1Oo0unpCMhsV64APAZiUAa" +
    "ewk0IN99IthAW19YgdZAugu92sVjNyOaOkJrYfKQkWuxJ54KogmvQYonW6bxwfCk1dvONgnZjvntKgAA/vpaAnxSStpfO2NMP39vMEEp58s1PsVSg9ybYA6idXPAnToW2nILaciIq0UxyfGEjnkJPby4p/T1+PWf" +
    "jgHwlPncLLQQM0HaakBciKCuR8ZFH3hC1NmYk++htooa8BKrKf0PmF4GceIUHSBtuoKn3jTEJ8080mAYYJuEAAAA circle-reveal:UklGRkwDAABXRUJQVlA4IEADAADQEACdASpgADYAPtFcpE6oJKMiKVtqW" +
    "QAaCWkBBgAttrqxqNUOOinKaqAap5Hn2Ks2uYrnqttRdMM8gnGmHBCynNjk8Xz6Zjpz5+AFAyrq6UHjDuTPQe6YQ0akN7e4RxgO+c9zCFsRoqP+Dbt8dZiOJemOLB3UlocefSO++TuMyp/uQzkLOHVj2cszUpg8A" +
    "AD+/7XSXcU2uDyZZHfP4kvPs6UV0JISfNUrhVAnmaAF6kEcwW2bDwW6HUs2vMp4E/wuTjnA75+4XE18vLqeyzrBRmqnsnbdRpX0rYJXe5lXrcNPWH1NWsOr4ni8pVwmtOZyu9PRYflbf+b1SWI5EIoGdbMnvmede" +
    "RM8Bm0cBHNn3LzhC4d+nHA7i9chzWhPwsVUS6Fs2UlX9wULfhqbjP2Jj23WC8okhxPZkxx0b7mqRNzlz+cd8ac8fMGO23ICnwB+Z9SPSt3oU8Dzkoli+weVfQTQcObMXLunDzZrG/w7VNWRRfQGnZ8lsRLu6dkRm" +
    "/m9k6MJjJtyDuEMLaA5hLWqt/+XFdwLtZzqYgrURF2+fa1sAcYfGoLFGR+r9ahwgAFFiUqHy8Xo+JneG+2uN2XR9uCdKV0j8kfRjiJ5ugV2gyjk7b/Oz/HS2Ap1TBn3L1WqrEli1TyCQmMgO3blZGFpOw+3NNrc9" +
    "LaEGPrwUqHKmVmUEPf9WK48IczsOXTNzy+h59XRho5Em5nhME220l6kn4r3jUymLM0jGSH2J6kLwh19yXoTFXyirvtuzUiNI9e4x3in4R7DjC2fyHIFO21I15pNyy2JfAHX5wZa3zOKBqOjLSduxFXBZdhbyHA81" +
    "L2Vu17+bEVAvJPW416k4ECKigI88Irpjqqq5DbDXAIdDTaZH+GxZLfha1sXVDRXHGHRA6FaCRUbUTwZiYrH7DIfMLTzItTpRLEHfeN0BpfExwsmz49Q2uY85itaDSBizc1dqSj1Yf6/XMP8AhP5IoilWeZVva0qG" +
    "WgrzPBrfXe3Fe0lA9aUeh+PGEicsZg4vP+bI/Kw+PHiGigzgQNLyYNzriFMrbtMhUASMaErE/DeFuq+UCO4AZIkCRontPsenFfH0V2QbEdgPg4bEkAAAAAA menu-reveal:UklGRtoAAABXRUJQVlA4IM4AAADQ" +
    "BwCdASpgADYAPtFcpk0oJSOiMBaoAQAaCWkAAJRY37V9eD9i5MKvuaBDsLZIVOXkFJSW56/uRpai8OMOi7Sbl0+pm5xBUAD+9BNzZH+C3NXwb8zYfoncShhocMzY0xk8zGBwmDpCn8uqtXsTCnNV/asbzkjwfFDL" +
    "ghPc/qyvHAKuajFoXibEgKNZSpVr6+6x1iwR0Uc5QuWqfph0LWyJUG6Z+cbhPiV3W9Of3gr/hDAoMu5Wv6LwoNINPk3/QFRLx9g5v80AkgFEAAAAAA== shutter-transition:UklGRo4BAABXRUJQVlA4IIIB" +
    "AABQDgCdASpgADYAPslSpEunpKOhsBatUPAZCWkACwcopez+kd0wJPj4eZ2ft+I5RMoKVMsQZ8I5blmJFtZYs0jEUk1hJQqruUPE9K35kHD39dczNI3mw6PyAgyoZyIhmJc7ImtTqp/h6AWE0YU3DV8BKBn4SUhN" +
    "Sd3EaIAA/u1Mp98Y798dKSEYYcsKGthy8ckUDaVMG/ZSbb+T2IgYIvGKkVTX1g/yNzGqCU8+3BHry5Zk/lpwah6ogw+oocQ8aCerau9pPzTpGlOcp7HOQPOQjWno1N4hR4tVOWOJOXJSPmCORExAgbMpxHibzxdL" +
    "SVF1V0ar6DDvD7/+6v5Lr/b3T59lTdURoxWjNXeGvbFGlLMYVV5Lbz5WhHuyeRbz6+kmhVUoMyCWHEqa73KIDjpHSO1jQq3vGuvngDNuR6JpAqp+jqUdCR9ARpTD07WrGxH8LCkPZ9d/iwgynOmJA2SMyfNOCWrw" +
    "wz9VVR38RVnCdgEq/q+Fv21rMEh7dE/jzK8AAA== crt-power-off:UklGRvYAAABXRUJQVlA4IOoAAAAQCQCdASpgADYAPtFkqVCoJaOioWwpABoJaQAAhICVTnXeZIY13TCT2vgKFMS+wuSrgJSHtMc4U/HTH" +
    "VakJJqDyzVgviI2o8US9dyQvQIgchgA/vY6nQXLvQRbsW9LzSpF5nbiOCHY/OvYScwa4DUKgUc4XfU3VLQBghNuZV7tcbqKPgrJ+F+jG1bXOjCWhl99Jq6DCAQxfd/AI1z2Q8E0tyL4EKcH7y+HnEpZBZPbhPgW6" +
    "pSMJZBNZ6wWj+KsmLHv7553MTpWE4GLcz6yd0PDFfJMaHaC6Xh3N/CfwkjFsj3EVMTzgAAAAAA= zoom-through:UklGRpABAABXRUJQVlA4IIQBAAAQCgCdASpgADYAPtFgqFCoJSOipBVbyQAaCWkACByYyTE" +
    "rXj94nOAkhZy5UG0XRdhyWZAkn+pXbK9y+eZCChjKJPN0vlbjIR3DF5zd9ineyzlzXRiF0lrpQAD+9jrV/Ov/v/D79nX3ecgdcBvot4uOiMQxaV+4WP+V7sPj4tTkklDyF6voZBWYApKn9zoG/m9jE1MZTs/Ef/j" +
    "znXOUbKb3RL1IcB5cJ+v5zbYq7POP9gd4XX8uTj0EhKkedeLJCMtR6ESsV2Dvdu6prV3JD9Xem+o09c+bIDbYl28xR3uxqZmg7P9Ffj1pClcTA1IZ4krtKBsLrriM/PDv4R06xGbeGVzpomxz0mI+XtvaGHZVpJm" +
    "B86cP+uV5DTp7d8MffKDvfwYULsbwjM7NksfMLesW7eU2FBn3u/mLh9ZS5W7mrdq67YcLWnCwiHKviQBJMtSphMg8dP6xfXy6V3ijjCeoFSxxzF1TNt4q56tsbjgSIvIJ6iWqvBIUAWhHwZFQyU+AAAAA split-" +
    "screen:UklGRogCAABXRUJQVlA4IHwCAACQDQCdASpgADYAPtFaqE+oJKOiKBgKOQAaCWkAEg4gxTiZbmliaVR9V7hUncSIUUDL6+P5txD8YWycCtt7hzQuGZZbtw2bgPB2nRAvCClshi/iBNf/kMEgUNF/Vbugm" +
    "8gM+G6BEtqznVutQ/ETiTPkyJfFWAAA/vz/naHk5jSJXveT5pnxlGFlc+bqJDyvRsXsLhZF0mi0QOIY7UEoDS03v0xxa6v0fwLlzw/SUp3ExqqQ6CEILZp0bH2SDjlNoWu5f8rNwvq6OqKFFMpuUpD89O8sohEhW" +
    "uLJ+To9kMsqyWPMYFDz7sbbI6Xd4NBAu1UJAZ581qDYA8HP5cSZYHh75dnAnT38LOrAQRu67d4bvQf9RXqsuuAckG6HVVCb4j4l1L+CW9rtqcDWpYn40U5Hnc1g2PRl1wmvLkqcmJCtR++slVOEEXySVgE7rebb5" +
    "tkbhlDaJlkPHEVXQMsK1Ss/g5S+FUmJLVrcQaMXUis+FHqGep6L2szjWv2k+kY7C24sQRQkrfMLa6VLBx2aUUNqqipgz1v635QTLMeZePbJyie1YK//Dv1ooDMxqjpSpB6oTt34ICHmIZdY6eEcxASysnZihbwDG" +
    "wasRFMF0aZBJEJroe8Gw1b8pduKjyO7xS70HxJDxMl+ZagCbfZ6FHcLNApw7C5AfxmY9Ej14mhCx2nTo/enLW+B2ZgaaY5jrE+aPBemDlzY/X+I5+joGe/j1JPcoSA6d4MSv/ySpBP1I1u0WOPtKZpMvwLUu/bgj" +
    "aHWVDHxnv2euVRXKB+5zPfjlQhIW6wseNzv7CMZbbQYgmSmRp4KHQGx1mwUWbehy+ilSYOpbNpQnt2QAAA= shared-element:UklGRoABAABXRUJQVlA4IHQBAADwCgCdASpgADYAPtFeqE2oJSQiLrLpOQAaC" +
    "WkACCSoOHcyQUkRTeGsn6W4FEG1keevdSFBYW/bLEH9GJWobqKEOqNCR+Juw1SEO2gVYP6WYq6f1SpgMGbNC49/Mxw0gAAA/vY61MicVR27HhhScYDdFRVCjIBERwdfOTPGoCbsdOx04Z8OQotBkjOKg0itHU+Gc" +
    "BjJAWIRdXeP7GTrJyiJpYJLoiHGqsHliWfeappg9vzuiFmgYk4sEVoY/0oGGKCq1H4Tw5MCVT5vCKsj0vRsUUiwz6zLByxpv7CcZM0nmlZ6FGCu6DhDa1no+fpAR1Ok8zjb18nJ1RoWyM5Va8A5utiz+qE8N5h8B" +
    "xpQYgpejA8qlBULQcHLxPIhcbgepfODrYgJfsBx3zDDQwFSTn4gFkikZe3EJp6m2SlwtIoYsnsA6MCvqo1lTPP3FVyviQ+emOWkFtSFRFMuj61HDYwWwC2DK4PkuUv1PETbxuMkAAAAAAA= image-zoom-hover" +
    ":UklGRoABAABXRUJQVlA4IHQBAADQCgCdASpgADYAPtFgpk6oJaMiJXgNmQAaCWkACwesKPexIiInClK6xsixxyKLrH1GI20SteK/YZQSaklD3z9/ooTvFy7FBqE7BYlQtEMgtcCcUMhTD0CA8TU2E3yUAAD+9wo" +
    "yGm50LxjWDVfQewUwtxm6DX4m2iLe37IQv9xN1sR6H/83ka0L2nq3mxo+X/lf4BuSLy5F6OCTEcnxrGoZVD8P+xW/4pNPEltJxK11cmjgwBE29wfvf5MBEtwuklSmesR6zHsnQVCdhstkIUalcBjJquAs134NZLW" +
    "clvxsgy3hPMRuueXdMu9LuUhdnDZabBqc3DnWDKk4YnJ6/Y23Ji6k5l95qCbgloA4ihSO+5U08Yi/a6EepzjgJhysPb5EUSuIumCM67J7EUyGP/JKYw2gMl1mUmkktkVFrYNKK1wjqUL+oE9wBWLPm2KcB7Jyh1e" +
    "M8VO8ATXfXmUkegmipjJ1wlw0VB+Sf1goBn/WZQAAAAA= clip-reveal:UklGRnYEAABXRUJQVlA4IGoEAACQFACdASpgADYAPslYo0unpaMhsVdroPAZCWkAE99/hfBPzBgJjbzobJtq0SQWe9wpqn8TjCzuQI" +
    "E8MknX4tuGqsM/s47NOvHWD2ZYsLeXIR0Wu/Mz6cmajYIpjcTelHQoSQarj0nd7UdhWCi1omjmxyXVpxR7g8sa8On3CDsL29maN8QlKeW1iORLmFZMn95W7u/Jkt8rzEHRLvjOnRvfvp7upuFNNDQ5XmG4qAD+9H" +
    "fm22W5Zn/qQ/d9qWgzDH7ew7jrOtimeKWmRMOYcphEssT5mMZ7WGd0IzWrkJChNSJN7tZ30UX6N+rYq5dsBvTcUeHoTEGyd9w/m0u7B9yOz0wB8N4N7D/bZwdMmDgXx9+pqKaybZqip6FyGDGGWdSqn5imc2yI0m" +
    "yz7Tv33dCyDj3eL5P8JqYYF5yQaV5p0wD9EvpK3ksHDLW7hMpWS0e+DFdj70FzRDfHp4ZCIKSAqcQmxzch6DvoJctoTgJ/fmTdXP2cm7piGLiEJwEAMc83bKrgdacZdF37XwInLzfN+9ZP0z2z/Oiksf60T2mIT7" +
    "DhMbL+ZE1nkzBrlLBU/0mh5TZWxayMeG3doQQBV5HOtE3Zpd5uJE2oK6YfD0bC4YgnuvD03GImoQd/SzSvYsBlFQvRTLWh+hQSWumIZQ8JqUufftdimRjBMrlxHztS2TADBLkYYu96EG2S5OtiHzHH26TnyofviY" +
    "qUwZsnwnMV7KRTclbTdjQkarMVZu75kQAoPQPHAl+ZsCt3arUm1wh19yib6tYhquhbJka78Vk8mDNGrZnOHBB7LmGS2vKOdAxrwGh4pM/J3zUpP7rV62W1XLoAwtNcmTd053J1bGOemaFctGH+ilRPLG0QYph5KS" +
    "1FLtq2sBrwQuHVOwkGe3nzg0eI64uDArEVEYZ+7y25Y/8tLwA4nFAC55oma6wxuZfWgFXisLhXko4BVa6vch62bmAe+Eup4Sbxset9VkTu7XSS2sCHHkfHW/OxhcfDpCgnevJc54OPbMH/qS8k2ni/b5la+0Rh03" +
    "r+l4cppRzhSZiatbH45mwJ8syOJMQWJK47htExP5Wf10PHI5YMQtOy53YnRyBOj0uuHYCFxWQ6wUl6E33xwaCdYlspOAAf1bjl8yUIKByK+4FpYMlv0qyU3ZC8g0iwPXFW6ExhVA2JIHamfM1KLCUirjm1V5LXvX" +
    "+UETtYkXrh87KxGg++cYjpS1eqwvSa2aV0hyB+XV8YPCuILx3VAXtBnJmu/IiVNujMD8esIh/ytb0v6PThX0ayZLF/SPD8DWieEiFiW9tiAjijkGnzlZJLJW8LL1wDxMtbbz5lW0NdRyrhBYMScVCW84YzMY0CFz" +
    "3XaOn1p7c286IANYvaK9olbgr2BBXiC+aBLWnGHn2fg6CxXSyMcy2yyju1h0Pkc96quWffQidM8iLXLm3D2Tm5PtwmDs5TPp6FG/1ACTDHXAFGvtp/NWu1dY8k3pYoMCXzAPDQXJb/W8zfMJUaAAAAAA== count" +
    "er-scale:UklGRgABAABXRUJQVlA4IPQAAACwCACdASpgADYAPtForFEoJiQioqnRABoJZwDVgbJBc6+p/aFwXF/OhdXjc/NUQrF1W9WHILVHARWpUXdzoimPjPuQ+bSutd/lsLmpuIAA/vPYGYem5CJZ1zornyK" +
    "qVAyARgfZrrX6cKYH3LeRmYQpQGvjBpOF9FeJFO2oDSOKjpHZVMt7BNiOYbT2xsKunWMonRVRy9LaGMWreVm8wWwgCY4zIsxkHHP0+UCx1n8uLKb9keSVEkwpNO2jld8+b1N1LnziAUkrte8tGzyXNBTjhIA7bng" +
    "C9wJdxexNnTcn4tcQjOdh6IC8jTwqyOKZ5gAAAAAA ken-burns:UklGRpQFAABXRUJQVlA4IIgFAADQFwCdASpgADYAPs1Un0unpKKhsVsa6PAZiWkAE518FfHFB2yL2j/YsNJsl+6eYf5R/W/NA84f9V4UH1f/" +
    "H+wF+Zv13943/G8j31pwHGL5dn66b8mWAvV2G76BPpuN7OGv7CNMFU7qt8tp8ClWrfjF9aY9qkQHg7VTjADfGA9lONeD4ucwUDGuEXrBlyjLsC45Tm1YvJsgOocZm/r3Hd88sMUYHdzhBVnaBasPv7OTpPu/vL5x" +
    "KcfTl4ZXFyWN9FLH8CxlNyXAAP7+hw9d/Cz8ISPPC38PBgNavqvRRTaNrWf62RSy/nThmFeCy+m4614a2LdtzzGmPLV8qe/09rEjb+J4i6dDaTEOF35Tpt0FLPwWe6eAb0l9qvPJfxUVXab2Z6YlgymIfWknsX+1" +
    "NbWvMhq81Ed36XHwKkWcWGMWBWoYb+LptJhHSZlyuxZ+hkvQwIMz9fVMzvSncsXrQ7XxNxuD+VUa/+VsKe7tuMuO2CVFYiBAqLqT1f0Bj90q9uilO0F4NoAFuIuwd59tL5pMzidqwSG/3la0LfQ84gxjYNHVwEBU" +
    "KqEYMLu8SaBfMnvybM1lePP6+OOgFX9yTh1zr8MLRNoVyw0adP7K+89YpOf5mhU9wLPnKt+yU84CmMQSox4io19EP7yYJUCKvHVK9/pzwBUhE9Vgn7gnfbaJMAbILUSDNHT3tgfsp7uxaG7nufODhj3Xc1Xj0ONj" +
    "j6xfd6iDwgnupPjTN2jV2vfOJUfpmURn4KaCpXOrEoB23+7tAQ3cp8793rEcsAs3Zc2jWRGYaA9ixL25v7Dy8Fx2bn+3yWH2NwmZlFVpA3W1GD4+CsXyxNKAtGGPKeLfi1kulcnllRHGHwkn6YgX0bi3/DLQkdDv" +
    "o3v6e8gLPnbgQQTZ190zfBJaTmUGIqr6HlTd0VXXj+HDvE5/IqqdoZovpKt54QvdQHoL+Qv4u9Sls6gQQAUZwqAY7lPCruCR3AqhWr52KgzVOMIpzXfPBpsxQklTlqtahP/YLRUcSYIndzU3BI1Tgqv9kp3ojD38" +
    "L05MGvL7JrMEO48uV74HWV4H9ZYdv7UeLP3vnlPMO6sf4OlIDiRO4gxU0f2ZYbJnDckkLPovnkzu048VgOe7Ix2sSroIaEMhkJ1sFCNHBeAO1dW2npV9IT8LgHJV2BitXSxd7kibABpMFcMQ7FjVSqLoH9SKKu2V" +
    "AmM1Pm6UyZg/oR2k56PHDFr9Kdb+XSMdEmlOjV1OItn2fckNQgc8LSw6I1zk7Z8Qk3fpxIXnrQYgf525AlG5OL6mLCkcq+Zlm082L1tO0L3sR6YcLN/IxP/gjTHezhT58ldW2yXfOVoXjnB4O8CJaPzLCHz+R6ow" +
    "upftUbncH/8VYPY9ofG0Ya/Or8XaGwUE8RtBES1QGs0vcAqOfTnLl4r0JZ3Ykhg25AjQb6yjpoP3lKIgr8jsG/oWvful/r+BKvyWBQPe0PNFkprw0wu+YpLei96qKfCOGodrfAUUV4Mo67islefbDY7Z0efTY5IY" +
    "+CK0QOitBA0pO4nIKirk6gAiwmSbQQemqekVhr2olXHSDV7KXoS+QtKDwZ+Ntb3x5X0yaQn4zuLq+Xx9KKANWAFanTFdo48qY3Xzz3sAnLpiW0Sst3PHw5sOW3fW/5oJp56scwroHg7JqQJ3dSGJm3ZK/sUb00jq" +
    "XHbHHzOhUzMLU/IrmHdMUcoRHpnFXgAPjMmjac6hbNF9LJzNSyNhBY316WZ5r3fM+yz4QDE0byObsISjySpVo4RA8xTCc1wwwW9Vw64MxSadMRqTcnL9WVvHqIKtRbvTr6FzpOVSL+l5v53zJExWr1c3XRLTZxga" +
    "PrI9Gz/1UbObGug+I0zlTqSFWiX0qYYFOgii0hWUAGDgAAA= duotone-hover:UklGRmQBAABXRUJQVlA4IFgBAAAwCgCdASpgADYAPtFiqVAoJSOipBVbaQAaCWkACCHOnejWZiOWYK+SxY/hf+e+5cq5NYf2w" +
    "3pWQd6j1qWkIfhlBlkxqnYuBHjQxBlldez1OTYkhO8gqpFK82AA/vY77qtH83ECc3PXqsoshoKYGaWsHfXVysTVQ1Y2vKpnQj92JOHJoakf3zta7reYWFVKalGA34V8AeomZDIbp8Ck8EMtPgaVxTqhHak7fd9Pn" +
    "2JKM4sX9FA/Y8v4BqMtb7otvLAmFABH04i+iN6pBN8/42/VWxmII1mCe5MS5vaoZgQveHLGf33YyjjW7X9UmCdUSEgcQWMZLiiQW9Z3PcY/JW1qj6hHb3mEx4QTx/9W/sk40oMpfVoD5eUFGO2Jg+N+Hz8Bky3KL" +
    "TC52QIfzIwjtNqugh49SmmBZQXK1YBGjwvDCdw7X/Z7p9uaDWzZkxob7PA4CiWQAAAAAA== image-parallax-hover:UklGRsABAABXRUJQVlA4ILQBAADQCwCdASpgADYAPtFcqEyoJSQiLVmZuQAaCWkADpL" +
    "WO312AD9bwbHblwI6NPSAvH/w38EiRNpHElHMckF3329gS6SNHOZgES9MsjlLYtbNRRAEf07nY4RJWXeH7Uzu/gH9l9jaCikAAP72OtX7yxxdwHJ287Pw9WPUbSaNLauhPzuZun/ArXV8AsnrrilCE2IkoJ3GemZ" +
    "dURyUslvqtpEsBOEvub9z+NEzxs3lWM01z0KiCE5fCS7Z6lJmO77ywfJ7ZYgPTXpQUHlYp/cPq8YzZBEp4doed3SvgJnycoKIML/Ft06sMXacA81CwBZwbq8r3qXfSWCdFkxusDk19lrGiu9qJ2Xmi82dlWmvYP8" +
    "dbov2EI4V2UwSNT7YEE7aJ10NLw18Yc5zVYcwe7A+aQpckQivbN4EuHnnxlGT8u9K1l5fd7QaMuW7NcCi2MGYFfw3s9iXWON6hyg6q0t6DExAtuJor8uqKxfiyY1Abn+dBcjtIVwPQNFsyOjuZkuAJ7hOxoqWZSV" +
    "A16nexlYTXjdT49DZN1fSA7aufm2vt5axXbvzd6TN8lkID/JBROaseDugAAAA blur-load:UklGRlIDAABXRUJQVlA4IEYDAABwEACdASpgADYAPtFiq0+oJaQmpXgKaQAaCWkAEgseuucP5nvXlVA6GQFJWZUh" +
    "5r/S8oX8LvjVGhmrGczMft9OELYbW3nZu9l6cb17i4iu7GnWmut5trV4Y3sGEMhQI4ScZxljkEikgPjm9OoML49piIAkxAE++RuvWauDypB/e7XLFq4QMUGWqImIAAD+9NZPxwRgnsSPym/UGPeavXj0U0itnI1y" +
    "K5VTC4O+4diHLw/K0LSBZiVwvgbbBej3D2Szg352dLL17N6zF89grPQcHBKF6C1C+D+161X5RtcTGb2Tysi1kCp4wKPEadNnh1uarbc0eA2qXud4D0T364MBETkGHaGGhGtT4o45ZaHseOBt+a5oQH2BSOoT0OJB" +
    "Qz0f/9wqkKQqI/LNq+rxrnBucdUuYuvxNPxP7Envd0d8slVq9GBilGfviTLT/OxJCWx2u/HGA79ufsd6QJK/nsKSbrc/ky6f+FzJHuT1R9MQr/wRv0fFb9TiczPiLOGfNt3Rq/0t6tzdr76D2fObzDew1r6KPhJb" +
    "maNHJyxcFZNNfuNJG89PlgfuuLcVJKAYq4hxQZmfWCYAYCVS6stcKADDP5Vpou6bvBAOZXic727892psPLGZro2Up5izBOFrBONeSmbf773F0cK3e7zhBBgJPvv7bzy2dIb9LxVBLzagXFFiMJj6yLhuvtWIlyAI" +
    "I1JbvCmKuhzKVcYl2wLAmGX3ibD11oQm+/WPwqDMgf4j+Kb4A6GgCbOPKnTsegrd/DfzjDrBCzDIcZIqmvvr4kDEHSTxWfN6GuC7BJNWcuuy2sirRXGV0BUQH9/oZgPWwfSF9bhfk5nvR1NjCh+qpO0rHHbnkz+0" +
    "s3BFb6osqRR07cG43YFb4G8s6mYS04P+F2Ep4pYlrrdhiEhu0jPGH7HpK0bO42j5q6SGXMPjCSunHa2OWF94nY+Tbsbkr+QYQXnmLkcHpfcBf4OUK0YlAHF/vr1xW1xFTEPgPh2jloIOgKiPlk3keU6N5UbuuYrI" +
    "he4KvVR/EQzC82FWwjMIhs25MXOYwSKdd4tW9h+i7fh8LXTICRzSiFdgBoDLe0FvIeokKzQ7o5sS97xR7LLD0xZC8qpwAAAA rack-focus:UklGRioBAABXRUJQVlA4IB4BAABwCgCdASpgADYAPtFYokuoJSMh" +
    "tVEKAQAaCWkAAKnixpXBgHDnrr/EYyxjf67XjNC79270kCNC4nEhNBxunuVeWMlXnFJkHuPKjfWviTyOz4PNIXtRoJy8Vul4AAD+9JuOjH6LdPjof59ElvliDmYRzeZxKEbRc8OirtUgBarugTJ4Ejq195TiDb5m" +
    "fJhbUi8JZd0BVGBdAN1QS85RMpNwDMJFcjjmLzBQ1phhMd2B4V6gNbxHlZlUwePqU6voV9yMshTxdPCGhPQLub2Yvv9RGp1m3OpudhcQaKFvStmtfq25WRHMvuJFb8caX0CKRdNEnqO3Ov7FRa7XphCUI8+g3HLD" +
    "eJ2/uwbCOGGCN/CpU12ljYowmf8SRFcAAAAA before-after:UklGRjwDAABXRUJQVlA4IDADAAAQFACdASpgADYAPtFeqE8oJSOiJrmbWQAaCWkADrQAee22Y/El5MqwGec8COkAJ5Nf7y4rp3hAe2Rqr7kbCn" +
    "4Lhvorc2tib9FGehe5yMXIi8SuLkxTgKEoY7RZWGLZukspTNWJnxC3lgBEE/+ntH50BucbH+gf6j7SKP1jKKWrKqTqP4bDOMnkxNx2qUyBC8g1SCnv5sjm9962esi9ILLeyRSMn6lm5OQAAP7qahIjWQvSTuSfdP" +
    "0yucZChu3uddkxqDe78KZLl6TjU1s945/rxzogJLv+RkHVtfFsEFFo6Qg49NnFJYDSC6bTchb2aup8eNSfz77z0utT94CIjFi+8uLHyJE6OIWaBGGDT5vOxLe7/kMaFI1Gnvi87n4BkKUBjf+hJJTfs4YE/vmuas" +
    "8DNDTF/hpDNgZwjZNM1qps5LK67Mu96bVhbQXMjI6chKc3yzptDc/wNoPXUiHr3kR8EHREKh3ygRS/40NbPJl8NRYllUyM1/64m/Sa1KdbDr5key3fA2zOKPDTZqoS7NZTkk38+/qVvOOwBF7cpfqewUDizQllJ7" +
    "hcSb/HReQcDgkBSmx8446OXwY6v2i56jLaLpSZFojfbdfMmGfF6+zdNrjjQIPGX5YZbnqqceNhvAhSp6Aq3xfK3n2mkk7D9mFFH7t+fNWwBwBvVmCwAN2/fRUKJ0ZHbKxYModGvr0vsrjNX8l7VRAMojlEcl+LJ4" +
    "auOWaFJbqVuffMFi+0wD+9lNYQD+Ij+iJmjrIcKU8gAWBsc5a+d608Sfygh1R+K1fzn65YGGPGinYLOKYoeKPQMZ7ZjkXvDmQztB9rrLg0ieku0hV9GqiJDYvOc3l5eXc2vpF38XvUKUjvJy9Wt/NENZgVgOrJXb" +
    "fDqFy7irzCZQx8p+9DEEhEWIPnGWj/RLQqd74flTAYceqvslxizZi1S0aMXXSYD25wbSR5H0tpThc0NlgM15QHQiBm3j1caJ16oFtXMi2MhtbuOqtipDgmZCA9+ButJpnnF86ncO3Ci86J9S8gjE1KN3qyoAABJB" +
    "OD+7O0C6KSsN1efGw//4LaESZhdQr2cyPEq8V/9kAAAAA= mosaic-reveal:UklGRnAEAABXRUJQVlA4IGQEAACwFQCdASpgADYAPtFapU2oJSMiKrn7gQAaCWkAEg4/UGYNvblTiW0yTQu84H2Tq57jigXK1vy" +
    "6m/h3zz9kc7gHQyPQ1tNk1yJphoZKh05Xi/i4jyo1tsU955EXb02ArBxxxVho57HGKxDvlyQAzabHq0/qSZ6zkCBIgCqXxWnAGWcrfUhGXb1bWsqY9G8T6+uIBffzvpca8wRHaP/+kSh1L3y6ixIwmz1qC0hVQ+/" +
    "/DCV5ipGeAAD+bRZKUE9XXiraER3NWeOk4gfX8/mFkf0o7yOCRjPPu5ndef7vemNoZmXOamVFlIZeN+RTvZZDA9TrXMH+xBJeemJUe5uPslj53R1tKOT5ducgHAFRmDuE5tFTfgxT/Xsqc4nQyS7mjBldn+Cr+fS" +
    "Gl+sOGV2QZEkaTxHC0MLzVEjYIVm/Dlv3qz4dOpgH5xnANtrEEcqLpXYZ7j+HXJB95EKKwxUDD2/UqXjcb3h2cR6KYrXXDkpEnud4GEc4LEqsovUufrcwEau8xLdNbsvC7cB5bsV+PXxrbS16RtHljQGeFLmM6hB" +
    "w3Wr5wX9fighvhZcd1bZF1v8R+EBY7E+P0NBM9uf+3Wgo3AcIDpPe6ioreBUmbcy7cornVz3vpuiJOrGJ4KjBLScGPY/+q9oMBGzjpN+kOChR5CuLwtkKKNTPlJ671geyIozbY36j3J+eG3nxd2dMljnA/Wcc+J1" +
    "1pxiLuT+5YAUySplNXqqfSNWHB5iY9rPI1uADb0pww43woM62WDVO+UD8cQz6ic8oZ71UhV1F+TflVFoB58naDa0OIl0+UlQvK/xsg9ROXvGRLnM2fonirzUwUnxyvYMZg4QvmjHQ6iLyBIrRKc2ywUOrDFAjf/a" +
    "N5UaK/ru9qCAT0lsSRUZR5QF8gMb5PrtMmG8eaTxevypUChl5pZCyaqU9xXmJsiOLMFDs3PsdNygIwUQCRKKYzYeNEKrWjT2J+GeVkZ6jg1306+kSwlJe/+3IYyTbMT0HCpWLCf9kweQbd1wWQyQbRoIprWu0FKU" +
    "g4UARUJwqvpi26i/yYqULlpUlIl4YHI/Ax24yxlJ5C38gtzBQMI9zmO3wSUnATSJX5+4YLatKGBo0TafsqSRwgpDvQTE89JRRMEXIXg8bp5nMRRaT816Ty/6+e6sPA8Bs6tfkTNbKo/2iKBlhLrZ8XnK5hNg7z2h" +
    "jCBp8tkPhR3x7tAZI0TO8SUNQkdh+Wx/UkZHt+Mf3p6RQNsmwNIoh+UGKj5Az9z3fe51YTiI0E7jihL81LbAZRXDBlYsdJDMnUIJR4jp0tk6xImLbHQQB3aqaE019biL/389w2LSb2tVTrt1LdXQQuAz7JvcoTlg" +
    "4KaPMpIaWVbGtEjeoZsXU8ZSwo6pld9rv3tVOR8ZQfWhb9/NoGD2H2K6KJl3E3QN+YhogzNh4H49cZpUetmMWA+K30UnMPAlXKReD6ObcI5XE6yBsFhtNqOc44OpBUGAXMVPAljqTLqcmsAAAAA== quadtree-r" +
    "eveal:UklGRrwCAABXRUJQVlA4ILACAACwDgCdASpgADYAPtFcpk4oJSOiKrgKgQAaCWkAEgndR3gTi88e4sSQcLOkpZy9AMw6qTuEiyEVvvvgbI3hWzOnTSJ9KnaAXd1xhnrxXI60/5ypympOgVepWTudT4pios" +
    "ZXtTLrVmnARi/Wv/sfv/FzVjr3wc18L/l1jjP2uAAA/vcJkBfLLonNIFK5IV0OhPkXG7KmuevA1U25SUVeZy9AAzxrsa+bsXAp4IKc2ho7SZPSD12IdNitknT602rSvd59q4Hn6lJ0J9LA7rkCG3bdXWN4w3SHw7" +
    "D1lIZqG2BqH5mxsrYgm0Pq7elv7bLu2Iv11jICtohwnCGOnjNItIIwyyjcjR6Nfgj4+cTRpGU69u1lWli6tbHZoCzosJ1tmSnAh/ntraqK3Sg6eu/6H6p5850/Vs/T+hRPg6HOfG2qSaj1+uzwTPbKRWHYN3MDm5" +
    "rik6I7p9HliW/ptDLu2FoNUx3/S7HjjZ9z0EBQzt7aQ28fJ2BbzE/BbkKp/V1kOXpZT5dDn5IuaJiayrdz/ldp4oUa+p0uA1JmYcQnEoPp7pu/npJtFSLbbAaIlnkq2Dh5NDqFjEa/bPw7YbQhVDnAZ9lYQZlZ1Y" +
    "eemHc9vyaoqYqqyt3UCxBPd4Bi7AT6nEQmExDFC9HOORjKgjySy+mtB1oTfzZsnolZBvvVYAjOQYd+aOsuDTeAZjoXB5DBVqGN8NYkTATpALDGlmjC1JcY4Ng5BGycYVyx/Q/FaxHCzU4AV6keohLT69mikSNGOO" +
    "QdrAvAI27RYBtjYp7HDjnSVTrF0YV/VAGR6bzoXvhPqfRXd8vG+4xkjg5HxA3dDb+kF6Q6aEpB0l66r3bvqqzyN3EJeLyo5nGuf4eY+YGbpHScFoGcYxD36e/xrT7GHKTvigQm07juhL0dhxeAAAAA lightbox:" +
    "UklGRpABAABXRUJQVlA4IIQBAABQCwCdASpgADYAPtFcqE+oJKOiJXgLmQAaCWkADph2izDYhto0niC7mxn3wjsEcVw7jzkFF5KB9VRQsTqDlyuQQO/di/Z8V/NAt0fEKgTE5lzuMouNlBloD3Ar6eAp1LA6BIAA" +
    "/vY6eUholnnjA9kKtE0TQU5a4hgyiZYF6WHM7w8abfl5jw9U98qu2MSqoqudzlwHDh80Yh3EDRVckD08YNt9TPam9jk9IJdg2y6fIuADYySHcCUP0s6MGLGLT/N1YDt4D+6Dlj7ef9+nIurPpAKiEUodjviHgdwS" +
    "fu+EKnn7eTlP+xQR7CYnvx0buQKXarKW6IhziDiz9Ff2hZq+sOgaV2oH+j93POuXVhLziAoryFOl2B8LdeyEeAh3BxU8XyQb3mwwQJNX6kkzexXyEBy1L5TiZyl0ZEmd7rd2wqwhU99fsXg5TfEt3tBqI4e12ShZ" +
    "UvVXlW9gYCwLsfc2vARuSiqVCzznzqS4BgA9eDI/JvvODcU4r7M5Srp1ZegAAAAA carousel:UklGRqABAABXRUJQVlA4IJQBAABQDACdASpgADYAPtFap0yoJSOiMBgIqQAaCWkADphcH7HjQJ/AZPEk0caXgD" +
    "AHasxDymVyNLyUlSwT87qItZG149J0+uFx6559Yk30YXL8GeHZA9l5aKSiBcdoIVpMAU9mis+J0dx3MDMwAAD++loDV3KwHiVWbxyOBfTbAeavZw4HT2SI+s7/SL9JS9jvuSzMIN2zAXO01/tm4qSgPjeQaeGS4i" +
    "eAiZ0TSFsY2YjXyeGjnsUqZppzseAd/kg58eoLL3bgp+Wo/B0kR+jNAlioAgfGBg3XvJcB+mL56ABm6SsFHlw356MQybDnwbIOc24otwDpZ1K2R0zANKIy5Uv/bqQ7292YZA75Gf2QkfFKJfIRUtf5QaDJxii6qv" +
    "BuM1hEStVBw3BUcXfgAEdEKkhe+a+i0Zk3x2aBwHUQudlUMbxdCTE6ddCkVDAu0yJUIiWHAO6/EgTL6ihCowY+SuZRg2oJDdG0HkqyYXYPMijw/X1eRu4DZEh70GMoYUxOjQHASlsgrElJMpSFmsiIaNF0oAAAAA" +
    "== cover-flow:UklGRpgBAABXRUJQVlA4IIwBAABQDACdASpgADYAPtFgp0+oJSMiJXQMYQAaCWkADmhgIA9OZYxtBEDk6ykPGm90Nu32Tr3MEtlJXnEZdvceVYZ6F0Zg5D1jhjTRye2POjCV9v3/LuOAeXracP" +
    "8d3vkcrQ+W76W/oLYXHmo+AAD++lp2h68YsaNNoo/UdEwQ6p5qsd+8Sq35vHZlqpnlbN39ZuihtWRDwok2Y4W8BNH56Z8Qsc4DLJwo4Y7s/bYNRLa+FasY0igzjFlAoc0RTJ8KUeNcFiUGSABPt3QB5G7P1oKShL" +
    "BS/CDNgXKrWJnsLW099+rlUk72VZ2T96cD4bSIBzMMNlBSdw+XdC0krzaOsJJXx9/DCalky3KkfZtfpytdIWxX2wIY6r1vDYARTAGetVyTak8YVt98lDZwVVdz/7TYwJFQB8WRRwTDsRS68eEq8XUat95ygTdh48" +
    "Awi4Iwa5meKJnlF6u53it7XQZggWcUJ8+yx0edUbli0EtpvJxlsjAQasrtZ+W3K+Oblr7Ldthd64Tn4p4bQwAAAAA= drag-scroll:UklGRjADAABXRUJQVlA4ICQDAADwDwCdASpgADYAPtFcp08oJKMiJrzLW" +
    "QAaCWkAf/2A02W6+caRdnLN0r81TyUaQgEkY1aobw8fwZoBUN30X5Zn23cPB440QorC8NCL7MPJCe5vgwQ8hmzt96ox3akEzNxBftXGhVZNWwj60mHPjfIzafWTU+XpUAPY89j9BKGrwUS2hfVIUIAAAP7/YFW7z" +
    "5Dqf34lw3X3ky3edi/T8yUguleVsvKD8ijWVeG27YDEhKWEaGMcoO3V7Qa9SvoRuizXuqm1oXfvKDQjr4JoOdOHHY9w61sOTw3AY4+xekuMJNbf7VVHgQVZNPba4uhYZ58jknea5rCaxoOylEJbiC0q2tW9H9bNB" +
    "k6ca0bQ1BUvqZJZEYvr+e7A3zhGMkFwtxW3JhGzjduIVhdoByvCAE7wwZLZScOjgByfXZt3YyAhhW+8O/h+tHGbVMAIhAbWydg+lQKTrCYT9u6K5vJf0tkpKzjSRjV2KV5fFHjhJJjuxIgqntMnaT5EfoPryeSgX" +
    "C46vdtFRWfmn1BTBWLUTJnCUoGjuhMkao9KWOpcq1Y5c5Nzma6ZP3miGAGDIYgX6vcYbefwZKnP5jr8J2Nu1PPRBh0if52C+NDTefxUSh2CHygvhzPKwTZBvw/VfZe/fcMMmZEQcrwLPalfyF0hWqYtu1liryTMC" +
    "xVSI33z1DTkQ9h8DmqDfBM0a/6WVaait556bAi5AlahuIFR0w/AXYT1ekBd6DlY5RbDxH328510jJmx02qw8v/jHzjxzC/BZNW2CIr5jqengWfTfY/NKuS0ax6ofVfJoHuDCHNyMJhjGRthancXseMautz+g8yUr" +
    "gQttD6TX6IhdR/ZDXoGHnHH31FNWxYpH0ntR6MyrBKoJEoY1xmgKbumArKVGtOCuRsul6DOwNYgSvAXX8Gi8FPZQYb1ZW1tDEqLMeisWVvWVuN0K40fO7aQiM5amBiXgk2VrJ3eksKrAjM2/kfJuD0SlYvyQnal1" +
    "mle1SaKXu9xW0FjME9LnpUF3OVbfsIzQY6m/KOo6pENnlhjnRohRpXw8172Rbg/3b2XHiTZGu5sN6kAAAA= card-shuffle:UklGRiwBAABXRUJQVlA4ICABAADwCACdASpgADYAPtForE+oJqSiKB1YcQAaCWk" +
    "ADnc7/jqpRnjTT/OpPmddl133HF9NnbfqHS9LgIvL8SNr1pjBk2C641hrtFZt/h2P4MdwgAD+9PIlADeXmmE65/9/6+R4fEA0gL45zaSJjXmMIgYfIvEc40Km2F5heszjqA6vpotnGlHZzzf4Imh/uW6LneaADIW" +
    "1YJJO4ZqDf2zlwx70g1/VBMOEWhNckERZNPlUheYs4Iyzl4qKHp62/KzBZECpg5P5C8vndd90RHVoAyBv8KDqvYwiuK4xtoiqPdeC/4jhZ1iX3flWCz945NpqfWh+PZvsgsW3rM/eQ2Bj+0qehoGK5BSVvQHra+o" +
    "QYS77DE6+euUuDLI4DjSQ7OAAAAA= logo-marquee:UklGRpYAAABXRUJQVlA4IIoAAADQBQCdASpgADYAPtForVCoJqSipXQJMQAaCWkAAC/uD7443+b+dRAroqlqKAZo3eI8nqGQgIkAAP7xCeU6/hdRH5g+Z" +
    "dnbgNEGfSOou7m4AeS3trhsqx1x/n0+5LOjg1hxV0PVMtbVk8B0ugVjgZqOKc2I0jwEljURURZHiw0fjnN4cpK9TAAAAAA= line-draw:UklGRjABAABXRUJQVlA4ICQBAABQCACdASpgADYAPtFmrVCoJaQioq" +
    "oxABoJaQALAEcCEd1XFDN0AA8acnU6Rdl91V48RWi+jYbCTFKb4ymVma+kAuJzj14D28YdgAAA/vNiCrk/bUsPTyJNPyIJIJpF7Jbj9R6tkj4vfyhR1lqk/wU1JtQvarP13Gzqo3QH1EhLy67rAhp8B6ERjvDHZR" +
    "p8DJjYXJyWietgR7SczbnGkB0HqT8Q+v4OK5VEAUkwlX7AiWxPU2/V7W9njGP9nrLcGiH91YJIKeBvOJnenunuCjgZaKJEj+gQeIKVq/9b7WxENa9nyq7LSYcToG51qcoEBynvwgb0WkjlrBBKRhB+EJUBDxSnK2" +
    "Wfn9GEApFTvspfPUWn0XMs9URiwB5x27hBqLnjAAAA marching-ants:UklGRpoBAABXRUJQVlA4II4BAABwCQCdASpgADYAPtFeqVAoJKOipXQLMQAaCWcADpaWAysWBlwf6AX4AslK5jQ1eM6nDfz3N49MfNv" +
    "ifVogFoQ4SDKn5U+5esMmPMfMr+PV+z3PmEAA/vUhNS5vGLcNK0ddikNjtZMqvxxKnCEypcoTkOfIxa2pAJzombrFvSbHzkk/TQATZU/Uhl78EB/i8pEptfO8uGocxBAgjwAb+UP1fXqlEK7NysWDOgOgfwKuyNW" +
    "ZTJQIjYvpGm4dAWwXaY7nAXnXnSGQ3QUmleeqezIgEsdcEV2EJu35FneSPdabfIQZDF+mSq4SC0XZeSe8Ay4Tq0mGN1BG16fQ9r8JJRGmMMtwAAE11fkcGKwOEE/5VOCvOw8zZi4oE2RMrfdjzdAhGjNWPdxQc9/" +
    "im+PpXFCOEPuhnKzILFDmH6tb8hn0Pc9lyzI+cImXbHX74X51A5vYjTW4plBk3tQ5U71BPJqpFw2lwnH+gQTEKgC+/h+j45snSBbd965yTMhPK//IzHF4goZ4t+5yBh5AAAAAAA== animated-beam:UklGRlQB" +
    "AABXRUJQVlA4IEgBAABQCACdASpgADYAPtFkp1AoJaMipXQLmQAaCWcABmgaQJmkpFeRUIHSjYvFFCPJApAY94gYmb+5nJj1LnrG5vjAGxktsvhsqKSUTgAA/vWFX4GLS5zzqp8h3auRwqb6gJnciNRnhoGhYIsf" +
    "8PX/s12EVCwBopyFB8ncLDQmrbOe0Z3T+RpZcw+/WxAHMqS8uptIcNjr/oQvP3N1zdcOsABtHsvcKiwcpQ0wjST+w3Az+EGrUHZQhdwDBXPb8L2GNkXWhH4B5T3teRkrJP8v+J0iPk+3h2v1Mc/k3iuVHmuSfnfj" +
    "nHpmIJLGPG81PA6AmC5PUEIPD4EbK4rFf4ttVu8OprfhWfAMEgE1oNDzBTUtfPDqkha8WCDZL90L4RvgOPWDi0VVFLDgVQKwfdl64GOiRSrb8C3yIk12pmcZm4Wto3f60YAAAAAA barber-pole:UklGRoICAAB" +
    "XRUJQVlA4IHYCAADwDgCdASpgADYAPtFop0+oJqMiJXv7MQAaCUAarkFWYNwINhtgOeO9AG8AehX0p2RU278u2QI8d+B4J6Udocgz+AzwlauVZp4z0DQXojo2jIhios4HHWAP0rCqdfJEHgTZxNOM32GQard++W3" +
    "H5ra2A8re5TjYULbltjso+1BTQAD+/pbcaF14OvD74lqpaGqHSiAU7YXTI+Obj1lk8cujnmCP8bK8llPd7S6oT8EEoG86Q82aGphmDRzuNF06Sp4QVNVz1wdFDj4wPHMDTJmFpScA5APpTARvb7QHkMc7q60LUyu" +
    "6w1hNzXaDl3s2JPY+BKKANXtD6zFEcafLFyHyAc9T8jQAi8aD6g7zpcf5ZzI3JtBoETqA/auKBFUHTqA1omMpyRcU+oM6cgMomwXnFwHw5cIwPXruXMg0IBxhsCOCyI1smPhjZ2nzTdbzT8imaA3HOB0+oVtq+Zr" +
    "XSNye+ZatrHecMHnPApBUE9OYGYt7NaobHNuR+wEEkpLr+09kXwRMxGWmL4anfy288pZflvMrzTq+4wBILJyEOyr6DZtznJav14/7iv1UqzeEuiCj/WiNBtEposTYyZAEAn9jes3oHTEUZdMYaiLmArzBMGprjt+" +
    "3uKHrVs+dr6glw9njVkgD47/v29LHfbevkykBoj5wOFSsoukG96LzSd9G+6azOEZlOsHCgxSM8tRL0JHWBnzyfntBdwkX+p8Dg8JMqLUdByC/LeZukFdC4r+PVygCeES3g4sc1xL5iddu2eoyvbZqkfnhBX8gJgq" +
    "TxHxhS2iZ1RnS4u+NYwZT5sBgat2KRBCjXOnktrRglAEK+xjoAAAAAAA= corner-brackets:UklGRt4AAABXRUJQVlA4INIAAADwBwCdASpgADYAPtFip1CoJSMiprM6GQAaCWkAFtR7YdwRdAYj+DE9jGCR4C" +
    "62ORCDLSYlQe0OALZEiO/kHumK61WhwsmF6QAA/vzW8Oh4w/N7y2htXcB01SHHSuvTU0omrOEU8od04XPaE4UnBaSxJYuYVTiTyTY5Qb+OK9sjz6Yvpbimm/XVw80k9UdFoX2w10EWtLSJrUXqMSj1xQBvNeoCan" +
    "N2ONUy9Pr7wtxXwUMgjFxnDX9gGfKJ7Qdk4uOmEYbH4v03bD5lheBqMDM8AAA= blob-morph:UklGRg4BAABXRUJQVlA4IAIBAADQBwCdASpgADYAPtFkq08oJaQiKAhxABoJYwBXO1ADeYUaALWxzMec4BxYDF" +
    "ZJParti2S6E9C+v0t7Wo1FgyvZNPB/BjuEAAD+9VauAhBIGrkq9CUOhV1wKj/XdoBK1ofJTjmR7DuzHnZK8ZyXfC7BCyqBx+hCL8imho8okzmQTakwTU8eY6oFoMb0mq49OylpgX0uHT+V/HtnBNG+hRNTbMqihf" +
    "EY8cyxkeVj/5Cdz9JPV2N4p86c26qkxtFwn84JROHDd1tdCemcrmXD7LLTYVqACa6eli6lupvyz7RU1L6huEbuHc6vzLUzE2ehqQnJ0M7YSi8mEU/y/7Lh+hgAAAA= grain-overlay:UklGRoQDAABXRUJQVlA" +
    "4IHgDAAAwEQCdASpgADYAPtFcoEyoJSKiLrXbsQAaCWkcAAFh5YoGyBT4608/4IaXqar5JHzno8I2ar+BzXr2djtd5MxOVR/O/7dnGfRR9lLWfnoZCE8rE5GSbhLY7wrDnQ7PF9DcCXtH05AHfY2XrJ4msOVboQq" +
    "cvdbKEVGe+E8Y3ZJWxqPf9uxn5RRRoHiZNNuoI49Q4AD+/Kg+TiThjzjsP4dNycstMsidD+uateHlTcfuNwn2iqy8ZQSB4gF47QDFdFAJJ4o8hKFez2sCALIoNnQcR+aWYPNTy319OZ3YFh2R+mhC2d7sRpG6zYO" +
    "H/wjAKFpGUluFY6beagskeSFPB4PGusXAiefTDdqH7IqJdFRVdT/DeWY7qqhDP1xv7Fbdsd/+nUreCY9MInV7z9wfuy+N0R6vuuhkR5SOSStYhjlpvyCndkL58y69ZFv9S4KZwjDFIXoJ3tMSf3yLI+bFlioVo8D" +
    "BqbMCYGuO8Sbca2Tae0gbGj2ICcjP6FTykIQkPBaDLspiGBcdMSIPkUPm4GsTam6AcPopuvR/ggtjrutJd9w/3z25Jsiq6hVs4ZQHeLBCRAlJSdQ2MpTaJBIYQ1ow8+LqAnhr2B5eySTDj/DE2/fP5ttsmCWc4Yh" +
    "B+VZHq/mDGAYsS4pkZP9h5b0WO2dIrrzOOVA6VkXo9bS3SGodr51jVDJhkUIX7mAjXZjclSBZZrOTcAcPUkbC95kwkvUMfAy7nSYc7HJYbz1HynTKVXvGWN6HAIIGgJT13HVuj7tjr1WU5vnqPgLUaKZCF4cg3ex" +
    "hFMjGzuAbjFnpPkkmF64dkW48DmeoNTUvE3nuOwj2Wx12xUTdjadgQEPG1qtpM/J0wOy3HN1ekPT6evPaEV57OyfGSLLo+u8Rp3Vkhcfd8Z2kgMkGwkefP5KgDjj59quJNh08vs7zikBnmUitAiiTtqt+H4dzWdh" +
    "1RnALe7gaqvYOYWcu3SvakaeUTjoYZp1d8u7zHu2BPNGiGclkwpH2n8Sab10wXQv34zM+hZnO9eaXzfJYSLtnW03ZNCAWXQtwOahEgj1nvRPuSiWK1/j75uBT2AyPo5s7g4hIubqxku8AasDcPQzi+AHBNkRFbGD" +
    "duZOtxJMcmkxMqa4/yCrbVDZFmofqld0KtZwNITVLAB+9SmH3+kvOMDb+kLUnC9LmM0AAAAA= scanlines:UklGRhIBAABXRUJQVlA4IAYBAADwCACdASpgADYAPtFepk2oJSQiKVbcOQAaCWkA0UgIDlpHiQ3k" +
    "ag8F014IPbrMJuLNGwFF57PFLs+8xN/wm1I3g4C084ajd2AVfXQhv31IAAD+8l/wcWemcl456tJ5m+cl/FWULFxCpqJslTg7dtXiIduGIy/Mb69m9Wi7NSdDIXfIETcgsVOMOxnZLJhGrjO2p4Y5/OenQI771ZM3" +
    "56Vz7kqiqoSVo5kD3mtdcRvlfOzryqz25rFfnlCgxyQw7ofPONaheRuA9LCLj7ghY4Cc5Y4bzzAlSsefD8nPf2TDvItoas+jz0zUlo85yiaGogcECvURdbfjUwGTeVnsywv5MvB84AAA moire-drift:UklGRuA" +
    "AAABXRUJQVlA4INQAAABQCACdASpgADYAPtFkqU8oJaOiJXgLmQAaCWkvr6/77+v9r+Q6DPzCb/wUhqSA70WOvzF62VU5KSFZmLwog4piw7QBf5tMnQi6hAAA/vEJui70VJNZPBvNcvq/7Xln70MgpN+fYQ7BE5Q" +
    "wvslOBBg4aAlPOz1Ne+0G66MhqsObSfLVK9/P2pBFPG3nUIVCaVCkbGoECk0DtN2KhB8zG5y164mE1yIhYay9eoKjrmEcEbJVbcbrDKC1IkzKttiwMJM5onkQ6JV6o8jmy5rDBIAAAAAAAA== god-rays:UklGR" +
    "gABAABXRUJQVlA4IPQAAAAQCwCdASpgADYAPs1UokunpKMhsrEuYPAZiWcA1Iwq0SYtOlgxdGkRl8WSW+avQLlyrWn49EkOtR3xnBQrSM4r36ECWxnH0NxwN2ws389IgEVjmoYPbMFhU1QqWM7IdSgAAP74SGrbq" +
    "R0EJDxMg/M/2Y6hg2bzIKPpXbAMqW1SgOY5Dvo9mgHhmV391HTkDyIf4pCAF9rUIUs4nKgqS311No7lDtLicY517pZ5oPmml9z1wL4/YwuNV4ik6MuNF49CiqsKObfb4eKXhQddAO8THVgljYZPvfsXU42DQeo/w" +
    "apAYCsuB/5ezJoPujY/JAAAAAAA fog-drift:UklGRjABAABXRUJQVlA4ICQBAADQDQCdASpgADYAPr1QnUuzpSKhtVr8+nAXiWkA06Lb4Nn9jXXbQlkUIP05CBMYK2lBL5Cngz2O07468sZruCj27I34rBV6Ys" +
    "WzPZsYU/sWHJ/kMULq+eCxX/KesjDqSBERz3Y4YdIW3hWFC9UsartVeIGLDJ91nAD+bdaG0SwICkbhm0zkRuXuepyIXovygHeUb5WTFiDWhH/25BX9NELJz3/8Z3LbqzvxmgoJTjZDnscEvDKvNgIBkGlsY/xmxv" +
    "8CjbN4L7CBaIU0+TduzbFbEuRhSsXS4EyRy5j3OdAly7WrDwrxHByouIbglWLeGrIbcRVq5we1KR6B0rjeW1QjcQkziSaR4C6D2Ih2QoB9fN3YiyopI6EMtUqsVtvXzPVOQAAA twinkle:UklGRjgBAABXRUJQV" +
    "lA4ICwBAACwCACdASpgADYAPtFipk8oJaMiJrmbWQAaCWlr7GFQDoA9LBZ6lQEzGC/1m8R5GCwcI3hyYhStfBxH+RmZTbhvqgbDbD4AdlT3jDmlOYAA/vC4x2fjpocl0rxv7X3sEIdc3J/aNtW0/oQ0BwH98fbAk" +
    "VgGxly2Gd4wVm8SN1/+6+rUji1b78QASSeVOZ+kPYAP712vY2/havIOq5uWM9dHj+/qNNSadcfOO0J0BfRIFR4T+y/bJORRzB/x33mNizJ8lZwEL23Xkc6E4fg4sjtlufJKhaD6J31MgoNEWa2x1YCM42ibcGiIf" +
    "ycwMxEzDqbLRCb+FB37YDnPiBJgkaTubzdjMZai2uOMchNpgTEBqs/gSHpySGYIdDcsy1DoewlwOZlZeB9++r4AAAA= snowfall:UklGRrAAAABXRUJQVlA4IKQAAABwBgCdASpgADYAPtFirVEoJSSiorgJ0QA" +
    "aCWlty0oCTcQLLJ7FhedC/QkcYymp1nAQsJxU4GeZZmU2lgAA/u96r7ZO2ApEKUmMrYxQGlD2lUY9gMcW3HonyUOHNZatPJ6GeN/kN+3c98I6wGLkbd+Zq8oIJDyIxxqCy8humu6n5f2SrER7GPoIQ6RJay8hfnB" +
    "yYJKVymsjCwREkgYeesNSIw4AAA== liquid-distortion:UklGRmwBAABXRUJQVlA4IGABAACwCQCdASpgADYAPtFcqU8oJKQiJrZrWQAaCWcA1R9WzigAsplr2Ymjj6TKTS4Tmo+2dExLytySQiOMrKPWwavR" +
    "yD4z9AgKn496y56akk8eU22a9PtZgAD+9VLmJnZWXHpk0ntxmzFAG5whBQIz2X9K4VSX5bhJozflc7vilFqrQvr0dwyH0dS5QizuaIPtcs1g6du7d6X8EObQHJAPnL0PBVjnvi3XH9NS+kdnedKTCVujTP64mml+" +
    "NmV42Nnf7pOk70AxF0A589Fh9cP//ZrgcJPXxXLfuceB/iwu05G5lwzuq2U2hUz4wHpf82bK5Rmm3FBMnzwq/YIyTkamlrHWfki7xZdAFkE+KOle4oJNCQe5JKmAg4pAzdhfTH7RaaIFJgtTygo2DrwShswAUPyV" +
    "Z3QaThKnVwn9jZS3N57Z7yge1AMI/q/pJLB87I/aqzQyTXm6SG9t3vzNMkAAAAAA ascii-effect:UklGRgADAABXRUJQVlA4IPQCAACwDwCdASpgADYAPtFep06oJSOiKBqqqQAaCWkAEgn6UyfTGy6cNEVP93" +
    "WZf1q0nhlT9LZpvlfWEgZjNe/oTk97+DbXM95Z9yLMPwqDPCtnh+pxt8Sz/rBwaq4wuq1TYV8k7MqYgoUegnePB0+dlCjWEPf+afrOLvYfI1QKj/+7+hEaxE2EAAD+/dldOcPlC2z4XlY5LPOSewEwOX44q2B7at" +
    "RNKSvm8LylYqLUkRFrA8hLV4O8vCwcLedVDFdn3cydqHk4NEir2WJpKfOEHkTb8tn0CcTv2ET2rPawNpQvCVinOMbSjuho07osW4yQ93Fkshp4YmBVo8fzLoT8vkJ7PXJTBx/28by+dJWB2BVOVWYD0S/D55VeLH" +
    "ONTdyIyUf8hK+Gk7Ukuhfwk99lT042M6iBfOTQlBxK05lIKr4VpRgP2qcTx96nQ9i45pCuInLqptQjPTwUIBown09fb1Rx0ePNfxQI1hQgHD9wxlltIKz/7h5xm11XaZShuIczyrqomDhcRtZvTWAd2A+I8jpPbu" +
    "H7XpO74zaV9SvUR7ixT/iB21aZIJQUocoo4NnGu3ZAV3B/YJrr4epi+WN7iiliL4PxjUum4HuCrgqbF4hEuNGsjeE8d0cx40YUTmorLMFO4AhVEc4hT2oUBS0bTxieXCRLzT69JFjp3012zZ2Yyb9MohjXDavlu7" +
    "PRKtg5M2efrrn5Vu2Flty1zmko/dc7wd1xuw31UQ2KD30UwHkQx5nNR2TLJoNg+fHEM9pPoMo9wb1DdWMybnO1pTFbAz8kFj3bVPaDE+6TPmjQuAta7w9pfNB3eAsz5QxV/Efyf9niPetkWRLvi8LQvk4WAFZYW1" +
    "Wo6FprIwOSQNyEwwKmyC+/PqbP7xF8Lu98gBG7VEv9cH3NkR8lupzizJkRJhvyM8Nm1+UkLr7H/Hp/xlEojfcK7qVZHBkBGXo+iZ8f2soDljhICjgb7DKrKorFHxKN89aVOcq1Sffx+RlDwDYgRAAAAAA= halft" +
    "one:UklGRkoCAABXRUJQVlA4ID4CAAAwDQCdASpgADYAPtFoqFCoJiOipXQKaQAaCWkNsABl5mgVtN3OmXyLGQIaH4zdQLygPXT+s3sUfroUT5BjO+zjDkD77hFzTU/MdxHftMlHReu9loGEip7M4vcv/tqRUe2j" +
    "021F3RjvkLpIqKGYT1PlvgAA/vY6gB6oIyvVc19jxNdxShheYZ5LfENOLymtoOemsfiKRArnzdlvm9xZg1W2Cjh3SGsCLqIZrqUwS8As6eeL6aiBmY6PdvfpQUi3E1QoYrsezNaO82cLHn4ETCJuyx6PGigutoEk" +
    "3GayhB3aRcb8C2J3j+ytfQYQxOxg/zttLs0LE7cLcEH2soZTCi7u34DMrepozQU8dU14CDF+vBB5+mIOnKMO1JFvfOXVl5klWj4O8Af9x8cVf4hho7tKf+N0f6ZzGeDQBAd8cDhv5d6DqqDenbFTmpvnpowX7OCF" +
    "FpmQeYL07a9A6vnrPuEJLQACdMi/Ld2W4H2kn3C8oF0R+x1NsoZ6/9zaJ7ntvzm7BzlzAgkcIByOJPXnhDvSYeIt2lKrFu+3SgXoIBhyqsOm8SV0+XXtx7llMmW/WV1FjSWoSgD1buQIOBXhBO5NuxxXl14Mtfxl" +
    "Io5Zaa558nU7wk0DiYpGPYQ3J23GDU6A8jRIHkVWAAtgmD4FeXr14VAE03ZLHYD6AvmFQL5zaCgmaNLEXhxafMZ+uWXD/uUpVYTcn2Mkm5XD4Ux2VWn/Quqjla85SWRZ56qnmEDsa+v1BQDlbqXMOaEAAAAA dit" +
    "her-dissolve:UklGRqoDAABXRUJQVlA4IJ4DAABQEgCdASpgADYAPtFapE0oJSOiLBxqIQAaCWkYn557bAP0zAgtJvliRZ1+DuwGVyDcZCMnjkOnju5f+/dFJ///Zx+uP//9y9dgEVTtKdAM+CoONGmVeTFSWyW" +
    "NJHIEblD2vWMw5wIEtenuOPRs7iNnDqOknSIDMglBi4xbmKaN5AfK8lZcmE3k0ND1hnG+CBIkIKfifdTWYsyQAAD+/6uY+MQPFDWF9vmkUqSojGJUbScCDjGvgeKm0MJ085GUMTbtjJfEEFrj40NL7JEtpGPBpAs" +
    "CZjhCtTDKnBHSSMEE7nrpEWZY2D2MN8TGHuibLGXOgZ4+GfXeVRopqIIhA3Z0wSgxQY0DKfKWsIGffKB1344vP7I7ayXYUcLE3YVkesGxsCFxFES3YQ1wpDzCgDCSTLte8x57GvuWLY4hpq89Qsu0PNDgYyIqVLM" +
    "t/ATayqylFwLxQ+ulNDpH1ggoxerCiPHVAcil3tgvWGaMfrcbprcgMvqA2RkRjbPADb3B1mmLKZ2qpR+OhRJaJxlLogLAnCBg/M/LFWAYGdWo+L54/uxUAoALq82S1UKZOZYOJlFOkBhmV7G4mzfw20dVJj7GOh9" +
    "xmrhqad3ehX7QxI88kCXTibxSmJQEwOoshfQck+gWw4Lg/CibKiKA2VikJvoj4dUvlmKSIu4Eyh70PkiSQVwgRfdDdpKVzEyawavN3pcJ4dstVZf7Sd7nBkrAtgjUN09JFhQ/ckcTyePt9TbOqPDSGdA8KX/1E4X" +
    "fBp7JKyn6tF7BBEEt9e0MVlogYJn9O+0Y2TdVQZ2rsqmTf66AoKTc6GdBytwLN/c2Gy80IkVYsK30NAISZhlMH53iURHGa36bwZ/Gm5hyUSiAv6N5keLLxerdM/mtL0gmsNLEOcveu5jfmBORGD3CpqFNARS6+CU" +
    "IpBo75nw8NEVhUhJnqZ3HdQVs9037iAKrD91w78ME76qau/xuuWV+Ze81pRZ1YiSStZyHoshIm2z8V1MweJj/0x5aGBZHm1EBdlAOfR0BJiPjNNDAe9BmziSeL7R42jCwsTHy+zhb4yOhkGp9ATicy15pggIUIJW" +
    "C36IK8WnzPdXTmTQHPE2ymeyKhKLHUpGlcCvXcyf3uww3V3V3oAsupXAD7bovfbeJ9oz14y1s/OgYcDBDuQCBIpIx09DeWsay7I76q5E60ZFMx0w1l25SNQl38st21GYkjZoUHNJNbjN+57G7qQPFwAAAAA== sp" +
    "rite-sheet:UklGRhwBAABXRUJQVlA4IBABAADQCACdASpgADYAPtFipk6oJaMiKrYJgQAaCWcA1cQSA7f4ri0L/qo8h7rFHMl0pPnNx8LPYBAi/EMmBsov8bcwFUWfLATPiW+AC+aEgnPgAP7xjNklCC0n4hLnF" +
    "BGvo02dyCm6/f2kpVaY4YiezCSf9JzsuzYlgY3t8PTx7lBv4hzPd7i3PqjfUkbspTy7mTMGmHcQEsfEI1uMvNjQ+MZ4cADVnm0pwFo51h74skBW71lLvpUwwAC+Ba9+DEXzGvfw9FDaRUpoNa4HJLuF4kQUE8iT3" +
    "Yi1oZluqcxP0jVRS/nr7v4bCYrM94rgxBCLU5jeR0wwUDOkQFYvEVh8kcZ3bZ+jozkh27bxlQbYAAAAAA== frosted-glass:UklGRmoEAABXRUJQVlA4IF4EAACQFQCdASpgADYAPs1apEunpaOhsBQMAPAZiW" +
    "kAE9o4nehsGi4ns2dk/8BmfftP+d6Q8ZXjkx8czKk0Ox8fOzXsfozS0IacexrdC9UObNMMmzF0+tiwKHg14NUwQFR++wF/C18tr7SmHvZoFdfcAJyyvcua+hJBgfiWOdPilOGxJ5n1aLMr+tIKTVaOTi+RCO2oDj" +
    "ieO9yUjHynv+GyscZ60v8tBk99weML0NM3/a5zKRjJKBEAAP70b/buWIH/9e8Kt+paGjqHtWK4k93vBI70UncKG5VyaR0LdQHa7CU+6Qz3Lhtoyt+A8aVTv7n0UX6PC5oL0Bh0f+A8bo7bxMMSuaKJ0tPrv5o+ep" +
    "0+00Huz6yZpbDnBOPo92AYZVasYeb9QN+fG8qMzZkAak8+MScpq8TjI9qipOsoh5XBlAI38Jw+6h4590oDDBdh4WYIvPE2g3aE/y+MyffShfgU21JwHFmdWIO1yK33iK9EtS2nb9GuOl1SBN1resKY+e0b7HBkKH" +
    "vXkrUgl5cZXtcVz3DvRZmMuEgl02pWBf9aZNhqg2d24tr/y7VnAxIFeLDF1j+9yWNXCuWQRt/PcTY3N3hsyHIwN7JdFx78LAfoWdiyq8koSznnCxGqrUb9L35U9AYn/AutsTxqIHXF96ZDgHhajTWu4zvWfwxjhm" +
    "7Gc/Z+ekYq0LENv5ij7esNbsX2etZiRPEZ+muKsvZG/8i/hqJfc/+Th7kjEFwAIcsqfWg0+rUs0vSvUlyK6RkDujgyr5Dp7CkT7Snm66qv2vGX1B0heQmoDivqe9QuxoIncSC1bmbvV816HZlMXWD4pt0OGS72T3" +
    "zUyRc68KGNPC6c0uM2nJw77T54uoxQSjVpVx+dcEPJM8yzaE3yljFDkmqMzG7EE5FBBm/Bh6gXuIkVr5R9EDJetVBK2ux7UtVNXt7FIFBGCAyaQF4bpoVzOHTYiQUu+isQK9aJqaoqUqgxBM53bXUAswt69CgjIN" +
    "hMHEc6htOxgXXwUqcykOSTx8C1MoupCWz1hSkfBlbFs/o+tuaVBujPTQd/OIHY0EmizZLjIbbcCUslb4TS1/r2hxN7Z/2ek217hPRUrQQ0n/9J7zrEHFvVkpSdAPBxBgjf/t1s0Tai0XxcQ2hvinBsFMD9WDRSsA" +
    "ksCGvgOLtLoN2jIpENse0nR2tTspqxoSfGKK2zZXJk9vujt0QMNuEpZU5xKJiio0w/IBszgAOK0AHU++kSVN+tq1MGLS7LychaR+uEr0KiQ2lhNYIOedpt69FtN3zdZJRSeTJPw4lM8Sdsija8DIkkkEF5Brisvw" +
    "JuhdEffNH3sBN6z/RT7b9RaUq2cphRGAkjSV4t1cvhBMCFdL7ULbsvOlaubhRFJtvhEMpP+ooYfMWA0uKnmsDQ8Ep+T50AKfvPRuaaYGgQVaismO/7mJdvbpN+dWsYMPNnWMJOv3ywBTLngow9Jh6/FMV9lTYpCQ" +
    "avNS4m6U3UAAAAAA== gradient-border:UklGRjQBAABXRUJQVlA4ICgBAAAwCQCdASpgADYAPtFepU8oJSMiKVSbwQAaCWcACBXOmhiOMzyMvzpZZyXY6PZBn+M5OksR/VKSZiSQqtzhd9tarbpyNYcTO5p/q" +
    "nyfdn3Wkz4AAP7yXwJEr+gO6WlNFsI0ZaCumifKdjqxmmdWqpns2c255J5+pLoAOWoamzCqFWK0I1OR3ku74YkjMzGCsyS6yjXoafFq2aVmHIFgJqr8djyvUjSSQcg1OVri4Kv87/6u+hrBkppxM3ADrn/Pp1K9g" +
    "9cyTQkWjeBjY4bduWJw4OwJva3Ad1Of+RrP4RkRH6ZTKGT0zkfJcBCpxhxBIgtwLthr0gw94wHVrCn7nhqXgAVfsSxzvBcKiOqgxgyll/OmJ0JKOnC1tfODEDA1YtOgDLQtmAAAAA== notched-corner:UklGR" +
    "voAAABXRUJQVlA4IO4AAACwCACdASpgADYAPtFaqkyoJSQiLVmZuQAaCWMA1RAVEGcQl6jCCSiH7x2kTrQr4HT7u5w2yBowa78lQUtRtMgyHSHVIImj6prlrRsSSYAA/vXgwD/uD6sDTrDLf0aRn/5Uu1dBU4Dku" +
    "jrk7tLSvWe5C9LkbKyu5KG8Pp53CYqpPC0Nrb5DaCYb0BcAFdBj5du8sfqS9GHegP4s3oy5LifVJOeMjymbb9coUmxMOrMWIMpXgCuuXFvtHiv4m086phH5TwAY2UB49Ic/0eiIWIPpB61zz002XapG8OtVWozoj" +
    "4SYQp16oc0KJYIAAAAA accordion:UklGRrIBAABXRUJQVlA4IKYBAAAwCwCdASpgADYAPtFkqU6oJiQiKVtpaQAaCWkACwOnT0j3I/3hfw3n79Ukq2ep96EVcpSUfFp0XQL4PDNgvtnXuBJWzUYtoOVirx6kps" +
    "sgO+o0XywFRKm2mMhj1AkoltaWgAD+9SfBzmNtCNbSTDZ63OATrgKRb2csfaNRu107lwJPQMMcWdJ+TYJsFmj80hmAZkKK118199FEvOuYIS7iBDywLhsbuo0TpzozUrb0Mklgb+IWLZueiR5dj/M6iUyCJ5KGM9" +
    "pr0aPGP31qcDlIlVgaHRwKgkR1oXPZg+kaa8XeZYwuHWgGIiyVBR30P+b2/qfCzkMl0OkQI15KiQ1SLpDuiT8t0BRCSUT5hg2DJwG39ZRYN50owq9aPcrU1GeRClw5EVYgKfrgIBALty8CHH41q2Dzz4TOSrAWRQ" +
    "2I50S/RDSs6N7sXngvHqGSEJc227Cv7yA/R+G4AS+z9Jj6iZZqSBGaW2AK5w4JDvsHTnLbCJKA/lcki4RN+NxDl0rrI8yIwM06W6lCc0WLB2OvyRRAOKZglkuA3DNmm+3AOvEPHMAAAA== tab-indicator:Ukl" +
    "GRq4AAABXRUJQVlA4IKIAAACwBgCdASpgADYAPtFoqk8oJqQiKVkoAQAaCWkAAF6c5rogLKp1UYp3J9dgujRC0CAzx6B7G4puM0N/sqg8AAD+8QmH6XKxfwgZ/7hBozxsSEFwNQgVzwHA0rgSLCuLKiY/qm4x37j" +
    "GQ2qMHkkTwh1R5+EZptbiLPbQtJvExDxcEVMFAjRvMayqw1/A3IkeJlcG6XyhnigAk0SeeU8lycXmAAA= gooey-effect:UklGRn4AAABXRUJQVlA4IHIAAAAQBQCdASpgADYAPtForFKoJiQioWixABoJZwAD4" +
    "3jZCiZVMmGotkHyJv6YvPK81Z4AAP708goFkDGqdPPqLqOZYl6b0e8gLFDkFxEW61PqljfITgZOmkfjSQ/Ev/ut+9scfvpTXw/m69d7TJ3UwAAAAAA= stepper:UklGRkgBAABXRUJQVlA4IDwBAADQCQCdASpg" +
    "ADYAPtFcqE+oJKOiKBgJyQAaCWUA1Z0hW//UAbyWjgchusWYNBb5J+RGOJCEvHE/a0Ab2jq/mCFX6no8Kxg4BsNPNaHEQAGw9Pzk+0ySrFAA/vY6cTwoPvMG9iSS/A5EPm3blfXxW05Cl4t34V4e/ywPQJiu/MYK" +
    "xCFsXtXKHJZybv5gRF4/ITWM4jgB5JbRNHXUcwO4N2UUTEcLX3bOW1Z7eDcPpd0qoVNVEytZUAPY8Mt1jTOagPrcNwEHxevIUWdWNSNkFuTp2fmIWRSSHTkpFjrRSegg80hn4+KQklaoQG1+0inXtDD8x+P+FnX7" +
    "Lc+rK1G6abd5eI6O38JH/NgjUEvHnF1ywtC8YFsFjUE1Zxfyr/tgH7hU65evHU9Z7E+4Zwf48VU3Y3kb9ISW3LAAAAAA story-progress:UklGRqwAAABXRUJQVlA4IKAAAABwBQCdASpgADYAPtFkrlCoJaSi" +
    "pXQJMQAaCWkAAGBcZ3RaaesElFRBsLNNXwEVXo4Kj9hAAP7y46f4uIthpAWuSgnqm1CeLLTdnIBGQULrHbEzX3H8BMfHP8b4f/YlEcSUnGLTnUfzXJbyE99r1bnn00QXt8lwRzBHdGhRzepnAGiK78m/h+a5r2yp" +
    "yXCO1v6Y+429zQpBH4dJTQoAAAAA dot-pagination:UklGRtIAAABXRUJQVlA4IMYAAAAwBgCdASpgADYAPtFor1GoJiQjpBVYwQAaCWcAA+RRlGYG1OVMBkjzQWlFVCs4sPPtg2bekIuIPdCQAP7yYow3OsMu" +
    "nhLYr6phhEIgifXP09fxYx/Lc/slWJHVo6HC3+M7zTb31odO6gr+j9EiLZ5LdR9jidIDsJkxOccRU/73pi1bQVTBhAds3vXfW8QthfQ5OCr239DH4fwC4DdS/3ZLRRamBtW2agbp22mQ41JHJr82Hrxyoc3CUr8q" +
    "pLxqgCg+EAAAAAA= ruler-scrubber:UklGRvgAAABXRUJQVlA4IOwAAABQBwCdASpgADYAPtFkrFGoJSQipBqowQAaCWkAA+U+oB+nW+ACxD6Cfn5YOo/8KPJ/Qi8WNoAEphFhzEY+4vgkvcAAAP7z2AEEZFS4" +
    "630LobV58BpZGxcrzPkUewO/Lupf5/73duAbvVjPVmHUG++7vbjY2NfKPNbTK+ykyGXsrQHdnIt3v7X+Bko0RcgVfSOrCZhozN419T+iDLzp6ZYVx2yOGczFqxsb+21a4h3bSabXAM6M74xb9axOlYfWO+QipPUo" +
    "OloDK1EWUNZGpyAn+mBJj0x7Ud+XUUVUelqesA9JrSbx0TTQAAAAAA== radial-carousel:UklGRpAAAABXRUJQVlA4IIQAAACQBQCdASpgADYAPtFosVIoJaUioqhhABoJZwBTBA/4BvxahQKHJgRumpO/Dom" +
    "B0p9BCVvjaAD+8uMDRfsw91aA7z3XOhhZmN3aFdlVA6comXtp0m7xjwZ96PzDjKZ3h5AZWXIGydjToMZQ4vNe4fJFFe2J9TLpy1fa4gXOTg5aPRgAAAA= modal-pop:UklGRqQAAABXRUJQVlA4IJgAAAAQBwCd" +
    "ASpgADYAPs1Yp0unpaQhsAio8BmJaQAAccCTdqS3pUlGz36Vq4wfn7X9zQhGX6Gy9s2RwiKiDyRckSMgAAD+8l6dR508OPgyFRTNm+TYsZnsZkyEKUAFRS2OIatMjrGshnSbE6axR0guku3hhnN/1QrXWIdQVRjq" +
    "ybwqmAY72bS4+QXWpGuPpQIechwuJLKgAAAAAA== bounce-in:UklGRqQAAABXRUJQVlA4IJgAAADwBQCdASpgADYAPtFoq1GoJiOioqkZABoJZwAxQCoOSIsEGWjc0UyCAVjK8lawdAAjAhRc6pzoAAD+9VarL" +
    "l2YqGprpWCfpTg1UtpMN1yi9G6+KUuIschRMXfn8sJqBUX33JT062Nje/QjXby3u45fHgjlE8Rb/QuGI/wVzAMLCU1F9BLjesQm2FdDtV/WMccE0rFSxwAAAA== squash-stretch:UklGRtIAAABXRUJQVlA4I" +
    "MYAAADwBgCdASpgADYAPtFmrlAoJaSipWkxABoJZQAAYIutkLCLRmDKLeZSYaleBlQFNIV1epXJk1pRdfFA66sdPX8AAP70FmY+zeTQ9SSESM3zXjRwMtE//Eu3ep99htf/g42z3a0vIA1pfK93u/5dhpR3cbFSc" +
    "coImc7XkThqGc7u3+16qn1sJaXCO4VWn+ddDqrRoDYzTqfqd7/mXCENLpq3cSDh2LXrXeERnDYoIUSE+v+UYhLmlYeFLxFYCx3DoN4tWgAAAAA= spring-easing:UklGRtYAAABXRUJQVlA4IMoAAACQBgCdAS" +
    "pgADYAPtFoqlIoJaOioWlhABoJaQAD5YlIJ2ukUGoJpMZMGF8rJryoGQsBZseceludjrWzAGAAAP70uoTd4TICQl40+tya5J3jXR8lkcSdXnZ7Ps56Co1hkkC8B6xeI3oSQ7jra6ZxAbnEOb9QKmqj+n2ntys1lo" +
    "G1E7lBUrXItCSSYbHzdM8jb2TUnhXP+BRpc3gUMTVIKbS6wPC7OP80p3Pkv2VBcEx5YpWpFhsf9anlreCqfYBQTD6QQ60gR8xngAAA drawer-slide:UklGRrYAAABXRUJQVlA4IKoAAABwBwCdASpgADYAPtFg" +
    "ok0oJiMirVs5uQAaCWkA1jAzgSzhbJzDau6tlyanYa6G/ou6YhJuad+J2JZmPKp3ZboGUWHGgAD+82NWaGhEWX8MtfB728lE2x2x8BNQEwRwRjGhuJjXFg36wlB1qMaBLQEgN04Mn93mQemL84K0VTJ6rMS8hxMb" +
    "vYV5OX2jCWXvQdO74GWC/8SK8thR5OFJZA6IC3a1EOhHYAAAAA== toast-slide:UklGRtQAAABXRUJQVlA4IMgAAADQBwCdASpgADYAPtFkqk+oJaQiJXgKyQAaCWkACPAdgBXVUWLUb8xVvk112FChvL49UMt" +
    "gPZ9pIDE3FWRu+uu+v9leOPrkAAD+9LgCWqPoOvzDYW4bEtnOefUZhOYn0gSROa3AmNoAF1gJ/ncOQttvS/ldR9+Cz7HhhEShacXYGJnVvSWH8RVQsVJrhTxe6zN+XiGSxfDNT/AcQtyLAIsmkC54KSnmHyH+ArV" +
    "j04UsGxqnajO3IyMobY/3eanhexBnG97+KEAAAA== tooltip-pop:UklGRsgAAABXRUJQVlA4ILwAAACwBQCdASpgADYAPtForVCoJqQiprmYAQAaCWkAA+Gxi2zbIldspjFdc38cTSvEZqB1kbZ4sYAA/vEJ5r" +
    "8/GT5ULVrG7Pgob5DOYLdjaEOipreytJzT0L3WaeMdVmv15vPYzn8L8TkCx/grZh4WfQfRN2eaO//H/wn+GZ9rYjTDXc07/S/y4a1HLtDFf5cO7oHPko4LQwtPWrGNkm91oh4oYbW13G6pBIE8yILr5E2dUd+bBy" +
    "KrBuV8AAAAAA== pill-expand:UklGRqgAAABXRUJQVlA4IJwAAABQBgCdASpgADYAPtForFEoJiQioqlxABoJaQAFEAIoOptczM1HPIOuavlq+QK8FCqVMNNiznUT6f0cAAD+89hfLhidVODa3utSrMiIKEYiU" +
    "MisOCFjAEmvOoUmOl0nXIiydWhHaiV2ypskd69WbA7BwHhVl9etuBRvO81DiFGOD2ivM6Q+5e8+zENm2QnAZHbu4TUOsjxItQAAAAA= toggle-switch:UklGRrgAAABXRUJQVlA4IKwAAAAwBgCdASpgADYAPt" +
    "FkrVGoJSQipBVYwQAaCWUAUwLM5Ih4R4Ke2RHhb/n5Dd2MsM6m5PKPkWiCntOAAP70hkIFHuLs2ZbP5OmCccFErGd+ar97vtUi077D1IdKDHijbIDmSkR/yssQaekHLAmXqzs7WWH5Tmf3PQsmqFSW763l2dPfjk" +
    "dI+JYbsWgd+P7NyVG5j16C226pboMuYvz1heJC5R0Irk+cGAAAAAAA checkbox-check:UklGRhwBAABXRUJQVlA4IBABAACQBwCdASpgADYAPtFkrFCoJaQipXQJmQAaCWcAC+02gFkB7nEsXzA4A/uwLm831V" +
    "3MIPScl8/j1Um7kWtjddua07wGaAAA/vTtw/U/tTM2wjJUMBQeaz1CWrVp4LFolL7MQHnnucn4LpYYUPivs2fl6uJWdwmb7r8t/XtlKc63BiB75rZMulzSpsNL+p9NT5ZwR0YfvWQ2wV5RnMrco/X9CaSv+25FoZ" +
    "SYgOgdKoIkyl+6V9Bug2+TAFt7x0j6YMbcCXMI8d/xha1cRCOYzu8B6OkAYPze7FMUy7kruCE+LzIXxIkMK8mJBVZ5fHskx3OulBObQAVUtWqxviao62L2lC5CCKL/hFtA3JUUAAAAAA== star-rating:UklGR" +
    "iQBAABXRUJQVlA4IBgBAAAQCACdASpgADYAPtFoqVEoJqOipBqpiQAaCWcAHaWl7B5Ae3H+iF84QEvHTkRDDM/jVKzxtttASszCa3DY/hhpAr4jr2C62QgAAP72OkJHuZMLJH/Rqt5iCGmk7ddPF8i25KRu6tC+E" +
    "9JMKXECiIcZF/qGytO2v7Mao7GxxndaOmXye/8SPNIoSvmdv/80jldCQF5/S/6xwPtZiYUD2H9r9+p3dDaQ23p1Ce7UBxRu3v0COIsxJvLs4pn2uLs7gokMGqrwu5mwutcMVSaLVQEtJHnNSLOmo07eSr98gzoHU" +
    "MzX2ZDY9A/xQaC7JBNo2fyTiPS4jJyW1DLTE9CzoMS+yAHd5rYVnQP+bMQXrnIbxW3nCCCQAAAA theme-toggle-transition:UklGRtYBAABXRUJQVlA4IMoBAACwDACdASpgADYAPtFWqE0oJKQiLrF8SQAa" +
    "CWkADn18LTCP2MPDa6asCE9YwMwDjMCln7H34TxeF8xIE9IPXXUAYkFhkevSKbP+2ZiPZt+Pf6VtYgQENFyC6poGNEfTs+a95EY/TyYVjsb4D24wQAD++b00nWev+Zwb1AH86lPBZd8T5zmCL+XRqBdMaa0u9WW6" +
    "+6xLefLtschMU0yCdBAhbmaFcLzngPKEr9JepuFIvtyN3x48L7X1yv82GmOWm1Pwk0fkh/EVdQC2/AIp06RdlX1SfGRi5Iqy7W5xo634wGtmZpuf9rut5ajEgFQEO+KKF3w9HNo7iBkihz0gVw56sl0jF+pfFi1A" +
    "yDzWCtF/8UVHxXwRdPZ2qpommaFik3+Fd4+ZAJix1N513ibsfeRTWgmKurda7HfH6aPEffks5qULYOzzXTd2uQ0ajXziIwfqFih6ap95y0e2aystVQXnL8utVqWO8Fd5Ct37JxFMm5kMvtaY/RtZIfvzM/t6zUdC" +
    "5McbvuC76HD/gKmNr4TOtn8WIU+KJRgO0eXZ3+1LgM4Zpo/wjijsZ3D8cFcmh41SdtrNW8c4YszV6DYR0mg2s1BcD0oVgAAAAA== equalizer-bars:UklGRn4AAABXRUJQVlA4IHIAAAAQBQCdASpgADYAPtFo" +
    "rlGoJiQjpBqoAQAaCWkAACvOSH0izYHJcl0N/drpJDO/0PoAAP7xCea8TLQJPwR0QhMuc5GjX97UvzdOavaTbaHfrwbYAAGRsuGXx5AAlMlKGnOJviH0VMrnIO/S2BjHgUAAAAA= bar-chart-grow:UklGRnAB" +
    "AABXRUJQVlA4IGQBAADQCgCdASpgADYAPtFgqU4oJaQiKqiBABoJYwDVzQAu0Y7Aa2hiuqK+CtMcq6gqiwrCHZVsutA7nU7DNtujQQVTmiRNqPnE4h4T+tpO15Rw6IcejgtRYIIZtuOXuCY8AAD+9jspbGHhnCoI" +
    "yoxA2AU6RMMqpE4cJKmSfxM8owD1kyX6cvLdtm6SzZ6YTUQT0TzAMpNEYzNWXAVWakAGKx0uG+9y2KGtdj9YJFGauXpsoR1hK9ojm+k/cmvzxR6GgIHYxLtaIg/VcrrY/lF6FiHPeSMO0CqQr1oPq/ht+/OUN4Dm" +
    "szQR46CmtHy/evQ64ZbN24pwY27XH0SqX74zKc7wjNkPrLojj+JISrPQMx22WcpaFiNff168HUg8qzFmv3HICJv1961aXjXzjjqXACzJymvIqj9vq5iEU8iAUI9gedIRkWgzqJm7Vjjh5TRAXKhGOPTh8PGOew8m" +
    "0kO/51Bhg0RAAA== gauge-meter:UklGRkQBAABXRUJQVlA4IDgBAABQCACdASpgADYAPtFeqVCoJKOiprZpQQAaCWcAHaML8GAG5YCfF33DotO61H7Oa5lMgSoyiMj9A5/0rrpgAyHssmkDOpUExVVVCAAA/vW" +
    "DKNRo8Ut/L/1gsEv6agLsUQ3BQ/tH6Nhu83lU3CuX6Vmf/U2vODaSDEnI145yy0N3wUAgxoe/oNJDLUHlAE8wW26pgouIlNvDxkniP6z3gfz83Yqf8LiBB/j8eJmcHOq6C9+qI9OXMEdegildvha3QDKqDxRFioz" +
    "3/05yz/P/KE0QIeuIPdsPYxU6KkbhLizbfcateM9c4n1MPxE3yhMNOVd60E/4lMEAb60CQMOqA1aJcMZklcZBMNEIf+SoffnHN9x6oLh2g1Xs0to0EeyDW7EMCqiESIyNkbbjBqGGLUw0zX7BMAAAAAA= ripple" +
    "-tap:UklGRo4AAABXRUJQVlA4IIIAAABQBwCdASpgADYAPtFapUuoJaOhsVxIAQAaCWkA1X2LIuHlNBBxtGGIlGJ9YSKycweNAS+PBadh0c5oIfKirXKo2CRgAP7xCI5RDfgXUyaXPfnEitbkJY4oJTS7pP/QBCX" +
    "Z0T3zB/IfeFsq4FJ+/V2/xalTudN0vjLfN9iKEfTIAAAA press-feedback:UklGRqgAAABXRUJQVlA4IJwAAACQBgCdASpgADYAPtFiqFEoJSOipBqqSQAaCWkAA+Qg/JCLU57td7o6spMnvwC1omUcZlnqwQa" +
    "XxYSD4ANgAP7xjIYYKZvR5qctXncMzQv0PkNJ559TQoFFNd+W8uvwZq2Zh+L8zxK/z8PpA+KsmsolNa75fN3X5XHixb01cxyqsoi9nr9n39wq20Kw90YBVEKoRwpC7CWSI4AAAAA= stateful-button:UklGRq" +
    "4AAABXRUJQVlA4IKIAAACQBwCdASpgADYAPtFmpU+oJaMiJrzKiQAaCWkAA+VrwAWgvfMRQrh9Im4Tv9guh02d7UZ2NVeuhDCdx5Mv1ESSQ+rFvRgA/vJkhYf6n9zZjbiHGTZPw0PFMOVlk7ZNjiCWOFy2qnv8su" +
    "SwmeOYfeKsoz48Gmwn9a1sKc0maDIE8wVEK+spHWi+XUM/FJYg2qVp4zbbf6wu9zgGu9WABtDgAAA= copy-to-clipboard:UklGRvoAAABXRUJQVlA4IO4AAACQBwCdASpgADYAPtFgqk+oJSQiJrZqiQAaCWk" +
    "AAD7Vi3mR71zdHsjrxfEie2VwkymOR4Kf6z/nQD6VdI9cHM2UOc6DwAAA/vNiCdVyXbRNQB6r97s8AtLcs2z6GPSpjsbJie4vYoqwl5I/ZS54gy2Qi6JldS99Y5uDMQoJE24lzpXSb7g29+rwOT3T7D2GLSwyJ7S" +
    "nHQA92yC9TDBU6vujBbdZRwUy6VhAs4x9pcYHQpjpwTrCq/IXwvyGEqawsH5Lc+mCTZMiTp0kNXEsyVr6NYhBuBs9AA6sTdaN/YESkB80vWDFG3NA1YKgAAAA stamp-in:UklGRk4BAABXRUJQVlA4IEIBAADQC" +
    "QCdASpgADYAPtFoqlCoJiOipBVaSQAaCWcACBwun/MAIw3trW6o9GxmclOuJ2CARsozLsVwIaxj2uj62NJvZ3cTq7eCoDz9yxbi+MX+ipfJxwBChwAA/vS4Rq0TLohQLE1OlNQS7/Z2nUh3SRomQkN2wVpg5mtvX" +
    "CKB3Vnmwok8RMeOi1cOz7+vFnveHT4Nw3ykV20F6Yrcv9RcRjA3/cudiq7Ae+3jAQueJg6GSy//XjFzgnA0atr0HGzwjLHphkCvqAq6VjX3vnyu14VV5F24ZFO/4HNCtnPMHgMqhyGDcu9IhgYpQOtyidz0I7xz8" +
    "EYB7B+swr3YjLtLSSAwDyKeKGEm/7pczu0fb0MetjDYmMcA4STzuafvKC4q4oUz9BpFi03HM+H15BUmiOye7CY0nVBFBH5b5UkuROzsgAAA confetti-burst:UklGRpwAAABXRUJQVlA4IJAAAADQBQCdASpgA" +
    "DYAPtFoq1GoJiOioqkZABoJZwBTAFv4Jv2/z/Ngbf0MotFoSw7nLAW9RaIKi04AAP71VqsvJrOqSMtZ7uOLgG/xXlANr1o+igAPBt176eWp54xz/v793iJbhlyUEyy8bcL8jW2QLacl+SV2WvaloG9jBn4sHpH0N" +
    "ijJGtniNUENFY/kAsAAAAA= like-burst:UklGRpIAAABXRUJQVlA4IIYAAAAQBgCdASpgADYAPtFor1IoJiQiorgIYQAaCWkAHaAEQgFqH2JlUPfNXMEGRxuiXqpaU39fe/A/UuAA/vJj3yGTpaY1Vquzrwqxw" +
    "Q86sZP/9q7TD6MUWvmNvwN1Y4TpGrs2WW/7potYtHbDri8SPe+rr0tOpmeuQXYyUXXGkMIt0HhjgAAAAA== prize-wheel:UklGRlgCAABXRUJQVlA4IEwCAACQDACdASpgADYAPtFip0+oJaMiKVbZaQAaCUAa" +
    "O7GOADeTH1CYa2BBgSoHuoYK/gMkmg4hA6I4iygQhSX3/j08XVePPVGNi0Ut9PZvMeHRE9l8cGRjgfY1tUoEmQfKTwbKJdBC9oOS5vEULgYwAP76WgDmcgQCOOPjzQqRNbExpIxHNmxD861y1D511BIZ5j8pIvrn" +
    "z2Nf/3hwZ5PGBb42x/hdP3w5qxFUXVH4oS2Vmj1te+x9xzxzWoC7gG3aoOeSUVVETyt9do84WBmfHr4QOFMitDdfX65yKBd6IHnWIY+sZCQnf0hy47qcleAf731sixSrY2c/egnZ2k6c3dV8oDu/MTM5RgEzLR8v" +
    "DpGMmGfgzrQUEXd69eifroa9QRtywHhs/JO+Yaf7RDAWR42G8VZVS6EO2XOfMRzNVQyJGN/g6amwj7RV/d12E3iSOn9dRVfgE7gbnx2Wvto1Czx8Ny9unb9NItZXx/MZmaLpyBGlA0E2PSftJNX4Q/Y30y5Qi5FR" +
    "oS001IWarEF0AYDPgI+iDK6KCAUd4BnSEEqvqIwN//5G75U1L1NGJsJmKRBonK47/j8iy7KixrgYsBB9SfF+88TJD7D2Yb6lcXjaBJ2rXDNOc5PEbHucHhBJj4iDxWGsLwP1d8mzTw+Pc7G5duLS7sWZQFbLnqbI" +
    "Ff6LpXfXlqChW68iZpIe8zz7IT7Yn4tugj25C0lEZ04mJBdkep6G5RRde/2wQ2/D3lEVDolp9DR1AXiMwwCFErl8Abi25AYV1+8oAAAAAAA= scratch-card:UklGRqQBAABXRUJQVlA4IJgBAABQCQCdASpgAD" +
    "YAPtFcp00oJSOiLrdJOQAaCWIcNA7UCgDpaiIsMpT6b6zUUg84b1pQwoqUSVO3ZTQmdG8+Z/6KS88zGTpgONCqtwa3Rww6i2/bAAD+9pHvsPhVvI56s11pV5hI4y1C/nOKPp/1D9pvrSqWb/X3JSA75Gx35TL5Xo" +
    "doR/JY5BpMoB/Nwk+t+XNj9eDYnNlAqt3Ml2mlT40cq0hvodKqYtJ/WVjDt6qIqDh6+YPDXeVaweXq6hRRhkS1frRSGOPHmSZmQo1RKvXabnRCMMYg1BEB4gKXivRxEzW0VNC2BU/XPv+8K3I4eqUijyGB7O/5Ro" +
    "J2jNJmZBQKIZE7PdgaRESqPnIjqs+sIZtHiUrxQt2Fz0ndxJ/drXSylbc+xqhKMBO3i2tYiaaOl0yD8Gmg6AQvBlAIPGC2Ltq8UKtirGRsRIbft6Rs1Rl//lIaWyqdy8h1xy7ReyJydq7icI0Rr1mSq7/jSRemex" +
    "BFB7anorWhG7JBpf6qFoUrqUwqxLNXmXu6TxW+B58dnQuYAAAAAAA= gift-box-reveal:UklGRkgBAABXRUJQVlA4IDwBAAAQCACdASpgADYAPtFiqVEoJSOipXQJMQAaCWUA1BWMJuiyn3aRPTawMBbzDyCLf" +
    "LAy1cuqknZmPT9gb8fIKa2wNFUjtZxAmpWAAP72OrUOHv8Hy4unQy8rnLX/4dHdT6HKDuyJtop88tnjG5dqggPFp9uCx8J+JfqkA0AVGOBg6NogbK65HAto3nuwnYa4svGSCm8h+qKq/ivXx9F9AnxRTtI/ZnIk9" +
    "DI0Sj8WK/Vv0ZrMn8MsMkKtH+N+hVQwXcwJo8RKadnohgf21KaoY1fajb7WXpKyGWN2nEl8JabWh02XWOEdualmp8vX0ig141UOTM1Nbl9ALkos6Kf8tbv+5d0tUL71D/uLsDlMcumpgYTJialQQqRqKSocwcFMV" +
    "78/KDavAB2ih2Spy6rg1KKdmR1e3YltCDCAAAAA floating-reactions:UklGRvAAAABXRUJQVlA4IOQAAABQBwCdASpgADYAPtFkrVCoJSQipXgJMQAaCWcAUwLMAIh4Y5LXIOTGxrOwC2bBiynG4ftUG24Ad" +
    "o7FKLuk2WgKzLvQAP70hlNL9vcf5JR4DWqxavu3BXpS13/mBVw0BejgaTvl8KiVlu+Yf2J8pWzJAE/9gd5qk0uXO8SHYIpAAhMgWZfO+YOe+rJAo2NPhao0+EDF4hRDZ96tmXZxfBmNcXwYgxIooXezzTFzODupi" +
    "bsvcf/ItzbWYlsX8vQAOaqW4ocpXMGQ2LqmCqPSvZws1t7H2+5jyQ4DICO4xYkCnSAAAAA= fly-to-cart:UklGRvQAAABXRUJQVlA4IOgAAABQBgCdASpgADYAPtFor1GoJiSipBVYYQAaCWcAA+Wgu+uXIT4L" +
    "Bhl1/bjo6kTY6tbSsUDPi78rmAmYgAD+9Wgi4v51G3vkkBa+4d4c4xstKhXe4pJYxp4QaZ0ltxlLlb5qQPbeUdYr/fWXl9xSHrP1V+5uMDFx8yTNorhMJs+KzgS149TfKLqhzAZR7lTjiTh8hNGvJGIEksODG6LP" +
    "Y8dL3vpNPv/fpJLvfs8EDP98Tnk1eq3pYeZG8JNWAFvCiUGTJ2y/y/D9GI8ItMwB485O+lpys0c39bc0p+7bED4TWbfWOYGCwAAA drop-zone:UklGRpIAAABXRUJQVlA4IIYAAABwBgCdASpgADYAPtFoq1GoJ" +
    "iOiorgJcQAaCWkAAEhM4VBrQVPTJZxrFI72VElTzDjJGbovSEeNtfciH4AA/vRKEMETa522q88C5eYNAMMyBOVZIirVzJcPKuH3z8pLEvV+BVG5oaOe/IEeMbh9OR7nDQkZoVfk6tj46ltYk9XUHOJf/AAAAA== " +
    "swipe-dismiss:UklGRsIAAABXRUJQVlA4ILYAAABwBwCdASpgADYAPtFmqVCoJaiipBqqSRAaCWkABRAe5xP+cNrpswQ9gyqCQtUD8v8TEEcF+Ra2X6kGDqzVEO07yPggAAD+9SELhesOqDnacUfsBU7bku+c/9" +
    "gKuoQn+M/VfxdHctx5kA3I/tHjIu/tI8/dGBmemTA9QnNUBQozzuBPrK/HGTxCLQQ3V5osct1uBXvCZ+U3ZPA/LXV/JkmPWKq7qqwwSEf606wGWqawMPTQ+AAAAA== list-add-remove:UklGRmoBAABXRUJQV" +
    "lA4IF4BAACQCQCdASpgADYAPtFgqU6oJaQiKVSaWQAaCWkACBP4gXDHgn1UCDb4DUnhtd85aaxvearhsElTDmE7j8I77LbWjpUCjcFvvk7KyhaFmbfd/+JoQQ0QAP714kAcG6/x5fqXEdCOsA77NPMT77E+oAXlx" +
    "1q+ivGprmtWFdPLiM3lN4uE7/29ask5dPdXuMhdR+qFUEJzHQoaezuJ7zDjydo2D7kJIi+E4NHXHjImjVer9EWu1facI0h+l3m0VB76z/YJuV4irNAwjxusZ6t2cbPrvnHJkMZZBep590cgLrw64NNjke7SO6E1M" +
    "2DJ5IwSwytte9x19q8PuqKIbH/n/COSrAL90ajbDTi1Zh1PeYGX+rqtfWMWlmIxU81NTwqpimu7aXK/U+UrJWtJ3v0jev8jRYSHmksMZA6ZPWz0EQ1vi3odqiUSPtW9d3cDbtIcb+RDG+z1kCn2QO8owAAAAA== " +
    "paper-crumple:UklGRtwAAABXRUJQVlA4INAAAAAwBwCdASpgADYAPtFirlEoJSSjpXQJMQAaCWkABRMi8lBJrDFSKLZ1cH/l/40OOF1MeZxpGfw+wa6Xj+hHzAVF1MAA/vQRuf3K/LV/v9N1li62lboQ9768f3" +
    "oljshcC//Ejarfr0nBPRi150G6flnCqibfutsjddQ5wAO3Nc6bf49XiJBpahh6cBvzS3Pn37OgizgcH3BplH23YjnXT4FQtXhQ+sCSR6cZw0M/9IA12BmTDm69da07semQVymMddXx/0C/kZ2grsnZHAIAAAAA c" +
    "hat-sequence:UklGRigBAABXRUJQVlA4IBwBAABQCACdASpgADYAPtFcp08oJKMiKVbaWQAaCWcAAJcsOSkTV2B6C/H8cATv3N2TzA99pGB2stGyVrQ6YhwXWrMohvJF/3HrX23gVIAA/vpaB5nKwtmw7PghYTF" +
    "V51hgyT85MV7SUndnwWSgWglTVB4alRJkRaO3y+Fm/ae8sDu8VoS2OiQOgwNvFxuVCqY2gYJ5Y2GlytXsSXG7uV/+AeSxN/V1BbO8t9zfBgGXdCcrts9uvjLGEyN41l7cly3x+niNpGUxpdCE6nISfxnxGOKmH28" +
    "Mz1rfAAeiOtkYbulvQM8isTuBJxKTCty017O8zZIjCDdDcKAdusgIc39LKl74PfhGm8EO2Hgo7wJHtjTSHqK/DZRUCadrgAAAAA== ai-orb:UklGRtYAAABXRUJQVlA4IMoAAABwBwCdASpgADYAPtForlCoJqS" +
    "ipXv40QAaCWkACBXOl5pTh4ELui81FYXLz4rLqW1VQhfDEdAkUmsDRQWxFriDmQH9gAD+9BZ4aZy6h8iKBTTpZLL2bC/DsElM8GJG6Pfcd75AdIkmPLrcTOFjlbIfO/Dicn55E9E4oT+Lj8Aeea5aiqpLywMOkF6" +
    "yUeKpebjMWSmXifEZQvl/xCqybeDSqYil/9JBTD7hW+tac6rWRFSlWvZQHWWu/fGmQ8R2CM2Edq8sOcWAAAAA flip-card:UklGRp4AAABXRUJQVlA4IJIAAACQBgCdASpgADYAPtFipU4oJaMiLVM5IQAaCWkA" +
    "AHEcA1za8tREs3jF99JZ9nItvMRtzrnxmWe4WcPzTqKAAP7y43tjuk92L65npNJ+LcigbjmVCv/q+AL0+Hlbnsu9ql1z1aoM69V6aOpMG/fG4UYh6GpQOsxVRA1uJeY3cfkLHjrNJPHjt61/CFnxTwS5AAAAAA==" +
    " page-turn:UklGRi4BAABXRUJQVlA4ICIBAADQCQCdASpgADYAPtFaqE0oJSQiLVmZuQAaCWkACwTHMTeTdJk/Kf1gQIb+/x5ojp6f7YesjTY+FWmFwh0Kp1TOgaLOb52cnP9q6fBZ4gCa+3jXhQNu0LgA/vNjT" +
    "N+xdpa1AX9ZWCOx9rU7kWQh8C4FBjr9se0ECIeeFIfBGiKtoCQpsHyMTvFvHbff97xrrYrKtapHJgKOYbjQEGrTq3QGUofrtSHJbCxag/NE+eyXygqkForpmkMfxQHaNk1Nq6t9FYoaq6pvFe9affNRQyzgEyykg" +
    "Cemp+HauVk1JfkB4OF6/dVTPjQBZMa6rC+z18wUU6RPcujQ1zbnhQRuxg9m82MzyO5RkYYudND1bpSDbz7/4J8QhNMJ12Tt5zZ0iAAAAA== sticker-peel:UklGRjoBAABXRUJQVlA4IC4BAADwCQCdASpgADY" +
    "APtFcqU4oJSQiLVZokQAaCWUA1FGMRZvcbPtqiyxKw0LfB4LNp/oQyDe2u/lJdvCEw88tTTTxDtdOifpXPbeUfmGZEMkae7Qw2q1t9vfAAP719kZO/4rzhwqpQ5GQclOxzEB62PwDaUTgOCxU85xihzOZkwxYgiU" +
    "4E2IacpzXebATKKQnnEmzytw20fjRDudWVWYjRS+K+O15EmhP6DmODhjsBDv7A/J9ChTgKNot5ulP6Z1OXVsyVZNGbOfFyIuKpmnSU3Pu6epBY/glQVWpp2HSMYoaP2tIwN2N1no1Cja+YP+BAfA4dS4yfi0qh6Z" +
    "vdOh8oJTv4SsgxQW+qVjp2BLQAmri9QZcEFkOZ1Nf5TrRrxfLxY6JUOJSs1CjyRgATL4AAA== floating-label:UklGRpoAAABXRUJQVlA4II4AAADwBQCdASpgADYAPtFkqFAoJaOiprZpsQAaCWkAAD6yq8f" +
    "KPHE457PIarq3xjME0tB4Urclww2uAAD+8USHAPb8FzCUtV0fpWVPIPOmKPBWFZzP9vhWxDncgFZKQ8Xl99MyFl8qxQO5Os2ndlJZNEkfD+/mKUaI9uTVQIMuDnfCHOI+5EtQm168xZxcAAAA password-stren" +
    "gth:UklGRuoAAABXRUJQVlA4IN4AAAAQCACdASpgADYAPtFgqVCoJSOiprZpsQAaCWkNvqADKnopYlC9sqFww2IEZgNXp83DWA1l11ndOMXqzP4UZxJJiovB3Tt78fZAAP72Ov0i7EMAYGJu8eBNK+g2M+nXrI3W" +
    "Bogriu4VQVCb2B6hEdSDXx9d1dUP8hFXVGR27+jHqnM1Z3FTC41uk0O60l2b52eUB+psTxKi/1Ii2kIw247DDT0A0gDMgkAPLoc4oh3/dRUbj+URv6nUPAM0JtJdeDHv7wB57qMv3gE9jjK2wIwaU4V52xbTdkWC" +
    "UAAAAAA= expanding-search:UklGRqQAAABXRUJQVlA4IJgAAABwBgCdASpgADYAPtFkq08oJaQiKV24AQAaCWkAAGoDIO4Ce0U0485zhC2Z46kOSmAQWvZ8E7GVGlRdLAAA/vJj3bTUgPXzV/jzJCdNfADLDf" +
    "ASSkV+koH56ix9NCpnqCtbafCCHTua3n3poDd6ey1JyhTDmRpQtGw/whf2d3j6s3yDiO73Y34KH64vBmVmVAYP0IRoogAAAA== dropdown-reveal:UklGRrQAAABXRUJQVlA4IKgAAABwBwCdASpgADYAPtFip" +
    "02oJiOiLBqpEQAaCWkAAIBvniU2F338s6wsUieJJVyHd2uVI+fqSUZ1oQG6Nz4LcwLeELnIAAD+8YyB2Sy+yeQEbgmRo4Pw+sc5U6qtbSCwGIhLYqa8MFrFDCBgLle3yI5Hi9GQZobLy5xd/7+6vnC3t61GrHB23" +
    "BzjMABlISotm3TgnhyjhFSeahEUz/pdRRBhOiKR7wAAAAA= morphing-dropdown:UklGRrAAAABXRUJQVlA4IKQAAACQBgCdASpgADYAPtFoqlEoJiOioqnRABoJZwAAU5C2W09hgPpcpCdX783WU0pf3WVjKN" +
    "DPoMxG+VYlRdLAAP714RtE//QU2Rtd8CssOphpub3WxT32Q7PkLTUdMpED3Sjtfu9XNIngKtHqadVHMzdz9U5fxn/Uvjpq98/YyzI3AA/0SGhDWGvxTRg3utIKCKj1q/JglhWbjojdAAP505kaAAAAAA== menu-" +
    "toggle:UklGRoAAAABXRUJQVlA4IHQAAADQBACdASpgADYAPtFor1GoJiQipBqoAQAaCWkAACvOSH0idl2GQeW98JsB5axTAAD+8QnmvKqCT8nu7TDxu+tmp5EZhPDLXJVQgC/dlOJIwqNTC2BiXQi+SSObxRjDk" +
    "CYKaKauhWRR9FO7PXnt+sV0AAAAAA== error-shake:UklGRtIAAABXRUJQVlA4IMYAAAAQBwCdASpgADYAPtFkrFAoJaQipXgKAQAaCWks//p5ls1EluquwAipOLyiKc7F4Kgm1W7w2A1F+oPPk4oi3cQ4AAD+" +
    "89gAgNo0/r3K1zSkQFn+Ge8RVC2jpXNWJMGbFaXW8W+6XLuFSikal98AcyN06ObfxAK4MHxPbNvxylz0uBv6krA1GauCSsUfCTxW0T6XlrB8e8P5HTwUlAcTbWAq5nseeab080p0e2ayxRj+bzU/sJmkvwMlUXi+" +
    "EVPEFoiOQAAAAAA= hint-nudge:UklGRqoAAABXRUJQVlA4IJ4AAAAQCACdASpgADYAPtFeqE6oJSQiKrQKgQAaCWkAAF+KAg7uRuYiT73NacOqZ3YuAV6Z6ABiKCABpKFlyd8/oxveRu7oo2/RigCAAP7yY99x" +
    "ooLb7fBrwrm1u1IAKlfNPi9Au5bBSEL9NXZbqoMVUCv8ODFOE2ZfkcwYOmqp4FNezVV/UnzjRmPAojpH2JOUb7XXEiP4c8nKxUgAAAAAAA== gesture-hint:UklGRtAAAABXRUJQVlA4IMQAAAAQBwCdASpgAD" +
    "YAPtFmqVEoJaOioWwpABoJaScAAA36RLrgUWt/cMEQjrcPkZllriq4WEelwdahoFUujMdUcdn0AAD+9SEo7tWEVWkMoXSq0mqeRS8cXynbK4gCtBtBkUibYa3NIZEu+XY5XUHZ/7R6hEP714Ws2HrC0S6q3Sj/st" +
    "Zb349cNAWuf2xCH5RZ3DcARBXOVyORBaQYP4ELUXQL09vSry5bVhekqNW2tBBTsEjQmEIYZSLEvn+19EsL9/jgAAAA scroll-cue:UklGRtQAAABXRUJQVlA4IMgAAADQBgCdASpgADYAPtFkp1CoJaMiprmY2Q" +
    "AaCWkAA+Nhi2tGVMKXifHMs6W2V2dBb1z9NIf1hzEyEkd77W9HsAAA/vFEoapqpzGZpSVa34ofBRfASLQ8gFLfTj0NIa2D9XQeqrbUdkBx077JYD6mTADGTORc/dxYqKyvbw68/OgjKIBfkchIs53mvmsQZFO9/y" +
    "rWcw2BvDBVmCFpyNZAXCW3Ob5QwgMNX/pDd6PJ6Ml+8HXCMjQcmU/HCK4cf1vvr8c+WPlwAAAAAA== notification-badge:UklGRrQAAABXRUJQVlA4IKgAAACQBgCdASpgADYAPtFmrlAoJaSiprmYaQAaCW" +
    "kAA+TzwAU3HJGPLKF0cBG1usp6mqDhpaU6JucB4/dnLpGAAP7xRloL1R6uW+ev/Cvwli1XH9QOIdQ+RQcaoj2IZOdsq/5oqG3Aeyd4o6Z1CAE7mnf/0igzKmvYiyJ5lq5mPXZ9jqj278gxXGWsjrcDEEqqZkS+TY" +
    "MaEkYdkOcX1vmHXTjTdZugAAAAAAA= pulse-ring:UklGRpQAAABXRUJQVlA4IIgAAABQBQCdASpgADYAPtFor1GoJiSioqkZABoJZwAAP5aNzRdALKsOC9HXhjN+Mp0HrYNiKIAA/vJj3yw8Ee7wbEqcVLS6Zg" +
    "DlbjlySY3187iO1mJlXXD2KyH2/97Cm5wxGXzeYYyotBTR/OSZ8Bvw1z3W2zeaAAQ5cD48fhf29rpEZn/85nAAAAAA breathing-glow:UklGRpgBAABXRUJQVlA4IIwBAAAwCwCdASpgADYAPslYokunpaMhsV" +
    "na6PAZCWUA0g0L+fmFtIlOT38h4bjsWvgZZs0ve2h9peycZJa+qRP204ItXqpOq0KYtTTEiDNUkNZ0us+KS3JBAJNHQCoPh2VJbhEh4AD++AGB7ncfkj6OYsPR6a7bIzYrPc76xGn8yKdo+7AEQNNs5QI3+BCTSL" +
    "Aq9PIYPDXg/AVT07zBbZGiDWLK9sykT7QO5cjIbR5FoSSGRKbwHmGKVqRt2qVifYf4H8TNVvJbYcmqPpjYvPQj8EZgsxtjWIJWlTNpWTmOufDEKUNqfdg3FhWWpfDzjwt8Kv24aqvx8PQz2HfNYN4J+HqIvM6tq0" +
    "A0Vkc/96Sf17baWXolRIfwG8Th6tZYU07t7ApqCoUHETFQ1/16bIU5v/XJTJfMZHrhpntvsaG53sgKkQZiNfxrhU5xtjZuEEJzYeTMGIolgzu6Tl/bKSap5ER4ocq35YHTSRDNNYTMV5h8lDq+nD4l/XeVH1gAHE" +
    "DLTymXROtMvXFeK4ivIAA= ambient-float:UklGRtQAAABXRUJQVlA4IMgAAABQCACdASpgADYAPtFSqEwoJCQiLVma2QAaCWcA0yypIOD/aOEENJfpqeP5fjlPktJxF5eIGdCveDAk6Yc3qa4NWLSkopCZIHS" +
    "c2AAA/vCjPL2Y+YY/kslg+YaIuex99nLEIl1CMewckJhMoljQvdbaW0UOlYD54IF0HtOYQ2DofNAYFXJch492k2BQwinu9AWASnEqUx8CZRpr7VcLo3bQIrm+nnTEVVhnCkcHEyNBzBoMGBpQJHy+Are8OxmSGh8" +
    "EmgqdwAAAAA== eye-blink:UklGRoABAABXRUJQVlA4IHQBAADwCgCdASpgADYAPtFmqU+oJaOiKBVZyQAaCWUAI8AI8Eia5L+gT09yn2Jfvh8MpMZrluHF7jfLRGCsJoBwtDuYSMpV7bKRYcDeuTS6eqKVXnli" +
    "q+feVjb2+CmTyjMCJ4AA/vY6UefIuTBLe3BUvsnSfzU84lFNYlnZBZBqex5bA7O2XzyquyfXJN6BfHBVhJ+SgqYuNWEJ3oPr35HJofEJli2Njsya6cujgMj5KgxMwA48VTnVKVxatlN5MGOTZueo4YAA/n5YZssV" +
    "zOLkqL1SaeRn7lECKb0vl/+020AixYkLJUNWz9WXvpAU2XpYrVwtVw6gGiv/3DH6PF7tZjz9bQcTFycAM8glojDpW3Y1g8/c7BUluHdEtGCiOOpzrTjTmZfsrRZakErwGkEKvx79z5FnO5dIoDLpC6J2poxKcR6A" +
    "QvK/G2+h/9410sc+Fz5Ubd4QFTsx/+wGCwVlZWqpPUEAgG5/5gF7ofg8FRWp3oAAAAA= orbit:UklGRuAAAABXRUJQVlA4INQAAABQBwCdASpgADYAPtFkq1AoJaQjJXgKAQAaCWcAFtlhsN3MR0ZW2vEIaURSp" +
    "10MsGe/ssjvOwUynZaVhNVCRSC0Wz8AAP70TAQ2+SDn1gwLxIdrs971YhZ0LnrL2XBydtf2NQp3FqHFFXpwsH8wqYY34Zc9ySlTPwO/dYAIJ2B/t5FofvC/g2QgrwpKBvN4oVaRn84J0UdIa6x4ig+D47LIH1lLM" +
    "fxBqUG7zopKPujgPEz3tLPSbG7N3aNNJRoYFNaldDJYBqLFFLYuHWZ8qWuuWSEAAA== pendulum-swing:UklGRv4AAABXRUJQVlA4IPIAAADQCACdASpgADYAPtFoqk+oJqOiJXv6AQAaCWUAI8A3k0iIB1rbc" +
    "yfqvuzzGre07OD68O7+abkBxoU3JT9JB0wJBEXf0Lp9ERinyfdOG3PgAP71sxpo7268m8ua2AR/QIa5MBgwMusRuG8U7iGRw9Oc8nogPZTfywmjz4uheDkde8drauxtqb7SFiNa+sz1IbH9svK/S/2qSjqd7z/7x" +
    "yvnA3asL6oSQniWcCmEHkSq44nYr+E7ECJR6zq1935BJYxxZp28P2oexVjV9HZT1eQ7Fw0VsO2R9sThmeHR7Yn7kt0B1Gta0butLJTYWooAAAAAAA== flicker-on:UklGRsIAAABXRUJQVlA4ILYAAAAQBgCdA" +
    "SpgADYAPtForlGoJaQjoqkZABoJZwAD4flwqQQTT590FHk0K1dJ+4n46XFcZ0gedBmqSMAA/vMmEV+ca8g73qN/KQYP94+JzW/tQctXjSaTbveB/wqi3m42UJ5aNGy3bcRGJ2Qz63chP6t3ZP2jv/if8y/oU7Lrd" +
    "OkfLyedBT/6zxjz8FXvWWLVVG3gwlxDrjPXBhgSYo6BNaoJ/rFpgZclRzfoYLEqgAwRNeWC5AAAAA== dvd-bounce:UklGRmwAAABXRUJQVlA4IGAAAADQBACdASpgADYAPtFoq1IoJiOioqhhABoJaQAAE/oF0" +
    "MF5ti3T81aeV5q08ryQAAD+8PxCzJ+3fCaSRgVX7z65sjOi/a2n424dP2CCHTgkZ8wcJ9dUtji144rOAAAAAAA= conic-sweep:UklGRlABAABXRUJQVlA4IEQBAABQCQCdASpgADYAPtFkq0+oJaQiJrZqGQAa" +
    "CWUA1OkyOgOfVLsG+BpMplvkuXm2zKiY8F0qu+Xvic09nOD1bV2LTNuoSjLtwKnWbVI7sbY9/5ECIAD+9EoXMrz00NV5ZrjUWLl8aqpgIzRX9XfGRCoA7pbhhamp4jezz5jKg593CljN7xMU9a/XaHMLzTs0as6F" +
    "lII1AzDzDRvzdGGjgVYD2ZT5xbs1mpSsIkONxoYYyIYHMnFsah6YO4RuY9raCQXNwmrJgxgrvxUh37WRMmg6imaCiDk7CEqtupT21evL89gtQQhLq/fu+uDatZviArcRzijuebwjavifmOs+uvd2GpuUoFPAOzpM" +
    "zi83W5uPe8wYZV4qpbbfgGOctfus3B6V7SozLu0jnkZJRwNh8nU0U5WoAM8Ro4oBvqqEQMxQwAAAAAA= motion-path:UklGRsIAAABXRUJQVlA4ILYAAABQBgCdASpgADYAPtFmrk+oJiSiKB1YcQAaCWUA1fy" +
    "ucYBnBgTXXdemfN4JDDSAaWXu6XrWl4xxt3jAAAD+9BUYBSZQbdpj5Vf24/n0pascwrxMepq0NPPDVBst6P9vv9EZNazooZ/r8B9P2/cUvhOt+vs6m6cL2SxliaWxae6szrPXOvtOHGqsCZRs64UHq9lcqTfhaI2" +
    "8E7QSmK+t+WREqI4S763gSfaWIs/W6fsCYtAIAAAAAA== preloader-counter:UklGRpgAAABXRUJQVlA4IIwAAADwBgCdASpgADYAPtFgqk0oJiQiLrLooQAaCWkAAHbTmkhBSR6EfACTaJ0epmrTkCLuGTTh" +
    "vrDpz5b2sQua1mkAAP7zYqDyjv7FzH4zzlOJYs9UtbxkpEdL6F+aidInmkfki/XUM1Obh1M+/+7LZoiG6jr6+SSCtwRmb9Jb9s+Uwg9BuSdlAheAAAAAAA== skeleton-shimmer:UklGRpoAAABXRUJQVlA4II" +
    "4AAACwCACdASpgADYAPtFcp02oJSOiLVgJIQAaCWkAFhZgQswlH6eeeopgjjGLA2+zga+Rzi/fcIiSN2J/99uqChu5HNJYTpZyGdWalSUy0YAA/vEIkLOGmGUpJ8zoWOdST6lmTGFiB58SQQkigENKZ9VHa9o3hO" +
    "0/Q7F3Afs2aI/x2/JMNXtS6B0N7+MqAAAA loading-bar:UklGRqAAAABXRUJQVlA4IJQAAADQBgCdASpgADYAPtFip0+oJaMiJqmxABoJaQAALdRmbc4WQzugi9G+yelKbXZsCF1TXnKkIH5QpEHufqkM2oAA/" +
    "vEIto9m7qwaXgGznGAuvvYPHCnPemxupMKggvwAD3bRSmiNhsdtEUjofnXMgWwWjUqF6tsQiTcgat5gRsnPKMh2VbtMi0iwoNsnyAtL4G6AAAAA spinner-ring:UklGRugAAABXRUJQVlA4INwAAACwBgCdASp" +
    "gADYAPtFor1CoJqSipXv4aQAaCWcAlQDWHSIn/XwT1RAOad9WiEDwNBXoXTGBzQT7JeJMYAc7QAD+8mPfLtKZ0JcJWyYqpBxylsmKSNQhcQFws8NqLpH7In/wYOQmKerOJdPy4dc8hMDuEyeMXFDn+JlyyRu47Nb" +
    "4cj2AJyfJYSEZv4Pl9HeXiFlkwkR+LSDP4FjEMcDEWMr+S/x+FkHiWsaCaZkpxIt/nGbtpbMC8iFnv5EgDqit0G0NwfulxNsPWGKG42rEX5VPdzuHKWJJugegAAAA dots-pulse:UklGRooAAABXRUJQVlA4IH4" +
    "AAABQBgCdASpgADYAPtFiqFGoJSOipBqpIQAaCWkAHaAALZFi+hAQgBkIk6RodC7c6vB4MpmsDIRCRFsOAAD+8YyBqm4bAXGo+HmsVuYTVMXSllImKDUq8cdbX0mK3wF30rhibpckTKuclDtb7X4Sx0mK31FzRYY" +
    "fqNmgBAAAAAA= circular-progress:UklGRhABAABXRUJQVlA4IAQBAAAQCACdASpgADYAPtFiqlGoJSOipXQI0QAaCWUAPkBtgJpHRoG0iPzm+2R9RO8WaZIVdyigXGsUnicPG/ie6BSvd8COsxTsc2AAAP71" +
    "so3bEFmSJ6e9rmNYnlrX3ydLWbRweUS93kf01msFFwFixJZvUqP+URDswbqAmNH9TGCZr5Z9RnAv4OUFlKdZcJTUrdGLfEVPW47U7ttdiC3GbpV9aniXQKD2RSzPqiEB9s9GbVAFdCoFFBQqZI6cZGWg98KtABYx" +
    "4+2m6fQlSdEkNx6j3itcAbJmcx5DaJxKC1aSRZJVQ56tskIYkAUmQdZRPYOI1j1xXxSRkmN1tD4IuN3RgAAAAA== stagger-grid:UklGRpACAABXRUJQVlA4IIQCAABQDQCdASpgADYAPtFcqE6oJSOiKrQKgQ" +
    "AaCWkAEgT6jyrWhzIvAR1hBoitHvAfyAaSevM2//MKnp4tciNuGjHB69PN5HmU+uX1ktJNSGiHWSFNJyc18dQWsEIDSO9VS4pKDpS4M+0X0Cq7LLcN91sxwjgAAP72O7sqo1MykEx1jNF5jkBslA3PeSleLSsib1" +
    "wm2naigRe6gOKzGrt4nBRbenZdojpv2X4NnoXyq2kt07v28r0iPi7CkpvdfOQ21Is89PI/vx63yYasRbCti+JQqj2FAQw2ojmQ1Q+2hnG6Z6abzIJF3/l1YxoKvkCwgnLgjAqk3m2oA8s3IK4ItpmG0so+nFrw+F" +
    "tEEMz3SC1PPjp90N3o3T9+JAWzKHiUOzYyG2pwWvTdmWuRzUhyGXlp87LQk6NiGPgqi+2Qk2oiOt6FW52Q6dHRbygH1tg0eUNBnwhombYio6lNisR45uVY1V857NdGOi5gy+/lV26bCgcuReWgm094SACl5MA/qi" +
    "HLB0Ml1rgCmSB9TRhjaRmcfDhnaJaF79N1A64V4qJuwhS0X4BN5ZuWgAKkFFyqapBLZBqOx7NLFix7tWPQ97pHpRe20Zau0VMO0f2b72qdJ5ffwq1SVCl+x0BsPup7BTIrExPh8fmUVajdJIivA5auOi1x0PX89p" +
    "WZkZT2vVZkZ+OlJ2j5LPlhI8E5m3quS6hQd66goxp1zPWPrfcxWrj+1eUmcZy9uFahMBjCxoyFfp8iywoOD5Ug+8363kq4U+oAMch3iZy2zVqHBBbEwQlCORwaY2dLq7CI8FSkCW5g16VL8wIHZnyZakxPah13PY" +
    "JFUY8LfQcJRvKbw90zxXhwAAAAAA== spiral-reveal:UklGRpQCAABXRUJQVlA4IIgCAAAwDQCdASpgADYAPtFoqE+oJqOiJXgLmQAaCWkAEglaF/kN91YDKnYHaYNnIniDLMgLW5s/uuvl3+7S10vyC6FSMr4" +
    "Gimp2vYUKirkjncYFPdVuQqNcwgBi7qabHq2ZckXSHTLn6IkzNlNtttaCTHfn8wAA/vY7c/YagTILdxcVSv3re//BGsMToi2GwWx2ixvAl328+kdFH1qr2RMt4cmzO7342hiEYqzDgBJDESu6Tw5N2pZC4wKhKX9" +
    "Vh+1v9JExl2Y0Hv4hRJ+dmE9IFy3pl7y18QtXx8BcrwYAEJbYT+3xbJ5DdKcjXj5ytIz8R8g+pJl1y9zgDM9XGNvlCeb2lLkk5bEQraOC2gOnHT1Bv35a/la/YckU/D6kLqUyGc12iX2pGZtYTywxeTrRqLuyBm7" +
    "Kvr6lYwWO8JldwNu2X1rB97S9IBTeiG2Zq8Gn2FHzQTLj7k0IZxFy69OCXB4j5fnpiDsUmc6WjqkxPpMDvwKdodBqJSzZbFUWYPNRjnQQ7xpvAgrdat9NDQXFDtJUoXR6VqJ9fXy/PrQlOA4DqafAPfUpt3coqRT" +
    "1P+15waQARDqXFAFS6fx13f2kt9qrHnonLCnNiiwXOdvMIvyyGCPysSqKQhwya/BTbacEKrbLle44xIsil6lvuGCZ+fd4mbR5sycsjVjLgoMaqB4BQczZBS25YJvlFYWZ5kedNyEynQoNGiogGobUbYQurdHXTE6" +
    "qcIHCr0hSkqQTNkVgwK1pp7zgbsoox4FG4W5y4F1IrXE3nBkgRi+/T+de4N4cfU+PRxaMfaSdRhWUsCsffA/GQtaSBIIJfZgFAMUwxqVjEaNbKzt5us2GmvxU/qxP+mEYJQAAAAA= liquid-fill:UklGRjABAA" +
    "BXRUJQVlA4ICQBAACwCACdASpgADYAPtFoqlEoJqOipXgIaQAaCWUAMUA6gG8AHZEuVFywKGtzf0wFWj2v9EwE9Unng508cbKKvfz38gZn0xNWANR5Bzbq0IAA/vUhKnYMyWA9TK7PN2ha3OAAFAIK1xQ3MaSt4M" +
    "0GKVM25EOUCKvZCQ7VdKujQw3EkhbLL6x/Z7zx2Uz81BIoNXXhv/n6SrhN82o6lGYWmDL7/rr7uVjdvJJLZ+JQWSYnGMfKAz9HWY5OR5jCSDmG7SQUuGuFw+n9Rqx2f9D6v28MxNy/KGlyu4H4aapUIpcblPm/2m" +
    "sakXPtB3co9eWEJ6gS2P7zaO6A7mUTJb/XT4dQFwkNnX0//w6rSaGghrwBQqbYx56b4B0r6shdR3IvE7AAAAAA boot-sequence:UklGRhQBAABXRUJQVlA4IAgBAACQBwCdASpgADYAPtFoq1AoJqQipXv5mQA" +
    "aCWkAFtorQPcN/OjYUW1qUfLP3UFs/KTnvx/+WoHhp+VoTDPYILUw0706eQAA/vRODgb5o18eUB3czbHAbYIUKNtiGxOipGLm6bJyA0pHxByhDLJICBK7g4kEVOQAQztXvC5u3BtMmUQzTqiQRakENW8SKKI751o" +
    "ahJ0sxoMYEpp/GVg1sp/SEfiKEQd9Zs+dp9JHZ2WCQ4z3nKju051UzlUGOJ3giKM3ZvVrkQOVr7nrNMXQ2Xs8vfjq/qi0T7D05f2ba6CeG3oNsvBRkhCsJ1kWFcwG985o+J71LCBf7ZqNIPlFt7ufx8ch8AAAAAA" +
    "="

/* ================================================================== */
/* 演技の部品（EntryTitle.tsx の写し・2026-10-25。Framer のコードファイル間 import が型チェックで解決できないため同じファイルに置く。
   EntryTitle.tsx の対応表 SPEC / 部品を直したら、ここも同じに直す）                                    */
/* ================================================================== */
type V = Record<string, number>
/* ================================================================== */

const EXPO = "cubic-bezier(0.16, 1, 0.3, 1)"
const OUT = "cubic-bezier(0.22, 1, 0.36, 1)"
const INOUT = "cubic-bezier(0.76, 0, 0.24, 1)"
const BACK = "cubic-bezier(0.34, 1.56, 0.64, 1)"
const EIO = "cubic-bezier(0.65, 0, 0.35, 1)"

type Box = { x: number; y: number; w: number; h: number }
interface Ctx {
    root: HTMLElement // 見出し語の箱（position:relative・動かさない。重ねる層の親）
    txt: HTMLElement // 見出し語の本体（まとめて動かすときはこれ）
    chars: HTMLElement[]
    words: HTMLElement[]
    lineOf: Map<HTMLElement, number>
    nLines: number
    fs: number
    em: number // 実際の字の大きさ（読める規則の em はこちらで測る。fs は振れ幅のために 28px を下限に底上げしてある）
    W: number
    H: number
    tb: Box // 文字が実際にある範囲
    ink: string
    paper: string
    muted: string
    accent: string
    en: string
    box: (el: HTMLElement) => Box
    a: (el: Element, kf: Keyframe[], o: KeyframeAnimationOptions) => Animation
    fx: (css: string, tag?: string) => HTMLElement
    ghost: (color?: string) => HTMLElement
    textGhost: (s: string, css?: string) => HTMLElement
    later: (fn: () => void, ms: number) => void
    loop: (fn: (t: number) => boolean) => void
    setText: (el: HTMLElement, s: string) => void
    lock: (els: HTMLElement[]) => void
    rootStyle: (css: Record<string, string>) => void
}
interface Hold { hold: true; ms: number }
interface Follow { kind: "f"; move: (x: number, y: number) => void; leave: () => void; tick: () => boolean }
interface Scroll { kind: "s"; push: (vel: number, off: number) => void; tick: () => boolean }
type R = number | Hold | Follow | Scroll | void

const K = (c: Ctx, px: number, base = 40) => (px * c.fs) / base

// ── 読める規則（2026-10-25 Awwwards 4周目・指摘1）────────────────────────────
// ・どの演技も 0.8 秒以内に読める状態を通り、最後は読める状態で止まる（止める＝素の名前に戻す）
// ・字の変位は 0.15em まで（磁石・ポインタを追う系）。字の拡大は 1.04 まで（切れない余白は pfPlay が演技中だけ取る）
// ・消える系は「見えている状態から始めて一度だけ崩し、戻す」順
// 0.8 秒以内に読めるかは、項目ごとに実演面の大きさで撮って機械で確かめた（輪郭の再現率 0.8 以上を「読める」）
function isPlate(el: Element) {
    if (!(el instanceof HTMLElement) || !/\bmdt-fx\b/.test(el.className)) return false
    const b = el.style.background || el.style.backgroundColor || el.style.backgroundImage
    return !!b && b !== "transparent" && b !== "none"
}
const isText = (el: Element) => el instanceof HTMLElement && /\bmdt-(c|p|t|stage|ghost)\b/.test(el.className)
function capScale(k: Keyframe): Keyframe {
    const t = k.transform
    if (typeof t !== "string" || !/scale\(/.test(t)) return k
    if (typeof k.opacity === "number" && k.opacity < 0.5) return k
    const out = t.replace(/scale\(\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/g, (m, a, b) => {
        const x = parseFloat(a), y = b === undefined ? x : parseFloat(b)
        // 体積を保つ潰し伸ばし（scaleX ≠ scaleY）は拡大ではないので触らない
        if (Math.abs(x - y) > 0.001 || x <= 1.04) return m
        return "scale(1.04)"
    })
    return out === t ? k : { ...k, transform: out }
}
const clampLen = (x: number, y: number, m: number): [number, number] => {
    const d = Math.hypot(x, y)
    return d > m ? [(x / d) * m, (y / d) * m] : [x, y]
}
const S = (s: number) => s * 1000

function seeded(n: number, seed = 7): number[] {
    const a = Array.from({ length: n }, (_, i) => i)
    let x = seed
    for (let i = n - 1; i > 0; i--) {
        x = (x * 9301 + 49297) % 233280
        const j = Math.floor((x / 233280) * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    const r: number[] = []
    a.forEach((v, i) => (r[v] = i))
    return r
}
function rnd(seed: number) {
    let x = seed
    return () => {
        x = (x * 9301 + 49297) % 233280
        return x / 233280
    }
}
type Ord = "seq" | "rev" | "center" | "random" | "line" | "diag" | "col"
function orderOf(c: Ctx, els: HTMLElement[], mode: Ord = "seq"): number[] {
    const n = els.length
    if (mode === "rev") return els.map((_, i) => n - 1 - i)
    if (mode === "center") return els.map((_, i) => Math.abs(i - (n - 1) / 2))
    if (mode === "random") return seeded(n, 11)
    const ln = els.map((e) => c.lineOf.get(e) ?? lineOfBox(c, e))
    const first: Record<number, number> = {}
    els.forEach((_, i) => { if (first[ln[i]] == null) first[ln[i]] = i })
    if (mode === "line") return ln
    if (mode === "col") return els.map((_, i) => i - first[ln[i]])
    if (mode === "diag") return els.map((_, i) => i - first[ln[i]] + ln[i] * 2)
    return els.map((_, i) => i)
}
function lineOfBox(c: Ctx, e: HTMLElement) {
    const b = c.box(e)
    return Math.max(0, Math.round((b.y - c.tb.y) / (c.H / Math.max(1, c.nLines))))
}

// 単位ごとに同じ型の keyframes を、順番の遅れ付きで当てる（大半の演技はこれ）
function each(c: Ctx, p: { u?: "c" | "w"; kf: (i: number, n: number, el: HTMLElement) => Keyframe[]; dur: number; st?: number; ord?: Ord; ease?: string; origin?: string; comp?: CompositeOperation }): number {
    const els = p.u === "w" ? c.words : c.chars
    const o = orderOf(c, els, p.ord)
    let end = 0
    els.forEach((el, i) => {
        if (p.origin) el.style.transformOrigin = p.origin
        const d = o[i] * (p.st || 0)
        c.a(el, p.kf(i, els.length, el), { duration: p.dur, delay: d, easing: p.ease || "linear", composite: p.comp })
        end = Math.max(end, d + p.dur)
    })
    return end
}
// 見出し語ぜんぶを1枚として動かす
function whole(c: Ctx, kf: Keyframe[], dur: number, ease = "linear", origin?: string, clip?: string): number {
    if (origin) c.txt.style.transformOrigin = origin
    if (clip) c.rootStyle({ clipPath: clip })
    c.a(c.txt, kf, { duration: dur, easing: ease })
    return dur
}
const CLIP_BOX = "inset(-0.25em -0.04em -0.25em -0.04em)"
// 文字の下から（上へ）マスクの中を通って現れる。clip-path を動きと逆に削ると、マスクが元の位置に留まって見える
function maskY(y: number) {
    return y >= 0
        ? { transform: `translateY(${y}%)`, clipPath: `inset(0% 0% ${y}% 0%)` }
        : { transform: `translateY(${y}%)`, clipPath: `inset(${-y}% 0% 0% 0%)` }
}
const MASK0 = { transform: "translateY(0%)", clipPath: "inset(0% 0% 0% 0%)" }

function pad(b: Box, c: Ctx, k = 0.08): Box {
    const e = c.fs * k
    return { x: b.x - e * 1.6, y: b.y - e, w: b.w + e * 3.2, h: b.h + e * 2 }
}
const at = (b: Box) => `left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;`

// 1行ごとの範囲（下線・マーカー等）
function lineBoxes(c: Ctx): Box[] {
    const by: Record<number, Box> = {}
    c.chars.forEach((ch) => {
        const l = c.lineOf.get(ch) || 0
        const b = c.box(ch)
        const cur = by[l]
        if (!cur) by[l] = { ...b }
        else {
            const r = Math.max(cur.x + cur.w, b.x + b.w)
            cur.x = Math.min(cur.x, b.x)
            cur.w = r - cur.x
            cur.y = Math.min(cur.y, b.y)
            cur.h = Math.max(cur.h, b.h)
        }
    })
    return Object.keys(by).map((k) => by[+k])
}

// 文字の形を canvas に描いて、マスの塗り率を読む（クアッドツリー・ハーフトーン・ディザ）
function glyphMap(c: Ctx): { w: number; h: number; data: Uint8ClampedArray } | null {
    const w = Math.ceil(c.W), h = Math.ceil(c.H)
    if (w < 2 || h < 2) return null
    const cv = document.createElement("canvas")
    cv.width = w
    cv.height = h
    const g = cv.getContext("2d", { willReadFrequently: true } as any) as CanvasRenderingContext2D | null
    if (!g) return null
    const cs = getComputedStyle(c.chars[0] || c.txt)
    g.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}` // 写しでの変更：c.fs は振れ幅の基準に底上げしてあるので、字の形は実際の大きさで描く
    g.textBaseline = "middle"
    g.fillStyle = "#000"
    c.chars.forEach((ch) => {
        const b = c.box(ch)
        g.fillText(ch.textContent || "", b.x, b.y + b.h / 2 + c.fs * 0.04)
    })
    return { w, h, data: g.getImageData(0, 0, w, h).data }
}
function coverage(m: { w: number; data: Uint8ClampedArray }, x: number, y: number, w: number, h: number) {
    let s = 0, s2 = 0, n = 0
    const step = Math.max(1, Math.floor(Math.min(w, h) / 6))
    for (let yy = Math.floor(y); yy < y + h; yy += step)
        for (let xx = Math.floor(x); xx < x + w; xx += step) {
            const v = (m.data[(yy * m.w + xx) * 4 + 3] || 0) / 255
            s += v
            s2 += v * v
            n++
        }
    const mean = n ? s / n : 0
    return { mean, sd: n ? Math.sqrt(Math.max(0, s2 / n - mean * mean)) : 0 }
}
function overlayCanvas(c: Ctx) {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const cv = c.fx(`left:0;top:0;width:${c.W}px;height:${c.H}px;`, "canvas") as HTMLCanvasElement
    cv.width = Math.ceil(c.W * dpr)
    cv.height = Math.ceil(c.H * dpr)
    const g = cv.getContext("2d")!
    g.scale(dpr, dpr)
    return { cv, g }
}

// 減衰ばねの位置（1→0）
function springAt(t: number, k: number, d: number) {
    const w0 = Math.sqrt(k), z = d / (2 * Math.sqrt(k))
    if (z < 1) {
        const wd = w0 * Math.sqrt(1 - z * z)
        return Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t))
    }
    return Math.exp(-w0 * t) * (1 + w0 * t)
}

/* ------------------------------------------------------------------ */
/* 演技（名前付き。対応表から値を変えて呼ぶ）                             */
/* ------------------------------------------------------------------ */

const ACT = {
    // マスクの中を下から（splitText の行・語・文字）
    rise(c: Ctx, p: { u?: "c" | "w"; y?: number; dur: number; st: number; ease?: string; op?: boolean; ord?: Ord }) {
        const y = p.y ?? 115
        return each(c, {
            u: p.u, ord: p.ord, dur: p.dur, st: p.st, ease: p.ease || OUT,
            kf: () => [{ ...maskY(y), opacity: p.op ? 0 : 1 }, { ...MASK0, opacity: 1 }],
        })
    },
    // ある姿から素の姿へ（フェードイン系の汎用）
    from(c: Ctx, p: { u?: "c" | "w"; t: string; op?: number; blur?: number; dur: number; st: number; ease?: string; ord?: Ord; origin?: string }) {
        return each(c, {
            u: p.u, ord: p.ord, dur: p.dur, st: p.st, ease: p.ease || OUT, origin: p.origin,
            kf: () => [
                { transform: p.t, opacity: p.op ?? 0, ...(p.blur ? { filter: `blur(${p.blur}px)` } : {}) },
                { transform: "none", opacity: 1, ...(p.blur ? { filter: "blur(0px)" } : {}) },
            ],
        })
    },
    blur(c: Ctx, v: { blur: number; duration: number; stagger: number }) {
        const b = v.blur * (c.fs / 80)
        return each(c, {
            dur: S(v.duration), st: v.stagger, ease: "cubic-bezier(.2,.7,.2,1)",
            kf: () => [
                { filter: `blur(${b}px)`, opacity: 0, transform: `translateY(${0.12 * c.fs}px)` },
                { filter: "blur(0px)", opacity: 1, transform: "translateY(0px)" },
            ],
        })
    },
    flip(c: Ctx, v: { duration: number; perspective: number }) {
        const p = v.perspective * (c.fs / 64)
        return each(c, {
            dur: S(v.duration) * 1.2, st: 55,
            kf: () => [
                { offset: 0, transform: `perspective(${p}px) rotateX(0deg)`, transformOrigin: "50% 0%", opacity: 1, easing: "cubic-bezier(.55,0,.9,.45)" },
                { offset: 0.5, transform: `perspective(${p}px) rotateX(-90deg)`, transformOrigin: "50% 0%", opacity: 0 },
                { offset: 0.5, transform: `perspective(${p}px) rotateX(90deg)`, transformOrigin: "50% 100%", opacity: 1, easing: "cubic-bezier(.2,.9,.3,1.12)" },
                { offset: 1, transform: `perspective(${p}px) rotateX(0deg)`, transformOrigin: "50% 100%", opacity: 1 },
            ],
        })
    },
    squash(c: Ctx, v: { squash: number; stretch: number; recover: number; overshoot: number }) {
        const H = 0.22 * c.fs
        const sq = 1 - v.squash / 100, st = 1 + v.stretch / 100, ov = 1 + v.overshoot / 100
        const T = 660 + v.recover * 1000
        const pts: [number, number, number, string][] = [
            [0, 0, 1, "ease-out"], [100, 0, sq, "ease-out"], [200, -0.38 * H, st, "ease-out"], [380, -H, 1, "ease-in"],
            [560, -0.38 * H, st, "ease-in"], [660, 0, sq, "ease-out"], [660 + v.recover * 450, 0, ov, "ease-in-out"], [T, 0, 1, "linear"],
        ]
        const kf: Keyframe[] = pts.map(([t, y, sy, e]) => ({ offset: t / T, transform: `translateY(${y}px) scale(${1 / sy}, ${sy})`, easing: e }))
        return each(c, { dur: T, st: 40, origin: "50% 100%", kf: () => kf })
    },
    shake(c: Ctx, v: { amplitude: number; duration: number; shakes: number }) {
        const A = v.amplitude * (c.fs / 40)
        const N = Math.round(v.shakes) * 2
        return each(c, {
            dur: S(v.duration), st: 40, ease: "ease-out",
            kf: (i) => {
                const s = i % 2 ? 1 : -1
                const kf: Keyframe[] = [{ transform: "translateX(0px) rotate(0deg)" }]
                for (let j = 0; j < N; j++) {
                    const d = s * (j % 2 ? 1 : -1) * (1 - j / N)
                    kf.push({ transform: `translateX(${d * A}px) rotate(${d * 3}deg)` })
                }
                kf.push({ transform: "translateX(0px) rotate(0deg)" })
                return kf
            },
        })
    },
    tracking(c: Ctx, p: { spread: number; dur: number; ease: string; anchor?: "left" | "center" }) {
        const sp = p.spread * c.fs
        const n = c.chars.length
        return each(c, {
            dur: p.dur, ease: p.ease,
            kf: (i) => {
                const dx = p.anchor === "center" ? (i - (n - 1) / 2) * sp : i * sp
                return [{ transform: `translateX(${dx}px)`, opacity: 0 }, { offset: 0.6, opacity: 1 }, { transform: "translateX(0px)", opacity: 1 }]
            },
        })
    },
    // 縁取りだけになり、塗りが満ちる（background-clip:text の幅を開く）
    outline(c: Ctx, p: { dur: number; dir?: number; st?: number }) {
        const sw = Math.max(1, Math.round((c.fs / 90) * 10) / 10)
        const props: [string, string][] = [
            ["color", "transparent"], ["-webkit-text-stroke", `${sw}px ${c.ink}`], ["background-image", `linear-gradient(${c.ink}, ${c.ink})`],
            ["background-repeat", "no-repeat"], ["-webkit-background-clip", "text"], ["background-clip", "text"],
        ]
        const from = p.dir === 1 ? ["100% 0%", "0 100%"] : p.dir === 2 ? ["0% 100%", "50% 50%"] : ["0% 100%", "0 0"]
        c.chars.forEach((ch) => { props.forEach(([k, val]) => ch.style.setProperty(k, val)); ch.style.backgroundPosition = from[1] })
        return each(c, {
            dur: p.dur, st: p.st ?? 90, ease: "ease",
            kf: () => [{ backgroundSize: from[0] }, { backgroundSize: "100% 100%" }],
        })
    },
    bounce(c: Ctx, v: { height: number; bounces: number; damping: number; duration: number }) {
        const H = (v.height / 120) * 0.9 * c.fs
        const B = Math.round(v.bounces)
        const segs: { y0: number; t: number; e: string }[] = [{ y0: -H, t: Math.sqrt(H), e: "ease-in" }]
        let h = H
        for (let b = 0; b < B; b++) {
            h *= v.damping
            segs.push({ y0: 0, t: Math.sqrt(h), e: "ease-out" })
            segs.push({ y0: -h, t: Math.sqrt(h), e: "ease-in" })
        }
        const total = segs.reduce((s, x) => s + x.t, 0)
        let acc = 0
        const kf: Keyframe[] = segs.map((s) => {
            const k = { offset: acc / total, transform: `translateY(${s.y0}px)`, easing: s.e }
            acc += s.t
            return k
        })
        kf.push({ offset: 1, transform: "translateY(0px)" })
        c.chars.forEach((ch, i) => c.a(ch, [{ opacity: 0 }, { opacity: 1 }], { duration: v.duration * 150, delay: i * 32, easing: "ease-out" }))
        return each(c, { dur: S(v.duration), st: 32, kf: () => kf })
    },
    typewriter(c: Ctx, p: { speed: number; blink: number; block?: boolean }) {
        const n = c.chars.length, sp = p.speed
        c.chars.forEach((ch, i) => c.a(ch, [{ opacity: 0 }, { opacity: 0 }], { duration: (i + 1) * sp }))
        const caret = c.fx(`left:0;top:0;width:${p.block ? "0.5em" : "0.06em"};height:${c.box(c.chars[0]).h * 0.78}px;background:${c.ink};`)
        const b = (i: number) => c.box(c.chars[i])
        const gap = b(0).h * 0.05
        const xAt = (i: number) => (i === 0 ? b(0).x : b(i - 1).x + b(i - 1).w + gap)
        const yAt = (i: number) => b(Math.max(0, i - 1)).y + b(0).h * 0.11
        const typeMs = (n + 1) * sp
        const blinkMs = p.blink * 1000
        const total = typeMs + blinkMs * 1.5
        const pos: Keyframe[] = []
        for (let i = 0; i <= n; i++) pos.push({ offset: Math.min(1, (i * sp) / total), transform: `translate(${xAt(i)}px, ${yAt(i)}px)`, easing: "steps(1, end)" })
        pos.push({ ...pos[pos.length - 1], offset: 1 })
        c.a(caret, pos, { duration: total, fill: "both" })
        const t1 = typeMs / total, h = blinkMs / 2 / total
        c.a(caret, [
            { offset: 0, opacity: 1, easing: "steps(1, end)" }, { offset: t1, opacity: 1, easing: "steps(1, end)" },
            { offset: Math.min(1, t1 + h), opacity: 0, easing: "steps(1, end)" }, { offset: Math.min(1, t1 + 2 * h), opacity: 1, easing: "steps(1, end)" },
            { offset: 1, opacity: 0 },
        ], { duration: total, fill: "both" })
        return total
    },
    // 文字が別の字に化けて、順に本来の字へ確定する（scramble／counter／ascii）
    scramble(c: Ctx, p: { cs: string; lockAt: (i: number, n: number) => number; tick?: number }) {
        const pool = Array.from(p.cs)
        const n = c.chars.length
        c.lock(c.chars)
        const orig = c.chars.map((e) => e.textContent || "")
        const end = p.lockAt(n - 1, n)
        const tk = p.tick || 45
        const r = rnd(5)
        let lastF = -1
        c.loop((t) => {
            const f = Math.floor(t / tk)
            if (f !== lastF) {
                lastF = f
                c.chars.forEach((e, i) => {
                    if (!orig[i].trim()) return
                    c.setText(e, t >= p.lockAt(i, n) ? orig[i] : pool[Math.floor(r() * pool.length)])
                })
            }
            return t < end + tk
        })
        return end + tk * 2
    },
    wave(c: Ctx, p: { amp: number; period: number; cycles: number; phase?: number }) {
        const T = p.period * p.cycles
        const N = Math.max(12, p.cycles * 12)
        return each(c, {
            dur: T,
            kf: (i, n) => {
                const kf: Keyframe[] = []
                for (let k = 0; k <= N; k++) {
                    const t = k / N
                    const env = Math.sin(Math.PI * t)
                    const y = -p.amp * env * Math.sin(2 * Math.PI * (t * p.cycles - i * (p.phase ?? 0.08)))
                    kf.push({ offset: t, transform: `translateY(${y.toFixed(2)}px)` })
                }
                return kf
            },
        })
    },
    // 見出しが英名と入れ替わって戻る（word-rotate / image-swap / crossfade / flip-card）
    swapOut(c: Ctx, p: { mode: "rise" | "fade" | "wipe" | "flip"; dur: number; hold: number; zoom?: number; persp?: number }) {
        const T = p.dur * 2 + p.hold
        const a = p.dur / T, b = (p.dur + p.hold) / T
        const g = c.textGhost(c.en)
        if (p.mode === "rise") {
            c.chars.forEach((ch, i) => c.a(ch, [
                { offset: 0, ...MASK0, easing: OUT }, { offset: a, ...maskY(-110) }, { offset: b, ...maskY(110), easing: OUT }, { offset: 1, ...MASK0 },
            ], { duration: T, delay: i * 18 }))
            c.a(g, [{ offset: 0, ...maskY(110), easing: OUT }, { offset: a, ...MASK0 }, { offset: b, ...MASK0, easing: OUT }, { offset: 1, ...maskY(-110) }], { duration: T + c.chars.length * 18, fill: "both" })
        } else if (p.mode === "fade") {
            c.a(c.txt, [{ offset: 0, opacity: 1 }, { offset: a, opacity: 0 }, { offset: b, opacity: 0 }, { offset: 1, opacity: 1 }], { duration: T })
            c.a(g, [{ offset: 0, opacity: 0, transform: `scale(${p.zoom || 1})` }, { offset: a, opacity: 1, transform: "scale(1)" }, { offset: b, opacity: 1 }, { offset: 1, opacity: 0 }], { duration: T, fill: "both" })
        } else if (p.mode === "wipe") {
            c.a(g, [{ offset: 0, clipPath: "inset(0% 100% 0% 0%)", easing: EIO }, { offset: a, clipPath: "inset(0% 0% 0% 0%)" }, { offset: b, clipPath: "inset(0% 0% 0% 0%)", easing: EIO }, { offset: 1, clipPath: "inset(0% 0% 0% 100%)" }], { duration: T, fill: "both" })
            c.a(c.txt, [{ offset: 0, clipPath: "inset(0% 0% 0% 0%)", easing: EIO }, { offset: a, clipPath: "inset(0% 0% 0% 100%)" }, { offset: b, clipPath: "inset(0% 100% 0% 0%)", easing: EIO }, { offset: 1, clipPath: "inset(0% 0% 0% 0%)" }], { duration: T })
        } else {
            const pr = p.persp || 800
            const o = `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`
            c.txt.style.transformOrigin = o
            c.txt.style.backfaceVisibility = "hidden"
            g.style.backfaceVisibility = "hidden"
            g.style.transformOrigin = "50% 50%"
            c.a(c.txt, [{ offset: 0, transform: `perspective(${pr}px) rotateY(0deg)`, easing: EIO }, { offset: a, transform: `perspective(${pr}px) rotateY(180deg)` }, { offset: b, transform: `perspective(${pr}px) rotateY(180deg)`, easing: EIO }, { offset: 1, transform: `perspective(${pr}px) rotateY(0deg)` }], { duration: T })
            c.a(g, [{ offset: 0, transform: `perspective(${pr}px) rotateY(-180deg)`, easing: EIO }, { offset: a, transform: `perspective(${pr}px) rotateY(0deg)` }, { offset: b, transform: `perspective(${pr}px) rotateY(0deg)`, easing: EIO }, { offset: 1, transform: `perspective(${pr}px) rotateY(-180deg)` }], { duration: T, fill: "both" })
        }
        return T + c.chars.length * 18
    },
    // 各文字が上へ抜け、同じ字が下から入る（text-slide-swap / number-roll / header-hide）
    slideSwap(c: Ctx, p: { dur: number; st: number; up?: boolean; times?: number; ease?: string }) {
        const s = p.up === false ? -1 : 1
        const n = p.times || 1
        return each(c, {
            dur: p.dur * n, st: p.st,
            kf: () => {
                const kf: Keyframe[] = []
                for (let k = 0; k < n; k++) {
                    const o0 = k / n, o1 = (k + 0.5) / n
                    const e = n > 1 ? (k === n - 1 ? OUT : "linear") : p.ease || INOUT
                    kf.push({ offset: o0, ...MASK0, easing: e })
                    kf.push({ offset: o1, ...maskY(-110 * s) })
                    kf.push({ offset: o1, ...maskY(110 * s), easing: e })
                }
                kf.push({ offset: 1, ...MASK0 })
                return kf
            },
        })
    },
    // 帯で覆って、覆いきったら反対の辺へ引く（curtain-wipe / block-reveal）
    curtain(c: Ctx, p: { dur: number; n?: number; dir?: number; pivot?: number; color?: string; hide?: boolean; barH?: number }) {
        const n = Math.max(1, Math.round(p.n || 1))
        const B = pad(c.tb, c)
        const vert = p.dir === 2
        const T = p.dur * 2 + 60
        const pv = p.pivot ?? 0.5
        for (let k = 0; k < n; k++) {
            const bh = p.barH ? B.h * p.barH : B.h
            const box = vert ? { x: B.x + (B.w / n) * k, y: B.y, w: B.w / n + 1, h: B.h } : { x: B.x, y: B.y + (B.h / n) * k + (B.h / n - bh / n) / 2, w: B.w, h: bh / n + 1 }
            // 8周目（指摘3）：一覧の名前では幕は地の色（明るい地＝生成り・暗い地＝近黒）。名前が地に拭われて消え、拭われて戻る＝見出しの後ろに面が写らない
            const el = c.fx(at(box) + `background:${p.color || c.paper};`)
            const o1 = p.dir === 1 ? "right" : "left", o2 = p.dir === 1 ? "left" : "right"
            const sc = vert ? "scaleY" : "scaleX"
            const org1 = vert ? "50% 100%" : `${o1} center`, org2 = vert ? "50% 0%" : `${o2} center`
            c.a(el, [
                { offset: 0, transform: `${sc}(0)`, transformOrigin: org1, easing: INOUT },
                { offset: pv * (T - 60) / T, transform: `${sc}(1)`, transformOrigin: org1 },
                { offset: (pv * (T - 60) + 60) / T, transform: `${sc}(1)`, transformOrigin: org2, easing: INOUT },
                { offset: 1, transform: `${sc}(0)`, transformOrigin: org2 },
            ], { duration: T, delay: k * 70, fill: "both" })
        }
        if (p.hide !== false) c.a(c.txt, [{ opacity: 0 }, { opacity: 0 }], { duration: pv * (T - 60) + 30 })
        return T + n * 70
    },
    // 細い羽根が順に閉じて開く（shutter）
    shutter(c: Ctx, p: { n: number; st: number; horiz?: boolean; dur: number }) {
        const B = pad(c.tb, c)
        const n = Math.round(p.n)
        for (let k = 0; k < n; k++) {
            const box = p.horiz ? { x: B.x, y: B.y + (B.h / n) * k, w: B.w, h: B.h / n + 1 } : { x: B.x + (B.w / n) * k, y: B.y, w: B.w / n + 1, h: B.h }
            const el = c.fx(at(box) + `background:${c.ink};`)
            const sc = p.horiz ? "scaleY" : "scaleX"
            c.a(el, [{ transform: `${sc}(0)`, easing: INOUT }, { offset: 0.45, transform: `${sc}(1)` }, { offset: 0.55, transform: `${sc}(1)`, easing: INOUT }, { transform: `${sc}(0)` }], { duration: p.dur, delay: k * p.st, fill: "both" })
        }
        c.a(c.txt, [{ opacity: 1 }, { offset: 0.5, opacity: 0 }, { offset: 0.5, opacity: 1 }, { opacity: 1 }], { duration: p.dur + (n - 1) * p.st })
        return p.dur + n * p.st
    },
    // 墨の面が満ち、その上の字は生成りで読める（fill-hover / section-color-swap / theme-toggle …）。ホールド可
    fill(c: Ctx, p: { dur: number; from: "left" | "right" | "bottom" | "top" | "center" | "circle"; ox?: number; oy?: number; ease?: string; blend?: boolean }): Hold {
        const B = pad(c.tb, c)
        const panel = c.fx(at(B) + `background:${c.ink};`)
        const g = c.ghost(c.paper)
        const ox = p.ox ?? 0, oy = p.oy ?? 0
        const closed =
            p.from === "left" ? "inset(0% 100% 0% 0%)" : p.from === "right" ? "inset(0% 0% 0% 100%)" : p.from === "bottom" ? "inset(100% 0% 0% 0%)"
            : p.from === "top" ? "inset(0% 0% 100% 0%)" : p.from === "center" ? "inset(0% 50% 0% 50%)" : `circle(0% at ${ox}px ${oy}px)`
        const open = p.from === "circle" ? `circle(150% at ${ox}px ${oy}px)` : "inset(0% 0% 0% 0%)"
        const gClosed = p.from === "circle" ? `circle(0px at ${ox}px ${oy}px)` : closed
        const gOpen = p.from === "circle" ? `circle(${Math.hypot(c.W, c.H) * 1.2}px at ${ox}px ${oy}px)` : open
        if (p.from === "circle") {
            // 円は面の座標で開く（面と字で同じ円になるよう、面も root 座標で切る）
            panel.style.cssText += `left:0;top:0;width:${c.W}px;height:${c.H}px;`
            c.a(panel, [{ clipPath: gClosed }, { clipPath: gOpen }], { duration: p.dur, easing: p.ease || EIO, fill: "both" })
            c.a(g, [{ clipPath: gClosed }, { clipPath: gOpen }], { duration: p.dur, easing: p.ease || EIO, fill: "both" })
        } else {
            c.a(panel, [{ clipPath: closed }, { clipPath: open }], { duration: p.dur, easing: p.ease || EIO, fill: "both" })
            // 字は root 全体の座標。面の範囲 B に合わせて切る
            const toRoot = (s: string) => s.replace(/inset\(([\d.]+)% ([\d.]+)% ([\d.]+)% ([\d.]+)%\)/, (_m, t, r, b, l) =>
                `inset(${B.y + (B.h * +t) / 100}px ${c.W - B.x - B.w + (B.w * +r) / 100}px ${c.H - B.y - B.h + (B.h * +b) / 100}px ${B.x + (B.w * +l) / 100}px)`)
            c.a(g, [{ clipPath: toRoot(closed) }, { clipPath: toRoot(open) }], { duration: p.dur, easing: p.ease || EIO, fill: "both" })
        }
        return { hold: true, ms: p.dur }
    },
    // 切り抜きが開く（clip-reveal / circle-reveal / expanding-search …）
    clip(c: Ctx, p: { from: string; to?: string; dur: number; ease?: string; extra?: Keyframe[] }) {
        c.a(c.txt, [{ clipPath: p.from }, { clipPath: p.to || "inset(-20% -5% -20% -5%)" }], { duration: p.dur, easing: p.ease || EXPO })
        return p.dur
    },
    // 下線が伸びる（underline / tab / loading-bar / scroll-progress / preloader）。ホールド可
    underline(c: Ctx, p: { dur: number; origin?: number; th?: number; color?: string; st?: number; ease?: string; behind?: boolean; height?: number; y?: number }): Hold {
        const lines = lineBoxes(c)
        lines.forEach((L, k) => {
            const th = p.th ?? Math.max(2, Math.round(c.fs * 0.045))
            const h = p.height ? L.h * p.height : th
            const y = p.behind ? L.y + L.h * (p.y ?? 0.58) - h / 2 : L.y + L.h - th * 0.5 + (p.y ?? 0)
            const el = c.fx(`left:${L.x}px;top:${y}px;width:${L.w}px;height:${h}px;background:${p.color || c.ink};${p.behind ? "z-index:-1;" : ""}`)
            const org = p.origin === 1 ? "50% 50%" : p.origin === 2 ? "100% 50%" : "0% 50%"
            c.a(el, [{ transform: "scaleX(0)", transformOrigin: org }, { transform: "scaleX(1)", transformOrigin: org }], { duration: p.dur, delay: k * (p.st || 0), easing: p.ease || OUT, fill: "both" })
        })
        return { hold: true, ms: p.dur + lines.length * (p.st || 0) }
    },
    // 進捗：線が伸び、線の先に合わせて字の切り抜きが開く（preloader-counter / loading-bar）
    progress(c: Ctx, p: { dur: number; th?: number; reveal?: boolean; ease?: string; to?: number; segs?: number }) {
        const L = c.tb
        const th = p.th ?? Math.max(2, Math.round(c.fs * 0.04))
        const y = L.y + L.h + c.fs * 0.06
        const segs = Math.max(1, Math.round(p.segs || 1))
        const gap = segs > 1 ? c.fs * 0.06 : 0
        const sw = (L.w - gap * (segs - 1)) / segs
        for (let k = 0; k < segs; k++) {
            const track = c.fx(`left:${L.x + k * (sw + gap)}px;top:${y}px;width:${sw}px;height:${th}px;background:rgba(10,10,10,.12);`)
            const bar = c.fx(`left:${L.x + k * (sw + gap)}px;top:${y}px;width:${sw}px;height:${th}px;background:${c.ink};transform-origin:0 50%;`)
            const d = segs > 1 ? p.dur / segs : p.dur
            c.a(bar, [{ transform: "scaleX(0)" }, { transform: `scaleX(${segs > 1 ? 1 : p.to ?? 1})` }], { duration: d, delay: k * d, easing: p.ease || (segs > 1 ? "linear" : EXPO), fill: "both" })
            c.a(track, [{ opacity: 1 }, { opacity: 1 }], { duration: p.dur + 400, fill: "both" })
            c.a(bar, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, delay: p.dur, fill: "forwards" })
            c.a(track, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, delay: p.dur, fill: "forwards" })
        }
        if (p.reveal) c.a(c.txt, [{ clipPath: `inset(-20% 100% -20% 0%)` }, { clipPath: `inset(-20% ${100 - (p.to ?? 1) * 100}% -20% 0%)` }], { duration: p.dur, easing: p.ease || EXPO })
        return p.dur + 420
    },
    // 位置を追う（magnetic）
    magnetic(c: Ctx, p: { strength: number; lerp: number; radius: number }): Follow {
        const R = Math.max(p.radius * (c.fs / 40), c.fs * 0.9)
        const ctr = c.chars.map((ch) => { const b = c.box(ch); return { x: b.x + b.w / 2, y: b.y + b.h / 2 } })
        const pos = c.chars.map(() => ({ x: 0, y: 0 }))
        let px = 0, py = 0, has = false
        return {
            kind: "f",
            move(x, y) { px = x; py = y; has = true },
            leave() { has = false },
            tick() {
                let moving = false
                c.chars.forEach((ch, i) => {
                    const dx = px - ctr[i].x, dy = py - ctr[i].y
                    const inR = has && Math.hypot(dx, dy) < R
                    // 寄る量は 0.15em まで（3周目：字同士が衝突して読めない時間があった）
                    const [tx, ty] = inR ? clampLen(dx * p.strength, dy * p.strength, c.em * 0.15) : [0, 0]
                    const k = inR ? p.lerp : p.lerp * 0.7
                    pos[i].x += (tx - pos[i].x) * k
                    pos[i].y += (ty - pos[i].y) * k
                    if (Math.abs(tx - pos[i].x) > 0.1 || Math.abs(ty - pos[i].y) > 0.1) moving = true
                    ch.style.transform = `translate3d(${pos[i].x.toFixed(2)}px,${pos[i].y.toFixed(2)}px,0)`
                })
                return moving || has
            },
        }
    },
    // ポインタで1枚を傾ける・ずらす（tilt / image-parallax-hover / mouse-parallax）
    pointerTx(c: Ctx, p: { lerp: number; fn: (nx: number, ny: number, el: HTMLElement, i: number) => string; u?: "txt" | "c" | "w"; origin?: string }): Follow {
        const els = p.u === "c" ? c.chars : p.u === "w" ? c.words : [c.txt]
        if (p.origin) els.forEach((e) => (e.style.transformOrigin = p.origin!))
        let tx = 0, ty = 0, cx = 0, cy = 0, has = false
        return {
            kind: "f",
            move(x, y) { tx = Math.max(-1, Math.min(1, (x - (c.tb.x + c.tb.w / 2)) / (c.tb.w / 2))); ty = Math.max(-1, Math.min(1, (y - (c.tb.y + c.tb.h / 2)) / (c.tb.h / 2 + c.fs * 0.5))); has = true },
            leave() { has = false; tx = 0; ty = 0 },
            tick() {
                cx += (tx - cx) * p.lerp
                cy += (ty - cy) * p.lerp
                els.forEach((e, i) => (e.style.transform = p.fn(cx, cy, e, i)))
                return has || Math.abs(cx) > 0.002 || Math.abs(cy) > 0.002
            },
        }
    },
    // 近い文字ほど大きく（dock-magnify / star-rating / focus-dim）。戻りは各自の transition に任せる
    pointerEach(c: Ctx, p: { settle: number; fn: (d: number, dx: number, el: HTMLElement, i: number, has: boolean) => Record<string, string>; u?: "c" | "w" }): Follow {
        const els = p.u === "w" ? c.words : c.chars
        const ctr = els.map((e) => { const b = c.box(e); return { x: b.x + b.w / 2, y: b.y + b.h / 2 } })
        let px = -1e4, py = -1e4, has = false, leftAt = 0
        const apply = (st: Record<string, string>, e: HTMLElement) => { for (const key in st) (e.style as any)[key] = st[key] }
        return {
            kind: "f",
            move(x, y) { px = x; py = y; has = true },
            leave() {
                has = false
                leftAt = performance.now()
                els.forEach((e, i) => apply(p.fn(1e5, 1e5, e, i, false), e))
            },
            tick() {
                if (has) {
                    els.forEach((e, i) => apply(p.fn(Math.hypot(px - ctr[i].x, (py - ctr[i].y) * 1.4), px - ctr[i].x, e, i, true), e))
                    return true
                }
                return performance.now() - leftAt < p.settle
            },
        }
    },
    // 円の中だけを見せる層（spotlight / xray / custom-cursor）
    lens(c: Ctx, p: { r: number; lerp: number; soft: number; mode: "spot" | "xray" | "cursor"; blend?: string }): Follow {
        let px = c.tb.x, py = c.tb.y + c.tb.h / 2, cx = px, cy = py, has = false, o = 0
        let g: HTMLElement | null = null, disc: HTMLElement | null = null
        if (p.mode === "spot") {
            g = c.ghost()
        } else if (p.mode === "xray") {
            disc = c.fx(`left:0;top:0;width:${p.r * 2}px;height:${p.r * 2}px;border-radius:50%;background:${c.paper};box-shadow:0 0 0 1px ${c.ink};`)
            g = c.ghost("transparent")
            g.style.setProperty("-webkit-text-stroke", `${Math.max(1, c.fs / 70)}px ${c.ink}`)
        } else {
            disc = c.fx(`left:0;top:0;width:${p.r * 2}px;height:${p.r * 2}px;border-radius:50%;background:${p.blend === "normal" ? c.ink : c.paper};mix-blend-mode:${p.blend || "difference"};`)
        }
        return {
            kind: "f",
            move(x, y) { px = x; py = y; has = true },
            leave() { has = false },
            tick() {
                cx += (px - cx) * p.lerp
                cy += (py - cy) * p.lerp
                o += ((has ? 1 : 0) - o) * 0.12
                const mask = `radial-gradient(circle ${p.r}px at ${cx}px ${cy}px, #000 ${Math.round((1 - p.soft) * 100)}%, transparent 100%)`
                if (g) {
                    g.style.setProperty("-webkit-mask-image", mask)
                    g.style.setProperty("mask-image", mask)
                    g.style.opacity = String(o)
                }
                if (p.mode === "spot") c.txt.style.opacity = String(1 - o * 0.78)
                if (disc) {
                    disc.style.transform = `translate(${cx - p.r}px, ${cy - p.r}px) scale(${0.4 + o * 0.6})`
                    disc.style.opacity = String(o)
                }
                return has || o > 0.01
            },
        }
    },
    // 時間で揺れる（line-boil / flame / twinkle / equalizer / ambient-float …）。fn は t(0..1) ごとの姿
    jitter(c: Ctx, p: { dur: number; fps: number; u?: "c" | "w"; origin?: string; fn: (i: number, t: number, r: () => number) => Keyframe }) {
        const els = p.u === "w" ? c.words : c.chars
        const steps = Math.max(2, Math.round((p.dur / 1000) * p.fps))
        els.forEach((el, i) => {
            const r = rnd(17 + i * 31)
            if (p.origin) el.style.transformOrigin = p.origin
            const kf: Keyframe[] = []
            for (let k = 0; k <= steps; k++) {
                const t = k / steps
                kf.push({ offset: t, ...(k === steps ? p.fn(i, 1, () => 0.5) : p.fn(i, t, r)) })
            }
            c.a(el, kf, { duration: p.dur, easing: p.fps >= 30 ? "linear" : `steps(${steps}, end)` })
        })
        return p.dur
    },
}

/* ------------------------------------------------------------------ */
/* 章扉と同じ演技（C）。値は章扉が使っている項目の既定値                    */
/* ------------------------------------------------------------------ */

type Spec = [grade: "A" | "B" | "C", fn: ((c: Ctx, v: V) => R) | string, flags?: string, keys?: string]

const CH: Record<string, { slug: string; ja: string; label: string; flags?: string; fn: (c: Ctx) => R }> = {
    hover: { slug: "magnetic-hover", ja: "マグネティックホバー", label: "strength 0.35 · lerp 0.12", flags: "f", fn: (c) => ACT.magnetic(c, { strength: 0.35, lerp: 0.12, radius: 140 }) },
    scroll: { slug: "velocity-skew", ja: "速度スキュー", label: "factor 0.5 · max 8°", flags: "s", fn: (c) => skewAct(c, { factor: 0.5, maxSkew: 8, lerp: 0.1 }) },
    text: { slug: "split-text-reveal", ja: "分割テキストリビール", label: "stagger 30ms · 0.6s", fn: (c) => ACT.rise(c, { dur: 600, st: 30, op: true }) },
    transition: { slug: "curtain-wipe", ja: "カーテンワイプ", label: "0.8s × 2 · in-out", fn: (c) => ACT.curtain(c, { dur: 800 }) },
    media: { slug: "clip-reveal", ja: "クリップリビール", label: "0.9s · expo-out", fn: (c) => ACT.clip(c, { from: "inset(-20% 100% -20% -5%)", dur: 900 }) },
    ui: { slug: "press-feedback", ja: "プレスフィードバック", label: "scale 0.97 · 0.05s / 0.2s", fn: (c) => pressAct(c, { depth: 2, scale: 0.97, release: 0.2 }) },
    loading: { slug: "preloader-counter", ja: "プリローダーカウンター", label: "1.8s · expo-out", fn: (c) => ACT.progress(c, { dur: 1800, reveal: true }) },
}

function skewAct(c: Ctx, v: { factor: number; maxSkew: number; lerp: number }): Scroll {
    // 名前の右端の縦ずれが 0.3em を超えない角度まで（長い和名を 8° で傾けると、実演面の大きさでは端が 150px ずれて字の並びが読めなかった）
    const maxSkew = Math.min(v.maxSkew, (Math.atan((c.em * 0.3) / Math.max(1, c.tb.w)) * 180) / Math.PI)
    let target = 0, cur = 0
    c.txt.style.transformOrigin = "left center"
    return {
        kind: "s",
        push(vel) { target = Math.max(-maxSkew, Math.min(maxSkew, vel * v.factor)) },
        tick() {
            cur += (target - cur) * v.lerp
            target *= 0.9
            if (Math.abs(cur) < 0.01 && Math.abs(target) < 0.01) cur = 0
            c.txt.style.transform = `skewY(${cur.toFixed(2)}deg)`
            return cur !== 0 || Math.abs(target) > 0.01
        },
    }
}
function pressAct(c: Ctx, v: { depth: number; scale: number; release: number }) {
    // press-feedback：入り 0.05s で沈む → 押している間 → 戻り release（非対称）。章扉と同じく、押している間だけ地と字が反転する
    const d = (v.depth / 16) * c.fs * 0.5
    const R = S(v.release)
    const T = 50 + 260 + R
    const B = pad(c.tb, c, 0.14)
    // 8周目：一覧では押した札を塗らない（近黒の面が見出しの後ろの「板」に写った）。札の輪郭 1px と沈みで「押した」を見せる
    const panel = c.fx(at(B) + `border:1px solid ${c.ink};box-sizing:border-box;border-radius:${B.h}px;`)
    const o = `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`
    const kf: Keyframe[] = [
        { offset: 0, transform: "translateY(0px) scale(1)", easing: "ease-out" },
        { offset: 50 / T, transform: `translateY(${d}px) scale(${v.scale})` },
        { offset: 310 / T, transform: `translateY(${d}px) scale(${v.scale})`, easing: "ease-out" },
        { offset: 1, transform: "translateY(0px) scale(1)" },
    ]
    const op: Keyframe[] = [{ offset: 0, opacity: 0, easing: "ease-out" }, { offset: 50 / T, opacity: 1 }, { offset: 310 / T, opacity: 1, easing: "ease-out" }, { offset: 1, opacity: 0 }]
    ;[c.txt, panel].forEach((el) => { el.style.transformOrigin = o })
    panel.style.transformOrigin = "50% 50%"
    c.a(c.txt, kf, { duration: T, delay: 120 })
    c.a(panel, kf, { duration: T, delay: 120, fill: "both" })
    c.a(panel, op, { duration: T, delay: 120, fill: "both" })
    return T + 140
}
function parallaxAct(c: Ctx, v: V): Scroll {
    const depth = c.words.map((_, i) => [1, 0.35, 0.7, 0.15, 0.85, 0.5][i % 6])
    const cur = c.words.map(() => 0)
    let off = 0
    return {
        kind: "s",
        push(_vel, o) { off = o },
        tick() {
            let moving = false
            c.words.forEach((w, i) => {
                const t = -off * v.strength * depth[i]
                cur[i] += (t - cur[i]) * v.lerp
                if (Math.abs(t - cur[i]) > 0.05) moving = true
                w.style.transform = `translateY(${cur[i].toFixed(2)}px)`
            })
            return moving || off !== 0
        },
    }
}

/* ------------------------------------------------------------------ */
/* 対応表：slug → [段階, 演技, フラグ, 表示する値]                         */
/* フラグ f＝ポインタを追う（ホバー中ずっと）／h＝ホバー中は保つ／s＝スクロールに反応     */
/* ------------------------------------------------------------------ */

const ord3 = (o: number): Ord => (o === 1 ? "line" : o === 2 ? "col" : "diag")

const SPEC: Record<string, Spec> = {
    /* ── hover ── */
    "magnetic-hover": ["B", (c, v) => ACT.magnetic(c, { strength: v.strength, lerp: v.lerp, radius: v.radius }), "f"],
    "custom-cursor": ["B", (c, v) => ACT.lens(c, { r: K(c, v.size, 24), lerp: v.lerp, soft: 0, mode: "cursor", blend: ["normal", "difference", "exclusion"][Math.round(v.blend)] }), "f", "size,blend"],
    "tilt": ["B", (c, v) => ACT.pointerTx(c, { lerp: 0.1, origin: `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`, fn: (x, y) => `perspective(${v.perspective * (c.tb.w / 320)}px) rotateX(${(-y * v.maxAngle).toFixed(2)}deg) rotateY(${(x * v.maxAngle).toFixed(2)}deg) scale(${Math.min(1.04, 1 + (v.scale - 1) * Math.min(1, Math.hypot(x, y) * 3))})` }), "f", "maxAngle,perspective"],
    "text-scramble": ["A", (c, v) => ACT.scramble(c, { cs: ["ABCDEFGHIJKLMNOPQRSTUVWXYZ", "0123456789", "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ", "!<>-_\\/[]{}=+*^?#"][Math.round(v.charset)] || "ABC", lockAt: (i) => 160 + i * v.speed * 1.6 }), "", "speed,charset"],
    "underline-reveal": ["A", (c, v) => ACT.underline(c, { dur: S(v.duration), origin: v.origin }), "h"],
    "spotlight-hover": ["B", (c, v) => ACT.lens(c, { r: K(c, v.radius, 40), lerp: 0.18, soft: v.softness, mode: "spot" }), "f"],
    "fill-hover": ["B", (c, v) => ACT.fill(c, { dur: S(v.duration), from: (["left", "bottom", "center"] as const)[Math.round(v.direction)] }), "h"],
    "directional-hover": ["B", (c, v) => ACT.fill(c, { dur: S(v.duration), from: "left" }), "h"],
    "lift-hover": ["A", (c, v) => liftAct(c, v), "h"],
    "focus-dim": ["B", (c, v) => ACT.pointerEach(c, {
        u: "w", settle: S(v.duration) + 100,
        fn: (d, _dx, el, _i, has) => {
            const b = c.box(el)
            const on = has && d < Math.max(b.w / 2, c.fs * 0.6)
            return { opacity: String(on || !has ? 1 : v.dimOpacity), filter: on || !has ? "blur(0px)" : `blur(${K(c, v.dimBlur, 40)}px)`, transition: `opacity ${v.duration}s, filter ${v.duration}s` }
        },
    }), "f", "dimOpacity,dimBlur"],
    "border-draw": ["B", (c, v) => borderDraw(c, v), "h"],
    "image-trail": ["B", (c, v) => trailAct(c, v), "f"],
    "glitch-hover": ["A", (c, v) => glitchAct(c, v), ""],
    "text-slide-swap": ["A", (c, v) => ACT.slideSwap(c, { dur: S(v.duration) * 1.6, st: 22, up: v.direction !== 1 }), ""],
    "hover-preview": ["B", (c, v) => previewAct(c, v), "f"],
    "hover-wave": ["A", (c, v) => each(c, { dur: S(v.duration), st: S(v.delay), ease: "ease-in-out", kf: () => [{ transform: "translateY(0px)" }, { transform: `translateY(${-K(c, v.height, 24)}px)` }, { transform: "translateY(0px)" }] }), "", "delay,height"],
    "image-swap-hover": ["B", (c, v) => ACT.swapOut(c, { mode: v.mode === 1 ? "wipe" : "fade", dur: S(v.duration) * 1.4, hold: 700 }), ""],
    "mouse-parallax": ["B", (c, v) => ACT.pointerTx(c, { u: "w", lerp: v.lerp, fn: (x, y, _e, i) => { const d = [1, 0.4, 0.75, 0.2, 0.9][i % 5] * (v.direction === 1 ? -1 : 1) * Math.min(K(c, v.strength, 40), c.em * 0.15); return `translate(${(x * d).toFixed(2)}px, ${(y * d * 0.6).toFixed(2)}px)` } }), "f"],
    "shadow-pop": ["A", (c, v) => shadowPop(c, v), "h", "depth,steps"],
    "row-expand": ["B", (c, v) => { c.txt.style.transformOrigin = `${c.tb.x}px ${c.tb.y + c.tb.h}px`; c.a(c.txt, [{ transform: "scale(1)" }, { transform: `scale(${1 + (v.grow - 1) * 0.35})` }], { duration: S(v.duration), easing: OUT, fill: "both" }); return { hold: true, ms: S(v.duration) } }, "h", "grow,duration"],
    "dock-magnify": ["B", (c, v) => ACT.pointerEach(c, {
        settle: S(v.duration) + 200,
        fn: (d, _dx, _e, _i, has) => { const r = K(c, v.range, 40); const k = has ? Math.max(0, 1 - d / r) : 0; const s = Math.min(1.04, 1 + (v.maxScale - 1) * k * k * 0.6); return { transform: `translateY(${(-Math.min(K(c, v.lift, 40), c.em * 0.15) * k).toFixed(2)}px) scale(${s.toFixed(3)})`, transformOrigin: "50% 100%", transition: `transform ${v.duration}s ease-out` } },
    }), "f", "maxScale,range"],
    "cube-roll": ["A", (c, v) => cubeRoll(c, v), "", "duration,depth"],
    "letter-spacing-hover": ["A", (c, v) => lsHold(c, v), "h", "spacing,duration"],
    "line-boil": ["A", (c, v) => ACT.jitter(c, { dur: 1600, fps: v.fps, fn: (_i, t, r) => { const a = K(c, v.amplitude, 24) * Math.sin(Math.PI * t); return { transform: `translate(${((r() - 0.5) * 2 * a).toFixed(2)}px, ${((r() - 0.5) * 2 * a).toFixed(2)}px) rotate(${((r() - 0.5) * 2 * v.rotation * Math.sin(Math.PI * t)).toFixed(2)}deg)` } } }), "", "fps,amplitude"],
    "holo-sheen": ["B", (c, v) => sheen(c, { dur: Math.min(S(v.period), 2600), angle: v.angle, band: 18, alpha: v.intensity }), "", "period,angle"],
    "arrow-slide-through": ["B", (c, v) => { const d = S(v.duration); const tr = K(c, v.travel, 40); return whole(c, [{ offset: 0, transform: "translateX(0px)", opacity: 1, easing: "cubic-bezier(.5,0,.75,0)" }, { offset: v.exit / 100, transform: `translateX(${tr}px)`, opacity: 0 }, { offset: v.exit / 100, transform: `translateX(${-tr}px)`, opacity: 0, easing: OUT }, { offset: 1, transform: "translateX(0px)", opacity: 1 }], d * 1.4, "linear", undefined, CLIP_BOX) }, "", "duration,travel"],
    "xray-lens": ["B", (c, v) => ACT.lens(c, { r: K(c, v.radius, 40), lerp: v.follow * 0.3, soft: 0, mode: "xray" }), "f", "radius,follow"],
    "flame-flicker": ["B", (c, v) => ACT.jitter(c, { dur: S(v.duration) * 1.4, fps: 14, origin: "50% 100%", fn: (_i, t, r) => { const e = Math.sin(Math.PI * t); return { transform: `skewX(${((r() - 0.5) * 2 * v.lean * e).toFixed(2)}deg) scaleY(${(1 + (r() * v.stretch / 100) * e).toFixed(3)})`, opacity: String(1 - r() * 0.25 * e) } } }), "", "duration,lean"],

    /* ── scroll ── */
    "scroll-fade-in": ["A", (c, v) => ACT.from(c, { u: "w", t: `translateY(${K(c, v.distance, 24)}px)`, dur: S(v.duration), st: v.stagger, ease: "cubic-bezier(.25,.46,.45,.94)" }), "", "distance,stagger"],
    "perspective-reveal": ["A", (c, v) => { c.txt.style.perspective = `${v.perspective * (c.fs / 40)}px`; return ACT.from(c, { u: "w", t: `rotateX(${v.rotateX}deg) translateY(${c.fs * 0.2}px)`, origin: "50% 100%", dur: S(v.duration), st: v.stagger, ease: OUT }) }, "", "rotateX,stagger"],
    "parallax": ["B", (c, v) => parallaxAct(c, v), "s"],
    "scroll-progress": ["B", (c, v) => ACT.progress(c, { dur: 1400, th: Math.max(1, K(c, v.height, 24)), ease: `cubic-bezier(${Math.min(0.9, v.smoothing)},0,0.2,1)` }), "", "height,smoothing"],
    "velocity-skew": ["A", (c, v) => skewAct(c, { factor: v.factor, maxSkew: v.maxSkew, lerp: v.lerp }), "s", "factor,maxSkew"],
    "text-highlight": ["A", (c, v) => each(c, { dur: 520, st: 26 + v.stagger * 6, ease: "ease-out", kf: () => [{ opacity: 0.18 + v.offset / 200 }, { opacity: 1 }] }), "", "stagger,span"],
    "scroll-zoom": ["B", (c, v) => whole(c, [{ transform: "scale(1)" }, { transform: `scale(${v.direction === 1 ? 1 / v.zoom : v.zoom})` }, { transform: "scale(1)" }], 1800, EIO, `${c.tb.x}px ${c.tb.y + c.tb.h / 2}px`), "", "zoom,direction"],
    "sticky-pin": ["C", "scroll"],
    "scroll-scrub": ["C", "scroll"],
    "text-on-path": ["B", (c, v) => each(c, { dur: 1600, st: 30, ease: EIO, kf: (i, n) => { const x = i / Math.max(1, n - 1); const y = -Math.sin(Math.PI * x) * K(c, v.curve, 90) * 0.5; const r = -Math.cos(Math.PI * x) * v.curve * 0.18; return [{ transform: "translateY(0px) rotate(0deg)" }, { offset: 0.5, transform: `translateY(${y.toFixed(1)}px) rotate(${r.toFixed(1)}deg)` }, { transform: "translateY(0px) rotate(0deg)" }] } }), "", "curve"],
    "horizontal-scroll": ["B", (c, v) => { const X = c.tb.w * 0.35 * v.distance; return whole(c, [{ transform: "translateX(0px)", easing: EIO }, { offset: 0.45, transform: `translateX(${-X}px)` }, { offset: 0.45, transform: `translateX(${c.W - c.tb.x}px)`, easing: OUT }, { transform: "translateX(0px)" }], 2200, "linear", undefined, CLIP_BOX) }, "", "distance"],
    "scroll-snap": ["B", (c, v) => whole(c, [{ transform: "translateY(0px)", easing: "ease-in" }, { offset: 0.35, transform: `translateY(${-c.fs * 0.45}px)`, easing: v.strictness === 1 ? "cubic-bezier(.3,.7,.4,1)" : BACK }, { transform: "translateY(0px)" }], v.strictness === 1 ? 1100 : 800), "", "strictness,align"],
    "section-color-swap": ["B", (c, v) => ACT.fill(c, { dur: S(v.duration), from: "bottom" }), "", "duration,trigger"],
    "scroll-spy": ["C", "scroll"],
    "stacking-cards": ["B", (c, v) => stackAct(c, v), "", "peek,scale"],
    "smooth-scroll": ["B", (c, v) => each(c, { dur: 900 / Math.max(0.3, v.lerp * 10) + 500, st: 110, ord: "line", ease: "cubic-bezier(.1,.6,.2,1)", kf: () => [{ transform: `translateY(${c.fs * 0.6 * v.multiplier}px)` }, { transform: "translateY(0px)" }] }) , "", "lerp,multiplier"],
    "header-shrink": ["B", (c, v) => whole(c, [{ transform: "scale(1)", easing: "ease" }, { offset: 0.4, transform: `scale(${v.ratio})` }, { offset: 0.65, transform: `scale(${v.ratio})`, easing: "ease" }, { transform: "scale(1)" }], S(v.duration) * 4, "linear", `${c.tb.x}px ${c.tb.y}px`), "", "ratio,duration"],
    "header-hide-on-scroll": ["B", (c, v) => whole(c, [{ transform: "translateY(0%)", easing: "ease-in" }, { offset: 0.4, transform: "translateY(-120%)" }, { offset: 0.55, transform: "translateY(-120%)", easing: OUT }, { transform: "translateY(0%)" }], S(v.duration) * 3.4, "linear", undefined, "inset(-0.05em -0.1em -0.25em -0.1em)"), "", "duration,tolerance"],
    "header-invert": ["B", (c, v) => ACT.fill(c, { dur: S(v.duration), from: "top" }), "", "duration,mode"],
    "footer-reveal": ["B", (c, v) => { const sh = c.fx(at(pad(c.tb, c)) + `background:${c.ink};`); c.a(sh, [{ opacity: v.dim }, { opacity: 0 }], { duration: 900, easing: "ease-out", fill: "both" }); return whole(c, [{ transform: `translateY(${K(c, v.lift, 24)}px)` }, { transform: "translateY(0px)" }], 900, OUT) }, "", "lift,dim"],
    "scroll-marquee": ["B", (c, v) => marquee(c, { speed: K(c, v.speed * (1 + v.factor * 0.5), 24), gap: c.fs, dir: 1 }), "", "speed,factor"],
    "progressive-blur": ["B", (c, v) => each(c, { dur: 1600, ease: EIO, kf: (_i, _n, el) => { const b = c.box(el); const t = v.edge === 1 ? 1 - (b.x - c.tb.x) / c.tb.w : (b.x - c.tb.x) / c.tb.w; const bl = Math.pow(Math.max(0, (t - (1 - v.height / 100)) / (v.height / 100)), 1.5) * v.maxBlur * (c.fs / 80); return [{ filter: "blur(0px)", opacity: 1 }, { offset: 0.45, filter: `blur(${bl.toFixed(1)}px)`, opacity: 1 - (bl / (v.maxBlur * (c.fs / 80) + 0.01)) * 0.6 }, { offset: 0.6, filter: `blur(${bl.toFixed(1)}px)`, opacity: 1 - (bl / (v.maxBlur * (c.fs / 80) + 0.01)) * 0.6 }, { filter: "blur(0px)", opacity: 1 }] } }), "", "maxBlur,height"],
    "rubber-band": ["B", (c, v) => { const d = Math.min(K(c, v.maxOverscroll, 24) * 0.5, c.fs * v.pull * 4); return whole(c, [{ transform: "translateY(0px) scaleY(1)", easing: "cubic-bezier(.2,.8,.3,1)" }, { offset: 0.4, transform: `translateY(${d}px) scaleY(${1 + v.pull * 0.3})` }, { offset: 0.5, transform: `translateY(${d}px) scaleY(${1 + v.pull * 0.3})`, easing: "cubic-bezier(.2,1.3,.4,1)" }, { transform: "translateY(0px) scaleY(1)" }], 700 + S(v.snapBack) * 1.5, "linear", `50% 0%`) }, "", "pull,snapBack"],

    /* ── text ── */
    "split-text-reveal": ["A", (c, v) => ACT.rise(c, { dur: S(v.duration), st: v.stagger, y: Math.min(140, (v.yOffset / 30) * 115), op: true }), "", "stagger,duration"],
    "block-reveal": ["A", (c, v) => ACT.curtain(c, { dur: S(v.duration) * 0.6, pivot: v.pivot / 100, barH: v.barHeight / 100, color: c.ink }), "", "duration,pivot"],
    "typewriter": ["A", (c, v) => ACT.typewriter(c, { speed: v.speed, blink: v.blink }), "", "speed,blink"],
    "counter": ["A", (c, v) => { const D = S(v.duration); const n = c.chars.length; const e = [(t: number) => t, (t: number) => 1 - (1 - t) * (1 - t), (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))][Math.round(v.ease)] || ((t: number) => t); const inv = (y: number) => { let lo = 0, hi = 1; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (e(m) < y) lo = m; else hi = m } return hi }; return ACT.scramble(c, { cs: "0123456789", tick: 40, lockAt: (i) => D * inv((i + 1) / n) }) }, "", "duration,ease"],
    "marquee": ["A", (c, v) => marquee(c, { speed: K(c, v.speed, 24), gap: K(c, v.gap, 24), dir: v.direction === 1 ? -1 : 1 }), "", "speed,direction"],
    "blur-reveal": ["A", (c, v) => ACT.blur(c, { blur: v.blur, duration: v.duration, stagger: v.stagger })],
    "wave-text": ["A", (c, v) => ACT.wave(c, { amp: K(c, v.amplitude, 24), period: S(v.speed), cycles: 2 }), "", "amplitude,speed"],
    "word-rotate": ["A", (c, v) => ACT.swapOut(c, { mode: "rise", dur: S(v.duration), hold: S(v.interval) * 0.6 }), "", "interval,duration"],
    "outline-fill": ["A", (c, v) => ACT.outline(c, { dur: S(v.duration), dir: v.direction }), "", "duration,direction"],
    "gradient-shine": ["A", (c, v) => sheen(c, { dur: S(v.period), angle: 100, band: v.band, alpha: 0.85 }), "", "period,band"],
    "number-roll": ["A", (c, v) => ACT.slideSwap(c, { dur: S(v.duration) / 3, st: v.stagger * 0.6, times: 3 }), "", "duration,stagger"],
    "split-flap": ["A", (c, v) => splitFlap(c, v), "", "flip,steps"],
    "tracking-in": ["A", (c, v) => ACT.tracking(c, { spread: v.spread, dur: S(v.duration), ease: ["ease-out", EXPO, EIO][Math.round(v.ease)] || EXPO }), "", "spread,duration"],
    "text-flip": ["A", (c, v) => ACT.flip(c, { duration: v.duration, perspective: v.perspective }), "", "duration,perspective"],
    "color-wave": ["A", (c, v) => { const b = Math.max(1, Math.round(v.batch)); let end = 0; c.chars.forEach((ch, i) => { const d = Math.floor(i / b) * v.stagger; c.a(ch, [{ opacity: v.dim / 100 }, { offset: 0.35, opacity: 1 }, { opacity: 1 }], { duration: 260 + v.hold, delay: 160 + d }); end = Math.max(end, 160 + d + 260 + v.hold) }); return end }, "", "stagger,hold"],
    "marker-line": ["A", (c, v) => { const h = ACT.underline(c, { dur: S(v.duration), behind: true, height: v.thickness / 100, y: 0.62, color: c.accent, st: 120 }); c.rootStyle({ isolation: "isolate" }); return { hold: true, ms: h.ms + S(v.delay) } }, "", "duration,thickness"],
    "rotating-badge": ["B", (c, v) => ringAct(c, { turn: (360 / v.duration) * 2.4 * (v.direction === 1 ? -1 : 1), dur: 3600 }), "", "duration,direction"],
    "opening-crawl": ["A", (c, v) => whole(c, [{ transform: `perspective(${K(c, v.perspective, 40)}px) rotateX(0deg) translateY(0px)`, opacity: 1, easing: EIO }, { offset: 0.25, transform: `perspective(${K(c, v.perspective, 40)}px) rotateX(${v.tilt}deg) translateY(0px)`, opacity: 1, easing: "linear" }, { offset: 0.7, transform: `perspective(${K(c, v.perspective, 40)}px) rotateX(${v.tilt}deg) translateY(${-c.fs * 3 * (18 / v.duration)}px)`, opacity: 1 - v.fade / 100, easing: EIO }, { transform: `perspective(${K(c, v.perspective, 40)}px) rotateX(0deg) translateY(0px)`, opacity: 1 }], 3600, "linear", "50% 100%"), "", "tilt,perspective"],
    "sliced-text": ["A", (c, v) => sliced(c, v), "", "slices,tilt"],
    "weight-morph": ["B", (c, v) => each(c, { dur: S(v.duration), st: v.stagger, ease: EIO, kf: () => { const w = ((c.fs * 0.03 * (v.wmax - v.wmin)) / 800).toFixed(2); const sh = (x: string) => `${x}px 0 0 ${c.ink}, -${x}px 0 0 ${c.ink}, 0 ${x}px 0 ${c.ink}, 0 -${x}px 0 ${c.ink}`; return [{ textShadow: sh("0") }, { textShadow: sh(w) }, { textShadow: sh("0") }] } }), "", "wmin,wmax"],

    /* ── transition ── */
    "curtain-wipe": ["A", (c, v) => ACT.curtain(c, { dur: S(v.duration), n: v.panels, dir: v.direction }), "", "duration,panels"],
    "crossfade": ["B", (c, v) => ACT.swapOut(c, { mode: "fade", dur: S(v.duration), hold: 600, zoom: v.zoomIn }), "", "duration,zoomIn"],
    "cover-transition": ["B", (c, v) => coverAct(c, v), "", "duration,rise"],
    "gradient-wipe": ["B", (c, v) => gradWipe(c, v), "", "angle,softness"],
    "gradient-morph": ["C", "transition"],
    "circle-reveal": ["A", (c, v) => { const o = [[0.5, 0.5], [0.5, 0.5], [0, 0], [1, 1]][Math.round(v.origin)] || [0.5, 0.5]; const x = c.tb.x + c.tb.w * o[0], y = c.tb.y + c.tb.h * o[1]; return ACT.clip(c, { from: `circle(0px at ${x}px ${y}px)`, to: `circle(${Math.hypot(c.W, c.H)}px at ${x}px ${y}px)`, dur: S(v.duration), ease: "cubic-bezier(.4,0,.2,1)" }) }, "", "duration,origin"],
    "menu-reveal": ["B", (c, v) => ACT.rise(c, { u: "w", dur: S(v.duration), st: S(v.stagger), op: true }), "", "duration,stagger"],
    "shutter-transition": ["A", (c, v) => ACT.shutter(c, { n: v.panels, st: v.stagger, horiz: v.orientation === 1, dur: 900 }), "", "panels,stagger"],
    "crt-power-off": ["A", (c, v) => crt(c, v), "", "duration,line"],
    "zoom-through": ["A", (c, v) => { const o = `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`; return whole(c, [{ offset: 0, transform: "scale(1)", opacity: 1, easing: "cubic-bezier(.7,0,.84,0)" }, { offset: 0.5, transform: `scale(${v.zoom})`, opacity: 0 }, { offset: 0.5, transform: `scale(${1 / Math.sqrt(v.zoom)})`, opacity: 0, easing: EXPO }, { offset: 1, transform: "scale(1)", opacity: 1 }], S(v.duration) * 2, "linear", o) }, "", "duration,zoom"],
    "split-screen": ["A", (c, v) => splitScreen(c, v), "", "duration,axis"],
    "shared-element": ["B", (c, v) => { const dy = c.H + c.fs * 0.3; return each(c, { dur: S(v.duration) * 1.3, st: 14, ease: [OUT, EIO, BACK][Math.round(v.easing)] || OUT, kf: (_i, _n, el) => { const b = c.box(el); return [{ transform: `translate(${(c.tb.x + (b.x - c.tb.x) * 0.22) - b.x}px, ${dy - b.y + c.tb.y}px) scale(0.22)`, opacity: 0.0 }, { offset: 0.15, opacity: 1 }, { transform: "translate(0px,0px) scale(1)", opacity: 1 }] }, origin: "0 0" }) }, "", "duration,easing"],

    /* ── media ── */
    "image-zoom-hover": ["B", (c, v) => { c.txt.style.transformOrigin = `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`; c.a(c.txt, [{ transform: "scale(1)" }, { transform: `scale(${v.scale})` }], { duration: S(v.duration), easing: "cubic-bezier(.25,.46,.45,.94)", fill: "both" }); return { hold: true, ms: S(v.duration) } }, "h"],
    "clip-reveal": ["A", (c, v) => ACT.clip(c, { from: ["inset(-20% 100% -20% -5%)", "inset(100% -5% -20% -5%)", "inset(50% 50% 50% 50%)"][Math.round(v.direction)] || "inset(-20% 100% -20% -5%)", dur: S(v.duration) }), "", "duration,direction"],
    "counter-scale": ["B", (c, v) => counterScale(c, v), "", "aperture,zoom"],
    "ken-burns": ["B", (c, v) => { const D = S(v.duration); const z = Math.min(1.04, v.zoom); const pan = Math.min(0.5, v.pan); const o = `${c.tb.x + c.tb.w * 0.3}px ${c.tb.y + c.tb.h / 2}px`; return whole(c, [{ offset: 0, transform: "scale(1) translate(0%, 0%)", easing: "cubic-bezier(.33,0,.67,1)" }, { offset: D / (D + 900), transform: `scale(${z}) translate(${-pan}%, ${-pan * 0.4}%)`, easing: EIO }, { offset: 1, transform: "scale(1) translate(0%, 0%)" }], D + 900, "linear", o) }, "", "zoom,duration"],
    "duotone-hover": ["C", "media"],
    "image-parallax-hover": ["B", (c, v) => { c.rootStyle({ clipPath: CLIP_BOX }); const s = Math.min(K(c, v.shift, 40), c.em * 0.15); return ACT.pointerTx(c, { lerp: Math.min(0.3, 0.05 / Math.max(0.1, v.duration) * 2), fn: (x, y) => `translate(${(-x * s).toFixed(2)}px, ${(-y * s * 0.5).toFixed(2)}px) scale(${Math.min(1.02, 1 + (Math.min(1, Math.hypot(x, y)) * s) / c.tb.w)})` }) }, "f", "shift"],
    "blur-load": ["A", (c, v) => whole(c, [{ filter: `blur(${v.blur * (c.fs / 80)}px)`, transform: "scale(1.02)" }, { filter: "blur(0px)", transform: "scale(1)" }], S(v.duration), "ease-out", `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`), "", "blur,duration"],
    "rack-focus": ["A", (c, v) => { const b = v.blur * (c.fs / 80); return whole(c, [{ filter: `blur(${b}px)`, easing: "ease-in-out" }, { offset: 0.55, filter: "blur(0px)" }, { offset: 0.7, filter: `blur(${(b * v.hunt).toFixed(1)}px)`, easing: "ease-out" }, { filter: "blur(0px)" }], S(v.duration) * 1.3) }, "", "blur,hunt"],
    "before-after": ["B", (c, v) => beforeAfter(c, v), "", "initial,follow"],
    "mosaic-reveal": ["B", (c, v) => mosaic(c, v), "", "tiles,order"],
    "quadtree-reveal": ["B", (c, v) => quadtree(c, v), "", "depth,threshold"],
    "lightbox": ["C", "media"],
    "carousel": ["B", (c, v) => carouselAct(c, S(v.duration)), "", "duration"],
    "cover-flow": ["B", (c, v) => { c.txt.style.perspective = `${c.fs * 8}px`; const n = c.words.length; return each(c, { u: "w", dur: S(v.duration) * 3, ease: EIO, origin: "50% 50%", kf: (i) => { const s = i - (n - 1) / 2; const r = s === 0 ? 0 : -Math.sign(s) * v.angle; return [{ transform: "none" }, { offset: 0.4, transform: `translateX(${s * K(c, v.spacing, 40) * 0.6}px) translateZ(${s === 0 ? 0 : -K(c, v.depth, 40)}px) rotateY(${r}deg)` }, { offset: 0.6, transform: `translateX(${s * K(c, v.spacing, 40) * 0.6}px) translateZ(${s === 0 ? 0 : -K(c, v.depth, 40)}px) rotateY(${r}deg)` }, { transform: "none" }] } }) }, "", "angle,depth"],
    "drag-scroll": ["B", (c, v) => { const kf: Keyframe[] = []; let x = 0, vel = c.fs * 0.5 * v.throw; const N = 60; for (let k = 0; k <= N; k++) { kf.push({ offset: k / N * 0.7, transform: `translateX(${-x.toFixed(1)}px)` }); x += vel; vel *= v.friction } kf.push({ offset: 1, transform: "translateX(0px)" }); kf[kf.length - 2].easing = BACK; return whole(c, kf, 1600, "linear", undefined, CLIP_BOX) }, "", "friction,throw"],
    "card-shuffle": ["B", (c, v) => { const n = c.words.length; return each(c, { u: "w", dur: S(v.duration) * 2, st: 40, ease: EIO, origin: "50% 120%", kf: (i) => { const s = i - (n - 1) / 2; return [{ transform: "none" }, { offset: 0.45, transform: `rotate(${s * v.fan}deg) scale(${1 - Math.abs(s) * v.scaleStep})` }, { offset: 0.6, transform: `rotate(${s * v.fan}deg) scale(${1 - Math.abs(s) * v.scaleStep})` }, { transform: "none" }] } }) }, "", "fan,scaleStep"],
    "logo-marquee": ["B", (c, v) => marquee(c, { speed: K(c, v.speed, 24), gap: K(c, v.gap, 24), dir: 1, fade: K(c, v.fade, 40) }), "", "speed,fade"],
    "line-draw": ["B", (c, v) => ACT.outline(c, { dur: S(v.duration) * 0.5, dir: 1, st: S(v.stagger) * 0.25 }), "", "duration,stagger"],
    "marching-ants": ["B", (c, v) => ants(c, v), "", "cycle,dash"],
    "animated-beam": ["C", "media"],
    "barber-pole": ["B", (c, v) => stripes(c, v), "", "cycle,pitch"],
    "corner-brackets": ["B", (c, v) => brackets(c, v), "", "size,spin"],
    "blob-morph": ["C", "media"],
    "grain-overlay": ["C", "media"],
    "scanlines": ["B", (c, v) => scan(c, v), "", "spacing,opacity"],
    "moire-drift": ["C", "media"],
    "god-rays": ["C", "media"],
    "fog-drift": ["C", "media"],
    "twinkle": ["B", (c, v) => ACT.jitter(c, { dur: S(v.duration) * 1.4, fps: 16, fn: (i, t, r) => { const ph = ((i * 0.37) % 1); const tw = 0.5 + 0.5 * Math.cos(2 * Math.PI * (t * 2 + ph + (r() - 0.5) * v.jitter / 200)); return { opacity: String(1 - Math.sin(Math.PI * t) * 0.85 * tw), transform: `scale(${(1 - Math.sin(Math.PI * t) * 0.12 * tw).toFixed(3)})` } } }), "", "duration,jitter"],
    "snowfall": ["C", "media"],
    "liquid-distortion": ["B", (c, v) => liquid(c, v), "", "scale,frequency"],
    "ascii-effect": ["B", (c, v) => ACT.scramble(c, { cs: [" .:-=+*#%@", "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ", "░▒▓█"][Math.round(v.ramp)] || ".:-=+*#%@", tick: 1000 / v.fps, lockAt: (i, n) => 500 + (i / n) * 700 * v.contrast }), "", "ramp,fps"],
    "halftone": ["B", (c, v) => halftone(c, v), "", "gap,angle"],
    "dither-dissolve": ["B", (c, v) => dither(c, v), "", "pixel,matrix"],
    "sprite-sheet": ["B", (c, v) => { const f = Math.round(v.frames); const D = S(v.duration) * 2; return ACT.clip(c, { from: "inset(-20% 100% -20% -5%)", dur: D, ease: v.timing === 1 ? "linear" : `steps(${f}, end)` }) }, "", "frames,timing"],
    "frosted-glass": ["B", (c, v) => frost(c, v), "", "blur,opacity"],
    "gradient-border": ["C", "media"],

    /* ── ui ── */
    "notched-corner": ["B", (c, v) => { const n = K(c, v.notch, 24); const B = pad(c.tb, c, 0.06); const R = c.W - B.x - B.w, Bt = c.H - B.y - B.h; const poly = (k: number) => `polygon(${B.x + n * k}px ${B.y}px, ${B.x + B.w}px ${B.y}px, ${B.x + B.w}px ${c.H - Bt - n * k}px, ${B.x + B.w - n * k}px ${c.H - Bt}px, ${B.x}px ${c.H - Bt}px, ${B.x}px ${B.y + n * k}px)`; const panel = c.fx(`left:0;top:0;width:${c.W}px;height:${c.H}px;background:${c.ink};`); const g = c.ghost(c.paper); void R; c.a(panel, [{ clipPath: poly(0), opacity: 0 }, { offset: 0.2, opacity: 1 }, { clipPath: poly(1), opacity: 1 }], { duration: S(v.duration), easing: OUT, fill: "both" }); c.a(g, [{ clipPath: poly(0), opacity: 0 }, { offset: 0.2, opacity: 1 }, { clipPath: poly(1), opacity: 1 }], { duration: S(v.duration), easing: OUT, fill: "both" }); return { hold: true, ms: S(v.duration) } }, "", "notch,duration"],
    "accordion": ["B", (c, v) => { const e = ["ease", "ease-out", OUT][Math.round(v.easing)] || OUT; c.a(c.txt, [{ clipPath: "inset(-20% -5% 100% -5%)", transform: `translateY(${-c.fs * 0.15}px)` }, { clipPath: "inset(-20% -5% -20% -5%)", transform: "translateY(0px)" }], { duration: S(v.duration) * 1.6, easing: e }); return S(v.duration) * 1.6 }, "", "duration,easing"],
    "tab-indicator": ["B", (c, v) => tabAct(c, v), "", "duration,stretch"],
    "gooey-effect": ["C", "ui"],
    "stepper": ["B", (c, v) => each(c, { u: "w", dur: S(v.duration) * 1.4, st: S(v.duration) * 0.9, origin: "50% 60%", ease: [OUT, EIO, BACK][Math.round(v.easing)] || OUT, kf: () => [{ opacity: 0.2, transform: "scale(1)" }, { offset: 0.35, opacity: 1, transform: `scale(${1 + (v.nodeScale - 1) * 0.4})` }, { opacity: 1, transform: "scale(1)" }] }), "", "duration,nodeScale"],
    "story-progress": ["B", (c, v) => ACT.progress(c, { dur: Math.min(S(v.duration), 4000), segs: v.segments, th: Math.max(2, K(c, v.height, 24)) }), "", "segments,height"],
    "dot-pagination": ["C", "ui"],
    "ruler-scrubber": ["C", "ui"],
    "radial-carousel": ["B", (c, v) => ringAct(c, { turn: (360 / v.count) * 2, dur: S(v.duration) * 3.4, radiusK: v.radius / 320 }), "", "radius,count"],
    "modal-pop": ["B", (c, v) => ACT.from(c, { u: "w", t: `scale(${v.scaleFrom})`, op: 0, dur: S(v.duration) * 1.6, st: 0, ease: "cubic-bezier(.2,.9,.3,1)", origin: "50% 50%" }), "", "duration,scaleFrom"],
    "bounce-in": ["A", (c, v) => ACT.bounce(c, { height: v.height, bounces: v.bounces, damping: v.damping, duration: v.duration }), "", "height,bounces"],
    "squash-stretch": ["A", (c, v) => ACT.squash(c, { squash: v.squash, stretch: v.stretch, recover: v.recover, overshoot: v.overshoot }), "", "squash,stretch"],
    "spring-easing": ["B", (c, v) => { const D = S(v.duration) * 1.6; const N = 40; const kf: Keyframe[] = []; for (let k = 0; k <= N; k++) { const t = (k / N) * (D / 1000); const x = k === N ? 0 : springAt(t, v.stiffness, v.damping); kf.push({ offset: k / N, transform: `translateY(${(-x * c.fs * 0.5).toFixed(2)}px)` }) } return each(c, { dur: D, st: 26, kf: () => kf }) }, "", "stiffness,damping"],
    "drawer-slide": ["B", (c, v) => whole(c, [{ transform: `translateX(${v.direction === 1 ? c.W - c.tb.x : -(c.tb.x + c.tb.w + 10)}px)` }, { transform: "translateX(0px)" }], S(v.duration) * 1.8, OUT, undefined, CLIP_BOX), "", "duration,direction"],
    "toast-slide": ["B", (c, v) => whole(c, [{ transform: "translateY(130%)", opacity: 0, easing: OUT }, { offset: 0.3, transform: "translateY(0%)", opacity: 1 }, { offset: 1, transform: "translateY(0%)", opacity: 1 }], S(v.duration) * 3.3, "linear", undefined, "inset(-0.25em -0.1em -0.05em -0.1em)"), "", "duration"],
    "tooltip-pop": ["B", (c, v) => tipAct(c, v), "", "delay,duration"],
    "pill-expand": ["B", (c, v) => pill(c, v), "", "duration,labelDelay"],
    "toggle-switch": ["C", "ui"],
    "checkbox-check": ["C", "ui"],
    "star-rating": ["B", (c, v) => ACT.pointerEach(c, { settle: S(v.duration) + 400, fn: (_d, dx, _e, i, has) => { const lit = !has || dx >= -c.fs * 0.3; return { opacity: lit ? "1" : "0.22", transform: lit && has ? `scale(${Math.min(1.04, 1 + (v.lift - 1) * 0.5)})` : "scale(1)", transition: `opacity ${v.duration}s ${(i * v.stagger) / 1000}s, transform ${v.duration}s` } } }), "f", "lift,duration"],
    "theme-toggle-transition": ["B", (c, v) => ACT.fill(c, v.shape === 1 ? { dur: S(v.duration), from: "circle", ox: c.tb.x + c.tb.w, oy: c.tb.y, ease: "cubic-bezier(.4,0,.2,1)" } : { dur: S(v.duration), from: "left", ease: "cubic-bezier(.4,0,.2,1)" }), "", "duration,shape"],
    "equalizer-bars": ["B", (c, v) => ACT.jitter(c, { dur: 1800, fps: 1000 / v.speed * 2.2, origin: "50% 100%", fn: (_i, t, r) => { const e = Math.sin(Math.PI * t); const s = 1 - e * (1 - v.floor / 100) * (0.25 + r() * (0.4 + v.spread / 100)); return { transform: `scaleY(${s.toFixed(3)})` } } }), "", "speed,spread"],
    "bar-chart-grow": ["B", (c, v) => each(c, { dur: S(v.duration) * 1.6, st: v.stagger, origin: "50% 100%", ease: [OUT, BACK, "linear"][Math.round(v.easing)] || OUT, kf: () => (v.method === 1 ? [{ clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)" }] : [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }]) }), "", "duration,stagger"],
    "gauge-meter": ["C", "ui"],
    "ripple-tap": ["B", (c, v) => ripple(c, v), "", "duration,size"],
    "press-feedback": ["A", (c, v) => pressAct(c, { depth: v.depth, scale: v.scale, release: v.release }), "", "scale,release"],
    "stateful-button": ["C", "ui"],
    "copy-to-clipboard": ["B", (c, v) => copied(c, v), "", "rise,hold"],
    "stamp-in": ["A", (c, v) => whole(c, [{ transform: `scale(${v.scale}) rotate(${v.angle}deg)`, opacity: 0, easing: "cubic-bezier(.5,0,.75,0)" }, { offset: 0.55, transform: `scale(0.96) rotate(${v.rest * 0.4}deg)`, opacity: 1, easing: OUT }, { offset: 0.7, transform: `scale(1) rotate(${v.rest * 0.4}deg)`, opacity: 1, easing: EIO }, { transform: "scale(1) rotate(0deg)", opacity: 1 }], S(v.duration) * 2.6, "linear", `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`), "", "scale,angle"],
    "confetti-burst": ["B", (c, v) => burst(c, v), "", "spread,gravity"],
    "like-burst": ["B", (c, v) => likeBurst(c, v), "", "count,startScale"],
    "prize-wheel": ["B", (c, v) => whole(c, [{ transform: "rotate(0deg)" }, { transform: `rotate(${360 * Math.round(v.turns)}deg)` }], Math.min(S(v.duration), 4000), "cubic-bezier(.17,.67,.12,.99)", `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`), "", "turns,duration"],
    "scratch-card": ["B", (c, v) => scratch(c, v), "", "brush,threshold"],
    "gift-box-reveal": ["B", (c, v) => gift(c, v), "", "lift,peeks"],
    "floating-reactions": ["C", "ui"],
    "fly-to-cart": ["C", "ui"],
    "drop-zone": ["C", "ui"],
    "swipe-dismiss": ["B", (c, v) => whole(c, [{ transform: "translateX(0px) rotate(0deg)", opacity: 1, easing: "cubic-bezier(.4,0,1,1)" }, { offset: 0.35, transform: `translateX(${c.W * 0.5 + v.fling * 0.1}px) rotate(${4 + v.fling / 300}deg)`, opacity: 0 }, { offset: 0.5, transform: `translateX(${-c.fs * 0.5}px)`, opacity: 0, easing: OUT }, { transform: "translateX(0px) rotate(0deg)", opacity: 1 }], (S(v.flyout) + S(v.snapBack)) * 2.4, "linear", `${c.tb.x}px ${c.tb.y + c.tb.h}px`, CLIP_BOX), "", "threshold,fling"],
    "list-add-remove": ["B", (c, v) => each(c, { u: "w", dur: S(v.duration) * 4, st: S(v.delay) * 0.6, origin: "50% 0%", ease: OUT, kf: () => [{ transform: "scaleY(1) translateX(0px)", opacity: 1 }, { offset: 0.4, transform: `scaleY(0) translateX(${K(c, v.slide, 24)}px)`, opacity: 1 - v.fade / 100 }, { offset: 0.5, transform: `scaleY(0) translateX(${K(c, v.slide, 24)}px)`, opacity: 1 - v.fade / 100 }, { transform: "scaleY(1) translateX(0px)", opacity: 1 }] }), "", "duration,delay"],
    "paper-crumple": ["B", (c, v) => crumple(c, v), "", "ball,toss"],
    "chat-sequence": ["B", (c, v) => chat(c, v), "", "baseTyping,enter"],
    "ai-orb": ["C", "ui"],
    "flip-card": ["B", (c, v) => ACT.swapOut(c, { mode: "flip", dur: S(v.duration), hold: 700, persp: v.perspective * (c.tb.w / 320) }), "", "duration,perspective"],
    "page-turn": ["B", (c, v) => pageTurn(c, v), "", "duration,shade"],
    "sticker-peel": ["B", (c, v) => peel(c, v), "", "depth,angle"],
    "floating-label": ["B", (c, v) => whole(c, [{ transform: "translateY(0px) scale(1)", easing: OUT }, { offset: 0.3, transform: `translateY(${-K(c, v.rise, 24) * 0.8}px) scale(${v.scale})` }, { offset: 0.7, transform: `translateY(${-K(c, v.rise, 24) * 0.8}px) scale(${v.scale})`, easing: OUT }, { transform: "translateY(0px) scale(1)" }], S(v.duration) * 8, "linear", `${c.tb.x}px ${c.tb.y + c.tb.h}px`), "", "rise,scale"],
    "password-strength": ["C", "ui"],
    "expanding-search": ["B", (c, v) => { const w = K(c, v.startWidth, 16); const L = v.anchor === 1; return ACT.clip(c, { from: L ? `inset(-20% ${c.W - c.tb.x - w}px -20% -5%)` : `inset(-20% ${c.W - c.tb.x - c.tb.w}px -20% ${c.tb.x + c.tb.w - w}px)`, to: "inset(-20% -5% -20% -5%)", dur: S(v.duration) * 2.4, ease: OUT }) }, "", "duration,startWidth"],
    "dropdown-reveal": ["B", (c, v) => whole(c, [{ transform: `translateY(${-K(c, v.offset, 16)}px)`, opacity: 0, clipPath: "inset(-20% -5% 100% -5%)" }, { transform: "translateY(0px)", opacity: 1, clipPath: "inset(-20% -5% -20% -5%)" }], S(v.duration) * 3, OUT), "", "duration,offset"],
    "morphing-dropdown": ["C", "ui"],
    "menu-toggle": ["C", "ui"],
    "error-shake": ["A", (c, v) => ACT.shake(c, { amplitude: v.amplitude, duration: v.duration, shakes: v.shakes }), "", "amplitude,shakes"],
    "hint-nudge": ["B", (c, v) => { const d = K(c, v.distance, 24); const T = S(v.duration); return each(c, { dur: T * 2 + S(v.rest) * 0.3, st: 0, kf: () => [{ transform: "translateX(0px)", easing: "ease-in-out" }, { offset: 0.18, transform: `translateX(${d}px)`, easing: "ease-in-out" }, { offset: 0.36, transform: "translateX(0px)", easing: "ease-in-out" }, { offset: 0.5, transform: `translateX(${d * 0.6}px)`, easing: "ease-in-out" }, { offset: 0.64, transform: "translateX(0px)" }, { transform: "translateX(0px)" }] }) }, "", "distance,duration"],
    "gesture-hint": ["C", "ui"],
    "scroll-cue": ["B", (c, v) => whole(c, [{ transform: "translateY(0px)", opacity: 1, easing: "ease-in" }, { offset: v.share / 100, transform: `translateY(${K(c, v.travel, 24)}px)`, opacity: 0 }, { offset: v.share / 100, transform: `translateY(${-K(c, v.nudge, 24)}px)`, opacity: 0, easing: OUT }, { transform: "translateY(0px)", opacity: 1 }], S(v.duration), "linear", undefined, "inset(-0.25em -0.1em -0.05em -0.1em)"), "", "travel,duration"],
    "notification-badge": ["B", (c, v) => badge(c, v), "", "duration,overshoot"],
    "pulse-ring": ["B", (c, v) => rings(c, v), "", "count,duration"],
    "breathing-glow": ["B", (c, v) => { c.rootStyle({ isolation: "isolate" }); return each(c, { dur: S(v.period) * 1.2, ease: "ease-in-out", origin: "50% 50%", kf: () => [{ textShadow: "0 0 0px rgba(10,10,10,0)", transform: "scale(1)" }, { textShadow: `0 0 ${K(c, v.glow, 24)}px rgba(10,10,10,.35)`, transform: `scale(${1 + v.scale / 300})` }, { textShadow: "0 0 0px rgba(10,10,10,0)", transform: "scale(1)" }] }) }, "", "period,glow"],
    "ambient-float": ["B", (c, v) => { const T = Math.min(S(v.duration), 4200); return ACT.jitter(c, { u: "w", dur: T, fps: 30, fn: (i, t) => { const e = Math.sin(Math.PI * t); const ph = (i * v.spread) / 100; return { transform: `translateY(${(-Math.sin(2 * Math.PI * (t + ph)) * K(c, v.distance, 40) * 0.5 * e).toFixed(2)}px) rotate(${(Math.sin(2 * Math.PI * (t + ph + 0.25)) * v.rotate * e).toFixed(2)}deg)` } } }) }, "", "distance,duration"],
    "eye-blink": ["B", (c, v) => { const d = v.duration; const dbl = v.double >= 50; return each(c, { dur: d * (dbl ? 3 : 1.4), st: 0, origin: "50% 55%", kf: () => (dbl ? [{ transform: "scaleY(1)" }, { offset: 0.17, transform: "scaleY(0.08)" }, { offset: 0.34, transform: "scaleY(1)" }, { offset: 0.5, transform: "scaleY(1)" }, { offset: 0.67, transform: "scaleY(0.08)" }, { offset: 0.84, transform: "scaleY(1)" }, { transform: "scaleY(1)" }] : [{ transform: "scaleY(1)", easing: "ease-in" }, { offset: 0.35, transform: "scaleY(0.08)", easing: "ease-out" }, { offset: 0.7, transform: "scaleY(1)" }, { transform: "scaleY(1)" }]) }) }, "", "duration,double"],
    "orbit": ["B", (c, v) => orbit(c, v), "", "period,tilt"],
    "pendulum-swing": ["B", (c, v) => { const T = S(v.period); const N = 48; const kf: Keyframe[] = []; for (let k = 0; k <= N; k++) { const t = k / N; const a = k === N ? 0 : v.angle * Math.exp(-t * 3 * (v.damping / 60)) * Math.cos(2 * Math.PI * t * 2.5); kf.push({ offset: t, transform: `rotate(${a.toFixed(2)}deg)` }) } return each(c, { u: "w", dur: T * 2.5, st: 60, origin: `50% ${-v.pivot}%`, kf: () => kf }) }, "", "angle,period"],
    "flicker-on": ["A", (c, v) => { const n = Math.round(v.flickers); const kf: Keyframe[] = [{ offset: 0, opacity: 0 }]; const r = rnd(3); for (let k = 0; k < n; k++) { const t = (k + 0.3 + r() * 0.4) / (n + 1); kf.push({ offset: t, opacity: 1, easing: "steps(1,end)" }); kf.push({ offset: Math.min(0.98, t + 0.04), opacity: v.dim, easing: "steps(1,end)" }) } kf.push({ offset: 1, opacity: 1 }); kf.forEach((k) => (k.easing = k.easing || "steps(1,end)")); kf.sort((a, b) => (a.offset as number) - (b.offset as number)); return whole(c, kf, S(v.duration)) }, "", "duration,flickers"],
    "dvd-bounce": ["C", "ui"],
    "conic-sweep": ["C", "ui"],
    "motion-path": ["B", (c, v) => each(c, { dur: S(v.duration) * 1.3, st: S(v.stagger), ease: EIO, kf: (i, n) => { const cv = K(c, v.curve, 80) * 0.6; const kf: Keyframe[] = []; const N = 10; for (let k = 0; k <= N; k++) { const t = k / N; const x = -(1 - t) * c.fs * 2.2; const y = -Math.sin(Math.PI * t) * cv * (i % 2 ? 1 : -0.6); const ang = v.rotate === 1 ? Math.atan2(-Math.cos(Math.PI * t) * cv * Math.PI, c.fs * 2.2) * 57 * (1 - t) : 0; kf.push({ offset: t, transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${ang.toFixed(1)}deg)`, opacity: t < 0.15 ? t / 0.15 : 1 }) } void n; return kf } }), "", "curve,stagger"],

    /* ── loading ── */
    "preloader-counter": ["A", (c, v) => ACT.progress(c, { dur: S(v.duration), reveal: true }), "", "duration,curtain"],
    "skeleton-shimmer": ["B", (c, v) => skeleton(c, v), "", "speed,width"],
    "loading-bar": ["B", (c, v) => ACT.progress(c, { dur: S(v.duration), th: Math.max(1, K(c, v.height, 24)), ease: "cubic-bezier(.4,0,.2,1)" }), "", "duration,height"],
    "spinner-ring": ["C", "loading"],
    "dots-pulse": ["B", (c, v) => each(c, { dur: S(v.speed), st: S(v.stagger) * 0.5, ease: "ease-in-out", origin: "50% 50%", kf: () => [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(0.82)", opacity: 0.3 }, { transform: "scale(1)", opacity: 1 }] }), "", "speed,stagger"],
    "circular-progress": ["C", "loading"],
    "stagger-grid": ["B", (c, v) => ACT.from(c, { t: "scale(0.6)", op: 0, dur: S(v.duration), st: S(v.stagger) * 0.6, ord: ord3(v.direction), origin: "50% 50%" }), "", "stagger,direction"],
    "spiral-reveal": ["B", (c, v) => { const R = K(c, v.radius, 40); const turns = v.turns; return each(c, { dur: S(v.duration), st: S(v.stagger) * 0.5, ease: "linear", kf: (i) => { const kf: Keyframe[] = []; const N = 16; for (let k = 0; k <= N; k++) { const t = k / N; const e = 1 - Math.pow(1 - t, 3); const r = R * (1 - e); const a = (turns * 2 * Math.PI) * (1 - e) + i * 0.6; kf.push({ offset: t, transform: `translate(${(Math.cos(a) * r).toFixed(1)}px, ${(Math.sin(a) * r).toFixed(1)}px) scale(${(0.4 + 0.6 * e).toFixed(3)})`, opacity: Math.min(1, t * 3) }) } return kf } }) }, "", "radius,turns"],
    "liquid-fill": ["B", (c, v) => liquidFill(c, v), "", "progress,amplitude"],
    "boot-sequence": ["B", (c, v) => ACT.typewriter(c, { speed: v.charSpeed * 2, blink: 0.5, block: true }), "", "charSpeed,lineDelay"],
}

/* ------------------------------------------------------------------ */
/* 個別の演技                                                           */
/* ------------------------------------------------------------------ */

function liftAct(c: Ctx, v: V): Hold {
    each(c, { dur: S(v.duration), st: 0, ease: OUT, kf: () => [{ transform: "translateY(0px)" }, { transform: `translateY(${-K(c, v.lift, 24)}px)` }] })
    c.chars.forEach((ch) => ch.getAnimations().forEach((a) => (a.effect as KeyframeEffect).updateTiming({ fill: "both" })))
    return { hold: true, ms: S(v.duration) }
}
function lsHold(c: Ctx, v: V): Hold {
    // 字間が開く（文字ごとの translateX。レイアウトは動かさない）
    const n = c.chars.length
    const sp = v.spacing * c.fs
    each(c, {
        dur: S(v.duration), ease: ["linear", EXPO, EIO][Math.round(v.ease)] || EXPO,
        kf: (i) => {
            // compensate：none／trailing＝左端を据えて右へ開く、full＝中心を据えて両側へ開く
            const dx = v.compensate === 2 ? (i - (n - 1) / 2) * sp : i * sp
            return [{ transform: "translateX(0px)" }, { transform: `translateX(${dx}px)` }]
        },
    })
    c.chars.forEach((ch) => ch.getAnimations().forEach((a) => (a.effect as KeyframeEffect).updateTiming({ fill: "both" })))
    return { hold: true, ms: S(v.duration) }
}
function shadowPop(c: Ctx, v: V): Hold {
    const d = K(c, v.depth, 24)
    const n = Math.max(1, Math.round(v.steps))
    const dir = [[-1, 1], [1, 1], [-1, -1], [1, -1]][Math.round(v.direction)] || [-1, 1]
    const sh = (k: number) => Array.from({ length: n }, (_, j) => `${(-dir[0] * d * (j + 1) / n * k).toFixed(1)}px ${(dir[1] * d * (j + 1) / n * k).toFixed(1)}px 0 ${c.muted}`).join(", ")
    c.chars.forEach((ch) => c.a(ch, [{ transform: "translate(0px,0px)", textShadow: sh(0) }, { transform: `translate(${dir[0] * d}px, ${-dir[1] * d}px)`, textShadow: sh(1) }], { duration: Math.max(160, S(v.duration) * 2), easing: OUT, fill: "both" }))
    return { hold: true, ms: Math.max(160, S(v.duration) * 2) }
}
function borderDraw(c: Ctx, v: V): Hold {
    const B = pad(c.tb, c, 0.12)
    const t = Math.max(1, K(c, v.thickness, 16) * 0.5)
    const D = S(v.duration)
    const sides: [string, string, string][] = [
        [`left:${B.x}px;top:${B.y}px;width:${B.w}px;height:${t}px;`, "scaleX", "0 50%"],
        [`left:${B.x + B.w - t}px;top:${B.y}px;width:${t}px;height:${B.h}px;`, "scaleY", "50% 0"],
        [`left:${B.x}px;top:${B.y + B.h - t}px;width:${B.w}px;height:${t}px;`, "scaleX", "100% 50%"],
        [`left:${B.x}px;top:${B.y}px;width:${t}px;height:${B.h}px;`, "scaleY", "50% 100%"],
    ]
    sides.forEach(([css, sc, org], k) => {
        const el = c.fx(css + `background:${c.ink};transform-origin:${org};`)
        c.a(el, [{ transform: `${sc}(0)` }, { transform: `${sc}(1)` }], { duration: D / 4, delay: (k * D) / 4, easing: "linear", fill: "both" })
    })
    return { hold: true, ms: D }
}
function trailAct(c: Ctx, v: V): Follow {
    let lx = -1e4, ly = -1e4, live = 0, has = false
    const sp = K(c, v.spacing, 40) * 0.6
    const life = S(v.life)
    let k = 0
    return {
        kind: "f",
        move(x, y) {
            has = true
            if (Math.hypot(x - lx, y - ly) < sp) return
            lx = x; ly = y
            const src = c.chars[k++ % c.chars.length]
            const el = c.fx(`left:0;top:0;transform:translate(${x - c.fs * 0.3}px, ${y - c.fs * 0.6}px);color:${c.muted};white-space:pre;font:inherit;letter-spacing:inherit;`)
            el.textContent = src.textContent
            live++
            const an = c.a(el, [{ opacity: 0.9, transform: `translate(${x - c.fs * 0.3}px, ${y - c.fs * 0.6}px) scale(.9)` }, { opacity: 0, transform: `translate(${x - c.fs * 0.3}px, ${y - c.fs * 0.3}px) scale(.6)` }], { duration: life, easing: "ease-out", fill: "both" })
            an.onfinish = () => { el.remove(); live-- }
        },
        leave() { has = false },
        tick() { return has || live > 0 },
    }
}
function previewAct(c: Ctx, v: V): Follow {
    const card = c.fx(`left:0;top:0;padding:${c.fs * 0.12}px ${c.fs * 0.2}px;background:${c.ink};color:${c.paper};font:400 ${Math.max(11, c.fs * 0.17)}px/1.4 ${MONO};letter-spacing:.02em;white-space:nowrap;border-radius:6px;`)
    card.textContent = c.en
    let px = c.tb.x, py = c.tb.y, cx = px, cy = py, o = 0, has = false
    return {
        kind: "f",
        move(x, y) { px = x; py = y; has = true },
        leave() { has = false },
        tick() {
            cx += (px - cx) * v.lerp
            cy += (py - cy) * v.lerp
            o += ((has ? 1 : 0) - o) * Math.min(1, 0.016 / Math.max(0.05, v.duration) * 3)
            card.style.transform = `translate(${cx + c.fs * 0.15}px, ${cy + c.fs * 0.15}px) scale(${v.scaleFrom + (1 - v.scaleFrom) * o})`
            card.style.opacity = String(o)
            return has || o > 0.01
        },
    }
}
function glitchAct(c: Ctx, v: V) {
    const T = Math.max(900, S(v.period) * 2)
    const s = K(c, v.strength, 24)
    const a = c.ghost(c.muted)
    const b = c.ghost(c.ink)
    const r = rnd(9)
    const kfs = (sign: number) => {
        const kf: Keyframe[] = []
        const N = 14
        for (let k = 0; k <= N; k++) {
            const on = k > 0 && k < N && r() < 0.6
            const y0 = r() * 80, h = 8 + r() * 30
            kf.push({ offset: k / N, transform: `translateX(${on ? sign * s * (0.4 + r()) : 0}px)`, clipPath: on ? `inset(${y0}% 0% ${Math.max(0, 100 - y0 - h)}% 0%)` : "inset(0% 0% 100% 0%)", easing: "steps(1,end)" })
        }
        return kf
    }
    c.a(a, kfs(1), { duration: T, fill: "both" })
    c.a(b, kfs(-1), { duration: T, fill: "both" })
    c.a(c.txt, [{ transform: "translateX(0px)" }, { offset: 0.3, transform: `translateX(${s * 0.3}px)` }, { offset: 0.32, transform: "translateX(0px)" }, { transform: "translateX(0px)" }], { duration: T, easing: "steps(1,end)" })
    return T
}
function cubeRoll(c: Ctx, v: V) {
    const dz = K(c, v.depth, 56) * 0.5
    const ax = v.axis === 1 ? "Y" : "X"
    const ov = v.overshoot
    const D = S(v.duration)
    return each(c, {
        dur: D * 1.6, st: 30,
        kf: () => [
            { offset: 0, transform: `translateZ(${-dz}px) rotate${ax}(0deg) translateZ(${dz}px)`, opacity: 1, easing: "ease-in" },
            { offset: 0.45, transform: `translateZ(${-dz}px) rotate${ax}(${ax === "X" ? 90 : -90}deg) translateZ(${dz}px)`, opacity: 0.2 },
            { offset: 0.45, transform: `translateZ(${-dz}px) rotate${ax}(${ax === "X" ? -90 : 90}deg) translateZ(${dz}px)`, opacity: 0.2, easing: "ease-out" },
            { offset: 0.8, transform: `translateZ(${-dz}px) rotate${ax}(${ax === "X" ? ov : -ov}deg) translateZ(${dz}px)`, opacity: 1, easing: "ease-in-out" },
            { offset: 1, transform: `translateZ(${-dz}px) rotate${ax}(0deg) translateZ(${dz}px)`, opacity: 1 },
        ],
    })
}
// 帯の光が字の上を横切る（gradient-shine / holo-sheen）
function sheen(c: Ctx, p: { dur: number; angle: number; band: number; alpha: number }) {
    const W = c.tb.w + c.fs
    const band = Math.max(4, Math.min(60, p.band))
    const grad = `linear-gradient(${p.angle}deg, ${c.ink} 0%, ${c.ink} ${50 - band / 2}%, rgba(244,244,241,${p.alpha}) 50%, ${c.ink} ${50 + band / 2}%, ${c.ink} 100%)`
    c.chars.forEach((ch) => {
        const b = c.box(ch)
        ch.style.color = "transparent"
        ch.style.backgroundImage = grad
        ch.style.backgroundSize = `${W * 3}px 100%`
        ch.style.setProperty("-webkit-background-clip", "text")
        ch.style.backgroundClip = "text"
        const x0 = -(b.x - c.tb.x)
        c.a(ch, [{ backgroundPosition: `${x0 - W * 2}px 0` }, { backgroundPosition: `${x0}px 0` }], { duration: p.dur, easing: "ease-in-out", fill: "both" })
    })
    return p.dur
}
function marquee(c: Ctx, p: { speed: number; gap: number; dir: number; fade?: number }) {
    const P = c.W + p.gap
    const T = (P / Math.max(20, p.speed)) * 1000
    c.rootStyle({ clipPath: "inset(-0.3em 0 -0.3em 0)" })
    if (p.fade) {
        // 端のフェードは流れ出してから掛ける（始まりの瞬間は素の名前のまま読める）
        const m = `linear-gradient(90deg, transparent 0, #000 ${p.fade}px, #000 calc(100% - ${p.fade}px), transparent 100%)`
        c.later(() => c.rootStyle({ webkitMaskImage: m, maskImage: m }), 160)
    }
    c.chars.forEach((ch) => {
        const b = c.box(ch)
        const o = p.dir > 0 ? (b.x + b.w) / P : (c.W - b.x) / P
        const a = p.dir > 0 ? -(b.x + b.w) : c.W - b.x
        c.a(ch, [
            { offset: 0, transform: "translateX(0px)" },
            { offset: Math.min(0.999, o), transform: `translateX(${a}px)` },
            { offset: Math.min(0.999, o), transform: `translateX(${a + (p.dir > 0 ? P : -P)}px)` },
            { offset: 1, transform: "translateX(0px)" },
        ], { duration: T, easing: "linear" })
    })
    return T
}
function splitFlap(c: Ctx, v: V) {
    const n = Math.max(1, Math.round(v.steps))
    const f = S(v.flip)
    const pool = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
    c.lock(c.chars)
    const orig = c.chars.map((e) => e.textContent || "")
    const r = rnd(4)
    c.chars.forEach((ch, i) => {
        const kf: Keyframe[] = []
        for (let k = 0; k < n; k++) {
            kf.push({ offset: k / n, transform: `perspective(${c.fs * 6}px) rotateX(0deg)`, easing: "ease-in" })
            kf.push({ offset: (k + 0.5) / n, transform: `perspective(${c.fs * 6}px) rotateX(-90deg)` })
            kf.push({ offset: (k + 0.5) / n, transform: `perspective(${c.fs * 6}px) rotateX(90deg)`, easing: "ease-out" })
        }
        kf.push({ offset: 1, transform: `perspective(${c.fs * 6}px) rotateX(0deg)` })
        c.a(ch, kf, { duration: f * n, delay: i * v.stagger })
        if (!orig[i].trim()) return
        for (let k = 0; k < n; k++) c.later(() => c.setText(ch, k === n - 1 ? orig[i] : pool[Math.floor(r() * pool.length)]), i * v.stagger + f * (k + 0.5))
    })
    return f * n + c.chars.length * v.stagger + 60
}
function ringAct(c: Ctx, p: { turn: number; dur: number; radiusK?: number }) {
    const n = c.chars.length
    const R = Math.max(c.fs * 1.1, (c.tb.w / (2 * Math.PI)) * (p.radiusK || 1))
    const cx = c.tb.x + c.tb.w / 2, cy = c.tb.y + c.tb.h / 2
    return each(c, {
        dur: p.dur, ease: "linear",
        kf: (i, _n, el) => {
            const b = c.box(el)
            const kf: Keyframe[] = []
            const N = 24
            for (let k = 0; k <= N; k++) {
                const t = k / N
                const mix = t < 0.25 ? EIOf(t / 0.25) : t > 0.75 ? EIOf((1 - t) / 0.25) : 1
                const a0 = (i / n) * 2 * Math.PI - Math.PI / 2 + ((p.turn * Math.PI) / 180) * t
                const rx = cx + Math.cos(a0) * R - (b.x + b.w / 2)
                const ry = cy + Math.sin(a0) * R - (b.y + b.h / 2)
                const rot = ((a0 + Math.PI / 2) * 180) / Math.PI
                kf.push({ offset: t, transform: `translate(${(rx * mix).toFixed(1)}px, ${(ry * mix).toFixed(1)}px) rotate(${(rot * mix).toFixed(1)}deg) scale(${1 - 0.45 * mix})` })
            }
            return kf
        },
    })
}
function EIOf(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
function sliced(c: Ctx, v: V) {
    const n = Math.max(2, Math.round(v.slices))
    const D = S(v.duration) * 2
    const off = K(c, v.offset, 24)
    const tilt = Math.tan((v.tilt * Math.PI) / 180) * c.H
    c.a(c.txt, [{ opacity: 0 }, { opacity: 0 }], { duration: D })
    for (let k = 0; k < n; k++) {
        const g = c.ghost()
        const y0 = (c.H / n) * k, y1 = (c.H / n) * (k + 1)
        const dx0 = (tilt * (y0 / c.H)), dx1 = (tilt * (y1 / c.H))
        g.style.clipPath = `polygon(${-c.W}px ${y0 - dx0 * 0}px, ${c.W * 2}px ${y0 + dx0 * 0.2}px, ${c.W * 2}px ${y1 + dx1 * 0.2}px, ${-c.W}px ${y1}px)`
        const s = k % 2 ? 1 : -1
        c.a(g, [{ transform: "translateX(0px)", easing: EIO }, { offset: 0.4, transform: `translateX(${s * off}px)` }, { offset: 0.6, transform: `translateX(${s * off}px)`, easing: EIO }, { transform: "translateX(0px)" }], { duration: D, fill: "both" })
    }
    return D
}
function stackAct(c: Ctx, v: V) {
    // 3周目：1枚ずつ下から入る形だと最後の札が入るまで読めず、実演面で「ド」だけが下に落ちて見えた（独立レビューA）。
    // 4周目：見えている状態から。左から順に札が上から 0.12em だけ置かれ（落ちて積まれる）、先に積まれた札ほど少し上に覗いて小さくなる。最後に揃って戻る
    const els = c.words
    const n = els.length
    const st = Math.min(120, 900 / Math.max(1, n))
    const D = 300
    const T = D + st * (n - 1) + 260 + 360
    const peek = Math.min(c.em * 0.06, K(c, v.peek, 24) * 0.15)
    const drop = c.em * 0.12
    const sc = Math.min(0.03, v.scale)
    els.forEach((w, i) => {
        w.style.transformOrigin = "50% 0%"
        const kf: Keyframe[] = [
            { offset: 0, transform: "translateY(0px) scale(1)" },
            { offset: (i * st) / T, transform: `translateY(${-drop}px) scale(1)`, easing: "cubic-bezier(.5,0,.75,0)" },
            { offset: (i * st + D) / T, transform: "translateY(0px) scale(1)" },
        ]
        for (let k = 1; k <= Math.min(3, n - 1 - i); k++) {
            kf.push({ offset: ((i + k) * st + D) / T, transform: `translateY(${-peek * k}px) scale(${1 - sc * k})` })
        }
        kf.push({ offset: (T - 360) / T, transform: kf[kf.length - 1].transform, easing: OUT })
        kf.push({ offset: 1, transform: "translateY(0px) scale(1)" })
        kf.forEach((k, j) => { if (j > 0 && (k.offset as number) < (kf[j - 1].offset as number)) k.offset = kf[j - 1].offset })
        c.a(w, kf, { duration: T })
    })
    return T
}
function coverAct(c: Ctx, v: V) {
    const D = S(v.duration)
    const B = pad(c.tb, c)
    // 8周目：一覧では覆う面は地の色（近黒／生成りの面が見出しの後ろの板に写った）
    const panel = c.fx(at(B) + `background:${c.paper};border-radius:${c.fs * 0.06}px;`)
    c.a(panel, [
        { offset: 0, transform: `translateY(${B.h * (1 + v.rise / 100)}px) scale(${v.scaleFrom})`, opacity: 0, easing: OUT },
        { offset: 0.45, transform: "translateY(0px) scale(1)", opacity: 1, easing: "linear" },
        { offset: 0.55, transform: "translateY(0px) scale(1)", opacity: 1, easing: INOUT },
        { offset: 1, transform: `translateY(${-B.h * 1.1}px) scale(1)`, opacity: 1 },
    ], { duration: D * 2, fill: "both" })
    c.rootStyle({ clipPath: `inset(${B.y}px ${c.W - B.x - B.w}px ${c.H - B.y - B.h}px ${B.x}px)` })
    c.txt.style.transformOrigin = `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`
    c.a(c.txt, [{ transform: "scale(1)", opacity: 1, easing: OUT }, { offset: 0.45, transform: `scale(${1 / v.recede})`, opacity: 0.4 }, { offset: 0.55, transform: "scale(1)", opacity: 1 }, { transform: "scale(1)", opacity: 1 }], { duration: D * 2 })
    return D * 2
}
function gradWipe(c: Ctx, v: V) {
    const sf = Math.max(1, v.softness)
    const m = `linear-gradient(${v.angle + 90}deg, #000 0%, #000 ${50 - sf / 4}%, transparent ${50 + sf / 4}%, transparent 100%)`
    const t = c.txt.style
    t.setProperty("-webkit-mask-image", m)
    t.setProperty("mask-image", m)
    t.setProperty("-webkit-mask-size", "300% 300%")
    t.setProperty("mask-size", "300% 300%")
    const e = ["linear", "cubic-bezier(0.33, 1, 0.68, 1)", "cubic-bezier(0.65, 0, 0.35, 1)"][Math.round(v.easing)] || EIO
    c.a(c.txt, [{ maskPosition: "100% 100%", webkitMaskPosition: "100% 100%" } as any, { maskPosition: "0% 0%", webkitMaskPosition: "0% 0%" } as any], { duration: S(v.duration), easing: e })
    return S(v.duration)
}
function crt(c: Ctx, v: V) {
    const D = S(v.duration)
    const ln = Math.max(0.004, (v.line / 100) * 2)
    const o = `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`
    c.txt.style.transformOrigin = o
    c.a(c.txt, [
        { offset: 0, transform: "scale(1, 1)", filter: "brightness(1)", opacity: 1, easing: "cubic-bezier(.7,0,.84,0)" },
        { offset: 0.25, transform: `scale(1, ${ln})`, filter: `brightness(${v.flash})`, opacity: 1, easing: "cubic-bezier(.7,0,.84,0)" },
        { offset: 0.45, transform: `scale(0, ${ln})`, opacity: 0.6 },
        { offset: 0.6, transform: `scale(0, ${ln})`, opacity: 0, easing: OUT },
        { offset: 0.8, transform: `scale(1, ${ln})`, opacity: 1, easing: OUT },
        { offset: 1, transform: "scale(1, 1)", filter: "brightness(1)", opacity: 1 },
    ], { duration: D * 2.4 })
    const line = c.fx(`left:${c.tb.x}px;top:${c.tb.y + c.tb.h / 2 - 1}px;width:${c.tb.w}px;height:2px;background:${c.ink};`)
    c.a(line, [{ offset: 0, opacity: 0, transform: "scaleX(1)" }, { offset: 0.25, opacity: 1, transform: "scaleX(1)" }, { offset: 0.45, opacity: 1, transform: "scaleX(0.01)" }, { offset: 0.55, opacity: 0, transform: "scaleX(0.01)" }, { offset: 1, opacity: 0 }], { duration: D * 2.4, fill: "both" })
    return D * 2.4
}
function splitScreen(c: Ctx, v: V) {
    const D = S(v.duration) * 2
    const vert = v.axis !== 1
    const half = vert ? c.tb.x + c.tb.w / 2 : c.tb.y + c.tb.h / 2
    c.a(c.txt, [{ opacity: 0 }, { opacity: 0 }], { duration: D })
    ;[0, 1].forEach((k) => {
        const g = c.ghost()
        g.style.clipPath = vert ? (k ? `inset(-20% -5% -20% ${half}px)` : `inset(-20% ${c.W - half}px -20% -5%)`) : (k ? `inset(${half}px -5% -20% -5%)` : `inset(-20% -5% ${c.H - half}px -5%)`)
        const d = (k ? 1 : -1) * (vert ? c.tb.w * 0.12 : c.tb.h * 0.35)
        const tr = vert ? `translateX(${d}px)` : `translateY(${d}px)`
        c.a(g, [{ transform: "none", opacity: 1, easing: INOUT }, { offset: 0.45, transform: tr, opacity: 0.15 }, { offset: 0.55, transform: tr, opacity: 0.15, easing: INOUT }, { transform: "none", opacity: 1 }], { duration: D, fill: "both" })
    })
    return D
}
function counterScale(c: Ctx, v: V) {
    const D = S(v.duration) * 3
    const B = pad(c.tb, c)
    const ap = v.aperture
    const ix = (B.w * (1 - ap)) / 2, iy = (B.h * (1 - ap)) / 2
    c.txt.style.transformOrigin = `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`
    c.rootStyle({ clipPath: "inset(-30% -5% -30% -5%)" })
    c.a(c.txt, [
        { clipPath: "inset(-20% -5% -20% -5%)", transform: "scale(1)", easing: EIO },
        { offset: 0.45, clipPath: `inset(${B.y + iy}px ${c.W - B.x - B.w + ix}px ${c.H - B.y - B.h + iy}px ${B.x + ix}px)`, transform: `scale(${v.mode === 1 ? 1 : v.zoom})` },
        { offset: 0.6, clipPath: `inset(${B.y + iy}px ${c.W - B.x - B.w + ix}px ${c.H - B.y - B.h + iy}px ${B.x + ix}px)`, transform: `scale(${v.mode === 1 ? 1 : v.zoom})`, easing: EIO },
        { clipPath: "inset(-20% -5% -20% -5%)", transform: "scale(1)" },
    ], { duration: D })
    return D
}
function beforeAfter(c: Ctx, v: V) {
    const D = 2200
    const sw = Math.max(1, c.fs / 70)
    const g = c.ghost("transparent")
    g.style.setProperty("-webkit-text-stroke", `${sw}px ${c.ink}`)
    const B = pad(c.tb, c)
    const line = c.fx(`left:0;top:${B.y}px;width:2px;height:${B.h}px;background:${c.ink};`)
    const x = (f: number) => B.x + B.w * f
    const i0 = v.initial / 100
    const pts = [0, i0, 1, i0, 0].map(x)
    const ofs = [0, 0.3, 0.55, 0.8, 1]
    const ease = `cubic-bezier(${0.2 + v.follow},0,${0.2 + v.follow * 0.5},1)`
    c.a(c.txt, pts.map((p, k) => ({ offset: ofs[k], clipPath: `inset(-20% -5% -20% ${p}px)`, easing: ease })).map((k, j, arr) => (j === arr.length - 1 ? { ...k, clipPath: "inset(-20% -5% -20% -5%)" } : k)), { duration: D })
    c.a(g, pts.map((p, k) => ({ offset: ofs[k], clipPath: `inset(-20% ${c.W - p}px -20% -5%)`, easing: ease })), { duration: D, fill: "both" })
    c.a(line, pts.map((p, k) => ({ offset: ofs[k], transform: `translateX(${p}px)`, opacity: k === 0 || k === 4 ? 0 : 1, easing: ease })), { duration: D, fill: "both" })
    return D
}
function mosaic(c: Ctx, v: V) {
    const grid = [[4, 3], [6, 4], [8, 5], [10, 6]][Math.round(v.tiles)] || [6, 4]
    const B = pad(c.tb, c)
    const cols = grid[0] * Math.max(1, Math.round(B.w / B.h / 2)), rows = grid[1]
    const tw = B.w / cols, th = B.h / rows
    const n = cols * rows
    const order = v.order === 1 ? Array.from({ length: n }, (_, i) => i) : v.order === 2 ? Array.from({ length: n }, (_, i) => (i % cols) + Math.floor(i / cols)) : seeded(n, 21)
    const st = v.stagger * (v.order === 2 ? 2.5 : 1) * (24 / Math.max(24, n)) * 2
    let end = 0
    for (let i = 0; i < n; i++) {
        const el = c.fx(`left:${B.x + (i % cols) * tw}px;top:${B.y + Math.floor(i / cols) * th}px;width:${tw + 0.5}px;height:${th + 0.5}px;background:${c.paper};`)
        const d = order[i] * st
        c.a(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 240, delay: d, easing: "ease-out", fill: "both" })
        end = Math.max(end, d + 240)
    }
    return end
}
function quadtree(c: Ctx, v: V) {
    const m = glyphMap(c)
    if (!m) return 0
    const { cv, g } = overlayCanvas(c)
    const depth = Math.round(v.depth)
    const base = c.H / Math.max(1, Math.round(c.H / (c.fs * 1.2)))
    type Leaf = { x: number; y: number; s: number; a: number }
    const leaves: Leaf[] = []
    const thr = v.threshold / 255
    const rec = (x: number, y: number, s: number, d: number) => {
        if (x >= c.W || y >= c.H) return
        const w = Math.min(s, c.W - x), h = Math.min(s, c.H - y)
        const cov = coverage(m, x, y, w, h)
        if (d < depth && cov.sd > thr * 0.8 && s > 3) {
            const hs = s / 2
            rec(x, y, hs, d + 1); rec(x + hs, y, hs, d + 1); rec(x, y + hs, hs, d + 1); rec(x + hs, y + hs, hs, d + 1)
        } else if (cov.mean > 0.02) leaves.push({ x, y, s: Math.min(s, w + 0.5), a: cov.mean })
    }
    for (let y = 0; y < c.H; y += base) for (let x = 0; x < c.W; x += base) rec(x, y, base, 1)
    leaves.sort((p, q) => q.s - p.s)
    const D = S(v.duration), H = S(v.hold)
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
    c.a(c.txt, [{ opacity: 0 }, { opacity: 0 }], { duration: D + H })
    const draw = (k: number, from = 0) => {
        g.clearRect(0, 0, c.W, c.H)
        for (let i = from; i < k; i++) {
            const l = leaves[i]
            g.fillStyle = `rgba(10,10,10,${Math.min(1, l.a * 1.15).toFixed(3)})`
            g.fillRect(l.x, l.y, l.s - 0.5, l.s - 0.5)
        }
    }
    c.loop((t) => {
        if (t < D) draw(Math.floor(ease(t / D) * leaves.length))
        else if (t < D + H) draw(leaves.length)
        else if (t < D * 2 + H) draw(leaves.length, Math.floor(ease((t - D - H) / D) * leaves.length))
        else { g.clearRect(0, 0, c.W, c.H); return false }
        return true
    })
    void cv
    return D * 2 + H + 50
}
function halftone(c: Ctx, v: V) {
    const m = glyphMap(c)
    if (!m) return 0
    const { g } = overlayCanvas(c)
    const gap = Math.max(3, K(c, v.gap, 40) * 0.6)
    const a = (v.angle * Math.PI) / 180
    const dots: { x: number; y: number; r: number }[] = []
    const ext = Math.hypot(c.W, c.H)
    for (let u = -ext; u < ext; u += gap)
        for (let w = -ext; w < ext; w += gap) {
            const x = c.W / 2 + u * Math.cos(a) - w * Math.sin(a), y = c.H / 2 + u * Math.sin(a) + w * Math.cos(a)
            if (x < 0 || y < 0 || x >= c.W || y >= c.H) continue
            const cov = coverage(m, Math.max(0, x - gap / 2), Math.max(0, y - gap / 2), gap, gap).mean
            if (cov > 0.03) dots.push({ x, y, r: (gap / 2) * Math.sqrt(cov) * 1.15 })
        }
    const D = 1700
    const sep = K(c, v.separation, 40) * 0.5
    c.a(c.txt, [{ opacity: 1 }, { offset: 0.2, opacity: 0 }, { offset: 0.72, opacity: 0 }, { opacity: 1 }], { duration: D })
    c.loop((t) => {
        const k = t / D
        const e = k < 0.2 ? k / 0.2 : k > 0.72 ? Math.max(0, 1 - (k - 0.72) / 0.28) : 1
        g.clearRect(0, 0, c.W, c.H)
        const reach = Math.min(1, k / 0.35)
        dots.forEach((d) => {
            if (d.x / c.W > reach + 0.05) return
            if (sep) { g.fillStyle = `rgba(107,107,102,${0.55 * e})`; g.beginPath(); g.arc(d.x + sep, d.y + sep * 0.3, d.r, 0, Math.PI * 2); g.fill() }
            g.fillStyle = `rgba(10,10,10,${e})`
            g.beginPath(); g.arc(d.x, d.y, d.r, 0, Math.PI * 2); g.fill()
        })
        return k < 1
    })
    return D + 40
}
function dither(c: Ctx, v: V) {
    const m = glyphMap(c)
    if (!m) return 0
    const { g } = overlayCanvas(c)
    const px = Math.max(2, K(c, v.pixel, 40) * 0.7)
    const B2 = [[0, 2], [3, 1]], B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
    const mat = Math.round(v.matrix)
    const r = rnd(13)
    const th = (i: number, j: number) => (mat === 0 ? (B2[j % 2][i % 2] + 0.5) / 4 : mat === 3 ? r() : (B4[j % 4][i % 4] + 0.5) / 16)
    const cells: { x: number; y: number; cov: number; t: number }[] = []
    for (let j = 0; j * px < c.H; j++)
        for (let i = 0; i * px < c.W; i++) {
            const cov = coverage(m, i * px, j * px, Math.min(px, c.W - i * px), Math.min(px, c.H - j * px)).mean
            if (cov > 0.05) cells.push({ x: i * px, y: j * px, cov, t: th(i, j) })
        }
    // 3周目：最初から粒の絵で始まり、素の字が戻るまで読めなかった（独立レビューB）。
    // 4周目：見えている字から始めて、粒に置き換わり（0〜12%）→ 溶けて消え（〜45%）→ 粒で戻り（〜88%）→ 素の字に戻る
    const D = Math.min(S(v.cycle), 2600)
    c.a(c.txt, [{ offset: 0, opacity: 1 }, { offset: 0.05, opacity: 1 }, { offset: 0.14, opacity: 0 }, { offset: 0.86, opacity: 0 }, { offset: 0.95, opacity: 1 }, { offset: 1, opacity: 1 }], { duration: D })
    c.loop((t) => {
        const k = t / D
        const lvl = k < 0.05 ? 0 : k < 0.14 ? 1 : k < 0.45 ? 1 - (k - 0.14) / 0.31 : k < 0.55 ? 0 : k < 0.86 ? (k - 0.55) / 0.31 : k < 0.95 ? 1 : 0
        g.clearRect(0, 0, c.W, c.H)
        g.fillStyle = c.ink
        cells.forEach((q) => { if (q.t < lvl * Math.min(1, q.cov * 1.6)) g.fillRect(q.x, q.y, px, px) })
        return k < 1
    })
    return D + 40
}
function frost(c: Ctx, v: V) {
    const B = pad(c.tb, c, 0.2)
    const w = B.w * 0.36
    const el = c.fx(`left:${B.x}px;top:${B.y}px;width:${w}px;height:${B.h}px;border-radius:${c.fs * 0.12}px;background:rgba(244,244,241,${0.25 + v.opacity * 2});-webkit-backdrop-filter:blur(${K(c, v.blur, 40) * 0.6}px);backdrop-filter:blur(${K(c, v.blur, 40) * 0.6}px);box-shadow:inset 0 0 0 1px rgba(10,10,10,.12);`)
    const D = Math.max(1600, S(v.duration) * 4)
    c.a(el, [{ transform: `translateX(${-w}px)`, opacity: 0, easing: EIO }, { offset: 0.15, opacity: 1 }, { offset: 0.85, opacity: 1 }, { transform: `translateX(${B.w}px)`, opacity: 0 }], { duration: D, fill: "both" })
    return D
}
function ants(c: Ctx, v: V) {
    const B = pad(c.tb, c, 0.14)
    const t = Math.max(1, Math.round(c.fs / 50))
    const dash = K(c, v.dash, 24), gap = K(c, v.gap, 24)
    const D = Math.max(1800, S(v.cycle) * 2)
    const dir = v.direction === 1 ? -1 : 1
    const P = dash + gap
    const sides = [
        `left:${B.x}px;top:${B.y}px;width:${B.w}px;height:${t}px;`, `left:${B.x + B.w - t}px;top:${B.y}px;width:${t}px;height:${B.h}px;`,
        `left:${B.x}px;top:${B.y + B.h - t}px;width:${B.w}px;height:${t}px;`, `left:${B.x}px;top:${B.y}px;width:${t}px;height:${B.h}px;`,
    ]
    sides.forEach((css, k) => {
        const h = k % 2 === 0
        const el = c.fx(css + `background:repeating-linear-gradient(${h ? 90 : 180}deg, ${c.ink} 0 ${dash}px, transparent ${dash}px ${P}px);`)
        const s = (k < 2 ? 1 : -1) * dir
        const cyc = (D / S(v.cycle))
        c.a(el, [{ backgroundPosition: "0px 0px", opacity: 0 }, { offset: 0.12, opacity: 1 }, { offset: 0.85, opacity: 1 }, { backgroundPosition: h ? `${s * P * Math.round(cyc * 4)}px 0px` : `0px ${s * P * Math.round(cyc * 4)}px`, opacity: 0 }], { duration: D, fill: "both", easing: "linear" })
    })
    return D
}
function stripes(c: Ctx, v: V) {
    const pitch = K(c, v.pitch, 48) * 0.5
    const on = pitch * v.ratio
    const grad = `repeating-linear-gradient(${90 + v.lean}deg, ${c.ink} 0 ${on}px, ${c.muted} ${on}px ${pitch}px)`
    const D = Math.max(1600, S(v.cycle) * 1.5)
    c.chars.forEach((ch) => {
        const b = c.box(ch)
        ch.style.color = "transparent"
        ch.style.backgroundImage = grad
        ch.style.setProperty("-webkit-background-clip", "text")
        ch.style.backgroundClip = "text"
        const x0 = -(b.x - c.tb.x)
        const d = pitch / Math.cos((v.lean * Math.PI) / 180)
        c.a(ch, [{ backgroundPosition: `${x0}px 0` }, { backgroundPosition: `${x0 + d * Math.round(D / S(v.cycle) * 3)}px 0` }], { duration: D, easing: "linear", fill: "both" })
    })
    return D
}
function brackets(c: Ctx, v: V) {
    const B = pad(c.tb, c, 0.16)
    const s = K(c, v.size, 16) * 0.7
    const t = Math.max(2, Math.round(c.fs / 36))
    const D = S(v.duration)
    const corners: [number, number, string][] = [[B.x, B.y, "top:0;left:0"], [B.x + B.w - s, B.y, "top:0;right:0"], [B.x + B.w - s, B.y + B.h - s, "bottom:0;right:0"], [B.x, B.y + B.h - s, "bottom:0;left:0"]]
    corners.forEach(([x, y, pos], k) => {
        const el = c.fx(`left:${x}px;top:${y}px;width:${s}px;height:${s}px;`)
        const sides = pos.split(";").map((p) => p.split(":")[0])
        el.style.borderStyle = "solid"
        el.style.borderColor = c.ink
        el.style.borderWidth = "0"
        sides.forEach((sd) => ((el.style as any)["border" + sd[0].toUpperCase() + sd.slice(1) + "Width"] = t + "px"))
        el.style.boxSizing = "border-box"
        const dx = (k === 0 || k === 3 ? -1 : 1) * s, dy = (k < 2 ? -1 : 1) * s
        c.a(el, [{ transform: `translate(${dx}px, ${dy}px) rotate(${v.spin}deg)`, opacity: 0, easing: OUT }, { offset: 0.35, transform: "translate(0px,0px) rotate(0deg)", opacity: 1 }, { offset: 0.75, transform: "translate(0px,0px) rotate(0deg)", opacity: 1, easing: "ease-in" }, { transform: `translate(${dx * 0.5}px, ${dy * 0.5}px) rotate(0deg)`, opacity: 0 }], { duration: D * 3 + 900, delay: k * S(v.stagger), fill: "both" })
    })
    return D * 3 + 900 + 4 * S(v.stagger)
}
function scan(c: Ctx, v: V) {
    const B = pad(c.tb, c)
    const sp = Math.max(2, K(c, v.spacing, 40) * 0.6)
    const el = c.fx(at(B) + `background:repeating-linear-gradient(180deg, rgba(244,244,241,${0.4 + v.opacity}) 0 ${sp / 2}px, transparent ${sp / 2}px ${sp}px);`)
    const bar = c.fx(at({ ...B, h: B.h * 0.3 }) + `background:linear-gradient(180deg, transparent, rgba(244,244,241,.6), transparent);`)
    const D = 1800
    const kf: Keyframe[] = [{ opacity: 0 }, { offset: 0.1, opacity: 1 }]
    const r = rnd(2)
    for (let k = 1; k < 8; k++) kf.push({ offset: 0.1 + k * 0.09, opacity: 1 - r() * v.flicker })
    kf.push({ offset: 0.85, opacity: 1 }, { offset: 1, opacity: 0 })
    c.a(el, kf, { duration: D, fill: "both" })
    c.a(bar, [{ transform: `translateY(${-B.h * 0.3}px)`, opacity: 0 }, { offset: 0.2, opacity: 1 }, { offset: 0.8, opacity: 1 }, { transform: `translateY(${B.h}px)`, opacity: 0 }], { duration: v.sweep ? D : 0.01, fill: "both" })
    return D
}
function liquid(c: Ctx, v: V) {
    const id = "mdt-liq-" + Math.random().toString(36).slice(2, 8)
    const svg = c.fx("left:0;top:0;width:0;height:0;", "div")
    svg.innerHTML = `<svg width="0" height="0" style="position:absolute"><filter id="${id}" x="-10%" y="-30%" width="120%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="${v.frequency}" numOctaves="${Math.round(v.octaves)}" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`
    const disp = svg.querySelector("feDisplacementMap")!
    const turb = svg.querySelector("feTurbulence")!
    c.txt.style.filter = `url(#${id})`
    const D = Math.min(S(v.duration) * 0.35, 3600)
    const sc = v.scale * (c.fs / 40)
    c.loop((t) => {
        const k = Math.min(1, t / D)
        const e = Math.sin(Math.PI * k)
        disp.setAttribute("scale", (sc * e).toFixed(2))
        turb.setAttribute("baseFrequency", `${(v.frequency * (1 + 0.3 * Math.sin(k * 6))).toFixed(4)} ${(v.frequency * 1.4).toFixed(4)}`)
        return k < 1
    })
    return D + 40
}
function tabAct(c: Ctx, v: V) {
    // 語が少ないときは文字を3つの区切りにまとめた範囲を「タブ」にする（要素は要らない。範囲だけ）
    type Seg = { b: Box }
    let ws: Seg[] = c.words.map((w) => ({ b: c.box(w) }))
    if (c.words === c.chars) {
        const n = c.chars.length, k = Math.min(3, n)
        ws = Array.from({ length: k }, (_, j) => {
            const part = c.chars.slice(Math.floor((j * n) / k), Math.floor(((j + 1) * n) / k))
            const a = c.box(part[0]), z = c.box(part[part.length - 1])
            return { b: { x: a.x, y: a.y, w: z.x + z.w - a.x, h: a.h } }
        })
    }
    const th = Math.max(2, Math.round(c.fs * 0.045))
    const bar = c.fx(`left:0;top:0;width:1px;height:${th}px;background:${c.ink};transform-origin:0 0;`)
    const D = S(v.duration)
    const kf: Keyframe[] = []
    const hop = D * 1.6
    const T = hop * ws.length + 400
    ws.forEach((w, i) => {
        const b = w.b
        const y = b.y + b.h - th * 0.5
        const k0 = { offset: (i * hop) / T, transform: `translate(${b.x}px, ${y}px) scaleX(${b.w})`, opacity: 1, easing: OUT }
        kf.push(k0)
        if (v.stretch === 1 && i < ws.length - 1) {
            const nb = ws[i + 1].b
            if (Math.abs(nb.y - b.y) < 2) kf.push({ offset: ((i + 0.5) * hop) / T, transform: `translate(${b.x}px, ${y}px) scaleX(${nb.x + nb.w - b.x})`, opacity: 1, easing: OUT })
        }
    })
    kf[0] = { ...kf[0], opacity: 0 }
    const last = kf[kf.length - 1]
    kf.push({ ...last, offset: (ws.length * hop) / T, easing: "ease" })
    kf.push({ ...last, offset: 1, opacity: 0 })
    c.a(bar, kf, { duration: T, fill: "both" })
    return T
}
function tipAct(c: Ctx, v: V) {
    const tip = c.fx(`left:${c.tb.x}px;top:${c.tb.y - c.fs * 0.42}px;padding:${Math.max(4, c.fs * 0.06)}px ${Math.max(8, c.fs * 0.12)}px;background:${c.ink};color:${c.paper};font:400 ${Math.max(11, c.fs * 0.16)}px/1.3 ${MONO};white-space:nowrap;border-radius:6px;transform-origin:0 100%;`)
    tip.textContent = c.en
    const D = S(v.duration)
    const T = S(v.delay) + D + 1200 + D
    c.a(tip, [
        { offset: 0, opacity: 0, transform: "translateY(4px) scale(.94)" },
        { offset: S(v.delay) / T, opacity: 0, transform: "translateY(4px) scale(.94)", easing: OUT },
        { offset: (S(v.delay) + D) / T, opacity: 1, transform: "translateY(0px) scale(1)" },
        { offset: (T - D) / T, opacity: 1, transform: "translateY(0px) scale(1)", easing: "ease-in" },
        { offset: 1, opacity: 0, transform: "translateY(4px) scale(.94)" },
    ], { duration: T, fill: "both" })
    c.a(c.txt, [{ opacity: 1 }, { offset: S(v.delay) / T, opacity: 1 }, { offset: (S(v.delay) + D) / T, opacity: 0.55 }, { offset: (T - D) / T, opacity: 0.55 }, { opacity: 1 }], { duration: T })
    return T
}
function pill(c: Ctx, v: V) {
    const B = pad(c.tb, c, 0.16)
    const el = c.fx(at(B) + `border:1px solid ${c.ink};border-radius:${B.h}px;box-sizing:border-box;`)
    const D = S(v.duration) * 2.2
    const ox = v.origin === 1 ? "50%" : v.origin === 2 ? "100%" : "0%"
    const sw = Math.min(1, (B.h * 1.0) / B.w)
    el.style.transformOrigin = `${ox} 50%`
    const T = D + S(v.labelDelay) * 2 + 1000
    c.a(el, [{ transform: `scaleX(${sw})`, opacity: 0 }, { offset: 0.05, opacity: 1 }, { offset: D / T, transform: "scaleX(1)", easing: "linear" }, { offset: 0.85, transform: "scaleX(1)", opacity: 1 }, { offset: 1, transform: "scaleX(1)", opacity: 0 }], { duration: T, easing: OUT, fill: "both" })
    const clipL = v.origin === 1 ? "inset(-20% 50% -20% 50%)" : v.origin === 2 ? "inset(-20% -5% -20% 100%)" : "inset(-20% 100% -20% -5%)"
    c.a(c.txt, [{ opacity: 0, clipPath: clipL }, { offset: (S(v.labelDelay) * 2) / T, opacity: 0, clipPath: clipL, easing: OUT }, { offset: (S(v.labelDelay) * 2 + D) / T, opacity: 1, clipPath: "inset(-20% -5% -20% -5%)" }, { opacity: 1, clipPath: "inset(-20% -5% -20% -5%)" }], { duration: T })
    return T
}
function ripple(c: Ctx, v: V) {
    const sz = K(c, v.size, 40)
    const x = c.tb.x + c.tb.w * 0.3, y = c.tb.y + c.tb.h / 2
    const B = pad(c.tb, c)
    const box = c.fx(at(B) + "overflow:hidden;")
    const dot = document.createElement("div")
    dot.style.cssText = `position:absolute;left:${x - B.x - sz / 2}px;top:${y - B.y - sz / 2}px;width:${sz}px;height:${sz}px;border-radius:50%;background:rgba(10,10,10,.16);`
    box.appendChild(dot)
    c.a(dot, [{ transform: "scale(0)", opacity: 1 }, { transform: `scale(${(B.w / sz) * 2.2})`, opacity: 0 }], { duration: S(v.duration) * 1.6, easing: "cubic-bezier(.2,.6,.3,1)", fill: "both" })
    return S(v.duration) * 1.6
}
function copied(c: Ctx, v: V) {
    const el = c.fx(`left:${c.tb.x + c.tb.w - c.fs * 0.2}px;top:${c.tb.y}px;padding:${Math.max(4, c.fs * 0.06)}px ${Math.max(8, c.fs * 0.12)}px;background:${c.ink};color:${c.accent};font:400 ${Math.max(11, c.fs * 0.16)}px/1.3 ${MONO};white-space:nowrap;border-radius:6px;`)
    el.textContent = "Copied ✓"
    const r = K(c, v.rise, 16)
    const T = 300 + S(v.hold) + 400
    c.a(el, [{ transform: "translateY(0px)", opacity: 0, easing: OUT }, { offset: 300 / T, transform: `translateY(${-r}px)`, opacity: 1 }, { offset: (300 + S(v.hold)) / T, transform: `translateY(${-r}px)`, opacity: 1, easing: "ease-in" }, { transform: `translateY(${-r * 1.6}px)`, opacity: 0 }], { duration: T, fill: "both" })
    if (v.flash > 0) c.a(c.txt, [{ opacity: 1 }, { offset: 0.1, opacity: 0.4 }, { offset: Math.min(1, (S(v.flash) + 120) / T), opacity: 1 }, { opacity: 1 }], { duration: T })
    return T
}
function burst(c: Ctx, v: V) {
    const D = S(v.duration) * 1.8
    const cx = c.tb.x + c.tb.w / 2, cy = c.tb.y + c.tb.h / 2
    const sp = K(c, v.spread, 150) * 0.7
    const r = rnd(8)
    return each(c, {
        dur: D, origin: "50% 50%",
        kf: (_i, _n, el) => {
            const b = c.box(el)
            const ang = Math.atan2(b.y + b.h / 2 - cy, b.x + b.w / 2 - cx) + (r() - 0.5) * 1.2
            const dist = sp * (0.6 + r() * 0.6)
            const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - sp * 0.3
            const g = sp * v.gravity * 0.8
            const rot = (r() - 0.5) * 220
            return [
                { offset: 0, transform: "translate(0px,0px) rotate(0deg)", easing: "cubic-bezier(.2,.8,.3,1)" },
                { offset: 0.35, transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${rot.toFixed(0)}deg)`, easing: "ease-in" },
                { offset: 0.55, transform: `translate(${(dx * 1.1).toFixed(1)}px, ${(dy + g).toFixed(1)}px) rotate(${(rot * 1.2).toFixed(0)}deg)`, easing: INOUT },
                { offset: 1, transform: "translate(0px,0px) rotate(0deg)" },
            ]
        },
    })
}
function likeBurst(c: Ctx, v: V) {
    const D = S(v.duration) * 1.6
    const n = Math.round(v.count)
    const cx = c.tb.x + c.tb.w, cy = c.tb.y + c.tb.h * 0.3
    const sp = K(c, v.spread, 32) * 0.7
    for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2
        const d = c.fx(`left:${cx - 3}px;top:${cy - 3}px;width:6px;height:6px;border-radius:50%;background:${k % 2 ? c.ink : c.muted};`)
        c.a(d, [{ transform: "translate(0px,0px) scale(1)", opacity: 1 }, { transform: `translate(${Math.cos(a) * sp}px, ${Math.sin(a) * sp}px) scale(.3)`, opacity: 0 }], { duration: D * 0.7, delay: D * 0.25, easing: "cubic-bezier(.2,.8,.3,1)", fill: "both" })
    }
    c.txt.style.transformOrigin = `${c.tb.x + c.tb.w}px ${c.tb.y + c.tb.h / 2}px`
    c.a(c.txt, [{ transform: `scale(${0.6 + v.startScale * 0.5})`, opacity: 0.4, easing: BACK }, { offset: 0.45, transform: "scale(1)", opacity: 1 }, { transform: "scale(1)", opacity: 1 }], { duration: D })
    return D
}
function scratch(c: Ctx, v: V) {
    const B = pad(c.tb, c, 0.1)
    const { cv, g } = overlayCanvas(c)
    // 3周目：灰色の膜で隠れた状態から始まっていた（独立レビューB）。4周目：見えている字の上に膜が降りてから（0.28s）擦る
    const IN = 280
    c.a(cv, [{ opacity: 0 }, { opacity: 1 }], { duration: IN, easing: "ease-out", fill: "backwards" })
    g.fillStyle = c.muted
    g.fillRect(B.x, B.y, B.w, B.h)
    const br = K(c, v.brush, 32) * 0.5
    const D = 1500
    const fade = S(v.fade)
    const pts: [number, number][] = []
    const rows = Math.max(2, Math.ceil(B.h / (br * 1.3)))
    for (let rI = 0; rI <= rows; rI++) {
        const y = B.y + (B.h * rI) / rows
        pts.push(rI % 2 ? [B.x + B.w, y] : [B.x, y])
    }
    let done = false
    c.loop((tt) => {
        const t = Math.max(0, tt - IN)
        const k = Math.min(1, t / D) * (v.threshold / 100) * 1.25
        g.globalCompositeOperation = "destination-out"
        g.lineCap = "round"
        g.lineWidth = br * 2
        g.beginPath()
        const seg = k * (pts.length - 1)
        for (let i = 0; i < pts.length - 1 && i <= seg; i++) {
            const f = Math.min(1, seg - i)
            const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]
            g.moveTo(x0, y0)
            g.lineTo(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f)
        }
        g.stroke()
        g.globalCompositeOperation = "source-over"
        if (t >= D && !done) {
            done = true
            c.a(cv, [{ opacity: 1 }, { opacity: 0 }], { duration: fade, fill: "forwards" })
        }
        return t < D + fade
    })
    return IN + D + fade + 40
}
function gift(c: Ctx, v: V) {
    const D = S(v.duration)
    const n = Math.max(1, Math.round(v.peeks))
    const top = c.ghost()
    const cut = c.tb.y + c.tb.h * 0.45
    top.style.clipPath = `inset(-30% -5% ${c.H - cut}px -5%)`
    c.rootStyle({})
    c.a(c.txt, [{ clipPath: `inset(${cut}px -5% -20% -5%)` }, { clipPath: `inset(${cut}px -5% -20% -5%)` }], { duration: D * n })
    const kf: Keyframe[] = []
    for (let k = 0; k < n; k++) {
        const o = k / n
        kf.push({ offset: o, transform: "translateY(0px) rotate(0deg)", easing: "cubic-bezier(.2,.8,.3,1)" })
        kf.push({ offset: o + 0.35 / n, transform: `translateY(${-K(c, v.lift, 24)}px) rotate(${-v.tilt * 0.5}deg)`, easing: "cubic-bezier(.6,0,.8,.4)" })
        kf.push({ offset: o + 0.6 / n, transform: "translateY(0px) rotate(0deg)", easing: "ease-out" })
    }
    kf.push({ offset: 1, transform: "translateY(0px) rotate(0deg)" })
    top.style.transformOrigin = `${c.tb.x}px ${cut}px`
    c.a(top, kf, { duration: D * n, fill: "both" })
    return D * n
}
function crumple(c: Ctx, v: V) {
    const D = S(v.duration) * 2.6
    const o = `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`
    c.txt.style.transformOrigin = o
    const b = Math.max(0.08, v.ball * 1.5)
    const tx = K(c, v.toss, 180) * 0.6
    const w = v.wrinkle
    return whole(c, [
        { offset: 0, transform: "translate(0px,0px) scale(1,1) rotate(0deg) skewX(0deg)", opacity: 1, easing: "ease-in" },
        { offset: 0.3, transform: `translate(0px,0px) scale(${b * 2.5},${b * 1.8}) rotate(${w * 2}deg) skewX(${w}deg)`, opacity: 1, easing: "cubic-bezier(.3,0,.6,1)" },
        { offset: 0.5, transform: `translate(${tx}px, ${-c.fs * 0.5}px) scale(${b},${b}) rotate(${w * 20}deg) skewX(${w}deg)`, opacity: 0 },
        { offset: 0.55, transform: "translate(0px,0px) scale(.92,.92) rotate(0deg) skewX(0deg)", opacity: 0, easing: OUT },
        { offset: 1, transform: "translate(0px,0px) scale(1,1) rotate(0deg) skewX(0deg)", opacity: 1 },
    ], D)
}
function chat(c: Ctx, v: V) {
    const typing = S(v.baseTyping) + v.perChar * c.chars.length * 0.4
    const dsz = Math.max(5, c.fs * 0.1)
    const T = typing + S(v.enter) * 2 + 300
    for (let k = 0; k < 3; k++) {
        const d = c.fx(`left:${c.tb.x + k * dsz * 1.8}px;top:${c.tb.y + c.tb.h / 2 - dsz / 2}px;width:${dsz}px;height:${dsz}px;border-radius:50%;background:${c.ink};`)
        const kf: Keyframe[] = [{ offset: 0, opacity: 0.25, transform: "translateY(0px)" }]
        for (let j = 0; j < 4; j++) {
            const o = Math.min(0.99, ((j * 300 + k * 100) / T))
            if (o * T > typing) break
            kf.push({ offset: o, opacity: 1, transform: `translateY(${-dsz * 0.5}px)` })
            kf.push({ offset: Math.min(0.995, o + 0.05), opacity: 0.25, transform: "translateY(0px)" })
        }
        kf.push({ offset: typing / T, opacity: 0.25 })
        kf.push({ offset: Math.min(1, typing / T + 0.02), opacity: 0 })
        kf.push({ offset: 1, opacity: 0 })
        kf.sort((a, b) => (a.offset as number) - (b.offset as number))
        c.a(d, kf, { duration: T, fill: "both" })
    }
    c.txt.style.transformOrigin = `${c.tb.x}px ${c.tb.y + c.tb.h}px`
    c.a(c.txt, [{ offset: 0, opacity: 0, transform: `translateY(${c.fs * 0.3}px) scale(.9)` }, { offset: typing / T, opacity: 0, transform: `translateY(${c.fs * 0.3}px) scale(.9)`, easing: OUT }, { offset: Math.min(1, (typing + S(v.enter) * 2) / T), opacity: 1, transform: "translateY(0px) scale(1)" }, { offset: 1, opacity: 1, transform: "translateY(0px) scale(1)" }], { duration: T })
    return T
}
function pageTurn(c: Ctx, v: V) {
    const D = S(v.duration)
    const pr = v.perspective * (c.tb.w / 240)
    const B = pad(c.tb, c)
    // 下のページ（素の見出し）は綴じ目の影から明るむ。めくる紙より先に置く（重なり順＝下）
    // 8周目（指摘6）：一覧では下のページの影（左から暗むグラデーションの面）を置かない＝見出しの後ろに灰色の板が写っていた。
    // 影はめくる紙の上の shade だけで見せる
    const g = c.ghost()
    g.style.background = c.paper
    g.style.transformOrigin = `${B.x}px 50%`
    g.style.backfaceVisibility = "hidden"
    g.style.clipPath = `inset(${B.y}px ${c.W - B.x - B.w}px ${c.H - B.y - B.h}px ${B.x}px)`
    const shade = document.createElement("div")
    shade.style.cssText = `position:absolute;left:${B.x}px;top:${B.y}px;width:${B.w}px;height:${B.h}px;background:linear-gradient(90deg, rgba(10,10,10,1), rgba(10,10,10,0));pointer-events:none;`
    g.appendChild(shade)
    const ease = "cubic-bezier(0.45, 0, 0.25, 1)"
    c.a(g, [{ transform: `perspective(${pr}px) rotateY(0deg)` }, { transform: `perspective(${pr}px) rotateY(-180deg)` }], { duration: D, easing: ease, fill: "both" })
    c.a(shade, [{ opacity: 0 }, { opacity: v.shade / 100 }, { opacity: 0 }], { duration: D, easing: ease, fill: "both" })
    return D + 40
}
function peel(c: Ctx, v: V) {
    const B = pad(c.tb, c, 0.1)
    const d = Math.min(B.h, K(c, v.depth, 32) * 0.9)
    const D = S(v.duration)
    const T = D * 2 + S(v.hold)
    const poly = (k: number) => `polygon(${B.x}px ${B.y}px, ${B.x + B.w}px ${B.y}px, ${B.x + B.w}px ${B.y + B.h - d * k}px, ${B.x + B.w - d * k}px ${B.y + B.h}px, ${B.x}px ${B.y + B.h}px)`
    const flap = c.fx(`left:${B.x + B.w - d}px;top:${B.y + B.h - d}px;width:${d}px;height:${d}px;background:linear-gradient(${135 + v.angle * 0.3}deg, ${c.muted}, ${c.paper});clip-path:polygon(0 100%, 100% 0, 0 0);transform-origin:100% 100%;`)
    const a = D / T, b = (D + S(v.hold)) / T
    c.a(c.txt, [{ offset: 0, clipPath: poly(0), easing: OUT }, { offset: a, clipPath: poly(1) }, { offset: b, clipPath: poly(1), easing: OUT }, { offset: 1, clipPath: poly(0) }], { duration: T })
    c.a(flap, [{ offset: 0, transform: "scale(0)", easing: OUT }, { offset: a, transform: "scale(1)" }, { offset: b, transform: "scale(1)", easing: OUT }, { offset: 1, transform: "scale(0)" }], { duration: T, fill: "both" })
    return T
}
function badge(c: Ctx, v: V) {
    const s = Math.max(8, c.fs * 0.16)
    const el = c.fx(`left:${c.tb.x + c.tb.w - s * 0.2 + K(c, v.offset, 24) * 0.2}px;top:${c.tb.y + c.fs * 0.1 - s / 2}px;width:${s}px;height:${s}px;border-radius:50%;background:${c.ink};box-shadow:0 0 0 2px ${c.paper};`)
    const D = S(v.duration)
    const T = D + 1000 + D * 0.6
    c.a(el, [{ offset: 0, transform: "scale(0)", easing: "ease-out" }, { offset: (D * 0.6) / T, transform: `scale(${v.overshoot})`, easing: "ease-in-out" }, { offset: D / T, transform: "scale(1)" }, { offset: (D + 1000) / T, transform: "scale(1)", easing: "ease-in" }, { offset: 1, transform: "scale(0)" }], { duration: T, fill: "both" })
    return T
}
function rings(c: Ctx, v: V) {
    const B = pad(c.tb, c, 0.1)
    const n = Math.round(v.count)
    const D = S(v.duration)
    for (let k = 0; k < n; k++) {
        const el = c.fx(at(B) + `border:1px solid ${c.ink};border-radius:${c.fs * 0.2}px;box-sizing:border-box;transform-origin:50% 50%;`)
        c.a(el, [{ transform: "scale(1)", opacity: 0.7 }, { transform: `scale(${1 + v.spread * 0.03}, ${1 + v.spread * 0.12})`, opacity: 0 }], { duration: D, delay: (k * D) / n, easing: "cubic-bezier(.2,.6,.3,1)", fill: "both" })
    }
    return D * 2
}
function orbit(c: Ctx, v: V) {
    const cx = c.tb.x + c.tb.w / 2, cy = c.tb.y + c.tb.h / 2
    const rx = c.tb.w / 2 + c.fs * 0.3 * (v.radius / 84), ry = rx * v.tilt * 0.35
    const s = Math.max(6, c.fs * 0.12)
    const dot = c.fx(`left:${cx - s / 2}px;top:${cy - s / 2}px;width:${s}px;height:${s}px;border-radius:50%;background:${c.ink};`)
    const T = S(v.period) * 1.4
    const N = 36
    const kf: Keyframe[] = []
    for (let k = 0; k <= N; k++) {
        const t = k / N
        const a = t * 2 * Math.PI * 1.4 - Math.PI / 2
        const z = Math.sin(a)
        kf.push({ offset: t, transform: `translate(${(Math.cos(a) * rx).toFixed(1)}px, ${(z * ry).toFixed(1)}px) scale(${(1 + z * v.depth).toFixed(3)})`, opacity: t < 0.08 ? t / 0.08 : t > 0.92 ? (1 - t) / 0.08 : 1 })
    }
    c.a(dot, kf, { duration: T, fill: "both" })
    return T
}
function skeleton(c: Ctx, v: V) {
    const lines = lineBoxes(c)
    const D = 1600
    const els: HTMLElement[] = []
    lines.forEach((L) => {
        const el = c.fx(`left:${L.x}px;top:${L.y + L.h * 0.18}px;width:${L.w}px;height:${L.h * 0.64}px;border-radius:${c.fs * 0.08}px;background:rgba(10,10,10,.08) linear-gradient(90deg, rgba(244,244,241,0) 0%, rgba(244,244,241,.9) 50%, rgba(244,244,241,0) 100%) no-repeat;background-size:${v.width}% 100%;`)
        els.push(el)
        c.a(el, [{ backgroundPosition: `-${v.width}% 0` }, { backgroundPosition: `${100 + v.width * 2}% 0` }], { duration: S(v.speed), iterations: Math.ceil(D / S(v.speed)), easing: "linear" })
        c.a(el, [{ opacity: 1 }, { offset: 0.8, opacity: 1 }, { opacity: 0 }], { duration: D + 300, fill: "both" })
    })
    c.a(c.txt, [{ opacity: 0 }, { offset: 0.8, opacity: 0 }, { opacity: 1 }], { duration: D + 300 })
    return D + 300
}
function liquidFill(c: Ctx, v: V) {
    const D = S(v.duration) * 1.4
    const sw = Math.max(1, Math.round((c.fs / 90) * 10) / 10)
    const g = c.ghost()
    c.txt.style.color = "transparent"
    c.txt.style.setProperty("-webkit-text-stroke", `${sw}px ${c.ink}`)
    const A = K(c, v.amplitude, 24) * 0.5
    const top = c.tb.y - A, bot = c.tb.y + c.tb.h + A
    const poly = (lvl: number, ph: number) => {
        const y = bot - (bot - top) * lvl
        const pts: string[] = []
        for (let k = 0; k <= 12; k++) {
            const x = (c.W * k) / 12
            pts.push(`${x.toFixed(1)}px ${(y + Math.sin(ph + k * 0.9) * A).toFixed(1)}px`)
        }
        return `polygon(${pts.join(", ")}, ${c.W}px ${c.H + c.fs}px, 0px ${c.H + c.fs}px)`
    }
    const p = v.progress / 100
    const sp = v.speed
    c.loop((t) => {
        const k = Math.min(1, t / D)
        const e = 1 - Math.pow(1 - k, 3)
        const lvl = k < 0.7 ? e / (1 - Math.pow(0.3, 3)) * p : p + (1 - p) * ((k - 0.7) / 0.3)
        g.style.clipPath = poly(Math.min(1.05, lvl), (t / 1000) * sp * 2)
        return k < 1
    })
    return D + 40
}
function carouselAct(c: Ctx, D: number) {
    const g = c.ghost()
    c.rootStyle({ clipPath: CLIP_BOX })
    const off = c.tb.x + c.tb.w + c.fs * 0.5
    c.a(c.txt, [{ transform: "translateX(0px)" }, { transform: `translateX(${-off}px)` }], { duration: D * 1.4, easing: INOUT })
    c.a(g, [{ transform: `translateX(${c.W - c.tb.x + c.fs * 0.5}px)` }, { transform: "translateX(0px)" }], { duration: D * 1.4, easing: INOUT, fill: "both" })
    return D * 1.4
}

/* ================================================================== */
/* コンポーネント                                                       */
/* ================================================================== */
