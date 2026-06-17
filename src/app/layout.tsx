import type { Metadata, Viewport } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Destiny AI Forge — AI Buildcrafter for Destiny 2",
  description:
    "The ultimate AI-powered Destiny 2 build optimizer. Natural language buildcrafting powered by Google Gemini with Web Worker armor permutation.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI Forge",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#e8b94a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('forge-theme');
                if (!theme) {
                  theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                }
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="font-[family-name:var(--font-inter)] antialiased min-h-screen">
        {/* Background layers */}
        <div className="fixed inset-0 -z-10 bg-[var(--forge-bg-primary)]" />
        <div className="fixed inset-0 -z-10 bg-grid-pattern opacity-50" />
        <div className="fixed inset-0 -z-10 bg-radial-fade" />
        <div className="fixed inset-0 -z-10 bg-noise pointer-events-none" />

        {children}
      </body>
    </html>
  );
}
