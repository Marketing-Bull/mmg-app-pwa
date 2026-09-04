import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { InstallPrompt } from "@/components/shell/install-prompt";
import { ServiceWorkerRegistrar } from "@/components/shell/service-worker";
import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";
import { TabBar } from "@/components/shell/tab-bar";
import { ToastProvider } from "@/components/ui/toast";
import { site } from "@/lib/content";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

/*
 * Same pairing as the MMG marketing site, self-hosted as latin-subset variable
 * fonts (~104KB for both). No request to Google at runtime, so the shell still
 * renders in brand type when the app is opened offline from the home screen.
 */
const dmSans = localFont({
  src: "../fonts/dm-sans-latin-var.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-dm-sans",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
});

const fraunces = localFont({
  src: "../fonts/fraunces-latin-var.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-fraunces",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

/*
 * The link preview: an iPhone with a real screenshot of the home screen inside
 * it, so a shared link shows the app rather than a logo on a colour. Generated
 * by `npm run social-card` — see the script's header before editing it.
 */
const socialCard = {
  url: "/assets/brand/social-card.jpg",
  width: 1200,
  height: 630,
  alt: `The ${site.shortName} app open on an iPhone, showing the home screen and the next event.`,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://millersmarketingconnects.com"),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.shortName}`,
  },
  description: site.description,
  applicationName: site.shortName,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: site.shortName,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    images: [socialCard],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    images: [socialCard],
  },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff7e8" },
    { media: "(prefers-color-scheme: dark)", color: "#261d19" },
  ],
  width: "device-width",
  initialScale: 1,
  // Full-bleed under the iOS notch so the app shell reaches the screen edges.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">
        <StoreProvider>
          <ToastProvider>
            {/*
              Two shells in one. Phones get the app treatment — a narrow column
              with the AppBar on top and the TabBar fixed at the bottom. From lg
              up it becomes an ordinary website: full-bleed background, a real
              top nav, and a site footer.
            */}
            <SiteHeader />
            <div className="bg-cream mx-auto min-h-dvh max-w-2xl shadow-[0_0_60px_rgba(75,38,27,0.06)] lg:max-w-none lg:shadow-none">
              {children}
            </div>
            <SiteFooter />
            <TabBar />
            <InstallPrompt />
            <ServiceWorkerRegistrar />
          </ToastProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
