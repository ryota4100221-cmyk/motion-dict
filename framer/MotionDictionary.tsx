import {
    useEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
} from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

interface Entry {
    slug: string
    category: string
    nameJa: string
    nameEn: string
    lede: string
    poster: string
    video: string
}

interface MotionDictionaryProps {
    dataUrl: string
    accent: string
    ink: string
    paper: string
    muted: string
    style?: CSSProperties
}

const CATS: { key: string; label: string }[] = [
    { key: "hover", label: "Hover" },
    { key: "scroll", label: "Scroll" },
    { key: "text", label: "Text" },
    { key: "transition", label: "Transition" },
    { key: "media", label: "Media" },
    { key: "ui", label: "UI" },
    { key: "loading", label: "Loading" },
]

const MONO =
    '"Geist Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
const JP = '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif'

function normalize(s: string): string {
    return (s || "")
        .toLowerCase()
        .replace(/[ァ-ヶ]/g, (c) =>
            String.fromCharCode(c.charCodeAt(0) - 0x60)
        )
}

/**
 * Motion Dictionary
 *
 * Live search + category filter + poster grid with hover-to-play video.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 900
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function MotionDictionary(props: MotionDictionaryProps) {
    const {
        dataUrl = "https://ryota4100221-cmyk.github.io/motion-dict/entries.json",
        accent = "#A5E02E",
        ink = "#0A0A0A",
        paper = "#F4F4F1",
        muted = "#6B6B6B",
    } = props

    const isStatic = useIsStaticRenderer()
    const [entries, setEntries] = useState<Entry[]>([])
    const [query, setQuery] = useState("")
    const [activeCat, setActiveCat] = useState<string>("all")
    const [cols, setCols] = useState(3)
    const [hoverable, setHoverable] = useState(true)
    const rootRef = useRef<HTMLDivElement>(null)

    // Fetch data (skip on static canvas render)
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

    // Responsive columns via ResizeObserver
    useEffect(() => {
        if (typeof window === "undefined" || !rootRef.current) return
        const el = rootRef.current
        const compute = () => {
            const w = el.clientWidth
            const next = w >= 880 ? 3 : w >= 560 ? 2 : 1
            startTransition(() => setCols(next))
        }
        compute()
        const ro = new ResizeObserver(compute)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Detect hover capability (touch devices → in-view autoplay)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        setHoverable(window.matchMedia("(hover: hover)").matches)
    }, [])

    const counts = useMemo(() => {
        const c: Record<string, number> = {}
        for (const e of entries) c[e.category] = (c[e.category] || 0) + 1
        return c
    }, [entries])

    const q = query.trim()
    const nq = normalize(q)

    const filtered = useMemo(() => {
        return entries.filter((e) => {
            if (activeCat !== "all" && e.category !== activeCat) return false
            if (!nq) return true
            return (
                normalize(e.nameJa).includes(nq) ||
                normalize(e.nameEn).includes(nq) ||
                normalize(e.lede).includes(nq)
            )
        })
    }, [entries, activeCat, nq])

    const total = entries.length || 102
    const searching = nq.length > 0
    const grouped = !searching && activeCat === "all"

    // ---- styles ----
    const rule: CSSProperties = { width: "100%", height: 1, background: ink }
    const rowPad = "22px clamp(18px, 4vw, 40px)"
    const sectionPad = "clamp(18px, 4vw, 40px)"

    const chip = (active: boolean): CSSProperties => ({
        fontFamily: MONO,
        fontSize: 12.5,
        letterSpacing: "0.04em",
        padding: "6px 12px",
        borderRadius: 100,
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
        border: active ? `1px solid ${accent}` : "1px solid rgba(10,10,10,0.18)",
        background: active ? accent : "transparent",
        color: ink,
    })

    function CategoryHeading({ label, n }: { label: string; n: number }) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    maxWidth: 1680,
                    width: "100%",
                    boxSizing: "border-box",
                    padding: `4px ${sectionPad} 0`,
                    margin: "8px auto 0",
                }}
            >
                <span style={{ width: 4, height: 16, background: accent, borderRadius: 2 }} />
                <span
                    style={{
                        fontFamily: MONO,
                        fontSize: 15,
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        color: ink,
                    }}
                >
                    {label}
                </span>
                <span
                    style={{
                        fontFamily: MONO,
                        fontSize: 13,
                        color: muted,
                        letterSpacing: "0.04em",
                    }}
                >
                    ({String(n).padStart(2, "0")})
                </span>
            </div>
        )
    }

    function Grid({ items }: { items: Entry[] }) {
        return (
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    columnGap: "clamp(28px, 2.2vw, 32px)",
                    rowGap: 38,
                    maxWidth: 1680,
                    width: "100%",
                    margin: "0 auto",
                    boxSizing: "border-box",
                    padding: `24px ${sectionPad} 8px`,
                }}
            >
                {items.map((e) => (
                    <Card
                        key={e.slug}
                        e={e}
                        ink={ink}
                        muted={muted}
                        hoverable={hoverable}
                        isStatic={isStatic}
                    />
                ))}
            </div>
        )
    }

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                background: paper,
                color: ink,
                fontFamily: JP,
                ...props.style,
            }}
        >
            {/* Search bar */}
            <div style={rule} />
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    padding: rowPad,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <circle cx="11" cy="11" r="7" stroke={muted} strokeWidth="2" />
                        <path d="M20 20L16.5 16.5" stroke={muted} strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <input
                        value={query}
                        onChange={(ev) => setQuery(ev.target.value)}
                        placeholder="動きを検索 ― 名前 / 英名 / 説明"
                        aria-label="動きを検索"
                        style={{
                            flex: 1,
                            minWidth: 0,
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            fontFamily: JP,
                            fontSize: 14,
                            color: ink,
                            padding: 0,
                        }}
                    />
                </div>
                <span
                    style={{
                        fontFamily: MONO,
                        fontSize: 13,
                        color: muted,
                        letterSpacing: "0.04em",
                        whiteSpace: "nowrap",
                    }}
                >
                    ({String(filtered.length).padStart(3, "0")}/{total})
                </span>
            </div>
            <div style={rule} />

            {/* Category chips */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    padding: `16px ${sectionPad}`,
                }}
            >
                <span
                    onClick={() => setActiveCat("all")}
                    style={chip(activeCat === "all")}
                    role="button"
                    tabIndex={0}
                >
                    All ({total})
                </span>
                {CATS.map((c) => (
                    <span
                        key={c.key}
                        onClick={() => setActiveCat(c.key)}
                        style={chip(activeCat === c.key)}
                        role="button"
                        tabIndex={0}
                    >
                        {c.label} ({String(counts[c.key] || 0).padStart(2, "0")})
                    </span>
                ))}
            </div>
            <div style={rule} />

            {/* Results */}
            {searching ? (
                <div>
                    <div
                        style={{
                            fontFamily: MONO,
                            fontSize: 13,
                            color: muted,
                            letterSpacing: "0.04em",
                            padding: `20px ${sectionPad} 0`,
                        }}
                    >
                        {filtered.length} results for “{q}”
                    </div>
                    {filtered.length > 0 ? (
                        <Grid items={filtered} />
                    ) : (
                        <div
                            style={{
                                fontFamily: JP,
                                fontSize: 14,
                                color: muted,
                                padding: `40px ${sectionPad} 60px`,
                            }}
                        >
                            該当する動きが見つかりません。
                        </div>
                    )}
                </div>
            ) : grouped ? (
                CATS.map((c) => {
                    const items = entries.filter((e) => e.category === c.key)
                    if (items.length === 0) return null
                    return (
                        <div key={c.key}>
                            <CategoryHeading label={c.label} n={items.length} />
                            <Grid items={items} />
                        </div>
                    )
                })
            ) : (
                <div>
                    <CategoryHeading
                        label={CATS.find((c) => c.key === activeCat)?.label || ""}
                        n={filtered.length}
                    />
                    <Grid items={filtered} />
                </div>
            )}

            <div style={{ height: 40 }} />
        </div>
    )
}

