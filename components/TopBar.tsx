import Link from "next/link";
import styles from "./TopBar.module.css";

export default function TopBar() {
  return (
    <nav className={styles.topbar}>
      <Link className={styles.mark} href="/motion">
        MOTION DICTIONARY
      </Link>
      <a
        className={styles.link}
        href="https://monakadesign.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        monaka design.
      </a>
    </nav>
  );
}
