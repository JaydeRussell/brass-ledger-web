"use client";
import { Suspense } from "react";

import EventView from "./eventView";

// useSearchParams (used by EventView to read the active tab and search
// filter from the URL) requires a Suspense boundary above it. The page is
// client-rendered, so the fallback only covers the moment before the
// search params are available.
export default function EventPage() {
  return (
    <Suspense fallback={null}>
      <EventView />
    </Suspense>
  );
}
