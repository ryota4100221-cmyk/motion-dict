import { notFound } from "next/navigation";
import { entries } from "@/content";
import { defaultValues } from "@/lib/types";
import StageBare from "@/components/motion/StageBare";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(entries).map((slug) => ({ slug }));
}

// v2（2026-10-24）: ステージを画面いっぱいに広げた裸デモ。
// 録画v2（scripts/record-v2.cjs）と、Framer詳細ページの「触って数値を決める」iframe が使う。
// 旧 /demo/<slug>/ は現行の本番(録画・Play live)が参照しているので残す。
export default async function StagePage({ params }: Props) {
  const { slug } = await params;
  const entry = entries[slug];
  if (!entry) notFound();
  return <StageBare slug={slug} params={defaultValues(entry)} />;
}
