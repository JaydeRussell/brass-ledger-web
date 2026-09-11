import Link from "next/link";
import PageHeader from "../components/layout/pageHeader";
import PageMain from "../components/layout/pageMain";
import Card from "../components/ui/card";

/**
 * A public, unguarded page describing what Brass Ledger is — unlike
 * every other route in this app, it doesn't call
 * useRedirectToLoginIfSignedOut: there's nothing here that needs an
 * account or touches BCP, so it's also this app's first plain server
 * component page (no "use client", no hooks). Reachable from
 * NavDrawer's link list (app/components/nav/navDrawer.tsx) whether
 * signed in or out.
 */
export default function AboutPage() {
  return (
    <div className="flex-1 bg-surface-0">
      <PageHeader title="About Brass Ledger" />
      <PageMain>
        <Card className="p-4">
          <p className="text-sm text-text-secondary">
            Brass Ledger is a companion app for Warhammer 40,000 tournaments run on Best
            Coast Pairings (BCP): rosters, published pairings, and placings, pulled straight
            from BCP and shown in one place.
          </p>
        </Card>

        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-text-primary">What it doesn&apos;t do</h2>
          <p className="text-sm text-text-secondary">
            Everything on every page here is a decision BCP — organizers, captains, or the
            tournament system itself — has already made and published: a pairing, a
            placing, a roster. Brass Ledger never scores, ranks, or suggests a pairing or
            matchup itself, even as a plain heuristic with no AI involved. Some event packs
            (Challengers Cup&apos;s included) explicitly ban exactly that, and this app is
            built to stay well clear of it regardless of which event you&apos;re using it
            for.
          </p>
        </Card>

        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-text-primary">Data source</h2>
          <p className="text-sm text-text-secondary">
            All event data comes from Best Coast Pairings&apos; own tournament platform.
            Brass Ledger isn&apos;t affiliated with or endorsed by BCP — it&apos;s an
            independent companion that reads what BCP has already published.
          </p>
        </Card>

        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-text-primary">What&apos;s changed</h2>
          <p className="text-sm text-text-secondary">
            <Link href="/changelog" className="text-brass-600 hover:underline dark:text-brass-400">
              See the changelog
            </Link>{" "}
            for what&apos;s shipped so far.
          </p>
        </Card>
      </PageMain>
    </div>
  );
}
