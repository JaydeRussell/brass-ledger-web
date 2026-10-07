import Button from "../ui/button";

type SpectatingBarProps = {
  followedName: string;
  /** Whether the page currently shows the followed player's view. */
  spectating: boolean;
  /** Set when the viewer is also playing, to switch between the two views. */
  onToggleView?: () => void;
  /** Set when the viewer can drop this event from their Spectating tab. */
  onStop?: () => void;
};

/** Says whose view the page shows, with the controls that change it. */
export default function SpectatingBar({ followedName, spectating, onToggleView, onStop }: SpectatingBarProps) {
  return (
    <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 pb-2 text-sm">
      <span className="min-w-0 flex-1 truncate text-text-secondary">
        {spectating ? (
          <>
            Spectating <span className="font-medium text-text-primary">{followedName}</span>
          </>
        ) : (
          <>You&apos;re also following {followedName}</>
        )}
      </span>
      {onToggleView && (
        <Button variant="secondary" size="sm" onClick={onToggleView}>
          {spectating ? "View as yourself" : `View as ${followedName}`}
        </Button>
      )}
      {onStop && (
        <Button variant="ghost" size="sm" onClick={onStop}>
          Stop following
        </Button>
      )}
    </div>
  );
}
