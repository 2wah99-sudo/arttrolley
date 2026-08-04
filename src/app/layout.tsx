import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial-luxury serif for headings — replaces the generic Tailwind
// font-serif fallback, which was only ever the browser's default serif.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "ARTTROLLEY — Handblock Sarees & Kurtis",
  description: "Hand block-printed sarees and kurtis, made in small batches by artisans across Rajasthan.",
  openGraph: {
    title: "ARTTROLLEY — Handblock Sarees & Kurtis",
    description: "Hand block-printed sarees and kurtis, made in small batches by artisans across Rajasthan.",
    type: "website",
    images: ["/brand/hero-portrait.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "ARTTROLLEY — Handblock Sarees & Kurtis",
    description: "Hand block-printed sarees and kurtis, made in small batches by artisans across Rajasthan.",
    images: ["/brand/hero-portrait.jpg"],
  },
};

export const viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
