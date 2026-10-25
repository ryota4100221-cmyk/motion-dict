import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

// FVの見せ場。「言葉を選ぶと動きになり、動きを触ると言葉（プロンプト）になる」を1画面目で起こす。
// HeroTitle   … h1「動きの伝え方辞典」＋直下に擬音のチップ列・「↑ いまの見出し＝擬音 項目名 値」・プロンプトの頭。
//                チップを押すと見出し自身が即座にその動きを演じる（目の順＝見出し→チップ→値→プロンプト）。
// HeroConsole … 黒い面。いまの動きを擬音そのものが小さく演じる「絵」＋プロンプト全文＋主パラメータのスライダー。
// 2つはキャンバス上で別々に置き、状態はこのファイルの store（useHS）で共有、演技は window の CustomEvent "md:hero" で伝える。
// 演技の数値は辞典の各項目の params.default と同じ。px の値だけは見出しの大きさ（デモ比）に合わせて比例拡大して見せる。
// 上へ動く演技（ポンッ・ぷるん）は、見出しの上の要素（ラベル）に字が掛からない高さで頭打ち（5周目：読み込み時にラベルと重なった）。
// reduced-motion：見出しは動かず下線で反応するだけ。プロンプトは即時表示・自動巡回しない。

const MONO = '"Geist Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
const JP = '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif'
const EVT = "md:hero"
const TITLE = "動きの伝え方辞典"

interface Param { key: string; label: string; min: number; max: number; step: number; default: number }
interface Word {
    word: string
    slug: string
    nameJa: string
    nameEn: string
    main: string // スライダーにする主パラメータ
    lines: string // プロンプトの要の行。{{key}} の直後の単位（px/ms/s/em/%）まで含めてハイライトする
    params: Param[]
}
export interface HeroDetail { word: string; slug: string; params: Record<string, number> }

// 数値（min/max/step/default）は 2026-10-25 時点の entry/<slug>.json と同値。実行時に base から取り直して上書きする。
const WORDS: Word[] = [
    {
        word: "ポンッ", slug: "bounce-in", nameJa: "バウンドイン", nameEn: "bounce in", main: "bounces",
        lines: "上 {{height}}px から落とし、{{bounces}} 回跳ねて静止させる。\n跳ねは毎回 {{damping}} 倍に減衰、合計 {{duration}}s。",
        params: [
            { key: "height", label: "height(落下距離 px)", min: 40, max: 200, step: 10, default: 120 },
            { key: "bounces", label: "bounces(跳ねる回数)", min: 1, max: 5, step: 1, default: 3 },
            { key: "damping", label: "damping(減衰率)", min: 0.2, max: 0.7, step: 0.05, default: 0.45 },
            { key: "duration", label: "duration(着地までの合計時間 s)", min: 0.5, max: 2.5, step: 0.1, default: 1.2 },
        ],
    },
    {
        word: "ふわっと", slug: "blur-reveal", nameJa: "ブラーリビール", nameEn: "blur reveal", main: "blur",
        lines: "1文字ずつ blur({{blur}}px)・opacity 0 から、{{duration}}s で blur(0) へ。\n文字ごとに {{stagger}}ms ずつ遅らせて順に浮かべる。",
        params: [
            { key: "blur", label: "blur(初期のぼけ量 px)", min: 4, max: 24, step: 1, default: 10 },
            { key: "duration", label: "duration(1文字の時間 s)", min: 0.2, max: 2, step: 0.05, default: 0.8 },
            { key: "stagger", label: "stagger(文字間の遅延 ms)", min: 0, max: 200, step: 5, default: 60 },
        ],
    },
    {
        word: "パタン", slug: "text-flip", nameJa: "テキストフリップ", nameEn: "text flip", main: "duration",
        lines: "文字を rotateX(-90deg) で倒し、下から rotateX(90deg)→0 で起こす。\n回転は {{duration}}s の ease、親の perspective は {{perspective}}px。",
        params: [
            { key: "duration", label: "duration(回転時間 s)", min: 0.3, max: 1.2, step: 0.05, default: 0.6 },
            { key: "perspective", label: "perspective(奥行き px)", min: 200, max: 1200, step: 50, default: 600 },
        ],
    },
    {
        word: "ぷるん", slug: "squash-stretch", nameJa: "スクワッシュ＆ストレッチ", nameEn: "squash and stretch", main: "squash",
        lines: "着地で scaleY を {{squash}}% 潰し、飛行中は {{stretch}}% 伸ばす（scaleX は逆数）。\n{{recover}}s で戻し、{{overshoot}}% だけ行き過ぎて収める。",
        params: [
            { key: "squash", label: "squash(接地時の潰れ量 %)", min: 0, max: 30, step: 1, default: 16 },
            { key: "stretch", label: "stretch(飛行中の伸び量 %)", min: 0, max: 30, step: 1, default: 14 },
            { key: "recover", label: "recover(復元時間 s)", min: 0.12, max: 0.6, step: 0.02, default: 0.28 },
            { key: "overshoot", label: "overshoot(戻りの行き過ぎ %)", min: 0, max: 18, step: 1, default: 7 },
        ],
    },
    {
        word: "シュッ", slug: "tracking-in", nameJa: "字間リビール", nameEn: "tracking in", main: "spread",
        lines: "字間 {{spread}}em・opacity 0 から、{{duration}}s で 0.02em へ詰める。\nイージングは expo-out（cubic-bezier(0.16, 1, 0.3, 1)）。",
        params: [
            { key: "spread", label: "spread(開始字間 em)", min: 0.1, max: 1, step: 0.05, default: 0.5 },
            { key: "duration", label: "duration(収束時間 s)", min: 0.4, max: 2.5, step: 0.1, default: 1.2 },
        ],
    },
    {
        word: "ガタガタ", slug: "error-shake", nameJa: "エラーシェイク", nameEn: "error shake", main: "amplitude",
        lines: "translateX を ±{{amplitude}}px から 0 へ直線的に減衰させ、\n{{shakes}}往復・{{duration}}s の ease-out で止める。",
        params: [
            { key: "amplitude", label: "amplitude(震え幅 px)", min: 2, max: 16, step: 1, default: 8 },
            { key: "duration", label: "duration(震える時間 s)", min: 0.2, max: 1, step: 0.05, default: 0.4 },
            { key: "shakes", label: "shakes(往復回数)", min: 2, max: 6, step: 1, default: 3 },
        ],
    },
    {
        word: "じわっと", slug: "outline-fill", nameJa: "アウトラインフィル", nameEn: "outline fill", main: "duration",
        lines: "縁取り（-webkit-text-stroke）の上に塗りの層を重ね、\nclip-path: inset(0 100% 0 0) から {{duration}}s の ease で開いて満たす。",
        params: [{ key: "duration", label: "duration(塗る時間 s)", min: 0.2, max: 1.5, step: 0.05, default: 0.6 }],
    },
    {
        word: "カタカタ", slug: "typewriter", nameJa: "タイプライター", nameEn: "typewriter effect", main: "speed",
        lines: "1文字ずつ {{speed}}ms 間隔で打ち、直後に ▌ を置く。\nキャレットは {{blink}}s 周期で点滅させる（フェードしない）。",
        params: [
            { key: "speed", label: "speed(1文字の間隔 ms)", min: 30, max: 200, step: 10, default: 70 },
            { key: "blink", label: "blink(キャレット点滅周期 s)", min: 0.3, max: 1.2, step: 0.05, default: 0.6 },
        ],
    },
]

