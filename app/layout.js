import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSite } from "@/lib/site";
import { SITE_URL } from "@/lib/constants";
import { WishlistProvider } from "@/context/WishlistContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingButtons from "@/components/layout/FloatingButtons";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata() {
  const site = await getSite();
  return {
    metadataBase: new URL(SITE_URL),
    title: `${site.businessName} | ${site.tagline}`,
    description: site.hero?.subtext || site.tagline,
  };
}

export default async function RootLayout({ children }) {
  const site = await getSite();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <WishlistProvider>
          <Header />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <Footer />
          <FloatingButtons site={site} />
        </WishlistProvider>
      </body>
    </html>
  );
}
