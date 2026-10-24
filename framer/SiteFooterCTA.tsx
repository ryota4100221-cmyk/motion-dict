import type { CSSProperties } from "react"
import { addPropertyControls, ControlType } from "framer"

// 一覧・詳細の共通フッター＝制作の相談への導線（営業資産としての出口）。
// 旧版は高さ約100px・13pxの「monaka design.」だけで、しかも Made in Framer バッジの下に隠れていた（独立レビュー2）。

interface Props {
    heading: string
    body: string
    ctaLabel: string
    ctaHref: string
    subLabel: string
    subHref: string
    accent: string
    ink: string
    paper: string
    style?: CSSProperties
}

const MONO = '"Geist Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
const JP = '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif'

/**
 * Site Footer CTA
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function SiteFooterCTA(props: Props) {
    const {
        heading = "この動き、\nサイトに入れたい。",
        body = "この辞典は monaka design.（Webデザイナー 志藤）が作っています。動きの設計まで含めたWebサイトのデザインを承っています。Framer / STUDIO での実装も、案件に合わせて体制を組んでご相談に乗ります。",
        ctaLabel = "制作の相談をする",
        ctaHref = "https://monakadesign.com/#contact",
        subLabel = "制作実績を見る",
        subHref = "https://monakadesign.com/#works",
        accent = "#A5E02E",
        ink = "#0A0A0A",
        paper = "#F4F4F1",
    } = props
    return (
        <footer style={{ width: "100%", background: ink, color: paper, fontFamily: JP, containerType: "inline-size", ...props.style } as CSSProperties}>
            <style>{`
.mdf-wrap{max-width:1680px;margin:0 auto;padding:clamp(72px,10cqi,140px) clamp(16px,3.4cqi,40px) clamp(40px,5cqi,64px);display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:clamp(32px,5cqi,80px);align-items:end}
@container (max-width: 760px){.mdf-wrap{grid-template-columns:1fr}}
.mdf-h{margin:0;font-weight:900;font-size:clamp(40px,7.2cqi,104px);line-height:1.04;letter-spacing:-0.045em;white-space:pre-line;font-feature-settings:"palt"}
.mdf-h em{font-style:normal;color:${accent}}
.mdf-cta{display:inline-flex;align-items:center;justify-content:space-between;gap:24px;height:64px;padding:0 28px;border-radius:100px;background:${accent};color:${ink};font-weight:700;font-size:16px;text-decoration:none;transition:transform .25s cubic-bezier(.2,.7,.2,1)}
.mdf-cta:hover{transform:translateY(-2px)}
.mdf-cta .ar{transition:transform .25s cubic-bezier(.2,.7,.2,1)}
.mdf-cta:hover .ar{transform:translateX(4px)}
.mdf-sub{display:inline-flex;align-items:center;height:64px;padding:0 24px;border-radius:100px;border:1px solid rgba(244,244,241,.3);color:${paper};font-size:15px;text-decoration:none}
.mdf-sub:hover{border-color:${paper}}
.mdf-cta:focus-visible,.mdf-sub:focus-visible{outline:2px solid ${accent};outline-offset:3px}
.mdf-base{max-width:1680px;margin:0 auto;padding:20px clamp(16px,3.4cqi,40px) 28px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;border-top:1px solid rgba(244,244,241,.14);font-family:${MONO};font-size:12px;letter-spacing:.04em;color:rgba(244,244,241,.55)}
.mdf-base a{color:inherit;text-decoration:none}.mdf-base a:hover{color:${paper}}
@media (prefers-reduced-motion: reduce){.mdf-cta,.mdf-cta .ar{transition:none}}
`}</style>
            <div className="mdf-wrap">
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: accent }}>Made by monaka design.</span>
                    <h2 className="mdf-h">{heading}</h2>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                    <p style={{ margin: 0, fontSize: 15, lineHeight: 1.9, color: "rgba(244,244,241,.78)", maxWidth: 520 }}>{body}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                        <a className="mdf-cta" href={ctaHref} target="_blank" rel="noopener">
                            {ctaLabel}
                            <span className="ar" aria-hidden>→</span>
                        </a>
                        <a className="mdf-sub" href={subHref} target="_blank" rel="noopener">{subLabel}</a>
                    </div>
                </div>
            </div>
            <div className="mdf-base">
                <span>動きの伝え方辞典 — Motion dictionary</span>
                <span>
                    <a href="https://monakadesign.com" target="_blank" rel="noopener">monaka design.</a>
                    {"  /  "}
                    <a href="https://x.com/r_monaka_design" target="_blank" rel="noopener">X</a>
                </span>
            </div>
        </footer>
    )
}

addPropertyControls(SiteFooterCTA, {
    heading: { type: ControlType.String, title: "Heading", displayTextArea: true, defaultValue: "この動き、\nサイトに入れたい。" },
    body: { type: ControlType.String, title: "Body", displayTextArea: true, defaultValue: "この辞典は monaka design.（Webデザイナー 志藤）が作っています。動きの設計まで含めたWebサイトのデザインを承っています。Framer / STUDIO での実装も、案件に合わせて体制を組んでご相談に乗ります。" },
    ctaLabel: { type: ControlType.String, title: "CTA", defaultValue: "制作の相談をする" },
    ctaHref: { type: ControlType.String, title: "CTA URL", defaultValue: "https://monakadesign.com/#contact" },
    subLabel: { type: ControlType.String, title: "Sub", defaultValue: "制作実績を見る" },
    subHref: { type: ControlType.String, title: "Sub URL", defaultValue: "https://monakadesign.com/#works" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#A5E02E" },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#0A0A0A" },
    paper: { type: ControlType.Color, title: "Paper", defaultValue: "#F4F4F1" },
})
