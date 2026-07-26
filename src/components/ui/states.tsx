import type { ReactNode } from "react";

import { AlertIcon, CompassIcon, RefreshIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

import { Button } from "./button";

interface StatePanelProps {
  actionLabel?: string;
  description: string;
  kind: "empty" | "error";
  title: string;
}

export function StatePanel({
  actionLabel,
  description,
  kind,
  title,
}: StatePanelProps) {
  const Icon = kind === "empty" ? CompassIcon : AlertIcon;

  return (
    <section
      className={cn("state-panel", `state-panel--${kind}`)}
      role={kind === "error" ? "alert" : "status"}
    >
      <span className="state-panel__icon">
        <Icon />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {actionLabel ? (
        <Button
          aria-disabled="true"
          className="state-panel__action"
          disabled
          variant="secondary"
        >
          {kind === "error" ? <RefreshIcon /> : null}
          {actionLabel}
        </Button>
      ) : null}
    </section>
  );
}

export function LoadingState({
  label = "Les vibes arrivent…",
}: {
  label?: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="loading-state"
      role="status"
    >
      <span className="sr-only">{label}</span>
      <Skeleton className="loading-state__portrait" />
      <div className="loading-state__lines">
        <Skeleton className="loading-state__line loading-state__line--short" />
        <Skeleton className="loading-state__line" />
        <Skeleton className="loading-state__line loading-state__line--medium" />
      </div>
    </div>
  );
}

export function Skeleton({
  className,
  children,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span aria-hidden="true" className={cn("skeleton", className)}>
      {children}
    </span>
  );
}
