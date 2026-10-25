import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

// 詳細ページの見出し（h1）。CMS の Name JA / Name EN / Slug / Params JSON をバインドして使う（SSRで本文に出る）。
//
// 旧版の問題：項目名がそのまま76pxで流れ、「テーマ切替トランジシ／ョン」「メータ／ー」のように
// 小書き文字や長音が行頭に落ちていた。項目名は「本名（言い換え）」の形が多いので、
//  ・括弧の前＝見出し語（大）／括弧の中＝言い換え（小・次の行）に分ける
//  ・文字種の切れ目で語に分けて <wbr> を入れ、語の途中で折らない
//  ・字数で段階的に縮める（見出し語が長いほど小さく）
//
// 2026-10-25（Awwwards 2周目）見出しが、その項目の動きを演じる。
//  FV の見出し（HeroLive）と章扉で宿っていた「辞典の言葉が、このサイト自身の文字で実演される」を196ページに広げる。
//  ・対応表 SPEC（slug → 演技）を3段階で持つ：
//    A＝文字にそのまま当てはまる項目は、その動きそのものを h1 で演じる
//    B＝文字に移せる近い型がある項目は、その仕組みを文字に移す（ken-burns→ゆっくり拡大しながら流れる 等）
//    C＝どうしても文字にならない項目は、その章の章扉と同じ演技（MotionDictionaryV2 の章扉）
//    表に無い新項目は C に落ちる（壊れない）
//  ・演技の数値はその項目の params の現在値。EntryLab がスライダーを離したとき window へ "md:lab" を出し、
//    ここで受けて演じ直す（動かしている最中は演じない）
//  ・いつ：着地して見出しが見えたら1回／スライダーを離したとき／見出しにホバー（PC）・タップ（SP）。
//    吸い付き等のホバー系はホバー中ずっと
//  ・最後は必ず素の h1 に戻る（演技は transform / opacity / clip-path と、レイアウトに触れない塗りだけ）
//  ・SSR とクライアント初回は同じ HTML（文字の分割は正規表現と Array.from だけ。Intl.Segmenter は使わない）
//  ・reduced-motion では演じない。画面外では動かさない
//
// 2026-10-25（Awwwards 3周目）
//  ・右上のラベル：slug が決まるまで名前を出さない（SSR は場所だけ）。URL からは paint 前に取る。
//    旧版は SSR に slug が無く「分割テキストリビール」と描いてから正しい名前に変わっていた（196件中195件）
//  ・着地の開始：ページ全体の書体（Noto Sans JP 全体 約2.2MB）を待たず、見出し語の字だけの切り出し（数KB・SSR で preload）を待つ。
//    値の定義が届く前に空の値で演じて、届いた後にもう一度演じていたのも直した（着地は slug ごとに1回）
//  ・着地の1回目だけ実演値（秒は最長1.6秒・ken-burns の倍率は2倍）。ラベルの数値は本来の値のまま
//  ・カードから来た時は、生成りの地が溶け始めてから演じる（地の下で演じ終わっていた）
//  ・scratch-card：斜めのジグザグで削って三角の膜が残っていた → 行ごとに横へ削り、しきい値で残りを消す
//
// 2026-10-25（Awwwards 4周目・指摘1「見出しの演技が壊れて見える」）
//  ・規則：どの演技も 0.8秒以内に素の見出しを一度通り、見出しの半分以上が消えている時間は 0.5秒まで、最後は素の見出しで止まる。
//    機械の判定＝aww/r4/detail/test/judge.cjs（PC/SP×196件×着地とスライダー解放。画面のコマを素の見出しと画素で比べる）
//  ・FIT（演技の枠）：lead＝素の姿で 180ms 止まってから動く／上限＝長い演技は再生を速めて収める。表に無い項目も、
//    1コマ目が素の姿なら lead を付ける（restAtStart）。追う系の横切り・スクロール系の擬似スクロールも lead の後に動く
//  ・magnetic：字の変位は 0.15em まで（ぶつかって読めなかった）／ken-burns：拡大 1.04 まで・切り抜かない（頭の字が切れた）
//  ・dither：素の字→粒（密度は4割まで）→素の字。字の透明は rAF の中で決める（全ページ撮影で H1 が無かった）
//  ・scratch：膜は字の上に降りてから削る（1コマ目から膜で隠れていた）／curtain：帯が覆う間だけ隠れる（伸びる前から消えていた）
//  ・切り抜きで現れる演技は、字のある範囲で閉じる（枠の % だと短い見出しは約20msで全部開いていた）
//  ・marquee：字の幅の中で回る帯（同じ語が後ろから続く）／輪（rotating-badge 等）・奥へ流れる・投げる・沈める系は量か時間を詰めた
//  ・章扉と同じ演技（C）は値の定義が後から届いても張り直さない（着地の演技が約50msで消されていた）
//  ・SP の右上のラベル：値を2行目に出す（「durati…」で切れていた）

interface Param {
    key: string
    label: string
    min: number
    max: number
    step: number
    default: number
    options?: string[]
}
type V = Record<string, number>

interface Props {
    nameJa: string
    nameEn: string
    slug?: string
    paramsJson?: string
    category?: string
    base?: string
    ink: string
    muted: string
    accent?: string
    paper?: string
    style?: CSSProperties
}

const MONO =
    '"Geist Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
const JP = '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif'
const EVT = "md:lab"

