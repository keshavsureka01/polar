import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "POLAR-E Smart Energy Management",
  description: "Operator dashboard prototype for polar microgrid forecasting and dispatch optimization."
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
