import type { Metadata } from "next";
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
  keywords: [
    "Destiny 2",
    "build",
    "armor",
    "optimizer",
    "AI",
    "buildcrafter",
    "exotic",
    "subclass",
  ],
  authors: [{ name: "Destiny AI Forge" }],
  openGraph: {
    title: "Destiny AI Forge — AI Buildcrafter",
    description: "AI-powered Destiny 2 build optimization",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`}>
      <body className="font-[family-name:var(--font-inter)] antialiased min-h-screen">
        {/* Background layers */}
        <div className="fixed inset-0 -z-10 bg-[var(--forge-bg-primary)]" />
        <div className="fixed inset-0 -z-10 bg-grid-pattern opacity-50" />
        <div className="fixed inset-0 -z-10 bg-radial-fade" />

        {children}
      </body>
    </html>
  );
}
