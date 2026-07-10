import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interviewer AI",
  description: "Voice-led interview workspace with auditable evaluation flows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
