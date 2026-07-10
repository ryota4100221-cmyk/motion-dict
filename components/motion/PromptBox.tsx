"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DemoParam, ParamValues } from "@/lib/types";
import { formatParamValue } from "@/lib/format";
import styles from "./PromptBox.module.css";

type Props = {
  template: string;
  params: DemoParam[];
  values: ParamValues;
};

// {{key}} と、直後に続く単位(px/ms/s/%/deg)をまとめて動的部分として扱う
const TOKEN_RE = /(\{\{\w+\}\}(?:px|ms|s|%|deg)?)/;
const TOKEN_PARSE_RE = /^\{\{(\w+)\}\}(px|ms|s|%|deg)?$/;

type Segment =
  | { type: "text"; text: string }
  | { type: "param"; key: string; unit: string };

function parseTemplate(template: string): Segment[] {
  return template
    .split(TOKEN_RE)
    .filter((part) => part !== "")
    .map((part) => {
      const m = part.match(TOKEN_PARSE_RE);
      if (m) return { type: "param", key: m[1], unit: m[2] ?? "" };
      return { type: "text", text: part };
    });
}

export default function PromptBox({ template, params, values }: Props) {
  const segments = useMemo(() => parseTemplate(template), [template]);
  const paramByKey = useMemo(
    () => Object.fromEntries(params.map((p) => [p.key, p])),
    [params]
  );

  const [flash, setFlash] = useState(false);
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  const firstRender = useRef(true);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 200);
    return () => clearTimeout(t);
  }, [values]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(textRef.current?.innerText ?? "");
      setCopied("copied");
    } catch {
      setCopied("failed");
    }
    setTimeout(() => setCopied("idle"), 1500);
  }

  return (
    <div className={styles.codebox}>
      <button className={styles.copyBtn} onClick={copy}>
        {copied === "idle" ? "Copy" : copied === "copied" ? "Copied" : "Failed"}
      </button>
      <span ref={textRef}>
        {segments.map((seg, i) =>
          seg.type === "text" ? (
            seg.text
          ) : (
            <span
              key={i}
              className={`${styles.dyn} ${flash ? styles.flash : ""}`}
            >
              {paramByKey[seg.key]
                ? formatParamValue(paramByKey[seg.key], values[seg.key])
                : `{{${seg.key}}}`}
              {seg.unit}
            </span>
          )
        )}
      </span>
    </div>
  );
}
