import { useEffect, useRef, useState, type CSSProperties } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

// ヒーローの「動く1枚」。動きの辞典なのに1画面目に動くものが無かった（独立レビュー2）。
// 代表的な項目の録画を順に流し、名前を添えて詳細へリンクする。動画は今見せている1本だけを載せる。
// reduced-motion ではポスターを並べ替えるだけ（自動再生しない）。

interface Props {
    slugs: string
    base: string
    interval: number
    accent: string
    ink: string
    paper: string
    style?: CSSProperties
}
interface Entry { slug: string; nameJa: string; nameEn: string; poster: string; video: string; category: string }

const MONO = '"Geist Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
const JP = '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif'

/**
 * Hero Reel
 *
 * @framerIntrinsicWidth 520
 * @framerIntrinsicHeight 360
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function HeroReel(props: Props) {
    const {
        slugs = "magnetic-hover,text-scramble,split-text-reveal,card-shuffle,liquid-fill,stacking-cards,like-burst,cover-flow",
        base = "https://ryota4100221-cmyk.github.io/motion-dict",
        interval = 4200,
        accent = "#A5E02E",
        ink = "#0A0A0A",
        paper = "#F4F4F1",
    } = props
    const isStatic = useIsStaticRenderer()
    const [list, setList] = useState<Entry[]>([])
    const [i, setI] = useState(0)
    const [reduced, setReduced] = useState(false)
    const [paused, setPaused] = useState(false)
    const vRef = useRef<HTMLVideoElement>(null)
    const rootRef = useRef<HTMLDivElement>(null)
    const [inView, setInView] = useState(true)
    // 画面外では再生しない（SPでスクロールした後も裏で回り続けていた）
    useEffect(() => {
        if (isStatic || !rootRef.current || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0 })
        io.observe(rootRef.current)
        return () => io.disconnect()
    }, [isStatic])

    useEffect(() => {
        if (isStatic) return
        setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        const want = slugs.split(",").map((s) => s.trim()).filter(Boolean)
        fetch(`${base}/entries-v2.json`).then((r) => r.json()).then((all: Entry[]) => {
            const m = new Map(all.map((e) => [e.slug, e]))
            setList(want.map((s) => m.get(s)).filter(Boolean) as Entry[])
        }).catch(() => {})
    }, [isStatic, slugs, base])

    useEffect(() => {
        if (!list.length || reduced || paused || !inView) return
        const t = setTimeout(() => setI((x) => (x + 1) % list.length), interval)
        return () => clearTimeout(t)
    }, [i, list, reduced, paused, interval, inView])

    const e = list[i]
    return (
        <div ref={rootRef} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, fontFamily: JP, color: ink, ...props.style }}
            onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            <a href={e ? `/entries/${e.slug}` : "#"} aria-label={e ? `${e.nameJa} を見る` : undefined}
                style={{ position: "relative", display: "block", width: "100%", aspectRatio: "16 / 9", borderRadius: 10, overflow: "hidden", background: "#0B0B0A" }}>
                {e ? <img key={"p" + e.slug} src={e.poster} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                {e && !reduced && inView ? (
                    <video key={e.slug} ref={vRef} src={e.video} muted playsInline autoPlay loop preload="auto" aria-hidden
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                ) : null}
                <span style={{ position: "absolute", left: 14, bottom: 12, fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", color: "rgba(244,244,241,.7)", textTransform: "uppercase" }}>
                    {e ? `${String(i + 1).padStart(2, "0")} / ${String(list.length).padStart(2, "0")} · ${e.category}` : ""}
                </span>
            </a>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, minHeight: 24 }}>
                <span style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e ? e.nameJa : ""}</span>
                <span style={{ display: "flex", gap: 6 }} role="tablist" aria-label="代表的な動き">
                    {list.map((x, k) => (
                        <button key={x.slug} role="tab" aria-selected={k === i} aria-label={x.nameJa} onClick={() => setI(k)}
                            style={{ width: k === i ? 22 : 8, height: 8, padding: 0, border: 0, borderRadius: 8, cursor: "pointer", background: k === i ? ink : "rgba(10,10,10,.18)", transition: reduced ? "none" : "width .3s cubic-bezier(.2,.7,.2,1)" }} />
                    ))}
                </span>
            </div>
        </div>
    )
}

addPropertyControls(HeroReel, {
    slugs: { type: ControlType.String, title: "Slugs", displayTextArea: true, defaultValue: "magnetic-hover,text-scramble,split-text-reveal,card-shuffle,liquid-fill,stacking-cards,like-burst,cover-flow" },
    base: { type: ControlType.String, title: "Base", defaultValue: "https://ryota4100221-cmyk.github.io/motion-dict" },
    interval: { type: ControlType.Number, title: "Interval", defaultValue: 4200, min: 1500, max: 12000, step: 100 },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#A5E02E" },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#0A0A0A" },
    paper: { type: ControlType.Color, title: "Paper", defaultValue: "#F4F4F1" },
})
