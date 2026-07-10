// 英語表記の統一ルール: 先頭のみ大文字(Sentence case)。
// "magnetic hover / magnetic button" → "Magnetic hover / Magnetic button"
export function sentenceCaseEn(s: string): string {
  return s
    .split("/")
    .map((seg) => {
      const t = seg.trim();
      return t.charAt(0).toUpperCase() + t.slice(1);
    })
    .join(" / ");
}

export function decimalsFromStep(step: number): number {
  const s = String(step);
  const i = s.indexOf(".");
  return i === -1 ? 0 : s.length - i - 1;
}

export function formatValue(value: number, step: number): string {
  const d = decimalsFromStep(step);
  return d === 0 ? String(Math.round(value)) : value.toFixed(d);
}

export function formatParamValue(
  param: { step: number; options?: string[] },
  value: number
): string {
  if (param.options) return param.options[Math.round(value)] ?? String(value);
  return formatValue(value, param.step);
}
