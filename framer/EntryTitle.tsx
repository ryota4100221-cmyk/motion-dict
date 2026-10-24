import type { CSSProperties, ReactNode } from "react"
import { addPropertyControls, ControlType } from "framer"

// 詳細ページの見出し（h1）。CMS の Name JA / Name EN をバインドして使う（SSRで本文に出る）。
// 旧版の問題：項目名がそのまま76pxで流れ、「テーマ切替トランジシ／ョン」「メータ／ー」のように
// 小書き文字や長音が行頭に落ちていた。項目名は「本名（言い換え）」の形が多いので、
//  ・括弧の前＝見出し語（大）／括弧の中＝言い換え（小・次の行）に分ける
//  ・文字種の切れ目で語に分けて <wbr> を入れ、word-break: keep-all で語の途中で折らない
//  ・字数で段階的に縮める（見出し語が長いほど小さく）

interface Props {
    nameJa: string
    nameEn: string
    ink: string
    muted: string
    style?: CSSProperties
}

const MONO =
    '"Geist Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
const JP = '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif'

function split(name: string): [string, string] {
    const m = (name || "").match(/^(.+?)[（(](.+)[）)]\s*$/)
    return m ? [m[1].trim(), m[2].trim()] : [name || "", ""]
}
function phrases(s: string): ReactNode[] {
    // 文字種の切れ目（漢字／ひらがな／カタカナ／英数）で語に分ける。Intl.Segmenter は Framer のサーバー描画に無く、
    // サーバーは <wbr> なし・ブラウザは <wbr> ありで HTML が食い違い、hydration エラー（#425）を出していた。
    // 同じ規則で両方が同じ HTML を出すよう、正規表現だけで切る
    const segs = s.match(/[\u4E00-\u9FFF\u3005]+|[\u3041-\u309F]+|[\u30A0-\u30FF\u30FC]+|[A-Za-z0-9]+|\s+|./gu) || [s]
    // 助詞・記号・小書き/長音は前の語にくっつける（行頭に来させない）。漢字＋送り仮名も1語にする
    const out: string[] = []
    for (const g of segs) {
        const prev = out[out.length - 1]
        if (out.length && (/^([ぁ-ゖ]{1,2}|[、。・）」』！？ー〜ァィゥェォッャュョヮ]+|\s+)$/.test(g) || (/^[ぁ-ゖ]+$/.test(g) && /[\u4E00-\u9FFF\u3005]$/.test(prev)))) out[out.length - 1] += g
        else out.push(g)
    }
    return out.flatMap((t, i) => (i ? [<wbr key={"w" + i} />, t] : [t]))
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
    const { nameJa = "パスワード強度メーター（打つたびにバーが伸びて色が変わる）", nameEn = "password strength meter", ink = "#0A0A0A", muted = "#6B6B66" } = props
    const [main, sub] = split(nameJa)
    // 見出し語の字数と枠の幅（コンテナ単位 cqi）から文字サイズを決める。SSRの時点で確定する
    // ＝読み込み後に大きさが変わらない。1行に収まる大きさ・上限72px・下限30px。
    const len = Math.max(4, Math.min(Array.from(main).length, 11))
    // round() で整数pxに丸める（小数の文字サイズ・字間はにじむ）。未対応ブラウザは clamp のまま
    const raw = `clamp(30px, ${(98 / len).toFixed(2)}cqi, 72px)`
    const rawSub = `clamp(17px, ${((98 / len) * 0.36).toFixed(2)}cqi, 26px)`
    const cls = `mdt-${len}`

    return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14, color: ink, containerType: "inline-size", ...props.style } as CSSProperties}>
            <style>{`.${cls}{font-size:${raw};font-size:round(${raw},1px)}.${cls} .mdt-sub{font-size:${rawSub};font-size:round(${rawSub},1px)}`}</style>
            <h1
                className={cls}
                style={{
                    margin: 0,
                    fontFamily: JP,
                    fontWeight: 700,
                    lineHeight: 1.12,
                    letterSpacing: "-0.04em",
                    fontFeatureSettings: '"palt"',
                    wordBreak: "keep-all",
                    overflowWrap: "anywhere",
                    lineBreak: "strict",
                }}
            >
                <span>{phrases(main)}</span>
                {sub ? (
                    <span
                        className="mdt-sub"
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
            <p style={{ margin: 0, fontFamily: MONO, fontSize: 13, letterSpacing: "0.02em", lineHeight: 1.6, color: muted, overflowWrap: "anywhere" }}>
                {sentence(nameEn)}
            </p>
        </div>
    )
}

addPropertyControls(EntryTitle, {
    nameJa: { type: ControlType.String, title: "Name JA", defaultValue: "パスワード強度メーター（打つたびにバーが伸びて色が変わる）" },
    nameEn: { type: ControlType.String, title: "Name EN", defaultValue: "password strength meter" },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#0A0A0A" },
    muted: { type: ControlType.Color, title: "Muted", defaultValue: "#6B6B66" },
})
