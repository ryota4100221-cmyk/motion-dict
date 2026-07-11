import type { ReactNode } from "react";
import styles from "./CategoryNav.module.css";

// カテゴリごとのピクトグラム(ストロークはcurrentColor、外部アイコン不使用)
const ICONS: Record<string, ReactNode> = {
  hover: (
    // カーソル(ポインター)
    <path d="M5 3 L12 20 L14.2 13.2 L21 11 Z" />
  ),
  scroll: (
    // 下向き矢印
    <>
      <path d="M12 4 v13" />
      <path d="M6 11.5 L12 17.5 L18 11.5" />
    </>
  ),
  text: (
    // T
    <>
      <path d="M5 5.5 h14" />
      <path d="M12 5.5 v13" />
    </>
  ),
  transition: (
    // 重なる2枚の面
    <>
      <rect x="4" y="4" width="10.5" height="10.5" />
      <rect x="9.5" y="9.5" width="10.5" height="10.5" />
    </>
  ),
  media: (
    // 写真(山と太陽)
    <>
      <rect x="3.5" y="4.5" width="17" height="14.5" />
      <circle cx="9" cy="9.5" r="1.6" />
      <path d="M6 16.5 L10.5 12 L13.5 15 L16 12.5 L18.5 15.5" />
    </>
  ),
  ui: (
    // トグルスイッチ
    <>
      <rect x="3.5" y="8.5" width="17" height="7" rx="3.5" />
      <circle cx="16.5" cy="12" r="2.4" />
    </>
  ),
  loading: (
    // 円弧スピナー
    <path d="M12 4 a8 8 0 1 1 -7.5 5.3" />
  ),
};

export type CategoryNavItem = {
  category: string;
  label: string;
  count: number;
};

export default function CategoryNav({ items }: { items: CategoryNavItem[] }) {
  return (
    <nav className={styles.nav} aria-label="カテゴリ">
      {items.map((item) => (
        <a className={styles.cell} href={`#${item.category}`} key={item.category}>
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            aria-hidden
          >
            {ICONS[item.category]}
          </svg>
          <span className={styles.label}>{item.label}</span>
          <span className={styles.count}>
            ({String(item.count).padStart(2, "0")})
          </span>
        </a>
      ))}
    </nav>
  );
}
