import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "quiet";
type ButtonSize = "default" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size = "default", type = "button", variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn("button", `button--${variant}`, size === "icon" && "button--icon", className)}
      type={type}
      {...props}
    />
  ),
);

Button.displayName = "Button";
