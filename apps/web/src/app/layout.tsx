import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CashPilot",
  description: "See your cash before it moves.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
