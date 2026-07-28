import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import styles from "./inline-feedback.module.css";

type InlineFeedbackProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  live?: "assertive" | "polite";
  tone?: "error" | "neutral" | "success";
};

export function InlineFeedback({
  children,
  className,
  id,
  live = "polite",
  tone = "error",
}: InlineFeedbackProps) {
  return (
    <p
      aria-atomic="true"
      aria-live={live}
      className={cn(styles.root, styles[tone], className)}
      id={id}
      role={tone === "error" ? "alert" : "status"}
    >
      <svg
        aria-hidden="true"
        className={styles.signal}
        fill="none"
        focusable="false"
        viewBox="0 0 44 20"
      >
        <path d="M2 10h8" />
        <path d="m13 4 6 6-6 6" />
        <path d="m31 4-6 6 6 6" />
        <path d="M34 10h8" />
      </svg>
      <span>{children}</span>
    </p>
  );
}
