import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
} from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

// 詳細ページの中核：「触って数値を決める → そのまま渡せる指示文を持ち帰る」。
// デモは GitHub Pages の裸デモ(/demo/<slug>/)を iframe で埋め、スライダーの値を
// postMessage {type:"md:params"} で流す。指示文の {{key}} はその場で値に置き換わる。
// 雛形とスライダー定義は CMS のフィールドにバインド（＝SSRで本文がHTMLに出る＝SEO）。
// バインドが空のとき（キャンバス・旧項目）は GH の entry/<slug>.json から取る。
//
// 2026-10-25（Awwwards 1周目・遷移と仕上げ）
//  ・posterImage（CMS の Poster をバインド）を SSR でデモ枠に描く。一覧カードの板（CardMorph）が
//    伸び切った位置にそのままポスターがある＝着地の1コマ目から絵が途切れない。
//    旧版は entry JSON を fetch してから poster を出していたので、着地の数百ms デモ枠が真っ黒だった
//  ・レイアウト（2列／1列）を JS の幅計測（初期値860）からコンテナクエリに移した。
//    旧版は SSR〜計測までの1コマ目が「1列・全幅」で描かれ、着地直後に2列へ組み替わるのが見えていた
//  ・REC→ライブはクロスフェードをやめて一瞬で切る（重なって文字が二重に見えた）。ライブが描けてから切る
//  ・SP はデモ枠を上に貼り付け、スライダーだけが流れる（動かした結果が画面外にあった）
//  ・固定バーを Made in Framer バッジ（右下・約150×40）と重ならない位置へ

interface Param {
    key: string
    label: string
    min: number
    max: number
    step: number
    default: number
    desc: string
    options?: string[]
}

interface Props {
    slug: string
    template: string
    paramsJson: string
    base: string
    accent: string
    ink: string
    paper: string
    muted: string
    // CMS の Poster（ControlType.Image は文字列、ResponsiveImage は {src}）
    posterImage?: string | { src?: string }
    style?: CSSProperties
}

const MONO =
    '"Geist Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
const JP = '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif'

const TOKEN_RE = /(\{\{\w+\}\}(?:px|ms|s|%|deg)?)/
const TOKEN_PARSE_RE = /^\{\{(\w+)\}\}(px|ms|s|%|deg)?$/

