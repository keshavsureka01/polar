import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "POLAR-E Industrial Energy Command Center",
  description: "High-reliability polar microgrid telemetry, dispatch optimization, and contingency simulation interface."
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
