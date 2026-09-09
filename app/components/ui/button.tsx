import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Fixed dark text, not a text-* token — brass-500's lightness is
  // constant across light/dark mode (see globals.css), so the text
  // sitting on top of it needs to be too. Same reasoning themeToggle.tsx
  // already documents for its own active-state pill.
  primary: "bg-brass-500 text-[oklch(0.16_0.006_260)] hover:bg-brass-600",
  secondary: "border border-surface-border bg-surface-2 text-text-primary hover:bg-surface-1",
  ghost: "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
  danger: "bg-danger-500 text-white hover:bg-danger-600",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3 py-2 text-sm",
};

/** A plain variant-driven button — no Radix, a `<button>` is already
 * fully accessible on its own. Replaces the one-off duplicated button
 * classes scattered across every component today. */
export default function Button({ variant = "secondary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={clsx(
        "rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    />
  );
}
