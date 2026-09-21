
import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/300.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/manrope/300.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "./globals.css";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";

export const metadata: Metadata = {
  metadataBase: new URL("https://shopsophisticat.com"),

  title: {
    default: "Sophisticat | Beauty. Elegance. Sophistication.",
    template: "%s | Sophisticat",
  },

  description:
    "Sophisticat Beauty Studio — Beauty. Elegance. Sophistication.",

  keywords: [
    "Sophisticat",
    "Sophisticat Beauty Studio",
    "jewelry Nigeria",
    "beaded bracelets Lagos",
    "turbans Nigeria",
    "African prints",
    "Ankara designs",
  ],

  applicationName: "Sophisticat Beauty Studio",

  authors: [
    {
      name: "Sophisticat Beauty Studio",
    },
  ],

  creator: "Sophisticat Beauty Studio",
  publisher: "Sophisticat Beauty Studio",

  manifest: "/site.webmanifest",

  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],

    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },

  themeColor: "#B8860B",

  openGraph: {
    title: "Sophisticat | Beauty. Elegance. Sophistication.",
    description:
      "Quality jewelry, beaded bracelets, turbans, and African prints & designs. Discover Sophisticat.",
    url: "https://shopsophisticat.com",
    siteName: "Sophisticat Beauty Studio",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Sophisticat Beauty Studio",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Sophisticat | Beauty. Elegance. Sophistication.",
    description:
      "Quality jewelry, beaded bracelets, turbans, and African prints & designs. Discover Sophisticat.",
    images: ["/opengraph-image.png"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AnnouncementBar />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
