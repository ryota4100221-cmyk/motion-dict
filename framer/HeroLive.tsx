import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

// FVの見せ場。「言葉を選ぶと動きになり、動きを触ると言葉（プロンプト）になる」を1画面目で起こす。
// HeroTitle   … h1「動きの伝え方辞典」。window の CustomEvent "md:hero" を受けると、その擬態語の動きを見出し自身が演じる。
// HeroConsole … 黒い面。擬態語を選ぶ→見出しが演じる／プロンプトの要の行を打ち出す／スライダーで数値が書き換わり、離すと演じ直す。
// 2つはキャンバス上で別々に置き、イベントだけでつながる（Framerのレイアウトを縛らないため）。
// 演技の数値は辞典の各項目の params.default と同じ。px の値だけは見出しの大きさ（デモ比）に合わせて比例拡大して見せる。
// reduced-motion：見出しは動かず下線で反応するだけ。コンソールは即時表示・自動巡回しない。

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

type Ctx = { chars: HTMLElement[]; caret: HTMLElement | null; fontPx: number; ink: string; cleanups: (() => void)[] }
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
    "squash-stretch": ({ chars, fontPx }, v) => {
        const H = 0.22 * fontPx
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
    "bounce-in": ({ chars, fontPx }, v) => {
        const H = (v.height / 120) * 0.9 * fontPx
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
/* HeroTitle                                                           */
/* ------------------------------------------------------------------ */

interface TitleProps {
    text: string
    maxSize: number
    ink: string
    accent: string
    style?: CSSProperties
}

/**
 * Hero Title（演じる見出し）
 *
 * @framerIntrinsicWidth 1360
 * @framerIntrinsicHeight 150
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export function HeroTitle(props: TitleProps) {
    const { text = TITLE, maxSize = 130, ink = "#0A0A0A", accent = "#A5E02E" } = props
    const isStatic = useIsStaticRenderer()
    const chars = useMemo(() => Array.from(text), [text])
    const rootRef = useRef<HTMLDivElement>(null)
    const h1Ref = useRef<HTMLHeadingElement>(null)
    const charRefs = useRef<(HTMLSpanElement | null)[]>([])
    const caretRef = useRef<HTMLSpanElement>(null)
    const cleanups = useRef<(() => void)[]>([])
    const inView = useRef(true)
    const [mark, setMark] = useState(false) // reduced-motion 時の反応（下線）
    // 1文字の幅 ≒ 1em − 字詰め。幅いっぱいに収める cqi を文字数から出す
    const fit = 100 / (chars.length * 0.96 + 0.1)

    useEffect(() => {
        if (isStatic || !rootRef.current || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(([e]) => (inView.current = e.isIntersecting), { threshold: 0 })
        io.observe(rootRef.current)
        return () => io.disconnect()
    }, [isStatic])

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        let markT: ReturnType<typeof setTimeout> | undefined
        const stop = () => {
            const els = charRefs.current.filter(Boolean) as HTMLElement[]
            els.forEach((c) => { c.getAnimations().forEach((a) => a.cancel()); c.style.removeProperty("transform-origin") })
            caretRef.current?.getAnimations().forEach((a) => a.cancel())
            cleanups.current.forEach((f) => f())
            cleanups.current = []
        }
        const onHero = (ev: Event) => {
            const d = (ev as CustomEvent<HeroDetail>).detail
            if (!d || !inView.current) return
            const w = WORDS.find((x) => x.slug === d.slug) || WORDS.find((x) => x.word === d.word)
            if (!w) return
            if (reducedMotion()) {
                setMark(true)
                clearTimeout(markT)
                markT = setTimeout(() => setMark(false), 1400)
                return
            }
            const act = ACTS[w.slug]
            const h1 = h1Ref.current
            if (!act || !h1 || typeof h1.animate !== "function") return
            stop()
            act({
                chars: charRefs.current.filter(Boolean) as HTMLElement[],
                caret: caretRef.current,
                fontPx: parseFloat(getComputedStyle(h1).fontSize) || 100,
                ink,
                cleanups: cleanups.current,
            }, { ...defaults(w), ...(d.params || {}) })
        }
        window.addEventListener(EVT, onHero)
        return () => { window.removeEventListener(EVT, onHero); clearTimeout(markT); stop() }
    }, [isStatic, ink])

    return (
        <div ref={rootRef} style={{ width: "100%", containerType: "inline-size", ...props.style } as CSSProperties}>
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
        </div>
    )
}

addPropertyControls(HeroTitle, {
    text: { type: ControlType.String, title: "Text", defaultValue: TITLE },
    maxSize: { type: ControlType.Number, title: "Max size", defaultValue: 130, min: 32, max: 240, step: 1, unit: "px" },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#0A0A0A" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#A5E02E" },
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
 * Hero Console（擬態語→動き→プロンプト）
 *
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 360
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
    const [words, setWords] = useState<Word[]>(WORDS)
    const [idx, setIdx] = useState(0)
    const [values, setValues] = useState<Record<string, Record<string, number>>>(() => {
        const o: Record<string, Record<string, number>> = {}
        WORDS.forEach((w) => (o[w.slug] = defaults(w)))
        return o
    })
    const [auto, setAuto] = useState(true)
    const [inView, setInView] = useState(true)
    const [reduced, setReduced] = useState(false)
    const [ready, setReady] = useState(false) // マウント直後は見出しを一度読ませてから演じる
    const [typed, setTyped] = useState(Infinity)
    const [flash, setFlash] = useState("")
    const [tick, setTick] = useState(0) // 巡回の1拍（プログレス線の再生し直し用）
    const [narrow, setNarrow] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)
    const chipRefs = useRef<(HTMLButtonElement | null)[]>([])
    const flashT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    const w = words[idx]
    const v = values[w.slug] || defaults(w)
    const pBy = useMemo(() => Object.fromEntries(w.params.map((p) => [p.key, p])) as Record<string, Param>, [w])
    const main = pBy[w.main]
    const segs = useMemo(() => parse(w.lines), [w])

    // 画面外・タブ非表示では巡回しない
    useEffect(() => {
        if (isStatic || !rootRef.current || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 })
        io.observe(rootRef.current)
        return () => io.disconnect()
    }, [isStatic])
    useEffect(() => {
        if (isStatic || !rootRef.current || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(([e]) => setNarrow(e.contentRect.width < 520))
        ro.observe(rootRef.current)
        return () => ro.disconnect()
    }, [isStatic])

    useEffect(() => {
        if (isStatic) return
        setReduced(reducedMotion())
        const t = setTimeout(() => setReady(true), 700)
        return () => clearTimeout(t)
    }, [isStatic])

    // 辞典の実データで数値の範囲・初期値・項目名を合わせ直す（落ちても手持ちの値で動く）
    useEffect(() => {
        if (isStatic) return
        let alive = true
        Promise.all(WORDS.map((x) => fetch(`${base}/entry/${x.slug}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null))).then((list) => {
            if (!alive) return
            const next = WORDS.map((x, k) => {
                const j = list[k]
                if (!j || !Array.isArray(j.params)) return x
                const params = x.params.map((p) => {
                    const q = j.params.find((r: Param) => r.key === p.key)
                    return q ? { ...p, label: q.label ?? p.label, min: q.min, max: q.max, step: q.step, default: q.default } : p
                })
                return { ...x, nameJa: j.nameJa || x.nameJa, params }
            })
            setWords(next)
            setValues((old) => {
                const o = { ...old }
                next.forEach((x, k) => {
                    WORDS[k].params.forEach((p, n) => {
                        // まだ誰も触っていない値だけ、辞典の初期値に寄せる
                        if (o[x.slug] && o[x.slug][p.key] === p.default) o[x.slug] = { ...o[x.slug], [p.key]: x.params[n].default }
                    })
                })
                return o
            })
        })
        return () => { alive = false }
    }, [isStatic, base])

    const fire = (k: number, vals?: Record<string, number>) => {
        if (typeof window === "undefined") return
        const x = words[k]
        const detail: HeroDetail = { word: x.word, slug: x.slug, params: vals || values[x.slug] || defaults(x) }
        window.dispatchEvent(new CustomEvent(EVT, { detail }))
    }

    // 言葉が替わったら：見出しに演じさせ、プロンプトを打ち出し直す
    const playing = ready && inView
    const playRef = useRef({ idx: -1, tick: -1 })
    useEffect(() => {
        if (isStatic || !playing) return
        if (playRef.current.idx === idx && playRef.current.tick === tick) return
        const first = playRef.current.idx === -1
        playRef.current = { idx, tick }
        if (reduced) { if (!first) fire(idx); setTyped(Infinity); return }
        fire(idx)
        setTyped(0)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idx, tick, playing, reduced, isStatic])

    // 打ち出し：1文字 16ms（等幅の行が「書かれていく」速さ）
    const total = useMemo(() => segs.reduce((s, g) => s + (g.t === "x" ? g.text.length : fmt(pBy[g.key], v[g.key]).length + g.unit.length), 0), [segs, pBy, v])
    useEffect(() => {
        if (isStatic || typed >= total) return
        let raf = 0
        const t0 = performance.now() - typed * 16
        const step = (now: number) => {
            const n = Math.floor((now - t0) / 16)
            setTyped(n >= total ? Infinity : n)
            if (n < total) raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
        return () => cancelAnimationFrame(raf)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [typed === 0, idx, total, isStatic])

    // 自動巡回：触られるまで interval ごとに次の言葉へ
    useEffect(() => {
        if (isStatic || !auto || reduced || !playing) return
        const t = setTimeout(() => {
            setIdx((x) => (x + 1) % words.length)
            setTick((x) => x + 1)
        }, interval)
        return () => clearTimeout(t)
    }, [isStatic, auto, reduced, playing, idx, tick, interval, words.length])

    // 選択中のチップを横スクロールの中で見える位置へ（SP）
    useEffect(() => {
        const el = chipRefs.current[idx]
        const row = el?.parentElement
        if (!el || !row || row.scrollWidth <= row.clientWidth) return
        row.scrollTo({ left: el.offsetLeft - row.clientWidth / 2 + el.offsetWidth / 2, behavior: reduced ? "auto" : "smooth" })
    }, [idx, reduced])

    const choose = (k: number) => {
        setAuto(false)
        setIdx(k)
        setTick((x) => x + 1)
    }
    const onSlide = (val: number) => {
        setAuto(false)
        setValues((o) => ({ ...o, [w.slug]: { ...v, [w.main]: val } }))
        setFlash(w.main)
        clearTimeout(flashT.current)
        flashT.current = setTimeout(() => setFlash(""), 650)
    }
    const replay = () => fire(idx, v)

    // 打ち出し中の表示：segs を先頭から typed 文字ぶんだけ出す
    const renderSegs = (limit: number, ghost: boolean) => {
        let left = limit
        return segs.map((g, i) => {
            if (left <= 0) return null
            if (g.t === "x") {
                const s = g.text.slice(0, left)
                left -= g.text.length
                return <span key={i}>{s}</span>
            }
            const full = fmt(pBy[g.key], v[g.key]) + g.unit
            const s = full.slice(0, left)
            left -= full.length
            return <span key={i} className={ghost ? "mdh-dyn" : "mdh-dyn" + (flash === g.key ? " on" : "")}>{s}</span>
        })
    }
    const done = typed >= total
    const dim = "rgba(244,244,241,.56)"
    const line = "rgba(244,244,241,.14)"
    const pad = narrow ? 16 : 24
    const fill = main ? ((v[w.main] - main.min) / (main.max - main.min)) * 100 : 0

    return (
        <div ref={rootRef}
            onPointerDown={() => setAuto(false)}
            style={{ width: "100%", background: ink, color: paper, borderRadius: 10, overflow: "hidden", fontFamily: JP, position: "relative", ...props.style }}>
            <style dangerouslySetInnerHTML={{ __html: `
.mdh-chips{scrollbar-width:none;-webkit-overflow-scrolling:touch}
.mdh-chips::-webkit-scrollbar{display:none}
.mdh-chip{flex:none;height:34px;padding:0 15px;border-radius:100px;border:1px solid ${line};background:transparent;color:${paper};font-family:${JP};font-weight:700;font-size:14px;letter-spacing:.04em;cursor:pointer;transition:background .2s,border-color .2s,color .2s}
.mdh-chip:hover{border-color:rgba(244,244,241,.5)}
.mdh-chip[aria-pressed="true"]{background:${accent};border-color:${accent};color:${ink}}
.mdh-chip:focus-visible,.mdh-auto:focus-visible,.mdh-link:focus-visible{outline:2px solid ${accent};outline-offset:2px}
.mdh-auto{display:inline-flex;align-items:center;gap:8px;height:28px;padding:0 12px;border-radius:100px;border:1px solid ${line};background:transparent;color:${dim};font-family:${MONO};font-size:11px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}
.mdh-dyn{color:${accent};background:rgba(165,224,46,.14);border-radius:3px;padding:0 3px;transition:background .3s,color .3s}
.mdh-dyn.on{background:${accent};color:${ink};transition:none}
.mdh-caret{display:inline-block;width:.55em;height:1.1em;vertical-align:-.2em;margin-left:2px;background:${accent};animation:mdh-blink 1s steps(1,end) infinite}
@keyframes mdh-blink{50%{opacity:0}}
@keyframes mdh-bar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
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
@media (prefers-reduced-motion: reduce){.mdh-chip,.mdh-dyn{transition:none}.mdh-caret{animation:none}}
` }} />

            {/* 巡回の残り時間（触ると消える） */}
            <span aria-hidden="true" key={`bar${tick}`}
                style={{ position: "absolute", left: 0, top: 0, height: 2, width: "100%", background: accent, transformOrigin: "0 50%",
                    opacity: auto && !reduced && playing ? 1 : 0, transform: "scaleX(0)",
                    animation: auto && !reduced && playing ? `mdh-bar ${interval}ms linear forwards` : "none" }} />

            {/* ヘッダー */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: `12px ${pad}px`, borderBottom: `1px solid ${line}` }}>
                <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.06em", color: dim }}>
                    Words → Motion → Prompt
                </span>
                {!reduced ? (
                    <button className="mdh-auto" aria-pressed={auto} onClick={(e) => { e.stopPropagation(); if (!auto) setTick((x) => x + 1); setAuto(!auto) }}
                        onPointerDown={(e) => e.stopPropagation()}>
                        <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 6, background: auto ? accent : muted }} />
                        {auto ? "Auto" : "Paused"}
                    </button>
                ) : null}
            </div>

            {/* 擬態語のチップ */}
            <div className="mdh-chips" role="group" aria-label="擬態語を選ぶと、見出しがその動きを演じます"
                style={{ display: "flex", gap: 8, overflowX: "auto", padding: `16px ${pad}px 4px` }}>
                {words.map((x, k) => (
                    <button key={x.slug} ref={(el) => { chipRefs.current[k] = el }} className="mdh-chip" aria-pressed={k === idx}
                        onClick={() => choose(k)}>{x.word}</button>
                ))}
            </div>

            {/* プロンプトの要の行（打ち出し） */}
            <div style={{ padding: `14px ${pad}px 4px`, fontFamily: MONO, fontSize: narrow ? 13 : 14, lineHeight: 1.8, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                <div style={{ fontSize: 12, color: dim, marginBottom: 6, letterSpacing: "0.04em" }}>{`// ${w.slug}.md`}</div>
                <div style={{ display: "grid" }}>
                    {/* 全文ぶんの高さを先に確保して、打ち出し中にレイアウトを動かさない */}
                    <div aria-hidden="true" style={{ gridArea: "1 / 1", visibility: "hidden" }}>{renderSegs(Infinity, true)}</div>
                    <div aria-live="off" style={{ gridArea: "1 / 1" }}>
                        {renderSegs(done ? Infinity : typed, false)}
                        {!done ? <span className="mdh-caret" aria-hidden="true" /> : null}
                    </div>
                </div>
            </div>

            {/* 主パラメータのスライダー */}
            {main ? (
                <div style={{ padding: `10px ${pad}px 14px` }}>
                    <label style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, fontFamily: MONO, fontSize: 12, color: dim, letterSpacing: "0.02em" }}>
                        <span>{main.label}</span>
                        <span style={{ color: accent }}>{fmt(main, v[w.main])}</span>
                        <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>（離すと見出しがこの値で動きます）</span>
                    </label>
                    <input className="mdh-range" type="range" aria-label={`${w.nameJa}：${main.label}`}
                        min={main.min} max={main.max} step={main.step} value={v[w.main]}
                        style={{ ["--fill" as string]: `${fill}%` } as CSSProperties}
                        onChange={(e) => onSlide(parseFloat(e.target.value))}
                        onPointerUp={replay}
                        onKeyUp={(e) => { if (e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End" || e.key.startsWith("Page")) replay() }} />
                </div>
            ) : null}

            {/* 項目名と詳細へのリンク */}
            {/* SP：リンクを左に置く（右下の Made in Framer バッジ 約150×40・右下12px に隠れていた＝独立レビュー3周目） */}
            <div style={{ display: "flex", flexDirection: narrow ? "column" : "row", alignItems: narrow ? "flex-start" : "center", justifyContent: "space-between", gap: narrow ? 6 : 16, flexWrap: "wrap", padding: `14px ${pad}px ${narrow ? 10 : 16}px`, borderTop: `1px solid ${line}` }}>
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
 * Hero Live（見出し＋コンソール）
 *
 * @framerIntrinsicWidth 1360
 * @framerIntrinsicHeight 560
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function HeroLive(props: LiveProps) {
    const { maxSize = 130, ink = "#0A0A0A", accent = "#A5E02E" } = props
    return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24, ...props.style }}>
            <HeroTitle text={TITLE} maxSize={maxSize} ink={ink} accent={accent} />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ width: "100%", maxWidth: 640 }}>
                    <HeroConsole base={props.base} interval={props.interval} ink={ink} paper={props.paper} accent={accent} muted={props.muted} />
                </div>
            </div>
        </div>
    )
}

addPropertyControls(HeroLive, {
    maxSize: { type: ControlType.Number, title: "Max size", defaultValue: 130, min: 32, max: 240, step: 1, unit: "px" },
    interval: { type: ControlType.Number, title: "Interval", defaultValue: 4600, min: 2500, max: 12000, step: 100, unit: "ms" },
    base: { type: ControlType.String, title: "Base", defaultValue: "https://ryota4100221-cmyk.github.io/motion-dict" },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#0A0A0A" },
    paper: { type: ControlType.Color, title: "Paper", defaultValue: "#F4F4F1" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#A5E02E" },
    muted: { type: ControlType.Color, title: "Muted", defaultValue: "#6B6B66" },
})
