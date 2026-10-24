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
    grid: { pc: number; sp: number; bigs?: { i: number; side: "L" | "R" }[]; row?: "sp" | "all"; size: "s" | "m" | "l" }
    after: number // 章の末尾の余白（PC）
}

const CHAPTERS: Record<string, Chapter> = {
    hover: {
        tone: "dark", kind: "magnetic", align: "left", fs: 260, fsSp: 76, minH: 620, minHSp: 300, after: 120,
        line: "カーソルを乗せたときの返事。押す前に「押せる」と伝える動き。",
        demo: { slug: "magnetic-hover", ja: "マグネティックホバー", params: "strength 0.35 · lerp 0.12" },
        grid: { pc: 3, sp: 2, bigs: [{ i: 0, side: "L" }, { i: 15, side: "R" }], size: "m" },
    },
    scroll: {
        tone: "light", kind: "skew", align: "left", fs: 230, fsSp: 72, minH: 440, minHSp: 240, after: 96,
        line: "読み進める指の速さと位置に、画面が付いてくる動き。",
        demo: { slug: "velocity-skew", ja: "速度スキュー", params: "factor 0.5 · max 8°" },
        grid: { pc: 4, sp: 2, size: "m" },
    },
    text: {
        tone: "light", kind: "split", align: "center", fs: 300, fsSp: 96, minH: 560, minHSp: 280, after: 136,
        line: "文字そのものが出方で語る。読ませる順番をつくる動き。",
        demo: { slug: "split-text-reveal", ja: "分割テキストリビール", params: "stagger 30ms · 0.6s" },
        grid: { pc: 2, sp: 1, row: "all", size: "l" },
    },
    transition: {
        tone: "dark", kind: "wipe", align: "right", fs: 190, fsSp: 54, minH: 500, minHSp: 260, after: 104,
        line: "ページとページの継ぎ目。どこからどこへ移ったかを見せる動き。",
        demo: { slug: "curtain-wipe", ja: "カーテンワイプ", params: "0.8s × 2 · in-out" },
        grid: { pc: 3, sp: 2, bigs: [{ i: 4, side: "R" }], size: "m" },
    },
    media: {
        tone: "dark", kind: "clip", align: "left", fs: 340, fsSp: 96, minH: 660, minHSp: 320, after: 128,
        line: "写真と映像の見せ方。額縁と現れ方で、同じ1枚の温度を変える動き。",
        demo: { slug: "clip-reveal", ja: "クリップリビール", params: "0.9s · expo-out" },
        grid: { pc: 4, sp: 2, bigs: [{ i: 0, side: "L" }, { i: 7, side: "R" }, { i: 20, side: "L" }, { i: 27, side: "R" }], size: "m" },
    },
    ui: {
        tone: "light", kind: "press", align: "right", fs: 200, fsSp: 64, minH: 460, minHSp: 240, after: 96,
        line: "押す・開く・閉じる。部品が操作に答える動き。",
        demo: { slug: "press-feedback", ja: "プレスフィードバック", params: "scale 0.97 · 0.05s / 0.2s" },
        grid: { pc: 5, sp: 2, bigs: [{ i: 11, side: "R" }, { i: 30, side: "L" }, { i: 52, side: "R" }], size: "s" },
    },
    loading: {
        tone: "dark", kind: "count", align: "left", fs: 150, fsSp: 52, minH: 300, minHSp: 200, after: 72,
        line: "待ち時間を「進んでいる」に変える動き。",
        demo: { slug: "preloader-counter", ja: "プリローダーカウンター", params: "1.8s · expo-out" },
        grid: { pc: 5, sp: 2, size: "s" },
    },
}

