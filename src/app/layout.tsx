import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interviewer AI",
  description:
    "AI-led voice interviews with structured evaluation and clear candidate feedback.",
  icons: {
    icon: "/icon",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-[100dvh] antialiased">{children}</body>
    </html>
  );
}
