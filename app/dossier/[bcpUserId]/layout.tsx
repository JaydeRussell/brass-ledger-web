import type { Metadata } from "next";

export const metadata: Metadata = { title: "Player dossier" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