function decimals(step: number) {
    const s = String(step)
    return s.includes(".") ? s.split(".")[1].length : 0
}
function fmt(p: Param, v: number) {
    const d = decimals(p.step)
    return d === 0 ? String(Math.round(v)) : v.toFixed(d)
}
function defaults(w: Word) {
    const o: Record<string, number> = {}
    w.params.forEach((p) => (o[p.key] = p.default))
    return o
}
const TOKEN_RE = /(\{\{\w+\}\}(?:px|ms|em|s|%)?)/
const TOKEN_PARSE_RE = /^\{\{(\w+)\}\}(px|ms|em|s|%)?$/
type Seg = { t: "x"; text: string } | { t: "p"; key: string; unit: string }
function parse(lines: string): Seg[] {
    return lines.split(TOKEN_RE).filter((x) => x !== "").map((part) => {
        const m = part.match(TOKEN_PARSE_RE)
        return m ? { t: "p" as const, key: m[1], unit: m[2] || "" } : { t: "x" as const, text: part }
    })
}
function reducedMotion() {
    return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/* ------------------------------------------------------------------ */
/* 見出しの演技（WAAPI）。すべて fill:"backwards"＝終われば素の h1 に戻る */
/* ------------------------------------------------------------------ */

// rise＝上へ動いてよい距離（px）。見出しの上にあるラベル等へ字が重ならないよう、跳ね・落下の高さをここで頭打ちにする
type Ctx = { chars: HTMLElement[]; caret: HTMLElement | null; fontPx: number; ink: string; rise: number; cleanups: (() => void)[] }
const anim = (el: HTMLElement, kf: Keyframe[], o: KeyframeAnimationOptions) => el.animate(kf, { fill: "backwards", ...o })

const ACTS: Record<string, (c: Ctx, v: Record<string, number>) => void> = {
    // ふわっと：ぼけ＋わずかな浮き上がりから、ピントが合うように1文字ずつ
    "blur-reveal": ({ chars, fontPx }, v) => {
        const b = v.blur * (fontPx / 80)
        chars.forEach((c, i) => {
            anim(c, [
                { filter: `blur(${b}px)`, opacity: 0, transform: `translateY(${0.12 * fontPx}px)` },
                { filter: "blur(0px)", opacity: 1, transform: "translateY(0px)" },
            ], { duration: v.duration * 1000, delay: i * v.stagger, easing: "cubic-bezier(.2,.7,.2,1)" })
        })
    },
    // パタン：上へ倒れて消え、下から起き上がる（text-flip の出る側／入る側を1文字の中で続けて行う）
    "text-flip": ({ chars, fontPx }, v) => {
        const p = v.perspective * (fontPx / 64)
        const half = v.duration * 1000 * 0.6
        chars.forEach((c, i) => {
            anim(c, [
                { offset: 0, transform: `perspective(${p}px) rotateX(0deg)`, transformOrigin: "50% 0%", opacity: 1, easing: "cubic-bezier(.55,0,.9,.45)" },
                { offset: 0.5, transform: `perspective(${p}px) rotateX(-90deg)`, transformOrigin: "50% 0%", opacity: 0 },
                { offset: 0.5, transform: `perspective(${p}px) rotateX(90deg)`, transformOrigin: "50% 100%", opacity: 1, easing: "cubic-bezier(.2,.9,.3,1.12)" },
                { offset: 1, transform: `perspective(${p}px) rotateX(0deg)`, transformOrigin: "50% 100%", opacity: 1 },
            ], { duration: half * 2, delay: i * 55 })
        })
    },
    // ぷるん：予備動作で潰れ→跳ぶ→着地で潰れ→行き過ぎて収まる。体積保存（scaleX = 1/scaleY）・足元基準
    "squash-stretch": ({ chars, fontPx, rise }, v) => {
        const H = Math.min(0.22 * fontPx, rise)
        const sq = 1 - v.squash / 100, st = 1 + v.stretch / 100, ov = 1 + v.overshoot / 100
        const T = 660 + v.recover * 1000
        const pts: [number, number, number, string][] = [
            [0, 0, 1, "ease-out"],
            [100, 0, sq, "ease-out"],
            [200, -0.38 * H, st, "ease-out"],
            [380, -H, 1, "ease-in"],
            [560, -0.38 * H, st, "ease-in"],
            [660, 0, sq, "ease-out"],
            [660 + v.recover * 450, 0, ov, "ease-in-out"],
            [T, 0, 1, "linear"],
        ]
        const kf: Keyframe[] = pts.map(([t, y, sy, e]) => ({
            offset: t / T, transform: `translateY(${y}px) scale(${1 / sy}, ${sy})`, easing: e,
        }))
        chars.forEach((c, i) => {
            c.style.transformOrigin = "50% 100%"
            anim(c, kf, { duration: T, delay: i * 40 })
        })
    },
    // シュッ：開いた字間から一気に詰まる（複数文字なので translateX で寄せる方式）。
    // 見出しは左揃えなので、字間を開いたときと同じく左端を基準に右へ開いた位置から寄せる
    "tracking-in": ({ chars, fontPx }, v) => {
        const sp = v.spread * fontPx
        chars.forEach((c, i) => {
            const dx = i * sp
            anim(c, [{ transform: `translateX(${dx}px)` }, { transform: "translateX(0px)" }], { duration: v.duration * 1000, easing: "cubic-bezier(0.16, 1, 0.3, 1)" })
            anim(c, [{ opacity: 0 }, { opacity: 1 }], { duration: v.duration * 1000 * 0.6, easing: "ease" })
        })
    },
    // ガタガタ：減衰する左右の振れ。隣り合う文字で位相を逆にして、板が鳴るようにする
    "error-shake": ({ chars, fontPx }, v) => {
        // 入力欄（高さ40px前後）用の震え幅を、見出しの大きさへ比例拡大する
        const A = v.amplitude * (fontPx / 40)
        const N = Math.round(v.shakes) * 2
        chars.forEach((c, i) => {
            const s = i % 2 ? 1 : -1
            const kf: Keyframe[] = [{ transform: "translateX(0px) rotate(0deg)" }]
            for (let j = 0; j < N; j++) {
                const d = s * (j % 2 ? 1 : -1) * (1 - j / N)
                kf.push({ transform: `translateX(${d * A}px) rotate(${d * 3}deg)` })
            }
            kf.push({ transform: "translateX(0px) rotate(0deg)" })
            anim(c, kf, { duration: v.duration * 1000, delay: i * 40, easing: "ease-out" })
        })
    },
    // じわっと：縁取りだけになり、左から塗りが満ちていく（塗りの層＝background-clip:text の背景幅を開く）
    "outline-fill": ({ chars, fontPx, ink, cleanups }, v) => {
        const sw = Math.max(1, Math.round((fontPx / 90) * 10) / 10)
        const props: [string, string][] = [
            ["color", "transparent"],
            ["-webkit-text-stroke", `${sw}px ${ink}`],
            ["background-image", `linear-gradient(${ink}, ${ink})`],
            ["background-repeat", "no-repeat"],
            ["background-position", "0 0"],
            ["background-size", "0% 100%"],
            ["-webkit-background-clip", "text"],
            ["background-clip", "text"],
        ]
        const clear = (c: HTMLElement) => props.forEach(([k]) => c.style.removeProperty(k))
        chars.forEach((c, i) => {
            props.forEach(([k, val]) => c.style.setProperty(k, val))
            const a = anim(c, [{ backgroundSize: "0% 100%" }, { backgroundSize: "100% 100%" }], { duration: v.duration * 1000, delay: i * 90, easing: "ease", fill: "both" })
            a.onfinish = () => { clear(c); a.cancel() }
            cleanups.push(() => clear(c))
        })
    },
    // ポンッ：上から落ちて、減衰しながら跳ねて静止。区間の長さは高さの平方根に比例、上りease-out／下りease-in
    "bounce-in": ({ chars, fontPx, rise }, v) => {
        const H = Math.min((v.height / 120) * 0.9 * fontPx, rise)
        const B = Math.round(v.bounces)
        const segs: { y0: number; y1: number; t: number; e: string }[] = [{ y0: -H, y1: 0, t: Math.sqrt(H), e: "ease-in" }]
        let h = H
        for (let b = 0; b < B; b++) {
            h *= v.damping
            segs.push({ y0: 0, y1: -h, t: Math.sqrt(h), e: "ease-out" })
            segs.push({ y0: -h, y1: 0, t: Math.sqrt(h), e: "ease-in" })
        }
        const total = segs.reduce((s, x) => s + x.t, 0)
        let acc = 0
        const kf: Keyframe[] = segs.map((s) => {
            const k = { offset: acc / total, transform: `translateY(${s.y0}px)`, easing: s.e }
            acc += s.t
            return k
        })
        kf.push({ offset: 1, transform: "translateY(0px)" })
        chars.forEach((c, i) => {
            anim(c, kf, { duration: v.duration * 1000, delay: i * 32 })
            anim(c, [{ opacity: 0 }, { opacity: 1 }], { duration: v.duration * 150, delay: i * 32, easing: "ease-out" })
        })
    },
    // カタカタ：全部消えて、1文字ずつ打たれる。キャレットが文字と一緒に進み、打ち終わりで1回点滅して消える
    "typewriter": ({ chars, caret }, v) => {
        const n = chars.length
        const sp = v.speed
        chars.forEach((c, i) => anim(c, [{ opacity: 0 }, { opacity: 0 }], { duration: (i + 1) * sp }))
        if (!caret) return
        const gap = chars[0].offsetHeight * 0.05
        const xAt = (i: number) => (i === 0 ? chars[0].offsetLeft : chars[i - 1].offsetLeft + chars[i - 1].offsetWidth + gap)
        const yAt = (i: number) => chars[Math.max(0, i - 1)].offsetTop
        caret.style.height = chars[0].offsetHeight * 0.78 + "px"
        const typeMs = (n + 1) * sp
        const blinkMs = v.blink * 1000
        const total = typeMs + blinkMs * 1.5
        const pos: Keyframe[] = []
        for (let i = 0; i <= n; i++) pos.push({ offset: Math.min(1, (i * sp) / total), transform: `translate(${xAt(i)}px, ${yAt(i) + chars[0].offsetHeight * 0.11}px)`, easing: "steps(1, end)" })
        pos.push({ ...pos[pos.length - 1], offset: 1 })
        anim(caret, pos, { duration: total, fill: "none" })
        const t1 = typeMs / total, h = blinkMs / 2 / total
        anim(caret, [
            { offset: 0, opacity: 1, easing: "steps(1, end)" },
            { offset: t1, opacity: 1, easing: "steps(1, end)" },
            { offset: Math.min(1, t1 + h), opacity: 0, easing: "steps(1, end)" },
            { offset: Math.min(1, t1 + 2 * h), opacity: 1, easing: "steps(1, end)" },
            { offset: 1, opacity: 1 },
        ], { duration: total, fill: "none" })
    },
}

/* ------------------------------------------------------------------ */
/* 共有の状態（見出し・チップ列・黒いパネルが同じ「いまの言葉」を見る）     */
/* ------------------------------------------------------------------ */
// 5周目：チップ列を見出しの直下へ移した（チップ→見出し→プロンプトを1本の視線に）。チップは HeroTitle、
// スライダーと全文は HeroConsole にあり、キャンバス上では別々の部品なので、状態はこのファイルの中の1つの store で持つ。
// Framer は Desktop/Tablet/Phone の版を同時に描くが、どれも同じ store を見る（隠れている版は画面外＝巡回も演技もしない）。
// SSR とクライアント初回は INIT を描く（useSyncExternalStore の getServerSnapshot）＝同じ HTML。

interface HS {
    words: Word[]
    idx: number
    values: Record<string, Record<string, number>>
    auto: boolean
    tick: number // 言葉を替えた回数（チップの残り時間の線を引き直す鍵）
    playAt: number // 最後に演じた時刻（performance.now）。0 は「打ち出さず全文を見せる」
    flash: string // スライダーで動かした直後の param key（値が光る）
    playing: boolean // 巡回中か（画面内・準備済み・Auto・reduced でない）
    interval: number
}
function initValues() {
    const o: Record<string, Record<string, number>> = {}
    WORDS.forEach((w) => (o[w.slug] = defaults(w)))
    return o
}
const INIT: HS = { words: WORDS, idx: 0, values: initValues(), auto: true, tick: 0, playAt: 0, flash: "", playing: false, interval: 4600 }
let S: HS = INIT
const SUBS = new Set<() => void>()
function setS(p: Partial<HS>) {
    S = { ...S, ...p }
    SUBS.forEach((f) => f())
}
const subscribe = (f: () => void) => {
    SUBS.add(f)
    return () => { SUBS.delete(f) }
}
function useHS(): HS {
    return useSyncExternalStore(subscribe, () => S, () => INIT)
}

// 巡回の指揮（モジュールに1つ）。どれか1つの部品が画面内にあれば回る
const C = { ready: false, booted: false, fired: "", cycleT: 0 as unknown as ReturnType<typeof setTimeout>, fetched: false, flashT: 0 as unknown as ReturnType<typeof setTimeout> }
const VIS = new Set<object>()

function fireNow(vals?: Record<string, number>) {
    if (typeof window === "undefined") return
    const x = S.words[S.idx]
    const detail: HeroDetail = { word: x.word, slug: x.slug, params: vals || S.values[x.slug] || defaults(x) }
    setS({ playAt: reducedMotion() ? 0 : performance.now() })
    window.dispatchEvent(new CustomEvent(EVT, { detail }))
}
function drive() {
    if (typeof window === "undefined") return
    const on = C.ready && VIS.size > 0
    const reduced = reducedMotion()
    const key = `${S.idx}:${S.tick}`
    if (on && C.fired !== key) {
        const first = C.fired === ""
        C.fired = key
        // reduced-motion：読み込み時は演じない（触ったときだけ下線で応える）
        if (!(reduced && first)) fireNow()
    }
    const playing = on && S.auto && !reduced
    if (playing !== S.playing) setS({ playing })
    clearTimeout(C.cycleT)
    if (!playing) return
    C.cycleT = setTimeout(() => {
        if (!S.auto) return
        setS({ idx: (S.idx + 1) % S.words.length, tick: S.tick + 1 })
        drive()
    }, S.interval)
}
function boot() {
    if (C.booted || typeof window === "undefined") return
    C.booted = true
    // マウント直後は見出しを一度読ませてから演じる
    setTimeout(() => { C.ready = true; drive() }, 700)
}
function stopAuto() {
    clearTimeout(C.cycleT)
    if (S.auto || S.playing) setS({ auto: false, playing: false })
}
function startAuto() {
    setS({ auto: true, tick: S.tick + 1 })
    drive()
}
function choose(k: number) {
    stopAuto()
    C.ready = true
    setS({ idx: k, tick: S.tick + 1 })
    drive()
}
function slide(key: string, val: number) {
    stopAuto()
    const w = S.words[S.idx]
    setS({ values: { ...S.values, [w.slug]: { ...(S.values[w.slug] || defaults(w)), [key]: val } }, flash: key })
    clearTimeout(C.flashT)
    C.flashT = setTimeout(() => setS({ flash: "" }), 650)
}
// 辞典の実データで数値の範囲・初期値・項目名を合わせ直す（落ちても手持ちの値で動く）
function ensureData(base: string) {
    if (C.fetched || typeof window === "undefined" || typeof fetch === "undefined") return
    C.fetched = true
    Promise.all(WORDS.map((x) => fetch(`${base}/entry/${x.slug}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null))).then((list) => {
        const next = WORDS.map((x, k) => {
            const j = list[k]
            if (!j || !Array.isArray(j.params)) return x
            const params = x.params.map((p) => {
                const q = j.params.find((r: Param) => r.key === p.key)
                return q ? { ...p, label: q.label ?? p.label, min: q.min, max: q.max, step: q.step, default: q.default } : p
            })
            return { ...x, nameJa: j.nameJa || x.nameJa, params }
        })
        const o = { ...S.values }
        next.forEach((x, k) => {
            WORDS[k].params.forEach((p, n) => {
                // まだ誰も触っていない値だけ、辞典の初期値に寄せる
                if (o[x.slug] && o[x.slug][p.key] === p.default) o[x.slug] = { ...o[x.slug], [p.key]: x.params[n].default }
            })
        })
        setS({ words: next, values: o })
    })
}
/** 画面内にあるあいだ巡回に参加する（隠れている版・画面外の部品は数えない） */
function useVisible(ref: { current: HTMLElement | null }, isStatic: boolean, onChange?: (v: boolean) => void) {
    useEffect(() => {
        if (isStatic || !ref.current || typeof IntersectionObserver === "undefined") return
        const me = {}
        boot()
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) VIS.add(me)
            else VIS.delete(me)
            onChange?.(e.isIntersecting)
            drive()
        }, { threshold: 0 })
        io.observe(ref.current)
        return () => { io.disconnect(); VIS.delete(me); drive() }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic])
}
/** プロンプトの打ち出し（1文字16ms）。playAt が 0 なら全文 */
function useTyped(total: number, playAt: number, isStatic: boolean) {
    const [typed, setTyped] = useState(Infinity)
    useEffect(() => {
        if (isStatic || !playAt) { setTyped(Infinity); return }
        let raf = 0
        const step = () => {
            const n = Math.floor((performance.now() - playAt) / 16)
            setTyped(n >= total ? Infinity : Math.max(0, n))
            if (n < total) raf = requestAnimationFrame(step)
        }
        step()
        return () => cancelAnimationFrame(raf)
    }, [playAt, total, isStatic])
    return typed
}

function segLen(segs: Seg[], w: Word, v: Record<string, number>) {
    const pBy = Object.fromEntries(w.params.map((p) => [p.key, p])) as Record<string, Param>
    return segs.reduce((s, g) => s + (g.t === "x" ? g.text.length : fmt(pBy[g.key], v[g.key]).length + g.unit.length), 0)
}
/** segs を先頭から limit 文字ぶんだけ描く。値は .mdh-dyn（光る対象は flash） */
function Segs({ segs, w, v, limit, flash, cls }: { segs: Seg[]; w: Word; v: Record<string, number>; limit: number; flash: string; cls: string }) {
    const pBy = Object.fromEntries(w.params.map((p) => [p.key, p])) as Record<string, Param>
    let left = limit
    return (
        <>
            {segs.map((g, i) => {
                if (left <= 0) return null
                if (g.t === "x") {
                    const s = g.text.slice(0, left)
                    left -= g.text.length
                    return <span key={i}>{s}</span>
                }
                const full = fmt(pBy[g.key], v[g.key]) + g.unit
                const s = full.slice(0, left)
                left -= full.length
                return <span key={i} className={cls + (flash === g.key ? " on" : "")}>{s}</span>
            })}
        </>
    )
}
/** いまの値の表記（主パラメータ1つ）：「duration 0.60s」「bounces 3」 */
function mainText(w: Word, v: Record<string, number>) {
    const p = w.params.find((x) => x.key === w.main)
    if (!p) return ""
    const g = parse(w.lines).find((x) => x.t === "p" && x.key === w.main) as { t: "p"; key: string; unit: string } | undefined
    return `${p.key} ${fmt(p, v[p.key])}${g ? g.unit : ""}`
}

/** 演技の器：字の span を受け取り、md:hero を受けたら ACTS で演じる（見出し・パネルの小さな実演で共通） */
function useActor(o: {
    isStatic: boolean
    ink: string
    inView: { current: boolean }
    host: { current: HTMLElement | null }
    chars: { current: (HTMLSpanElement | null)[] }
    caret: { current: HTMLSpanElement | null }
    rise: () => number
    defer?: boolean // パネルの実演：言葉の差し替え（React の再描画）を待ってから演じる
    onReduced?: () => void
}) {
    const cleanups = useRef<(() => void)[]>([])
    useEffect(() => {
        if (o.isStatic || typeof window === "undefined") return
        let raf = 0
        const stop = () => {
            const els = o.chars.current.filter(Boolean) as HTMLElement[]
            els.forEach((c) => { c.getAnimations().forEach((a) => a.cancel()); c.style.removeProperty("transform-origin") })
            o.caret.current?.getAnimations().forEach((a) => a.cancel())
            cleanups.current.forEach((f) => f())
            cleanups.current = []
        }
        const play = (d: HeroDetail) => {
            const w = WORDS.find((x) => x.slug === d.slug) || WORDS.find((x) => x.word === d.word)
            if (!w) return
            if (reducedMotion()) { o.onReduced?.(); return }
            const act = ACTS[w.slug]
            const host = o.host.current
            if (!act || !host || typeof host.animate !== "function") return
            stop()
            const els = o.chars.current.filter(Boolean) as HTMLElement[]
            if (!els.length) return
            act({ chars: els, caret: o.caret.current, fontPx: parseFloat(getComputedStyle(host).fontSize) || 100, ink: o.ink, rise: o.rise(), cleanups: cleanups.current }, { ...defaults(w), ...(d.params || {}) })
        }
        const onHero = (ev: Event) => {
            const d = (ev as CustomEvent<HeroDetail>).detail
            if (!d || !o.inView.current) return
            cancelAnimationFrame(raf)
            if (o.defer) raf = requestAnimationFrame(() => play(d))
            else play(d)
        }
        window.addEventListener(EVT, onHero)
        return () => { window.removeEventListener(EVT, onHero); cancelAnimationFrame(raf); stop() }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [o.isStatic, o.ink])
}

/** 見出しの上にある要素（ラベル等）までの空き。祖先をさかのぼって、最初に見つかった「上の兄弟」の下端との距離 */
function roomAbove(el: HTMLElement): number {
    const top = el.getBoundingClientRect().top
    for (let a: HTMLElement | null = el; a && a !== document.body; a = a.parentElement) {
        for (let s = a.previousElementSibling as HTMLElement | null; s; s = s.previousElementSibling as HTMLElement | null) {
            const r = s.getBoundingClientRect()
            if (r.width > 0 && r.height > 0 && getComputedStyle(s).position !== "fixed") return Math.max(0, top - r.bottom)
        }
    }
    return Math.max(0, top)
}

/* ------------------------------------------------------------------ */
/* HeroTitle                                                           */
/* ------------------------------------------------------------------ */

interface TitleProps {
    text: string
    maxSize: number
    ink: string
    paper: string
    accent: string
    muted: string
    base: string
    style?: CSSProperties
}

/**
 * Hero Title（演じる見出し＋擬音のチップ列＋いまの値＋プロンプトの頭）
 *
 * 5周目：チップ列を黒いパネルから見出しの直下へ移した。
 * 目の順＝見出し → チップ（押すと見出しが即座に演じる）→「↑ いまの見出し＝擬音 項目名 値」→ プロンプトの頭。
 *
 * @framerIntrinsicWidth 1360
 * @framerIntrinsicHeight 300
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export function HeroTitle(props: TitleProps) {
    const { text = TITLE, maxSize = 176, ink = "#0A0A0A", paper = "#F4F4F1", accent = "#A5E02E", muted = "#6B6B66", base = "https://ryota4100221-cmyk.github.io/motion-dict" } = props
    const isStatic = useIsStaticRenderer()
    const st = useHS()
    const chars = useMemo(() => Array.from(text), [text])
    const rootRef = useRef<HTMLDivElement>(null)
    const h1Ref = useRef<HTMLHeadingElement>(null)
    const charRefs = useRef<(HTMLSpanElement | null)[]>([])
    const caretRef = useRef<HTMLSpanElement>(null)
    const inView = useRef(true)
    const [mark, setMark] = useState(false) // reduced-motion 時の反応（下線）
    const markT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    // 1文字の幅 ≒ 1em − 字詰め。幅いっぱいに収める cqi を文字数から出す
    const fit = 100 / (chars.length * 0.96 + 0.1)

    useVisible(rootRef, isStatic, (v) => (inView.current = v))
    useEffect(() => { if (!isStatic) ensureData(base) }, [isStatic, base])
    useEffect(() => () => clearTimeout(markT.current), [])
    useActor({
        isStatic, ink, inView, host: h1Ref, chars: charRefs, caret: caretRef,
        // 上のラベルに字が掛からない高さまで。字面の上には行送りの余り（約0.12em）があるので、その分は使ってよい
        rise: () => {
            const h1 = h1Ref.current
            if (!h1) return 0
            const fs = parseFloat(getComputedStyle(h1).fontSize) || 100
            return Math.max(0, roomAbove(h1) + fs * 0.12 - 8)
        },
        onReduced: () => {
            setMark(true)
            clearTimeout(markT.current)
            markT.current = setTimeout(() => setMark(false), 1400)
        },
    })

    const w = st.words[st.idx]
    const v = st.values[w.slug] || defaults(w)
    const head = useMemo(() => parse(w.lines.split("\n")[0]), [w])
    const headTotal = segLen(head, w, v)
    const typed = useTyped(headTotal, st.playAt, isStatic)
    const done = typed >= headTotal
    const line = "rgba(10,10,10,.16)"
    const tint = "rgba(165,224,46,.38)"

    return (
        <div ref={rootRef} className="mdh-t" style={{ width: "100%", containerType: "inline-size", ...props.style } as CSSProperties}>
            <style dangerouslySetInnerHTML={{ __html: `
.mdh-t .mdh-rail{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px 40px;margin-top:22px}
.mdh-t .mdh-tc{display:flex;flex-wrap:wrap;gap:8px;flex:none;max-width:100%}
.mdh-t .mdh-tc button{position:relative;overflow:hidden;flex:none;height:38px;padding:0 17px;border-radius:100px;border:1px solid ${line};background:transparent;color:${ink};font-family:${JP};font-weight:700;font-size:15px;letter-spacing:.04em;cursor:pointer;transition:border-color .2s,background-color .2s;touch-action:manipulation}
.mdh-t .mdh-tc button:hover{border-color:${ink}}
.mdh-t .mdh-tc button[aria-pressed="true"]{background:${accent};border-color:${accent};color:${ink}}
.mdh-t .mdh-tc button:focus-visible{outline:2px solid ${ink};outline-offset:2px}
.mdh-t .mdh-tc .bar{position:absolute;left:14px;right:14px;bottom:5px;height:2px;background:${ink};opacity:.55;transform-origin:0 50%;transform:scaleX(0);pointer-events:none}
.mdh-t .mdh-now{margin:0;flex:1 1 0;min-width:0;justify-content:flex-end;display:flex;align-items:baseline;flex-wrap:nowrap;white-space:nowrap;gap:4px 10px;font-family:${JP};font-size:14px;line-height:1.5;color:${ink}}
.mdh-t .mdh-now .k{font-family:${MONO};font-size:12px;letter-spacing:.04em;color:${muted};white-space:nowrap}
.mdh-t .mdh-now b{font-size:17px;letter-spacing:.02em}
.mdh-t .mdh-now .n{color:${muted};white-space:nowrap;min-width:0;overflow:hidden;text-overflow:ellipsis}
.mdh-t .mdh-now b,.mdh-t .mdh-now .k,.mdh-t .mdh-now .mdh-v{flex:none}
.mdh-t .mdh-v{font-family:${MONO};font-size:14px;color:${ink};background:${tint};border-radius:3px;padding:1px 6px;white-space:nowrap;font-variant-numeric:tabular-nums;transition:background-color .3s}
.mdh-t .mdh-v.on{background:${accent};transition:none}
.mdh-t .mdh-head{margin:16px 0 0;display:flex;align-items:baseline;gap:14px;font-family:${MONO};font-size:14px;line-height:1.7;color:${ink};min-height:1.7em}
.mdh-t .mdh-head .k{flex:none;font-size:11px;letter-spacing:.08em;color:${muted}}
.mdh-t .mdh-head .tx{min-width:0;overflow-wrap:anywhere}
.mdh-t .mdh-head .tx>span{min-width:0}
.mdh-t .mdh-head .mdh-v{font-size:13px;padding:0 4px}
.mdh-t .mdh-head .more{flex:none;color:${muted};white-space:nowrap}
.mdh-t .mdh-head .more.sp{display:none}
.mdh-t .mdh-caret{display:inline-block;width:.55em;height:1.1em;vertical-align:-.2em;margin-left:2px;background:${ink};animation:mdh-tblink 1s steps(1,end) infinite}
@keyframes mdh-tblink{50%{opacity:0}}
@keyframes mdh-tbar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
/* 版面が狭いとき（タブレット〜）：値の表記はチップ列の下の行へ（横に詰めると項目名が潰れる） */
@container (max-width: 1080px){
.mdh-t .mdh-now{flex-basis:100%;justify-content:flex-start}
}
@container (max-width: 640px){
.mdh-t .mdh-rail{margin-top:16px;gap:12px}
.mdh-t .mdh-tc{gap:6px}
.mdh-t .mdh-tc button{height:36px;padding:0 13px;font-size:14px}
.mdh-t .mdh-now{font-size:13px;gap:2px 8px;flex-wrap:nowrap;white-space:nowrap}
.mdh-t .mdh-now .n{display:none}
.mdh-t .mdh-now b{font-size:15px}
.mdh-t .mdh-head{margin-top:10px;font-size:13px;gap:10px}
.mdh-t .mdh-head .more.pc{display:none}
.mdh-t .mdh-head .tx>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mdh-t .mdh-head .more.sp{display:inline}
}
@media (prefers-reduced-motion: reduce){.mdh-t .mdh-tc button,.mdh-t .mdh-v{transition:none}.mdh-t .mdh-caret{animation:none}}
` }} />
            {/* 横だけ clip：演技中に文字が右へはみ出しても横スクロールを生まない（縦は跳ねるので見せる）。
                左は負方向なのでスクロールを生まない＝ぼかしの滲みが切れないよう 64px 外まで描かせる */}
            <div style={{ overflowX: "clip", overflowY: "visible", marginLeft: -64, paddingLeft: 64 }}>
                <h1 ref={h1Ref} aria-label={text}
                    style={{
                        position: "relative", width: "fit-content", margin: 0, fontFamily: JP, fontWeight: 700, color: ink,
                        fontSize: `min(${maxSize}px, ${fit.toFixed(2)}cqi)`, lineHeight: 1.18, letterSpacing: "-0.04em",
                        whiteSpace: "nowrap", fontKerning: "none",
                    }}>
                    {chars.map((ch, i) => (
                        <span key={i} aria-hidden="true" ref={(el) => { charRefs.current[i] = el }}
                            style={{ display: "inline-block", whiteSpace: "pre" }}>{ch}</span>
                    ))}
                    <span ref={caretRef} aria-hidden="true"
                        style={{ position: "absolute", left: 0, top: 0, width: "0.06em", height: "0.9em", background: ink, opacity: 0, pointerEvents: "none" }} />
                    <span aria-hidden="true"
                        style={{ position: "absolute", left: 0, bottom: "-0.02em", height: "max(3px, 0.05em)", width: "100%", background: accent, opacity: mark ? 1 : 0, pointerEvents: "none" }} />
                </h1>
            </div>

            {/* 擬音のチップ（押すと見出しが即座に演じる）＋ いまの見出しの値 */}
            <div className="mdh-rail">
                <div className="mdh-tc" role="group" aria-label="擬音を選ぶと、見出しがその動きを演じます">
                    {st.words.map((x, k) => (
                        <button key={x.slug} type="button" aria-pressed={k === st.idx} onClick={() => choose(k)}>
                            {x.word}
                            {/* 自動で次の語へ移るまでの残り時間（触ると止まる） */}
                            {k === st.idx && st.playing ? (
                                <span key={`b${st.tick}`} className="bar" aria-hidden="true" style={{ animation: `mdh-tbar ${st.interval}ms linear forwards` }} />
                            ) : null}
                        </button>
                    ))}
                </div>
                {/* 自動巡回中は読み上げない（4.6秒ごとに割り込むため）。人が選んだ・動かしたときだけ知らせる */}
                <p className="mdh-now" aria-live={st.auto ? "off" : "polite"}>
                    <span className="k">↑ いまの見出し＝</span>
                    <b>{w.word}</b>
                    <span className="n">{w.nameJa}</span>
                    <span className={"mdh-v" + (st.flash === w.main ? " on" : "")}>{mainText(w, v)}</span>
                </p>
            </div>

            {/* プロンプトの頭（全文は黒いパネル）。打ち出しは 1文字16ms＝パネルの全文と同じ速さで同時に書かれる */}
            <p className="mdh-head">
                <span className="k" aria-hidden="true">PROMPT</span>
                <span className="tx" style={{ display: "grid" }}>
                    {/* 全文ぶんの幅と高さを先に確保して、打ち出し中にレイアウトを動かさない */}
                    <span aria-hidden="true" style={{ gridArea: "1 / 1", visibility: "hidden" }}><Segs segs={head} w={w} v={v} limit={Infinity} flash="" cls="mdh-v" /></span>
                    <span style={{ gridArea: "1 / 1" }}>
                        <Segs segs={head} w={w} v={v} limit={done ? Infinity : typed} flash={st.flash} cls="mdh-v" />
                        {!done ? <span className="mdh-caret" aria-hidden="true" /> : null}
                    </span>
                </span>
                <span className="more pc" aria-hidden="true" style={{ visibility: done ? "visible" : "hidden" }}>… 全文 ↘</span>
                <span className="more sp" aria-hidden="true" style={{ visibility: done ? "visible" : "hidden" }}>全文 ↓</span>
            </p>
        </div>
    )
}

addPropertyControls(HeroTitle, {
    text: { type: ControlType.String, title: "Text", defaultValue: TITLE },
    maxSize: { type: ControlType.Number, title: "Max size", defaultValue: 176, min: 32, max: 240, step: 1, unit: "px" },
    base: { type: ControlType.String, title: "Base", defaultValue: "https://ryota4100221-cmyk.github.io/motion-dict" },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#0A0A0A" },
    paper: { type: ControlType.Color, title: "Paper", defaultValue: "#F4F4F1" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#A5E02E" },
    muted: { type: ControlType.Color, title: "Muted", defaultValue: "#6B6B66" },
})

/* ------------------------------------------------------------------ */
/* HeroConsole                                                         */
/* ------------------------------------------------------------------ */

interface ConsoleProps {
    base: string
    interval: number
    ink: string
    paper: string
    accent: string
    muted: string
    style?: CSSProperties
}

/**
 * Hero Console（その動きの絵＋プロンプト全文＋スライダー）
 *
 * 5周目：チップは見出しの直下（HeroTitle）へ移した。黒い面は「いま見出しが演じた動き」を
 * 小さく実演する面と、プロンプトの全文・主パラメータのスライダーを受け持つ。
 *
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 280
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export function HeroConsole(props: ConsoleProps) {
    const {
        base = "https://ryota4100221-cmyk.github.io/motion-dict",
        interval = 4600,
        ink = "#0A0A0A",
        paper = "#F4F4F1",
        accent = "#A5E02E",
        muted = "#6B6B66",
    } = props
    const isStatic = useIsStaticRenderer()
    const st = useHS()
    const [reduced, setReduced] = useState(false)
    const [narrow, setNarrow] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const wordRef = useRef<HTMLSpanElement>(null)
    const charRefs = useRef<(HTMLSpanElement | null)[]>([])
    const caretRef = useRef<HTMLSpanElement>(null)
    const inView = useRef(true)

    useVisible(rootRef, isStatic, (x) => (inView.current = x))
    useEffect(() => { if (!isStatic) ensureData(base) }, [isStatic, base])
    useEffect(() => {
        if (isStatic) return
        setReduced(reducedMotion())
        if (S.interval !== interval) { setS({ interval }); drive() }
    }, [isStatic, interval])
    useEffect(() => {
        if (isStatic || !rootRef.current || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(([e]) => setNarrow(e.contentRect.width < 520))
        ro.observe(rootRef.current)
        return () => ro.disconnect()
    }, [isStatic])
    // 小さな実演：見出しと同じ md:hero を受けて、同じ値で、その擬音そのものが演じる
    useActor({ isStatic, ink: paper, inView, host: wordRef, chars: charRefs, caret: caretRef, rise: () => 1e4, defer: true })

    const w = st.words[st.idx]
    const v = st.values[w.slug] || defaults(w)
    const main = w.params.find((p) => p.key === w.main)
    const segs = useMemo(() => parse(w.lines), [w])
    const total = segLen(segs, w, v)
    const typed = useTyped(total, st.playAt, isStatic)
    const done = typed >= total
    const dim = "rgba(244,244,241,.56)"
    const line = "rgba(244,244,241,.14)"
    const pad = narrow ? 16 : 24
    const fill = main ? ((v[w.main] - main.min) / (main.max - main.min)) * 100 : 0
    const replay = () => fireNow(S.values[S.words[S.idx].slug])
    const wordChars = Array.from(w.word)

    return (
        <div ref={rootRef}
            onPointerDown={stopAuto}
            style={{ width: "100%", background: ink, color: paper, borderRadius: 10, overflow: "hidden", fontFamily: JP, position: "relative", ...props.style }}>
            <style dangerouslySetInnerHTML={{ __html: `
.mdh-auto{display:inline-flex;align-items:center;gap:8px;height:28px;padding:0 12px;border-radius:100px;border:1px solid ${line};background:transparent;color:${dim};font-family:${MONO};font-size:11px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}
.mdh-auto:focus-visible,.mdh-link:focus-visible,.mdh-replay:focus-visible{outline:2px solid ${accent};outline-offset:2px}
.mdh-dyn{color:${accent};background:rgba(165,224,46,.14);border-radius:3px;padding:0 3px;transition:background .3s,color .3s}
.mdh-dyn.on{background:${accent};color:${ink};transition:none}
.mdh-caret{display:inline-block;width:.55em;height:1.1em;vertical-align:-.2em;margin-left:2px;background:${accent};animation:mdh-blink 1s steps(1,end) infinite}
@keyframes mdh-blink{50%{opacity:0}}
@keyframes mdh-bar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.mdh-stage{position:relative;overflow:hidden;border-radius:6px;background:rgba(244,244,241,.05);border:1px solid ${line};cursor:pointer}
.mdh-stage:hover .mdh-replay{color:${paper};border-color:rgba(244,244,241,.5)}
.mdh-replay{position:absolute;right:8px;top:8px;display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 9px;border-radius:100px;border:1px solid ${line};background:${ink};color:${dim};font-family:${MONO};font-size:11px;letter-spacing:.04em;cursor:pointer;transition:color .2s,border-color .2s}
.mdh-range{-webkit-appearance:none;appearance:none;width:100%;height:32px;background:transparent;margin:0;cursor:pointer}
.mdh-range:focus{outline:none}
.mdh-range:focus-visible{outline:2px solid ${accent};outline-offset:2px;border-radius:4px}
.mdh-range::-webkit-slider-runnable-track{height:2px;background:linear-gradient(to right, ${paper} 0, ${paper} var(--fill), ${muted} var(--fill))}
.mdh-range::-moz-range-track{height:2px;background:${muted}}
.mdh-range::-moz-range-progress{height:2px;background:${paper}}
.mdh-range::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:${accent};border:2px solid ${ink};margin-top:-9px;transition:transform .15s}
.mdh-range::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:${accent};border:2px solid ${ink}}
.mdh-range:active::-webkit-slider-thumb{transform:scale(1.18)}
.mdh-link{color:${paper};text-decoration:none;border-bottom:1px solid ${accent};padding-bottom:2px;white-space:nowrap}
@media (prefers-reduced-motion: reduce){.mdh-dyn{transition:none}.mdh-caret{animation:none}}
` }} />

            {/* 巡回の残り時間（触ると消える） */}
            <span aria-hidden="true" key={`bar${st.tick}`}
                style={{ position: "absolute", left: 0, top: 0, height: 2, width: "100%", background: accent, transformOrigin: "0 50%",
                    opacity: st.playing ? 1 : 0, transform: "scaleX(0)",
                    animation: st.playing ? `mdh-bar ${st.interval}ms linear forwards` : "none" }} />

            {/* ヘッダー：いまの項目のファイル名＋自動巡回 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: `10px ${pad}px`, borderBottom: `1px solid ${line}` }}>
                <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.04em", color: dim, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {`// ${w.slug}.md`}
                </span>
                {!reduced ? (
                    <button className="mdh-auto" aria-pressed={st.auto} onClick={(e) => { e.stopPropagation(); if (st.auto) stopAuto(); else startAuto() }}
                        onPointerDown={(e) => e.stopPropagation()}>
                        <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 6, background: st.auto ? accent : muted }} />
                        {st.auto ? "Auto" : "Paused"}
                    </button>
                ) : null}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "188px 1fr", gap: narrow ? 14 : 24, padding: `${narrow ? 14 : 18}px ${pad}px ${narrow ? 6 : 8}px` }}>
                {/* その動きの絵：擬音そのものが、見出しと同じ値で演じる（押すともう一度） */}
                <div ref={stageRef} className="mdh-stage" onClick={replay} aria-hidden="true"
                    style={{ minHeight: narrow ? 116 : 140 }}>
                    <button type="button" className="mdh-replay" tabIndex={-1} onClick={(e) => { e.stopPropagation(); replay() }}>↻ もう一度</button>
                    <span style={{ position: "absolute", left: 14, right: 14, bottom: 30, height: 1, background: line }} />
                    <span ref={wordRef} key={w.slug}
                        style={{ position: "absolute", left: 14, bottom: 30, fontFamily: JP, fontWeight: 700, fontSize: narrow ? 36 : 40, lineHeight: 1.18, letterSpacing: "-0.02em", color: paper, whiteSpace: "nowrap" }}>
                        {wordChars.map((ch, i) => (
                            <span key={i} ref={(el) => { charRefs.current[i] = el }} style={{ display: "inline-block", whiteSpace: "pre" }}>{ch}</span>
                        ))}
                        <span ref={caretRef} style={{ position: "absolute", left: 0, top: 0, width: "0.06em", height: "0.9em", background: paper, opacity: 0, pointerEvents: "none" }} />
                    </span>
                    <span style={{ position: "absolute", left: 14, bottom: 8, fontFamily: MONO, fontSize: 11, letterSpacing: "0.04em", color: dim, whiteSpace: "nowrap" }}>{mainText(w, v)}</span>
                </div>

                <div style={{ minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 10 }}>
                    {/* プロンプトの全文（打ち出し） */}
                    {/* 高さは8語のうち一番長いプロンプトの行数ぶん確保（PC・SP とも4行）＝語が替わっても面の高さと下の行が動かない */}
                    <div style={{ fontFamily: MONO, fontSize: narrow ? 13 : 14, lineHeight: 1.75, whiteSpace: "pre-wrap", overflowWrap: "anywhere", display: "grid", alignContent: "start", minHeight: narrow ? 92 : 98 }}>
                        {/* 全文ぶんの高さを先に確保して、打ち出し中にレイアウトを動かさない */}
                        <div aria-hidden="true" style={{ gridArea: "1 / 1", visibility: "hidden" }}><Segs segs={segs} w={w} v={v} limit={Infinity} flash="" cls="mdh-dyn" /></div>
                        <div aria-live="off" style={{ gridArea: "1 / 1" }}>
                            <Segs segs={segs} w={w} v={v} limit={done ? Infinity : typed} flash={st.flash} cls="mdh-dyn" />
                            {!done ? <span className="mdh-caret" aria-hidden="true" /> : null}
                        </div>
                    </div>

                    {/* 主パラメータのスライダー */}
                    {main ? (
                        <div>
                            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, fontFamily: MONO, fontSize: 12, color: dim, letterSpacing: "0.02em" }}>
                                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{main.label}</span>
                                <span style={{ color: accent }}>{fmt(main, v[w.main])}</span>
                                <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>（離すと見出しがこの値で動きます）</span>
                            </label>
                            <input className="mdh-range" type="range" aria-label={`${w.nameJa}：${main.label}`}
                                min={main.min} max={main.max} step={main.step} value={v[w.main]}
                                style={{ ["--fill" as string]: `${fill}%` } as CSSProperties}
                                onChange={(e) => slide(w.main, parseFloat(e.target.value))}
                                onPointerUp={replay}
                                onKeyUp={(e) => { if (e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End" || e.key.startsWith("Page")) replay() }} />
                        </div>
                    ) : null}
                </div>
            </div>

            {/* 項目名と詳細へのリンク */}
            {/* SP：リンクを左に置く（右下の Made in Framer バッジ 約150×40・右下12px に隠れていた＝独立レビュー3周目） */}
            <div style={{ display: "flex", flexDirection: narrow ? "column" : "row", alignItems: narrow ? "flex-start" : "center", justifyContent: "space-between", gap: narrow ? 6 : 16, flexWrap: "wrap", padding: `12px ${pad}px ${narrow ? 10 : 14}px`, borderTop: `1px solid ${line}` }}>
                <span style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0, maxWidth: "100%" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap" }}>{w.nameJa}</span>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: dim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.nameEn}</span>
                </span>
                <a className="mdh-link" href={`/entries/${w.slug}`} style={narrow ? { fontSize: 13, display: "inline-flex", alignItems: "center", height: 44, borderBottom: 0, padding: 0 } : { fontSize: 13 }}>
                    <span style={narrow ? { borderBottom: `1px solid ${accent}`, paddingBottom: 2 } : undefined}>この項目を開く →</span>
                </a>
            </div>
        </div>
    )
}

