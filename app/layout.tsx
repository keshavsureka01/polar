import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "POLAR-E Cinematic Command Center",
  description: "Interactive polar station globe, live Open-Meteo weather telemetry, alert automation, solar controls, and generator dispatch."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
