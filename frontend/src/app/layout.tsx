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
    "Sophisticat Beauty Studio — quality jewelry, beaded bracelets, turbans, and African prints & designs, curated for the modern woman.",
  keywords: [
    "jewelry Nigeria",
    "beaded bracelets Lagos",
    "turbans Nigeria",
    "African prints",
    "Ankara designs",
    "Sophisticat",
  ],
  openGraph: {
    title: "Sophisticat | Beauty. Elegance. Sophistication.",
    description:
      "Quality jewelry, beaded bracelets, turbans, and African prints & designs. Discover Sophisticat.",
    url: "shopSophisticatcom",
    siteName: "shopSophisticat",
    locale: "en_NG",
    type: "website",
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
