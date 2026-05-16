import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grief.cc",
  description: "One link. Endless identity.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
