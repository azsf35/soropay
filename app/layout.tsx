import type { Metadata } from "next";
import { Sora, Manrope } from "next/font/google";
import "./globals.css";
import { NetworkProvider } from "@/components/network-provider";
import { WalletProvider } from "@/components/wallet-provider";

const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "SoroPay — Talk to your wallet",
  description: "The plain-language layer over Stellar payments and swaps.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the Stellar wallet-connect library injects its
    // own theme CSS variables directly onto <html> as an inline style as soon
    // as it's imported (before React finishes hydrating). That's expected and
    // harmless — this tells React not to flag the resulting attribute diff as
    // an error. Same fix used by next-themes and other libraries that manage
    // attributes on <html>/<body> outside React's tree.
    <html
      lang="en"
      className={`dark ${sora.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <div className="grain-overlay" />
        <NetworkProvider>
          <WalletProvider>{children}</WalletProvider>
        </NetworkProvider>
      </body>
    </html>
  );
}
