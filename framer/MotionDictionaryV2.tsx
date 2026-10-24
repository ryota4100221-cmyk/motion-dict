import {
    useEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
} from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

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

function normalize(s: string): string {
    return (s || "")
        .toLowerCase()
        .normalize("NFKC")
        .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
        .replace(/[\s・\-_/]/g, "")
}
function sentence(s: string) {
    return s
        .split("/")
        .map((x) => {
            const t = x.trim()
            return t.charAt(0).toUpperCase() + t.slice(1)
        })
        .join(" / ")
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
    const [entries, setEntries] = useState<Entry[]>([])
    const [query, setQuery] = useState("")
    const [activeCat, setActiveCat] = useState<string>("all")
    const [cols, setCols] = useState(3)
    const [w, setW] = useState(1200)
    const [hoverable, setHoverable] = useState(true)
    const [reduced, setReduced] = useState(false)
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
        }
        document.addEventListener("click", onClick, true)
        return () => document.removeEventListener("click", onClick, true)
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
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        setHoverable(window.matchMedia("(hover: hover) and (pointer: fine)").matches)
        setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    }, [])

    // カテゴリの件数は検索語に連動（検索中も「All 195」のままだった）
    const counts = useMemo(() => {
        const c: Record<string, number> = {}
        const nq0 = normalize(query.trim())
        for (const e of entries) {
            if (nq0 && !(normalize(e.nameJa).includes(nq0) || normalize(e.nameEn).includes(nq0) || normalize(e.lede).includes(nq0))) continue
            c[e.category] = (c[e.category] || 0) + 1
            c.all = (c.all || 0) + 1
        }
        return c
    }, [entries, query])

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
        // 絞り込んだら一覧の頭へ（バーの位置まで）
        const bar = barRef.current
        if (bar && typeof window !== "undefined") {
            const top = bar.getBoundingClientRect().top + window.scrollY - stickyTop
            if (window.scrollY > top) window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" })
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

    const Grid = ({ items, feature = false }: { items: Entry[]; feature?: boolean }) => (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${cols * 2}, minmax(0, 1fr))`,
                columnGap: sp ? 12 : 28,
                rowGap: sp ? 28 : 44,
                padding: `${sp ? 16 : 24}px ${gutter}px 8px`,
                maxWidth: 1680,
                margin: "0 auto",
                boxSizing: "border-box",
                width: "100%",
            }}
        >
            {items.map((e, k) => {
                // 6分割のグリッドで組む（通常カード＝2、章頭の大判＝4×2行）。
                // 最終行が1〜2枚だけ残ると右が空いて見えたので、残りの枚数で幅を割り直す（独立レビュー3）。
                const unit = 2
                const big = feature && k === 0 && cols >= 3
                const slots = items.length + (feature && cols >= 3 ? 3 : 0)
                const r = slots % cols
                const tail = r && k >= items.length - r ? r : 0
                let span = big ? unit * 2 : unit
                if (tail === 1) span = cols * unit
                if (tail === 2 && cols === 3) span = 3
                const wideRow = tail === 1
                return (
                    <div key={e.slug} style={{ gridColumn: `span ${span}`, gridRow: big ? "span 2" : undefined, minWidth: 0 }}>
                        <Card e={e} ink={ink} muted={muted} accent={accent} hoverable={hoverable} reduced={reduced} isStatic={isStatic} sp={sp} big={big} row={wideRow} />
                    </div>
                )
            })}
        </div>
    )

    const Heading = ({ c, n }: { c: (typeof CATS)[number]; n: number }) => (
        <h2
            id={"cat-" + c.key}
            style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                margin: "0 auto",
                maxWidth: 1680,
                boxSizing: "border-box",
                width: "100%",
                padding: `${sp ? 48 : 120}px ${gutter}px ${sp ? 4 : 12}px`,
                fontWeight: 400,
                scrollMarginTop: sp ? 112 : 72,
            }}
        >
            <span style={{ fontFamily: JP, fontWeight: 900, fontSize: sp ? 36 : w < 1100 ? 64 : 96, letterSpacing: "-0.045em", lineHeight: 0.9, color: ink }}>{c.label}</span>
            <span style={{ fontFamily: JP, fontSize: sp ? 13 : 16, color: muted, fontWeight: 500 }}>{c.ja}</span>
            <span style={{ fontFamily: MONO, fontSize: 12, color: muted, letterSpacing: "0.04em", marginLeft: "auto" }}>
                {String(n).padStart(2, "0")} motions
            </span>
        </h2>
    )

    return (
        <div ref={rootRef} style={{ position: "relative", width: "100%", background: paper, color: ink, fontFamily: JP, ...props.style }}>
            <style>{`
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
.mdx-card .ph{position:relative;width:100%;aspect-ratio:16/9;border-radius:8px;overflow:hidden;background:#0B0B0A;isolation:isolate}
.mdx-card .ph img,.mdx-card .ph video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.mdx-card .ph video{opacity:0;transition:opacity .18s}
.mdx-card .ph video.on{opacity:1}
.mdx-card .nm{transition:box-shadow .2s}
.mdx-card:hover .nm{box-shadow:inset 0 -0.42em 0 ${accent}}
.mdx-card .ph::after{content:"";position:absolute;inset:0;border-radius:8px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06);pointer-events:none}
@media (prefers-reduced-motion: reduce){.mdx-card .ph video{transition:none}}
`}</style>

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
                            <button key={c.key} className="mdx-chip" role="tab" aria-selected={on} aria-pressed={on} onClick={() => pick(c.key)} style={chip(on)}>
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
                        {` · ${filtered.length} motions`}
                    </div>
                    {filtered.length ? (
                        Grid({ items: filtered })
                    ) : (
                        <div style={{ padding: `48px ${gutter}px 80px`, display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
                            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.8 }}>
                                該当する動きが見つかりません。別の言い方（英名・擬態語・「〜すると〜する」）でも探せます。
                            </p>
                            <button className="mdx-chip" onClick={() => { setQuery(""); setActiveCat("all") }} style={chip(true)}>
                                すべて表示
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                CATS.map((c) => {
                    const items = entries.filter((e) => e.category === c.key)
                    if (!items.length) return null
                    return (
                        <section key={c.key} aria-labelledby={"cat-" + c.key}>
                            {Heading({ c, n: items.length })}
                            {Grid({ items, feature: true })}
                        </section>
                    )
                })
            )}
            <div style={{ height: sp ? 48 : 80 }} />
        </div>
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
}

function Card({ e, ink, muted, hoverable, reduced, isStatic, sp, big, row }: CardProps) {
    const [active, setActive] = useState(false)
    const [ready, setReady] = useState(false)
    const vRef = useRef<HTMLVideoElement>(null)
    const boxRef = useRef<HTMLAnchorElement>(null)

    useEffect(() => {
        const v = vRef.current
        if (!v) return
        if (active) {
            const p = v.play()
            if (p && p.catch) p.catch(() => {})
        } else {
            v.pause()
            setReady(false)
        }
    }, [active])

    // 同時に再生するのは1枚だけ（タッチで2列が同時に帯に入ると2〜5本が回っていた）
    useEffect(() => {
        if (!active || typeof window === "undefined") return
        window.dispatchEvent(new CustomEvent("mdx-play", { detail: e.slug }))
        const off = (ev: Event) => { if ((ev as CustomEvent).detail !== e.slug) setActive(false) }
        window.addEventListener("mdx-play", off)
        return () => window.removeEventListener("mdx-play", off)
    }, [active, e.slug])

    // タッチ端末：画面中央の帯に入った1枚だけ再生（reduced-motion 時は再生しない）
    useEffect(() => {
        if (isStatic || hoverable || reduced) return
        if (typeof window === "undefined" || !("IntersectionObserver" in window)) return
        const el = boxRef.current
        if (!el) return
        const io = new IntersectionObserver(
            (es) => {
                for (const en of es) setActive(en.isIntersecting)
            },
            { rootMargin: "-42% 0px -42% 0px", threshold: 0 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic, hoverable, reduced])

    const hov = !isStatic && hoverable ? { onMouseEnter: () => setActive(true), onMouseLeave: () => setActive(false), onFocus: () => setActive(true), onBlur: () => setActive(false) } : {}

    return (
        <a ref={boxRef} className={"mdx-card" + (row ? " row" : "")} data-slug={e.slug} href={"/entries/" + e.slug} title={`${e.nameJa} — ${sentence(e.nameEn)}`} {...hov}>
            <span className="ph">
                <img src={e.poster} alt="" loading="lazy" decoding="async" />
                {!isStatic && active ? (
                    <video
                        ref={vRef}
                        className={ready ? "on" : ""}
                        src={e.video}
                        muted
                        loop
                        playsInline
                        autoPlay
                        preload="auto"
                        // 再生は動きの頭から（ポスター＝見せ場の時刻から始めると途中から見せることになる）。
                        // ポスターからの切り替えは 0.18s のフェードで繋ぐ
                        onPlaying={() => setReady(true)}
                        aria-hidden
                    />
                ) : null}
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                <span
                    className="nm"
                    style={{
                        alignSelf: "flex-start",
                        maxWidth: "100%",
                        fontFamily: JP,
                        fontSize: big ? 24 : sp ? 13.5 : 16,
                        fontWeight: 700,
                        lineHeight: 1.45,
                        letterSpacing: "-0.005em",
                        color: ink,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {e.nameJa}
                </span>
                <span style={{ fontFamily: MONO, fontSize: sp ? 11 : 12, letterSpacing: "0.01em", color: muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {sentence(e.nameEn)}
                </span>
                {big || row ? (
                    <span style={{ marginTop: 8, fontSize: 14, lineHeight: 1.8, color: "#45453F", maxWidth: 640, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {e.lede}
                    </span>
                ) : null}
            </span>
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
