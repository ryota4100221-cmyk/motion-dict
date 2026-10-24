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
    const [flashKey, setFlashKey] = useState<string>("")
    const [frameReady, setFrameReady] = useState(false)
    const frameRef = useRef<HTMLIFrameElement>(null)
    const textRef = useRef<HTMLDivElement>(null)
    const [w, setW] = useState(860)
    const narrow = w < 640
    const wide = w >= 980
    const rootRef = useRef<HTMLDivElement>(null)
    const promptRef = useRef<HTMLDivElement>(null)
    const [labInView, setLabInView] = useState(false)
    const [promptInView, setPromptInView] = useState(false)
    const urlRead = useRef(false)
    // 触る前は録画のループを重ねて見せる（ライブデモは触るまで止まっていて、何の動きか伝わらなかった）。
    // ステージに触れる／スライダーを動かした瞬間にライブへ切り替え、以後は戻さない。
    const [live, setLive] = useState(false)
    const [rec, setRec] = useState<{ video: string; poster: string; posterAt: number } | null>(null)
    const [reducedM, setReducedM] = useState(false)
    const recRef = useRef<HTMLVideoElement>(null)
    useEffect(() => { if (live) recRef.current?.pause() }, [live])

    // slug：バインドが無ければURLから
    useEffect(() => {
        if (props.slug) return
        const s = slugFromLocation()
        if (s) setSlug(s)
    }, [props.slug])

    // 録画（重ねるループ）の場所。項目JSONから取る
    useEffect(() => {
        if (isStatic || !slug) return
        setReducedM(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        fetch(`${base}/entry/${slug}.json`)
            .then((r) => r.json())
            .then((d) => d && d.video && setRec({ video: d.video, poster: d.poster, posterAt: d.posterAt || 0 }))
            .catch(() => {})
    }, [slug, isStatic, base])

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

    useEffect(() => {
        if (typeof window === "undefined" || !rootRef.current) return
        const el = rootRef.current
        const ro = new ResizeObserver(() => setW(el.clientWidth))
        ro.observe(el)
        setW(el.clientWidth)
        return () => ro.disconnect()
    }, [])

    // SP：ラボが画面にあり、かつプロンプト本体が見えていない間だけ、下に「変えた値＋Copy」を貼る
    useEffect(() => {
        if (isStatic || typeof IntersectionObserver === "undefined") return
        const a = rootRef.current, b = promptRef.current
        if (!a || !b) return
        const io = new IntersectionObserver((es) => {
            for (const e of es) {
                if (e.target === a) setLabInView(e.isIntersecting)
                if (e.target === b) setPromptInView(e.isIntersecting)
            }
        }, { threshold: [0, 0.35] })
        io.observe(a)
        io.observe(b)
        return () => io.disconnect()
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

    const pad = narrow ? 16 : 22
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

    const demo = (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <div style={{ ...label, justifyContent: "space-between" }}>
                <h2 style={{ display: "flex", gap: 10, alignItems: "center", margin: 0, font: "inherit", letterSpacing: "inherit" }}>
                    <span style={num}>01</span>
                    <span>Demo</span>
                    <span style={jpSub}>触って、数値を決める</span>
                </h2>
                <span style={{ display: "flex", gap: 16, alignItems: "center", textTransform: "none" }}>
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
                style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: ink, borderRadius: 10, overflow: "hidden" }}
                onPointerEnter={() => setLive(true)}
                onPointerDown={() => setLive(true)}
                onFocus={() => setLive(true)}
            >
                {!isStatic && rec ? (
                    <div className={"mdlab-rec" + (live ? " off" : "")} aria-hidden={live}>
                        {reducedM ? (
                            <img src={rec.poster} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        ) : (
                            <video ref={recRef} src={rec.video} poster={rec.poster} muted loop playsInline autoPlay preload="auto"
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        )}
                        <span className="mdlab-recchip">{narrow ? "REC · タップでライブ" : "REC — 触るとライブに切り替わる"}</span>
                    </div>
                ) : null}
                {!isStatic && demoSrc ? (
                    <iframe
                        ref={frameRef}
                        src={demoSrc}
                        title="ライブデモ"
                        loading="lazy"
                        onLoad={() => setTimeout(() => send(values), 50)}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, display: "block" }}
                    />
                ) : null}
            </div>
        </div>
    )

    const controls = params.length ? (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: !wide && !narrow && params.length > 1 ? "repeat(2, minmax(0, 1fr))" : "1fr",
                columnGap: 36,
                rowGap: wide ? 22 : 26,
            }}
        >
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
        <div ref={promptRef} style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <h2 style={{ ...label, margin: 0, fontWeight: 400 }}>
                <span style={num}>02</span>
                <span>Prompt</span>
                <span style={jpSub}>数値はスライダーと連動</span>
            </h2>
            <div style={{ background: ink, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: `10px ${pad}px 10px ${pad}px`, borderBottom: "1px solid rgba(233,233,227,0.12)" }}>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: "rgba(233,233,227,.55)", letterSpacing: "0.06em" }}>
                        {changed.length ? `${changed.length} value${changed.length > 1 ? "s" : ""} tuned` : "prompt.md"}
                    </span>
                    <span style={{ display: "flex", gap: 8 }}>
                        {changed.length ? (
                            <button className="mdlab-btn" onClick={reset} style={btn(false)}>初期値に戻す</button>
                        ) : null}
                        <button className="mdlab-btn" onClick={copy} style={btn(true)} aria-live="polite">{copyLabel}</button>
                    </span>
                </div>
                <div
                    ref={textRef}
                    style={{
                        padding: `${pad}px`,
                        fontFamily: MONO,
                        fontSize: narrow || wide ? 13 : 14,
                        lineHeight: 1.8,
                        color: "#E9E9E3",
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                        maxHeight: wide ? 520 : undefined,
                        overflowY: wide ? "auto" : undefined,
                    }}
                >
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

    // プロンプト本体が画面外の間は、下に「変えた値＋Copy」を出す（PCでも1画面目にCopyが無かった）
    const showBar = !isStatic && labInView && !promptInView && template !== ""

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
.mdlab-dyn{color:${accent};background:rgba(165,224,46,.12);border-radius:3px;padding:0 3px;transition:background .25s}
.mdlab-dyn.on{background:rgba(165,224,46,.42)}
.mdlab-rec{position:absolute;inset:0;z-index:2;pointer-events:none;transition:opacity .35s}
.mdlab-rec.off{opacity:0}
.mdlab-recchip{position:absolute;right:10px;top:10px;font-family:${MONO};font-size:11px;letter-spacing:.04em;color:#E9E9E3;background:rgba(10,10,10,.72);padding:6px 10px;border-radius:100px;backdrop-filter:blur(6px)}
.mdlab-bar{position:fixed;left:12px;right:12px;bottom:12px;z-index:20;display:flex;align-items:center;gap:10px;padding:8px 8px 8px 16px;border-radius:100px;background:${ink};color:#E9E9E3;box-shadow:0 10px 30px rgba(0,0,0,.25);transform:translateY(0);transition:transform .25s cubic-bezier(.2,.7,.2,1),opacity .25s}
.mdlab-bar.pc{left:50%;right:auto;bottom:20px;width:min(640px,calc(100% - 48px));transform:translateX(-50%)}
.mdlab-bar.pc.off{transform:translate(-50%,140%)}
.mdlab-bar.off{transform:translateY(140%);opacity:0;pointer-events:none}
@media (prefers-reduced-motion: reduce){.mdlab-dyn,.mdlab-bar{transition:none}}
`}</style>
            {wide ? (
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)", columnGap: 40, alignItems: "start" }}>
                    <div style={{ position: "sticky", top: 24 }}>{demo}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 40, paddingTop: 30 }}>
                        {controls}
                        {prompt}
                    </div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: narrow ? 40 : 48 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        {demo}
                        {controls}
                    </div>
                    {prompt}
                </div>
            )}
            {!isStatic ? (
                <div className={"mdlab-bar" + (showBar ? "" : " off") + (narrow ? "" : " pc")} aria-hidden={!showBar}>
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
})
