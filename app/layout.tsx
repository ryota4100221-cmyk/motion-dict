import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Noto_Sans_JP, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";

// ディスプレイ用の極太ゴシック(見出し・見出し語)
const display = Noto_Sans_JP({
  weight: ["700", "900"],
  subsets: ["latin"],
  variable: "--font-display",
  preload: false,
});

const sans = Zen_Kaku_Gothic_New({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  preload: false,
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://motion-dict.framer.website"),
  // 正面(canonical)は Framer 本番(motion-dict.framer.website)に一本化。
  // この GH Pages(Next)サイトは動画・デモ配信の倉庫として残すが、
  // 検索重複を避けるため noindex にする(2026-07-23)。
  robots: { index: false, follow: false },
  title: {
    default: "動きの伝え方辞典 — monaka design.",
    template: "%s — 動きの伝え方辞典",
  },
  description:
    "実装したい動きをAIに正確に伝えるための対訳辞典。触れるライブデモとパラメータ連動プロンプトをセットで提供。",
  openGraph: {
    siteName: "動きの伝え方辞典",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#F4F4F1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${display.variable} ${sans.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