function split(name: string): [string, string] {
    const m = (name || "").match(/^(.+?)[（(](.+)[）)]\s*$/)
    return m ? [m[1].trim(), m[2].trim()] : [name || "", ""]
}
// 文字種の切れ目（漢字／ひらがな／カタカナ／英数）で語に分ける。Intl.Segmenter は Framer のサーバー描画に無く、
// サーバーは <wbr> なし・ブラウザは <wbr> ありで HTML が食い違い、hydration エラー（#425）を出していた。
// 同じ規則で両方が同じ HTML を出すよう、正規表現だけで切る
function words(s: string): string[] {
    const segs = s.match(/[一-鿿々]+|[ぁ-ゟ]+|[゠-ヿー]+|[A-Za-z0-9]+|\s+|./gu) || [s]
    // 助詞・記号・小書き/長音は前の語にくっつける（行頭に来させない）。漢字＋送り仮名も1語にする
    const out: string[] = []
    for (const g of segs) {
        const prev = out[out.length - 1]
        if (out.length && (/^([ぁ-ゖ]{1,2}|[、。・）」』！？ー〜ァィゥェォッャュョヮ]+|\s+)$/.test(g) || (/^[ぁ-ゖ]+$/.test(g) && /[一-鿿々]$/.test(prev)))) out[out.length - 1] += g
        else out.push(g)
    }
    return out
}
function phrases(s: string): ReactNode[] {
    return words(s).flatMap((t, i) => (i ? [<wbr key={"w" + i} />, t] : [t]))
}
// 見出し語：語（.mdt-p）＞文字（.mdt-c）。語は折り返さない塊、語の間に <wbr>（＝語の途中で折れない）
function charPhrases(s: string): ReactNode[] {
    return words(s).flatMap((t, i) => {
        const node = (
            <span key={"p" + i} className="mdt-p">
                {Array.from(t).map((ch, j) => (
                    <span key={j} className="mdt-c">{ch}</span>
                ))}
            </span>
        )
        return i ? [<wbr key={"w" + i} />, node] : [node]
    })
}
function sentence(s: string) {
    return (s || "")
        .split("/")
        .map((x) => {
            const t = x.trim()
            return t.charAt(0).toUpperCase() + t.slice(1)
        })
        .join(" / ")
}
function parseParams(json?: string): Param[] {
    if (!json) return []
    try {
        const v = JSON.parse(json)
        return Array.isArray(v) ? v : []
    } catch {
        return []
    }
}
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
// "duration(1枚めくる時間 s)" → "s"
function unitOf(label: string): string {
    const m = label.match(/[(（][^)）]*?\s(px|ms|s|%|deg|°|em|fps)[)）]\s*$/)
    return m ? (m[1] === "deg" ? "°" : m[1]) : ""
}
function keyOf(label: string): string {
    const m = label.match(/^([^(（]+)/)
    return m ? m[1].trim() : label
}
function slugFromLocation(): string {
    if (typeof window === "undefined") return ""
    const m = window.location.pathname.match(/\/entries\/([^/?#]+)/)
    return m ? decodeURIComponent(m[1]) : ""
}
// クライアントでは描画の前（paint 前）に走る effect。サーバーでは useEffect（警告を出さない）
const useIsoLayout = typeof window !== "undefined" ? useLayoutEffect : useEffect

// ── 見出し語の書体（2026-10-25 Awwwards 3周目）──
// 公開サイトの Noto Sans JP は全グリフ入りの1ファイル（700・約2.2MB）で、初回は読み込みに約2.3秒かかる（実測）。
// 旧版は document.fonts.ready を待ってから演じたので、着地の演技が見出しの表示から約2秒遅れていた。
// 見出し語の字だけを Google Fonts の text= で切り出し（数KB）、別名 "mdt-head" で登録する。字形は同じ Noto Sans JP 700
// ＝後から全体の書体が届いても見た目は変わらない。全体の書体が既に読めている時（一覧から来た時）は取りに行かない
const HEAD_FAM = "mdt-head"
const headFonts = new Map<string, Promise<void>>()
function fullJpLoaded(): boolean {
    try {
        let ok = false
        ;(document as any).fonts.forEach((f: FontFace) => {
            if (f.family.replace(/["']/g, "") === "Noto Sans JP" && String(f.weight) === "700" && f.status === "loaded") ok = true
        })
        return ok
    } catch {
        return false
    }
}
// 切り出しの CSS の URL。SSR でも同じ文字列になる（Set の並びは挿入順・sort は符号順＝環境で変わらない）＝SSR で preload できる
// 空白（U+20）を必ず入れる：ブラウザは「空白を持つ最初の書体」を要素の主書体とみなし、主書体が読み込み待ち（block）だと
// 字を持っている書体があっても文字列ごと透明にする（Chrome で実測。空白抜きだと全体の書体が届くまで見出しが消えていた）
function headCssUrl(text: string): string {
    const chars = Array.from(new Set(Array.from(" " + text.replace(/\s+/g, "")))).sort().join("")
    return chars.trim() ? `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(chars)}&display=block` : ""
}
function loadHeadFont(text: string): Promise<void> {
    if (typeof window === "undefined" || typeof FontFace === "undefined" || !(document as any).fonts) return Promise.resolve()
    const url = headCssUrl(text)
    if (!url) return Promise.resolve()
    let p = headFonts.get(url)
    if (!p) {
        // SSR の <link rel=preload as=fetch> と同じ要求（cors・credentials same-origin）＝読み込み済みを使い回す
        p = fetch(url)
            .then((r) => (r.ok ? r.text() : ""))
            .then((css) => {
                const faces = css.match(/@font-face\s*\{[^}]*\}/g) || []
                return Promise.all(
                    faces.map((b) => {
                        const u = b.match(/url\(([^)]+)\)/)
                        if (!u) return null
                        const ur = b.match(/unicode-range:\s*([^;]+);/)
                        const ff = new FontFace(HEAD_FAM, `url(${u[1]}) format("woff2")`, { weight: "700", style: "normal", ...(ur ? { unicodeRange: ur[1].trim() } : {}) } as any)
                        return ff.load().then((x) => { (document as any).fonts.add(x) })
                    })
                )
            })
            .then(() => {})
            .catch(() => {})
        headFonts.set(url, p)
    }
    return p
}

// ── 着地の1回目だけの「実演値」（2026-10-25 Awwwards 3周目）──
// ken-burns（片道12秒・1.15倍）は、着地から3秒見ても見出しが動いて見えなかった（レビュー指摘）。
// 着地の1回目だけ、秒の値を最長1.6秒に縮め、ken-burns 型の小さい倍率は見出しで見える量に広げて演じる。
// スライダーを離した時・ホバー・タップは本来の値。右上の数値表示はずっと本来の値（実演値は表示しない）
const DEMO_MAX_S = 1.6
const DEMO_AMP: Record<string, (v: V) => V> = {
}
function demoValues(slug: string, params: Param[], v: V): V {
    const o: V = { ...v }
    for (const p of params) {
        const u = unitOf(p.label)
        const x = o[p.key]
        if (typeof x !== "number" || p.options) continue
        if (u === "s" && x > DEMO_MAX_S) o[p.key] = DEMO_MAX_S
        else if (u === "ms" && x > DEMO_MAX_S * 1000) o[p.key] = DEMO_MAX_S * 1000
    }
    return DEMO_AMP[slug] ? DEMO_AMP[slug](o) : o
}

// カード→詳細の地（MotionDictionaryV2 の morphAndGo が body に置く .md-morph-layer のうち、絵を持たない全面の生成り）が
// 消えるまで待つ。Framer のルーターで移ると地と板は文書をまたいで残り、EntryLab が板が伸び切った時に地を溶かす。
// 地の下で演じても見えないので、地が溶け始める（EntryLab が data-leaving を付ける）か消えるまで待つ。
// 溶け始めと同時に演じる＝見出しが素の姿で一度見えてから消えて現れ直す、という二度見えが出ない（板＝デモ枠の上の絵は見出しに重ならないので待たない）
function morphLayersGone(maxMs: number): Promise<void> {
    const veil = () => Array.from(document.querySelectorAll(".md-morph-layer")).some((n) => n.childElementCount === 0 && !n.hasAttribute("data-leaving"))
    return new Promise((res) => {
        if (typeof document === "undefined" || !veil()) return res()
        const mo = new MutationObserver(() => { if (!veil()) { mo.disconnect(); clearTimeout(t); res() } })
        mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-leaving"] })
        const t = setTimeout(() => { mo.disconnect(); res() }, maxMs)
    })
}

/* ================================================================== */
/* 演技の部品                                                           */
/* ================================================================== */

const EXPO = "cubic-bezier(0.16, 1, 0.3, 1)"
const OUT = "cubic-bezier(0.22, 1, 0.36, 1)"
const INOUT = "cubic-bezier(0.76, 0, 0.24, 1)"
const BACK = "cubic-bezier(0.34, 1.56, 0.64, 1)"
const EIO = "cubic-bezier(0.65, 0, 0.35, 1)"

type Box = { x: number; y: number; w: number; h: number }
interface Ctx {
    root: HTMLElement // 見出し語の箱（position:relative・動かさない。重ねる層の親）
    txt: HTMLElement // 見出し語の本体（まとめて動かすときはこれ）
    chars: HTMLElement[]
    words: HTMLElement[]
    lineOf: Map<HTMLElement, number>
    nLines: number
    fs: number
    W: number
    H: number
    tb: Box // 文字が実際にある範囲
    ink: string
    paper: string
    muted: string
    accent: string
    en: string
    box: (el: HTMLElement) => Box
    a: (el: Element, kf: Keyframe[], o: KeyframeAnimationOptions) => Animation
    fx: (css: string, tag?: string) => HTMLElement
    ghost: (color?: string) => HTMLElement
    textGhost: (s: string, css?: string) => HTMLElement
    later: (fn: () => void, ms: number) => void
    loop: (fn: (t: number) => boolean) => void
    setText: (el: HTMLElement, s: string) => void
    lock: (els: HTMLElement[]) => void
    rootStyle: (css: Record<string, string>) => void
}
interface Hold { hold: true; ms: number }
interface Follow { kind: "f"; move: (x: number, y: number) => void; leave: () => void; tick: () => boolean }
interface Scroll { kind: "s"; push: (vel: number, off: number) => void; tick: () => boolean }
type R = number | Hold | Follow | Scroll | void

const K = (c: Ctx, px: number, base = 40) => (px * c.fs) / base
const S = (s: number) => s * 1000

function seeded(n: number, seed = 7): number[] {
    const a = Array.from({ length: n }, (_, i) => i)
    let x = seed
    for (let i = n - 1; i > 0; i--) {
        x = (x * 9301 + 49297) % 233280
        const j = Math.floor((x / 233280) * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    const r: number[] = []
    a.forEach((v, i) => (r[v] = i))
    return r
}
function rnd(seed: number) {
    let x = seed
    return () => {
        x = (x * 9301 + 49297) % 233280
        return x / 233280
    }
}
type Ord = "seq" | "rev" | "center" | "random" | "line" | "diag" | "col"
function orderOf(c: Ctx, els: HTMLElement[], mode: Ord = "seq"): number[] {
    const n = els.length
    if (mode === "rev") return els.map((_, i) => n - 1 - i)
    if (mode === "center") return els.map((_, i) => Math.abs(i - (n - 1) / 2))
    if (mode === "random") return seeded(n, 11)
    const ln = els.map((e) => c.lineOf.get(e) ?? lineOfBox(c, e))
    const first: Record<number, number> = {}
    els.forEach((_, i) => { if (first[ln[i]] == null) first[ln[i]] = i })
    if (mode === "line") return ln
    if (mode === "col") return els.map((_, i) => i - first[ln[i]])
    if (mode === "diag") return els.map((_, i) => i - first[ln[i]] + ln[i] * 2)
    return els.map((_, i) => i)
}
function lineOfBox(c: Ctx, e: HTMLElement) {
    const b = c.box(e)
    return Math.max(0, Math.round((b.y - c.tb.y) / (c.H / Math.max(1, c.nLines))))
}

// 単位ごとに同じ型の keyframes を、順番の遅れ付きで当てる（大半の演技はこれ）
function each(c: Ctx, p: { u?: "c" | "w"; kf: (i: number, n: number, el: HTMLElement) => Keyframe[]; dur: number; st?: number; ord?: Ord; ease?: string; origin?: string; comp?: CompositeOperation }): number {
    const els = p.u === "w" ? c.words : c.chars
    const o = orderOf(c, els, p.ord)
    let end = 0
    els.forEach((el, i) => {
        if (p.origin) el.style.transformOrigin = p.origin
        const d = o[i] * (p.st || 0)
        c.a(el, p.kf(i, els.length, el), { duration: p.dur, delay: d, easing: p.ease || "linear", composite: p.comp })
        end = Math.max(end, d + p.dur)
    })
    return end
}
// 見出し語ぜんぶを1枚として動かす
function whole(c: Ctx, kf: Keyframe[], dur: number, ease = "linear", origin?: string, clip?: string): number {
    if (origin) c.txt.style.transformOrigin = origin
    if (clip) c.rootStyle({ clipPath: clip })
    c.a(c.txt, kf, { duration: dur, easing: ease })
    return dur
}
const CLIP_BOX = "inset(-0.25em -0.04em -0.25em -0.04em)"
// 4周目：切り抜きの「閉じた姿」を、枠（780px）ではなく字のある範囲で決める。
// 旧版は枠の % で閉じていたので、短い見出し（字が枠の左3割）では最初の約20msで全部開き、動きが見えなかった
function closedL(c: Ctx) { return `inset(-20% ${Math.round(c.W - c.tb.x + 2)}px -20% -5%)` }
function closedR(c: Ctx) { return `inset(-20% -5% -20% ${Math.round(c.tb.x + c.tb.w + 2)}px)` }
function closedC(c: Ctx) { const m = c.tb.x + c.tb.w / 2; return `inset(50% ${Math.round(c.W - m)}px 50% ${Math.round(m)}px)` }
// 文字の下から（上へ）マスクの中を通って現れる。clip-path を動きと逆に削ると、マスクが元の位置に留まって見える
function maskY(y: number) {
    return y >= 0
        ? { transform: `translateY(${y}%)`, clipPath: `inset(0% 0% ${y}% 0%)` }
        : { transform: `translateY(${y}%)`, clipPath: `inset(${-y}% 0% 0% 0%)` }
}
const MASK0 = { transform: "translateY(0%)", clipPath: "inset(0% 0% 0% 0%)" }

function pad(b: Box, c: Ctx, k = 0.08): Box {
    const e = c.fs * k
    return { x: b.x - e * 1.6, y: b.y - e, w: b.w + e * 3.2, h: b.h + e * 2 }
}
const at = (b: Box) => `left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;`

// 1行ごとの範囲（下線・マーカー等）
function lineBoxes(c: Ctx): Box[] {
    const by: Record<number, Box> = {}
    c.chars.forEach((ch) => {
        const l = c.lineOf.get(ch) || 0
        const b = c.box(ch)
        const cur = by[l]
        if (!cur) by[l] = { ...b }
        else {
            const r = Math.max(cur.x + cur.w, b.x + b.w)
            cur.x = Math.min(cur.x, b.x)
            cur.w = r - cur.x
            cur.y = Math.min(cur.y, b.y)
            cur.h = Math.max(cur.h, b.h)
        }
    })
    return Object.keys(by).map((k) => by[+k])
}

// 文字の形を canvas に描いて、マスの塗り率を読む（クアッドツリー・ハーフトーン・ディザ）
function glyphMap(c: Ctx): { w: number; h: number; data: Uint8ClampedArray } | null {
    const w = Math.ceil(c.W), h = Math.ceil(c.H)
    if (w < 2 || h < 2) return null
    const cv = document.createElement("canvas")
    cv.width = w
    cv.height = h
    const g = cv.getContext("2d", { willReadFrequently: true } as any) as CanvasRenderingContext2D | null
    if (!g) return null
    const cs = getComputedStyle(c.chars[0] || c.txt)
    g.font = `${cs.fontWeight} ${c.fs}px ${cs.fontFamily}`
    g.textBaseline = "middle"
    g.fillStyle = "#000"
    c.chars.forEach((ch) => {
        const b = c.box(ch)
        g.fillText(ch.textContent || "", b.x, b.y + b.h / 2 + c.fs * 0.04)
    })
    return { w, h, data: g.getImageData(0, 0, w, h).data }
}
function coverage(m: { w: number; data: Uint8ClampedArray }, x: number, y: number, w: number, h: number) {
    let s = 0, s2 = 0, n = 0
    const step = Math.max(1, Math.floor(Math.min(w, h) / 6))
    for (let yy = Math.floor(y); yy < y + h; yy += step)
        for (let xx = Math.floor(x); xx < x + w; xx += step) {
            const v = (m.data[(yy * m.w + xx) * 4 + 3] || 0) / 255
            s += v
            s2 += v * v
            n++
        }
    const mean = n ? s / n : 0
    return { mean, sd: n ? Math.sqrt(Math.max(0, s2 / n - mean * mean)) : 0 }
}
function overlayCanvas(c: Ctx) {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const cv = c.fx(`left:0;top:0;width:${c.W}px;height:${c.H}px;`, "canvas") as HTMLCanvasElement
    cv.width = Math.ceil(c.W * dpr)
    cv.height = Math.ceil(c.H * dpr)
    const g = cv.getContext("2d")!
    g.scale(dpr, dpr)
    return { cv, g }
}

// 減衰ばねの位置（1→0）
function springAt(t: number, k: number, d: number) {
    const w0 = Math.sqrt(k), z = d / (2 * Math.sqrt(k))
    if (z < 1) {
        const wd = w0 * Math.sqrt(1 - z * z)
        return Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t))
    }
    return Math.exp(-w0 * t) * (1 + w0 * t)
}

/* ------------------------------------------------------------------ */
/* 演技（名前付き。対応表から値を変えて呼ぶ）                             */
/* ------------------------------------------------------------------ */

const ACT = {
    // マスクの中を下から（splitText の行・語・文字）
    rise(c: Ctx, p: { u?: "c" | "w"; y?: number; dur: number; st: number; ease?: string; op?: boolean; ord?: Ord }) {
        const y = p.y ?? 115
        return each(c, {
            u: p.u, ord: p.ord, dur: p.dur, st: p.st, ease: p.ease || OUT,
            kf: () => [{ ...maskY(y), opacity: p.op ? 0 : 1 }, { ...MASK0, opacity: 1 }],
        })
    },
    // ある姿から素の姿へ（フェードイン系の汎用）
    from(c: Ctx, p: { u?: "c" | "w"; t: string; op?: number; blur?: number; dur: number; st: number; ease?: string; ord?: Ord; origin?: string }) {
        return each(c, {
            u: p.u, ord: p.ord, dur: p.dur, st: p.st, ease: p.ease || OUT, origin: p.origin,
            kf: () => [
                { transform: p.t, opacity: p.op ?? 0, ...(p.blur ? { filter: `blur(${p.blur}px)` } : {}) },
                { transform: "none", opacity: 1, ...(p.blur ? { filter: "blur(0px)" } : {}) },
            ],
        })
    },
    blur(c: Ctx, v: { blur: number; duration: number; stagger: number }) {
        const b = v.blur * (c.fs / 80)
        return each(c, {
            dur: S(v.duration), st: v.stagger, ease: "cubic-bezier(.2,.7,.2,1)",
            kf: () => [
                { filter: `blur(${b}px)`, opacity: 0, transform: `translateY(${0.12 * c.fs}px)` },
                { filter: "blur(0px)", opacity: 1, transform: "translateY(0px)" },
            ],
        })
    },
    flip(c: Ctx, v: { duration: number; perspective: number }) {
        const p = v.perspective * (c.fs / 64)
        return each(c, {
            dur: S(v.duration) * 1.2, st: 55,
            kf: () => [
                { offset: 0, transform: `perspective(${p}px) rotateX(0deg)`, transformOrigin: "50% 0%", opacity: 1, easing: "cubic-bezier(.55,0,.9,.45)" },
                { offset: 0.5, transform: `perspective(${p}px) rotateX(-90deg)`, transformOrigin: "50% 0%", opacity: 0 },
                { offset: 0.5, transform: `perspective(${p}px) rotateX(90deg)`, transformOrigin: "50% 100%", opacity: 1, easing: "cubic-bezier(.2,.9,.3,1.12)" },
                { offset: 1, transform: `perspective(${p}px) rotateX(0deg)`, transformOrigin: "50% 100%", opacity: 1 },
            ],
        })
    },
    squash(c: Ctx, v: { squash: number; stretch: number; recover: number; overshoot: number }) {
        const H = 0.22 * c.fs
        const sq = 1 - v.squash / 100, st = 1 + v.stretch / 100, ov = 1 + v.overshoot / 100
        const T = 660 + v.recover * 1000
        const pts: [number, number, number, string][] = [
            [0, 0, 1, "ease-out"], [100, 0, sq, "ease-out"], [200, -0.38 * H, st, "ease-out"], [380, -H, 1, "ease-in"],
            [560, -0.38 * H, st, "ease-in"], [660, 0, sq, "ease-out"], [660 + v.recover * 450, 0, ov, "ease-in-out"], [T, 0, 1, "linear"],
        ]
        const kf: Keyframe[] = pts.map(([t, y, sy, e]) => ({ offset: t / T, transform: `translateY(${y}px) scale(${1 / sy}, ${sy})`, easing: e }))
        return each(c, { dur: T, st: 40, origin: "50% 100%", kf: () => kf })
    },
    shake(c: Ctx, v: { amplitude: number; duration: number; shakes: number }) {
        const A = v.amplitude * (c.fs / 40)
        const N = Math.round(v.shakes) * 2
        return each(c, {
            dur: S(v.duration), st: 40, ease: "ease-out",
            kf: (i) => {
                const s = i % 2 ? 1 : -1
                const kf: Keyframe[] = [{ transform: "translateX(0px) rotate(0deg)" }]
                for (let j = 0; j < N; j++) {
                    const d = s * (j % 2 ? 1 : -1) * (1 - j / N)
                    kf.push({ transform: `translateX(${d * A}px) rotate(${d * 3}deg)` })
                }
                kf.push({ transform: "translateX(0px) rotate(0deg)" })
                return kf
            },
        })
    },
    tracking(c: Ctx, p: { spread: number; dur: number; ease: string; anchor?: "left" | "center" }) {
        const sp = p.spread * c.fs
        const n = c.chars.length
        return each(c, {
            dur: p.dur, ease: p.ease,
            kf: (i) => {
                const dx = p.anchor === "center" ? (i - (n - 1) / 2) * sp : i * sp
                return [{ transform: `translateX(${dx}px)`, opacity: 0 }, { offset: 0.6, opacity: 1 }, { transform: "translateX(0px)", opacity: 1 }]
            },
        })
    },
    // 縁取りだけになり、塗りが満ちる（background-clip:text の幅を開く）
    outline(c: Ctx, p: { dur: number; dir?: number; st?: number }) {
        const sw = Math.max(1, Math.round((c.fs / 90) * 10) / 10)
        const props: [string, string][] = [
            ["color", "transparent"], ["-webkit-text-stroke", `${sw}px ${c.ink}`], ["background-image", `linear-gradient(${c.ink}, ${c.ink})`],
            ["background-repeat", "no-repeat"], ["-webkit-background-clip", "text"], ["background-clip", "text"],
        ]
        const from = p.dir === 1 ? ["100% 0%", "0 100%"] : p.dir === 2 ? ["0% 100%", "50% 50%"] : ["0% 100%", "0 0"]
        c.chars.forEach((ch) => { props.forEach(([k, val]) => ch.style.setProperty(k, val)); ch.style.backgroundPosition = from[1] })
        return each(c, {
            dur: p.dur, st: p.st ?? 90, ease: "ease",
            kf: () => [{ backgroundSize: from[0] }, { backgroundSize: "100% 100%" }],
        })
    },
    bounce(c: Ctx, v: { height: number; bounces: number; damping: number; duration: number }) {
        const H = (v.height / 120) * 0.9 * c.fs
        const B = Math.round(v.bounces)
        const segs: { y0: number; t: number; e: string }[] = [{ y0: -H, t: Math.sqrt(H), e: "ease-in" }]
        let h = H
        for (let b = 0; b < B; b++) {
            h *= v.damping
            segs.push({ y0: 0, t: Math.sqrt(h), e: "ease-out" })
            segs.push({ y0: -h, t: Math.sqrt(h), e: "ease-in" })
        }
        const total = segs.reduce((s, x) => s + x.t, 0)
        let acc = 0
        const kf: Keyframe[] = segs.map((s) => {
            const k = { offset: acc / total, transform: `translateY(${s.y0}px)`, easing: s.e }
            acc += s.t
            return k
        })
        kf.push({ offset: 1, transform: "translateY(0px)" })
        c.chars.forEach((ch, i) => c.a(ch, [{ opacity: 0 }, { opacity: 1 }], { duration: v.duration * 150, delay: i * 32, easing: "ease-out" }))
        return each(c, { dur: S(v.duration), st: 32, kf: () => kf })
    },
    typewriter(c: Ctx, p: { speed: number; blink: number; block?: boolean }) {
        const n = c.chars.length, sp = p.speed
        c.chars.forEach((ch, i) => c.a(ch, [{ opacity: 0 }, { opacity: 0 }], { duration: (i + 1) * sp }))
        const caret = c.fx(`left:0;top:0;width:${p.block ? "0.5em" : "0.06em"};height:${c.box(c.chars[0]).h * 0.78}px;background:${c.ink};`)
        const b = (i: number) => c.box(c.chars[i])
        const gap = b(0).h * 0.05
        const xAt = (i: number) => (i === 0 ? b(0).x : b(i - 1).x + b(i - 1).w + gap)
        const yAt = (i: number) => b(Math.max(0, i - 1)).y + b(0).h * 0.11
        const typeMs = (n + 1) * sp
        const blinkMs = p.blink * 1000
        const total = typeMs + blinkMs * 1.5
        const pos: Keyframe[] = []
        for (let i = 0; i <= n; i++) pos.push({ offset: Math.min(1, (i * sp) / total), transform: `translate(${xAt(i)}px, ${yAt(i)}px)`, easing: "steps(1, end)" })
        pos.push({ ...pos[pos.length - 1], offset: 1 })
        c.a(caret, pos, { duration: total, fill: "both" })
        const t1 = typeMs / total, h = blinkMs / 2 / total
        c.a(caret, [
            { offset: 0, opacity: 1, easing: "steps(1, end)" }, { offset: t1, opacity: 1, easing: "steps(1, end)" },
            { offset: Math.min(1, t1 + h), opacity: 0, easing: "steps(1, end)" }, { offset: Math.min(1, t1 + 2 * h), opacity: 1, easing: "steps(1, end)" },
            { offset: 1, opacity: 0 },
        ], { duration: total, fill: "both" })
        return total
    },
    // 文字が別の字に化けて、順に本来の字へ確定する（scramble／counter／ascii）
    scramble(c: Ctx, p: { cs: string; lockAt: (i: number, n: number) => number; tick?: number }) {
        const pool = Array.from(p.cs)
        const n = c.chars.length
        c.lock(c.chars)
        const orig = c.chars.map((e) => e.textContent || "")
        const end = p.lockAt(n - 1, n)
        const tk = p.tick || 45
        const r = rnd(5)
        let lastF = -1
        c.loop((t) => {
            const f = Math.floor(t / tk)
            if (f !== lastF) {
                lastF = f
                c.chars.forEach((e, i) => {
                    if (!orig[i].trim()) return
                    c.setText(e, t >= p.lockAt(i, n) ? orig[i] : pool[Math.floor(r() * pool.length)])
                })
            }
            return t < end + tk
        })
        return end + tk * 2
    },
    wave(c: Ctx, p: { amp: number; period: number; cycles: number; phase?: number }) {
        const T = p.period * p.cycles
        const N = Math.max(12, p.cycles * 12)
        return each(c, {
            dur: T,
            kf: (i, n) => {
                const kf: Keyframe[] = []
                for (let k = 0; k <= N; k++) {
                    const t = k / N
                    const env = Math.sin(Math.PI * t)
                    const y = -p.amp * env * Math.sin(2 * Math.PI * (t * p.cycles - i * (p.phase ?? 0.08)))
                    kf.push({ offset: t, transform: `translateY(${y.toFixed(2)}px)` })
                }
                return kf
            },
        })
    },
    // 見出しが英名と入れ替わって戻る（word-rotate / image-swap / crossfade / flip-card）
    swapOut(c: Ctx, p: { mode: "rise" | "fade" | "wipe" | "flip"; dur: number; hold: number; zoom?: number; persp?: number }) {
        const T = p.dur * 2 + p.hold
        const a = p.dur / T, b = (p.dur + p.hold) / T
        const g = c.textGhost(c.en)
        if (p.mode === "rise") {
            c.chars.forEach((ch, i) => c.a(ch, [
                { offset: 0, ...MASK0, easing: OUT }, { offset: a, ...maskY(-110) }, { offset: b, ...maskY(110), easing: OUT }, { offset: 1, ...MASK0 },
            ], { duration: T, delay: i * 18 }))
            c.a(g, [{ offset: 0, ...maskY(110), easing: OUT }, { offset: a, ...MASK0 }, { offset: b, ...MASK0, easing: OUT }, { offset: 1, ...maskY(-110) }], { duration: T + c.chars.length * 18, fill: "both" })
        } else if (p.mode === "fade") {
            c.a(c.txt, [{ offset: 0, opacity: 1 }, { offset: a, opacity: 0 }, { offset: b, opacity: 0 }, { offset: 1, opacity: 1 }], { duration: T })
            c.a(g, [{ offset: 0, opacity: 0, transform: `scale(${p.zoom || 1})` }, { offset: a, opacity: 1, transform: "scale(1)" }, { offset: b, opacity: 1 }, { offset: 1, opacity: 0 }], { duration: T, fill: "both" })
        } else if (p.mode === "wipe") {
            c.a(g, [{ offset: 0, clipPath: "inset(0% 100% 0% 0%)", easing: EIO }, { offset: a, clipPath: "inset(0% 0% 0% 0%)" }, { offset: b, clipPath: "inset(0% 0% 0% 0%)", easing: EIO }, { offset: 1, clipPath: "inset(0% 0% 0% 100%)" }], { duration: T, fill: "both" })
            c.a(c.txt, [{ offset: 0, clipPath: "inset(0% 0% 0% 0%)", easing: EIO }, { offset: a, clipPath: "inset(0% 0% 0% 100%)" }, { offset: b, clipPath: "inset(0% 100% 0% 0%)", easing: EIO }, { offset: 1, clipPath: "inset(0% 0% 0% 0%)" }], { duration: T })
        } else {
            const pr = p.persp || 800
            const o = `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`
            c.txt.style.transformOrigin = o
            c.txt.style.backfaceVisibility = "hidden"
            g.style.backfaceVisibility = "hidden"
            g.style.transformOrigin = "50% 50%"
            c.a(c.txt, [{ offset: 0, transform: `perspective(${pr}px) rotateY(0deg)`, easing: EIO }, { offset: a, transform: `perspective(${pr}px) rotateY(180deg)` }, { offset: b, transform: `perspective(${pr}px) rotateY(180deg)`, easing: EIO }, { offset: 1, transform: `perspective(${pr}px) rotateY(0deg)` }], { duration: T })
            c.a(g, [{ offset: 0, transform: `perspective(${pr}px) rotateY(-180deg)`, easing: EIO }, { offset: a, transform: `perspective(${pr}px) rotateY(0deg)` }, { offset: b, transform: `perspective(${pr}px) rotateY(0deg)`, easing: EIO }, { offset: 1, transform: `perspective(${pr}px) rotateY(-180deg)` }], { duration: T, fill: "both" })
        }
        return T + c.chars.length * 18
    },
    // 各文字が上へ抜け、同じ字が下から入る（text-slide-swap / number-roll / header-hide）
    slideSwap(c: Ctx, p: { dur: number; st: number; up?: boolean; times?: number; ease?: string }) {
        const s = p.up === false ? -1 : 1
        const n = p.times || 1
        return each(c, {
            dur: p.dur * n, st: p.st,
            kf: () => {
                const kf: Keyframe[] = []
                for (let k = 0; k < n; k++) {
                    const o0 = k / n, o1 = (k + 0.5) / n
                    const e = n > 1 ? (k === n - 1 ? OUT : "linear") : p.ease || INOUT
                    kf.push({ offset: o0, ...MASK0, easing: e })
                    kf.push({ offset: o1, ...maskY(-110 * s) })
                    kf.push({ offset: o1, ...maskY(110 * s), easing: e })
                }
                kf.push({ offset: 1, ...MASK0 })
                return kf
            },
        })
    },
    // 帯で覆って、覆いきったら反対の辺へ引く（curtain-wipe / block-reveal）
    curtain(c: Ctx, p: { dur: number; n?: number; dir?: number; pivot?: number; color?: string; hide?: boolean; barH?: number }) {
        const n = Math.max(1, Math.round(p.n || 1))
        const B = pad(c.tb, c)
        const vert = p.dir === 2
        const T = p.dur * 2 + 60
        const pv = p.pivot ?? 0.5
        for (let k = 0; k < n; k++) {
            const bh = p.barH ? B.h * p.barH : B.h
            const box = vert ? { x: B.x + (B.w / n) * k, y: B.y, w: B.w / n + 1, h: B.h } : { x: B.x, y: B.y + (B.h / n) * k + (B.h / n - bh / n) / 2, w: B.w, h: bh / n + 1 }
            const el = c.fx(at(box) + `background:${p.color || c.ink};`)
            const o1 = p.dir === 1 ? "right" : "left", o2 = p.dir === 1 ? "left" : "right"
            const sc = vert ? "scaleY" : "scaleX"
            const org1 = vert ? "50% 100%" : `${o1} center`, org2 = vert ? "50% 0%" : `${o2} center`
            c.a(el, [
                { offset: 0, transform: `${sc}(0)`, transformOrigin: org1, easing: INOUT },
                { offset: pv * (T - 60) / T, transform: `${sc}(1)`, transformOrigin: org1 },
                { offset: (pv * (T - 60) + 60) / T, transform: `${sc}(1)`, transformOrigin: org2, easing: INOUT },
                { offset: 1, transform: `${sc}(0)`, transformOrigin: org2 },
            ], { duration: T, delay: k * 70, fill: "both" })
        }
        // 4周目：字は消さない（旧版は帯が伸び始める前から字を透明にしていた＝1コマ目から見出しが無く、帯が引くまで約1.2秒消えていた）。
        // 帯が字の上を通り過ぎるだけ。隠れるのは帯が覆っている間だけ
        void p.hide
        return T + n * 70
    },
    // 細い羽根が順に閉じて開く（shutter）
    shutter(c: Ctx, p: { n: number; st: number; horiz?: boolean; dur: number }) {
        const B = pad(c.tb, c)
        const n = Math.round(p.n)
        for (let k = 0; k < n; k++) {
            const box = p.horiz ? { x: B.x, y: B.y + (B.h / n) * k, w: B.w, h: B.h / n + 1 } : { x: B.x + (B.w / n) * k, y: B.y, w: B.w / n + 1, h: B.h }
            const el = c.fx(at(box) + `background:${c.ink};`)
            const sc = p.horiz ? "scaleY" : "scaleX"
            c.a(el, [{ transform: `${sc}(0)`, easing: INOUT }, { offset: 0.45, transform: `${sc}(1)` }, { offset: 0.55, transform: `${sc}(1)`, easing: INOUT }, { transform: `${sc}(0)` }], { duration: p.dur, delay: k * p.st, fill: "both" })
        }
        c.a(c.txt, [{ opacity: 1 }, { offset: 0.5, opacity: 0 }, { offset: 0.5, opacity: 1 }, { opacity: 1 }], { duration: p.dur + (n - 1) * p.st })
        return p.dur + n * p.st
    },
    // 墨の面が満ち、その上の字は生成りで読める（fill-hover / section-color-swap / theme-toggle …）。ホールド可
    fill(c: Ctx, p: { dur: number; from: "left" | "right" | "bottom" | "top" | "center" | "circle"; ox?: number; oy?: number; ease?: string; blend?: boolean }): Hold {
        const B = pad(c.tb, c)
        const panel = c.fx(at(B) + `background:${c.ink};`)
        const g = c.ghost(c.paper)
        const ox = p.ox ?? 0, oy = p.oy ?? 0
        const closed =
            p.from === "left" ? "inset(0% 100% 0% 0%)" : p.from === "right" ? "inset(0% 0% 0% 100%)" : p.from === "bottom" ? "inset(100% 0% 0% 0%)"
            : p.from === "top" ? "inset(0% 0% 100% 0%)" : p.from === "center" ? "inset(0% 50% 0% 50%)" : `circle(0% at ${ox}px ${oy}px)`
        const open = p.from === "circle" ? `circle(150% at ${ox}px ${oy}px)` : "inset(0% 0% 0% 0%)"
        const gClosed = p.from === "circle" ? `circle(0px at ${ox}px ${oy}px)` : closed
        const gOpen = p.from === "circle" ? `circle(${Math.hypot(c.W, c.H) * 1.2}px at ${ox}px ${oy}px)` : open
        if (p.from === "circle") {
            // 円は面の座標で開く（面と字で同じ円になるよう、面も root 座標で切る）
            panel.style.cssText += `left:0;top:0;width:${c.W}px;height:${c.H}px;`
            c.a(panel, [{ clipPath: gClosed }, { clipPath: gOpen }], { duration: p.dur, easing: p.ease || EIO, fill: "both" })
            c.a(g, [{ clipPath: gClosed }, { clipPath: gOpen }], { duration: p.dur, easing: p.ease || EIO, fill: "both" })
        } else {
            c.a(panel, [{ clipPath: closed }, { clipPath: open }], { duration: p.dur, easing: p.ease || EIO, fill: "both" })
            // 字は root 全体の座標。面の範囲 B に合わせて切る
            const toRoot = (s: string) => s.replace(/inset\(([\d.]+)% ([\d.]+)% ([\d.]+)% ([\d.]+)%\)/, (_m, t, r, b, l) =>
                `inset(${B.y + (B.h * +t) / 100}px ${c.W - B.x - B.w + (B.w * +r) / 100}px ${c.H - B.y - B.h + (B.h * +b) / 100}px ${B.x + (B.w * +l) / 100}px)`)
            c.a(g, [{ clipPath: toRoot(closed) }, { clipPath: toRoot(open) }], { duration: p.dur, easing: p.ease || EIO, fill: "both" })
        }
        return { hold: true, ms: p.dur }
    },
    // 切り抜きが開く（clip-reveal / circle-reveal / expanding-search …）
    clip(c: Ctx, p: { from: string; to?: string; dur: number; ease?: string; extra?: Keyframe[] }) {
        c.a(c.txt, [{ clipPath: p.from }, { clipPath: p.to || "inset(-20% -5% -20% -5%)" }], { duration: p.dur, easing: p.ease || EXPO })
        return p.dur
    },
    // 下線が伸びる（underline / tab / loading-bar / scroll-progress / preloader）。ホールド可
    underline(c: Ctx, p: { dur: number; origin?: number; th?: number; color?: string; st?: number; ease?: string; behind?: boolean; height?: number; y?: number }): Hold {
        const lines = lineBoxes(c)
        lines.forEach((L, k) => {
            const th = p.th ?? Math.max(2, Math.round(c.fs * 0.045))
            const h = p.height ? L.h * p.height : th
            const y = p.behind ? L.y + L.h * (p.y ?? 0.58) - h / 2 : L.y + L.h - th * 0.5 + (p.y ?? 0)
            const el = c.fx(`left:${L.x}px;top:${y}px;width:${L.w}px;height:${h}px;background:${p.color || c.ink};${p.behind ? "z-index:-1;" : ""}`)
            const org = p.origin === 1 ? "50% 50%" : p.origin === 2 ? "100% 50%" : "0% 50%"
            c.a(el, [{ transform: "scaleX(0)", transformOrigin: org }, { transform: "scaleX(1)", transformOrigin: org }], { duration: p.dur, delay: k * (p.st || 0), easing: p.ease || OUT, fill: "both" })
        })
        return { hold: true, ms: p.dur + lines.length * (p.st || 0) }
    },
    // 進捗：線が伸び、線の先に合わせて字の切り抜きが開く（preloader-counter / loading-bar）
    progress(c: Ctx, p: { dur: number; th?: number; reveal?: boolean; ease?: string; to?: number; segs?: number }) {
        const L = c.tb
        const th = p.th ?? Math.max(2, Math.round(c.fs * 0.04))
        const y = L.y + L.h + c.fs * 0.06
        const segs = Math.max(1, Math.round(p.segs || 1))
        const gap = segs > 1 ? c.fs * 0.06 : 0
        const sw = (L.w - gap * (segs - 1)) / segs
        for (let k = 0; k < segs; k++) {
            const track = c.fx(`left:${L.x + k * (sw + gap)}px;top:${y}px;width:${sw}px;height:${th}px;background:rgba(10,10,10,.12);`)
            const bar = c.fx(`left:${L.x + k * (sw + gap)}px;top:${y}px;width:${sw}px;height:${th}px;background:${c.ink};transform-origin:0 50%;`)
            const d = segs > 1 ? p.dur / segs : p.dur
            c.a(bar, [{ transform: "scaleX(0)" }, { transform: `scaleX(${segs > 1 ? 1 : p.to ?? 1})` }], { duration: d, delay: k * d, easing: p.ease || (segs > 1 ? "linear" : EXPO), fill: "both" })
            c.a(track, [{ opacity: 1 }, { opacity: 1 }], { duration: p.dur + 400, fill: "both" })
            c.a(bar, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, delay: p.dur, fill: "forwards" })
            c.a(track, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, delay: p.dur, fill: "forwards" })
        }
        // 字の切り抜きは線の先（字のある範囲）に合わせる（旧版は枠の % で開き、短い見出しは線より先に全部見えていた）
        if (p.reveal) { const to = p.to ?? 1; c.a(c.txt, [{ clipPath: closedL(c) }, { clipPath: to >= 1 ? "inset(-20% -5% -20% -5%)" : `inset(-20% ${Math.round(c.W - c.tb.x - c.tb.w * to)}px -20% -5%)` }], { duration: p.dur, easing: p.ease || EXPO }) }
        return p.dur + 420
    },
    // 位置を追う（magnetic）
    magnetic(c: Ctx, p: { strength: number; lerp: number; radius: number }): Follow {
        const R = Math.max(p.radius * (c.fs / 40), c.fs * 0.9)
        const ctr = c.chars.map((ch) => { const b = c.box(ch); return { x: b.x + b.w / 2, y: b.y + b.h / 2 } })
        const pos = c.chars.map(() => ({ x: 0, y: 0 }))
        let px = 0, py = 0, has = false
        return {
            kind: "f",
            move(x, y) { px = x; py = y; has = true },
            leave() { has = false },
            tick() {
                let moving = false
                c.chars.forEach((ch, i) => {
                    const dx = px - ctr[i].x, dy = py - ctr[i].y
                    const inR = has && Math.hypot(dx, dy) < R
                    // 字の変位は 0.15em まで（4周目：強さ0.35×半径252px で最大88px動き、隣の字とぶつかって読めなかった）
                    const lim = c.fs * 0.15
                    const tx = inR ? Math.max(-lim, Math.min(lim, dx * p.strength)) : 0, ty = inR ? Math.max(-lim, Math.min(lim, dy * p.strength)) : 0
                    const k = inR ? p.lerp : p.lerp * 0.7
                    pos[i].x += (tx - pos[i].x) * k
                    pos[i].y += (ty - pos[i].y) * k
                    if (Math.abs(tx - pos[i].x) > 0.1 || Math.abs(ty - pos[i].y) > 0.1) moving = true
                    ch.style.transform = `translate3d(${pos[i].x.toFixed(2)}px,${pos[i].y.toFixed(2)}px,0)`
                })
                return moving || has
            },
        }
    },
    // ポインタで1枚を傾ける・ずらす（tilt / image-parallax-hover / mouse-parallax）
    pointerTx(c: Ctx, p: { lerp: number; fn: (nx: number, ny: number, el: HTMLElement, i: number) => string; u?: "txt" | "c" | "w"; origin?: string }): Follow {
        const els = p.u === "c" ? c.chars : p.u === "w" ? c.words : [c.txt]
        if (p.origin) els.forEach((e) => (e.style.transformOrigin = p.origin!))
        let tx = 0, ty = 0, cx = 0, cy = 0, has = false
        return {
            kind: "f",
            move(x, y) { tx = Math.max(-1, Math.min(1, (x - (c.tb.x + c.tb.w / 2)) / (c.tb.w / 2))); ty = Math.max(-1, Math.min(1, (y - (c.tb.y + c.tb.h / 2)) / (c.tb.h / 2 + c.fs * 0.5))); has = true },
            leave() { has = false; tx = 0; ty = 0 },
            tick() {
                cx += (tx - cx) * p.lerp
                cy += (ty - cy) * p.lerp
                els.forEach((e, i) => (e.style.transform = p.fn(cx, cy, e, i)))
                return has || Math.abs(cx) > 0.002 || Math.abs(cy) > 0.002
            },
        }
    },
    // 近い文字ほど大きく（dock-magnify / star-rating / focus-dim）。戻りは各自の transition に任せる
    pointerEach(c: Ctx, p: { settle: number; fn: (d: number, dx: number, el: HTMLElement, i: number, has: boolean) => Record<string, string>; u?: "c" | "w" }): Follow {
        const els = p.u === "w" ? c.words : c.chars
        const ctr = els.map((e) => { const b = c.box(e); return { x: b.x + b.w / 2, y: b.y + b.h / 2 } })
        let px = -1e4, py = -1e4, has = false, leftAt = 0
        const apply = (st: Record<string, string>, e: HTMLElement) => { for (const key in st) (e.style as any)[key] = st[key] }
        return {
            kind: "f",
            move(x, y) { px = x; py = y; has = true },
            leave() {
                has = false
                leftAt = performance.now()
                els.forEach((e, i) => apply(p.fn(1e5, 1e5, e, i, false), e))
            },
            tick() {
                if (has) {
                    els.forEach((e, i) => apply(p.fn(Math.hypot(px - ctr[i].x, (py - ctr[i].y) * 1.4), px - ctr[i].x, e, i, true), e))
                    return true
                }
                return performance.now() - leftAt < p.settle
            },
        }
    },
    // 円の中だけを見せる層（spotlight / xray / custom-cursor）
    lens(c: Ctx, p: { r: number; lerp: number; soft: number; mode: "spot" | "xray" | "cursor"; blend?: string }): Follow {
        let px = c.tb.x, py = c.tb.y + c.tb.h / 2, cx = px, cy = py, has = false, o = 0
        let g: HTMLElement | null = null, disc: HTMLElement | null = null
        if (p.mode === "spot") {
            g = c.ghost()
        } else if (p.mode === "xray") {
            disc = c.fx(`left:0;top:0;width:${p.r * 2}px;height:${p.r * 2}px;border-radius:50%;background:${c.paper};box-shadow:0 0 0 1px ${c.ink};`)
            g = c.ghost("transparent")
            g.style.setProperty("-webkit-text-stroke", `${Math.max(1, c.fs / 70)}px ${c.ink}`)
        } else {
            disc = c.fx(`left:0;top:0;width:${p.r * 2}px;height:${p.r * 2}px;border-radius:50%;background:${p.blend === "normal" ? c.ink : c.paper};mix-blend-mode:${p.blend || "difference"};`)
        }
        return {
            kind: "f",
            move(x, y) { px = x; py = y; has = true },
            leave() { has = false },
            tick() {
                cx += (px - cx) * p.lerp
                cy += (py - cy) * p.lerp
                o += ((has ? 1 : 0) - o) * 0.12
                const mask = `radial-gradient(circle ${p.r}px at ${cx}px ${cy}px, #000 ${Math.round((1 - p.soft) * 100)}%, transparent 100%)`
                if (g) {
                    g.style.setProperty("-webkit-mask-image", mask)
                    g.style.setProperty("mask-image", mask)
                    g.style.opacity = String(o)
                }
                // 4周目：円の外は半分の濃さまで（旧版は 0.22 まで沈み、円の外の字が読めなかった）
                if (p.mode === "spot") c.txt.style.opacity = String(1 - o * 0.5)
                if (disc) {
                    disc.style.transform = `translate(${cx - p.r}px, ${cy - p.r}px) scale(${0.4 + o * 0.6})`
                    disc.style.opacity = String(o)
                }
                return has || o > 0.01
            },
        }
    },
    // 時間で揺れる（line-boil / flame / twinkle / equalizer / ambient-float …）。fn は t(0..1) ごとの姿
    jitter(c: Ctx, p: { dur: number; fps: number; u?: "c" | "w"; origin?: string; fn: (i: number, t: number, r: () => number) => Keyframe }) {
        const els = p.u === "w" ? c.words : c.chars
        const steps = Math.max(2, Math.round((p.dur / 1000) * p.fps))
        els.forEach((el, i) => {
            const r = rnd(17 + i * 31)
            if (p.origin) el.style.transformOrigin = p.origin
            const kf: Keyframe[] = []
            for (let k = 0; k <= steps; k++) {
                const t = k / steps
                kf.push({ offset: t, ...(k === steps ? p.fn(i, 1, () => 0.5) : p.fn(i, t, r)) })
            }
            c.a(el, kf, { duration: p.dur, easing: p.fps >= 30 ? "linear" : `steps(${steps}, end)` })
        })
        return p.dur
    },
}

/* ------------------------------------------------------------------ */
/* 章扉と同じ演技（C）。値は章扉が使っている項目の既定値                    */
/* ------------------------------------------------------------------ */

type Spec = [grade: "A" | "B" | "C", fn: ((c: Ctx, v: V) => R) | string, flags?: string, keys?: string]

const CH: Record<string, { slug: string; ja: string; label: string; flags?: string; fn: (c: Ctx) => R }> = {
    hover: { slug: "magnetic-hover", ja: "マグネティックホバー", label: "strength 0.35 · lerp 0.12", flags: "f", fn: (c) => ACT.magnetic(c, { strength: 0.35, lerp: 0.12, radius: 140 }) },
    scroll: { slug: "velocity-skew", ja: "速度スキュー", label: "factor 0.5 · max 8°", flags: "s", fn: (c) => skewAct(c, { factor: 0.5, maxSkew: 8, lerp: 0.1 }) },
    text: { slug: "split-text-reveal", ja: "分割テキストリビール", label: "stagger 30ms · 0.6s", fn: (c) => ACT.rise(c, { dur: 600, st: 30, op: true }) },
    transition: { slug: "curtain-wipe", ja: "カーテンワイプ", label: "0.8s × 2 · in-out", fn: (c) => ACT.curtain(c, { dur: 800 }) },
    media: { slug: "clip-reveal", ja: "クリップリビール", label: "0.9s · expo-out", fn: (c) => ACT.clip(c, { from: closedL(c), dur: 900 }) },
    ui: { slug: "press-feedback", ja: "プレスフィードバック", label: "scale 0.97 · 0.05s / 0.2s", fn: (c) => pressAct(c, { depth: 2, scale: 0.97, release: 0.2 }) },
    loading: { slug: "preloader-counter", ja: "プリローダーカウンター", label: "1.8s · expo-out", fn: (c) => ACT.progress(c, { dur: 1800, reveal: true }) },
}

function skewAct(c: Ctx, v: { factor: number; maxSkew: number; lerp: number }): Scroll {
    let target = 0, cur = 0
    c.txt.style.transformOrigin = "left center"
    return {
        kind: "s",
        push(vel) { target = Math.max(-v.maxSkew, Math.min(v.maxSkew, vel * v.factor)) },
        tick() {
            cur += (target - cur) * v.lerp
            target *= 0.9
            if (Math.abs(cur) < 0.01 && Math.abs(target) < 0.01) cur = 0
            c.txt.style.transform = `skewY(${cur.toFixed(2)}deg)`
            return cur !== 0 || Math.abs(target) > 0.01
        },
    }
}
function pressAct(c: Ctx, v: { depth: number; scale: number; release: number }) {
    // press-feedback：入り 0.05s で沈む → 押している間 → 戻り release（非対称）。章扉と同じく、押している間だけ地と字が反転する
    const d = (v.depth / 16) * c.fs * 0.5
    const R = S(v.release)
    const T = 50 + 260 + R
    const B = pad(c.tb, c, 0.14)
    const panel = c.fx(at(B) + `background:${c.ink};border-radius:${B.h}px;`)
    const g = c.ghost(c.paper)
    const o = `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`
    const kf: Keyframe[] = [
        { offset: 0, transform: "translateY(0px) scale(1)", easing: "ease-out" },
        { offset: 50 / T, transform: `translateY(${d}px) scale(${v.scale})` },
        { offset: 310 / T, transform: `translateY(${d}px) scale(${v.scale})`, easing: "ease-out" },
        { offset: 1, transform: "translateY(0px) scale(1)" },
    ]
    const op: Keyframe[] = [{ offset: 0, opacity: 0, easing: "ease-out" }, { offset: 50 / T, opacity: 1 }, { offset: 310 / T, opacity: 1, easing: "ease-out" }, { offset: 1, opacity: 0 }]
    ;[c.txt, g, panel].forEach((el) => { el.style.transformOrigin = o })
    panel.style.transformOrigin = "50% 50%"
    c.a(c.txt, kf, { duration: T, delay: 120 })
    c.a(g, kf, { duration: T, delay: 120, fill: "both" })
    c.a(g, op, { duration: T, delay: 120, fill: "both" })
    c.a(panel, kf, { duration: T, delay: 120, fill: "both" })
    c.a(panel, op, { duration: T, delay: 120, fill: "both" })
    return T + 140
}
function parallaxAct(c: Ctx, v: V): Scroll {
    const depth = c.words.map((_, i) => [1, 0.35, 0.7, 0.15, 0.85, 0.5][i % 6])
    const cur = c.words.map(() => 0)
    let off = 0
    return {
        kind: "s",
        push(_vel, o) { off = o },
        tick() {
            let moving = false
            c.words.forEach((w, i) => {
                // 4周目：ずれは ±0.2em に収める（旧版は最大約120pxずれて語が見出しの枠の外へ出ていた）
                const L = c.fs * 0.2
                const t = -L * Math.tanh((off * v.strength * depth[i]) / L)
                cur[i] += (t - cur[i]) * v.lerp
                if (Math.abs(t - cur[i]) > 0.05) moving = true
                w.style.transform = `translateY(${cur[i].toFixed(2)}px)`
            })
            return moving || off !== 0
        },
    }
}

/* ------------------------------------------------------------------ */
/* 対応表：slug → [段階, 演技, フラグ, 表示する値]                         */
/* フラグ f＝ポインタを追う（ホバー中ずっと）／h＝ホバー中は保つ／s＝スクロールに反応     */
/* ------------------------------------------------------------------ */

const ord3 = (o: number): Ord => (o === 1 ? "line" : o === 2 ? "col" : "diag")

const SPEC: Record<string, Spec> = {
    /* ── hover ── */
    "magnetic-hover": ["B", (c, v) => ACT.magnetic(c, { strength: v.strength, lerp: v.lerp, radius: v.radius }), "f"],
    "custom-cursor": ["B", (c, v) => ACT.lens(c, { r: K(c, v.size, 24), lerp: v.lerp, soft: 0, mode: "cursor", blend: ["normal", "difference", "exclusion"][Math.round(v.blend)] }), "f", "size,blend"],
    "tilt": ["B", (c, v) => ACT.pointerTx(c, { lerp: 0.1, origin: `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`, fn: (x, y) => `perspective(${v.perspective * (c.tb.w / 320)}px) rotateX(${(-y * v.maxAngle).toFixed(2)}deg) rotateY(${(x * v.maxAngle).toFixed(2)}deg) scale(${1 + (v.scale - 1) * Math.min(1, Math.hypot(x, y) * 3)})` }), "f", "maxAngle,perspective"],
    "text-scramble": ["A", (c, v) => ACT.scramble(c, { cs: ["ABCDEFGHIJKLMNOPQRSTUVWXYZ", "0123456789", "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ", "!<>-_\\/[]{}=+*^?#"][Math.round(v.charset)] || "ABC", lockAt: (i) => 160 + i * v.speed * 1.6 }), "", "speed,charset"],
    "underline-reveal": ["A", (c, v) => ACT.underline(c, { dur: S(v.duration), origin: v.origin }), "h"],
    "spotlight-hover": ["B", (c, v) => ACT.lens(c, { r: K(c, v.radius, 40), lerp: 0.18, soft: v.softness, mode: "spot" }), "f"],
    "fill-hover": ["B", (c, v) => ACT.fill(c, { dur: S(v.duration), from: (["left", "bottom", "center"] as const)[Math.round(v.direction)] }), "h"],
    "directional-hover": ["B", (c, v) => ACT.fill(c, { dur: S(v.duration), from: "left" }), "h"],
    "lift-hover": ["A", (c, v) => liftAct(c, v), "h"],
    "focus-dim": ["B", (c, v) => ACT.pointerEach(c, {
        u: "w", settle: S(v.duration) + 100,
        fn: (d, _dx, el, _i, has) => {
            const b = c.box(el)
            const on = has && d < Math.max(b.w / 2, c.fs * 0.6)
            // 4周目：見出しでは沈めるのは半分の濃さ・ぼかしは 0.4px まで（旧版は 0.3＋ぼかしで、横切る約1.7秒ほぼ全部の語が読めなかった）
            return { opacity: String(on || !has ? 1 : Math.max(0.5, v.dimOpacity)), filter: on || !has ? "blur(0px)" : `blur(${Math.min(0.4, K(c, v.dimBlur, 40) * 0.1).toFixed(2)}px)`, transition: `opacity ${v.duration}s, filter ${v.duration}s` }
        },
    }), "f", "dimOpacity,dimBlur"],
    "border-draw": ["B", (c, v) => borderDraw(c, v), "h"],
    "image-trail": ["B", (c, v) => trailAct(c, v), "f"],
    "glitch-hover": ["A", (c, v) => glitchAct(c, v), ""],
    "text-slide-swap": ["A", (c, v) => ACT.slideSwap(c, { dur: S(v.duration) * 1.6, st: 22, up: v.direction !== 1 }), ""],
    "hover-preview": ["B", (c, v) => previewAct(c, v), "f"],
    "hover-wave": ["A", (c, v) => each(c, { dur: S(v.duration), st: S(v.delay), ease: "ease-in-out", kf: () => [{ transform: "translateY(0px)" }, { transform: `translateY(${-K(c, v.height, 24)}px)` }, { transform: "translateY(0px)" }] }), "", "delay,height"],
    "image-swap-hover": ["B", (c, v) => ACT.swapOut(c, { mode: v.mode === 1 ? "wipe" : "fade", dur: S(v.duration) * 1.4, hold: 700 }), ""],
    "mouse-parallax": ["B", (c, v) => ACT.pointerTx(c, { u: "w", lerp: v.lerp, fn: (x, y, _e, i) => { const d = [1, 0.4, 0.75, 0.2, 0.9][i % 5] * (v.direction === 1 ? -1 : 1) * K(c, v.strength, 40); return `translate(${(x * d).toFixed(2)}px, ${(y * d * 0.6).toFixed(2)}px)` } }), "f"],
    "shadow-pop": ["A", (c, v) => shadowPop(c, v), "h", "depth,steps"],
    "row-expand": ["B", (c, v) => { c.txt.style.transformOrigin = `${c.tb.x}px ${c.tb.y + c.tb.h}px`; c.a(c.txt, [{ transform: "scale(1)" }, { transform: `scale(${1 + (v.grow - 1) * 0.35})` }], { duration: S(v.duration), easing: OUT, fill: "both" }); return { hold: true, ms: S(v.duration) } }, "h", "grow,duration"],
    "dock-magnify": ["B", (c, v) => ACT.pointerEach(c, {
        settle: S(v.duration) + 200,
        fn: (d, _dx, _e, _i, has) => { const r = K(c, v.range, 40); const k = has ? Math.max(0, 1 - d / r) : 0; const s = 1 + (v.maxScale - 1) * k * k * 0.6; return { transform: `translateY(${(-K(c, v.lift, 40) * k).toFixed(2)}px) scale(${s.toFixed(3)})`, transformOrigin: "50% 100%", transition: `transform ${v.duration}s ease-out` } },
    }), "f", "maxScale,range"],
    "cube-roll": ["A", (c, v) => cubeRoll(c, v), "", "duration,depth"],
    "letter-spacing-hover": ["A", (c, v) => lsHold(c, v), "h", "spacing,duration"],
    "line-boil": ["A", (c, v) => ACT.jitter(c, { dur: 1600, fps: v.fps, fn: (_i, t, r) => { const a = K(c, v.amplitude, 24) * Math.sin(Math.PI * t); return { transform: `translate(${((r() - 0.5) * 2 * a).toFixed(2)}px, ${((r() - 0.5) * 2 * a).toFixed(2)}px) rotate(${((r() - 0.5) * 2 * v.rotation * Math.sin(Math.PI * t)).toFixed(2)}deg)` } } }), "", "fps,amplitude"],
    "holo-sheen": ["B", (c, v) => sheen(c, { dur: Math.min(S(v.period), 2600), angle: v.angle, band: 18, alpha: v.intensity }), "", "period,angle"],
    "arrow-slide-through": ["B", (c, v) => { const d = S(v.duration); const tr = K(c, v.travel, 40); return whole(c, [{ offset: 0, transform: "translateX(0px)", opacity: 1, easing: "cubic-bezier(.5,0,.75,0)" }, { offset: v.exit / 100, transform: `translateX(${tr}px)`, opacity: 0 }, { offset: v.exit / 100, transform: `translateX(${-tr}px)`, opacity: 0, easing: OUT }, { offset: 1, transform: "translateX(0px)", opacity: 1 }], d * 1.4, "linear", undefined, CLIP_BOX) }, "", "duration,travel"],
    "xray-lens": ["B", (c, v) => ACT.lens(c, { r: K(c, v.radius, 40), lerp: v.follow * 0.3, soft: 0, mode: "xray" }), "f", "radius,follow"],
    "flame-flicker": ["B", (c, v) => ACT.jitter(c, { dur: S(v.duration) * 1.4, fps: 14, origin: "50% 100%", fn: (_i, t, r) => { const e = Math.sin(Math.PI * t); return { transform: `skewX(${((r() - 0.5) * 2 * v.lean * e).toFixed(2)}deg) scaleY(${(1 + (r() * v.stretch / 100) * e).toFixed(3)})`, opacity: String(1 - r() * 0.25 * e) } } }), "", "duration,lean"],

    /* ── scroll ── */
    "scroll-fade-in": ["A", (c, v) => ACT.from(c, { u: "w", t: `translateY(${K(c, v.distance, 24)}px)`, dur: S(v.duration), st: v.stagger, ease: "cubic-bezier(.25,.46,.45,.94)" }), "", "distance,stagger"],
    "perspective-reveal": ["A", (c, v) => { c.txt.style.perspective = `${v.perspective * (c.fs / 40)}px`; return ACT.from(c, { u: "w", t: `rotateX(${v.rotateX}deg) translateY(${c.fs * 0.2}px)`, origin: "50% 100%", dur: S(v.duration), st: v.stagger, ease: OUT }) }, "", "rotateX,stagger"],
    "parallax": ["B", (c, v) => parallaxAct(c, v), "s"],
    "scroll-progress": ["B", (c, v) => ACT.progress(c, { dur: 1400, th: Math.max(1, K(c, v.height, 24)), ease: `cubic-bezier(${Math.min(0.9, v.smoothing)},0,0.2,1)` }), "", "height,smoothing"],
    "velocity-skew": ["A", (c, v) => skewAct(c, { factor: v.factor, maxSkew: v.maxSkew, lerp: v.lerp }), "s", "factor,maxSkew"],
    "text-highlight": ["A", (c, v) => each(c, { dur: 520, st: 26 + v.stagger * 6, ease: "ease-out", kf: () => [{ opacity: 0.18 + v.offset / 200 }, { opacity: 1 }] }), "", "stagger,span"],
    "scroll-zoom": ["B", (c, v) => whole(c, [{ transform: "scale(1)" }, { transform: `scale(${v.direction === 1 ? 1 / v.zoom : v.zoom})` }, { transform: "scale(1)" }], 1800, EIO, `${c.tb.x}px ${c.tb.y + c.tb.h / 2}px`), "", "zoom,direction"],
    "sticky-pin": ["C", "scroll"],
    "scroll-scrub": ["C", "scroll"],
    "text-on-path": ["B", (c, v) => each(c, { dur: 1600, st: 30, ease: EIO, kf: (i, n) => { const x = i / Math.max(1, n - 1); const y = -Math.sin(Math.PI * x) * K(c, v.curve, 90) * 0.5; const r = -Math.cos(Math.PI * x) * v.curve * 0.18; return [{ transform: "translateY(0px) rotate(0deg)" }, { offset: 0.5, transform: `translateY(${y.toFixed(1)}px) rotate(${r.toFixed(1)}deg)` }, { transform: "translateY(0px) rotate(0deg)" }] } }), "", "curve"],
    "horizontal-scroll": ["B", (c, v) => { const X = c.tb.w * 0.35 * v.distance; return whole(c, [{ transform: "translateX(0px)", easing: EIO }, { offset: 0.45, transform: `translateX(${-X}px)` }, { offset: 0.45, transform: `translateX(${c.W - c.tb.x}px)`, easing: OUT }, { transform: "translateX(0px)" }], 2200, "linear", undefined, CLIP_BOX) }, "", "distance"],
    "scroll-snap": ["B", (c, v) => whole(c, [{ transform: "translateY(0px)", easing: "ease-in" }, { offset: 0.35, transform: `translateY(${-c.fs * 0.45}px)`, easing: v.strictness === 1 ? "cubic-bezier(.3,.7,.4,1)" : BACK }, { transform: "translateY(0px)" }], v.strictness === 1 ? 1100 : 800), "", "strictness,align"],
    "section-color-swap": ["B", (c, v) => ACT.fill(c, { dur: S(v.duration), from: "bottom" }), "", "duration,trigger"],
    "scroll-spy": ["C", "scroll"],
    "stacking-cards": ["B", (c, v) => stackAct(c, v), "", "peek,scale"],
    "smooth-scroll": ["B", (c, v) => each(c, { dur: 900 / Math.max(0.3, v.lerp * 10) + 500, st: 110, ord: "line", ease: "cubic-bezier(.1,.6,.2,1)", kf: () => [{ transform: `translateY(${c.fs * 0.6 * v.multiplier}px)` }, { transform: "translateY(0px)" }] }) , "", "lerp,multiplier"],
    "header-shrink": ["B", (c, v) => whole(c, [{ transform: "scale(1)", easing: "ease" }, { offset: 0.4, transform: `scale(${v.ratio})` }, { offset: 0.65, transform: `scale(${v.ratio})`, easing: "ease" }, { transform: "scale(1)" }], S(v.duration) * 4, "linear", `${c.tb.x}px ${c.tb.y}px`), "", "ratio,duration"],
    "header-hide-on-scroll": ["B", (c, v) => whole(c, [{ transform: "translateY(0%)", easing: "ease-in" }, { offset: 0.4, transform: "translateY(-120%)" }, { offset: 0.55, transform: "translateY(-120%)", easing: OUT }, { transform: "translateY(0%)" }], S(v.duration) * 3.4, "linear", undefined, "inset(-0.05em -0.1em -0.25em -0.1em)"), "", "duration,tolerance"],
    "header-invert": ["B", (c, v) => ACT.fill(c, { dur: S(v.duration), from: "top" }), "", "duration,mode"],
    "footer-reveal": ["B", (c, v) => { const sh = c.fx(at(pad(c.tb, c)) + `background:${c.ink};`); c.a(sh, [{ opacity: v.dim }, { opacity: 0 }], { duration: 900, easing: "ease-out", fill: "both" }); return whole(c, [{ transform: `translateY(${K(c, v.lift, 24)}px)` }, { transform: "translateY(0px)" }], 900, OUT) }, "", "lift,dim"],
    "scroll-marquee": ["B", (c, v) => marquee(c, { speed: K(c, v.speed * (1 + v.factor * 0.5), 24), gap: c.fs, dir: 1 }), "", "speed,factor"],
    "progressive-blur": ["B", (c, v) => each(c, { dur: 1600, ease: EIO, kf: (_i, _n, el) => { const b = c.box(el); const t = v.edge === 1 ? 1 - (b.x - c.tb.x) / c.tb.w : (b.x - c.tb.x) / c.tb.w; const bl = Math.pow(Math.max(0, (t - (1 - v.height / 100)) / (v.height / 100)), 1.5) * v.maxBlur * (c.fs / 80); return [{ filter: "blur(0px)", opacity: 1 }, { offset: 0.45, filter: `blur(${bl.toFixed(1)}px)`, opacity: 1 - (bl / (v.maxBlur * (c.fs / 80) + 0.01)) * 0.6 }, { offset: 0.6, filter: `blur(${bl.toFixed(1)}px)`, opacity: 1 - (bl / (v.maxBlur * (c.fs / 80) + 0.01)) * 0.6 }, { filter: "blur(0px)", opacity: 1 }] } }), "", "maxBlur,height"],
    "rubber-band": ["B", (c, v) => { const d = Math.min(K(c, v.maxOverscroll, 24) * 0.5, c.fs * v.pull * 4); return whole(c, [{ transform: "translateY(0px) scaleY(1)", easing: "cubic-bezier(.2,.8,.3,1)" }, { offset: 0.4, transform: `translateY(${d}px) scaleY(${1 + v.pull * 0.3})` }, { offset: 0.5, transform: `translateY(${d}px) scaleY(${1 + v.pull * 0.3})`, easing: "cubic-bezier(.2,1.3,.4,1)" }, { transform: "translateY(0px) scaleY(1)" }], 700 + S(v.snapBack) * 1.5, "linear", `50% 0%`) }, "", "pull,snapBack"],

    /* ── text ── */
    "split-text-reveal": ["A", (c, v) => ACT.rise(c, { dur: S(v.duration), st: v.stagger, y: Math.min(140, (v.yOffset / 30) * 115), op: true }), "", "stagger,duration"],
    "block-reveal": ["A", (c, v) => ACT.curtain(c, { dur: S(v.duration) * 0.6, pivot: v.pivot / 100, barH: v.barHeight / 100 }), "", "duration,pivot"],
    "typewriter": ["A", (c, v) => ACT.typewriter(c, { speed: v.speed, blink: v.blink }), "", "speed,blink"],
    "counter": ["A", (c, v) => { const D = S(v.duration); const n = c.chars.length; const e = [(t: number) => t, (t: number) => 1 - (1 - t) * (1 - t), (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))][Math.round(v.ease)] || ((t: number) => t); const inv = (y: number) => { let lo = 0, hi = 1; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (e(m) < y) lo = m; else hi = m } return hi }; return ACT.scramble(c, { cs: "0123456789", tick: 40, lockAt: (i) => D * inv((i + 1) / n) }) }, "", "duration,ease"],
    "marquee": ["A", (c, v) => marquee(c, { speed: K(c, v.speed, 24), gap: K(c, v.gap, 24), dir: v.direction === 1 ? -1 : 1 }), "", "speed,direction"],
    "blur-reveal": ["A", (c, v) => ACT.blur(c, { blur: v.blur, duration: v.duration, stagger: v.stagger })],
    "wave-text": ["A", (c, v) => ACT.wave(c, { amp: K(c, v.amplitude, 24), period: S(v.speed), cycles: 2 }), "", "amplitude,speed"],
    "word-rotate": ["A", (c, v) => ACT.swapOut(c, { mode: "rise", dur: S(v.duration), hold: S(v.interval) * 0.6 }), "", "interval,duration"],
    "outline-fill": ["A", (c, v) => ACT.outline(c, { dur: S(v.duration), dir: v.direction }), "", "duration,direction"],
    "gradient-shine": ["A", (c, v) => sheen(c, { dur: S(v.period), angle: 100, band: v.band, alpha: 0.85 }), "", "period,band"],
    "number-roll": ["A", (c, v) => ACT.slideSwap(c, { dur: S(v.duration) / 3, st: v.stagger * 0.6, times: 3 }), "", "duration,stagger"],
    "split-flap": ["A", (c, v) => splitFlap(c, v), "", "flip,steps"],
    "tracking-in": ["A", (c, v) => ACT.tracking(c, { spread: v.spread, dur: S(v.duration), ease: ["ease-out", EXPO, EIO][Math.round(v.ease)] || EXPO }), "", "spread,duration"],
    "text-flip": ["A", (c, v) => ACT.flip(c, { duration: v.duration, perspective: v.perspective }), "", "duration,perspective"],
    "color-wave": ["A", (c, v) => { const b = Math.max(1, Math.round(v.batch)); let end = 0; c.chars.forEach((ch, i) => { const d = Math.floor(i / b) * v.stagger; c.a(ch, [{ opacity: v.dim / 100 }, { offset: 0.35, opacity: 1 }, { opacity: 1 }], { duration: 260 + v.hold, delay: 160 + d }); end = Math.max(end, 160 + d + 260 + v.hold) }); return end }, "", "stagger,hold"],
    "marker-line": ["A", (c, v) => { const h = ACT.underline(c, { dur: S(v.duration), behind: true, height: v.thickness / 100, y: 0.62, color: c.accent, st: 120 }); c.rootStyle({ isolation: "isolate" }); return { hold: true, ms: h.ms + S(v.delay) } }, "", "duration,thickness"],
    "rotating-badge": ["B", (c, v) => ringAct(c, { turn: (360 / v.duration) * 1.2 * (v.direction === 1 ? -1 : 1), dur: 1200 }), "", "duration,direction"],
    // 4周目：遠ざかる量を見出し1行ぶん弱に・薄くなるのは半分まで（旧版は3行ぶん奥へ流れて約2.4秒読めなかった）
    "opening-crawl": ["A", (c, v) => { const pr = K(c, v.perspective, 40); return whole(c, [{ transform: `perspective(${pr}px) rotateX(0deg) translateY(0px)`, opacity: 1, easing: EIO }, { offset: 0.3, transform: `perspective(${pr}px) rotateX(${v.tilt}deg) translateY(0px)`, opacity: 1, easing: "linear" }, { offset: 0.7, transform: `perspective(${pr}px) rotateX(${v.tilt}deg) translateY(${-c.fs * 0.8 * Math.min(1.5, 18 / v.duration)}px)`, opacity: 1 - (v.fade / 100) * 0.5, easing: EIO }, { transform: `perspective(${pr}px) rotateX(0deg) translateY(0px)`, opacity: 1 }], 2400, "linear", "50% 100%") }, "", "tilt,perspective"],
    "sliced-text": ["A", (c, v) => sliced(c, v), "", "slices,tilt"],
    "weight-morph": ["B", (c, v) => each(c, { dur: S(v.duration), st: v.stagger, ease: EIO, kf: () => { const w = ((c.fs * 0.03 * (v.wmax - v.wmin)) / 800).toFixed(2); const sh = (x: string, col = c.ink) => `${x}px 0 0 ${col}, -${x}px 0 0 ${col}, 0 ${x}px 0 ${col}, 0 -${x}px 0 ${col}`; const z = sh("0", "rgba(10,10,10,0)"); return [{ textShadow: z }, { textShadow: sh(w) }, { textShadow: z }] } }), "", "wmin,wmax"],

    /* ── transition ── */
    "curtain-wipe": ["A", (c, v) => ACT.curtain(c, { dur: S(v.duration), n: v.panels, dir: v.direction }), "", "duration,panels"],
    "crossfade": ["B", (c, v) => ACT.swapOut(c, { mode: "fade", dur: S(v.duration), hold: 600, zoom: v.zoomIn }), "", "duration,zoomIn"],
    "cover-transition": ["B", (c, v) => coverAct(c, v), "", "duration,rise"],
    "gradient-wipe": ["B", (c, v) => gradWipe(c, v), "", "angle,softness"],
    "gradient-morph": ["C", "transition"],
    "circle-reveal": ["A", (c, v) => { const o = [[0.5, 0.5], [0.5, 0.5], [0, 0], [1, 1]][Math.round(v.origin)] || [0.5, 0.5]; const x = c.tb.x + c.tb.w * o[0], y = c.tb.y + c.tb.h * o[1]; return ACT.clip(c, { from: `circle(0px at ${x}px ${y}px)`, to: `circle(${Math.hypot(c.W, c.H)}px at ${x}px ${y}px)`, dur: S(v.duration), ease: "cubic-bezier(.4,0,.2,1)" }) }, "", "duration,origin"],
    "menu-reveal": ["B", (c, v) => ACT.rise(c, { u: "w", dur: S(v.duration), st: S(v.stagger), op: true }), "", "duration,stagger"],
    "shutter-transition": ["A", (c, v) => ACT.shutter(c, { n: v.panels, st: v.stagger, horiz: v.orientation === 1, dur: 900 }), "", "panels,stagger"],
    "crt-power-off": ["A", (c, v) => crt(c, v), "", "duration,line"],
    "zoom-through": ["A", (c, v) => { const o = `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`; return whole(c, [{ offset: 0, transform: "scale(1)", opacity: 1, easing: "cubic-bezier(.7,0,.84,0)" }, { offset: 0.5, transform: `scale(${v.zoom})`, opacity: 0 }, { offset: 0.5, transform: `scale(${1 / Math.sqrt(v.zoom)})`, opacity: 0, easing: EXPO }, { offset: 1, transform: "scale(1)", opacity: 1 }], S(v.duration) * 2, "linear", o) }, "", "duration,zoom"],
    "split-screen": ["A", (c, v) => splitScreen(c, v), "", "duration,axis"],
    "shared-element": ["B", (c, v) => { const dy = c.H + c.fs * 0.3; return each(c, { dur: S(v.duration) * 1.3, st: 14, ease: [OUT, EIO, BACK][Math.round(v.easing)] || OUT, kf: (_i, _n, el) => { const b = c.box(el); return [{ transform: `translate(${(c.tb.x + (b.x - c.tb.x) * 0.22) - b.x}px, ${dy - b.y + c.tb.y}px) scale(0.22)`, opacity: 0.0 }, { offset: 0.15, opacity: 1 }, { transform: "translate(0px,0px) scale(1)", opacity: 1 }] }, origin: "0 0" }) }, "", "duration,easing"],

    /* ── media ── */
    "image-zoom-hover": ["B", (c, v) => { c.rootStyle({ clipPath: CLIP_BOX }); c.txt.style.transformOrigin = `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`; c.a(c.txt, [{ transform: "scale(1)" }, { transform: `scale(${v.scale})` }], { duration: S(v.duration), easing: "cubic-bezier(.25,.46,.45,.94)", fill: "both" }); return { hold: true, ms: S(v.duration) } }, "h"],
    "clip-reveal": ["A", (c, v) => ACT.clip(c, { from: [closedL(c), "inset(100% -5% -20% -5%)", closedC(c)][Math.round(v.direction)] || closedL(c), dur: S(v.duration) }), "", "duration,direction"],
    "counter-scale": ["B", (c, v) => counterScale(c, v), "", "aperture,zoom"],
    // 4周目：文字では拡大 1.04 まで・切り抜かない（旧版は2倍の実演値で1.3倍・左寄りの原点で頭の「ケ」が枠で切れていた）
    "ken-burns": ["B", (c, v) => { const D = S(v.duration); const z = Math.min(1.04, v.zoom); const px = Math.min(1, v.pan * 0.25); const o = `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`; return whole(c, [{ offset: 0, transform: "scale(1) translateX(0%)", easing: "cubic-bezier(.33,0,.67,1)" }, { offset: D / (D + 900), transform: `scale(${z}) translateX(${-px}%)`, easing: EIO }, { offset: 1, transform: "scale(1) translateX(0%)" }], D + 900, "linear", o) }, "", "zoom,duration"],
    "duotone-hover": ["C", "media"],
    "image-parallax-hover": ["B", (c, v) => { c.rootStyle({ clipPath: CLIP_BOX }); const s = K(c, v.shift, 40); return ACT.pointerTx(c, { lerp: Math.min(0.3, 0.05 / Math.max(0.1, v.duration) * 2), fn: (x, y) => `translate(${(-x * s).toFixed(2)}px, ${(-y * s * 0.5).toFixed(2)}px) scale(${1 + (Math.min(1, Math.hypot(x, y)) * s) / c.tb.w})` }) }, "f", "shift"],
    "blur-load": ["A", (c, v) => whole(c, [{ filter: `blur(${v.blur * (c.fs / 80)}px)`, transform: "scale(1.02)" }, { filter: "blur(0px)", transform: "scale(1)" }], S(v.duration), "ease-out", `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`), "", "blur,duration"],
    "rack-focus": ["A", (c, v) => { const b = v.blur * (c.fs / 80); return whole(c, [{ filter: `blur(${b}px)`, easing: "ease-in-out" }, { offset: 0.55, filter: "blur(0px)" }, { offset: 0.7, filter: `blur(${(b * v.hunt).toFixed(1)}px)`, easing: "ease-out" }, { filter: "blur(0px)" }], S(v.duration) * 1.3) }, "", "blur,hunt"],
    "before-after": ["B", (c, v) => beforeAfter(c, v), "", "initial,follow"],
    "mosaic-reveal": ["B", (c, v) => mosaic(c, v), "", "tiles,order"],
    "quadtree-reveal": ["B", (c, v) => quadtree(c, v), "", "depth,threshold"],
    "lightbox": ["C", "media"],
    "carousel": ["B", (c, v) => carouselAct(c, S(v.duration)), "", "duration"],
    "cover-flow": ["B", (c, v) => { c.txt.style.perspective = `${c.fs * 8}px`; const n = c.words.length; return each(c, { u: "w", dur: S(v.duration) * 3, ease: EIO, origin: "50% 50%", kf: (i) => { const s = i - (n - 1) / 2; const r = s === 0 ? 0 : -Math.sign(s) * v.angle; return [{ transform: "none" }, { offset: 0.4, transform: `translateX(${s * K(c, v.spacing, 40) * 0.6}px) translateZ(${s === 0 ? 0 : -K(c, v.depth, 40)}px) rotateY(${r}deg)` }, { offset: 0.6, transform: `translateX(${s * K(c, v.spacing, 40) * 0.6}px) translateZ(${s === 0 ? 0 : -K(c, v.depth, 40)}px) rotateY(${r}deg)` }, { transform: "none" }] } }) }, "", "angle,depth"],
    // 4周目：投げた距離を見出し幅の4割までに縮める（旧版は約600px流れて枠の外へ出て、約1.1秒見出しが無かった）
    "drag-scroll": ["B", (c, v) => { const xs: number[] = []; let x = 0, vel = c.fs * 0.5 * v.throw; const N = 60; for (let k = 0; k <= N; k++) { xs.push(x); x += vel; vel *= v.friction } const sc = Math.min(1, (c.tb.w * 0.4) / Math.max(1, xs[N])); const kf: Keyframe[] = xs.map((x, k) => ({ offset: (k / N) * 0.7, transform: `translateX(${(-x * sc).toFixed(1)}px)` })); kf.push({ offset: 1, transform: "translateX(0px)" }); kf[kf.length - 2].easing = BACK; return whole(c, kf, 1600, "linear", undefined, CLIP_BOX) }, "", "friction,throw"],
    "card-shuffle": ["B", (c, v) => { const n = c.words.length; return each(c, { u: "w", dur: S(v.duration) * 2, st: 40, ease: EIO, origin: "50% 120%", kf: (i) => { const s = i - (n - 1) / 2; return [{ transform: "none" }, { offset: 0.45, transform: `rotate(${s * v.fan}deg) scale(${1 - Math.abs(s) * v.scaleStep})` }, { offset: 0.6, transform: `rotate(${s * v.fan}deg) scale(${1 - Math.abs(s) * v.scaleStep})` }, { transform: "none" }] } }) }, "", "fan,scaleStep"],
    "logo-marquee": ["B", (c, v) => marquee(c, { speed: K(c, v.speed, 24), gap: K(c, v.gap, 24), dir: 1, fade: K(c, v.fade, 40) }), "", "speed,fade"],
    "line-draw": ["B", (c, v) => ACT.outline(c, { dur: S(v.duration) * 0.5, dir: 1, st: S(v.stagger) * 0.25 }), "", "duration,stagger"],
    "marching-ants": ["B", (c, v) => ants(c, v), "", "cycle,dash"],
    "animated-beam": ["C", "media"],
    "barber-pole": ["B", (c, v) => stripes(c, v), "", "cycle,pitch"],
    "corner-brackets": ["B", (c, v) => brackets(c, v), "", "size,spin"],
    "blob-morph": ["C", "media"],
    "grain-overlay": ["C", "media"],
    "scanlines": ["B", (c, v) => scan(c, v), "", "spacing,opacity"],
    "moire-drift": ["C", "media"],
    "god-rays": ["C", "media"],
    "fog-drift": ["C", "media"],
    "twinkle": ["B", (c, v) => ACT.jitter(c, { dur: S(v.duration) * 1.4, fps: 16, fn: (i, t, r) => { const ph = ((i * 0.37) % 1); const tw = 0.5 + 0.5 * Math.cos(2 * Math.PI * (t * 2 + ph + (r() - 0.5) * v.jitter / 200)); return { opacity: String(1 - Math.sin(Math.PI * t) * 0.85 * tw), transform: `scale(${(1 - Math.sin(Math.PI * t) * 0.12 * tw).toFixed(3)})` } } }), "", "duration,jitter"],
    "snowfall": ["C", "media"],
    "liquid-distortion": ["B", (c, v) => liquid(c, v), "", "scale,frequency"],
    "ascii-effect": ["B", (c, v) => ACT.scramble(c, { cs: [" .:-=+*#%@", "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ", "░▒▓█"][Math.round(v.ramp)] || ".:-=+*#%@", tick: 1000 / v.fps, lockAt: (i, n) => 500 + (i / n) * 700 * v.contrast }), "", "ramp,fps"],
    "halftone": ["B", (c, v) => halftone(c, v), "", "gap,angle"],
    "dither-dissolve": ["B", (c, v) => dither(c, v), "", "pixel,matrix"],
    "sprite-sheet": ["B", (c, v) => { const f = Math.round(v.frames); const D = S(v.duration) * 2; return ACT.clip(c, { from: closedL(c), dur: D, ease: v.timing === 1 ? "linear" : `steps(${f}, end)` }) }, "", "frames,timing"],
    "frosted-glass": ["B", (c, v) => frost(c, v), "", "blur,opacity"],
    "gradient-border": ["C", "media"],

    /* ── ui ── */
    "notched-corner": ["B", (c, v) => { const n = K(c, v.notch, 24); const B = pad(c.tb, c, 0.06); const R = c.W - B.x - B.w, Bt = c.H - B.y - B.h; const poly = (k: number) => `polygon(${B.x + n * k}px ${B.y}px, ${B.x + B.w}px ${B.y}px, ${B.x + B.w}px ${c.H - Bt - n * k}px, ${B.x + B.w - n * k}px ${c.H - Bt}px, ${B.x}px ${c.H - Bt}px, ${B.x}px ${B.y + n * k}px)`; const panel = c.fx(`left:0;top:0;width:${c.W}px;height:${c.H}px;background:${c.ink};`); const g = c.ghost(c.paper); void R; c.a(panel, [{ clipPath: poly(0), opacity: 0 }, { offset: 0.2, opacity: 1 }, { clipPath: poly(1), opacity: 1 }], { duration: S(v.duration), easing: OUT, fill: "both" }); c.a(g, [{ clipPath: poly(0), opacity: 0 }, { offset: 0.2, opacity: 1 }, { clipPath: poly(1), opacity: 1 }], { duration: S(v.duration), easing: OUT, fill: "both" }); return { hold: true, ms: S(v.duration) } }, "", "notch,duration"],
    "accordion": ["B", (c, v) => { const e = ["ease", "ease-out", OUT][Math.round(v.easing)] || OUT; c.a(c.txt, [{ clipPath: "inset(-20% -5% 100% -5%)", transform: `translateY(${-c.fs * 0.15}px)` }, { clipPath: "inset(-20% -5% -20% -5%)", transform: "translateY(0px)" }], { duration: S(v.duration) * 1.6, easing: e }); return S(v.duration) * 1.6 }, "", "duration,easing"],
    "tab-indicator": ["B", (c, v) => tabAct(c, v), "", "duration,stretch"],
    "gooey-effect": ["C", "ui"],
    "stepper": ["B", (c, v) => each(c, { u: "w", dur: S(v.duration) * 1.4, st: S(v.duration) * 0.9, origin: "50% 60%", ease: [OUT, EIO, BACK][Math.round(v.easing)] || OUT, kf: () => [{ opacity: 0.2, transform: "scale(1)" }, { offset: 0.35, opacity: 1, transform: `scale(${1 + (v.nodeScale - 1) * 0.4})` }, { opacity: 1, transform: "scale(1)" }] }), "", "duration,nodeScale"],
    "story-progress": ["B", (c, v) => ACT.progress(c, { dur: Math.min(S(v.duration), 4000), segs: v.segments, th: Math.max(2, K(c, v.height, 24)) }), "", "segments,height"],
    "dot-pagination": ["C", "ui"],
    "ruler-scrubber": ["C", "ui"],
    "radial-carousel": ["B", (c, v) => ringAct(c, { turn: (360 / v.count) * 1.5, dur: Math.min(950, S(v.duration) * 2), radiusK: v.radius / 320 }), "", "radius,count"],
    "modal-pop": ["B", (c, v) => ACT.from(c, { u: "w", t: `scale(${v.scaleFrom})`, op: 0, dur: S(v.duration) * 1.6, st: 0, ease: "cubic-bezier(.2,.9,.3,1)", origin: "50% 50%" }), "", "duration,scaleFrom"],
    "bounce-in": ["A", (c, v) => ACT.bounce(c, { height: v.height, bounces: v.bounces, damping: v.damping, duration: v.duration }), "", "height,bounces"],
    "squash-stretch": ["A", (c, v) => ACT.squash(c, { squash: v.squash, stretch: v.stretch, recover: v.recover, overshoot: v.overshoot }), "", "squash,stretch"],
    "spring-easing": ["B", (c, v) => { const D = S(v.duration) * 1.6; const N = 40; const kf: Keyframe[] = []; for (let k = 0; k <= N; k++) { const t = (k / N) * (D / 1000); const x = k === N ? 0 : springAt(t, v.stiffness, v.damping); kf.push({ offset: k / N, transform: `translateY(${(-x * c.fs * 0.5).toFixed(2)}px)` }) } return each(c, { dur: D, st: 26, kf: () => kf }) }, "", "stiffness,damping"],
    "drawer-slide": ["B", (c, v) => whole(c, [{ transform: `translateX(${v.direction === 1 ? c.W - c.tb.x : -(c.tb.x + c.tb.w + 10)}px)` }, { transform: "translateX(0px)" }], S(v.duration) * 1.8, OUT, undefined, CLIP_BOX), "", "duration,direction"],
    "toast-slide": ["B", (c, v) => whole(c, [{ transform: "translateY(130%)", opacity: 0, easing: OUT }, { offset: 0.3, transform: "translateY(0%)", opacity: 1 }, { offset: 1, transform: "translateY(0%)", opacity: 1 }], S(v.duration) * 3.3, "linear", undefined, "inset(-0.25em -0.1em -0.05em -0.1em)"), "", "duration"],
    "tooltip-pop": ["B", (c, v) => tipAct(c, v), "", "delay,duration"],
    "pill-expand": ["B", (c, v) => pill(c, v), "", "duration,labelDelay"],
    "toggle-switch": ["C", "ui"],
    "checkbox-check": ["C", "ui"],
    "star-rating": ["B", (c, v) => ACT.pointerEach(c, { settle: S(v.duration) + 400, fn: (_d, dx, _e, i, has) => { const lit = !has || dx >= -c.fs * 0.3; return { opacity: lit ? "1" : "0.45", transform: lit && has ? `scale(${1 + (v.lift - 1) * 0.5})` : "scale(1)", transition: `opacity ${v.duration}s ${(i * v.stagger) / 1000}s, transform ${v.duration}s` } } }), "f", "lift,duration"],
    "theme-toggle-transition": ["B", (c, v) => ACT.fill(c, v.shape === 1 ? { dur: S(v.duration), from: "circle", ox: c.tb.x + c.tb.w, oy: c.tb.y, ease: "cubic-bezier(.4,0,.2,1)" } : { dur: S(v.duration), from: "left", ease: "cubic-bezier(.4,0,.2,1)" }), "", "duration,shape"],
    "equalizer-bars": ["B", (c, v) => ACT.jitter(c, { dur: 1800, fps: 1000 / v.speed * 2.2, origin: "50% 100%", fn: (_i, t, r) => { const e = Math.sin(Math.PI * t); const s = 1 - e * (1 - v.floor / 100) * (0.25 + r() * (0.4 + v.spread / 100)); return { transform: `scaleY(${s.toFixed(3)})` } } }), "", "speed,spread"],
    "bar-chart-grow": ["B", (c, v) => each(c, { dur: S(v.duration) * 1.6, st: v.stagger, origin: "50% 100%", ease: [OUT, BACK, "linear"][Math.round(v.easing)] || OUT, kf: () => (v.method === 1 ? [{ clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)" }] : [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }]) }), "", "duration,stagger"],
    "gauge-meter": ["C", "ui"],
    "ripple-tap": ["B", (c, v) => ripple(c, v), "", "duration,size"],
    "press-feedback": ["A", (c, v) => pressAct(c, { depth: v.depth, scale: v.scale, release: v.release }), "", "scale,release"],
    "stateful-button": ["C", "ui"],
    "copy-to-clipboard": ["B", (c, v) => copied(c, v), "", "rise,hold"],
    "stamp-in": ["A", (c, v) => whole(c, [{ transform: `scale(${v.scale}) rotate(${v.angle}deg)`, opacity: 0, easing: "cubic-bezier(.5,0,.75,0)" }, { offset: 0.55, transform: `scale(0.96) rotate(${v.rest * 0.4}deg)`, opacity: 1, easing: OUT }, { offset: 0.7, transform: `scale(1) rotate(${v.rest * 0.4}deg)`, opacity: 1, easing: EIO }, { transform: "scale(1) rotate(0deg)", opacity: 1 }], S(v.duration) * 2.6, "linear", `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`), "", "scale,angle"],
    "confetti-burst": ["B", (c, v) => burst(c, v), "", "spread,gravity"],
    "like-burst": ["B", (c, v) => likeBurst(c, v), "", "count,startScale"],
    "prize-wheel": ["B", (c, v) => whole(c, [{ transform: "rotate(0deg)" }, { transform: `rotate(${360 * Math.round(v.turns)}deg)` }], Math.min(S(v.duration), 4000), "cubic-bezier(.17,.67,.12,.99)", `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`), "", "turns,duration"],
    "scratch-card": ["B", (c, v) => scratch(c, v), "", "brush,threshold"],
    "gift-box-reveal": ["B", (c, v) => gift(c, v), "", "lift,peeks"],
    "floating-reactions": ["C", "ui"],
    "fly-to-cart": ["C", "ui"],
    "drop-zone": ["C", "ui"],
    "swipe-dismiss": ["B", (c, v) => whole(c, [{ transform: "translateX(0px) rotate(0deg)", opacity: 1, easing: "cubic-bezier(.4,0,1,1)" }, { offset: 0.35, transform: `translateX(${c.W * 0.5 + v.fling * 0.1}px) rotate(${4 + v.fling / 300}deg)`, opacity: 0 }, { offset: 0.5, transform: `translateX(${-c.fs * 0.5}px)`, opacity: 0, easing: OUT }, { transform: "translateX(0px) rotate(0deg)", opacity: 1 }], (S(v.flyout) + S(v.snapBack)) * 2.4, "linear", `${c.tb.x}px ${c.tb.y + c.tb.h}px`, CLIP_BOX), "", "threshold,fling"],
    "list-add-remove": ["B", (c, v) => each(c, { u: "w", dur: S(v.duration) * 4, st: S(v.delay) * 0.6, origin: "50% 0%", ease: OUT, kf: () => [{ transform: "scaleY(1) translateX(0px)", opacity: 1 }, { offset: 0.4, transform: `scaleY(0) translateX(${K(c, v.slide, 24)}px)`, opacity: 1 - v.fade / 100 }, { offset: 0.5, transform: `scaleY(0) translateX(${K(c, v.slide, 24)}px)`, opacity: 1 - v.fade / 100 }, { transform: "scaleY(1) translateX(0px)", opacity: 1 }] }), "", "duration,delay"],
    "paper-crumple": ["B", (c, v) => crumple(c, v), "", "ball,toss"],
    "chat-sequence": ["B", (c, v) => chat(c, v), "", "baseTyping,enter"],
    "ai-orb": ["C", "ui"],
    "flip-card": ["B", (c, v) => ACT.swapOut(c, { mode: "flip", dur: S(v.duration), hold: 700, persp: v.perspective * (c.tb.w / 320) }), "", "duration,perspective"],
    "page-turn": ["B", (c, v) => pageTurn(c, v), "", "duration,shade"],
    "sticker-peel": ["B", (c, v) => peel(c, v), "", "depth,angle"],
    "floating-label": ["B", (c, v) => whole(c, [{ transform: "translateY(0px) scale(1)", easing: OUT }, { offset: 0.3, transform: `translateY(${-K(c, v.rise, 24) * 0.8}px) scale(${v.scale})` }, { offset: 0.7, transform: `translateY(${-K(c, v.rise, 24) * 0.8}px) scale(${v.scale})`, easing: OUT }, { transform: "translateY(0px) scale(1)" }], S(v.duration) * 8, "linear", `${c.tb.x}px ${c.tb.y + c.tb.h}px`), "", "rise,scale"],
    "password-strength": ["C", "ui"],
    "expanding-search": ["B", (c, v) => { const w = K(c, v.startWidth, 16); const L = v.anchor === 1; return ACT.clip(c, { from: L ? `inset(-20% ${c.W - c.tb.x - w}px -20% -5%)` : `inset(-20% ${c.W - c.tb.x - c.tb.w}px -20% ${c.tb.x + c.tb.w - w}px)`, to: "inset(-20% -5% -20% -5%)", dur: S(v.duration) * 2.4, ease: OUT }) }, "", "duration,startWidth"],
    "dropdown-reveal": ["B", (c, v) => whole(c, [{ transform: `translateY(${-K(c, v.offset, 16)}px)`, opacity: 0, clipPath: "inset(-20% -5% 100% -5%)" }, { transform: "translateY(0px)", opacity: 1, clipPath: "inset(-20% -5% -20% -5%)" }], S(v.duration) * 3, OUT), "", "duration,offset"],
    "morphing-dropdown": ["C", "ui"],
    "menu-toggle": ["C", "ui"],
    "error-shake": ["A", (c, v) => ACT.shake(c, { amplitude: v.amplitude, duration: v.duration, shakes: v.shakes }), "", "amplitude,shakes"],
    "hint-nudge": ["B", (c, v) => { const d = K(c, v.distance, 24); const T = S(v.duration); return each(c, { dur: T * 2 + S(v.rest) * 0.3, st: 0, kf: () => [{ transform: "translateX(0px)", easing: "ease-in-out" }, { offset: 0.18, transform: `translateX(${d}px)`, easing: "ease-in-out" }, { offset: 0.36, transform: "translateX(0px)", easing: "ease-in-out" }, { offset: 0.5, transform: `translateX(${d * 0.6}px)`, easing: "ease-in-out" }, { offset: 0.64, transform: "translateX(0px)" }, { transform: "translateX(0px)" }] }) }, "", "distance,duration"],
    "gesture-hint": ["C", "ui"],
    "scroll-cue": ["B", (c, v) => whole(c, [{ transform: "translateY(0px)", opacity: 1, easing: "ease-in" }, { offset: v.share / 100, transform: `translateY(${K(c, v.travel, 24)}px)`, opacity: 0 }, { offset: v.share / 100, transform: `translateY(${-K(c, v.nudge, 24)}px)`, opacity: 0, easing: OUT }, { transform: "translateY(0px)", opacity: 1 }], S(v.duration), "linear", undefined, "inset(-0.25em -0.1em -0.05em -0.1em)"), "", "travel,duration"],
    "notification-badge": ["B", (c, v) => badge(c, v), "", "duration,overshoot"],
    "pulse-ring": ["B", (c, v) => rings(c, v), "", "count,duration"],
    "breathing-glow": ["B", (c, v) => { c.rootStyle({ isolation: "isolate" }); return each(c, { dur: S(v.period) * 1.2, ease: "ease-in-out", origin: "50% 50%", kf: () => [{ textShadow: "0 0 0px rgba(10,10,10,0)", transform: "scale(1)" }, { textShadow: `0 0 ${K(c, v.glow, 24)}px rgba(10,10,10,.35)`, transform: `scale(${1 + v.scale / 300})` }, { textShadow: "0 0 0px rgba(10,10,10,0)", transform: "scale(1)" }] }) }, "", "period,glow"],
    "ambient-float": ["B", (c, v) => { const T = Math.min(S(v.duration), 4200); return ACT.jitter(c, { u: "w", dur: T, fps: 30, fn: (i, t) => { const e = Math.sin(Math.PI * t); const ph = (i * v.spread) / 100; return { transform: `translateY(${(-Math.sin(2 * Math.PI * (t + ph)) * K(c, v.distance, 40) * 0.5 * e).toFixed(2)}px) rotate(${(Math.sin(2 * Math.PI * (t + ph + 0.25)) * v.rotate * e).toFixed(2)}deg)` } } }) }, "", "distance,duration"],
    "eye-blink": ["B", (c, v) => { const d = v.duration; const dbl = v.double >= 50; return each(c, { dur: d * (dbl ? 3 : 1.4), st: 0, origin: "50% 55%", kf: () => (dbl ? [{ transform: "scaleY(1)" }, { offset: 0.17, transform: "scaleY(0.08)" }, { offset: 0.34, transform: "scaleY(1)" }, { offset: 0.5, transform: "scaleY(1)" }, { offset: 0.67, transform: "scaleY(0.08)" }, { offset: 0.84, transform: "scaleY(1)" }, { transform: "scaleY(1)" }] : [{ transform: "scaleY(1)", easing: "ease-in" }, { offset: 0.35, transform: "scaleY(0.08)", easing: "ease-out" }, { offset: 0.7, transform: "scaleY(1)" }, { transform: "scaleY(1)" }]) }) }, "", "duration,double"],
    "orbit": ["B", (c, v) => orbit(c, v), "", "period,tilt"],
    // 4周目：静止（0°）から振り出して、減衰して止まる1往復半（旧版は1コマ目から最大角に傾いた姿で始まり、約4.4秒揺れ続けた）
    "pendulum-swing": ["B", (c, v) => { const T = S(v.period); const N = 48; const kf: Keyframe[] = []; for (let k = 0; k <= N; k++) { const t = k / N; const a = k === N ? 0 : v.angle * Math.exp(-t * 3 * (v.damping / 60)) * Math.sin(2 * Math.PI * t * 1.5); kf.push({ offset: t, transform: `rotate(${a.toFixed(2)}deg)` }) } return each(c, { u: "w", dur: Math.min(T * 1.5, 2600), st: 60, origin: `50% ${-v.pivot}%`, kf: () => kf }) }, "", "angle,period"],
    "flicker-on": ["A", (c, v) => { const n = Math.round(v.flickers); const kf: Keyframe[] = [{ offset: 0, opacity: 0 }]; const r = rnd(3); for (let k = 0; k < n; k++) { const t = (k + 0.3 + r() * 0.4) / (n + 1); kf.push({ offset: t, opacity: 1, easing: "steps(1,end)" }); kf.push({ offset: Math.min(0.98, t + 0.04), opacity: v.dim, easing: "steps(1,end)" }) } kf.push({ offset: 1, opacity: 1 }); kf.forEach((k) => (k.easing = k.easing || "steps(1,end)")); kf.sort((a, b) => (a.offset as number) - (b.offset as number)); return whole(c, kf, S(v.duration)) }, "", "duration,flickers"],
    "dvd-bounce": ["C", "ui"],
    "conic-sweep": ["C", "ui"],
    "motion-path": ["B", (c, v) => each(c, { dur: S(v.duration) * 1.3, st: S(v.stagger), ease: EIO, kf: (i, n) => { const cv = K(c, v.curve, 80) * 0.6; const kf: Keyframe[] = []; const N = 10; for (let k = 0; k <= N; k++) { const t = k / N; const x = -(1 - t) * c.fs * 2.2; const y = -Math.sin(Math.PI * t) * cv * (i % 2 ? 1 : -0.6); const ang = v.rotate === 1 ? Math.atan2(-Math.cos(Math.PI * t) * cv * Math.PI, c.fs * 2.2) * 57 * (1 - t) : 0; kf.push({ offset: t, transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${ang.toFixed(1)}deg)`, opacity: t < 0.15 ? t / 0.15 : 1 }) } void n; return kf } }), "", "curve,stagger"],

    /* ── loading ── */
    "preloader-counter": ["A", (c, v) => ACT.progress(c, { dur: S(v.duration), reveal: true }), "", "duration,curtain"],
    "skeleton-shimmer": ["B", (c, v) => skeleton(c, v), "", "speed,width"],
    "loading-bar": ["B", (c, v) => ACT.progress(c, { dur: S(v.duration), th: Math.max(1, K(c, v.height, 24)), ease: "cubic-bezier(.4,0,.2,1)" }), "", "duration,height"],
    "spinner-ring": ["C", "loading"],
    "dots-pulse": ["B", (c, v) => each(c, { dur: S(v.speed), st: S(v.stagger) * 0.5, ease: "ease-in-out", origin: "50% 50%", kf: () => [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(0.82)", opacity: 0.3 }, { transform: "scale(1)", opacity: 1 }] }), "", "speed,stagger"],
    "circular-progress": ["C", "loading"],
    "stagger-grid": ["B", (c, v) => ACT.from(c, { t: "scale(0.6)", op: 0, dur: S(v.duration), st: S(v.stagger) * 0.6, ord: ord3(v.direction), origin: "50% 50%" }), "", "stagger,direction"],
    "spiral-reveal": ["B", (c, v) => { const R = K(c, v.radius, 40); const turns = v.turns; return each(c, { dur: S(v.duration), st: S(v.stagger) * 0.5, ease: "linear", kf: (i) => { const kf: Keyframe[] = []; const N = 16; for (let k = 0; k <= N; k++) { const t = k / N; const e = 1 - Math.pow(1 - t, 3); const r = R * (1 - e); const a = (turns * 2 * Math.PI) * (1 - e) + i * 0.6; kf.push({ offset: t, transform: `translate(${(Math.cos(a) * r).toFixed(1)}px, ${(Math.sin(a) * r).toFixed(1)}px) scale(${(0.4 + 0.6 * e).toFixed(3)})`, opacity: Math.min(1, t * 3) }) } return kf } }) }, "", "radius,turns"],
    "liquid-fill": ["B", (c, v) => liquidFill(c, v), "", "progress,amplitude"],
    "boot-sequence": ["B", (c, v) => ACT.typewriter(c, { speed: v.charSpeed * 2, blink: 0.5, block: true }), "", "charSpeed,lineDelay"],
}

/* ------------------------------------------------------------------ */
/* 読める演技の枠（2026-10-25 Awwwards 4周目・指摘1）                       */
/* ------------------------------------------------------------------ */
// 規則：どの演技も 0.8秒以内に「素の見出しと画素差が小さいコマ」を一度通り、見出しの半分以上が消えている時間は 0.5秒まで、
// 最後は素の見出しで止まる（判定＝aww/r4/detail/test/judge.cjs・PC/SP×196件×着地とスライダー解放）。
// 個別の演技を直すほかに、数値を返す演技・ホールドへ次の枠を当てる（slug → [lead, 上限ms]）：
//  ・lead 1＝素の姿のまま LEAD ms 止めてから動き出す（1コマ目から崩れて始まらない＝「見えている状態から始める」）。
//    初めから隠れて現れる演技（下から・ぼかし・切り抜き…）には付けない（隠れている時間が延びるだけ）
//  ・上限＝演技の長さがこれを超えたら再生を速めて収める（スライダーで長い値にしても、隠れている時間が 0.5秒を超えない）。
//    現れる演技は約0.7秒、往復の演技は「隠れている割合」（4周目の実測の最大値）から 0.44秒 ÷ 割合
//  表に無い項目は枠なし（実測で規則を満たしている）。右上の数値表示は本来の値のまま
const LEAD = 180
const FIT: Record<string, [0 | 1, number]> = {
    "header-hide-on-scroll": [1, 1000],
    "drawer-slide": [0, 620],
    "text-highlight": [0, 620],
    "like-burst": [0, 620],
    "typewriter": [0, 620],
    "chat-sequence": [0, 700],
    "gradient-wipe": [0, 700],
    "sprite-sheet": [0, 700],
    "blur-reveal": [0, 700],
    "scroll-fade-in": [0, 700],
    "spiral-reveal": [0, 700],
    "stamp-in": [0, 600],
    "menu-reveal": [0, 600],
    "motion-path": [0, 620],
    "mosaic-reveal": [0, 700],
    "stepper": [0, 700],
    "pill-expand": [0, 700],
    "split-text-reveal": [0, 700],
    "stacking-cards": [0, 620],
    "bar-chart-grow": [0, 620],
    "boot-sequence": [0, 700],
    "shared-element": [0, 700],
    "quadtree-reveal": [0, 700],
    "bounce-in": [0, 560],
    "clip-reveal": [0, 700],
    "toast-slide": [0, 700],
    "preloader-counter": [0, 700],
    "tracking-in": [0, 700],
    "smooth-scroll": [0, 700],
    "outline-fill": [0, 700],
    "line-draw": [0, 700],
    "rack-focus": [0, 700],
    "spring-easing": [0, 700],
    "skeleton-shimmer": [0, 440],
    "blur-load": [0, 520],
    "flicker-on": [0, 420],
    "rotating-badge": [1, 0],
    "radial-carousel": [1, 0],
    "drag-scroll": [1, 0],
    "opening-crawl": [1, 0],
    "cover-transition": [1, 740],
    "crt-power-off": [1, 800],
    "number-roll": [1, 560],
    "prize-wheel": [1, 700],
    "split-screen": [1, 950],
    "rubber-band": [1, 780],
    "paper-crumple": [1, 1100],
    "horizontal-scroll": [1, 1500],
    "list-add-remove": [1, 0],
    "zoom-through": [1, 0],
    "curtain-wipe": [1, 820],
    "block-reveal": [1, 950],
    "text-scramble": [1, 0],
    "image-swap-hover": [1, 0],
    "shadow-pop": [1, 0],
    "flame-flicker": [1, 0],
    "weight-morph": [1, 0],
    "counter-scale": [1, 0],
    "before-after": [1, 0],
    "ken-burns": [1, 0],
    "cover-flow": [1, 0],
    "corner-brackets": [1, 0],
    "liquid-distortion": [1, 0],
    "notched-corner": [1, 0],
    "equalizer-bars": [1, 0],
    "pulse-ring": [1, 0],
    "pendulum-swing": [1, 0],
    "press-feedback": [1, 0],
    "gradient-shine": [1, 0],
    "holo-sheen": [1, 0],
    "barber-pole": [1, 0],
}

/* ------------------------------------------------------------------ */
/* 個別の演技                                                           */
/* ------------------------------------------------------------------ */

function liftAct(c: Ctx, v: V): Hold {
    each(c, { dur: S(v.duration), st: 0, ease: OUT, kf: () => [{ transform: "translateY(0px)" }, { transform: `translateY(${-K(c, v.lift, 24)}px)` }] })
    c.chars.forEach((ch) => ch.getAnimations().forEach((a) => (a.effect as KeyframeEffect).updateTiming({ fill: "both" })))
    return { hold: true, ms: S(v.duration) }
}
function lsHold(c: Ctx, v: V): Hold {
    // 字間が開く（文字ごとの translateX。レイアウトは動かさない）
    const n = c.chars.length
    const sp = v.spacing * c.fs
    each(c, {
        dur: S(v.duration), ease: ["linear", EXPO, EIO][Math.round(v.ease)] || EXPO,
        kf: (i) => {
            // compensate：none／trailing＝左端を据えて右へ開く、full＝中心を据えて両側へ開く
            const dx = v.compensate === 2 ? (i - (n - 1) / 2) * sp : i * sp
            return [{ transform: "translateX(0px)" }, { transform: `translateX(${dx}px)` }]
        },
    })
    c.chars.forEach((ch) => ch.getAnimations().forEach((a) => (a.effect as KeyframeEffect).updateTiming({ fill: "both" })))
    return { hold: true, ms: S(v.duration) }
}
function shadowPop(c: Ctx, v: V): Hold {
    const d = K(c, v.depth, 24)
    const n = Math.max(1, Math.round(v.steps))
    const dir = [[-1, 1], [1, 1], [-1, -1], [1, -1]][Math.round(v.direction)] || [-1, 1]
    // 4周目：0 の時は透明の影（ずれ0でも色付きの影を重ねると字の縁が濃くなり、素の見出しと違って見えていた）
    const sh = (k: number) => Array.from({ length: n }, (_, j) => `${(-dir[0] * d * (j + 1) / n * k).toFixed(1)}px ${(dir[1] * d * (j + 1) / n * k).toFixed(1)}px 0 ${k ? c.muted : "rgba(107,107,102,0)"}`).join(", ")
    c.chars.forEach((ch) => c.a(ch, [{ transform: "translate(0px,0px)", textShadow: sh(0) }, { transform: `translate(${dir[0] * d}px, ${-dir[1] * d}px)`, textShadow: sh(1) }], { duration: Math.max(160, S(v.duration) * 2), easing: OUT, fill: "both" }))
    return { hold: true, ms: Math.max(160, S(v.duration) * 2) }
}
function borderDraw(c: Ctx, v: V): Hold {
    const B = pad(c.tb, c, 0.12)
    const t = Math.max(1, K(c, v.thickness, 16) * 0.5)
    const D = S(v.duration)
    const sides: [string, string, string][] = [
        [`left:${B.x}px;top:${B.y}px;width:${B.w}px;height:${t}px;`, "scaleX", "0 50%"],
        [`left:${B.x + B.w - t}px;top:${B.y}px;width:${t}px;height:${B.h}px;`, "scaleY", "50% 0"],
        [`left:${B.x}px;top:${B.y + B.h - t}px;width:${B.w}px;height:${t}px;`, "scaleX", "100% 50%"],
        [`left:${B.x}px;top:${B.y}px;width:${t}px;height:${B.h}px;`, "scaleY", "50% 100%"],
    ]
    sides.forEach(([css, sc, org], k) => {
        const el = c.fx(css + `background:${c.ink};transform-origin:${org};`)
        c.a(el, [{ transform: `${sc}(0)` }, { transform: `${sc}(1)` }], { duration: D / 4, delay: (k * D) / 4, easing: "linear", fill: "both" })
    })
    return { hold: true, ms: D }
}
function trailAct(c: Ctx, v: V): Follow {
    let lx = -1e4, ly = -1e4, live = 0, has = false
    const sp = K(c, v.spacing, 40) * 0.6
    const life = S(v.life)
    let k = 0
    return {
        kind: "f",
        move(x, y) {
            has = true
            if (Math.hypot(x - lx, y - ly) < sp) return
            lx = x; ly = y
            const src = c.chars[k++ % c.chars.length]
            const el = c.fx(`left:0;top:0;transform:translate(${x - c.fs * 0.3}px, ${y - c.fs * 0.6}px);color:${c.muted};white-space:pre;font:inherit;letter-spacing:inherit;`)
            el.textContent = src.textContent
            live++
            const an = c.a(el, [{ opacity: 0.9, transform: `translate(${x - c.fs * 0.3}px, ${y - c.fs * 0.6}px) scale(.9)` }, { opacity: 0, transform: `translate(${x - c.fs * 0.3}px, ${y - c.fs * 0.3}px) scale(.6)` }], { duration: life, easing: "ease-out", fill: "both" })
            an.onfinish = () => { el.remove(); live-- }
        },
        leave() { has = false },
        tick() { return has || live > 0 },
    }
}
function previewAct(c: Ctx, v: V): Follow {
    const card = c.fx(`left:0;top:0;padding:${c.fs * 0.12}px ${c.fs * 0.2}px;background:${c.ink};color:${c.paper};font:400 ${Math.max(11, c.fs * 0.17)}px/1.4 ${MONO};letter-spacing:.02em;white-space:nowrap;border-radius:6px;`)
    card.textContent = c.en
    let px = c.tb.x, py = c.tb.y, cx = px, cy = py, o = 0, has = false
    return {
        kind: "f",
        move(x, y) { px = x; py = y; has = true },
        leave() { has = false },
        tick() {
            cx += (px - cx) * v.lerp
            cy += (py - cy) * v.lerp
            o += ((has ? 1 : 0) - o) * Math.min(1, 0.016 / Math.max(0.05, v.duration) * 3)
            card.style.transform = `translate(${cx + c.fs * 0.15}px, ${cy + c.fs * 0.15}px) scale(${v.scaleFrom + (1 - v.scaleFrom) * o})`
            card.style.opacity = String(o)
            return has || o > 0.01
        },
    }
}
function glitchAct(c: Ctx, v: V) {
    const T = Math.max(900, S(v.period) * 2)
    const s = K(c, v.strength, 24)
    const a = c.ghost(c.muted)
    const b = c.ghost(c.ink)
    const r = rnd(9)
    const kfs = (sign: number) => {
        const kf: Keyframe[] = []
        const N = 14
        for (let k = 0; k <= N; k++) {
            const on = k > 0 && k < N && r() < 0.6
            const y0 = r() * 80, h = 8 + r() * 30
            kf.push({ offset: k / N, transform: `translateX(${on ? sign * s * (0.4 + r()) : 0}px)`, clipPath: on ? `inset(${y0}% 0% ${Math.max(0, 100 - y0 - h)}% 0%)` : "inset(0% 0% 100% 0%)", easing: "steps(1,end)" })
        }
        return kf
    }
    c.a(a, kfs(1), { duration: T, fill: "both" })
    c.a(b, kfs(-1), { duration: T, fill: "both" })
    c.a(c.txt, [{ transform: "translateX(0px)" }, { offset: 0.3, transform: `translateX(${s * 0.3}px)` }, { offset: 0.32, transform: "translateX(0px)" }, { transform: "translateX(0px)" }], { duration: T, easing: "steps(1,end)" })
    return T
}
function cubeRoll(c: Ctx, v: V) {
    const dz = K(c, v.depth, 56) * 0.5
    const ax = v.axis === 1 ? "Y" : "X"
    const ov = v.overshoot
    const D = S(v.duration)
    return each(c, {
        dur: D * 1.6, st: 30,
        kf: () => [
            { offset: 0, transform: `translateZ(${-dz}px) rotate${ax}(0deg) translateZ(${dz}px)`, opacity: 1, easing: "ease-in" },
            { offset: 0.45, transform: `translateZ(${-dz}px) rotate${ax}(${ax === "X" ? 90 : -90}deg) translateZ(${dz}px)`, opacity: 0.2 },
            { offset: 0.45, transform: `translateZ(${-dz}px) rotate${ax}(${ax === "X" ? -90 : 90}deg) translateZ(${dz}px)`, opacity: 0.2, easing: "ease-out" },
            { offset: 0.8, transform: `translateZ(${-dz}px) rotate${ax}(${ax === "X" ? ov : -ov}deg) translateZ(${dz}px)`, opacity: 1, easing: "ease-in-out" },
            { offset: 1, transform: `translateZ(${-dz}px) rotate${ax}(0deg) translateZ(${dz}px)`, opacity: 1 },
        ],
    })
}
// 帯の光が字の上を横切る（gradient-shine / holo-sheen）
function sheen(c: Ctx, p: { dur: number; angle: number; band: number; alpha: number }) {
    const W = c.tb.w + c.fs
    const band = Math.max(4, Math.min(60, p.band))
    const grad = `linear-gradient(${p.angle}deg, ${c.ink} 0%, ${c.ink} ${50 - band / 2}%, rgba(244,244,241,${p.alpha}) 50%, ${c.ink} ${50 + band / 2}%, ${c.ink} 100%)`
    c.chars.forEach((ch) => {
        const b = c.box(ch)
        ch.style.color = "transparent"
        ch.style.backgroundImage = grad
        ch.style.backgroundSize = `${W * 3}px 100%`
        ch.style.setProperty("-webkit-background-clip", "text")
        ch.style.backgroundClip = "text"
        const x0 = -(b.x - c.tb.x)
        c.a(ch, [{ backgroundPosition: `${x0 - W * 2}px 0` }, { backgroundPosition: `${x0}px 0` }], { duration: p.dur, easing: "ease-in-out", fill: "both" })
    })
    return p.dur
}
function marquee(c: Ctx, p: { speed: number; gap: number; dir: number; fade?: number }) {
    // 4周目：見出し語の幅の中で回る帯にする（同じ語の写しが後ろから続く＝いつ見ても字が枠いっぱいにある）。
    // 旧版は枠（780px）の幅を1周して、字が左へ抜けてから右から戻るまでの間、見出しの半分以上が無かった
    const gap = Math.min(Math.max(p.gap, c.fs * 0.3), c.fs * 0.8)
    const P = c.tb.w + gap
    const T = Math.min(4000, (P / Math.max(20, p.speed)) * 1000)
    const pad = c.fs * 0.14
    const L = Math.max(0, c.tb.x - pad), Rt = Math.max(0, c.W - (c.tb.x + c.tb.w) - pad)
    c.rootStyle({ clipPath: `inset(-0.3em ${Rt}px -0.3em ${L}px)` })
    if (p.fade) {
        // 溶かすのは字の外の余白だけ（止まっている字の端を薄くしない）
        const f = Math.min(p.fade, pad)
        const m = `linear-gradient(90deg, transparent ${L}px, #000 ${L + f}px, #000 ${c.W - Rt - f}px, transparent ${c.W - Rt}px)`
        c.rootStyle({ webkitMaskImage: m, maskImage: m })
    }
    const g = c.ghost()
    const d = p.dir > 0 ? -P : P
    c.a(c.txt, [{ transform: "translateX(0px)" }, { transform: `translateX(${d}px)` }], { duration: T, easing: "linear" })
    c.a(g, [{ transform: `translateX(${-d}px)` }, { transform: "translateX(0px)" }], { duration: T, easing: "linear", fill: "both" })
    return T
}
function splitFlap(c: Ctx, v: V) {
    const n = Math.max(1, Math.round(v.steps))
    const f = S(v.flip)
    const pool = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
    c.lock(c.chars)
    const orig = c.chars.map((e) => e.textContent || "")
    const r = rnd(4)
    c.chars.forEach((ch, i) => {
        const kf: Keyframe[] = []
        for (let k = 0; k < n; k++) {
            kf.push({ offset: k / n, transform: `perspective(${c.fs * 6}px) rotateX(0deg)`, easing: "ease-in" })
            kf.push({ offset: (k + 0.5) / n, transform: `perspective(${c.fs * 6}px) rotateX(-90deg)` })
            kf.push({ offset: (k + 0.5) / n, transform: `perspective(${c.fs * 6}px) rotateX(90deg)`, easing: "ease-out" })
        }
        kf.push({ offset: 1, transform: `perspective(${c.fs * 6}px) rotateX(0deg)` })
        c.a(ch, kf, { duration: f * n, delay: i * v.stagger })
        if (!orig[i].trim()) return
        for (let k = 0; k < n; k++) c.later(() => c.setText(ch, k === n - 1 ? orig[i] : pool[Math.floor(r() * pool.length)]), i * v.stagger + f * (k + 0.5))
    })
    return f * n + c.chars.length * v.stagger + 60
}
function ringAct(c: Ctx, p: { turn: number; dur: number; radiusK?: number }) {
    const n = c.chars.length
    const R = Math.max(c.fs * 1.1, (c.tb.w / (2 * Math.PI)) * (p.radiusK || 1))
    const cx = c.tb.x + c.tb.w / 2, cy = c.tb.y + c.tb.h / 2
    return each(c, {
        dur: p.dur, ease: "linear",
        kf: (i, _n, el) => {
            const b = c.box(el)
            const kf: Keyframe[] = []
            const N = 24
            for (let k = 0; k <= N; k++) {
                const t = k / N
                // 4周目：輪になっている時間を短く（旧版は 3.6秒のうち約2.6秒、字が輪に並んで読めなかった）。sin⁴ の山＝輪に近いのは全体の約1/3
                const mix = Math.pow(Math.sin(Math.PI * t), 4)
                const a0 = (i / n) * 2 * Math.PI - Math.PI / 2 + ((p.turn * Math.PI) / 180) * t
                const rx = cx + Math.cos(a0) * R - (b.x + b.w / 2)
                const ry = cy + Math.sin(a0) * R - (b.y + b.h / 2)
                const rot = ((a0 + Math.PI / 2) * 180) / Math.PI
                kf.push({ offset: t, transform: `translate(${(rx * mix).toFixed(1)}px, ${(ry * mix).toFixed(1)}px) rotate(${(rot * mix).toFixed(1)}deg) scale(${1 - 0.45 * mix})` })
            }
            return kf
        },
    })
}
function EIOf(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
function sliced(c: Ctx, v: V) {
    const n = Math.max(2, Math.round(v.slices))
    const D = S(v.duration) * 2
    const off = K(c, v.offset, 24)
    const tilt = Math.tan((v.tilt * Math.PI) / 180) * c.H
    c.a(c.txt, [{ opacity: 0 }, { opacity: 0 }], { duration: D })
    for (let k = 0; k < n; k++) {
        const g = c.ghost()
        const y0 = (c.H / n) * k, y1 = (c.H / n) * (k + 1)
        const dx0 = (tilt * (y0 / c.H)), dx1 = (tilt * (y1 / c.H))
        g.style.clipPath = `polygon(${-c.W}px ${y0 - dx0 * 0}px, ${c.W * 2}px ${y0 + dx0 * 0.2}px, ${c.W * 2}px ${y1 + dx1 * 0.2}px, ${-c.W}px ${y1}px)`
        const s = k % 2 ? 1 : -1
        c.a(g, [{ transform: "translateX(0px)", easing: EIO }, { offset: 0.4, transform: `translateX(${s * off}px)` }, { offset: 0.6, transform: `translateX(${s * off}px)`, easing: EIO }, { transform: "translateX(0px)" }], { duration: D, fill: "both" })
    }
    return D
}
function stackAct(c: Ctx, v: V) {
    // 1枚ずつ下から入って積まれ、先に積まれた札ほど少し上に覗いて小さくなる（最大3枚ぶん）。最後に揃って戻る
    const els = c.words
    const n = els.length
    const st = Math.min(170, 1300 / Math.max(1, n))
    const D = 420
    const T = D + st * (n - 1) + 300 + 420
    const peek = Math.min(c.fs * 0.08, K(c, v.peek, 24) * 0.15)
    els.forEach((w, i) => {
        w.style.transformOrigin = "50% 0%"
        const kf: Keyframe[] = [
            { offset: 0, transform: `translateY(${c.fs * 1.1}px) scale(1)`, opacity: 0 },
            { offset: (i * st) / T, transform: `translateY(${c.fs * 1.1}px) scale(1)`, opacity: 0, easing: OUT },
            { offset: (i * st + D) / T, transform: "translateY(0px) scale(1)", opacity: 1 },
        ]
        for (let k = 1; k <= Math.min(3, n - 1 - i); k++) {
            kf.push({ offset: ((i + k) * st + D) / T, transform: `translateY(${-peek * k}px) scale(${1 - v.scale * k})`, opacity: 1 })
        }
        kf.push({ offset: (T - 420) / T, transform: kf[kf.length - 1].transform, opacity: 1, easing: OUT })
        kf.push({ offset: 1, transform: "translateY(0px) scale(1)", opacity: 1 })
        kf.forEach((k, j) => { if (j > 0 && (k.offset as number) < (kf[j - 1].offset as number)) k.offset = kf[j - 1].offset })
        c.a(w, kf, { duration: T })
    })
    return T
}
function coverAct(c: Ctx, v: V) {
    const D = S(v.duration)
    const B = pad(c.tb, c)
    const panel = c.fx(at(B) + `background:${c.ink};border-radius:${c.fs * 0.06}px;`)
    c.a(panel, [
        { offset: 0, transform: `translateY(${B.h * (1 + v.rise / 100)}px) scale(${v.scaleFrom})`, opacity: 0, easing: OUT },
        { offset: 0.45, transform: "translateY(0px) scale(1)", opacity: 1, easing: "linear" },
        { offset: 0.55, transform: "translateY(0px) scale(1)", opacity: 1, easing: INOUT },
        { offset: 1, transform: `translateY(${-B.h * 1.1}px) scale(1)`, opacity: 1 },
    ], { duration: D * 2, fill: "both" })
    c.rootStyle({ clipPath: `inset(${B.y}px ${c.W - B.x - B.w}px ${c.H - B.y - B.h}px ${B.x}px)` })
    c.txt.style.transformOrigin = `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`
    c.a(c.txt, [{ transform: "scale(1)", opacity: 1, easing: OUT }, { offset: 0.45, transform: `scale(${1 / v.recede})`, opacity: 0.4 }, { offset: 0.55, transform: "scale(1)", opacity: 1 }, { transform: "scale(1)", opacity: 1 }], { duration: D * 2 })
    return D * 2
}
function gradWipe(c: Ctx, v: V) {
    const sf = Math.max(1, v.softness)
    const m = `linear-gradient(${v.angle + 90}deg, #000 0%, #000 ${50 - sf / 4}%, transparent ${50 + sf / 4}%, transparent 100%)`
    const t = c.txt.style
    t.setProperty("-webkit-mask-image", m)
    t.setProperty("mask-image", m)
    t.setProperty("-webkit-mask-size", "300% 300%")
    t.setProperty("mask-size", "300% 300%")
    const e = ["linear", "cubic-bezier(0.33, 1, 0.68, 1)", "cubic-bezier(0.65, 0, 0.35, 1)"][Math.round(v.easing)] || EIO
    c.a(c.txt, [{ maskPosition: "100% 100%", webkitMaskPosition: "100% 100%" } as any, { maskPosition: "0% 0%", webkitMaskPosition: "0% 0%" } as any], { duration: S(v.duration), easing: e })
    return S(v.duration)
}
function crt(c: Ctx, v: V) {
    const D = S(v.duration)
    const ln = Math.max(0.004, (v.line / 100) * 2)
    const o = `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`
    c.txt.style.transformOrigin = o
    c.a(c.txt, [
        { offset: 0, transform: "scale(1, 1)", filter: "brightness(1)", opacity: 1, easing: "cubic-bezier(.7,0,.84,0)" },
        { offset: 0.25, transform: `scale(1, ${ln})`, filter: `brightness(${v.flash})`, opacity: 1, easing: "cubic-bezier(.7,0,.84,0)" },
        { offset: 0.45, transform: `scale(0, ${ln})`, opacity: 0.6 },
        { offset: 0.6, transform: `scale(0, ${ln})`, opacity: 0, easing: OUT },
        { offset: 0.8, transform: `scale(1, ${ln})`, opacity: 1, easing: OUT },
        { offset: 1, transform: "scale(1, 1)", filter: "brightness(1)", opacity: 1 },
    ], { duration: D * 2.4 })
    const line = c.fx(`left:${c.tb.x}px;top:${c.tb.y + c.tb.h / 2 - 1}px;width:${c.tb.w}px;height:2px;background:${c.ink};`)
    c.a(line, [{ offset: 0, opacity: 0, transform: "scaleX(1)" }, { offset: 0.25, opacity: 1, transform: "scaleX(1)" }, { offset: 0.45, opacity: 1, transform: "scaleX(0.01)" }, { offset: 0.55, opacity: 0, transform: "scaleX(0.01)" }, { offset: 1, opacity: 0 }], { duration: D * 2.4, fill: "both" })
    return D * 2.4
}
function splitScreen(c: Ctx, v: V) {
    const D = S(v.duration) * 2
    const vert = v.axis !== 1
    const half = vert ? c.tb.x + c.tb.w / 2 : c.tb.y + c.tb.h / 2
    c.a(c.txt, [{ opacity: 0 }, { opacity: 0 }], { duration: D })
    ;[0, 1].forEach((k) => {
        const g = c.ghost()
        g.style.clipPath = vert ? (k ? `inset(-20% -5% -20% ${half}px)` : `inset(-20% ${c.W - half}px -20% -5%)`) : (k ? `inset(${half}px -5% -20% -5%)` : `inset(-20% -5% ${c.H - half}px -5%)`)
        const d = (k ? 1 : -1) * (vert ? c.tb.w * 0.12 : c.tb.h * 0.35)
        const tr = vert ? `translateX(${d}px)` : `translateY(${d}px)`
        c.a(g, [{ transform: "none", opacity: 1, easing: INOUT }, { offset: 0.45, transform: tr, opacity: 0.15 }, { offset: 0.55, transform: tr, opacity: 0.15, easing: INOUT }, { transform: "none", opacity: 1 }], { duration: D, fill: "both" })
    })
    return D
}
function counterScale(c: Ctx, v: V) {
    const D = S(v.duration) * 3
    const B = pad(c.tb, c)
    const ap = v.aperture
    const ix = (B.w * (1 - ap)) / 2, iy = (B.h * (1 - ap)) / 2
    c.txt.style.transformOrigin = `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`
    c.rootStyle({ clipPath: "inset(-30% -5% -30% -5%)" })
    c.a(c.txt, [
        { clipPath: "inset(-20% -5% -20% -5%)", transform: "scale(1)", easing: EIO },
        { offset: 0.45, clipPath: `inset(${B.y + iy}px ${c.W - B.x - B.w + ix}px ${c.H - B.y - B.h + iy}px ${B.x + ix}px)`, transform: `scale(${v.mode === 1 ? 1 : v.zoom})` },
        { offset: 0.6, clipPath: `inset(${B.y + iy}px ${c.W - B.x - B.w + ix}px ${c.H - B.y - B.h + iy}px ${B.x + ix}px)`, transform: `scale(${v.mode === 1 ? 1 : v.zoom})`, easing: EIO },
        { clipPath: "inset(-20% -5% -20% -5%)", transform: "scale(1)" },
    ], { duration: D })
    return D
}
function beforeAfter(c: Ctx, v: V) {
    const D = 2200
    const sw = Math.max(1, c.fs / 70)
    const g = c.ghost("transparent")
    g.style.setProperty("-webkit-text-stroke", `${sw}px ${c.ink}`)
    const B = pad(c.tb, c)
    const line = c.fx(`left:0;top:${B.y}px;width:2px;height:${B.h}px;background:${c.ink};`)
    const x = (f: number) => B.x + B.w * f
    const i0 = v.initial / 100
    const pts = [0, i0, 1, i0, 0].map(x)
    const ofs = [0, 0.3, 0.55, 0.8, 1]
    const ease = `cubic-bezier(${0.2 + v.follow},0,${0.2 + v.follow * 0.5},1)`
    c.a(c.txt, pts.map((p, k) => ({ offset: ofs[k], clipPath: `inset(-20% -5% -20% ${p}px)`, easing: ease })).map((k, j, arr) => (j === arr.length - 1 ? { ...k, clipPath: "inset(-20% -5% -20% -5%)" } : k)), { duration: D })
    c.a(g, pts.map((p, k) => ({ offset: ofs[k], clipPath: `inset(-20% ${c.W - p}px -20% -5%)`, easing: ease })), { duration: D, fill: "both" })
    c.a(line, pts.map((p, k) => ({ offset: ofs[k], transform: `translateX(${p}px)`, opacity: k === 0 || k === 4 ? 0 : 1, easing: ease })), { duration: D, fill: "both" })
    return D
}
function mosaic(c: Ctx, v: V) {
    const grid = [[4, 3], [6, 4], [8, 5], [10, 6]][Math.round(v.tiles)] || [6, 4]
    const B = pad(c.tb, c)
    const cols = grid[0] * Math.max(1, Math.round(B.w / B.h / 2)), rows = grid[1]
    const tw = B.w / cols, th = B.h / rows
    const n = cols * rows
    const order = v.order === 1 ? Array.from({ length: n }, (_, i) => i) : v.order === 2 ? Array.from({ length: n }, (_, i) => (i % cols) + Math.floor(i / cols)) : seeded(n, 21)
    const st = v.stagger * (v.order === 2 ? 2.5 : 1) * (24 / Math.max(24, n)) * 2
    let end = 0
    for (let i = 0; i < n; i++) {
        const el = c.fx(`left:${B.x + (i % cols) * tw}px;top:${B.y + Math.floor(i / cols) * th}px;width:${tw + 0.5}px;height:${th + 0.5}px;background:${c.paper};`)
        const d = order[i] * st
        c.a(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 240, delay: d, easing: "ease-out", fill: "both" })
        end = Math.max(end, d + 240)
    }
    return end
}
function quadtree(c: Ctx, v: V) {
    const m = glyphMap(c)
    if (!m) return 0
    const { cv, g } = overlayCanvas(c)
    const depth = Math.round(v.depth)
    const base = c.H / Math.max(1, Math.round(c.H / (c.fs * 1.2)))
    type Leaf = { x: number; y: number; s: number; a: number }
    const leaves: Leaf[] = []
    const thr = v.threshold / 255
    const rec = (x: number, y: number, s: number, d: number) => {
        if (x >= c.W || y >= c.H) return
        const w = Math.min(s, c.W - x), h = Math.min(s, c.H - y)
        const cov = coverage(m, x, y, w, h)
        if (d < depth && cov.sd > thr * 0.8 && s > 3) {
            const hs = s / 2
            rec(x, y, hs, d + 1); rec(x + hs, y, hs, d + 1); rec(x, y + hs, hs, d + 1); rec(x + hs, y + hs, hs, d + 1)
        } else if (cov.mean > 0.02) leaves.push({ x, y, s: Math.min(s, w + 0.5), a: cov.mean })
    }
    for (let y = 0; y < c.H; y += base) for (let x = 0; x < c.W; x += base) rec(x, y, base, 1)
    leaves.sort((p, q) => q.s - p.s)
    const D = S(v.duration), H = S(v.hold)
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
    c.a(c.txt, [{ opacity: 0 }, { opacity: 0 }], { duration: D + H })
    const draw = (k: number, from = 0) => {
        g.clearRect(0, 0, c.W, c.H)
        for (let i = from; i < k; i++) {
            const l = leaves[i]
            g.fillStyle = `rgba(10,10,10,${Math.min(1, l.a * 1.15).toFixed(3)})`
            g.fillRect(l.x, l.y, l.s - 0.5, l.s - 0.5)
        }
    }
    c.loop((t) => {
        if (t < D) draw(Math.floor(ease(t / D) * leaves.length))
        else if (t < D + H) draw(leaves.length)
        else if (t < D * 2 + H) draw(leaves.length, Math.floor(ease((t - D - H) / D) * leaves.length))
        else { g.clearRect(0, 0, c.W, c.H); return false }
        return true
    })
    void cv
    return D * 2 + H + 50
}
function halftone(c: Ctx, v: V) {
    const m = glyphMap(c)
    if (!m) return 0
    const { g } = overlayCanvas(c)
    const gap = Math.max(3, K(c, v.gap, 40) * 0.6)
    const a = (v.angle * Math.PI) / 180
    const dots: { x: number; y: number; r: number }[] = []
    const ext = Math.hypot(c.W, c.H)
    for (let u = -ext; u < ext; u += gap)
        for (let w = -ext; w < ext; w += gap) {
            const x = c.W / 2 + u * Math.cos(a) - w * Math.sin(a), y = c.H / 2 + u * Math.sin(a) + w * Math.cos(a)
            if (x < 0 || y < 0 || x >= c.W || y >= c.H) continue
            const cov = coverage(m, Math.max(0, x - gap / 2), Math.max(0, y - gap / 2), gap, gap).mean
            if (cov > 0.03) dots.push({ x, y, r: (gap / 2) * Math.sqrt(cov) * 1.15 })
        }
    const D = 1700
    const sep = K(c, v.separation, 40) * 0.5
    c.a(c.txt, [{ opacity: 1 }, { offset: 0.2, opacity: 0 }, { offset: 0.72, opacity: 0 }, { opacity: 1 }], { duration: D })
    c.loop((t) => {
        const k = t / D
        const e = k < 0.2 ? k / 0.2 : k > 0.72 ? Math.max(0, 1 - (k - 0.72) / 0.28) : 1
        g.clearRect(0, 0, c.W, c.H)
        const reach = Math.min(1, k / 0.35)
        dots.forEach((d) => {
            if (d.x / c.W > reach + 0.05) return
            if (sep) { g.fillStyle = `rgba(107,107,102,${0.55 * e})`; g.beginPath(); g.arc(d.x + sep, d.y + sep * 0.3, d.r, 0, Math.PI * 2); g.fill() }
            g.fillStyle = `rgba(10,10,10,${e})`
            g.beginPath(); g.arc(d.x, d.y, d.r, 0, Math.PI * 2); g.fill()
        })
        return k < 1
    })
    return D + 40
}
function dither(c: Ctx, v: V) {
    const m = glyphMap(c)
    if (!m) return 0
    const { g } = overlayCanvas(c)
    const px = Math.max(2, K(c, v.pixel, 40) * 0.7)
    const B2 = [[0, 2], [3, 1]], B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
    const mat = Math.round(v.matrix)
    const r = rnd(13)
    const th = (i: number, j: number) => (mat === 0 ? (B2[j % 2][i % 2] + 0.5) / 4 : mat === 3 ? r() : (B4[j % 4][i % 4] + 0.5) / 16)
    const cells: { x: number; y: number; cov: number; t: number }[] = []
    for (let j = 0; j * px < c.H; j++)
        for (let i = 0; i * px < c.W; i++) {
            const cov = coverage(m, i * px, j * px, Math.min(px, c.W - i * px), Math.min(px, c.H - j * px)).mean
            if (cov > 0.05) cells.push({ x: i * px, y: j * px, cov, t: th(i, j) })
        }
    // 4周目：見えている字から始めて、一度だけ粒に崩し（密度は最低4割まで＝形は読める）、粒から字へ戻す。
    // 旧版は字を演技の間ずっと透明にして粒だけを描き、中盤（密度0）で約1秒・スライダー後は最長2秒見出しが消えていた。
    // 字の透明は rAF の中で毎コマ決める（rAF が止まっても「字が透明・粒も無い」状態で固まらない＝全ページ撮影で H1 が無かった）
    const D = Math.min(S(v.cycle), 1600)
    const st = c.txt.style
    c.loop((t) => {
        const k = Math.min(1, t / D)
        // 0〜0.12：字→粒に切り替え／0.12〜0.5：4割まで崩す／0.5〜0.88：戻す／0.88〜：粒→字
        const lvl = k < 0.12 ? 1 : k < 0.5 ? 1 - 0.6 * EIOf((k - 0.12) / 0.38) : k < 0.88 ? 0.4 + 0.6 * EIOf((k - 0.5) / 0.38) : 1
        const showTxt = k < 0.06 || k >= 0.94
        st.opacity = showTxt ? "1" : "0"
        g.clearRect(0, 0, c.W, c.H)
        if (!showTxt) {
            g.fillStyle = c.ink
            cells.forEach((q) => { if (q.t < lvl * Math.min(1, q.cov * 1.6)) g.fillRect(q.x, q.y, px, px) })
        }
        if (k >= 1) { st.opacity = "1"; return false }
        return true
    })
    return D + 40
}
function frost(c: Ctx, v: V) {
    const B = pad(c.tb, c, 0.2)
    const w = B.w * 0.36
    const el = c.fx(`left:${B.x}px;top:${B.y}px;width:${w}px;height:${B.h}px;border-radius:${c.fs * 0.12}px;background:rgba(244,244,241,${0.25 + v.opacity * 2});-webkit-backdrop-filter:blur(${K(c, v.blur, 40) * 0.6}px);backdrop-filter:blur(${K(c, v.blur, 40) * 0.6}px);box-shadow:inset 0 0 0 1px rgba(10,10,10,.12);`)
    const D = Math.max(1600, S(v.duration) * 4)
    c.a(el, [{ transform: `translateX(${-w}px)`, opacity: 0, easing: EIO }, { offset: 0.15, opacity: 1 }, { offset: 0.85, opacity: 1 }, { transform: `translateX(${B.w}px)`, opacity: 0 }], { duration: D, fill: "both" })
    return D
}
function ants(c: Ctx, v: V) {
    const B = pad(c.tb, c, 0.14)
    const t = Math.max(1, Math.round(c.fs / 50))
    const dash = K(c, v.dash, 24), gap = K(c, v.gap, 24)
    const D = Math.max(1800, S(v.cycle) * 2)
    const dir = v.direction === 1 ? -1 : 1
    const P = dash + gap
    const sides = [
        `left:${B.x}px;top:${B.y}px;width:${B.w}px;height:${t}px;`, `left:${B.x + B.w - t}px;top:${B.y}px;width:${t}px;height:${B.h}px;`,
        `left:${B.x}px;top:${B.y + B.h - t}px;width:${B.w}px;height:${t}px;`, `left:${B.x}px;top:${B.y}px;width:${t}px;height:${B.h}px;`,
    ]
    sides.forEach((css, k) => {
        const h = k % 2 === 0
        const el = c.fx(css + `background:repeating-linear-gradient(${h ? 90 : 180}deg, ${c.ink} 0 ${dash}px, transparent ${dash}px ${P}px);`)
        const s = (k < 2 ? 1 : -1) * dir
        const cyc = (D / S(v.cycle))
        c.a(el, [{ backgroundPosition: "0px 0px", opacity: 0 }, { offset: 0.12, opacity: 1 }, { offset: 0.85, opacity: 1 }, { backgroundPosition: h ? `${s * P * Math.round(cyc * 4)}px 0px` : `0px ${s * P * Math.round(cyc * 4)}px`, opacity: 0 }], { duration: D, fill: "both", easing: "linear" })
    })
    return D
}
function stripes(c: Ctx, v: V) {
    // 4周目：素の字から縞の字へ溶かして、1往復で素の字へ戻す（旧版は1コマ目から最後まで縞で、素の見出しを一度も通らなかった）
    const pitch = K(c, v.pitch, 48) * 0.5
    const on = pitch * v.ratio
    const grad = `repeating-linear-gradient(${90 + v.lean}deg, ${c.ink} 0 ${on}px, ${c.muted} ${on}px ${pitch}px)`
    const D = Math.min(2400, Math.max(1600, S(v.cycle) * 1.5))
    const g = c.ghost()
    g.querySelectorAll<HTMLElement>(".mdt-c").forEach((ch) => {
        const b = c.box(ch)
        ch.style.color = "transparent"
        ch.style.backgroundImage = grad
        ch.style.setProperty("-webkit-background-clip", "text")
        ch.style.backgroundClip = "text"
        const x0 = -(b.x - c.tb.x)
        const d = pitch / Math.cos((v.lean * Math.PI) / 180)
        c.a(ch, [{ backgroundPosition: `${x0}px 0` }, { backgroundPosition: `${x0 + d * Math.round(D / S(v.cycle) * 3)}px 0` }], { duration: D, easing: "linear", fill: "both" })
    })
    c.a(g, [{ opacity: 0 }, { offset: 0.18, opacity: 1 }, { offset: 0.82, opacity: 1 }, { opacity: 0 }], { duration: D, fill: "both" })
    c.a(c.txt, [{ opacity: 1 }, { offset: 0.18, opacity: 0 }, { offset: 0.82, opacity: 0 }, { opacity: 1 }], { duration: D })
    return D
}
function brackets(c: Ctx, v: V) {
    const B = pad(c.tb, c, 0.16)
    const s = K(c, v.size, 16) * 0.7
    const t = Math.max(2, Math.round(c.fs / 36))
    const D = S(v.duration)
    const corners: [number, number, string][] = [[B.x, B.y, "top:0;left:0"], [B.x + B.w - s, B.y, "top:0;right:0"], [B.x + B.w - s, B.y + B.h - s, "bottom:0;right:0"], [B.x, B.y + B.h - s, "bottom:0;left:0"]]
    corners.forEach(([x, y, pos], k) => {
        const el = c.fx(`left:${x}px;top:${y}px;width:${s}px;height:${s}px;`)
        const sides = pos.split(";").map((p) => p.split(":")[0])
        el.style.borderStyle = "solid"
        el.style.borderColor = c.ink
        el.style.borderWidth = "0"
        sides.forEach((sd) => ((el.style as any)["border" + sd[0].toUpperCase() + sd.slice(1) + "Width"] = t + "px"))
        el.style.boxSizing = "border-box"
        const dx = (k === 0 || k === 3 ? -1 : 1) * s, dy = (k < 2 ? -1 : 1) * s
        c.a(el, [{ transform: `translate(${dx}px, ${dy}px) rotate(${v.spin}deg)`, opacity: 0, easing: OUT }, { offset: 0.35, transform: "translate(0px,0px) rotate(0deg)", opacity: 1 }, { offset: 0.75, transform: "translate(0px,0px) rotate(0deg)", opacity: 1, easing: "ease-in" }, { transform: `translate(${dx * 0.5}px, ${dy * 0.5}px) rotate(0deg)`, opacity: 0 }], { duration: D * 3 + 900, delay: k * S(v.stagger), fill: "both" })
    })
    return D * 3 + 900 + 4 * S(v.stagger)
}
function scan(c: Ctx, v: V) {
    const B = pad(c.tb, c)
    const sp = Math.max(2, K(c, v.spacing, 40) * 0.6)
    const el = c.fx(at(B) + `background:repeating-linear-gradient(180deg, rgba(244,244,241,${0.4 + v.opacity}) 0 ${sp / 2}px, transparent ${sp / 2}px ${sp}px);`)
    const bar = c.fx(at({ ...B, h: B.h * 0.3 }) + `background:linear-gradient(180deg, transparent, rgba(244,244,241,.6), transparent);`)
    const D = 1800
    const kf: Keyframe[] = [{ opacity: 0 }, { offset: 0.1, opacity: 1 }]
    const r = rnd(2)
    for (let k = 1; k < 8; k++) kf.push({ offset: 0.1 + k * 0.09, opacity: 1 - r() * v.flicker })
    kf.push({ offset: 0.85, opacity: 1 }, { offset: 1, opacity: 0 })
    c.a(el, kf, { duration: D, fill: "both" })
    c.a(bar, [{ transform: `translateY(${-B.h * 0.3}px)`, opacity: 0 }, { offset: 0.2, opacity: 1 }, { offset: 0.8, opacity: 1 }, { transform: `translateY(${B.h}px)`, opacity: 0 }], { duration: v.sweep ? D : 0.01, fill: "both" })
    return D
}
function liquid(c: Ctx, v: V) {
    const id = "mdt-liq-" + Math.random().toString(36).slice(2, 8)
    const svg = c.fx("left:0;top:0;width:0;height:0;", "div")
    svg.innerHTML = `<svg width="0" height="0" style="position:absolute"><filter id="${id}" x="-10%" y="-30%" width="120%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="${v.frequency}" numOctaves="${Math.round(v.octaves)}" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`
    const disp = svg.querySelector("feDisplacementMap")!
    const turb = svg.querySelector("feTurbulence")!
    c.txt.style.filter = `url(#${id})`
    const D = Math.min(S(v.duration) * 0.35, 3600)
    const sc = v.scale * (c.fs / 40)
    c.loop((t) => {
        const k = Math.min(1, t / D)
        const e = Math.sin(Math.PI * k)
        disp.setAttribute("scale", (sc * e).toFixed(2))
        turb.setAttribute("baseFrequency", `${(v.frequency * (1 + 0.3 * Math.sin(k * 6))).toFixed(4)} ${(v.frequency * 1.4).toFixed(4)}`)
        return k < 1
    })
    return D + 40
}
function tabAct(c: Ctx, v: V) {
    // 語が少ないときは文字を3つの区切りにまとめた範囲を「タブ」にする（要素は要らない。範囲だけ）
    type Seg = { b: Box }
    let ws: Seg[] = c.words.map((w) => ({ b: c.box(w) }))
    if (c.words === c.chars) {
        const n = c.chars.length, k = Math.min(3, n)
        ws = Array.from({ length: k }, (_, j) => {
            const part = c.chars.slice(Math.floor((j * n) / k), Math.floor(((j + 1) * n) / k))
            const a = c.box(part[0]), z = c.box(part[part.length - 1])
            return { b: { x: a.x, y: a.y, w: z.x + z.w - a.x, h: a.h } }
        })
    }
    const th = Math.max(2, Math.round(c.fs * 0.045))
    const bar = c.fx(`left:0;top:0;width:1px;height:${th}px;background:${c.ink};transform-origin:0 0;`)
    const D = S(v.duration)
    const kf: Keyframe[] = []
    const hop = D * 1.6
    const T = hop * ws.length + 400
    ws.forEach((w, i) => {
        const b = w.b
        const y = b.y + b.h - th * 0.5
        const k0 = { offset: (i * hop) / T, transform: `translate(${b.x}px, ${y}px) scaleX(${b.w})`, opacity: 1, easing: OUT }
        kf.push(k0)
        if (v.stretch === 1 && i < ws.length - 1) {
            const nb = ws[i + 1].b
            if (Math.abs(nb.y - b.y) < 2) kf.push({ offset: ((i + 0.5) * hop) / T, transform: `translate(${b.x}px, ${y}px) scaleX(${nb.x + nb.w - b.x})`, opacity: 1, easing: OUT })
        }
    })
    kf[0] = { ...kf[0], opacity: 0 }
    const last = kf[kf.length - 1]
    kf.push({ ...last, offset: (ws.length * hop) / T, easing: "ease" })
    kf.push({ ...last, offset: 1, opacity: 0 })
    c.a(bar, kf, { duration: T, fill: "both" })
    return T
}
function tipAct(c: Ctx, v: V) {
    const tip = c.fx(`left:${c.tb.x}px;top:${c.tb.y - c.fs * 0.42}px;padding:${Math.max(4, c.fs * 0.06)}px ${Math.max(8, c.fs * 0.12)}px;background:${c.ink};color:${c.paper};font:400 ${Math.max(11, c.fs * 0.16)}px/1.3 ${MONO};white-space:nowrap;border-radius:6px;transform-origin:0 100%;`)
    tip.textContent = c.en
    const D = S(v.duration)
    const T = S(v.delay) + D + 1200 + D
    c.a(tip, [
        { offset: 0, opacity: 0, transform: "translateY(4px) scale(.94)" },
        { offset: S(v.delay) / T, opacity: 0, transform: "translateY(4px) scale(.94)", easing: OUT },
        { offset: (S(v.delay) + D) / T, opacity: 1, transform: "translateY(0px) scale(1)" },
        { offset: (T - D) / T, opacity: 1, transform: "translateY(0px) scale(1)", easing: "ease-in" },
        { offset: 1, opacity: 0, transform: "translateY(4px) scale(.94)" },
    ], { duration: T, fill: "both" })
    c.a(c.txt, [{ opacity: 1 }, { offset: S(v.delay) / T, opacity: 1 }, { offset: (S(v.delay) + D) / T, opacity: 0.55 }, { offset: (T - D) / T, opacity: 0.55 }, { opacity: 1 }], { duration: T })
    return T
}
function pill(c: Ctx, v: V) {
    const B = pad(c.tb, c, 0.16)
    const el = c.fx(at(B) + `border:1px solid ${c.ink};border-radius:${B.h}px;box-sizing:border-box;`)
    const D = S(v.duration) * 2.2
    const ox = v.origin === 1 ? "50%" : v.origin === 2 ? "100%" : "0%"
    const sw = Math.min(1, (B.h * 1.0) / B.w)
    el.style.transformOrigin = `${ox} 50%`
    const T = D + S(v.labelDelay) * 2 + 1000
    c.a(el, [{ transform: `scaleX(${sw})`, opacity: 0 }, { offset: 0.05, opacity: 1 }, { offset: D / T, transform: "scaleX(1)", easing: "linear" }, { offset: 0.85, transform: "scaleX(1)", opacity: 1 }, { offset: 1, transform: "scaleX(1)", opacity: 0 }], { duration: T, easing: OUT, fill: "both" })
    const clipL = v.origin === 1 ? closedC(c) : v.origin === 2 ? closedR(c) : closedL(c)
    c.a(c.txt, [{ opacity: 0, clipPath: clipL }, { offset: (S(v.labelDelay) * 2) / T, opacity: 0, clipPath: clipL, easing: OUT }, { offset: (S(v.labelDelay) * 2 + D) / T, opacity: 1, clipPath: "inset(-20% -5% -20% -5%)" }, { opacity: 1, clipPath: "inset(-20% -5% -20% -5%)" }], { duration: T })
    return T
}
function ripple(c: Ctx, v: V) {
    const sz = K(c, v.size, 40)
    const x = c.tb.x + c.tb.w * 0.3, y = c.tb.y + c.tb.h / 2
    const B = pad(c.tb, c)
    const box = c.fx(at(B) + "overflow:hidden;")
    const dot = document.createElement("div")
    dot.style.cssText = `position:absolute;left:${x - B.x - sz / 2}px;top:${y - B.y - sz / 2}px;width:${sz}px;height:${sz}px;border-radius:50%;background:rgba(10,10,10,.16);`
    box.appendChild(dot)
    c.a(dot, [{ transform: "scale(0)", opacity: 1 }, { transform: `scale(${(B.w / sz) * 2.2})`, opacity: 0 }], { duration: S(v.duration) * 1.6, easing: "cubic-bezier(.2,.6,.3,1)", fill: "both" })
    return S(v.duration) * 1.6
}
function copied(c: Ctx, v: V) {
    const el = c.fx(`left:${c.tb.x + c.tb.w - c.fs * 0.2}px;top:${c.tb.y}px;padding:${Math.max(4, c.fs * 0.06)}px ${Math.max(8, c.fs * 0.12)}px;background:${c.ink};color:${c.accent};font:400 ${Math.max(11, c.fs * 0.16)}px/1.3 ${MONO};white-space:nowrap;border-radius:6px;`)
    el.textContent = "Copied ✓"
    const r = K(c, v.rise, 16)
    const T = 300 + S(v.hold) + 400
    c.a(el, [{ transform: "translateY(0px)", opacity: 0, easing: OUT }, { offset: 300 / T, transform: `translateY(${-r}px)`, opacity: 1 }, { offset: (300 + S(v.hold)) / T, transform: `translateY(${-r}px)`, opacity: 1, easing: "ease-in" }, { transform: `translateY(${-r * 1.6}px)`, opacity: 0 }], { duration: T, fill: "both" })
    if (v.flash > 0) c.a(c.txt, [{ opacity: 1 }, { offset: 0.1, opacity: 0.4 }, { offset: Math.min(1, (S(v.flash) + 120) / T), opacity: 1 }, { opacity: 1 }], { duration: T })
    return T
}
function burst(c: Ctx, v: V) {
    const D = S(v.duration) * 1.8
    const cx = c.tb.x + c.tb.w / 2, cy = c.tb.y + c.tb.h / 2
    const sp = K(c, v.spread, 150) * 0.7
    const r = rnd(8)
    return each(c, {
        dur: D, origin: "50% 50%",
        kf: (_i, _n, el) => {
            const b = c.box(el)
            const ang = Math.atan2(b.y + b.h / 2 - cy, b.x + b.w / 2 - cx) + (r() - 0.5) * 1.2
            const dist = sp * (0.6 + r() * 0.6)
            const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - sp * 0.3
            const g = sp * v.gravity * 0.8
            const rot = (r() - 0.5) * 220
            return [
                { offset: 0, transform: "translate(0px,0px) rotate(0deg)", easing: "cubic-bezier(.2,.8,.3,1)" },
                { offset: 0.35, transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${rot.toFixed(0)}deg)`, easing: "ease-in" },
                { offset: 0.55, transform: `translate(${(dx * 1.1).toFixed(1)}px, ${(dy + g).toFixed(1)}px) rotate(${(rot * 1.2).toFixed(0)}deg)`, easing: INOUT },
                { offset: 1, transform: "translate(0px,0px) rotate(0deg)" },
            ]
        },
    })
}
function likeBurst(c: Ctx, v: V) {
    const D = S(v.duration) * 1.6
    const n = Math.round(v.count)
    const cx = c.tb.x + c.tb.w, cy = c.tb.y + c.tb.h * 0.3
    const sp = K(c, v.spread, 32) * 0.7
    for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2
        const d = c.fx(`left:${cx - 3}px;top:${cy - 3}px;width:6px;height:6px;border-radius:50%;background:${k % 2 ? c.ink : c.muted};`)
        c.a(d, [{ transform: "translate(0px,0px) scale(1)", opacity: 1 }, { transform: `translate(${Math.cos(a) * sp}px, ${Math.sin(a) * sp}px) scale(.3)`, opacity: 0 }], { duration: D * 0.7, delay: D * 0.25, easing: "cubic-bezier(.2,.8,.3,1)", fill: "both" })
    }
    c.txt.style.transformOrigin = `${c.tb.x + c.tb.w}px ${c.tb.y + c.tb.h / 2}px`
    c.a(c.txt, [{ transform: `scale(${0.6 + v.startScale * 0.5})`, opacity: 0.4, easing: BACK }, { offset: 0.45, transform: "scale(1)", opacity: 1 }, { transform: "scale(1)", opacity: 1 }], { duration: D })
    return D
}
function scratch(c: Ctx, v: V) {
    // 2026-10-25（3周目）：旧版は行の端どうしを斜めに結ぶジグザグで削っていたので、削り終わりに三角の膜が字の上に残り、
    // 消えるまで約1秒「削り残し」に見えていた（レビュー指摘・SP）。行ごとに横へ往復して削り、
    // しきい値に届いた瞬間から残りを fade 秒で消す（デモと同じ「打ち切りの閾値」）
    const B = pad(c.tb, c, 0.1)
    const { g } = overlayCanvas(c)
    g.fillStyle = c.muted
    g.fillRect(B.x, B.y, B.w, B.h)
    const br = K(c, v.brush, 32) * 0.5
    // 4周目：見えている字の上に膜が降りてから削る（旧版は1コマ目から灰色の膜で字が隠れていた）。
    // 膜が降りる 0.2秒 → 削る 0.6秒 → しきい値で残りを消す。字が膜の下にある時間は約0.4秒まで
    const IN = 200
    const D = 600
    const fade = Math.min(300, Math.max(120, S(v.fade)))
    c.a(g.canvas, [{ opacity: 0 }, { opacity: 1 }], { duration: IN, easing: "ease-out" })
    // 線の太さ（2br）より行の間隔を狭くして、行と行の間に膜が残らないようにする
    const rows = Math.max(2, Math.ceil(B.h / (br * 1.7)))
    const pts: [number, number][] = []
    for (let r = 0; r < rows; r++) {
        const y = B.y + (B.h * (r + 0.5)) / rows
        const L: [number, number] = [B.x - br * 0.3, y], Rt: [number, number] = [B.x + B.w + br * 0.3, y]
        if (r % 2) pts.push(Rt, L)
        else pts.push(L, Rt)
    }
    const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]))
    const total = seg.reduce((x, y) => x + y, 0)
    const goal = total * Math.min(1, v.threshold / 100)
    let done = false
    c.loop((t0) => {
        const t = Math.max(0, t0 - IN)
        let left = goal * Math.min(1, t / D)
        g.globalCompositeOperation = "destination-out"
        g.lineCap = "round"
        g.lineJoin = "round"
        g.lineWidth = br * 2
        g.beginPath()
        g.moveTo(pts[0][0], pts[0][1])
        for (let i = 0; i < seg.length && left > 0; i++) {
            const f = Math.min(1, left / seg[i])
            const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]
            g.lineTo(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f)
            left -= seg[i]
        }
        g.stroke()
        g.globalCompositeOperation = "source-over"
        if (t >= D && !done) {
            done = true
            c.a(g.canvas, [{ opacity: 1 }, { opacity: 0 }], { duration: fade, easing: "ease-out", fill: "forwards" })
        }
        return t < D + fade
    })
    return IN + D + fade + 40
}
function gift(c: Ctx, v: V) {
    const D = S(v.duration)
    const n = Math.max(1, Math.round(v.peeks))
    const top = c.ghost()
    const cut = c.tb.y + c.tb.h * 0.45
    top.style.clipPath = `inset(-30% -5% ${c.H - cut}px -5%)`
    c.rootStyle({})
    c.a(c.txt, [{ clipPath: `inset(${cut}px -5% -20% -5%)` }, { clipPath: `inset(${cut}px -5% -20% -5%)` }], { duration: D * n })
    const kf: Keyframe[] = []
    for (let k = 0; k < n; k++) {
        const o = k / n
        kf.push({ offset: o, transform: "translateY(0px) rotate(0deg)", easing: "cubic-bezier(.2,.8,.3,1)" })
        kf.push({ offset: o + 0.35 / n, transform: `translateY(${-K(c, v.lift, 24)}px) rotate(${-v.tilt * 0.5}deg)`, easing: "cubic-bezier(.6,0,.8,.4)" })
        kf.push({ offset: o + 0.6 / n, transform: "translateY(0px) rotate(0deg)", easing: "ease-out" })
    }
    kf.push({ offset: 1, transform: "translateY(0px) rotate(0deg)" })
    top.style.transformOrigin = `${c.tb.x}px ${cut}px`
    c.a(top, kf, { duration: D * n, fill: "both" })
    return D * n
}
function crumple(c: Ctx, v: V) {
    const D = S(v.duration) * 2.6
    const o = `${c.tb.x + c.tb.w / 2}px ${c.tb.y + c.tb.h / 2}px`
    c.txt.style.transformOrigin = o
    const b = Math.max(0.08, v.ball * 1.5)
    const tx = K(c, v.toss, 180) * 0.6
    const w = v.wrinkle
    return whole(c, [
        { offset: 0, transform: "translate(0px,0px) scale(1,1) rotate(0deg) skewX(0deg)", opacity: 1, easing: "ease-in" },
        { offset: 0.3, transform: `translate(0px,0px) scale(${b * 2.5},${b * 1.8}) rotate(${w * 2}deg) skewX(${w}deg)`, opacity: 1, easing: "cubic-bezier(.3,0,.6,1)" },
        { offset: 0.5, transform: `translate(${tx}px, ${-c.fs * 0.5}px) scale(${b},${b}) rotate(${w * 20}deg) skewX(${w}deg)`, opacity: 0 },
        { offset: 0.55, transform: "translate(0px,0px) scale(.92,.92) rotate(0deg) skewX(0deg)", opacity: 0, easing: OUT },
        { offset: 1, transform: "translate(0px,0px) scale(1,1) rotate(0deg) skewX(0deg)", opacity: 1 },
    ], D)
}
function chat(c: Ctx, v: V) {
    const typing = S(v.baseTyping) + v.perChar * c.chars.length * 0.4
    const dsz = Math.max(5, c.fs * 0.1)
    const T = typing + S(v.enter) * 2 + 300
    for (let k = 0; k < 3; k++) {
        const d = c.fx(`left:${c.tb.x + k * dsz * 1.8}px;top:${c.tb.y + c.tb.h / 2 - dsz / 2}px;width:${dsz}px;height:${dsz}px;border-radius:50%;background:${c.ink};`)
        const kf: Keyframe[] = [{ offset: 0, opacity: 0.25, transform: "translateY(0px)" }]
        for (let j = 0; j < 4; j++) {
            const o = Math.min(0.99, ((j * 300 + k * 100) / T))
            if (o * T > typing) break
            kf.push({ offset: o, opacity: 1, transform: `translateY(${-dsz * 0.5}px)` })
            kf.push({ offset: Math.min(0.995, o + 0.05), opacity: 0.25, transform: "translateY(0px)" })
        }
        kf.push({ offset: typing / T, opacity: 0.25 })
        kf.push({ offset: Math.min(1, typing / T + 0.02), opacity: 0 })
        kf.push({ offset: 1, opacity: 0 })
        kf.sort((a, b) => (a.offset as number) - (b.offset as number))
        c.a(d, kf, { duration: T, fill: "both" })
    }
    c.txt.style.transformOrigin = `${c.tb.x}px ${c.tb.y + c.tb.h}px`
    c.a(c.txt, [{ offset: 0, opacity: 0, transform: `translateY(${c.fs * 0.3}px) scale(.9)` }, { offset: typing / T, opacity: 0, transform: `translateY(${c.fs * 0.3}px) scale(.9)`, easing: OUT }, { offset: Math.min(1, (typing + S(v.enter) * 2) / T), opacity: 1, transform: "translateY(0px) scale(1)" }, { offset: 1, opacity: 1, transform: "translateY(0px) scale(1)" }], { duration: T })
    return T
}
function pageTurn(c: Ctx, v: V) {
    const D = S(v.duration)
    const pr = v.perspective * (c.tb.w / 240)
    const B = pad(c.tb, c)
    // 下のページ（素の見出し）は綴じ目の影から明るむ。めくる紙より先に置く（重なり順＝下）
    const under = c.fx(at(B) + `background:linear-gradient(90deg, rgba(10,10,10,${(v.shade / 100) * 0.6}), rgba(10,10,10,0) 60%);`)
    const g = c.ghost()
    g.style.background = c.paper
    g.style.transformOrigin = `${B.x}px 50%`
    g.style.backfaceVisibility = "hidden"
    g.style.clipPath = `inset(${B.y}px ${c.W - B.x - B.w}px ${c.H - B.y - B.h}px ${B.x}px)`
    const shade = document.createElement("div")
    shade.style.cssText = `position:absolute;left:${B.x}px;top:${B.y}px;width:${B.w}px;height:${B.h}px;background:linear-gradient(90deg, rgba(10,10,10,1), rgba(10,10,10,0));pointer-events:none;`
    g.appendChild(shade)
    const ease = "cubic-bezier(0.45, 0, 0.25, 1)"
    c.a(g, [{ transform: `perspective(${pr}px) rotateY(0deg)` }, { transform: `perspective(${pr}px) rotateY(-180deg)` }], { duration: D, easing: ease, fill: "both" })
    c.a(shade, [{ opacity: 0 }, { opacity: v.shade / 100 }, { opacity: 0 }], { duration: D, easing: ease, fill: "both" })
    // 4周目：綴じ目の影は紙がめくれ始めてから濃くなる（旧版は1コマ目から影の箱が見出しに掛かっていた）
    c.a(under, [{ opacity: 0 }, { offset: 0.25, opacity: 1 }, { opacity: 0 }], { duration: D, easing: ease, fill: "both" })
    return D + 40
}
function peel(c: Ctx, v: V) {
    const B = pad(c.tb, c, 0.1)
    const d = Math.min(B.h, K(c, v.depth, 32) * 0.9)
    const D = S(v.duration)
    const T = D * 2 + S(v.hold)
    const poly = (k: number) => `polygon(${B.x}px ${B.y}px, ${B.x + B.w}px ${B.y}px, ${B.x + B.w}px ${B.y + B.h - d * k}px, ${B.x + B.w - d * k}px ${B.y + B.h}px, ${B.x}px ${B.y + B.h}px)`
    const flap = c.fx(`left:${B.x + B.w - d}px;top:${B.y + B.h - d}px;width:${d}px;height:${d}px;background:linear-gradient(${135 + v.angle * 0.3}deg, ${c.muted}, ${c.paper});clip-path:polygon(0 100%, 100% 0, 0 0);transform-origin:100% 100%;`)
    const a = D / T, b = (D + S(v.hold)) / T
    c.a(c.txt, [{ offset: 0, clipPath: poly(0), easing: OUT }, { offset: a, clipPath: poly(1) }, { offset: b, clipPath: poly(1), easing: OUT }, { offset: 1, clipPath: poly(0) }], { duration: T })
    c.a(flap, [{ offset: 0, transform: "scale(0)", easing: OUT }, { offset: a, transform: "scale(1)" }, { offset: b, transform: "scale(1)", easing: OUT }, { offset: 1, transform: "scale(0)" }], { duration: T, fill: "both" })
    return T
}
function badge(c: Ctx, v: V) {
    const s = Math.max(8, c.fs * 0.16)
    const el = c.fx(`left:${c.tb.x + c.tb.w - s * 0.2 + K(c, v.offset, 24) * 0.2}px;top:${c.tb.y + c.fs * 0.1 - s / 2}px;width:${s}px;height:${s}px;border-radius:50%;background:${c.ink};box-shadow:0 0 0 2px ${c.paper};`)
    const D = S(v.duration)
    const T = D + 1000 + D * 0.6
    c.a(el, [{ offset: 0, transform: "scale(0)", easing: "ease-out" }, { offset: (D * 0.6) / T, transform: `scale(${v.overshoot})`, easing: "ease-in-out" }, { offset: D / T, transform: "scale(1)" }, { offset: (D + 1000) / T, transform: "scale(1)", easing: "ease-in" }, { offset: 1, transform: "scale(0)" }], { duration: T, fill: "both" })
    return T
}
function rings(c: Ctx, v: V) {
    const B = pad(c.tb, c, 0.1)
    const n = Math.round(v.count)
    const D = S(v.duration)
    for (let k = 0; k < n; k++) {
        const el = c.fx(at(B) + `border:1px solid ${c.ink};border-radius:${c.fs * 0.2}px;box-sizing:border-box;transform-origin:50% 50%;`)
        c.a(el, [{ transform: "scale(1)", opacity: 0 }, { offset: 0.12, opacity: 0.7 }, { transform: `scale(${1 + v.spread * 0.03}, ${1 + v.spread * 0.12})`, opacity: 0 }], { duration: D, delay: (k * D) / n, easing: "cubic-bezier(.2,.6,.3,1)", fill: "both" })
    }
    return D * 2
}
function orbit(c: Ctx, v: V) {
    const cx = c.tb.x + c.tb.w / 2, cy = c.tb.y + c.tb.h / 2
    const rx = c.tb.w / 2 + c.fs * 0.3 * (v.radius / 84), ry = rx * v.tilt * 0.35
    const s = Math.max(6, c.fs * 0.12)
    const dot = c.fx(`left:${cx - s / 2}px;top:${cy - s / 2}px;width:${s}px;height:${s}px;border-radius:50%;background:${c.ink};`)
    const T = S(v.period) * 1.4
    const N = 36
    const kf: Keyframe[] = []
    for (let k = 0; k <= N; k++) {
        const t = k / N
        const a = t * 2 * Math.PI * 1.4 - Math.PI / 2
        const z = Math.sin(a)
        kf.push({ offset: t, transform: `translate(${(Math.cos(a) * rx).toFixed(1)}px, ${(z * ry).toFixed(1)}px) scale(${(1 + z * v.depth).toFixed(3)})`, opacity: t < 0.08 ? t / 0.08 : t > 0.92 ? (1 - t) / 0.08 : 1 })
    }
    c.a(dot, kf, { duration: T, fill: "both" })
    return T
}
function skeleton(c: Ctx, v: V) {
    const lines = lineBoxes(c)
    const D = 1600
    const els: HTMLElement[] = []
    lines.forEach((L) => {
        const el = c.fx(`left:${L.x}px;top:${L.y + L.h * 0.18}px;width:${L.w}px;height:${L.h * 0.64}px;border-radius:${c.fs * 0.08}px;background:rgba(10,10,10,.08) linear-gradient(90deg, rgba(244,244,241,0) 0%, rgba(244,244,241,.9) 50%, rgba(244,244,241,0) 100%) no-repeat;background-size:${v.width}% 100%;`)
        els.push(el)
        c.a(el, [{ backgroundPosition: `-${v.width}% 0` }, { backgroundPosition: `${100 + v.width * 2}% 0` }], { duration: S(v.speed), iterations: Math.ceil(D / S(v.speed)), easing: "linear" })
        c.a(el, [{ opacity: 1 }, { offset: 0.8, opacity: 1 }, { opacity: 0 }], { duration: D + 300, fill: "both" })
    })
    c.a(c.txt, [{ opacity: 0 }, { offset: 0.8, opacity: 0 }, { opacity: 1 }], { duration: D + 300 })
    return D + 300
}
function liquidFill(c: Ctx, v: V) {
    const D = S(v.duration) * 1.4
    const sw = Math.max(1, Math.round((c.fs / 90) * 10) / 10)
    const g = c.ghost()
    c.txt.style.color = "transparent"
    c.txt.style.setProperty("-webkit-text-stroke", `${sw}px ${c.ink}`)
    const A = K(c, v.amplitude, 24) * 0.5
    const top = c.tb.y - A, bot = c.tb.y + c.tb.h + A
    const poly = (lvl: number, ph: number) => {
        const y = bot - (bot - top) * lvl
        const pts: string[] = []
        for (let k = 0; k <= 12; k++) {
            const x = (c.W * k) / 12
            pts.push(`${x.toFixed(1)}px ${(y + Math.sin(ph + k * 0.9) * A).toFixed(1)}px`)
        }
        return `polygon(${pts.join(", ")}, ${c.W}px ${c.H + c.fs}px, 0px ${c.H + c.fs}px)`
    }
    const p = v.progress / 100
    const sp = v.speed
    c.loop((t) => {
        const k = Math.min(1, t / D)
        const e = 1 - Math.pow(1 - k, 3)
        const lvl = k < 0.7 ? e / (1 - Math.pow(0.3, 3)) * p : p + (1 - p) * ((k - 0.7) / 0.3)
        g.style.clipPath = poly(Math.min(1.05, lvl), (t / 1000) * sp * 2)
        return k < 1
    })
    return D + 40
}
function carouselAct(c: Ctx, D: number) {
    const g = c.ghost()
    c.rootStyle({ clipPath: CLIP_BOX })
    const off = c.tb.x + c.tb.w + c.fs * 0.5
    c.a(c.txt, [{ transform: "translateX(0px)" }, { transform: `translateX(${-off}px)` }], { duration: D * 1.4, easing: INOUT })
    c.a(g, [{ transform: `translateX(${c.W - c.tb.x + c.fs * 0.5}px)` }, { transform: "translateX(0px)" }], { duration: D * 1.4, easing: INOUT, fill: "both" })
    return D * 1.4
}

/* ================================================================== */
/* コンポーネント                                                       */
/* ================================================================== */

/**
 * Entry Title
 *
 * @framerIntrinsicWidth 760
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function EntryTitle(props: Props) {
    const {
        nameJa = "パスワード強度メーター（打つたびにバーが伸びて色が変わる）",
        nameEn = "password strength meter",
        ink = "#0A0A0A",
        muted = "#6B6B66",
        accent = "#A5E02E",
        paper = "#F4F4F1",
        base = "https://ryota4100221-cmyk.github.io/motion-dict",
    } = props
    const isStatic = useIsStaticRenderer()
    const [main, sub] = split(nameJa)
    // 見出し語の字数と枠の幅（コンテナ単位 cqi）から文字サイズを決める。SSRの時点で確定する
    // ＝読み込み後に大きさが変わらない。1行に収まる大きさ・上限72px・下限30px。
    const len = Math.max(4, Math.min(Array.from(main).length, 11))
    // round() で整数pxに丸める（小数の文字サイズ・字間はにじむ）。未対応ブラウザは clamp のまま
    const raw = `clamp(30px, ${(98 / len).toFixed(2)}cqi, 72px)`
    const rawSub = `clamp(17px, ${((98 / len) * 0.36).toFixed(2)}cqi, 26px)`
    const cls = `mdt-${len}`
    // 見出し語の書体の切り出しに入れる字（見出し語＋英名＝英名を見出しの字で出す演技がある＋数字）
    const headText = main + " " + nameEn + "0123456789"
    const headCss = headCssUrl(headText)

    const [slug, setSlug] = useState(props.slug || "")
    const [params, setParams] = useState<Param[]>(() => parseParams(props.paramsJson))
    const [values, setValues] = useState<V>(() => Object.fromEntries(parseParams(props.paramsJson).map((p) => [p.key, p.default])))
    const [cat, setCat] = useState(props.category || "")
    const mainRef = useRef<HTMLSpanElement>(null)
    const hitRef = useRef<HTMLDivElement>(null)
    const valuesRef = useRef(values)
    valuesRef.current = values

    // slug：バインドが無ければ URL から。描画の前（paint 前）に取る＝着地直後に別の項目名が一瞬出ない。
    // 旧版は SSR の時点で slug が無く、対応表に無い扱い（C・テキスト章）で「分割テキストリビール」と描いてから正しい名前に変わっていた
    useIsoLayout(() => {
        if (props.slug) { if (props.slug !== slug) setSlug(props.slug); return }
        const s = slugFromLocation()
        if (s && s !== slug) setSlug(s)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.slug])

    // 値の定義が無ければ項目JSONから（バインド忘れ・キャンバス）。カテゴリも取る（表に無い新項目＝C の章を決める）
    useEffect(() => {
        if (isStatic || !slug) return
        if (params.length && (SPEC[slug] || cat)) return
        let alive = true
        fetch(`${base}/entry/${slug}.json`).then((r) => r.json()).then((d) => {
            if (!alive || !d) return
            if (d.category) setCat(d.category)
            if (Array.isArray(d.params) && d.params.length) {
                // 既に EntryLab から届いていれば差し替えない（配列が変わると演技の effect が張り直され、着地の演技が消えていた）
                setParams((cur) => (cur.length ? cur : d.params))
                setValues((cur) => ({ ...Object.fromEntries(d.params.map((p: Param) => [p.key, p.default])), ...cur }))
            }
        }).catch(() => {})
        return () => { alive = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug, isStatic, base])

    const spec: Spec = SPEC[slug] || ["C", cat in CH ? cat : "text"]
    // 演技の effect の張り直しの鍵。対応表にある項目は、章（cat）が後から届いても張り直さない
    const specKey = SPEC[slug] ? slug : "C:" + (cat in CH ? cat : "text")
    const grade = spec[0]
    const chap = grade === "C" ? CH[spec[1] as string] || CH.text : null

    // 章扉と同じ演技（C）は値の定義を使わない。旧版は値の定義が後から届くと effect が張り直され、
    // 着地の演技が始まって約50msで消されていた（4周目の判定で lightbox / toggle-switch / moire-drift 等で実測）
    const paramsDep = chap ? null : params
    const fitKey = chap ? chap.slug : slug
    // ── 演技のエンジン（クライアントのみ） ──
    const playRef = useRef<(why: string) => void>(() => {})
    const landedRef = useRef("")
    useEffect(() => {
        if (isStatic || typeof window === "undefined" || !slug) return
        const root = mainRef.current
        const hit = hitRef.current
        if (!root || !hit || typeof root.animate !== "function") return
        const txt = root.querySelector(".mdt-t") as HTMLElement
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches
        const flags = (chap ? chap.flags : (spec[2] as string)) || ""
        const isF = flags.includes("f"), isH = flags.includes("h"), isS = flags.includes("s")

        let anims: Animation[] = []
        let fxs: HTMLElement[] = []
        let timers: number[] = []
        let rafs: number[] = []
        let texts = new Map<HTMLElement, string>()
        let locked: HTMLElement[] = []
        let busyUntil = 0
        let follow: Follow | null = null
        let scroller: Scroll | null = null
        let held = false
        let inView = false
        let gen = 0
        let sweeping = false
        // 4周目：読める演技の枠（下の FIT）。tempo＝再生の速さ（長い演技を上限の長さに縮める）、lead＝素の姿で止まっている時間（ms）
        let tempo = 1
        let lead = 0
        let fitted = false
        let pendingLater: [() => void, number, number][] = []

        const allEls = () => [txt]
        const stop = () => {
            gen++
            anims.forEach((a) => { try { a.cancel() } catch {} })
            anims = []
            fxs.forEach((f) => f.remove())
            fxs = []
            timers.forEach((t) => clearTimeout(t))
            timers = []
            rafs.forEach((r) => cancelAnimationFrame(r))
            rafs = []
            texts.forEach((s, el) => (el.textContent = s))
            texts = new Map()
            locked = []
            tempo = 1
            lead = 0
            fitted = false
            pendingLater = []
            allEls().forEach((el) => { el.getAnimations().forEach((a) => a.cancel()); el.removeAttribute("style") })
            root.removeAttribute("style")
            follow = null
            scroller = null
            held = false
            busyUntil = 0
        }

        // 演じる間だけの「舞台」：素の見出し（SSRのまま・カーニングの効いた行組み）を実測し、
        // 同じ位置に1文字ずつ絶対配置した複製を重ねて、それを動かす。素の見出しは visibility:hidden で場所だけ残す。
        // ＝演技中も行の折り返し・高さは1pxも変わらない（文字を inline-block にすると仮名のカーニングが外れて最大10px伸び、
        //   折り返しが変わる項目があった）
        const build = (): Ctx => {
            const bx = new Map<HTMLElement, Box>()
            const rr = root.getBoundingClientRect()
            const LH = parseFloat(getComputedStyle(txt).lineHeight) || parseFloat(getComputedStyle(root).fontSize) * 1.12
            const stage = document.createElement("span")
            stage.className = "mdt-t mdt-fx mdt-stage"
            stage.setAttribute("aria-hidden", "true")
            stage.style.cssText = `left:0;top:0;width:${root.clientWidth}px;height:${root.clientHeight}px;`
            const chars: HTMLElement[] = []
            const wordsEl: HTMLElement[] = []
            txt.querySelectorAll<HTMLElement>(".mdt-p").forEach((rp) => {
                const cs = Array.from(rp.querySelectorAll<HTMLElement>(".mdt-c")).map((rc) => {
                    const r = rc.getBoundingClientRect()
                    // y/h＝行の箱（演技の位置計算用）／cy/ch＝字の内容領域（描画用。line-height を内容の高さに合わせると、ベースラインが素の行と同じ位置に来る）
                    return { t: rc.textContent || "", x: r.left - rr.left, y: r.top - rr.top - (LH - r.height) / 2, w: r.width, h: LH, cy: r.top - rr.top, ch: r.height }
                })
                if (!cs.length) return
                const wx = Math.min(...cs.map((q) => q.x)), wy = Math.min(...cs.map((q) => q.y))
                const wr = Math.max(...cs.map((q) => q.x + q.w)), wb = Math.max(...cs.map((q) => q.y + q.h))
                const wp = document.createElement("span")
                wp.className = "mdt-p"
                wp.style.cssText = `left:${wx}px;top:${wy}px;width:${wr - wx}px;height:${wb - wy}px;`
                bx.set(wp, { x: wx, y: wy, w: wr - wx, h: wb - wy })
                cs.forEach((q) => {
                    const sp = document.createElement("span")
                    sp.className = "mdt-c"
                    sp.textContent = q.t
                    sp.style.cssText = `left:${q.x - wx}px;top:${q.cy - wy}px;width:${q.w}px;height:${q.ch}px;line-height:${q.ch}px;`
                    bx.set(sp, { x: q.x, y: q.y, w: q.w, h: q.h })
                    wp.appendChild(sp)
                    chars.push(sp)
                })
                stage.appendChild(wp)
                wordsEl.push(wp)
            })
            root.appendChild(stage)
            fxs.push(stage)
            bx.set(stage, { x: 0, y: 0, w: root.clientWidth, h: root.clientHeight })
            txt.style.visibility = "hidden"
            const box = (el: HTMLElement): Box => {
                let b = bx.get(el)
                if (!b) {
                    b = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }
                    bx.set(el, b)
                }
                return b
            }
            const tops: number[] = []
            const lineOf = new Map<HTMLElement, number>()
            chars.forEach((ch) => {
                const y = box(ch).y
                let k = tops.findIndex((t) => Math.abs(t - y) < 4)
                if (k < 0) { tops.push(y); k = tops.length - 1 }
                lineOf.set(ch, k)
            })
            wordsEl.forEach((w) => {
                const y = box(w).y
                lineOf.set(w, Math.max(0, tops.findIndex((t) => Math.abs(t - y) < 4)))
            })
            let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9
            chars.forEach((ch) => { const b = box(ch); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h) })
            if (!chars.length) { x0 = 0; y0 = 0; x1 = root.clientWidth; y1 = root.clientHeight }
            const my = gen
            const c: Ctx = {
                // 語が2つ以下（カタカナ1語の見出し等）のときは、語の代わりに文字を単位にする（語単位の演技が1枚の動きになってしまうため）
                root, txt: stage, chars, words: wordsEl.length >= 3 ? wordsEl : chars, lineOf, nLines: Math.max(1, tops.length),
                fs: parseFloat(getComputedStyle(root).fontSize) || 60,
                W: root.clientWidth, H: root.clientHeight,
                tb: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 },
                ink, paper, muted, accent, en: sentence(nameEn).split(" / ")[0] || nameEn,
                box,
                a: (el, kf, o) => {
                    const an = el.animate(kf, { fill: "backwards", ...o })
                    // 枠を当てた後に作られた動き（later・loop の中）は、同じ速さで
                    if (fitted && tempo !== 1) an.playbackRate = tempo
                    anims.push(an)
                    return an
                },
                fx: (css, tag = "div") => {
                    const el = document.createElement(tag)
                    el.className = "mdt-fx"
                    el.setAttribute("aria-hidden", "true")
                    el.style.cssText += css
                    root.appendChild(el)
                    fxs.push(el)
                    return el
                },
                ghost: (color) => {
                    // 舞台（演技前の姿）の写し。演技で付いた style は写さない
                    const g = stage.cloneNode(true) as HTMLElement
                    g.querySelectorAll<HTMLElement>(".mdt-c, .mdt-p").forEach((e) => { e.style.removeProperty("transform"); e.style.removeProperty("opacity"); e.style.removeProperty("transform-origin") })
                    g.className = "mdt-t mdt-fx mdt-stage"
                    g.setAttribute("aria-hidden", "true")
                    g.style.cssText = `left:0;top:0;width:${root.clientWidth}px;height:${root.clientHeight}px;${color ? "color:" + color + ";" : ""}`
                    root.appendChild(g)
                    fxs.push(g)
                    return g
                },
                textGhost: (s, css = "") => {
                    const g = document.createElement("span")
                    g.className = "mdt-fx mdt-ghost"
                    g.setAttribute("aria-hidden", "true")
                    g.textContent = s
                    g.style.cssText = `left:${x0}px;top:${y0}px;white-space:nowrap;${css}`
                    root.appendChild(g)
                    fxs.push(g)
                    const maxW = Math.max(x1 - x0, root.clientWidth - x0)
                    if (g.offsetWidth > maxW) g.style.fontSize = `${(parseFloat(getComputedStyle(root).fontSize) * maxW) / g.offsetWidth}px`
                    return g
                },
                later: (fn, ms) => {
                    const go = () => { if (gen === my) fn() }
                    if (fitted) timers.push(window.setTimeout(go, ms / tempo))
                    else pendingLater.push([go, ms, my])
                },
                loop: (fn) => {
                    const t0 = performance.now()
                    const step = (now: number) => {
                        if (gen !== my) return
                        const t = (now - t0 - lead) * tempo
                        // lead の間は描かない（素の姿のまま）
                        if (t < 0) { if (inView) rafs.push(requestAnimationFrame(step)); return }
                        if (fn(t) && inView) rafs.push(requestAnimationFrame(step))
                    }
                    rafs.push(requestAnimationFrame(step))
                },
                setText: (el, s) => {
                    if (!texts.has(el)) texts.set(el, el.textContent || "")
                    el.textContent = s
                },
                lock: (els) => {
                    els.forEach((el) => {
                        const w = el.offsetWidth
                        el.style.width = w + "px"
                        el.style.textAlign = "center"
                        el.style.overflow = "visible"
                        locked.push(el)
                    })
                },
                rootStyle: (css) => {
                    for (const k in css) (root.style as any)[k] = css[k]
                },
            }
            return c
        }

        let lastC: Ctx | null = null
        // 4周目：演技の舞台を組んだ時の字の並び（書体が後から差し替わったかを見る）
        let builtSig = ""
        let lastWhy = ""
        const sig = () => { const cs = txt.querySelectorAll(".mdt-c"); const a = cs[0], z = cs[cs.length - 1]; if (!a || !z) return ""; const r0 = a.getBoundingClientRect(), r1 = z.getBoundingClientRect(); return `${Math.round(r1.right - r0.left)}x${Math.round(r1.bottom - r0.top)}` }
        let demoDone = false
        const run = (why = ""): R => {
            const c = build()
            builtSig = sig()
            lastWhy = why
            lastC = c
            if (chap) return chap.fn(c)
            const fn = spec[1]
            if (typeof fn !== "function") return CH.text.fn(c)
            let v: V = { ...Object.fromEntries(params.map((p) => [p.key, p.default])), ...valuesRef.current }
            // 着地の1回目だけ実演値（秒を縮める・小さい倍率を広げる）。以降は本来の値
            if (why === "land" && !demoDone) { demoDone = true; v = demoValues(slug, params, v) }
            return fn(c, v)
        }

        // 追う系（f）／スクロール系（s）を回す
        let ticking = false
        const tickLoop = () => {
            if (ticking) return
            ticking = true
            const my = gen
            const step = () => {
                if (gen !== my) { ticking = false; return }
                const o = follow || scroller
                if (!o) { ticking = false; return }
                const more = o.tick()
                if (more && inView) rafs.push(requestAnimationFrame(step))
                else { ticking = false; if (!more && !held) stop() }
            }
            rafs.push(requestAnimationFrame(step))
        }
        const rel = (e: PointerEvent) => {
            const r = root.getBoundingClientRect()
            return [e.clientX - r.left, e.clientY - r.top] as const
        }
        // ポインタの代わりに見出しの上を左から右へ横切る（着地・タップ・スライダー）
        const sweep = (f: Follow) => {
            const c = lastC!
            const t0 = performance.now()
            const my = gen
            held = true
            sweeping = true
            const D = 1700
            const step = (now: number) => {
                if (gen !== my || follow !== f || !sweeping) return
                // 4周目：入る前に LEAD だけ素の姿で止める（1コマ目から傾いて・散って始まらない）
                if (now - t0 < LEAD) { rafs.push(requestAnimationFrame(step)); return }
                const k = Math.min(1, (now - t0 - LEAD) / D)
                const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
                f.move(c.tb.x - c.fs * 0.4 + (c.tb.w + c.fs * 0.8) * e, c.tb.y + c.tb.h * (0.5 + 0.18 * Math.sin(k * Math.PI * 2)))
                tickLoop()
                if (k < 1) rafs.push(requestAnimationFrame(step))
                else { f.leave(); held = false; sweeping = false; tickLoop() }
            }
            rafs.push(requestAnimationFrame(step))
            tickLoop()
        }
        const synth = (s: Scroll) => {
            const t0 = performance.now()
            const my = gen
            held = true
            const D = 1400
            let last = 0
            const step = (now: number) => {
                if (gen !== my || scroller !== s) return
                if (now - t0 < LEAD) { rafs.push(requestAnimationFrame(step)); return }
                const k = Math.min(1, (now - t0 - LEAD) / D)
                const off = Math.sin(Math.PI * k) * 600
                s.push((off - last) * 0.9, off)
                last = off
                tickLoop()
                if (k < 1) rafs.push(requestAnimationFrame(step))
                else { s.push(0, 0); held = false; tickLoop() }
            }
            rafs.push(requestAnimationFrame(step))
            tickLoop()
        }

        // 枠を当てる：演技の長さ T を FIT の上限に縮め、lead の間は素の姿で止める。数値を返す演技・ホールドだけ（追う系・スクロール系は各自で守る）
        // 1コマ目が素の姿か（表に無い演技の lead を決める）：舞台と字の不透明度・ぼかし・塗り・位置、切り抜きの大きさを見る。
        // 初めから隠れている（現れる）演技に lead を足すと、隠れている時間が延びるだけなので付けない
        const restAtStart = (c: Ctx): boolean => {
            try {
                const rr = root.getBoundingClientRect()
                const hidden = (el: Element) => {
                    const cs = getComputedStyle(el)
                    if (parseFloat(cs.opacity) < 0.9 || /blur\((?!0px)/.test(cs.filter) || cs.visibility === "hidden") return true
                    const cp = cs.clipPath || ""
                    if (/circle\(0/.test(cp) || (/inset\(/.test(cp) && (cp.match(/(\d+(?:\.\d+)?)%/g) || []).some((x) => parseFloat(x) >= 30))) return true
                    return false
                }
                if ([root, c.txt].some(hidden)) return false
                if (c.words !== c.chars && c.words.some(hidden)) return false
                return c.chars.every((ch) => {
                    if (hidden(ch) || getComputedStyle(ch).color === "rgba(0, 0, 0, 0)") return false
                    const r = ch.getBoundingClientRect(), b = c.box(ch)
                    return Math.abs(r.left - rr.left - b.x) < c.fs * 0.06 && Math.abs(r.width - b.w) < b.w * 0.08 + 1 && Math.abs(r.top - rr.top - b.y - (b.h - r.height) / 2) < c.fs * 0.08
                })
            } catch {
                return false
            }
        }
        const fitAct = (res: R): R => {
            const T = typeof res === "number" ? res : res && (res as Hold).hold ? (res as Hold).ms : 0
            const f = FIT[fitKey]
            if (T > 0 && f) {
                tempo = f[1] && T > f[1] ? T / f[1] : 1
                lead = f[0] ? LEAD : 0
            } else if (T > 0 && lastC && restAtStart(lastC)) lead = LEAD
            fitted = true
            if (tempo !== 1 || lead) anims.forEach((a) => {
                try {
                    a.playbackRate = tempo
                    if (lead) a.currentTime = ((a.currentTime as number) || 0) - lead * tempo
                } catch {}
            })
            pendingLater.forEach(([go, ms, g]) => { if (g === gen) timers.push(window.setTimeout(go, lead + ms / tempo)) })
            pendingLater = []
            if (typeof res === "number") return res / tempo + lead
            if (res && (res as Hold).hold) return { hold: true, ms: (res as Hold).ms / tempo + lead }
            return res
        }
        const play = (why: string) => {
            if (reduced || !inView) return
            stop()
            const res = fitAct(run(why))
            if (!res) { stop(); return }
            if (typeof res === "number") {
                busyUntil = performance.now() + res
                const my = gen
                timers.push(window.setTimeout(() => { if (gen === my) stop() }, res + 80))
            } else if ((res as Hold).hold) {
                const ms = (res as Hold).ms
                held = true
                busyUntil = performance.now() + ms * 2 + 600
                if (why === "hover" && isH) return // ホバー中は保つ。離れたら戻す
                const my = gen
                timers.push(window.setTimeout(() => { if (gen === my) release() }, ms + 650))
            } else if ((res as Follow).kind === "f") {
                follow = res as Follow
                busyUntil = performance.now() + 1800
                if (why === "hover") { held = true; tickLoop() } else sweep(follow)
            } else if ((res as Scroll).kind === "s") {
                scroller = res as Scroll
                busyUntil = performance.now() + 1500
                synth(scroller)
            }
        }
        // ホールドの演技を逆再生で戻し、終わったら素の h1 へ
        const release = () => {
            const my = gen
            const live = anims.filter((a) => a.playState !== "idle")
            if (!live.length) { stop(); return }
            let left = live.length
            live.forEach((a) => {
                try {
                    a.onfinish = () => { if (--left === 0 && gen === my) stop() }
                    a.reverse()
                } catch { left--; }
            })
            timers.push(window.setTimeout(() => { if (gen === my) stop() }, 3000))
        }
        playRef.current = play

        const io = new IntersectionObserver(([e]) => {
            inView = e.isIntersecting
            if (!inView) stop()
        }, { threshold: 0 })
        io.observe(hit)

        // 着地：見出しが見えたら1回。
        // 旧版は document.fonts.ready（＝ページの全書体。Noto Sans JP 全体 約2.2MB×2）を待ってから 380ms 後に演じていたので、
        // 見出しが見えてから約2秒遅れて始まっていた（公開中の複製で実測：fonts.ready 2329ms → 演技 2711ms）。
        // 今は「見出し語の字の書体（切り出し・数KB）」だけを待つ（最長0.9秒）。カード→詳細の板が残っている間は、板が外れるまで待つ
        // 値の定義（params）がまだ無い間は演じない（EntryLab の通知か項目JSONで届いた後、この effect がもう一度走って演じる）。
        // 旧版はここで空の値のまま演じ、届いた後にもう一度演じていた（秒が NaN → 本来の値で2回目）。着地は slug ごとに1回だけ
        let landed = landedRef.current === slug || (!chap && typeof spec[1] === "function" && !params.length)
        const headP = loadHeadFont(headText)
        const fontP = fullJpLoaded() ? Promise.resolve() : Promise.race([headP, new Promise<void>((r) => setTimeout(r, 900))])
        const go = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting || landed) return
            landed = true
            go.disconnect()
            Promise.all([fontP, morphLayersGone(3000)]).then(() => {
                // 書体が差し替わった後の行組みを1コマ待ってから測る（2コマ）
                // 「演じた」の記録は実際に演じた時に付ける（途中で effect が張り直されたら、次の回が演じる）
                // 4周目：画面のコマが落ち着いてから演じる（読み込み直後はメインスレッドが詰まり、1コマ目が200ms以上遅れて
                // 演技の頭＝素の姿が画面に出ないまま崩れた姿から見えていた）。コマの間隔が2回続けて 34ms 未満になるのを待つ（最長 500ms）
                const tStart = performance.now()
                let prev = tStart, calm = 0
                const wait = (now: number) => {
                    calm = now - prev < 34 ? calm + 1 : 0
                    prev = now
                    if (calm >= 2 || now - tStart > 500) { inView = true; landedRef.current = slug; play("land"); return }
                    rafs.push(requestAnimationFrame(wait))
                }
                rafs.push(requestAnimationFrame(wait))
            })
        }, { threshold: 0.6 })
        go.observe(hit)

        // ホバー（PC）／タップ（SP）
        let downAt: [number, number] | null = null
        const onEnter = (e: PointerEvent) => {
            if (e.pointerType !== "mouse" || !fine || reduced) return
            if (isF) {
                sweeping = false
                if (!follow) { stop(); const r = fitAct(run()); if (r && (r as Follow).kind === "f") follow = r as Follow; else { stop(); return } }
                held = true
                const [x, y] = rel(e)
                follow!.move(x, y)
                tickLoop()
            } else if (isH) {
                play("hover")
            } else if (performance.now() > busyUntil) play("hover")
        }
        const onMove = (e: PointerEvent) => {
            if (e.pointerType !== "mouse" || !follow || !held) return
            const [x, y] = rel(e)
            follow.move(x, y)
        }
        const onLeave = (e: PointerEvent) => {
            if (e.pointerType !== "mouse") return
            if (isF && follow) { follow.leave(); held = false; tickLoop() }
            else if (isH && held) { held = false; release() }
        }
        const onDown = (e: PointerEvent) => { downAt = [e.clientX, e.clientY] }
        const onUp = (e: PointerEvent) => {
            if (e.pointerType === "mouse" || !downAt || reduced) return
            if (Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 10) play("tap")
            downAt = null
        }
        hit.addEventListener("pointerenter", onEnter)
        hit.addEventListener("pointermove", onMove)
        hit.addEventListener("pointerleave", onLeave)
        hit.addEventListener("pointerdown", onDown)
        hit.addEventListener("pointerup", onUp)

        // スクロールに反応する項目（velocity-skew / parallax / 章扉＝速度スキュー）
        let lastY = window.scrollY
        const onScroll = () => {
            const y = window.scrollY
            const vel = y - lastY
            lastY = y
            if (!isS || reduced || !inView) return
            if (!scroller) {
                if (performance.now() < busyUntil && !follow) return
                stop()
                const r = fitAct(run())
                if (!r || (r as Scroll).kind !== "s") { stop(); return }
                scroller = r as Scroll
            }
            scroller.push(vel, y)
            tickLoop()
        }
        window.addEventListener("scroll", onScroll, { passive: true })

        // 演技の途中で見出しの書体が届くと（読み込みが遅い時。切り出しの書体は最長0.9秒しか待たない）、
        // 舞台の字は前の書体の位置のまま新しい字形で描かれ、素の見出しとずれた姿のまま演じていた（4周目の判定で着地だけ落ちていた原因）。
        // 字の並びが変わったら演技をやめて素の見出しに戻し、着地なら組み直して演じ直す（1回だけ）
        let refits = 0
        const onFonts = () => {
            if (!fxs.length || !builtSig) return
            if (sig() === builtSig) return
            const why = lastWhy
            stop()
            demoDone = false
            if (why === "land" && refits++ < 1) requestAnimationFrame(() => play("land"))
        }
        const fontSet = (document as any).fonts
        if (fontSet && fontSet.addEventListener) fontSet.addEventListener("loadingdone", onFonts)

        return () => {
            io.disconnect()
            go.disconnect()
            hit.removeEventListener("pointerenter", onEnter)
            hit.removeEventListener("pointermove", onMove)
            hit.removeEventListener("pointerleave", onLeave)
            hit.removeEventListener("pointerdown", onDown)
            hit.removeEventListener("pointerup", onUp)
            window.removeEventListener("scroll", onScroll)
            if (fontSet && fontSet.removeEventListener) fontSet.removeEventListener("loadingdone", onFonts)
            stop()
            playRef.current = () => {}
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic, slug, specKey, nameJa, nameEn, ink, paper, muted, accent, paramsDep, headText])

    // EntryLab から：初期化（値の同期だけ）／スライダーを離した・初期値に戻した（その値で演じ直す）
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const take = (d: any, replay: boolean) => {
            if (!d || (slug && d.slug && d.slug !== slug)) return
            if (Array.isArray(d.params) && d.params.length) setParams((cur) => (cur.length ? cur : d.params))
            if (d.values) {
                valuesRef.current = { ...valuesRef.current, ...d.values }
                setValues((cur) => ({ ...cur, ...d.values }))
            }
            if (replay) requestAnimationFrame(() => playRef.current("lab"))
        }
        const on = (ev: Event) => {
            const d = (ev as CustomEvent).detail
            take(d, !!d && (d.reason === "release" || d.reason === "reset"))
        }
        take((window as any).__mdLab, false)
        window.addEventListener(EVT, on)
        return () => window.removeEventListener(EVT, on)
    }, [isStatic, slug])

    // 右上の自己言及：「この見出しの動き＝項目名・値」
    const keys = (spec[3] || params.slice(0, 2).map((p) => p.key).join(",")).split(",").filter(Boolean)
    const valParts: string[] = chap
        ? [chap.label]
        : keys
              .map((k) => params.find((p) => p.key === k))
              .filter(Boolean)
              .map((p) => `${keyOf(p!.label)} ${fmt(p!, values[p!.key] ?? p!.default)}${p!.options ? "" : unitOf(p!.label)}`)
    const vals = valParts.map((t, i) => (
        <span key={i} className={"v" + (i ? " v2" : "")}>{(i ? "· " : "") + t}</span>
    ))
    const tagName = chap ? chap.ja : main
    // 何の動きかが決まるまで（slug が無い SSR・対応表に無い項目で章が未取得）は、名前を出さずに場所だけ取っておく
    const pending = !slug || (!SPEC[slug] && !cat)

    return (
        <div className="mdt" style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14, color: ink, containerType: "inline-size", position: "relative", ...props.style } as CSSProperties}>
            {/* 見出し語の字だけの書体（数KB）を、JS を待たずに取りに行かせる */}
            {headCss ? <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /> : null}
            {headCss ? <link rel="preload" as="fetch" href={headCss} crossOrigin="anonymous" /> : null}
            <style dangerouslySetInnerHTML={{ __html: `.${cls}{font-size:${raw};font-size:round(${raw},1px)}.${cls} .mdt-sub{font-size:${rawSub};font-size:round(${rawSub},1px)}
.mdt-clip{overflow-x:clip;overflow-y:visible;margin:0 -64px;padding:0 64px}
@container (max-width: 640px){.mdt-clip{margin:0 -12px;padding:0 12px}}
.mdt-m{display:block;position:relative;font-family:"${HEAD_FAM}", ${JP}}
.mdt-t{display:block}
.mdt-stage .mdt-p,.mdt-stage .mdt-c{position:absolute;display:block;white-space:pre}
.mdt-fx{position:absolute;pointer-events:none;display:block}
.mdt-ghost{font:inherit;letter-spacing:inherit;line-height:inherit}
.mdt-tag{position:absolute;right:0;bottom:calc(100% + 6px);display:flex;gap:8px;align-items:baseline;justify-content:flex-end;max-width:72%;font-family:${MONO};font-size:11px;line-height:16px;letter-spacing:.04em;color:${muted};white-space:nowrap;overflow:hidden;text-decoration:none}
.mdt-tag b{font-family:${JP};font-weight:700;font-size:12px;letter-spacing:.02em;color:${ink}}
.mdt-tag .v{overflow:hidden;text-overflow:ellipsis;min-width:0;flex:0 1 auto}
.mdt-tag .v2{flex:0 1000 auto}
.mdt-tag .ks{display:none}
a.mdt-tag:hover b{text-decoration:underline}
a.mdt-tag:focus-visible{outline:2px solid ${ink};outline-offset:2px}
.mdt-tag .br{display:none}
@container (max-width: 640px){.mdt-tag{max-width:calc(100% - 140px);font-size:10px;gap:0 6px;flex-wrap:wrap;line-height:15px}.mdt-tag .k,.mdt-tag .v2{display:none}.mdt-tag .ks{display:inline}
.mdt-tag .br{display:block;flex-basis:100%;height:0}.mdt-tag .v{overflow:visible;text-overflow:clip;white-space:nowrap}.mdt-tag b{overflow:hidden;text-overflow:ellipsis;min-width:0}}
` }} />
            <div className={"mdt-clip " + cls}>
                <h1
                    ref={hitRef as any}
                    aria-label={sub ? `${main}（${sub}）` : main}
                    style={{
                        margin: 0,
                        fontSize: "inherit",
                        fontFamily: JP,
                        fontWeight: 700,
                        lineHeight: 1.12,
                        letterSpacing: "-0.04em",
                        fontFeatureSettings: '"palt"',
                        wordBreak: "keep-all",
                        overflowWrap: "anywhere",
                        lineBreak: "strict",
                        touchAction: "manipulation",
                    }}
                >
                    <span ref={mainRef} className="mdt-m" aria-hidden="true">
                        <span className="mdt-t">{charPhrases(main)}</span>
                    </span>
                    {sub ? (
                        <span
                            className="mdt-sub"
                            aria-hidden="true"
                            style={{
                                display: "block",
                                marginTop: "0.5em",
                                fontWeight: 400,
                                lineHeight: 1.45,
                                letterSpacing: "-0.01em",
                                color: ink,
                            }}
                        >
                            {phrases(sub)}
                        </span>
                    ) : null}
                </h1>
            </div>
            <p style={{ margin: 0, fontFamily: MONO, fontSize: 13, letterSpacing: "0.02em", lineHeight: 1.6, color: muted, overflowWrap: "anywhere" }}>
                {sentence(nameEn)}
            </p>
            {pending ? (
                <div className="mdt-tag" aria-hidden="true" style={{ visibility: "hidden" }}>
                    <span className="k">この見出しの動き</span>
                    <span className="ks">動き</span>
                </div>
            ) : chap ? (
                <a className="mdt-tag" href={"/entries/" + chap.slug} title="この見出しの動き（章扉と同じ）">
                    <span className="k">この見出しの動き</span>
                    <span className="ks">動き</span>
                    <b>{tagName}</b>
                    <span className="br" aria-hidden="true" />
                    {vals}
                    <span aria-hidden="true">↗</span>
                </a>
            ) : (
                <div className="mdt-tag">
                    <span className="k">この見出しの動き</span>
                    <span className="ks">動き</span>
                    <b>{tagName}</b>
                    <span className="br" aria-hidden="true" />
                    {vals}
                </div>
            )}
        </div>
    )
}

addPropertyControls(EntryTitle, {
    nameJa: { type: ControlType.String, title: "Name JA", defaultValue: "パスワード強度メーター（打つたびにバーが伸びて色が変わる）" },
    nameEn: { type: ControlType.String, title: "Name EN", defaultValue: "password strength meter" },
    slug: { type: ControlType.String, title: "Slug", defaultValue: "" },
    paramsJson: { type: ControlType.String, title: "Params JSON", displayTextArea: true, defaultValue: "" },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#0A0A0A" },
    muted: { type: ControlType.Color, title: "Muted", defaultValue: "#6B6B66" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#A5E02E" },
    paper: { type: ControlType.Color, title: "Paper", defaultValue: "#F4F4F1" },
    base: { type: ControlType.String, title: "Base", defaultValue: "https://ryota4100221-cmyk.github.io/motion-dict" },
})
