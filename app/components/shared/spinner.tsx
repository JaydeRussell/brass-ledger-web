type SpinnerProps = {
  // "sm" for inline use next to a line of text (badges, list rows);
  // "md" for a standalone loading state (a whole tab/panel/card).
  size?: "sm" | "md";
  className?: string;
};

const SIZE_CLASSES: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-6 w-6",
};

/**
 * A plain spinning-ring indicator — no external animation library, just
 * Tailwind's built-in `animate-spin` on an SVG ring with one lighter
 * quadrant. `aria-hidden` since it's always paired with adjacent text
 * (visible, like "Loading…", or screen-reader-only) that already
 * communicates the loading state; the spin itself is decorative.
 */
export default function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin text-text-tertiary ${SIZE_CLASSES[size]} ${className}`}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
