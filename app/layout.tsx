import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://polartech-coral.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "POLAR-E",
  title: {
    default: "POLAR-E | Predictive Energy Intelligence",
    template: "%s | POLAR-E"
  },
  description: "Live global weather intelligence, polar microgrid forecasting, fuel-endurance analysis, alert automation, solar controls, and generator dispatch in one operator platform.",
  keywords: [
    "polar energy management",
    "Antarctic microgrid",
    "renewable energy forecasting",
    "fuel endurance",
    "digital twin",
    "Open-Meteo weather",
    "solar generator automation"
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "POLAR-E",
    title: "POLAR-E Predictive Energy Intelligence",
    description: "Live weather-driven energy dispatch and what-if simulation for polar research stations."
  },
  twitter: {
    card: "summary",
    title: "POLAR-E Predictive Energy Intelligence",
    description: "Live weather-driven energy dispatch and what-if simulation for polar research stations."
  },
  robots: { index: true, follow: true },
  category: "technology"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "POLAR-E",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description: "Predictive energy intelligence and decision support for polar research station microgrids."
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
        {children}
      </body>
    </html>
  );
}
