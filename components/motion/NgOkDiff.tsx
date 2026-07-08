import styles from "./NgOkDiff.module.css";

type Example = { say: string; why: string };

export default function NgOkDiff({ ng, ok }: { ng: Example; ok: Example }) {
  return (
    <div className={styles.ngOk}>
      <div>
        <span className={`${styles.tag} ${styles.ng}`}>NG</span>
        <p className={styles.say}>{ng.say}</p>
        <p className={styles.why}>{ng.why}</p>
      </div>
      <div>
        <span className={`${styles.tag} ${styles.ok}`}>OK</span>
        <p className={styles.say}>{ok.say}</p>
        <p className={styles.why}>{ok.why}</p>
      </div>
    </div>
  );
}
