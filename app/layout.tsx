import "./globals.css";
import { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shorts Agent",
  description: "Generate and publish YouTube Shorts with Gemini"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
