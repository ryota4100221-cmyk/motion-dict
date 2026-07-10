// OG画像(next/og / satori)用のGoogleフォント取得ヘルパー。
// css2 APIのtext=で使用グリフだけにサブセットし、ttf/otfのURLを抜き出す。
// SSGなのでフェッチはビルド時に1回だけ走る。
export async function loadGoogleFont(
  family: string,
  weight: number,
  text: string
): Promise<ArrayBuffer> {
  const url =
    `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}` +
    `:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const m = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/);
  if (!m) throw new Error(`OG font fetch failed: ${family}`);
  const res = await fetch(m[1]);
  if (!res.ok) throw new Error(`OG font download failed: ${family}`);
  return res.arrayBuffer();
}

// OG画像共通のデザイントークン(globals.cssと同値)
export const og = {
  width: 1200,
  height: 630,
  paper: "#F4F4F1",
  sumi: "#0A0A0A",
  sumiSoft: "#67675F",
  ai: "#A5E02E",
  line: "rgba(10, 10, 10, 0.25)",
} as const;
