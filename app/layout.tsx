import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://amanah.micbun.com"),
  title: "Amanah — AI triage copilot for campaign trust & safety",
  description:
    "Amanah screens every crowdfunding campaign with a two-stage AI pipeline, cites its evidence, and leaves every decision to a human reviewer.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://amanah.micbun.com",
    siteName: "Amanah",
    title: "Amanah — AI triage copilot for campaign trust & safety",
    description:
      "AI reads every crowdfunding campaign and cites its evidence. People make every decision.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amanah — AI triage copilot for campaign trust & safety",
    description:
      "AI reads every crowdfunding campaign and cites its evidence. People make every decision.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "font-sans",
        geistSans.variable,
        jetbrainsMono.variable,
        newsreader.variable
      )}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
