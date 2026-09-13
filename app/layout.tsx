import type { Metadata } from "next";
import { Geist, Geist_Mono, Rajdhani } from "next/font/google";
import "./globals.css";
import ClientErrorLogger from "./components/shared/clientErrorLogger";
import { NavProvider } from "./components/nav/navContext";
import NavDrawer from "./components/nav/navDrawer";
import Footer from "./components/layout/footer";
import { ViewerItcProvider } from "./lib/viewerItc";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Header/display face only (page titles, section headings) — never used
// at body-copy sizes, see globals.css's `--font-display` token and the
// `font-display` utility it produces. Rajdhani's condensed, technical
// character nods at the app's industrial/grimdark-wargame identity
// without hurting body legibility, since body text stays on Geist Sans.
const rajdhani = Rajdhani({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Brass Ledger — Tournament Companion",
  description: "Tournament companion for Warhammer 40k: rosters, pairings, and placings pulled straight from Best Coast Pairings, in one place.",
};

// Resolves and applies the visitor's light/dark/system theme choice
// before first paint — see lib/theme.ts for the same logic as real,
// testable TypeScript (this string is necessarily a standalone
// duplicate: it has to run synchronously in <head>, before any app code
// loads, to avoid a flash of the wrong theme on every page load, not
// just first visit).
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||((t===null||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Must run synchronously, before first paint, to avoid a flash of the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${rajdhani.variable} flex min-h-screen flex-col antialiased`}
      >
        <ClientErrorLogger />
        <ViewerItcProvider>
          <NavProvider>
            <NavDrawer />
            {children}
            <Footer />
          </NavProvider>
        </ViewerItcProvider>
      </body>
    </html>
  );
}
