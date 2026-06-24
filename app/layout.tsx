import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

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

// Tracks the OS preference (media queries can't see the in-page class
// toggle) — correct for the system-default majority, harmless otherwise.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0c0a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://veracity.micbun.com"),
  title: "Veracity — AI triage copilot for campaign trust & safety",
  description:
    "Veracity screens every crowdfunding campaign with a two-stage AI pipeline, cites its evidence, and leaves every decision to a human reviewer.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://veracity.micbun.com",
    siteName: "Veracity",
    title: "Veracity — AI triage copilot for campaign trust & safety",
    description:
      "AI reads every crowdfunding campaign and cites its evidence. People make every decision.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Veracity — AI triage copilot for campaign trust & safety",
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
      suppressHydrationWarning
      className={cn(
        "font-sans",
        geistSans.variable,
        jetbrainsMono.variable,
        newsreader.variable
      )}
    >
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
