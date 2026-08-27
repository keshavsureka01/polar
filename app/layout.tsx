import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "POLAR-E Live Energy Command Center",
  description: "Live global weather telemetry, alert automation, solar controls, and generator dispatch for resilient microgrids."
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
