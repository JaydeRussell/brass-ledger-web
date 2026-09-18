import type { Metadata } from "next";
import { Geist, Geist_Mono, Rajdhani } from "next/font/google";
import "./globals.css";
import ClientErrorLogger from "./components/shared/clientErrorLogger";
import { NavProvider } from "./components/nav/navContext";
import NavDrawer from "./components/nav/navDrawer";
import BottomTabBar from "./components/nav/bottomTabBar";
import Footer from "./components/layout/footer";
import FeedbackWidget from "./components/feedback/feedbackWidget";
import { CommandPaletteProvider } from "./components/shared/commandPaletteContext";
import CommandPalette from "./components/shared/commandPalette";
import { ToastProvider } from "./components/shared/toastContext";
import ToastViewport from "./components/shared/toastViewport";
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

// Applies the visitor's accent-color theme before first paint — see
// lib/theme.ts for the same logic as real, testable TypeScript (this
// string is necessarily a standalone duplicate: it has to run
// synchronously in <head>, before any app code loads, to avoid a flash of
// the wrong accent on every page load, not just first visit). Doesn't
// validate the stored value against ACCENT_THEMES — an unrecognized
// `data-accent` simply matches no globals.css override block, so :root's
// brass values apply, same end result as validating. The app itself is
// dark-mode-only (no light/system option), so there's no theme class to
// resolve here — `dark` styling is just globals.css's `:root` values.
const ACCENT_INIT_SCRIPT = `(function(){try{var a=localStorage.getItem("accentTheme");if(a)document.documentElement.setAttribute("data-accent",a);}catch(e){}})();`;

// Same reasoning as ACCENT_INIT_SCRIPT above (and the same "standalone
// duplicate, not imported" constraint — lib/motionPrefs.ts has hooks in
// it, and this file is a Server Component, so importing anything from
// that module here breaks the build) for the "Reduce motion" preference.
const REDUCE_MOTION_INIT_SCRIPT = `(function(){try{if(localStorage.getItem("reduceMotion")==="1")document.documentElement.setAttribute("data-reduce-motion","true");}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Must run synchronously, before first paint, to avoid a flash of the wrong accent. */}
        <script dangerouslySetInnerHTML={{ __html: ACCENT_INIT_SCRIPT }} />
        {/* Same reasoning, for the "Reduce motion" preference — see lib/motionPrefs.ts. */}
        <script dangerouslySetInnerHTML={{ __html: REDUCE_MOTION_INIT_SCRIPT }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${rajdhani.variable} flex min-h-screen flex-col antialiased`}
      >
        <ClientErrorLogger />
        <ToastProvider>
          <ViewerItcProvider>
            <CommandPaletteProvider>
              <NavProvider>
                <NavDrawer />
                {children}
                <Footer />
                <FeedbackWidget />
              </NavProvider>
              <CommandPalette />
              <BottomTabBar />
            </CommandPaletteProvider>
          </ViewerItcProvider>
          <ToastViewport />
        </ToastProvider>
      </body>
    </html>
  );
}
