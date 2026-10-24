"use client";

import type { ReactNode, Ref } from "react";
import styles from "./DemoStage.module.css";

type Props = {
  hint: string;
  children: ReactNode;
  stageRef?: Ref<HTMLDivElement>;
  className?: string;
};

export default function DemoStage({ hint, children, stageRef, className }: Props) {
  return (
    <div
      className={className ? `${styles.stage} ${className}` : styles.stage}
      ref={stageRef}
      data-md-stage=""
    >
      {children}
      <div className={styles.hint} data-md-hint="">{hint}</div>
    </div>
  );
}
