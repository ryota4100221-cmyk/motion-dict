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
    const [narrow, setNarrow] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)

    // slug：バインドが無ければURLから
    useEffect(() => {
        if (props.slug) return
        const s = slugFromLocation()
        if (s) setSlug(s)
    }, [props.slug])

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
        const ro = new ResizeObserver(() => setNarrow(el.clientWidth < 640))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // iframe の準備完了を受けて現在値を送る
    useEffect(() => {
        if (isStatic) return
        const onMsg = (ev: MessageEvent) => {
            if (ev.data && ev.data.type === "md:ready") setFrameReady(true)
        }
        window.addEventListener("message", onMsg)
        return () => window.removeEventListener("message", onMsg)
    }, [isStatic])

    const send = useCallback((v: Record<string, number>) => {
        const w = frameRef.current?.contentWindow
        if (w) w.postMessage({ type: "md:params", values: v }, "*")
    }, [])

    useEffect(() => {
        if (frameReady) send(values)
    }, [frameReady, values, send])

    const setOne = (key: string, v: number) => {
        setValues((prev) => ({ ...prev, [key]: v }))
        setFlashKey(key)
    }
    useEffect(() => {
        if (!flashKey) return
        const t = setTimeout(() => setFlashKey(""), 260)
        return () => clearTimeout(t)
    }, [flashKey, values])

    const reset = () => {
        setValues(Object.fromEntries(params.map((p) => [p.key, p.default])))
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

    const pad = narrow ? 16 : 24
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
    const btn = (primary: boolean): CSSProperties => ({
        fontFamily: MONO,
        fontSize: 12,
        letterSpacing: "0.06em",
        height: 36,
        padding: "0 14px",
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

    return (
        <div
            ref={rootRef}
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: narrow ? 40 : 56,
                color: ink,
                fontFamily: JP,
                ...props.style,
            }}
        >
            <style>{`
.mdlab-range{-webkit-appearance:none;appearance:none;width:100%;height:28px;background:transparent;margin:0;cursor:pointer}
.mdlab-range:focus{outline:none}
.mdlab-range::-webkit-slider-runnable-track{height:2px;background:linear-gradient(to right, ${ink} 0, ${ink} var(--fill), rgba(10,10,10,.16) var(--fill))}
.mdlab-range::-moz-range-track{height:2px;background:rgba(10,10,10,.16)}
.mdlab-range::-moz-range-progress{height:2px;background:${ink}}
.mdlab-range::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:${accent};border:2px solid ${ink};margin-top:-8px;transition:transform .15s}
.mdlab-range::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:${accent};border:2px solid ${ink}}
.mdlab-range:active::-webkit-slider-thumb{transform:scale(1.18)}
.mdlab-range:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 4px rgba(165,224,46,.45)}
.mdlab-opt:focus-visible,.mdlab-btn:focus-visible{outline:2px solid ${accent};outline-offset:2px}
.mdlab-dyn{color:${accent};background:rgba(165,224,46,.12);border-radius:3px;padding:0 3px;transition:background .25s}
.mdlab-dyn.on{background:rgba(165,224,46,.42)}
@media (prefers-reduced-motion: reduce){.mdlab-dyn{transition:none}}
`}</style>

            {/* 01 Demo + Params */}
            <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ ...label, justifyContent: "space-between" }}>
                    <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={num}>01</span>
                        <span>Demo</span>
                        <span style={{ color: muted, textTransform: "none", letterSpacing: "0.02em", fontFamily: JP }}>
                            触って、数値を決める
                        </span>
                    </span>
                    {demoSrc ? (
                        <a
                            href={demoSrc}
                            target="_blank"
                            rel="noopener"
                            style={{ color: muted, textDecoration: "none", textTransform: "none" }}
                        >
                            全画面で開く ↗
                        </a>
                    ) : null}
                </div>
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "16 / 9",
                        background: ink,
                        borderRadius: 10,
                        overflow: "hidden",
                    }}
                >
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

                {params.length ? (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: narrow || params.length === 1 ? "1fr" : "repeat(2, minmax(0, 1fr))",
                            columnGap: 40,
                            rowGap: 28,
                            marginTop: 12,
                        }}
                    >
                        {params.map((p) => {
                            const [k, jp] = splitLabel(p.label)
                            const v = values[p.key] ?? p.default
                            const fill = p.max > p.min ? ((v - p.min) / (p.max - p.min)) * 100 : 0
                            return (
                                <div key={p.key} style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                                        <label
                                            htmlFor={"mdlab-" + p.key}
                                            style={{ display: "flex", gap: 8, alignItems: "baseline", minWidth: 0 }}
                                        >
                                            <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 500 }}>{k}</span>
                                            <span style={{ fontSize: 13, color: muted }}>{jp}</span>
                                        </label>
                                        <span
                                            style={{
                                                fontFamily: MONO,
                                                fontSize: 14,
                                                fontVariantNumeric: "tabular-nums",
                                                background: v !== p.default ? accent : "transparent",
                                                border: `1px solid ${v !== p.default ? accent : "rgba(10,10,10,.18)"}`,
                                                borderRadius: 4,
                                                padding: "1px 7px",
                                                transition: "background .2s",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {fmt(p, v)}
                                        </span>
                                    </div>
                                    {p.options ? (
                                        <div role="radiogroup" aria-label={k} style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                            {p.options.map((o, i) => {
                                                const on = Math.round(v) === i
                                                return (
                                                    <button
                                                        key={o}
                                                        className="mdlab-opt"
                                                        role="radio"
                                                        aria-checked={on}
                                                        onClick={() => setOne(p.key, i)}
                                                        style={{
                                                            fontFamily: MONO,
                                                            fontSize: 13,
                                                            minHeight: 36,
                                                            padding: "0 12px",
                                                            borderRadius: 100,
                                                            border: `1px solid ${on ? ink : "rgba(10,10,10,.18)"}`,
                                                            background: on ? ink : "transparent",
                                                            color: on ? paper : ink,
                                                            cursor: "pointer",
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
                                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.75, color: "#45453F" }}>{p.desc}</p>
                                </div>
                            )
                        })}
                    </div>
                ) : null}
            </section>

            {/* 02 Prompt */}
            <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={label}>
                    <span style={num}>02</span>
                    <span>Prompt</span>
                    <span style={{ color: muted, textTransform: "none", letterSpacing: "0.02em", fontFamily: JP }}>
                        数値はスライダーと連動
                    </span>
                </div>
                <div style={{ background: ink, borderRadius: 10, overflow: "hidden" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            padding: `12px ${pad}px`,
                            borderBottom: "1px solid rgba(233,233,227,0.12)",
                        }}
                    >
                        <span style={{ fontFamily: MONO, fontSize: 12, color: "rgba(233,233,227,.55)", letterSpacing: "0.06em" }}>
                            prompt.md
                        </span>
                        <span style={{ display: "flex", gap: 8 }}>
                            {dirty ? (
                                <button className="mdlab-btn" onClick={reset} style={btn(false)}>
                                    初期値に戻す
                                </button>
                            ) : null}
                            <button className="mdlab-btn" onClick={copy} style={btn(true)} aria-live="polite">
                                {copied === "idle" ? "Copy prompt" : copied === "ok" ? "Copied ✓" : "Copy failed"}
                            </button>
                        </span>
                    </div>
                    <div
                        ref={textRef}
                        style={{
                            padding: `${pad}px`,
                            fontFamily: MONO,
                            fontSize: narrow ? 13 : 14,
                            lineHeight: 1.85,
                            color: "#E9E9E3",
                            whiteSpace: "pre-wrap",
                            overflowWrap: "anywhere",
                            wordBreak: "normal",
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
            </section>
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
