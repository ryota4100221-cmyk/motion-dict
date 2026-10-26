import type { CSSProperties } from "react"
import { useEffect, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

// 一覧・詳細の共通フッター＝辞典の「奥付」。
// 2026-10-26：営業の出口（特大見出し「この動き、サイトに入れたい。」＋ライムの相談ボタン）をやめた。
// 狙いは「この辞典便利 → 作ってるのはどこ？ → monaka design. なんだ」が自然に起きること。
// 紙の辞書の奥付と同じく、編者・版・出典を淡々と書き、相談の入口は他のリンクと同じ並びの1つに留める。
// 項目数と更新日は entries-v2.json（件数）とその Last-Modified（更新日）から取る＝毎朝の追加に合わせて自動で変わる。

interface Props {
    base: string
    siteHref: string
    xHref: string
    contactHref: string
    ink: string
    paper: string
    muted: string
    accent: string
    style?: CSSProperties
}

const MONO = '"Geist Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
const JP = '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif'

function fmtDate(d: Date) {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

/**
 * Site Footer CTA
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 480
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function SiteFooterCTA(props: Props) {
    const {
        base = "https://ryota4100221-cmyk.github.io/motion-dict",
        siteHref = "https://monakadesign.com",
        xHref = "https://x.com/r_monaka_design",
        contactHref = "https://monakadesign.com/#contact",
        ink = "#0A0A0A",
        paper = "#F4F4F1",
        muted = "#6B6B66",
        accent = "#A5E02E",
    } = props
    // SSR とクライアント初回は同じ（空）。読み込み後に件数と更新日を入れる
    const [count, setCount] = useState<number | null>(null)
    const [updated, setUpdated] = useState<string>("")
    useEffect(() => {
        let alive = true
        fetch(`${base}/entries-v2.json`, { cache: "no-cache" })
            .then(async (r) => {
                const lm = r.headers.get("last-modified")
                const j = await r.json()
                const list = Array.isArray(j) ? j : j?.entries || []
                if (!alive) return
                setCount(list.length)
                if (lm) {
                    const d = new Date(lm)
                    if (!isNaN(d.getTime())) setUpdated(fmtDate(d))
                }
            })
            .catch(() => {})
        return () => {
            alive = false
        }
    }, [base])
    const n = count == null ? "" : String(count)

    return (
        <footer style={{ width: "100%", background: paper, color: ink, fontFamily: JP, containerType: "inline-size", ...props.style } as CSSProperties}>
            <style dangerouslySetInnerHTML={{ __html: `
.mdc-wrap{max-width:1440px;margin:0 auto;padding:clamp(56px,8cqi,112px) clamp(16px,3.4cqi,40px) clamp(32px,4cqi,48px);border-top:1px solid ${ink};display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);gap:clamp(32px,6cqi,96px)}
@container (max-width: 760px){.mdc-wrap{grid-template-columns:1fr}}
@container (min-width: 761px){.mdc-about{word-break:keep-all;overflow-wrap:anywhere}}
.mdc-lab{font-family:${MONO};font-size:12px;letter-spacing:.06em;color:${muted}}
.mdc-title{margin:14px 0 0;font-weight:700;font-size:clamp(28px,3.4cqi,44px);line-height:1.15;letter-spacing:-0.04em;font-feature-settings:"palt"}
.mdc-en{margin:8px 0 0;font-family:${MONO};font-size:13px;letter-spacing:.02em;color:${muted}}
.mdc-about{margin:12px 0 0;font-size:15px;line-height:1.95;letter-spacing:.02em;max-width:36em;line-break:strict;text-wrap:pretty}
.mdc-dl{margin:clamp(28px,3.4cqi,40px) 0 0;display:grid;grid-template-columns:88px minmax(0,1fr);border-top:1px solid rgba(10,10,10,.14)}
.mdc-dl dt,.mdc-dl dd{margin:0;padding:14px 0;border-bottom:1px solid rgba(10,10,10,.14)}
.mdc-dl dt{font-family:${MONO};font-size:12px;letter-spacing:.06em;color:${muted};padding-top:17px}
.mdc-dl dd{font-size:14px;line-height:1.8}
.mdc-dl .sub{display:block;color:${muted};font-size:13px}
.mdc-num{font-family:${MONO};font-variant-numeric:tabular-nums}
.mdc-links{margin:clamp(24px,3cqi,32px) 0 0;display:flex;flex-wrap:wrap;gap:8px 28px;font-size:14px}
.mdc-links a{color:${ink};text-decoration:none;background:linear-gradient(${ink},${ink}) 0 100%/100% 1px no-repeat;padding-bottom:2px;transition:background-size .25s}
.mdc-links a:hover{background-image:linear-gradient(${accent},${accent});background-size:100% 6px}
.mdc-links a:focus-visible{outline:2px solid ${ink};outline-offset:4px}
.mdc-links .ar{font-family:${MONO};font-size:12px;margin-left:4px}
.mdc-base{max-width:1440px;margin:0 auto;padding:16px clamp(16px,3.4cqi,40px) 72px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;font-family:${MONO};font-size:12px;letter-spacing:.04em;color:${muted}}
@media (prefers-reduced-motion: reduce){.mdc-links a{transition:none}}
` }} />
            <div className="mdc-wrap">
                <div>
                    <p className="mdc-title" style={{ marginTop: 0 }}>動きの伝え方辞典</p>
                    <p className="mdc-en">Motion dictionary</p>
                </div>
                <div>
                    <div className="mdc-lab">この辞典について</div>
                    <p className="mdc-about">
                        デザイナーとして「あの動き」を言葉で伝えられずに困ったのが、はじまりです。名前と数値のない動きに、名前と数値を付けています。
                        {n ? <>いまは<span style={{ whiteSpace: "nowrap" }}><span className="mdc-num">{n}</span>項目。</span></> : null}毎朝ひとつずつ増えています。
                    </p>
                    <dl className="mdc-dl">
                        <dt>編者</dt>
                        <dd>
                            monaka design.（志藤 諒太）
                            <span className="sub">Webサイトのデザインをしています。動きの設計も込みで。</span>
                        </dd>
                        <dt>版</dt>
                        <dd>
                            {updated ? <>{updated} 更新</> : "毎朝更新"}
                            {n ? <> · <span className="mdc-num">{n}</span>項目</> : null}
                        </dd>
                        <dt>写真</dt>
                        <dd>Unsplash（紙と活字の18枚）</dd>
                    </dl>
                    <div className="mdc-links">
                        <a href={siteHref} target="_blank" rel="noopener">monaka design.<span className="ar" aria-hidden>↗</span></a>
                        <a href={xHref} target="_blank" rel="noopener">X<span className="ar" aria-hidden>↗</span></a>
                        <a href={contactHref} target="_blank" rel="noopener">お仕事の相談<span className="ar" aria-hidden>↗</span></a>
                    </div>
                </div>
            </div>
            <div className="mdc-base">
                <span>© monaka design.</span>
                <span>motion-dict.framer.website</span>
            </div>
        </footer>
    )
}

addPropertyControls(SiteFooterCTA, {
    base: { type: ControlType.String, title: "Data base", defaultValue: "https://ryota4100221-cmyk.github.io/motion-dict" },
    siteHref: { type: ControlType.String, title: "Site URL", defaultValue: "https://monakadesign.com" },
    xHref: { type: ControlType.String, title: "X URL", defaultValue: "https://x.com/r_monaka_design" },
    contactHref: { type: ControlType.String, title: "Contact URL", defaultValue: "https://monakadesign.com/#contact" },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#0A0A0A" },
    paper: { type: ControlType.Color, title: "Paper", defaultValue: "#F4F4F1" },
    muted: { type: ControlType.Color, title: "Muted", defaultValue: "#6B6B66" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#A5E02E" },
})
