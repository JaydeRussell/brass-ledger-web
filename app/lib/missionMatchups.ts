import type { Disposition } from "./dispositions";
import { dispositionSlug } from "./dispositions";

export type DeploymentMapImage = { layout: "A" | "B" | "C"; src: string };

/** The 3 alternate deployment-map images for this disposition pairing —
 * canonicalized (slugs sorted) so either argument order resolves to the
 * same directory, matching scripts/crop-deployment-maps.sh's output. */
export function deploymentMapImages(a: Disposition, b: Disposition): DeploymentMapImage[] {
  const [x, y] = [dispositionSlug(a), dispositionSlug(b)].sort();
  const dir = `/deployment-maps/${x}-vs-${y}`;
  return [
    { layout: "A", src: `${dir}/a.webp` },
    { layout: "B", src: `${dir}/b.webp` },
    { layout: "C", src: `${dir}/c.webp` },
  ];
}
