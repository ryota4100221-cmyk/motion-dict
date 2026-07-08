"use client";

import type { DemoParam, ParamValues } from "@/lib/types";
import { formatParamValue } from "@/lib/format";
import styles from "./ParamControls.module.css";

type Props = {
  params: DemoParam[];
  values: ParamValues;
  onChange: (key: string, value: number) => void;
};

export default function ParamControls({ params, values, onChange }: Props) {
  return (
    <div className={styles.controls}>
      {params.map((p) => (
        <div className={styles.ctrl} key={p.key}>
          <label htmlFor={`param-${p.key}`}>{p.label}</label>
          <span className={styles.val}>{formatParamValue(p, values[p.key])}</span>
          <input
            type="range"
            id={`param-${p.key}`}
            min={p.min}
            max={p.max}
            step={p.step}
            value={values[p.key]}
            onChange={(e) => onChange(p.key, parseFloat(e.target.value))}
          />
          <span className={styles.desc}>{p.desc}</span>
        </div>
      ))}
    </div>
  );
}