addPropertyControls(HeroConsole, {
    interval: { type: ControlType.Number, title: "Interval", defaultValue: 4600, min: 2500, max: 12000, step: 100, unit: "ms" },
    base: { type: ControlType.String, title: "Base", defaultValue: "https://ryota4100221-cmyk.github.io/motion-dict" },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#0A0A0A" },
    paper: { type: ControlType.Color, title: "Paper", defaultValue: "#F4F4F1" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#A5E02E" },
    muted: { type: ControlType.Color, title: "Muted", defaultValue: "#6B6B66" },
})

/* ------------------------------------------------------------------ */
/* default：見出し＋コンソールを1つで置く版（キャンバスで2つに分けない場合） */
/* ------------------------------------------------------------------ */

interface LiveProps extends ConsoleProps { maxSize: number }

/**
 * Hero Live（見出し＋チップ列＋コンソール）
 *
 * @framerIntrinsicWidth 1360
 * @framerIntrinsicHeight 640
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function HeroLive(props: LiveProps) {
    const { maxSize = 176, ink = "#0A0A0A", paper = "#F4F4F1", accent = "#A5E02E", muted = "#6B6B66" } = props
    return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 28, ...props.style }}>
            <HeroTitle text={TITLE} maxSize={maxSize} ink={ink} paper={paper} accent={accent} muted={muted} base={props.base} />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ width: "100%", maxWidth: 640 }}>
                    <HeroConsole base={props.base} interval={props.interval} ink={ink} paper={paper} accent={accent} muted={muted} />
                </div>
            </div>
        </div>
    )
}

addPropertyControls(HeroLive, {
    maxSize: { type: ControlType.Number, title: "Max size", defaultValue: 176, min: 32, max: 240, step: 1, unit: "px" },
    interval: { type: ControlType.Number, title: "Interval", defaultValue: 4600, min: 2500, max: 12000, step: 100, unit: "ms" },
    base: { type: ControlType.String, title: "Base", defaultValue: "https://ryota4100221-cmyk.github.io/motion-dict" },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#0A0A0A" },
    paper: { type: ControlType.Color, title: "Paper", defaultValue: "#F4F4F1" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#A5E02E" },
    muted: { type: ControlType.Color, title: "Muted", defaultValue: "#6B6B66" },
})
