import type { Metadata } from "next";

export const metadata: Metadata = { title: "Player stats" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