function decimals(step: number) {
    const s = String(step)
    const i = s.indexOf(".")
    return i === -1 ? 0 : s.length - i - 1
}
function fmt(p: Param, v: number) {
    if (p.options) return p.options[Math.round(v)] ?? String(v)
    const d = decimals(p.step)
    return d === 0 ? String(Math.round(v)) : v.toFixed(d)
}
// "strength(吸い付きの強さ)" → ["strength", "吸い付きの強さ"]
function splitLabel(label: string): [string, string] {
    const m = label.match(/^([^(（]+)[(（](.*)[)）]\s*$/)
    return m ? [m[1].trim(), m[2].trim()] : [label, ""]
}
function slugFromLocation(): string {
    if (typeof window === "undefined") return ""
    const m = window.location.pathname.match(/\/entries\/([^/?#]+)/)
    return m ? decodeURIComponent(m[1]) : ""
}
function imgSrc(v: Props["posterImage"]): string {
    if (!v) return ""
    return typeof v === "string" ? v : v.src || ""
}
// 一覧カードから来たか（CardMorph が書く。2秒以内・同じ slug のときだけ「つながった着地」とみなす）
const MORPH_KEY = "md-morph"
// 着地位置の実測を CardMorph に返す（次に同じ項目へ飛ぶとき、板の行き先がぴったりになる）
const DEMO_Y_KEY = "md-demo-y"
function readArrival(slug: string): boolean {
    if (typeof window === "undefined" || !slug) return false
    try {
        const r = JSON.parse(sessionStorage.getItem(MORPH_KEY) || "null")
        sessionStorage.removeItem(MORPH_KEY)
        return !!r && r.slug === slug && Date.now() - r.t < 2000
    } catch {
        return false
    }
}

function parseParams(json: string): Param[] | null {
    if (!json) return null
    try {
        const v = JSON.parse(json)
        return Array.isArray(v) ? v : null
    } catch {
        return null
    }
}

/**
 * Entry Lab
 *
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 900
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function EntryLab(props: Props) {
    const {
        base = "https://ryota4100221-cmyk.github.io/motion-dict",
        accent = "#A5E02E",
        ink = "#0A0A0A",
        paper = "#F4F4F1",
        muted = "#6B6B66",
    } = props
    const isStatic = useIsStaticRenderer()

    const [slug, setSlug] = useState(props.slug || "")
    const [template, setTemplate] = useState(props.template || "")
    const [params, setParams] = useState<Param[]>(() => parseParams(props.paramsJson) || [])
    const [values, setValues] = useState<Record<string, number>>(() =>
        Object.fromEntries((parseParams(props.paramsJson) || []).map((p) => [p.key, p.default]))
    )
    const [copied, setCopied] = useState<"idle" | "ok" | "ng">("idle")
    // 出力先：プロンプトの頭に「何で書いてほしいか」を1行足す（AIに渡す最後の1歩。未指定だとAIが勝手に選ぶ）
    const TARGETS: { key: string; label: string; line: string }[] = [
        { key: "", label: "出力先：指定なし", line: "" },
        { key: "css", label: "CSS + JS", line: "実装は素のHTML / CSS / JavaScript（ライブラリなし）で書いてください。" },
        { key: "gsap", label: "GSAP", line: "実装は GSAP（必要なら ScrollTrigger）で書いてください。" },
        { key: "react", label: "React + Motion", line: "実装は React + Motion（旧 Framer Motion）のコンポーネントとして書いてください。" },
        { key: "framer", label: "Framer", line: "実装は Framer のコードコンポーネント（addPropertyControls で数値を調整可能に）として書いてください。" },
    ]
    const [target, setTarget] = useState("")
    const [flashKey, setFlashKey] = useState<string>("")
    const [frameReady, setFrameReady] = useState(false)
    const frameRef = useRef<HTMLIFrameElement>(null)
    const textRef = useRef<HTMLDivElement>(null)
    // 幅による組み替え（2列／1列／SP）は CSS のコンテナクエリで行う（JS で測ると1コマ目が仮の幅で描かれる）
    const rootRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const demoRef = useRef<HTMLDivElement>(null)
    const promptCopyRef = useRef<HTMLButtonElement>(null)
    const [labInView, setLabInView] = useState(false)
    const [promptHeadBelow, setPromptHeadBelow] = useState(false)
    const urlRead = useRef(false)
    // 触る前は録画のループを重ねて見せる（ライブデモは触るまで止まっていて、何の動きか伝わらなかった）。
    // ステージに触れる／スライダーを動かした瞬間にライブへ切り替え、以後は戻さない。
    const [live, setLive] = useState(false)
    // 録画の場所は命名規則で先に決める（v2/videos/<slug>.mp4・v2/posters/<slug>.jpg・196件すべて一致を確認済み）。
    // entry JSON が届いたら上書き。fetch を待たずに再生を始められる
    const [rec, setRec] = useState<{ video: string; poster: string; posterAt: number } | null>(null)
    const [reducedM, setReducedM] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [arrived, setArrived] = useState(false)
    // 録画の1コマ目が実際に画面に出たか。出るまで video は透明（下のポスターが見えている）＝二重像なしで差し替わる
    const [vidOn, setVidOn] = useState(false)
    const recRef = useRef<HTMLVideoElement>(null)
    const firstLive = useRef(true)
    useEffect(() => {
        const v = recRef.current
        if (!v) return
        if (live) v.pause()
        else if (!firstLive.current) {
            try { v.currentTime = rec?.posterAt || 0 } catch {}
            v.play().catch(() => {})
        }
        firstLive.current = false
    }, [live])
    // 離れて5秒触られなければ録画に戻す（止まった画面のまま残っていた）。値を変えている間は戻さない（録画は初期値なので）
    const idleT = useRef<ReturnType<typeof setTimeout> | null>(null)
    const leaveStage = () => {
        if (idleT.current) clearTimeout(idleT.current)
        idleT.current = setTimeout(() => {
            setValues((cur) => {
                if (params.every((p) => cur[p.key] === p.default)) setLive(false)
                return cur
            })
        }, 5000)
    }
    const enterStage = () => { if (idleT.current) clearTimeout(idleT.current); setLive(true) }

    // slug：バインドが無ければURLから
    useEffect(() => {
        if (props.slug) return
        const s = slugFromLocation()
        if (s) setSlug(s)
    }, [props.slug])

    // 録画（重ねるループ）の場所。まず命名規則で決めて再生を始め、項目JSONで確かめる
    useEffect(() => {
        if (isStatic || !slug) return
        setMounted(true)
        setReducedM(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        setArrived(readArrival(slug))
        setRec((cur) => cur || { video: `${base}/v2/videos/${slug}.mp4`, poster: `${base}/v2/posters/${slug}.jpg`, posterAt: 0 })
        fetch(`${base}/entry/${slug}.json`)
            .then((r) => r.json())
            .then((d) => d && d.video && setRec((cur) =>
                cur && cur.video === d.video && cur.poster === d.poster && cur.posterAt === (d.posterAt || 0)
                    ? cur
                    : { video: d.video, poster: d.poster, posterAt: d.posterAt || 0 }))
            .catch(() => {})
    }, [slug, isStatic, base])

    // 着地位置を記録して CardMorph に返す（見出しと説明文の行数で縦位置が項目ごとに違うため）
    useEffect(() => {
        if (isStatic || !slug || typeof window === "undefined") return
        let alive = true
        const record = () => {
            const el = stageRef.current
            if (!alive || !el) return
            const vw = document.documentElement.clientWidth
            const bp = vw >= 1200 ? "d" : vw >= 810 ? "t" : "p"
            const y = Math.round(el.getBoundingClientRect().top + window.scrollY)
            try {
                const all = JSON.parse(localStorage.getItem(DEMO_Y_KEY) || "{}")
                all[slug] = { bp, vw, y }
                localStorage.setItem(DEMO_Y_KEY, JSON.stringify(all))
            } catch {}
        }
        const fonts = (document as any).fonts
        ;(fonts && fonts.ready ? fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(() => requestAnimationFrame(record)))
        return () => { alive = false }
    }, [slug, isStatic])

    // SP：デモ枠を画面上端に貼り付ける。見出し行（01 Demo …）は流し、枠の上に8pxだけ生成りを残す
    useEffect(() => {
        if (isStatic || typeof ResizeObserver === "undefined") return
        const d = demoRef.current
        const head = d?.firstElementChild as HTMLElement | null
        if (!d || !head) return
        const set = () => d.style.setProperty("--mdlab-stick", `${-(head.offsetHeight + 14 - 8)}px`)
        const ro = new ResizeObserver(set)
        ro.observe(head)
        set()
        return () => ro.disconnect()
    }, [isStatic])

    // バインドが空なら GH の項目JSONで補う
    useEffect(() => {
        if (isStatic || !slug) return
        if (template && params.length) return
        let alive = true
        fetch(`${base}/entry/${slug}.json`)
            .then((r) => r.json())
            .then((d) => {
                if (!alive || !d) return
                startTransition(() => {
                    if (!template) setTemplate(d.promptTemplate || "")
                    if (!params.length && Array.isArray(d.params)) {
                        setParams(d.params)
                        setValues(Object.fromEntries(d.params.map((p: Param) => [p.key, p.default])))
                    }
                })
            })
            .catch(() => {})
        return () => {
            alive = false
        }
    }, [slug, isStatic, base])

    // ラボが画面にあり、かつプロンプトの Copy ボタンがまだ「まるごと見える位置」に来ていない間だけ、下に「変えた値＋Copy」を貼る。
    // 画面下端64pxの帯（Made in Framer バッジ＝下から約20〜58px）にかかっている間も「まだ下」とみなす
    // ＝バッジに隠れた Copy しか無い瞬間を作らない（旧版はプロンプトが1pxでも見えたらバーを消していた）。
    // 見出し行ではなくボタンそのものを見る（SPは見出し行が折り返してボタンが下にずれる）
    useEffect(() => {
        if (isStatic || typeof IntersectionObserver === "undefined") return
        const a = rootRef.current, b = promptCopyRef.current
        if (!a || !b) return
        const ioA = new IntersectionObserver((es) => {
            for (const e of es) setLabInView(e.isIntersecting)
        }, { threshold: 0 })
        const ioB = new IntersectionObserver((es) => {
            for (const e of es) setPromptHeadBelow(e.intersectionRatio < 1 && e.boundingClientRect.top > 0)
        }, { threshold: [0, 1], rootMargin: "0px 0px -64px 0px" })
        ioA.observe(a)
        ioB.observe(b)
        return () => { ioA.disconnect(); ioB.disconnect() }
    }, [isStatic, template])

    // 決めた値をURLに持つ（?strength=0.2）＝共有・再現できる。初回はURLから読む
    useEffect(() => {
        if (isStatic || typeof window === "undefined" || !params.length) return
        if (!urlRead.current) {
            urlRead.current = true
            const sp = new URLSearchParams(window.location.search)
            const v: Record<string, number> = {}
            for (const p of params) {
                const raw = sp.get(p.key)
                if (raw == null) continue
                const n = p.options ? p.options.indexOf(raw) : Number(raw)
                if (Number.isFinite(n) && n >= p.min && n <= p.max) v[p.key] = n
            }
            if (Object.keys(v).length) setValues((prev) => ({ ...prev, ...v }))
            return
        }
        const t = setTimeout(() => {
            const u = new URL(window.location.href)
            for (const p of params) {
                const v = values[p.key]
                if (v === p.default || v == null) u.searchParams.delete(p.key)
                else u.searchParams.set(p.key, fmt(p, v))
            }
            window.history.replaceState(window.history.state, "", u.toString())
        }, 250)
        return () => clearTimeout(t)
    }, [values, params, isStatic])

    // iframe の準備完了を受けて現在値を送る
    useEffect(() => {
        if (isStatic) return
        const onMsg = (ev: MessageEvent) => {
            if (ev.source !== frameRef.current?.contentWindow) return
            if (ev.data && ev.data.type === "md:ready") setFrameReady(true)
            if (ev.data && ev.data.type === "md:interact") setLive(true)
        }
        window.addEventListener("message", onMsg)
        return () => window.removeEventListener("message", onMsg)
    }, [isStatic])

    const send = useCallback((v: Record<string, number>, replay = false) => {
        const w = frameRef.current?.contentWindow
        if (w) w.postMessage({ type: "md:params", values: v, replay }, "*")
    }, [])

    useEffect(() => {
        if (frameReady) send(values)
    }, [frameReady, values, send])

    const setOne = (key: string, v: number) => {
        setValues((prev) => {
            const next = { ...prev, [key]: v }
            send(next, true) // 値が落ち着いたらデモを頭から再生し直す（StageBare 側で350ms待つ）
            return next
        })
        setFlashKey(key)
        setLive(true)
    }
    useEffect(() => {
        if (!flashKey) return
        const t = setTimeout(() => setFlashKey(""), 260)
        return () => clearTimeout(t)
    }, [flashKey, values])

    const reset = () => {
        const d = Object.fromEntries(params.map((p) => [p.key, p.default]))
        setValues(d)
        send(d, true)
    }
    const dirty = params.some((p) => values[p.key] !== p.default)

    const segments = useMemo(
        () =>
            template
                .split(TOKEN_RE)
                .filter((x) => x !== "")
                .map((part) => {
                    const m = part.match(TOKEN_PARSE_RE)
                    return m
                        ? { t: "p" as const, key: m[1], unit: m[2] || "" }
                        : { t: "x" as const, text: part }
                }),
        [template]
    )
    const pByKey = useMemo(() => Object.fromEntries(params.map((p) => [p.key, p])), [params])

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(textRef.current?.innerText ?? "")
            setCopied("ok")
        } catch {
            setCopied("ng")
        }
        setTimeout(() => setCopied("idle"), 1600)
    }

    const label: CSSProperties = {
        fontFamily: MONO,
        fontSize: 12,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: ink,
        display: "flex",
        alignItems: "center",
        gap: 10,
    }
    const num: CSSProperties = { color: muted, fontVariantNumeric: "tabular-nums" }
    const jpSub: CSSProperties = { color: muted, textTransform: "none", letterSpacing: "0.02em", fontFamily: JP }
    const btn = (primary: boolean): CSSProperties => ({
        fontFamily: MONO,
        fontSize: 12,
        letterSpacing: "0.06em",
        height: 40,
        padding: "0 16px",
        borderRadius: 100,
        border: primary ? `1px solid ${accent}` : `1px solid rgba(233,233,227,0.28)`,
        background: primary ? accent : "transparent",
        color: primary ? ink : "#E9E9E3",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        whiteSpace: "nowrap",
    })
    const demoSrc = slug ? `${base}/stage/${slug}/` : ""
    const changed = params.filter((p) => values[p.key] !== p.default)
    const copyLabel = copied === "idle" ? "Copy prompt" : copied === "ok" ? "Copied ✓" : "Copy failed"
    const posterSrc = imgSrc(props.posterImage) || rec?.poster || ""
    // 録画を外すのは「ライブにする」かつ「ライブが描けている」とき。描けていない間に外すと黒い枠が出る
    const recOff = live && frameReady
    // カードから来た直後は、録画の1コマ目が出るまで iframe を読まない（帯域を録画に回す＝着地が静か）。最長1.5秒
    const [frameGo, setFrameGo] = useState(false)
    useEffect(() => {
        if (!mounted) return
        if (!arrived || vidOn || reducedM) { setFrameGo(true); return }
        const t = setTimeout(() => setFrameGo(true), 1500)
        return () => clearTimeout(t)
    }, [mounted, arrived, vidOn, reducedM])
    const onVideoPlaying = () => {
        const v = recRef.current as any
        // 実際にコマが画面に出てから不透明にする（playing の時点ではまだ前のコマのことがある）
        if (v && typeof v.requestVideoFrameCallback === "function") v.requestVideoFrameCallback(() => setVidOn(true))
        else requestAnimationFrame(() => setVidOn(true))
    }

    const demo = (
        <div ref={demoRef} className="mdlab-demo" style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <div style={{ ...label, justifyContent: "space-between", flexWrap: "wrap", rowGap: 8 }}>
                <h2 style={{ display: "flex", gap: 10, alignItems: "center", margin: 0, font: "inherit", letterSpacing: "inherit" }}>
                    <span style={num}>01</span>
                    <span>Demo</span>
                    <span style={{ ...jpSub, whiteSpace: "nowrap" }}>触って、数値を決める</span>
                </h2>
                <span style={{ display: "flex", gap: 16, alignItems: "center", textTransform: "none", whiteSpace: "nowrap" }}>
                    {demoSrc ? (
                        <button
                            className="mdlab-link"
                            onClick={() => { setLive(true); frameRef.current?.contentWindow?.postMessage({ type: "md:demo" }, "*") }}
                            style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", font: "inherit", color: ink }}
                        >
                            ▶ 動きを再生
                        </button>
                    ) : null}
                    {demoSrc ? (
                        <a href={demoSrc} target="_blank" rel="noopener" className="mdlab-link" style={{ color: muted, textDecoration: "none" }}>
                            全画面で開く ↗
                        </a>
                    ) : null}
                </span>
            </div>
            <div
                ref={stageRef}
                style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: ink, borderRadius: 10, overflow: "hidden" }}
                onPointerEnter={enterStage}
                onPointerLeave={leaveStage}
                onPointerDown={enterStage}
                onFocus={() => setLive(true)}
            >
                {/* 録画の層：ポスター（SSR）→ 録画（1コマ目が出たら不透明）。ライブへは一瞬で切る（重ねて溶かさない） */}
                {posterSrc || rec ? (
                    <div className={"mdlab-rec" + (recOff ? " off" : "")} aria-hidden="true">
                        {posterSrc ? <img src={posterSrc} alt="" decoding="sync" fetchPriority="high" className="mdlab-poster" /> : null}
                        {mounted && rec && !reducedM ? (
                            <video ref={recRef} src={rec.video} muted loop playsInline autoPlay preload="auto"
                                className={"mdlab-video" + (vidOn ? " on" : "")}
                                onPlaying={onVideoPlaying}
                                onLoadedMetadata={(e) => {
                                    const at = rec.posterAt || 0
                                    if (at) { try { e.currentTarget.currentTime = at } catch {} }
                                }} />
                        ) : null}
                        <span className={"mdlab-recchip" + (vidOn || reducedM ? " on" : "")}>
                            <span className="mdlab-n">REC · タップでライブ</span>
                            <span className="mdlab-w">REC — 触るとライブに切り替わる</span>
                        </span>
                    </div>
                ) : null}
                {!isStatic && demoSrc && (frameGo || live) ? (
                    <iframe
                        ref={frameRef}
                        src={demoSrc}
                        title="ライブデモ"
                        className="mdlab-frame"
                        loading="lazy"
                        onLoad={() => setTimeout(() => { send(values); setFrameReady(true) }, 120)}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, display: "block" }}
                    />
                ) : null}
            </div>
        </div>
    )

    const controls = params.length ? (
        <div className={"mdlab-ctl" + (params.length > 1 ? " multi" : "")}>
            {params.map((p) => {
                const [k, jp] = splitLabel(p.label)
                const v = values[p.key] ?? p.default
                const fill = p.max > p.min ? ((v - p.min) / (p.max - p.min)) * 100 : 0
                const on = v !== p.default
                return (
                    <div key={p.key} style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                            <label htmlFor={"mdlab-" + p.key} style={{ display: "flex", gap: 8, alignItems: "baseline", minWidth: 0, flexWrap: "wrap" }}>
                                <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 500 }}>{k}</span>
                                <span style={{ fontSize: 13, color: muted }}>{jp}</span>
                            </label>
                            <span
                                style={{
                                    fontFamily: MONO, fontSize: 14, fontVariantNumeric: "tabular-nums",
                                    background: on ? accent : "transparent",
                                    border: `1px solid ${on ? accent : "rgba(10,10,10,.18)"}`,
                                    borderRadius: 4, padding: "1px 7px", transition: "background .2s", whiteSpace: "nowrap",
                                }}
                            >
                                {fmt(p, v)}
                            </span>
                        </div>
                        {p.options ? (
                            <div role="radiogroup" aria-label={k} style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {p.options.map((o, i) => {
                                    const sel = Math.round(v) === i
                                    return (
                                        <button
                                            key={o}
                                            className="mdlab-opt"
                                            role="radio"
                                            aria-checked={sel}
                                            onClick={() => setOne(p.key, i)}
                                            style={{
                                                fontFamily: MONO, fontSize: 13, minHeight: 40, padding: "0 14px", borderRadius: 100,
                                                border: `1px solid ${sel ? ink : "rgba(10,10,10,.18)"}`,
                                                background: sel ? ink : "transparent", color: sel ? paper : ink, cursor: "pointer",
                                            }}
                                        >
                                            {o}
                                        </button>
                                    )
                                })}
                            </div>
                        ) : (
                            <input
                                id={"mdlab-" + p.key}
                                className="mdlab-range"
                                type="range"
                                min={p.min}
                                max={p.max}
                                step={p.step}
                                value={v}
                                onChange={(e) => setOne(p.key, parseFloat(e.target.value))}
                                style={{ ["--fill" as any]: `${fill}%` }}
                            />
                        )}
                        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "#45453F" }}>{p.desc}</p>
                    </div>
                )
            })}
        </div>
    ) : null

    const prompt = (
        <div className="mdlab-prompt" style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <h2 style={{ ...label, margin: 0, fontWeight: 400 }}>
                <span style={num}>02</span>
                <span>Prompt</span>
                <span style={jpSub}>数値はスライダーと連動</span>
            </h2>
            <div style={{ background: ink, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px var(--mdlab-pad)", borderBottom: "1px solid rgba(233,233,227,0.12)" }}>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: "rgba(233,233,227,.55)", letterSpacing: "0.06em" }}>
                        {changed.length ? `${changed.length} value${changed.length > 1 ? "s" : ""} tuned` : "prompt.md"}
                    </span>
                    <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <select className="mdlab-target" aria-label="プロンプトの出力先" value={target} onChange={(e) => setTarget(e.target.value)}>
                            {TARGETS.map((t) => (
                                <option key={t.key} value={t.key}>{t.label}</option>
                            ))}
                        </select>
                        {changed.length ? (
                            <button className="mdlab-btn" onClick={reset} style={btn(false)}>初期値に戻す</button>
                        ) : null}
                        <button ref={promptCopyRef} className="mdlab-btn" onClick={copy} style={btn(true)} aria-live="polite">{copyLabel}</button>
                    </span>
                </div>
                <div
                    ref={textRef}
                    className="mdlab-ptext"
                    style={{
                        padding: "var(--mdlab-pad)",
                        fontFamily: MONO,
                        lineHeight: 1.8,
                        color: "#E9E9E3",
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                    }}
                >
                    {target ? <span className="mdlab-dyn">{TARGETS.find((t) => t.key === target)?.line + "\n\n"}</span> : null}
                    {segments.map((s, i) =>
                        s.t === "x" ? (
                            <span key={i}>{s.text}</span>
                        ) : (
                            <span key={i} className={"mdlab-dyn" + (flashKey === s.key ? " on" : "")}>
                                {pByKey[s.key] ? fmt(pByKey[s.key], values[s.key] ?? pByKey[s.key].default) : `{{${s.key}}}`}
                                {s.unit}
                            </span>
                        )
                    )}
                </div>
            </div>
        </div>
    )

    // プロンプトの Copy が見えていない間は、下に「変えた値＋Copy」を出す（PCでも1画面目にCopyが無かった）
    const showBar = !isStatic && labInView && promptHeadBelow && template !== ""

    return (
        <div ref={rootRef} style={{ width: "100%", color: ink, fontFamily: JP, ...props.style }}>
            <style>{`
.mdlab-range{-webkit-appearance:none;appearance:none;width:100%;height:32px;background:transparent;margin:0;cursor:pointer}
.mdlab-range:focus{outline:none}
.mdlab-range:focus-visible{outline:2px solid ${accent};outline-offset:2px;border-radius:4px}
.mdlab-range::-webkit-slider-runnable-track{height:2px;background:linear-gradient(to right, ${ink} 0, ${ink} var(--fill), rgba(10,10,10,.16) var(--fill))}
.mdlab-range::-moz-range-track{height:2px;background:rgba(10,10,10,.16)}
.mdlab-range::-moz-range-progress{height:2px;background:${ink}}
.mdlab-range::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:${accent};border:2px solid ${ink};margin-top:-9px;transition:transform .15s}
.mdlab-range::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:${accent};border:2px solid ${ink}}
.mdlab-range:active::-webkit-slider-thumb{transform:scale(1.18)}
.mdlab-opt:focus-visible,.mdlab-btn:focus-visible,.mdlab-link:focus-visible{outline:2px solid ${accent};outline-offset:2px}
.mdlab-link:hover{color:${ink}!important}
.mdlab-frame:focus-visible{outline:2px solid ${accent};outline-offset:2px}
.mdlab-target{appearance:none;-webkit-appearance:none;font-family:${MONO};font-size:12px;height:32px;padding:0 28px 0 12px;border-radius:100px;border:1px solid rgba(233,233,227,.28);background:transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23E9E9E3' fill='none'/%3E%3C/svg%3E") no-repeat right 11px center;color:#E9E9E3;cursor:pointer}
.mdlab-target:focus-visible{outline:2px solid ${accent};outline-offset:2px}
.mdlab-target option{color:#0A0A0A}
.mdlab-dyn{color:${accent};background:rgba(165,224,46,.12);border-radius:3px;padding:0 3px;transition:background .25s}
.mdlab-dyn.on{background:rgba(165,224,46,.42)}
.mdlab-rec{position:absolute;inset:0;z-index:2;pointer-events:none}
.mdlab-rec.off{visibility:hidden}
.mdlab-poster,.mdlab-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.mdlab-video{opacity:0}
.mdlab-video.on{opacity:1}
.mdlab-recchip{position:absolute;right:10px;top:10px;font-family:${MONO};font-size:11px;letter-spacing:.04em;color:#E9E9E3;background:rgba(10,10,10,.72);padding:6px 10px;border-radius:100px;backdrop-filter:blur(6px);opacity:0;transition:opacity .3s}
.mdlab-recchip.on{opacity:1}
.mdlab-wrap{container-type:inline-size;--mdlab-pad:22px}
.mdlab-grid{display:flex;flex-direction:column;gap:48px}
.mdlab-a{display:flex;flex-direction:column;gap:24px}
.mdlab-ctl{display:grid;grid-template-columns:1fr;column-gap:36px;row-gap:26px}
.mdlab-ptext{font-size:14px}
.mdlab-n{display:none}
@container (min-width: 640px) and (max-width: 979.98px){.mdlab-ctl.multi{grid-template-columns:repeat(2,minmax(0,1fr))}}
@container (min-width: 980px){
.mdlab-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);grid-template-rows:auto 1fr;column-gap:40px;row-gap:0;align-items:start}
.mdlab-a{display:contents}
.mdlab-demo{grid-column:1;grid-row:1 / span 2;position:sticky;top:24px}
.mdlab-ctl{grid-column:2;grid-row:1;padding-top:30px;row-gap:22px}
.mdlab-prompt{grid-column:2;grid-row:2;padding-top:40px}
.mdlab-a:not(:has(.mdlab-ctl))+.mdlab-prompt{padding-top:30px}
.mdlab-ptext{font-size:13px;max-height:520px;overflow-y:auto}
}
@container (max-width: 639.98px){
.mdlab-wrap{--mdlab-pad:16px}
.mdlab-grid{gap:40px}
.mdlab-a{gap:12px}
.mdlab-ptext{font-size:13px}
.mdlab-n{display:inline}.mdlab-w{display:none}
.mdlab-demo{position:sticky;top:var(--mdlab-stick,-36px);z-index:4;background:${paper};padding-bottom:12px}
}
.mdlab-bar{position:fixed;left:12px;right:12px;bottom:calc(68px + env(safe-area-inset-bottom, 0px));z-index:20;display:flex;align-items:center;gap:10px;padding:8px 8px 8px 16px;border-radius:100px;background:${ink};color:#E9E9E3;box-shadow:0 10px 30px rgba(0,0,0,.25);transform:translateY(0);transition:transform .25s cubic-bezier(.2,.7,.2,1),opacity .25s}
.mdlab-bar.off{transform:translateY(calc(100% + 80px));opacity:0;pointer-events:none}
@media (min-width: 640px){.mdlab-bar{left:24px;right:24px;bottom:20px;max-width:640px;margin:0 auto}}
@media (min-width: 640px) and (max-width: 1023.98px){.mdlab-bar{right:184px}}
@media (prefers-reduced-motion: reduce){.mdlab-dyn,.mdlab-bar,.mdlab-recchip{transition:none}}
`}</style>
            {/* 1つの DOM を幅で組み替える（≥980 = デモ左・操作右の2列／640〜979 = 1列・スライダー2列／<640 = SP・デモ貼り付け） */}
            <div className="mdlab-wrap">
                <div className="mdlab-grid">
                    <div className="mdlab-a">
                        {demo}
                        {controls}
                    </div>
                    {prompt}
                </div>
            </div>
            {!isStatic ? (
                <div className={"mdlab-bar" + (showBar ? "" : " off")} aria-hidden={!showBar}>
                    <span style={{ flex: 1, minWidth: 0, fontFamily: MONO, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {changed.length
                            ? changed.map((p) => `${splitLabel(p.label)[0]} ${fmt(p, values[p.key])}`).join(" · ")
                            : "初期値のプロンプト"}
                    </span>
                    <button className="mdlab-btn" onClick={copy} style={btn(true)} tabIndex={showBar ? 0 : -1}>{copyLabel}</button>
                </div>
            ) : null}
        </div>
    )
}

addPropertyControls(EntryLab, {
    slug: { type: ControlType.String, title: "Slug", defaultValue: "" },
    template: { type: ControlType.String, title: "Template", displayTextArea: true, defaultValue: "" },
    paramsJson: { type: ControlType.String, title: "Params JSON", displayTextArea: true, defaultValue: "" },
    base: {
        type: ControlType.String,
        title: "Base",
        defaultValue: "https://ryota4100221-cmyk.github.io/motion-dict",
    },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#A5E02E" },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#0A0A0A" },
    paper: { type: ControlType.Color, title: "Paper", defaultValue: "#F4F4F1" },
    muted: { type: ControlType.Color, title: "Muted", defaultValue: "#6B6B66" },
    posterImage: { type: ControlType.Image, title: "Poster" },
})
