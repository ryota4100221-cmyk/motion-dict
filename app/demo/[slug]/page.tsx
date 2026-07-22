import { notFound } from "next/navigation";
import { entries } from "@/content";
import { defaultValues } from "@/lib/types";
import DemoBare from "@/components/motion/DemoBare";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(entries).map((slug) => ({ slug }));
}

// ヘッダー等のクロームなし、デモ単体だけの裸ページ。
export default async function DemoPage({ params }: Props) {
  const { slug } = await params;
  const entry = entries[slug];
  if (!entry) notFound();
  return <DemoBare slug={slug} params={defaultValues(entry)} />;
}
