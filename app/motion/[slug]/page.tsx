import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { entries, entryList } from "@/content";
import EntryView from "@/components/motion/EntryView";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(entries).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = entries[slug];
  if (!entry) return {};
  const title = `${entry.nameJa} — 動きの伝え方辞典`;
  return {
    title: { absolute: title },
    description: entry.lede,
    openGraph: {
      title,
      description: entry.lede,
      url: `/motion/${slug}`,
    },
    alternates: { canonical: `/motion/${slug}` },
  };
}

export default async function EntryPage({ params }: Props) {
  const { slug } = await params;
  const entry = entries[slug];
  if (!entry) notFound();
  // 辞典の掲載順で前後の項目へ(端はループさせて回遊を切らさない)
  const i = entryList.findIndex((e) => e.slug === slug);
  const prev = entryList[(i - 1 + entryList.length) % entryList.length];
  const next = entryList[(i + 1) % entryList.length];
  return (
    <EntryView
      entry={entry}
      prev={{ slug: prev.slug, nameJa: prev.nameJa }}
      next={{ slug: next.slug, nameJa: next.nameJa }}
    />
  );
}
