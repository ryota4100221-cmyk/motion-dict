import styles from "./VocabList.module.css";

type Props = {
  vocab: { term: string; desc: string }[];
};

export default function VocabList({ vocab }: Props) {
  return (
    <dl className={styles.vocab}>
      {vocab.map((v) => (
        <div key={v.term}>
          <dt>{v.term}</dt>
          <dd>{v.desc}</dd>
        </div>
      ))}
    </dl>
  );
}