// 列数ごとの格子の分割数（最終行の端数を割り直せるよう、列数の倍数にしておく）。
// 60分割にすると column-gap が59本入って溢れるので、必要最小の倍数にとどめる
const BASE: Record<number, number> = { 1: 1, 2: 2, 3: 6, 4: 12, 5: 5 }

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
    // press：押している間だけ章名の地と文字を反転（ボタンの押下状態。色は増やさない）
    const fgRef = useRef(fg)
    const bgRef = useRef(dark ? ink : paper)
    fgRef.current = fg
    bgRef.current = dark ? ink : paper

    const avail = Math.min(w, 1680) - gutter * 2
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
        const play = () => {
            armed = false
            if (ch.kind === "split") {
                // split-text-reveal の既定値：stagger 30ms・0.6s・cubic-bezier(0.22,1,0.36,1)。移動量 30px は本文サイズの値なので、章名では 115%（マスクの外から）に読み替え
                ls.forEach((l, i) => {
                    l.style.transition = `transform .6s cubic-bezier(.22,1,.36,1) ${i * 30}ms, opacity .6s ease ${i * 30}ms`
                    l.style.transform = "none"; l.style.opacity = "1"
                })
            } else if (ch.kind === "wipe") {
                // curtain-wipe：覆う0.8s → 覆いきった60ms後に中身を差し替え → 反対の辺へ0.8sで引く
                const p = fxRef.current!
                requestAnimationFrame(() => {
                    p.style.transition = "transform .8s cubic-bezier(.76,0,.24,1)"; p.style.transform = "scaleX(1)"
                })
                later(() => {
                    t.style.opacity = "1"
                    p.style.transformOrigin = "right center"; p.style.transform = "scaleX(0)"
                }, 860)
            } else if (ch.kind === "clip") {
                // clip-reveal：inset で左から開く 0.9s・easeOutExpo
                requestAnimationFrame(() => {
                    t.style.transition = "clip-path .9s cubic-bezier(.16,1,.3,1)"; t.style.clipPath = "inset(0 0% 0 0)"
                })
            } else if (ch.kind === "press") {
                // press-feedback：入り0.05s で沈む → 戻り0.2s ease-out（非対称）。沈み 2px は16pxのボタン基準なので 0.125em に読み替え
                later(() => {
                    t.style.transition = "transform .05s ease-out, background-color .05s ease-out, color .05s ease-out"; t.style.transform = "translateY(.125em) scale(.97)"; t.style.background = fgRef.current; t.style.color = bgRef.current
                    later(() => { t.style.transition = "transform .2s ease-out, background-color .2s ease-out, color .2s ease-out"; t.style.transform = "none"; t.style.background = ""; t.style.color = "" }, 220)
                }, 380)
            } else if (ch.kind === "count") {
                // preloader-counter：1.8s・表示値 = round(N × (1 − 2^(−10t)))
                const num = fxRef.current!
                const bar = barRef.current!
                const t0 = performance.now()
                const step = (now: number) => {
                    const k = Math.min(1, (now - t0) / 1800)
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
                cur += (target - cur) * 0.1
                if (Math.abs(cur) < 0.01) cur = 0
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
                    const tx = inR ? dx * 0.35 : 0, ty = inR ? dy * 0.35 : 0
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
                const mv = (e: PointerEvent) => { px = e.clientX; py = e.clientY; has = true; kick() }
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
                    const r = t.getBoundingClientRect()
                    const t0 = performance.now()
                    const sweep = (now: number) => {
                        const k = Math.min(1, (now - t0) / 1600)
                        const rr = t.getBoundingClientRect()
                        px = rr.left - 40 + (r.width + 80) * k
                        py = rr.top + rr.height * 0.55
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
        const vis = new IntersectionObserver(
            (es) => {
                for (const en of es) {
                    inView = en.isIntersecting
                    if (inView) {
                        if (ch.kind === "skew") (root as any)._start?.()
                    } else {
                        cancelAnimationFrame(raf)
                        if (replay) arm()
                    }
                }
            },
            { threshold: 0 }
        )
        // 再生の合図（画面の下18%を除いた帯に入ったら＝ちゃんと目に入る位置で再生する）
        const go = new IntersectionObserver(
            (es) => {
                for (const en of es) {
                    if (!en.isIntersecting) continue
                    inView = true
                    if (replay && armed) play()
                    if (ch.kind === "magnetic") (root as any)._start?.()
                }
            },
            { threshold: 0, rootMargin: "0px 0px -18% 0px" }
        )
        vis.observe(root)
        go.observe(root)
        return () => {
            vis.disconnect()
            go.disconnect()
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
              onPointerDown: () => { const t = tRef.current; if (t) { t.style.transition = "transform .05s ease-out, background-color .05s ease-out, color .05s ease-out"; t.style.transform = "translateY(.125em) scale(.97)"; t.style.background = fgRef.current; t.style.color = bgRef.current } },
              onPointerUp: () => { const t = tRef.current; if (t) { t.style.transition = "transform .2s ease-out, background-color .2s ease-out, color .2s ease-out"; t.style.transform = "none"; t.style.background = ""; t.style.color = "" } },
              onPointerLeave: () => { const t = tRef.current; if (t) { t.style.transition = "transform .2s ease-out, background-color .2s ease-out, color .2s ease-out"; t.style.transform = "none"; t.style.background = ""; t.style.color = "" } },
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
                justifyContent: justify,
                fontFamily: JP,
                fontWeight: 700,
                fontSize: fs,
                lineHeight: 0.92,
                letterSpacing: "-0.045em",
                color: fg,
                scrollMarginTop: sp ? 112 : 72,
                // split のマスク（章名 Text に descender は無いので余白は取らない＝下に待機中の字の頭が覗かない）
                overflow: ch.kind === "split" ? "hidden" : undefined,
            }}
        >
            <span style={SR}>{c.label} — {c.ja}</span>
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
            <span style={{ color: sub }}>この扉の動き</span>
            <span style={{ fontFamily: JP, fontWeight: 700, fontSize: sp ? 12 : 13, letterSpacing: "0.02em" }}>{ch.demo.ja}</span>
            <span>{ch.demo.slug}</span>
            {!sp ? <span style={{ color: sub }}>{ch.demo.params}</span> : null}
            <span aria-hidden>↗</span>
        </a>
    )

    return (
        <header
            ref={rootRef}
            className={"mdx-door " + ch.tone}
            style={{
                background: dark ? ink : paper,
                color: fg,
                borderTop: dark ? undefined : `1px solid ${ink}`,
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
                    <p style={{ margin: 0, fontFamily: JP, fontSize: sp ? 14 : 16, lineHeight: 1.7, letterSpacing: "0.03em", color: fg, maxWidth: 420, textAlign: ch.align === "right" && !sp ? "right" : "left" }}>{ch.line}</p>
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

    // 章ごとの並び。chapter を渡さない（検索結果）ときは従来どおり均一の3列／2列
    const layoutFor = (key?: string) => {
        const g = key ? CHAPTERS[key]?.grid : undefined
        if (!g) return { n: cols, bigs: [] as { i: number; side: "L" | "R" }[], row: false, size: "m" as const, wide: false }
        const n = sp ? g.sp : w < 900 ? Math.min(g.pc, 2) : w < 1100 ? Math.min(g.pc, 3) : g.pc
        return { n, bigs: g.bigs || [], row: g.row === "all" || (g.row === "sp" && n === 1), size: g.size, wide: g.row === "all" }
    }

    const Grid = ({ items, chapter }: { items: Entry[]; chapter?: string }) => {
        const L = layoutFor(chapter)
        const base = BASE[L.n] || L.n
        const U = base / L.n
        // 大判：3列以上は2列×2行、2列では全幅1行、1列では無し
        const bigAt = new Map<number, "L" | "R">()
        if (L.n >= 2 && !L.row) for (const b of L.bigs) if (b.i < items.length) bigAt.set(b.i, b.side)
        const extra = L.n >= 3 ? 3 : 1
        const slots = items.length + bigAt.size * extra
        // 最終行が1〜2枚だけ残ると右が空いて見えるので、残りの枚数で幅を割り直す（独立レビュー3）
        const r = slots % L.n
        const small = L.size === "s"
        return (
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${base}, minmax(0, 1fr))`,
                    gridAutoFlow: "row dense",
                    columnGap: sp ? 12 : small ? 20 : L.n === 2 ? 40 : 28,
                    rowGap: sp ? (L.row ? 20 : 28) : small ? 32 : L.n === 2 ? 64 : 44,
                    padding: `${sp ? 20 : 40}px ${gutter}px 8px`,
                    maxWidth: 1680,
                    margin: "0 auto",
                    boxSizing: "border-box",
                    width: "100%",
                    alignItems: "start",
                }}
            >
                {items.map((e, k) => {
                    const side = bigAt.get(k)
                    const big = side !== undefined
                    const tail = r && !big && k >= items.length - r && base % r === 0 ? r : 0
                    let span = big ? (L.n >= 3 ? U * 2 : base) : U
                    if (tail) span = base / tail
                    const wideRow = (tail === 1 && L.n > 1) || L.row
                    const start = big && side === "R" && L.n >= 3 ? `${base - U * 2 + 1} / span ${span}` : `span ${span}`
                    return (
                        <div key={e.slug} style={{ gridColumn: start, gridRow: big && L.n >= 3 ? "span 2" : undefined, minWidth: 0 }}>
                            <Card e={e} ink={ink} muted={muted} accent={accent} hoverable={hoverable} reduced={reduced} isStatic={isStatic} sp={sp} big={big && L.n >= 3} row={wideRow} wide={L.wide && !tail} size={L.size} />
                        </div>
                    )
                })}
            </div>
        )
    }

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
.mdx-card.row.wide{grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:24px}
@media (max-width: 639px){.mdx-card.row.wide{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:14px}}
.mdx-card .ph{position:relative;display:block;width:100%;aspect-ratio:16/9;border-radius:8px;overflow:hidden;background:#0B0B0A;isolation:isolate}
.mdx-card .ph img,.mdx-card .ph video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.mdx-card .ph video{opacity:0;transition:opacity .18s}
.mdx-card .ph video.on{opacity:1}
.mdx-card .nm{transition:box-shadow .2s}
.mdx-card:hover .nm{box-shadow:inset 0 -0.42em 0 ${accent}}
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
.mdx-credit{transition:opacity .2s}
.mdx-credit:hover{opacity:.72}
.mdx-credit:focus-visible{outline:2px solid ${accent};outline-offset:4px}
.mdx-door.light .mdx-credit:focus-visible{outline-color:${ink}}
@media (prefers-reduced-motion: reduce){.mdx-card .ph video{transition:none}.mdx-card .lf,.mdx-card .tx{transition:none;transform:none!important}}
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
                    {filtered.length ? (
                        // 1カテゴリの絞り込み（検索なし）はその章の並びを使う。検索中は均一の並び
                        Grid({ items: filtered, chapter: !searching && activeCat !== "all" ? activeCat : undefined })
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
                CATS.map((c, i) => {
                    const items = entries.filter((e) => e.category === c.key)
                    if (!items.length) return null
                    const ch = CHAPTERS[c.key]
                    return (
                        <section key={c.key} aria-labelledby={"cat-" + c.key} style={{ paddingBottom: sp ? Math.round(ch.after * 0.5) : ch.after }}>
                            {/* 扉はフックを持つので要素として描く（関数呼び出しにすると件数0→196でフックの数が変わる） */}
                            <Door
                                c={c} n={items.length} idx={i} ink={ink} paper={paper} muted={muted} accent={accent} w={w} sp={sp} gutter={gutter}
                                reduced={reduced} hoverable={hoverable} isStatic={isStatic}
                            />
                            {Grid({ items, chapter: c.key })}
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
    wide?: boolean // 横長カード（文字の章：見本が読める大きさのポスター＋説明）
    size?: "s" | "m" | "l"
}

function Card({ e, ink, muted, hoverable, reduced, isStatic, sp, big, row, wide, size = "m" }: CardProps) {
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
        <a ref={boxRef} className={"mdx-card" + (row ? " row" : "") + (wide ? " wide" : "")} data-slug={e.slug} href={"/entries/" + e.slug} title={`${e.nameJa} — ${sentence(e.nameEn)}`} {...hov}>
            <span className="lf">
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
            </span>
            <span className="tx" style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                <span
                    className="nm"
                    style={{
                        alignSelf: "flex-start",
                        maxWidth: "100%",
                        fontFamily: JP,
                        fontSize: big ? 24 : sp ? 13.5 : size === "l" ? 20 : size === "s" ? 14 : 16,
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
                {(big || row || size === "l") && !(sp && row) ? (
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

// ── カード→詳細のつながる遷移（旧 CardMorph.tsx。Framer のコードファイル間 import が型チェックで解決できなかったので同じファイルに置く）──
// 一覧カード → 詳細ページの「つながる遷移」（2026-10-25）
//
// 旧版の問題：カードは素の <a> で、クリックするとフルのページ読み込み。白い画面が約250ms出て、
// 着地後にデモ枠が組み替わるのが見えた（レビュー指摘）＝一覧と詳細が別のサイトに見える。
//
// やること：カードの絵（ポスター／再生中なら今のコマ）を fixed の板に載せ、
// 「詳細ページのデモ枠が出る位置」まで伸ばす。同時に背景を生成りで覆う。伸び切ったら location.assign。
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

function breakpoint(vw: number): "d" | "t" | "p" {
    return vw >= 1200 ? "d" : vw >= 810 ? "t" : "p"
}

// 縦位置の実測表（2026-10-25・本番相当プレビュー・195件）。"slug:PC.SP" で、値は y-400（整数px）。
//   PC = 1440幅（1200以上はどの幅でも同じ値になる＝見出しの欄が固定幅）／SP = 390幅
//   タブレット（810〜1199）は PC から -8（12件で実測：-8が10件、-4.6/-2.7が各1件）
// 作り直し：/Users/shitoryota/projects/motion-dict-v2-blind/aww/r1/morph/measure_all.cjs → ytable.txt
const Y_TABLE =
    "underline-reveal:72.75 text-scramble:72.70 spotlight-hover:72.70 fill-hover:72.80 lift-hover:72.96 " +
    "directional-hover:101.117 focus-dim:72.70 custom-cursor:72.70 border-draw:72.87 magnetic-hover:72.70 " +
    "image-trail:101.80 text-slide-swap:98.67 glitch-hover:101.87 hover-wave:72.87 hover-preview:101.110 " +
    "tilt:122.162 image-swap-hover:101.104 mouse-parallax:72.75 row-expand:101.126 shadow-pop:101.138 " +
    "letter-spacing-hover:101.131 arrow-slide-through:101.108 holo-sheen:152.202 line-boil:152.213 " +
    "xray-lens:152.238 flame-flicker:152.217 perspective-reveal:98.67 scroll-fade-in:98.97 parallax:72.96 " +
    "dock-magnify:101.104 scroll-progress:72.75 text-highlight:72.70 velocity-skew:72.96 scroll-scrub:101.104 " +
    "text-on-path:101.117 sticky-pin:72.80 horizontal-scroll:68.88 section-color-swap:101.121 scroll-snap:101.104 " +
    "stacking-cards:72.75 cube-roll:101.146 header-shrink:72.75 smooth-scroll:101.87 scroll-zoom:72.80 " +
    "header-hide-on-scroll:72.101 header-invert:101.117 scroll-spy:72.80 footer-reveal:101.80 rubber-band:101.117 " +
    "split-text-reveal:72.70 progressive-blur:152.133 block-reveal:101.110 typewriter:72.87 blur-reveal:72.87 " +
    "scroll-marquee:98.117 word-rotate:72.70 outline-fill:72.75 gradient-shine:98.97 number-roll:101.117 " +
    "wave-text:72.87 tracking-in:101.96 marquee:72.96 color-wave:101.87 text-flip:72.80 counter:101.87 " +
    "split-flap:101.104 opening-crawl:101.91 rotating-badge:72.110 marker-line:101.117 sliced-text:122.114 " +
    "crossfade:101.117 curtain-wipe:101.146 cover-transition:101.100 gradient-wipe:101.130 gradient-morph:101.150 " +
    "circle-reveal:101.110 crt-power-off:152.202 menu-reveal:101.110 weight-morph:101.138 shutter-transition:98.97 " +
    "zoom-through:101.155 split-screen:72.87 shared-element:101.169 image-zoom-hover:101.110 counter-scale:101.125 " +
    "ken-burns:101.126 duotone-hover:101.104 blur-load:101.126 rack-focus:101.139 mosaic-reveal:101.110 " +
    "quadtree-reveal:98.147 before-after:101.110 clip-reveal:101.110 lightbox:101.117 carousel:101.139 " +
    "cover-flow:152.187 drag-scroll:98.117 card-shuffle:101.110 image-parallax-hover:98.97 logo-marquee:101.126 " +
    "marching-ants:101.160 barber-pole:152.173 grain-overlay:101.110 blob-morph:101.126 corner-brackets:152.158 " +
    "scanlines:101.146 god-rays:101.139 fog-drift:101.176 moire-drift:101.146 line-draw:101.140 twinkle:152.187 " +
    "snowfall:152.173 liquid-distortion:152.183 ascii-effect:101.100 halftone:101.126 frosted-glass:101.70 " +
    "gradient-border:98.97 animated-beam:152.238 sprite-sheet:101.147 notched-corner:152.173 tab-indicator:101.104 " +
    "stepper:101.110 gooey-effect:101.110 story-progress:101.121 dot-pagination:147.180 radial-carousel:72.96 " +
    "dither-dissolve:152.164 bounce-in:101.126 modal-pop:101.117 squash-stretch:98.117 spring-easing:72.91 " +
    "drawer-slide:101.110 accordion:101.146 pill-expand:72.112 ruler-scrubber:131.176 toggle-switch:101.117 " +
    "checkbox-check:175.153 star-rating:152.213 bar-chart-grow:101.167 equalizer-bars:131.140 ripple-tap:101.141 " +
    "theme-toggle-transition:98.147 tooltip-pop:101.75 gauge-meter:181.202 press-feedback:101.100 " +
    "toast-slide:101.126 stamp-in:101.126 stateful-button:152.183 copy-to-clipboard:176.210 like-burst:152.188 " +
    "prize-wheel:152.187 scratch-card:152.194 floating-reactions:224.151 gift-box-reveal:181.183 " +
    "fly-to-cart:101.140 drop-zone:101.117 paper-crumple:152.194 swipe-dismiss:152.158 chat-sequence:181.218 " +
    "list-add-remove:147.180 confetti-burst:101.117 sticker-peel:152.194 flip-card:101.117 floating-label:101.100 " +
    "password-strength:176.210 dropdown-reveal:98.126 expanding-search:101.160 morphing-dropdown:175.162 " +
    "ai-orb:181.268 menu-toggle:101.167 error-shake:101.146 gesture-hint:152.158 page-turn:101.176 " +
    "scroll-cue:152.194 breathing-glow:152.217 hint-nudge:72.96 pulse-ring:72.96 ambient-float:72.91 " +
    "eye-blink:152.192 orbit:152.238 pendulum-swing:152.173 flicker-on:101.167 dvd-bounce:101.146 " +
    "conic-sweep:101.126 motion-path:152.152 preloader-counter:98.97 loading-bar:101.80 spinner-ring:72.87 " +
    "dots-pulse:72.96 circular-progress:101.104 skeleton-shimmer:101.110 spiral-reveal:152.138 liquid-fill:101.117 " +
    "boot-sequence:131.169 stagger-grid:101.126"
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
    d: [501, 552],
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
            c.animate([{ opacity: 1 }, { opacity: 1, offset: 0.1 }, { opacity: 0 }], { duration: DUR * 0.45, easing: "linear", fill: "forwards" })
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
    const go = () => {
        if (gone) return
        gone = true
        window.location.assign(url.href)
    }
    // 着地の読み込みを少しでも前に出す：伸び始めと同時に次のページの HTML を取りに行く
    try {
        const l = document.createElement("link")
        l.rel = "prefetch"
        l.href = url.href
        document.head.appendChild(l)
    } catch {}
    void fade
    setTimeout(go, DUR + 16)
}
