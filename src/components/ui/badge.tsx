import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "coral" | "lilac" | "neutral" | "success";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return <span className={cn("badge", `badge--${tone}`, className)} {...props} />;
}
