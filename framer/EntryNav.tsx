import { useEffect, useState, startTransition, type CSSProperties } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

// 詳細ページの末尾：「近い動き」（関連）＋ 前後の項目 ＋ 一覧へ戻る。
// 旧Next版にはあったが、Framer移行で抜け落ち、詳細ページの出口が無かった（独立レビューで指摘）。
// データは GH の entry/<slug>.json（関連・前後は一覧と同じ並びで書き出し済み）。

interface Mini {
    slug: string
    nameJa: string
    nameEn: string
    category: string
    poster: string
}
interface Props {
    base: string
    accent: string
    ink: string
    muted: string
    style?: CSSProperties
}

const MONO =
    '"Geist Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
const JP = '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif'
const CAT: Record<string, string> = {
    hover: "Hover", scroll: "Scroll", text: "Text", transition: "Transition",
    media: "Media", ui: "UI", loading: "Loading", webgl: "WebGL",
}

function sentence(s: string) {
    return (s || "").split("/").map((x) => { const t = x.trim(); return t.charAt(0).toUpperCase() + t.slice(1) }).join(" / ")
}

/**
 * Entry Nav
 *
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 420
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function EntryNav(props: Props) {
    const {
        base = "https://ryota4100221-cmyk.github.io/motion-dict",
        accent = "#A5E02E",
        ink = "#0A0A0A",
        muted = "#6B6B66",
    } = props
    const isStatic = useIsStaticRenderer()
    const [d, setD] = useState<{ related: Mini[]; prev: Mini; next: Mini } | null>(null)
    const [narrow, setNarrow] = useState(false)

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const m = window.location.pathname.match(/\/entries\/([^/?#]+)/)
        if (!m) return
        let alive = true
        const slug = decodeURIComponent(m[1])
        fetch(`${base}/entry/${slug}.json`)
            .then((r) => r.json())
            .then(async (j) => {
                // 「近い動き」が3件に満たない項目（196件中14件が2件）は、同じ章の項目で3件まで補う（3列目が空いていた）。
                // 補うのは一覧の並びで自分の後ろから（前後の項目＝下の Prev/Next と重ならないもの）
                const rel: Mini[] = Array.isArray(j.related) ? j.related : []
                if (rel.length < 3) {
                    try {
                        const all: Mini[] = await fetch(`${base}/entries-v2.json`).then((r) => r.json())
                        const me = all.find((e) => e.slug === slug)
                        if (me) {
                            const skip = new Set([slug, j.prev && j.prev.slug, j.next && j.next.slug, ...rel.map((r) => r.slug)])
                            const same = all.filter((e) => e.category === me.category)
                            const i = same.findIndex((e) => e.slug === slug)
                            const order = same.slice(i + 1).concat(same.slice(0, i))
                            for (const e of order) {
                                if (rel.length >= 3) break
                                if (!skip.has(e.slug)) rel.push({ slug: e.slug, nameJa: e.nameJa, nameEn: e.nameEn, category: e.category, poster: e.poster })
                            }
                        }
                    } catch {}
                }
                if (alive) startTransition(() => setD({ ...j, related: rel }))
            })
            .catch(() => {})
        const mq = window.matchMedia("(max-width: 640px)")
        const on = () => setNarrow(mq.matches)
        on()
        mq.addEventListener("change", on)
        return () => {
            alive = false
            mq.removeEventListener("change", on)
        }
    }, [isStatic, base])

    const label: CSSProperties = {
        fontFamily: MONO, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase",
        color: ink, display: "flex", alignItems: "center", gap: 10,
    }
    const related = (d?.related || []).slice(0, 3)

    return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 56, color: ink, fontFamily: JP, ...props.style }}>
            <style>{`
.mdnav-card{display:flex;flex-direction:column;gap:10px;text-decoration:none;color:${ink};min-width:0}
.mdnav-card .ph{position:relative;aspect-ratio:16/9;border-radius:8px;overflow:hidden;background:${ink}}
.mdnav-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .5s cubic-bezier(.2,.7,.2,1)}
.mdnav-card:hover img{transform:scale(1.04)}
.mdnav-card .nm{transition:box-shadow .2s}
.mdnav-card:hover .nm{box-shadow:inset 0 -0.42em 0 ${accent}}
.mdnav-card:focus-visible{outline:2px solid ${accent};outline-offset:4px;border-radius:8px}
.mdnav-pg{display:flex;flex-direction:column;gap:6px;padding:22px 0;text-decoration:none;color:${ink};min-width:0;border-top:1px solid ${ink}}
.mdnav-pg:hover .nm{text-decoration:underline;text-decoration-color:${accent};text-decoration-thickness:3px;text-underline-offset:5px}
.mdnav-pg:focus-visible{outline:2px solid ${accent};outline-offset:4px}
@media (prefers-reduced-motion: reduce){.mdnav-card img{transition:none}}
`}</style>
            {related.length ? (
                <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <h2 style={{ ...label, margin: 0, fontWeight: 400 }}>
                        <span style={{ color: muted }}>05</span>
                        <span>Related</span>
                        <span style={{ color: muted, textTransform: "none", letterSpacing: "0.02em", fontFamily: JP }}>近い動き</span>
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: narrow ? "repeat(2, minmax(0,1fr))" : "repeat(3, minmax(0,1fr))", gap: narrow ? 16 : 24 }}>
                        {related.map((r) => (
                            <a key={r.slug} className="mdnav-card" href={`/entries/${r.slug}`}>
                                <span className="ph">
                                    <img src={r.poster} alt="" loading="lazy" />
                                </span>
                                <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                                    <span className="nm" style={{ alignSelf: "flex-start", maxWidth: "100%", fontSize: narrow ? 13.5 : 16, fontWeight: 700, lineHeight: 1.45, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.nameJa}</span>
                                    <span style={{ fontFamily: MONO, fontSize: narrow ? 11 : 12, color: muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sentence(r.nameEn)} · {CAT[r.category] || r.category}</span>
                                </span>
                            </a>
                        ))}
                    </div>
                </section>
            ) : null}

            <nav aria-label="前後の項目" style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", columnGap: 32 }}>
                {d ? (
                    <>
                        <a className="mdnav-pg" href={`/entries/${d.prev.slug}`}>
                            <span style={{ fontFamily: MONO, fontSize: 12, color: muted, letterSpacing: "0.06em" }}>← Prev</span>
                            <span className="nm" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.5 }}>{d.prev.nameJa}</span>
                        </a>
                        <a className="mdnav-pg" href={`/entries/${d.next.slug}`} style={{ textAlign: narrow ? "left" : "right", alignItems: narrow ? "flex-start" : "flex-end" }}>
                            <span style={{ fontFamily: MONO, fontSize: 12, color: muted, letterSpacing: "0.06em" }}>Next →</span>
                            <span className="nm" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.5 }}>{d.next.nameJa}</span>
                        </a>
                    </>
                ) : null}
            </nav>
        </div>
    )
}

addPropertyControls(EntryNav, {
    base: { type: ControlType.String, title: "Base", defaultValue: "https://ryota4100221-cmyk.github.io/motion-dict" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#A5E02E" },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#0A0A0A" },
    muted: { type: ControlType.Color, title: "Muted", defaultValue: "#6B6B66" },
})
