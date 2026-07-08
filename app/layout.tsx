import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Shippori_Mincho, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";

const serif = Shippori_Mincho({
  weight: ["500", "600"],
  subsets: ["latin"],
  variable: "--font-serif",
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
  // monakadesign.com の /motion/ 配下に置く想定(公開時に要確認)
  metadataBase: new URL("https://monakadesign.com"),
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
  themeColor: "#E9E6DF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
