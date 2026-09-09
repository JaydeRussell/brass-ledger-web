"use client";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

/**
 * A plain client-side text filter over whatever's already loaded and
 * displayed (roster cards, the pairings board, standings rows). It never
 * triggers a request or changes what data is fetched — just narrows down
 * what's shown, by name.
 */
export default function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  return (
    <div className="relative">
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        fill="none"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
      >
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 14L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        className="w-full rounded-md border border-surface-border bg-surface-1 py-2 pl-9 pr-8 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brass-500 focus:outline-none focus:ring-2 focus:ring-brass-500/20"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-sm leading-none text-text-tertiary hover:bg-surface-2 hover:text-text-primary"
        >
          ×
        </button>
      )}
    </div>
  );
}