interface CardProps {
    e: Entry
    ink: string
    muted: string
    hoverable: boolean
    isStatic: boolean
}

function Card(props: CardProps) {
    const { e, ink, muted, hoverable, isStatic } = props
    const vRef = useRef<HTMLVideoElement>(null)
    const boxRef = useRef<HTMLAnchorElement>(null)

    const play = () => {
        const v = vRef.current
        if (!v) return
        const p = v.play()
        if (p && typeof p.catch === "function") p.catch(() => {})
    }
    const stop = () => {
        const v = vRef.current
        if (!v) return
        v.pause()
        try {
            v.currentTime = 0
        } catch (_) {}
    }

    // Touch devices: play when card is near the vertical center of the viewport
    useEffect(() => {
        if (isStatic || hoverable) return
        if (typeof window === "undefined" || !("IntersectionObserver" in window)) return
        const el = boxRef.current
        if (!el) return
        const io = new IntersectionObserver(
            (entriesIo) => {
                for (const en of entriesIo) {
                    if (en.isIntersecting && en.intersectionRatio >= 0.6) play()
                    else stop()
                }
            },
            { rootMargin: "-30% 0px -30% 0px", threshold: [0, 0.6, 1] }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic, hoverable])

    const posterBox: CSSProperties = {
        position: "relative",
        width: "100%",
        minWidth: 0,
        aspectRatio: "16 / 9",
        borderRadius: 8,
        overflow: "hidden",
        background: ink,
    }
    // Source frames render the demo (a 2.82:1 letterbox) centered inside a
    // #F4F4F1 margin. Scale up so the dark demo fills the 16:9 card and the
    // light frame (and any marks in it) is cropped away.
    const media: CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        transform: "scale(2.3)",
        transformOrigin: "center center",
    }

    const hoverProps =
        !isStatic && hoverable
            ? { onMouseEnter: play, onMouseLeave: stop }
            : {}

    return (
        <a
            ref={boxRef}
            href={"/entries/" + e.slug}
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 11,
                minWidth: 0,
                overflow: "hidden",
                textDecoration: "none",
                color: ink,
            }}
            {...hoverProps}
        >
            <div style={posterBox}>
                {isStatic ? (
                    <img src={e.poster} alt={e.nameEn} style={media} />
                ) : (
                    <video
                        ref={vRef}
                        src={e.video}
                        poster={e.poster}
                        muted
                        loop
                        playsInline
                        preload="none"
                        aria-label={e.nameEn}
                        style={media}
                    />
                )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span
                    style={{
                        fontFamily: JP,
                        fontSize: 15,
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                        color: ink,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {e.nameJa}
                </span>
                <span
                    style={{
                        fontFamily: MONO,
                        fontSize: 12,
                        letterSpacing: "0.02em",
                        color: muted,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {e.nameEn}
                </span>
            </div>
        </a>
    )
}

addPropertyControls(MotionDictionary, {
    dataUrl: {
        type: ControlType.String,
        title: "Data URL",
        defaultValue: "https://ryota4100221-cmyk.github.io/motion-dict/entries.json",
    },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#A5E02E" },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#0A0A0A" },
    paper: { type: ControlType.Color, title: "Paper", defaultValue: "#F4F4F1" },
    muted: { type: ControlType.Color, title: "Muted", defaultValue: "#6B6B6B" },
})
