import Card from "../ui/card";
import { bcpRegisterUrl } from "../../lib/follow";

type JoinEventCardProps = {
  eventId: string;
  /** Signed in without a linked BCP profile, so we can't tell whether they're registered. */
  showLinkHint: boolean;
};

/** Sends someone who isn't on the roster to register on BCP. */
export default function JoinEventCard({ eventId, showLinkHint }: JoinEventCardProps) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 p-4 shadow-sm">
      <div className="min-w-0">
        <p className="font-semibold text-text-primary">Want to play?</p>
        <p className="mt-1 text-sm text-text-secondary">
          Registration happens on Best Coast Pairings.
          {showLinkHint && " Already registered? Link your BCP profile on the My Events page."}
        </p>
      </div>
      <a
        href={bcpRegisterUrl(eventId)}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-md bg-brass-500 px-3 py-2 text-sm font-medium text-[oklch(0.16_0.006_260)] hover:bg-brass-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500/60"
      >
        Join on BCP
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </Card>
  );
}
