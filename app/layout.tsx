import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientErrorLogger from "./components/shared/clientErrorLogger";
import { NavProvider } from "./components/nav/navContext";
import NavDrawer from "./components/nav/navDrawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
 
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brass Ledger — Tournament Companion",
  description: "Tournament companion for Warhammer 40k: rosters, pairings, and placings pulled straight from Best Coast Pairings, in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClientErrorLogger />
        <NavProvider>
          <NavDrawer />
          {children}
        </NavProvider>
      </body>
    </html>
  );
}
